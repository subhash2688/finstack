"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { TechnologyAnalysis, CapabilityDefinition } from "@/types/technology";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId, WorkflowStep } from "@/types/workflow";
import { calculateProcessFindings } from "@/lib/calculators/savings-calculator";
import { getCapabilitiesForProcess } from "@/lib/data/technology-capabilities";
import { getToolsForStepSorted, getToolById, estimateToolCost } from "@/lib/data/tools";
import { Category } from "@/types/tool";
import { ProcessFindings, StepSavingsEstimate } from "@/types/findings";
import { CapabilityCard } from "@/components/engagement/CapabilityCard";
import { BuildVsBuyCard } from "@/components/engagement/BuildVsBuyCard";
import { CaseStudyCard } from "@/components/engagement/CaseStudyCard";
import { CapabilityVendorSection } from "@/components/engagement/CapabilityVendorSection";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  Loader2,
  Sparkles,
  Layers,
  Scale,
  Building2,
  BookOpen,
} from "lucide-react";
import Link from "next/link";

interface TechnologyPageClientProps {
  engagementId: string;
}

interface CapabilityData {
  capability: CapabilityDefinition;
  stepEstimates: StepSavingsEstimate[];
  workflowSteps: WorkflowStep[];
  processId: string;
  processName: string;
}

export function TechnologyPageClient({
  engagementId,
}: TechnologyPageClientProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProcessIdx, setSelectedProcessIdx] = useState(0);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
  }, [engagementId, router]);

  // Calculate findings for all processes
  const allFindings = useMemo(() => {
    if (!engagement) return [];
    return engagement.processAssessments.map((assessment) => {
      const workflow = getWorkflow(assessment.processId as WorkflowId);
      const steps = assessment.generatedWorkflow?.length
        ? assessment.generatedWorkflow
        : workflow?.steps ?? [];
      return {
        findings: calculateProcessFindings(
          assessment,
          steps,
          engagement.clientContext.companySize,
          engagement.customAssumptions,
          engagement.clientContext.erp
        ),
        steps,
        processId: assessment.processId,
        processName: assessment.processName,
        maturityRatings: assessment.maturityRatings || {},
      };
    });
  }, [engagement]);

  // Group step estimates into capabilities
  const capabilityDataByProcess = useMemo(() => {
    const result: Record<string, CapabilityData[]> = {};

    for (const { findings, steps, processId, processName, maturityRatings } of allFindings) {
      const capabilities = getCapabilitiesForProcess(processId);
      const capData: CapabilityData[] = capabilities.map((cap) => {
        const capStepEstimates = findings.stepEstimates.filter((e) =>
          cap.stepIds.includes(e.stepId)
        );
        const capWorkflowSteps = steps.filter((s) =>
          cap.stepIds.includes(s.id)
        );
        return {
          capability: cap,
          stepEstimates: capStepEstimates,
          workflowSteps: capWorkflowSteps,
          processId,
          processName,
        };
      });
      result[processId] = capData;
    }

    return result;
  }, [allFindings]);

  // Check if we have any assessment data
  const hasAssessment = allFindings.some(
    (f) => f.findings.assessedStepCount > 0
  );

  const erpName = engagement?.clientContext?.erp || "";

  // Get cached analysis
  const cachedAnalysis = engagement?.technologyAnalysis;

  const generateAnalysis = async () => {
    if (!engagement) return;
    setIsGenerating(true);

    try {
      // Build capabilities input for API
      const allCaps: {
        id: string;
        name: string;
        stepIds: string[];
        description: string;
        painPoints: string[];
        maturityLevels: Record<string, string>;
        estimatedSavings: number;
      }[] = [];

      const allTopTools: {
        capabilityId: string;
        toolName: string;
        vendor: string;
        fitScore: number;
        annualCost?: string;
      }[] = [];

      for (const data of Object.values(capabilityDataByProcess)) {
        for (const cd of data) {
          const painPoints = cd.workflowSteps.flatMap(
            (s) => s.painPoints
          );
          const maturityLevels: Record<string, string> = {};
          const processData = allFindings.find(
            (f) => f.processId === cd.processId
          );
          if (processData) {
            for (const stepId of cd.capability.stepIds) {
              if (processData.maturityRatings[stepId]) {
                maturityLevels[stepId] =
                  processData.maturityRatings[stepId];
              }
            }
          }

          allCaps.push({
            id: cd.capability.id,
            name: cd.capability.name,
            stepIds: cd.capability.stepIds,
            description: cd.capability.description,
            painPoints: painPoints.slice(0, 5),
            maturityLevels,
            estimatedSavings: cd.stepEstimates.reduce(
              (sum, e) => sum + e.savings.mid,
              0
            ),
          });

          // Get top tools for this capability
          for (const stepId of cd.capability.stepIds) {
            const tools = getToolsForStepSorted(
              stepId,
              cd.capability.category as Category,
              undefined,
              erpName
            );
            if (tools.length > 0) {
              const t = tools[0];
              if (
                !allTopTools.some(
                  (tt) =>
                    tt.toolName === t.name &&
                    tt.capabilityId === cd.capability.id
                )
              ) {
                const teamSize = processData?.findings.teamSize ?? 5;
                const cost = estimateToolCost(t, teamSize);
                allTopTools.push({
                  capabilityId: cd.capability.id,
                  toolName: t.name,
                  vendor: t.vendor,
                  fitScore: t.overallFitScore ?? 0,
                  annualCost: cost
                    ? `$${Math.round(
                        (cost.low + cost.high) / 2
                      ).toLocaleString()}`
                    : undefined,
                });
              }
            }
          }
        }
      }

      const response = await fetch("/api/technology-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientContext: {
            companyName: engagement.clientContext.companyName,
            companySize: engagement.clientContext.companySize,
            industry: engagement.clientContext.industry,
            subSector: engagement.clientContext.subSector,
            erp: erpName,
            revenue: engagement.clientContext.revenue,
            headcount: engagement.clientContext.headcount,
          },
          capabilities: allCaps,
          topTools: allTopTools,
          erpName,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `API returned ${response.status}`);
      }

      const analysis: TechnologyAnalysis = await response.json();
      const updated = {
        ...engagement,
        technologyAnalysis: analysis,
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
      window.dispatchEvent(new Event("engagement-updated"));
    } catch (error) {
      console.error("Technology analysis generation failed:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!engagement) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  const processIds = Object.keys(capabilityDataByProcess);
  if (processIds.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No processes assessed yet. Complete at least one process assessment
            to see technology capabilities.
          </p>
          <Link href={`/engagements/${engagementId}/assessment`}>
            <Button variant="outline">Go to Assessment</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const selectedProcess = allFindings[selectedProcessIdx];
  const selectedCapabilities =
    capabilityDataByProcess[selectedProcess?.processId] || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-1">
            Technology Solutions
          </h2>
          <p className="text-sm text-muted-foreground">
            Capabilities mapped to process gaps, with build vs. buy analysis
          </p>
        </div>

        {/* Process selector */}
        {allFindings.length > 1 && (
          <select
            value={selectedProcessIdx}
            onChange={(e) => setSelectedProcessIdx(Number(e.target.value))}
            className="text-sm border rounded-md px-2.5 py-1.5 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {allFindings.map((f, idx) => (
              <option key={f.processId} value={idx}>
                {f.processName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Assessment prompt */}
      {!hasAssessment && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-900">
              Assessment not complete
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Technology capabilities use static defaults. Complete the
              assessment for personalized analysis.
            </p>
          </div>
          <Link href={`/engagements/${engagementId}/assessment`}>
            <Button
              size="sm"
              variant="outline"
              className="ml-4 shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100"
            >
              Take Assessment
            </Button>
          </Link>
        </div>
      )}

      <Tabs defaultValue="capabilities">
        <TabsList>
          <TabsTrigger value="capabilities">
            <Layers className="h-3.5 w-3.5 mr-1.5" />
            Capabilities
          </TabsTrigger>
          <TabsTrigger value="build-vs-buy">
            <Scale className="h-3.5 w-3.5 mr-1.5" />
            Build vs Buy
          </TabsTrigger>
          <TabsTrigger value="vendor-landscape">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            Vendor Landscape
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Capabilities */}
        <TabsContent value="capabilities">
          <div className="space-y-3">
            {selectedCapabilities.map((cd) => (
              <CapabilityCard
                key={cd.capability.id}
                capability={cd.capability}
                stepEstimates={cd.stepEstimates}
                workflowSteps={cd.workflowSteps}
                maturityRatings={
                  allFindings.find((f) => f.processId === cd.processId)
                    ?.maturityRatings || {}
                }
              />
            ))}
          </div>
        </TabsContent>

        {/* Tab 2: Build vs Buy */}
        <TabsContent value="build-vs-buy">
          <div className="space-y-4">
            {/* Generate button */}
            {!cachedAnalysis && (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground mb-4">
                  Generate AI-powered build vs. buy analysis with real market
                  data and case studies.
                </p>
                <Button
                  onClick={generateAnalysis}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Analysis...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate AI Analysis
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Generating spinner */}
            {isGenerating && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-medium">Generating Technology Analysis</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Searching for market data and case studies...
                  </p>
                </div>
              </div>
            )}

            {/* Show cached analysis */}
            {cachedAnalysis && !isGenerating && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="text-[10px] bg-blue-50 text-blue-600 border-blue-200"
                    >
                      AI Analysis
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      Generated{" "}
                      {new Date(
                        cachedAnalysis.generatedAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateAnalysis}
                    disabled={isGenerating}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Regenerate
                  </Button>
                </div>

                {/* Build vs Buy cards */}
                {cachedAnalysis.buildVsBuy
                  .filter((bvb) =>
                    selectedCapabilities.some(
                      (cd) => cd.capability.id === bvb.capabilityId
                    )
                  )
                  .map((bvb) => {
                    const cd = selectedCapabilities.find(
                      (c) => c.capability.id === bvb.capabilityId
                    );
                    if (!cd) return null;
                    return (
                      <BuildVsBuyCard
                        key={bvb.capabilityId}
                        analysis={bvb}
                        capability={cd.capability}
                      />
                    );
                  })}

                {/* Market Context */}
                {cachedAnalysis.marketContext && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        Market Context
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-blue-50 text-blue-600 border-blue-200"
                        >
                          AI Analysis
                        </Badge>
                      </h3>
                      {cachedAnalysis.marketContext.industryAdoptionRate && (
                        <p className="text-xs">
                          <span className="font-medium">
                            Industry Adoption:
                          </span>{" "}
                          {cachedAnalysis.marketContext.industryAdoptionRate}
                        </p>
                      )}
                      {cachedAnalysis.marketContext.technologyTrends.length >
                        0 && (
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">
                            Technology Trends
                          </p>
                          <ul className="text-xs space-y-1">
                            {cachedAnalysis.marketContext.technologyTrends.map(
                              (trend, i) => (
                                <li key={i} className="flex items-start gap-1.5">
                                  <span className="text-blue-400 mt-0.5 shrink-0">
                                    •
                                  </span>
                                  {trend}
                                </li>
                              )
                            )}
                          </ul>
                        </div>
                      )}
                      {cachedAnalysis.marketContext.laborMarketInsight && (
                        <p className="text-xs">
                          <span className="font-medium">Labor Market:</span>{" "}
                          {cachedAnalysis.marketContext.laborMarketInsight}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Tab 3: Vendor Landscape */}
        <TabsContent value="vendor-landscape">
          <div className="space-y-6">
            {selectedCapabilities.map((cd) => (
              <CapabilityVendorSection
                key={cd.capability.id}
                capability={cd.capability}
                workflowSteps={cd.workflowSteps}
                erpName={erpName}
                processName={cd.processName}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Case Studies section — below tabs */}
      {cachedAnalysis?.caseStudies && cachedAnalysis.caseStudies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Case Studies</h3>
            <Badge
              variant="outline"
              className="text-[9px] bg-blue-50 text-blue-600 border-blue-200"
            >
              AI Analysis
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {cachedAnalysis.caseStudies
              .filter((cs) =>
                selectedCapabilities.some(
                  (cd) => cd.capability.id === cs.capabilityId
                )
              )
              .map((cs, i) => (
                <CaseStudyCard key={i} caseStudy={cs} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
