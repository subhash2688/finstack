"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback } from "react";
import { Workflow } from "@/types/workflow";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SummaryStatsBar } from "./SummaryStatsBar";
import { PipelineStrip } from "./PipelineStrip";
import { StepDetailPanel } from "./StepDetailPanel";
import { MaturityAssessment } from "./MaturityAssessment";

interface APWorkflowPageClientProps {
  workflow: Workflow;
  toolCount: number;
}

export function APWorkflowPageClient({ workflow, toolCount }: APWorkflowPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedStepId = searchParams.get("step");
  const activeTab = searchParams.get("tab") || "explore";

  const selectedStep = selectedStepId
    ? workflow.steps.find((s) => s.id === selectedStepId) ?? null
    : null;

  // Compute average impact
  const impactValues = { high: 3, medium: 2, low: 1 };
  const avgImpactScore =
    workflow.steps.reduce((sum, s) => sum + impactValues[s.aiOpportunity.impact], 0) /
    workflow.steps.length;
  const avgImpact = avgImpactScore >= 2.5 ? "High" : avgImpactScore >= 1.5 ? "Medium" : "Low";

  const handleStepSelect = useCallback(
    (stepId: string) => {
      if (selectedStepId === stepId) {
        router.push("/ap?tab=explore", { scroll: false });
      } else {
        router.push(`/ap?tab=explore&step=${stepId}`, { scroll: false });
      }
    },
    [selectedStepId, router]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      router.push(`/ap?tab=${value}`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="space-y-6">
      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold mb-2">{workflow.name} Workflow</h2>
        <p className="text-muted-foreground">
          Explore the end-to-end AP process or assess your automation maturity
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

            <PipelineStrip
              steps={workflow.steps}
              selectedStepId={selectedStepId}
              onStepSelect={handleStepSelect}
            />

            {selectedStep && <StepDetailPanel step={selectedStep} />}
          </div>
        </TabsContent>

        <TabsContent value="assess" className="mt-6">
          <MaturityAssessment workflow={workflow} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
