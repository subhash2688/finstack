"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronDown, ChevronUp, Zap } from "lucide-react";
import { CapabilityDefinition } from "@/types/technology";
import { StepSavingsEstimate } from "@/types/findings";
import { MaturityLevel } from "@/types/workflow";
import { WorkflowStep } from "@/types/workflow";

interface CapabilityCardProps {
  capability: CapabilityDefinition;
  stepEstimates: StepSavingsEstimate[];
  workflowSteps: WorkflowStep[];
  maturityRatings: Record<string, MaturityLevel>;
}

const AI_IMPACT_COLORS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700 border-emerald-200",
  medium: "bg-amber-100 text-amber-700 border-amber-200",
  low: "bg-gray-100 text-gray-500 border-gray-200",
};

const MATURITY_LABELS: Record<MaturityLevel, { label: string; className: string }> = {
  manual: { label: "Manual", className: "bg-red-100 text-red-700" },
  "semi-automated": { label: "Semi-Auto", className: "bg-amber-100 text-amber-700" },
  automated: { label: "Automated", className: "bg-emerald-100 text-emerald-700" },
};

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

export function CapabilityCard({
  capability,
  stepEstimates,
  workflowSteps,
  maturityRatings,
}: CapabilityCardProps) {
  const [expanded, setExpanded] = useState(false);

  // Get workflow steps that belong to this capability
  const capSteps = workflowSteps.filter((s) =>
    capability.stepIds.includes(s.id)
  );

  // Aggregate pain points and AI opportunity from covered steps
  const painPoints = capSteps.flatMap((s) => s.painPoints).slice(0, 4);
  const aiOpportunityLevels = capSteps.map((s) => s.aiOpportunity.impact);
  const dominantAI = aiOpportunityLevels.includes("high")
    ? "high"
    : aiOpportunityLevels.includes("medium")
    ? "medium"
    : "low";

  // Aggregate savings from step estimates
  const totalSavingsMid = stepEstimates.reduce(
    (sum, e) => sum + e.savings.mid,
    0
  );

  // Check if any steps have been assessed
  const assessedSteps = capSteps.filter((s) => maturityRatings[s.id]);
  const hasAssessment = assessedSteps.length > 0;

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{capability.name}</h3>
              <Badge
                variant="outline"
                className={`text-[10px] ${AI_IMPACT_COLORS[dominantAI]}`}
              >
                <Zap className="h-2.5 w-2.5 mr-0.5" />
                {dominantAI === "high"
                  ? "High AI Impact"
                  : dominantAI === "medium"
                  ? "Medium AI Impact"
                  : "Low AI Impact"}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {capability.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {hasAssessment && totalSavingsMid > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Est. Savings</p>
                <p className="text-sm font-semibold text-emerald-600">
                  {formatCurrency(totalSavingsMid)}
                </p>
              </div>
            )}
            {expanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Step maturity indicators */}
        {hasAssessment && (
          <div className="flex gap-1.5 mt-2">
            {capSteps.map((step) => {
              const maturity = maturityRatings[step.id];
              if (!maturity) return null;
              const m = MATURITY_LABELS[maturity];
              return (
                <Badge
                  key={step.id}
                  variant="outline"
                  className={`text-[9px] ${m.className}`}
                >
                  {step.abbreviation}: {m.label}
                </Badge>
              );
            })}
          </div>
        )}
      </button>

      {expanded && (
        <CardContent className="pt-0 pb-4 px-4 space-y-4 border-t">
          {/* Pain Points */}
          {painPoints.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Common Pain Points
              </p>
              <ul className="text-xs space-y-1">
                {painPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5 shrink-0">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Before / After for each step */}
          {capSteps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Before → After
              </p>
              <div className="space-y-2">
                {capSteps.map((step) => (
                  <div
                    key={step.id}
                    className="grid grid-cols-2 gap-2 text-xs"
                  >
                    <div className="bg-red-50 rounded p-2">
                      <p className="font-medium text-red-700 mb-0.5">
                        {step.title} — Before
                      </p>
                      <p className="text-red-600">{step.beforeAfter.before}</p>
                    </div>
                    <div className="bg-emerald-50 rounded p-2">
                      <p className="font-medium text-emerald-700 mb-0.5">
                        After
                      </p>
                      <p className="text-emerald-600">
                        {step.beforeAfter.after}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Impact Metrics */}
          {capSteps.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Impact Metrics
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {capSteps.slice(0, 1).map((step) => (
                  <>
                    <div
                      key={`${step.id}-time`}
                      className="bg-blue-50 rounded p-2 text-center"
                    >
                      <p className="text-[10px] text-blue-600 font-medium">
                        Time Savings
                      </p>
                      <p className="text-sm font-bold text-blue-700">
                        {step.impactMetrics.timeSavings}
                      </p>
                    </div>
                    <div
                      key={`${step.id}-error`}
                      className="bg-purple-50 rounded p-2 text-center"
                    >
                      <p className="text-[10px] text-purple-600 font-medium">
                        Error Reduction
                      </p>
                      <p className="text-sm font-bold text-purple-700">
                        {step.impactMetrics.errorReduction}
                      </p>
                    </div>
                    <div
                      key={`${step.id}-cost`}
                      className="bg-emerald-50 rounded p-2 text-center"
                    >
                      <p className="text-[10px] text-emerald-600 font-medium">
                        Cost Impact
                      </p>
                      <p className="text-sm font-bold text-emerald-700">
                        {step.impactMetrics.costImpact}
                      </p>
                    </div>
                    <div
                      key={`${step.id}-throughput`}
                      className="bg-amber-50 rounded p-2 text-center"
                    >
                      <p className="text-[10px] text-amber-600 font-medium">
                        Throughput
                      </p>
                      <p className="text-sm font-bold text-amber-700">
                        {step.impactMetrics.throughput}
                      </p>
                    </div>
                  </>
                ))}
              </div>
            </div>
          )}

          {/* Step-level savings breakdown */}
          {stepEstimates.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">
                Savings Breakdown
              </p>
              <div className="space-y-1">
                {stepEstimates.map((est) => (
                  <div
                    key={est.stepId}
                    className="flex items-center justify-between text-xs py-1 border-b border-dashed last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span>{est.stepTitle}</span>
                      {est.topTool && (
                        <span className="text-muted-foreground">
                          → {est.topTool.name}
                        </span>
                      )}
                    </div>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(est.savings.low)}–
                      {formatCurrency(est.savings.high)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
