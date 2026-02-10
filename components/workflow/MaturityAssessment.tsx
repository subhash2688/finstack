/**
 * @deprecated Maturity assessment is now inline in the Process Explorer tab.
 * Ratings are handled via StepDetailPanel + PipelineStrip in APWorkflowPageClient.
 * This component is kept for reference but no longer imported.
 */
"use client";

import { useState, useCallback } from "react";
import { Workflow, MaturityLevel } from "@/types/workflow";
import { MaturityPipelineStrip } from "./MaturityPipelineStrip";
import { MaturityScorecard } from "./MaturityScorecard";
import { Card, CardContent } from "@/components/ui/card";

interface MaturityAssessmentProps {
  workflow: Workflow;
}

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

const maturityCycle: MaturityLevel[] = ["manual", "semi-automated", "automated"];

export function MaturityAssessment({ workflow }: MaturityAssessmentProps) {
  const [ratings, setRatings] = useState<Record<string, MaturityLevel>>({});

  const ratedCount = Object.keys(ratings).length;
  const totalSteps = workflow.steps.length;

  const handleRate = useCallback((stepId: string, level: MaturityLevel) => {
    setRatings((prev) => ({ ...prev, [stepId]: level }));
  }, []);

  const handleCycleRating = useCallback((stepId: string) => {
    setRatings((prev) => {
      const current = prev[stepId];
      if (!current) {
        return { ...prev, [stepId]: "manual" };
      }
      const nextIndex = (maturityCycle.indexOf(current) + 1) % maturityCycle.length;
      return { ...prev, [stepId]: maturityCycle[nextIndex] };
    });
  }, []);

  const handleReset = useCallback(() => {
    setRatings({});
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-light text-foreground mb-2">
          AP Maturity Assessment
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Rate each step in your AP process below. Select your current
          automation level for each step, then see your personalized scorecard.
        </p>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{ratedCount}</span>
          <span>of</span>
          <span className="font-medium text-foreground">{totalSteps}</span>
          <span>steps rated</span>
        </div>
        {/* Progress bar */}
        <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${(ratedCount / totalSteps) * 100}%` }}
          />
        </div>
        {ratedCount > 0 && (
          <button
            onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Reset
          </button>
        )}
      </div>

      {/* Visual pipeline summary */}
      <MaturityPipelineStrip
        steps={workflow.steps}
        ratings={ratings}
        onCycleRating={handleCycleRating}
      />

      {/* Rating Cards — primary interaction */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-light text-foreground">
            Rate Each Step
          </h3>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
              Manual
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
              Semi-Auto
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Automated
            </span>
          </div>
        </div>

        {workflow.steps.map((step) => {
          const currentRating = ratings[step.id];
          return (
            <Card
              key={step.id}
              className={`transition-all duration-200 ${
                currentRating ? "border-emerald-200/60" : ""
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  {/* Step info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        currentRating === "manual"
                          ? "bg-red-100 text-red-700"
                          : currentRating === "semi-automated"
                          ? "bg-yellow-100 text-yellow-700"
                          : currentRating === "automated"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {step.stepNumber}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{step.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {step.aiOpportunity.impact} AI impact
                      </p>
                    </div>
                  </div>

                  {/* Rating buttons */}
                  <div className="flex gap-1.5 flex-shrink-0">
                    {maturityOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleRate(step.id, option.value)}
                        className={`
                          px-3 py-1.5 rounded-md text-xs font-medium border-2 transition-all duration-150 cursor-pointer
                          ${
                            currentRating === option.value
                              ? option.selected
                              : option.idle
                          }
                        `}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Scorecard appears after first rating */}
      {ratedCount > 0 && (
        <MaturityScorecard steps={workflow.steps} ratings={ratings} />
      )}

      {/* Empty state */}
      {ratedCount === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg font-light">
            Select a maturity level for each step above to see your scorecard
          </p>
          <p className="text-sm mt-1">
            Click Manual, Semi-Auto, or Automated for each process step
          </p>
        </div>
      )}
    </div>
  );
}
