"use client";

import { WorkflowStep, MaturityLevel } from "@/types/workflow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StepToolSection } from "./StepToolSection";

interface MaturityScorecardProps {
  steps: WorkflowStep[];
  ratings: Record<string, MaturityLevel>;
}

const maturityScores: Record<MaturityLevel, number> = {
  manual: 0,
  "semi-automated": 50,
  automated: 100,
};

const maturityLabels: Record<MaturityLevel, string> = {
  manual: "Manual",
  "semi-automated": "Semi-Automated",
  automated: "Automated",
};

export function MaturityScorecard({ steps, ratings }: MaturityScorecardProps) {
  const ratedSteps = steps.filter((s) => ratings[s.id]);
  const ratedCount = ratedSteps.length;

  if (ratedCount === 0) return null;

  // Overall score
  const totalScore =
    ratedSteps.reduce((sum, s) => sum + maturityScores[ratings[s.id]], 0) /
    ratedCount;
  const scoreLabel =
    totalScore >= 70 ? "Well Automated" : totalScore >= 35 ? "Partially Automated" : "Largely Manual";

  // Find top gaps — manual steps with high AI impact
  const gaps = steps
    .filter((s) => ratings[s.id] === "manual")
    .sort((a, b) => {
      const impactOrder = { high: 3, medium: 2, low: 1 };
      return impactOrder[b.aiOpportunity.impact] - impactOrder[a.aiOpportunity.impact];
    })
    .slice(0, 3);

  // Estimated ROI from gaps
  const highGaps = steps.filter((s) => ratings[s.id] === "manual" && s.aiOpportunity.impact === "high").length;
  const medGaps = steps.filter((s) => ratings[s.id] === "manual" && s.aiOpportunity.impact === "medium").length;

  // Selected step for tool recommendation (first gap)
  const topGap = gaps[0];

  return (
    <div className="space-y-8">
      {/* Score Header — AlixPartners large-number style */}
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-8">
        <div className="grid md:grid-cols-4 gap-6 items-center">
          {/* Main Score */}
          <div className="md:col-span-1 text-center">
            <p className="text-6xl font-light text-emerald-700">{Math.round(totalScore)}%</p>
            <p className="text-sm text-emerald-800 mt-1 font-medium">AP Automation Maturity</p>
          </div>

          {/* Score Breakdown */}
          <div className="md:col-span-3 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-3xl font-light text-red-600">
                {steps.filter((s) => ratings[s.id] === "manual").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Manual Steps</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light text-yellow-600">
                {steps.filter((s) => ratings[s.id] === "semi-automated").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Semi-Automated</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-light text-emerald-600">
                {steps.filter((s) => ratings[s.id] === "automated").length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Fully Automated</p>
            </div>
          </div>
        </div>

        {/* Status line */}
        <div className="mt-6 pt-4 border-t border-emerald-200">
          <p className="text-emerald-800 text-lg font-light">
            Your AP process is <strong className="font-semibold">{scoreLabel}</strong>.
            {ratedCount < steps.length && (
              <span className="text-emerald-600"> Rate {steps.length - ratedCount} more steps for a complete assessment.</span>
            )}
          </p>
        </div>
      </div>

      {/* Priority Gaps — "Start Here" section */}
      {gaps.length > 0 && (
        <div>
          <h3 className="text-xl font-light text-foreground mb-1">
            Start Here
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These manual steps have the highest ROI potential from AI automation.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {gaps.map((step, idx) => (
              <Card key={step.id} className="border-l-4 border-l-emerald-500 hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl font-light text-emerald-500">{idx + 1}</span>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{step.title}</p>
                      <Badge
                        variant="outline"
                        className="mt-1 text-xs bg-red-50 text-red-700 border-red-200"
                      >
                        Currently Manual
                      </Badge>
                      <Badge
                        variant="outline"
                        className="mt-1 ml-1 text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {step.aiOpportunity.impact} AI impact
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                        {step.impactMetrics.timeSavings}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Impact Estimate */}
      {(highGaps > 0 || medGaps > 0) && (
        <div className="bg-gradient-to-r from-emerald-600 to-green-700 rounded-xl p-8 text-white">
          <p className="text-2xl font-light leading-relaxed">
            Automating {gaps.length === 1 ? "this" : "these"} {gaps.length} step{gaps.length > 1 ? "s" : ""} could
            reduce invoice processing time by{" "}
            <strong className="font-semibold">40-60%</strong> and cut cost-per-invoice by{" "}
            <strong className="font-semibold">$3-6</strong>.
          </p>
          <p className="text-emerald-200 text-sm mt-3 font-light">
            Based on industry benchmarks for AP automation ROI.
          </p>
        </div>
      )}

      {/* Before/After for top gap */}
      {topGap && (
        <div>
          <h3 className="text-xl font-light text-foreground mb-1">
            Biggest Opportunity: {topGap.title}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Here is what the transformation looks like for your most impactful gap.
          </p>
          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-5">
                <h4 className="font-semibold text-red-800 mb-2">Today (Manual)</h4>
                <p className="text-sm text-red-900/80">{topGap.beforeAfter.before}</p>
              </CardContent>
            </Card>
            <Card className="border-emerald-200 bg-emerald-50/50">
              <CardContent className="p-5">
                <h4 className="font-semibold text-emerald-800 mb-2">With AI</h4>
                <p className="text-sm text-emerald-900/80">{topGap.beforeAfter.after}</p>
              </CardContent>
            </Card>
          </div>

          {/* Impact metrics for top gap */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {Object.entries(topGap.impactMetrics).map(([key, value]) => {
              const labels: Record<string, string> = {
                timeSavings: "Time Savings",
                errorReduction: "Error Reduction",
                costImpact: "Cost Impact",
                throughput: "Throughput",
              };
              return (
                <Card key={key}>
                  <CardContent className="p-4 text-center">
                    <p className="text-lg font-bold text-emerald-600">{value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{labels[key]}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tools for this step */}
          <div className="border-t pt-6">
            <StepToolSection stepId={topGap.id} />
          </div>
        </div>
      )}

      {/* Maturity Detail Table */}
      <div>
        <h3 className="text-xl font-light text-foreground mb-4">Full Assessment Detail</h3>
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left p-3 font-medium">#</th>
                <th className="text-left p-3 font-medium">Process Step</th>
                <th className="text-left p-3 font-medium">Current State</th>
                <th className="text-left p-3 font-medium">AI Impact</th>
                <th className="text-left p-3 font-medium">Key Metric</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step) => {
                const rating = ratings[step.id];
                if (!rating) return null;
                const statusColors: Record<MaturityLevel, string> = {
                  manual: "bg-red-100 text-red-800",
                  "semi-automated": "bg-yellow-100 text-yellow-800",
                  automated: "bg-emerald-100 text-emerald-800",
                };
                const impactColors: Record<string, string> = {
                  high: "text-emerald-700",
                  medium: "text-yellow-700",
                  low: "text-gray-500",
                };
                return (
                  <tr key={step.id} className="border-t">
                    <td className="p-3 text-muted-foreground">{step.stepNumber}</td>
                    <td className="p-3 font-medium">{step.title}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${statusColors[rating]}`}>
                        {maturityLabels[rating]}
                      </span>
                    </td>
                    <td className={`p-3 font-medium capitalize ${impactColors[step.aiOpportunity.impact]}`}>
                      {step.aiOpportunity.impact}
                    </td>
                    <td className="p-3 text-muted-foreground">{step.impactMetrics.timeSavings}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
