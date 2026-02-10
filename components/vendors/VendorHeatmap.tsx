"use client";

import { useMemo } from "react";
import { Tool, StepFitScore } from "@/types/tool";
import { WorkflowStep } from "@/types/workflow";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";

function getCellColor(score: number): string {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 50) return "bg-amber-400";
  return "bg-gray-300";
}

function getCellTextColor(score: number): string {
  if (score >= 80) return "text-white";
  if (score >= 50) return "text-amber-950";
  return "text-gray-600";
}

const aiMaturityBadge: Record<string, string> = {
  "ai-native": "bg-emerald-100 text-emerald-700",
  "ai-enabled": "bg-teal-100 text-teal-700",
  "traditional": "bg-gray-100 text-gray-600",
};

interface VendorHeatmapProps {
  tools: Tool[];
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  workflowSteps?: WorkflowStep[];
}

export function VendorHeatmap({ tools, selectedIds = [], onToggleSelect, workflowSteps }: VendorHeatmapProps) {
  const router = useRouter();

  // Derive step columns from workflow steps if provided, otherwise from tool fitScores
  const steps = useMemo(() => {
    if (workflowSteps && workflowSteps.length > 0) {
      return workflowSteps.map((s) => ({ id: s.id, abbr: s.abbreviation }));
    }
    // Fallback: derive unique steps from tools' fitScores, ordered by first appearance
    const seen = new Set<string>();
    const derived: { id: string; abbr: string }[] = [];
    for (const tool of tools) {
      for (const fs of tool.fitScores ?? []) {
        if (!seen.has(fs.stepId)) {
          seen.add(fs.stepId);
          derived.push({ id: fs.stepId, abbr: fs.stepId.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ") });
        }
      }
    }
    return derived;
  }, [workflowSteps, tools]);

  // Sort tools by overallFitScore descending
  const sorted = [...tools].sort(
    (a, b) => (b.overallFitScore ?? 0) - (a.overallFitScore ?? 0)
  );

  const fitMap = (tool: Tool): Map<string, StepFitScore> => {
    const m = new Map<string, StepFitScore>();
    tool.fitScores?.forEach((f) => m.set(f.stepId, f));
    return m;
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="overflow-x-auto">
        <div className="heatmap-grid" style={{ minWidth: "900px" }}>
          {/* Header row */}
          <div className="heatmap-header-row">
            <div className="heatmap-vendor-header">Vendor</div>
            <div className="heatmap-score-header">Score</div>
            {steps.map((step) => (
              <div key={step.id} className="heatmap-step-header">
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-tight">
                  {step.abbr}
                </span>
              </div>
            ))}
            {onToggleSelect && <div className="heatmap-action-header" />}
          </div>

          {/* Tool rows */}
          {sorted.map((tool) => {
            const scores = fitMap(tool);
            const isSelected = selectedIds.includes(tool.id);
            return (
              <div
                key={tool.id}
                className={cn(
                  "heatmap-row",
                  isSelected && "ring-2 ring-primary ring-inset bg-emerald-50/50"
                )}
              >
                {/* Vendor name */}
                <div
                  className="heatmap-vendor-cell cursor-pointer hover:text-primary transition-colors"
                  onClick={() => router.push(`/vendors/${tool.id}`)}
                >
                  <span className="text-sm font-medium truncate">{tool.name}</span>
                  <span className={cn("text-[9px] font-semibold px-1.5 py-0.5 rounded-full uppercase", aiMaturityBadge[tool.aiMaturity])}>
                    {tool.aiMaturity === "ai-native" ? "Native" : tool.aiMaturity === "ai-enabled" ? "AI" : "Trad"}
                  </span>
                </div>

                {/* Overall score */}
                <div className="heatmap-score-cell">
                  <span className="text-sm font-bold tabular-nums">{tool.overallFitScore ?? "—"}</span>
                </div>

                {/* Step cells */}
                {steps.map((step) => {
                  const fs = scores.get(step.id);
                  if (!fs) {
                    return (
                      <div key={step.id} className="heatmap-cell">
                        <div className="heatmap-cell-inner bg-gray-50 text-gray-300 text-[10px]">—</div>
                      </div>
                    );
                  }
                  const verdict = tool.stepVerdicts?.find((v) => v.stepId === step.id);
                  return (
                    <Tooltip key={step.id}>
                      <TooltipTrigger asChild>
                        <div
                          className="heatmap-cell cursor-pointer"
                          onClick={() =>
                            router.push(`/vendors/${tool.id}#capabilities`)
                          }
                        >
                          <div className={cn("heatmap-cell-inner", getCellColor(fs.score), getCellTextColor(fs.score))}>
                            {fs.score}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="font-semibold text-sm mb-1">
                          {tool.name} — {step.abbr}: {fs.score}/100
                        </p>
                        {verdict && (
                          <p className="text-xs text-muted-foreground">{verdict.verdict}</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}

                {/* Compare checkbox */}
                {onToggleSelect && (
                  <div className="heatmap-action-cell">
                    <button
                      onClick={() => onToggleSelect(tool.id)}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors text-xs",
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-gray-300 hover:border-primary"
                      )}
                    >
                      {isSelected && "✓"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
