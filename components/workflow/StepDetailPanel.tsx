"use client";

import { useEffect, useRef } from "react";
import { WorkflowStep } from "@/types/workflow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImpactMetricCard } from "./ImpactMetricCard";
import { StepToolSection } from "./StepToolSection";
import { Sparkles } from "lucide-react";

interface StepDetailPanelProps {
  step: WorkflowStep;
}

const impactColors: Record<string, string> = {
  high: "bg-green-100 text-green-800 border-green-300",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
  low: "bg-gray-100 text-gray-800 border-gray-300",
};

export function StepDetailPanel({ step }: StepDetailPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [step.id]);

  return (
    <div ref={panelRef} className="space-y-6 scroll-mt-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-1">
            {step.stepNumber}. {step.title}
          </h2>
          <p className="text-muted-foreground">{step.description}</p>
        </div>
        <Badge
          variant="outline"
          className={`${impactColors[step.aiOpportunity.impact]} text-sm ml-4 shrink-0`}
        >
          <Sparkles className="h-4 w-4 mr-1" />
          {step.aiOpportunity.impact} AI impact
        </Badge>
      </div>

      {/* AI Opportunity */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
        <h3 className="font-semibold text-emerald-900 mb-2">AI Opportunity</h3>
        <p className="text-emerald-800 text-sm">{step.aiOpportunity.description}</p>
      </div>

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
        <StepToolSection stepId={step.id} />
      </div>
    </div>
  );
}
