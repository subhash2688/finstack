"use client";

import { useEffect, useRef } from "react";
import { WorkflowStep, MaturityLevel } from "@/types/workflow";
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
  maturityRating?: MaturityLevel;
  onRate?: (stepId: string, level: MaturityLevel) => void;
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

const maturityOptions: {
  value: MaturityLevel;
  label: string;
  idle: string;
  selected: string;
}[] = [
  {
    value: "manual",
    label: "Manual",
    idle: "border-gray-200 text-gray-500 hover:border-red-300 hover:bg-red-50 hover:text-red-700",
    selected: "border-red-500 bg-red-500 text-white shadow-sm",
  },
  {
    value: "semi-automated",
    label: "Semi-Auto",
    idle: "border-gray-200 text-gray-500 hover:border-yellow-300 hover:bg-yellow-50 hover:text-yellow-700",
    selected: "border-yellow-500 bg-yellow-500 text-white shadow-sm",
  },
  {
    value: "automated",
    label: "Automated",
    idle: "border-gray-200 text-gray-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
    selected: "border-emerald-500 bg-emerald-500 text-white shadow-sm",
  },
];

export function StepDetailPanel({ step, toolMappings, maturityRating, onRate }: StepDetailPanelProps) {
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
        <div className="flex items-center gap-3 ml-4 shrink-0">
          {onRate && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground mr-1">Current State:</span>
              {maturityOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => onRate(step.id, option.value)}
                  className={`
                    px-3 py-1.5 rounded-md text-xs font-medium border-2 transition-all duration-150 cursor-pointer
                    ${
                      maturityRating === option.value
                        ? option.selected
                        : option.idle
                    }
                  `}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
          <Badge
            variant="outline"
            className={`${intensityBadgeColors[intensity]} text-sm`}
          >
            <Icon className="h-4 w-4 mr-1" />
            {intensityLabels[intensity]}
          </Badge>
        </div>
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
