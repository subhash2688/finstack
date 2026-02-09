"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { Workflow } from "@/types/workflow";
import { Engagement } from "@/types/engagement";
import { getEngagement } from "@/lib/storage/engagements";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SummaryStatsBar } from "./SummaryStatsBar";
import { SemanticSearchBar } from "./SemanticSearchBar";
import { PipelineStrip } from "./PipelineStrip";
import { StepDetailPanel } from "./StepDetailPanel";
import { ConsultantTakeaway } from "./ConsultantTakeaway";
import { MaturityAssessment } from "./MaturityAssessment";
import { Button } from "@/components/ui/button";
import { Edit, Briefcase } from "lucide-react";
import Link from "next/link";

interface APWorkflowPageClientProps {
  staticWorkflow: Workflow;
  toolCount: number;
  engagementId: string | null;
}

export function APWorkflowPageClient({
  staticWorkflow,
  toolCount,
  engagementId,
}: APWorkflowPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedStepId = searchParams.get("step");
  const activeTab = searchParams.get("tab") || "explore";

  // Load engagement if ID is provided (DUAL-MODE)
  const [engagement, setEngagement] = useState<Engagement | null>(null);

  useEffect(() => {
    if (engagementId) {
      const loaded = getEngagement(engagementId);
      setEngagement(loaded);
    } else {
      setEngagement(null);
    }
  }, [engagementId]);

  // Find the AP process assessment from the engagement
  const processAssessment = engagement?.processAssessments.find(
    (p) => p.processId === "ap"
  );

  // Use generated workflow if engagement loaded, otherwise use static
  const workflow: Workflow = processAssessment
    ? {
        id: "ap",
        name: processAssessment.processName,
        functionId: "finance",
        processId: "ap",
        steps: processAssessment.generatedWorkflow,
      }
    : staticWorkflow;

  const selectedStep = selectedStepId
    ? workflow.steps.find((s) => s.id === selectedStepId) ?? null
    : null;

  // Compute average impact
  const impactValues = { high: 3, medium: 2, low: 1 };
  const avgImpactScore =
    workflow.steps.reduce((sum, s) => sum + impactValues[s.aiOpportunity.impact], 0) /
    workflow.steps.length;
  const avgImpact = avgImpactScore >= 2.5 ? "High" : avgImpactScore >= 1.5 ? "Medium" : "Low";

  // Helper to build URLs with engagement param preserved
  const buildUrl = useCallback(
    (params: Record<string, string>) => {
      const urlParams = new URLSearchParams();
      if (engagementId) {
        urlParams.set("engagement", engagementId);
      }
      Object.entries(params).forEach(([key, value]) => {
        urlParams.set(key, value);
      });
      return `/ap?${urlParams.toString()}`;
    },
    [engagementId]
  );

  const handleStepSelect = useCallback(
    (stepId: string) => {
      if (selectedStepId === stepId) {
        router.push(buildUrl({ tab: "explore" }), { scroll: false });
      } else {
        router.push(buildUrl({ tab: "explore", step: stepId }), { scroll: false });
      }
    },
    [selectedStepId, router, buildUrl]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      router.push(buildUrl({ tab: value }), { scroll: false });
    },
    [router, buildUrl]
  );

  return (
    <div className="space-y-6">
      {/* Engagement Context Banner (only shown when in generated mode) */}
      {engagement && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium text-sm">Custom Engagement</h3>
                <p className="text-xs text-muted-foreground">
                  {engagement.clientContext.companyName} •{" "}
                  {engagement.clientContext.industry} •{" "}
                  {engagement.clientContext.companySize}
                </p>
              </div>
            </div>
            <Link href={`/engagements/${engagement.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit Workflow
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold mb-2">{workflow.name} Workflow</h2>
        <p className="text-muted-foreground">
          {engagement
            ? "Tailored workflow for your client engagement"
            : "Explore the end-to-end AP process or assess your automation maturity"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="explore">Process Explorer</TabsTrigger>
            <TabsTrigger value="assess">Maturity Assessment</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="explore" className="mt-6">
          <div className="space-y-6">
            <SummaryStatsBar
              stepCount={workflow.steps.length}
              toolCount={toolCount}
              avgImpact={avgImpact}
            />

            <SemanticSearchBar steps={workflow.steps} onStepSelect={handleStepSelect} />

            <PipelineStrip
              steps={workflow.steps}
              selectedStepId={selectedStepId}
              onStepSelect={handleStepSelect}
            />

            {selectedStep && (
              <StepDetailPanel
                step={selectedStep}
                toolMappings={processAssessment?.toolMappings}
              />
            )}

            <ConsultantTakeaway steps={workflow.steps} />
          </div>
        </TabsContent>

        <TabsContent value="assess" className="mt-6">
          <MaturityAssessment workflow={workflow} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
