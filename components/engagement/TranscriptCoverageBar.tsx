"use client";

import { StepEvidence } from "@/types/transcript";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface TranscriptCoverageBarProps {
  stepEvidence: StepEvidence[];
}

export function TranscriptCoverageBar({ stepEvidence }: TranscriptCoverageBarProps) {
  const covered = stepEvidence.filter((s) => s.covered).length;
  const total = stepEvidence.length;

  if (total === 0) return null;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 flex-1">
          {stepEvidence.map((step) => (
            <Tooltip key={step.stepId}>
              <TooltipTrigger asChild>
                <div
                  className={`h-2 flex-1 rounded-sm transition-colors ${
                    step.covered
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                <p className="font-medium">{step.stepTitle}</p>
                <p className="text-muted-foreground">
                  {step.covered ? "Evidence found" : "No evidence"}
                </p>
              </TooltipContent>
            </Tooltip>
          ))}
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {covered}/{total} steps
        </span>
      </div>
    </TooltipProvider>
  );
}
