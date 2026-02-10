"use client";

import { WorkflowStep, MaturityLevel } from "@/types/workflow";

interface PipelineStripProps {
  steps: WorkflowStep[];
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
  ratings?: Record<string, MaturityLevel>;
}

const impactDotColors: Record<string, string> = {
  high: "bg-green-500",
  medium: "bg-yellow-500",
  low: "bg-gray-400",
};

const maturityRingColors: Record<MaturityLevel, string> = {
  manual: "ring-red-500",
  "semi-automated": "ring-yellow-500",
  automated: "ring-emerald-500",
};

const maturityDotColors: Record<MaturityLevel, string> = {
  manual: "bg-red-500",
  "semi-automated": "bg-yellow-500",
  automated: "bg-emerald-500",
};

export function PipelineStrip({ steps, selectedStepId, onStepSelect, ratings }: PipelineStripProps) {
  return (
    <div className="pipeline-strip-container overflow-x-auto py-4">
      <div className="flex items-center justify-center min-w-max px-4 gap-0">
        {steps.map((step, index) => {
          const maturity = ratings?.[step.id];
          return (
            <div key={step.id} className="flex items-center">
              {/* Node */}
              <button
                onClick={() => onStepSelect(step.id)}
                className={`
                  relative flex flex-col items-center gap-1 group cursor-pointer
                  transition-all duration-200
                `}
                title={step.title}
              >
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    text-sm font-bold border-2 transition-all duration-200
                    ${
                      selectedStepId === step.id
                        ? "bg-primary text-primary-foreground border-primary scale-110 shadow-lg"
                        : "bg-background text-foreground border-border group-hover:border-primary group-hover:text-primary"
                    }
                    ${maturity && selectedStepId !== step.id ? `ring-2 ring-offset-1 ${maturityRingColors[maturity]}` : ""}
                  `}
                >
                  {step.stepNumber}
                </div>
                {/* Maturity dot (replaces impact dot when rated) */}
                <div
                  className={`w-2 h-2 rounded-full ${
                    maturity ? maturityDotColors[maturity] : impactDotColors[step.aiOpportunity.impact]
                  }`}
                />
                {/* Label */}
                <span
                  className={`
                    text-[10px] leading-tight text-center w-16
                    ${selectedStepId === step.id ? "font-semibold text-primary" : "text-muted-foreground"}
                  `}
                >
                  {step.abbreviation}
                </span>
              </button>

              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="flex items-center mx-1 -mt-5">
                  <div className="h-0.5 w-6 bg-border" />
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-border" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
