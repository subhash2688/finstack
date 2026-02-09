"use client";

import { WorkflowStep, MaturityLevel } from "@/types/workflow";

interface MaturityPipelineStripProps {
  steps: WorkflowStep[];
  ratings: Record<string, MaturityLevel>;
  onCycleRating: (stepId: string) => void;
}

const maturityColors: Record<MaturityLevel, string> = {
  manual: "bg-red-500 border-red-500 text-white",
  "semi-automated": "bg-yellow-400 border-yellow-400 text-yellow-950",
  automated: "bg-emerald-500 border-emerald-500 text-white",
};

const maturityRingColors: Record<MaturityLevel, string> = {
  manual: "ring-red-300",
  "semi-automated": "ring-yellow-300",
  automated: "ring-emerald-300",
};

const unratedStyle = "bg-gray-100 border-gray-300 text-gray-400";

const maturityLabels: Record<MaturityLevel, string> = {
  manual: "Manual",
  "semi-automated": "Semi-Auto",
  automated: "Automated",
};

export function MaturityPipelineStrip({
  steps,
  ratings,
  onCycleRating,
}: MaturityPipelineStripProps) {
  return (
    <div className="pipeline-strip-container overflow-x-auto py-4">
      <div className="flex items-center justify-center min-w-max px-4 gap-0">
        {steps.map((step, index) => {
          const rating = ratings[step.id];
          const isRated = !!rating;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => onCycleRating(step.id)}
                className="relative flex flex-col items-center gap-1 group cursor-pointer transition-all duration-200"
                title={`${step.title} — Click to rate`}
              >
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    text-sm font-bold border-2 transition-all duration-200
                    ${isRated ? `${maturityColors[rating]} ring-2 ${maturityRingColors[rating]} ring-offset-1` : `${unratedStyle} group-hover:border-emerald-400 group-hover:text-emerald-600`}
                  `}
                >
                  {step.stepNumber}
                </div>
                {/* Status label */}
                <span
                  className={`
                    text-[9px] leading-tight text-center w-16 font-semibold
                    ${isRated ? (rating === "manual" ? "text-red-600" : rating === "semi-automated" ? "text-yellow-600" : "text-emerald-600") : "text-gray-400"}
                  `}
                >
                  {isRated ? maturityLabels[rating] : "Click to rate"}
                </span>
                {/* Step name */}
                <span className="text-[10px] leading-tight text-center w-16 text-muted-foreground">
                  {step.abbreviation}
                </span>
              </button>

              {/* Connector arrow */}
              {index < steps.length - 1 && (
                <div className="flex items-center mx-1 -mt-8">
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
