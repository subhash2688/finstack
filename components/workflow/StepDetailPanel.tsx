"use client";

import { useEffect, useRef } from "react";
import { WorkflowStep } from "@/types/workflow";
import { ToolMapping } from "@/types/engagement";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImpactMetricCard } from "./ImpactMetricCard";
import { StepToolSection } from "./StepToolSection";
import { StepInsightPanel } from "./StepInsightPanel";
import { Flame, Zap, CheckCircle } from "lucide-react";

interface StepDetailPanelProps {
  step: WorkflowStep;
  toolMappings?: ToolMapping[];
}

const intensityLabels: Record<string, string> = {
  fire: "High Leverage",
  strong: "Strong Leverage",
  moderate: "Moderate Leverage",
};

const intensityBadgeColors: Record<string, string> = {
  fire: "bg-orange-100 text-orange-800 border-orange-300",
  strong: "bg-emerald-100 text-emerald-800 border-emerald-300",
  moderate: "bg-blue-100 text-blue-800 border-blue-300",
};

const intensityIcons = {
  fire: Flame,
  strong: Zap,
  moderate: CheckCircle,
};

export function StepDetailPanel({ step, toolMappings }: StepDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step.id]);

  const intensity = step.insight?.aiImpactIntensity ?? "moderate";
  const Icon = intensityIcons[intensity];

  return (
    <div ref={panelRef} className="space-y-6 scroll-mt-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-light mb-1">
            {step.stepNumber}. {step.title}
          </h2>
          <p className="text-muted-foreground">{step.description}</p>
        </div>
        <Badge
          variant="outline"
          className={`${intensityBadgeColors[intensity]} text-sm ml-4 shrink-0`}
        >
          <Icon className="h-4 w-4 mr-1" />
          {intensityLabels[intensity]}
        </Badge>
      </div>

      {/* Step Insight Panel */}
      {step.insight && <StepInsightPanel insight={step.insight} />}

      {/* Before / After */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="p-4">
            <h4 className="font-semibold text-red-800 mb-2">Today (Manual)</h4>
            <p className="text-sm text-red-900/80">{step.beforeAfter.before}</p>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <h4 className="font-semibold text-green-800 mb-2">With AI</h4>
            <p className="text-sm text-green-900/80">{step.beforeAfter.after}</p>
          </CardContent>
        </Card>
      </div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <ImpactMetricCard value={step.impactMetrics.timeSavings} label="Time Savings" />
        <ImpactMetricCard value={step.impactMetrics.errorReduction} label="Error Reduction" />
        <ImpactMetricCard value={step.impactMetrics.costImpact} label="Cost Impact" />
        <ImpactMetricCard value={step.impactMetrics.throughput} label="Throughput" />
      </div>

      {/* Pain Points */}
      {step.painPoints.length > 0 && (
        <div>
          <h3 className="font-semibold mb-3">Common Pain Points</h3>
          <div className="flex flex-wrap gap-2">
            {step.painPoints.map((painPoint, idx) => (
              <Badge key={idx} variant="outline">
                {painPoint}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tools */}
      <div className="border-t pt-6">
        <StepToolSection
          stepId={step.id}
          toolContextSentence={step.toolContextSentence}
          toolMappings={toolMappings}
        />
      </div>
    </div>
  );
}
