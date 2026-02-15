"use client";

import { CapabilityDefinition } from "@/types/technology";
import { Tool, StepFitScore, Category } from "@/types/tool";
import { WorkflowStep } from "@/types/workflow";
import { VendorRecommendationCard } from "@/components/engagement/VendorRecommendationCard";
import { VendorHeatmap } from "@/components/vendors/VendorHeatmap";
import { getToolsForStepSorted, getToolById, getToolERPCompatibility } from "@/lib/data/tools";
import { useMemo } from "react";

interface CapabilityVendorSectionProps {
  capability: CapabilityDefinition;
  workflowSteps: WorkflowStep[];
  erpName: string;
  processName: string;
}

export function CapabilityVendorSection({
  capability,
  workflowSteps,
  erpName,
  processName,
}: CapabilityVendorSectionProps) {
  // Get steps that belong to this capability
  const capSteps = workflowSteps.filter((s) =>
    capability.stepIds.includes(s.id)
  );

  // Build unique tools across capability steps
  const { tools, recommendations } = useMemo(() => {
    const toolScores = new Map<
      string,
      { scores: StepFitScore[]; name: string; vendor: string; fitScore: number; bestStepTitle: string }
    >();

    for (const step of capSteps) {
      const sorted = getToolsForStepSorted(
        step.id,
        capability.category as Category,
        undefined,
        erpName
      );
      for (const tool of sorted.slice(0, 5)) {
        const stepScore =
          tool.fitScores?.find((f) => f.stepId === step.id)?.score ??
          tool.overallFitScore ??
          0;

        if (!toolScores.has(tool.id)) {
          toolScores.set(tool.id, {
            scores: [],
            name: tool.name,
            vendor: tool.vendor,
            fitScore: tool.overallFitScore ?? 0,
            bestStepTitle: step.title,
          });
        }

        const entry = toolScores.get(tool.id)!;
        if (!entry.scores.some((s) => s.stepId === step.id)) {
          entry.scores.push({
            stepId: step.id,
            score: stepScore,
            grade:
              stepScore >= 80
                ? "best-fit"
                : stepScore >= 50
                ? "good-fit"
                : "limited",
          });
        }
      }
    }

    // Build Tool objects for heatmap
    const heatmapTools: Tool[] = [];
    const recs: {
      toolId: string;
      toolName: string;
      vendor: string;
      fitScore: number;
      stepTitle: string;
      erpLevel?: string;
    }[] = [];
    const seen = new Set<string>();

    const toolScoreEntries = Array.from(toolScores.entries());
    for (const [toolId, data] of toolScoreEntries) {
      const fullTool = getToolById(toolId);
      if (fullTool) {
        heatmapTools.push({
          ...fullTool,
          fitScores: data.scores,
          overallFitScore: Math.round(
            data.scores.reduce((sum: number, s: { score: number }) => sum + s.score, 0) /
              data.scores.length
          ),
        });
      }

      if (!seen.has(toolId)) {
        seen.add(toolId);
        let erpLevel: string | undefined;
        if (erpName && fullTool) {
          const compat = getToolERPCompatibility(fullTool, erpName);
          if (compat) erpLevel = compat.level;
        }
        recs.push({
          toolId,
          toolName: data.name,
          vendor: data.vendor,
          fitScore: Math.round(
            data.scores.reduce((sum: number, s: { score: number }) => sum + s.score, 0) /
              data.scores.length
          ),
          stepTitle: data.bestStepTitle,
          erpLevel,
        });
      }
    }

    recs.sort((a, b) => b.fitScore - a.fitScore);

    return { tools: heatmapTools, recommendations: recs.slice(0, 6) };
  }, [capSteps, capability.category, erpName]); // eslint-disable-line

  if (recommendations.length === 0) {
    return (
      <div className="text-xs text-muted-foreground py-4 text-center">
        No vendor recommendations available for {capability.name}.
      </div>
    );
  }

  // Build workflow steps for heatmap (filtered to capability)
  const heatmapSteps: WorkflowStep[] = capSteps.map((s, idx) => ({
    ...s,
    stepNumber: idx + 1,
  }));

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-medium">{capability.name}</h4>
        <p className="text-xs text-muted-foreground">{capability.description}</p>
      </div>

      {/* Top vendor cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {recommendations.slice(0, 4).map((rec) => (
          <VendorRecommendationCard
            key={rec.toolId}
            toolId={rec.toolId}
            toolName={rec.toolName}
            vendor={rec.vendor}
            fitScore={rec.fitScore}
            stepTitle={rec.stepTitle}
            processName={processName}
            erpLevel={rec.erpLevel}
          />
        ))}
      </div>

      {/* Mini heatmap */}
      {tools.length > 0 && heatmapSteps.length > 0 && (
        <VendorHeatmap tools={tools} workflowSteps={heatmapSteps} />
      )}
    </div>
  );
}
