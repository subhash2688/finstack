"use client";

import { ProcessFindings } from "@/types/findings";
import { MaturityLevel } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

function formatRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`;
}

const MATURITY_STYLES: Record<MaturityLevel, { label: string; className: string }> = {
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

interface ProcessFindingsInlineProps {
  findings: ProcessFindings;
  showVendorLinks?: boolean;
}

export function ProcessFindingsInline({
  findings,
  showVendorLinks = false,
}: ProcessFindingsInlineProps) {
  return (
    <div className="space-y-4">
      {/* Maturity strip */}
      <div className="flex gap-1">
        {findings.stepEstimates
          .slice()
          .sort((a, b) => a.stepNumber - b.stepNumber)
          .map((est) => {
            const style = MATURITY_STYLES[est.maturity];
            return (
              <div
                key={est.stepId}
                className={`flex-1 h-2 rounded-full ${style.className.split(" ").find(c => c.startsWith("bg-"))}`}
                title={`${est.stepTitle}: ${style.label}`}
              />
            );
          })}
      </div>

      {/* Total process savings */}
      <div className="bg-muted/50 rounded-lg p-4 text-center">
        <p className="text-sm text-muted-foreground mb-1">Total Addressable Savings</p>
        <p className="text-2xl font-semibold tracking-tight">
          {formatRange(findings.totalSavings.low, findings.totalSavings.high)}
          <span className="text-sm font-normal text-muted-foreground ml-1">/yr</span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {findings.teamSize} team member{findings.teamSize !== 1 ? "s" : ""}
          {" · "}{findings.assessedStepCount} of {findings.totalStepCount} steps assessed
        </p>
      </div>

      {/* Step breakdown table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b">
              <th className="text-left p-3 font-medium">Step</th>
              <th className="text-left p-3 font-medium">Maturity</th>
              <th className="text-right p-3 font-medium">Savings /yr</th>
              <th className="text-left p-3 font-medium">Top Tool</th>
            </tr>
          </thead>
          <tbody>
            {findings.stepEstimates.map((est) => {
              const style = MATURITY_STYLES[est.maturity];
              return (
                <tr key={est.stepId} className="border-b last:border-b-0">
                  <td className="p-3">
                    <span className="font-medium">{est.stepTitle}</span>
                  </td>
                  <td className="p-3">
                    <Badge
                      variant="outline"
                      className={`text-[10px] ${style.className}`}
                    >
                      {style.label}
                    </Badge>
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {formatRange(est.savings.low, est.savings.high)}
                  </td>
                  <td className="p-3">
                    {est.topTool ? (
                      <div>
                        <span className="font-medium">{est.topTool.name}</span>
                        {est.topTool.fitScore > 0 && (
                          <span className="text-muted-foreground text-xs ml-1.5">
                            {est.topTool.fitScore}%
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Disclaimer */}
      <p className="text-xs text-muted-foreground italic">
        Directional estimates based on team size, maturity ratings, and industry
        benchmarks. Actual savings will vary based on implementation scope, timeline, and
        organizational factors.
      </p>
    </div>
  );
}
