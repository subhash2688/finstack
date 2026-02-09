"use client";

import { WorkflowStep } from "@/types/workflow";

interface PipelineStripProps {
  steps: WorkflowStep[];
  selectedStepId: string | null;
  onStepSelect: (stepId: string) => void;
}

const impactDotColors: Record<string, string> = {
  high: "bg-green-500",
  medium: "bg-yellow-500",
  low: "bg-gray-400",
};

export function PipelineStrip({ steps, selectedStepId, onStepSelect }: PipelineStripProps) {
  return (
    <div className="pipeline-strip-container overflow-x-auto py-4">
      <div className="flex items-center justify-center min-w-max px-4 gap-0">
        {steps.map((step, index) => (
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
                `}
              >
                {step.stepNumber}
              </div>
              {/* Impact dot */}
              <div
                className={`w-2 h-2 rounded-full ${impactDotColors[step.aiOpportunity.impact]}`}
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
        ))}
      </div>
    </div>
  );
}
