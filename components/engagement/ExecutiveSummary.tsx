"use client";

import { ExecutiveSummaryData } from "@/types/findings";
import { MaturityLevel } from "@/types/workflow";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, AlertCircle } from "lucide-react";

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

function formatRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`;
}

const MATURITY_BADGE: Record<MaturityLevel, { label: string; className: string }> = {
  manual: {
    label: "Manual",
    className: "bg-red-100 text-red-700 border-red-200",
  },
  "semi-automated": {
    label: "Semi-auto",
    className: "bg-amber-100 text-amber-700 border-amber-200",
  },
  automated: {
    label: "Automated",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
};

interface ExecutiveSummaryProps {
  summary: ExecutiveSummaryData;
}

export function ExecutiveSummary({ summary }: ExecutiveSummaryProps) {
  // Teaser state: processes exist but none fully assessed
  if (!summary.hasAnyComplete) {
    if (summary.assessedProcessCount === 0) return null;

    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-2">
            Findings
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Complete at least one process assessment to unlock savings estimates
            and ranked opportunities.
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            {summary.assessedProcessCount} of {summary.totalProcessCount} process{summary.totalProcessCount !== 1 ? "es" : ""} in progress
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero number */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
                Findings
              </h3>
              <p className="text-xs text-muted-foreground">
                {summary.assessedProcessCount} of {summary.totalProcessCount} process{summary.totalProcessCount !== 1 ? "es" : ""} assessed
              </p>
            </div>
          </div>

          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">Total Addressable Savings</p>
            <p className="text-3xl font-semibold tracking-tight">
              {formatRange(summary.totalSavings.low, summary.totalSavings.high)}
              <span className="text-base font-normal text-muted-foreground ml-1">/yr</span>
            </p>
            {summary.totalToolCost && (
              <div className="flex items-baseline gap-4 mt-2">
                <div>
                  <span className="text-xs text-muted-foreground">Est. tool investment: </span>
                  <span className="text-sm tabular-nums">
                    {formatRange(summary.totalToolCost.low, summary.totalToolCost.high)}
                  </span>
                  <span className="text-xs text-muted-foreground">/yr</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">Net ROI: </span>
                  <span className="text-sm font-semibold text-emerald-600 tabular-nums">
                    {formatRange(
                      summary.totalSavings.low - summary.totalToolCost.high,
                      summary.totalSavings.high - summary.totalToolCost.low
                    )}
                  </span>
                  <span className="text-xs text-muted-foreground">/yr</span>
                </div>
              </div>
            )}
          </div>

          {/* Top opportunities */}
          {summary.topOpportunities.length > 0 && (
            <div>
              <h4 className="text-sm font-medium mb-3">Top Opportunities</h4>
              <div className="space-y-2">
                {summary.topOpportunities.map((opp) => {
                  const badge = MATURITY_BADGE[opp.maturity];
                  return (
                    <div
                      key={`${opp.processId}-${opp.stepId}`}
                      className="flex items-center gap-3 py-2 border-b last:border-b-0"
                    >
                      <span className="text-lg font-light text-muted-foreground/50 tabular-nums w-6 text-center shrink-0">
                        {opp.rank}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{opp.stepTitle}</span>
                          <span className="text-xs text-muted-foreground">({opp.processName})</span>
                          <Badge variant="outline" className={`text-[10px] ${badge.className}`}>
                            {badge.label}
                          </Badge>
                        </div>
                        {opp.topTool && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Recommended: {opp.topTool.name}
                          </p>
                        )}
                      </div>
                      <span className="text-sm font-medium tabular-nums shrink-0">
                        {formatRange(opp.savings.low, opp.savings.high)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prompt to complete more */}
          {summary.assessedProcessCount < summary.totalProcessCount && (
            <p className="text-xs text-muted-foreground mt-4 pt-3 border-t">
              Complete remaining process{summary.totalProcessCount - summary.assessedProcessCount !== 1 ? "es" : ""} to refine estimates.
            </p>
          )}

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground italic mt-4 pt-3 border-t">
            Directional estimates based on team size, maturity ratings, and industry benchmarks.
            Actual savings will vary based on implementation scope, timeline, and organizational factors.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
