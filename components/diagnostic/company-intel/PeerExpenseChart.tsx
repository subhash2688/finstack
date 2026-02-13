"use client";

import { PeerFinancials } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3 } from "lucide-react";

interface PeerExpenseChartProps {
  targetFinancials: PeerFinancials;
  peers: PeerFinancials[];
  customPeers?: PeerFinancials[];
}

const EXPENSE_CATEGORIES = [
  { key: "rdAsPercent" as const, label: "R&D %", color: "bg-blue-500", legendColor: "bg-blue-500" },
  { key: "smAsPercent" as const, label: "S&M %", color: "bg-amber-500", legendColor: "bg-amber-500" },
  { key: "gaAsPercent" as const, label: "G&A %", color: "bg-slate-400", legendColor: "bg-slate-400" },
];

const TARGET_COLORS = {
  rdAsPercent: "bg-[#00B140]",
  smAsPercent: "bg-[#00994D]",
  gaAsPercent: "bg-[#007A3D]",
};

const BAR_MAX_HEIGHT = 100; // max bar height in px

export function PeerExpenseChart({ targetFinancials, peers, customPeers = [] }: PeerExpenseChartProps) {
  // Filter to peers that have at least one expense metric and are not private
  const validPeers = peers.filter(
    (p) => !p.isPrivate && (p.rdAsPercent !== undefined || p.smAsPercent !== undefined || p.gaAsPercent !== undefined)
  );
  const validCustomPeers = customPeers.filter(
    (p) => !p.isPrivate && (p.rdAsPercent !== undefined || p.smAsPercent !== undefined || p.gaAsPercent !== undefined)
  );

  const allCompanies = [targetFinancials, ...validPeers, ...validCustomPeers];

  // Check if target has any expense data
  const targetHasData = EXPENSE_CATEGORIES.some((cat) => targetFinancials[cat.key] !== undefined);
  if (!targetHasData && validPeers.length === 0 && validCustomPeers.length === 0) return null;

  // Find max value for consistent bar scaling
  let maxVal = 0;
  for (const company of allCompanies) {
    for (const cat of EXPENSE_CATEGORIES) {
      const val = company[cat.key];
      if (val !== undefined && val > maxVal) maxVal = val;
    }
  }
  if (maxVal === 0) maxVal = 50;

  const isCustomPeer = (ticker: string) =>
    validCustomPeers.some((p) => p.ticker === ticker);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Expense-to-Revenue Comparison</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            SEC EDGAR
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          Functional expense ratios as % of revenue
        </p>
      </CardHeader>
      <CardContent>
        {/* Legend */}
        <div className="flex flex-wrap gap-4 mb-5">
          {EXPENSE_CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-sm ${cat.legendColor}`} />
              <span className="text-xs text-muted-foreground">{cat.label}</span>
            </div>
          ))}
        </div>

        {/* Per-company rows */}
        <div className="space-y-4">
          {allCompanies.map((company) => {
            const isTarget = company.ticker === targetFinancials.ticker;
            const isCustom = !isTarget && isCustomPeer(company.ticker);
            const hasAnyData = EXPENSE_CATEGORIES.some((cat) => company[cat.key] !== undefined);
            if (!hasAnyData) return null;

            return (
              <div
                key={company.ticker}
                className={`flex items-end gap-4 rounded-lg px-3 py-3 ${
                  isTarget ? "bg-[#00B140]/5 border border-[#00B140]/15" : "bg-muted/30"
                }`}
              >
                {/* Company label */}
                <div className="w-20 shrink-0 pb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-xs font-semibold ${isTarget ? "text-[#00B140]" : ""}`}>
                      {company.ticker}
                    </span>
                    {isTarget && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 bg-[#00B140]/10 text-[#00B140] border-[#00B140]/20">
                        Target
                      </Badge>
                    )}
                    {isCustom && (
                      <Badge variant="outline" className="text-[8px] px-1 py-0 bg-violet-50 text-violet-600 border-violet-200">
                        Custom
                      </Badge>
                    )}
                  </div>
                  {company.companyName && company.companyName !== company.ticker && (
                    <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                      {company.companyName}
                    </p>
                  )}
                </div>

                {/* Vertical bars */}
                <div className="flex items-end gap-3 flex-1">
                  {EXPENSE_CATEGORIES.map((cat) => {
                    const val = company[cat.key];
                    if (val === undefined) return null;

                    const barHeight = Math.max((val / maxVal) * BAR_MAX_HEIGHT, 4);
                    const barColor = isTarget ? TARGET_COLORS[cat.key] : cat.color;

                    return (
                      <div key={cat.key} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-medium tabular-nums text-muted-foreground">
                          {val}%
                        </span>
                        <div
                          className={`w-8 rounded-t-sm ${barColor} transition-all`}
                          style={{ height: `${barHeight}px` }}
                        />
                        <span className="text-[9px] text-muted-foreground">{cat.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
