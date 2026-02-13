"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { getEngagement } from "@/lib/storage/engagements";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import { calculateProcessFindings } from "@/lib/calculators/savings-calculator";
import { VendorRecommendationCard } from "@/components/engagement/VendorRecommendationCard";
import { VendorHeatmap } from "@/components/vendors/VendorHeatmap";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getToolById, getToolERPCompatibility } from "@/lib/data/tools";
import { Tool, StepFitScore } from "@/types/tool";
import { WorkflowStep } from "@/types/workflow";

interface ToolRecommendationsPageClientProps {
  engagementId: string;
}

export function ToolRecommendationsPageClient({ engagementId }: ToolRecommendationsPageClientProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
  }, [engagementId, router]);

  const allFindings = useMemo(() => {
    if (!engagement) return [];
    return engagement.processAssessments.map((assessment) => {
      const workflow = getWorkflow(assessment.processId as WorkflowId);
      const steps = assessment.generatedWorkflow?.length
        ? assessment.generatedWorkflow
        : workflow?.steps ?? [];
      return calculateProcessFindings(
        assessment,
        steps,
        engagement.clientContext.companySize
      );
    });
  }, [engagement]);

  const erpName = engagement?.clientContext?.erp || "";

  const groupedRecommendations = useMemo(() => {
    const groups: {
      processName: string;
      recs: {
        toolId: string;
        toolName: string;
        vendor: string;
        fitScore: number;
        stepTitle: string;
        erpLevel?: string;
      }[];
    }[] = [];

    for (const findings of allFindings) {
      const seen = new Set<string>();
      const recs: typeof groups[0]["recs"] = [];
      for (const est of findings.stepEstimates) {
        if (est.topTool?.id && !seen.has(est.topTool.id)) {
          seen.add(est.topTool.id);
          // Check ERP compatibility
          let erpLevel: string | undefined;
          if (erpName) {
            const fullTool = getToolById(est.topTool.id);
            if (fullTool) {
              const compat = getToolERPCompatibility(fullTool, erpName);
              if (compat) erpLevel = compat.level;
            }
          }
          recs.push({
            toolId: est.topTool.id,
            toolName: est.topTool.name,
            vendor: est.topTool.vendor,
            fitScore: est.topTool.fitScore,
            stepTitle: est.stepTitle,
            erpLevel,
          });
        }
      }
      if (recs.length > 0) {
        recs.sort((a, b) => b.fitScore - a.fitScore);
        groups.push({ processName: findings.processName, recs });
      }
    }
    return groups;
  }, [allFindings, erpName]);

  // Build heatmap data per process for dropdown filtering
  const heatmapByProcess = useMemo(() => {
    const result: {
      processId: string;
      processName: string;
      tools: Tool[];
      workflowSteps: WorkflowStep[];
    }[] = [];

    for (const findings of allFindings) {
      const toolScores = new Map<string, { scores: StepFitScore[]; toolRef: { name: string; vendor: string; fitScore: number } }>();
      const steps: { id: string; abbr: string }[] = [];

      for (const est of findings.stepEstimates) {
        // Create abbreviated step name
        const words = est.stepTitle.split(" ");
        const abbr = words.length <= 3
          ? est.stepTitle
          : words.slice(0, 3).map((w) => w[0]?.toUpperCase() + w.slice(1)).join(" ");
        steps.push({ id: est.stepId, abbr });

        if (!est.topTool?.id) continue;

        const toolId = est.topTool.id;
        if (!toolScores.has(toolId)) {
          toolScores.set(toolId, {
            scores: [],
            toolRef: { name: est.topTool.name, vendor: est.topTool.vendor, fitScore: est.topTool.fitScore },
          });
        }

        // For heatmap cells, use the actual per-step score from the tool data (not overallFitScore)
        const fullTool = getToolById(toolId);
        const stepScore = fullTool?.fitScores?.find((f) => f.stepId === est.stepId)?.score ?? est.topTool.fitScore;

        const entry = toolScores.get(toolId)!;
        if (!entry.scores.some((s) => s.stepId === est.stepId)) {
          entry.scores.push({
            stepId: est.stepId,
            score: stepScore,
            grade: stepScore >= 80 ? "best-fit" : stepScore >= 50 ? "good-fit" : "limited",
          });
        }
      }

      // Build Tool objects
      const tools: Tool[] = [];
      const toolScoreEntries = Array.from(toolScores.entries());
      for (const [toolId, data] of toolScoreEntries) {
        const fullTool = getToolById(toolId);
        if (fullTool) {
          tools.push({
            ...fullTool,
            fitScores: data.scores,
            overallFitScore: Math.round(data.scores.reduce((sum, s) => sum + s.score, 0) / data.scores.length),
          });
        } else {
          tools.push({
            id: toolId,
            name: data.toolRef.name,
            vendor: data.toolRef.vendor,
            category: "ap",
            aiMaturity: "traditional",
            companySizes: [],
            industries: [],
            painPoints: [],
            integrations: [],
            pricing: { model: "unknown" },
            keyFeatures: [],
            workflowSteps: [],
            tagline: "",
            description: "",
            fitScores: data.scores,
            overallFitScore: Math.round(data.scores.reduce((sum, s) => sum + s.score, 0) / data.scores.length),
          });
        }
      }

      if (tools.length > 0) {
        const workflowSteps: WorkflowStep[] = steps.map((s, idx) => ({
          id: s.id,
          title: s.abbr,
          abbreviation: s.abbr,
          description: "",
          stepNumber: idx + 1,
          aiOpportunity: { impact: "medium" as const, description: "" },
          painPoints: [],
          beforeAfter: { before: "", after: "" },
          impactMetrics: { timeSavings: "", errorReduction: "", costImpact: "", throughput: "" },
          insight: { whyItMatters: "", typicalPain: "", aiImpactVerdict: "", aiImpactIntensity: "moderate" as const },
          toolContextSentence: "",
        }));

        result.push({
          processId: findings.processId,
          processName: findings.processName,
          tools,
          workflowSteps,
        });
      }
    }

    return result;
  }, [allFindings]);

  const [selectedProcessIdx, setSelectedProcessIdx] = useState(0);

  if (!engagement) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  if (groupedRecommendations.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No tool recommendations yet. Complete at least one process assessment.
          </p>
          <Link href={`/engagements/${engagementId}/assessment`}>
            <Button variant="outline">Go to Assessment</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-1">
          Tool Recommendations
        </h2>
        <p className="text-sm text-muted-foreground">
          Based on maturity gaps and process fit scores
        </p>
      </div>

      <Tabs defaultValue="recommendations">
        <TabsList>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations">
          <div className="space-y-6">
            {groupedRecommendations.map((group) => (
              <div key={group.processName} className="space-y-2">
                <h3 className="text-sm font-medium">{group.processName}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {group.recs.map((rec) => (
                    <VendorRecommendationCard
                      key={rec.toolId}
                      toolId={rec.toolId}
                      toolName={rec.toolName}
                      vendor={rec.vendor}
                      fitScore={rec.fitScore}
                      stepTitle={rec.stepTitle}
                      processName={group.processName}
                      erpLevel={rec.erpLevel}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="heatmap">
          {heatmapByProcess.length > 0 ? (
            <div className="space-y-4">
              {/* Process dropdown */}
              <div className="flex items-center gap-2">
                <label htmlFor="process-select" className="text-xs font-medium text-muted-foreground">
                  Process
                </label>
                <select
                  id="process-select"
                  value={selectedProcessIdx}
                  onChange={(e) => setSelectedProcessIdx(Number(e.target.value))}
                  className="text-sm border rounded-md px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {heatmapByProcess.map((p, idx) => (
                    <option key={p.processId} value={idx}>
                      {p.processName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Heatmap for selected process */}
              {heatmapByProcess[selectedProcessIdx] && (
                <VendorHeatmap
                  tools={heatmapByProcess[selectedProcessIdx].tools}
                  workflowSteps={heatmapByProcess[selectedProcessIdx].workflowSteps}
                />
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No tool data available for heatmap view.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
