"use client";

import { FinancialProfile } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FinancialOverviewProps {
  profile: FinancialProfile;
}

function formatAmount(val: number | undefined): string {
  if (val === undefined) return "—";
  if (Math.abs(val) >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return `$${val}M`;
}

function formatPct(val: number | undefined): string {
  if (val === undefined) return "—";
  return `${val > 0 ? "+" : ""}${val}%`;
}

function marginColor(val: number | undefined): string {
  if (val === undefined) return "text-muted-foreground";
  if (val >= 15) return "text-emerald-700";
  if (val >= 0) return "text-amber-700";
  return "text-red-600";
}

function growthIcon(val: number | undefined) {
  if (val === undefined) return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
  if (val > 0) return <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />;
  if (val < 0) return <TrendingDown className="h-3.5 w-3.5 text-red-500" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function FinancialOverview({ profile }: FinancialOverviewProps) {
  const years = profile.yearlyData;
  const latest = years[0];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Financial Overview</CardTitle>
          <Badge variant="outline" className="text-xs">
            {profile.source === "edgar" ? "SEC EDGAR" : "Estimated"}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">{profile.keyInsight}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Revenue headline */}
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">{profile.revenueScale}</div>
          {latest?.revenueGrowth !== undefined && (
            <div className="flex items-center gap-1">
              {growthIcon(latest.revenueGrowth)}
              <span className={`text-sm font-medium ${latest.revenueGrowth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                {formatPct(latest.revenueGrowth)} YoY
              </span>
            </div>
          )}
        </div>

        {/* 3-year financials table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 font-medium">Metric</th>
                {years.map((y) => (
                  <th key={y.year} className="text-right py-2 font-medium">FY{y.year}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              <tr>
                <td className="py-2 font-medium">Revenue</td>
                {years.map((y) => (
                  <td key={y.year} className="text-right py-2">
                    {y.revenue ? `$${y.revenue >= 1000 ? `${(y.revenue / 1000).toFixed(1)}B` : `${y.revenue}M`}` : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 font-medium">Revenue Growth</td>
                {years.map((y) => (
                  <td key={y.year} className={`text-right py-2 ${y.revenueGrowth !== undefined && y.revenueGrowth >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {formatPct(y.revenueGrowth)}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 font-medium">Gross Margin</td>
                {years.map((y) => (
                  <td key={y.year} className={`text-right py-2 ${marginColor(y.grossMargin)}`}>
                    {y.grossMargin !== undefined ? `${y.grossMargin}%` : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 font-medium">Operating Margin</td>
                {years.map((y) => (
                  <td key={y.year} className={`text-right py-2 ${marginColor(y.operatingMargin)}`}>
                    {y.operatingMargin !== undefined ? `${y.operatingMargin}%` : "—"}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="py-2 font-medium">Net Margin</td>
                {years.map((y) => (
                  <td key={y.year} className={`text-right py-2 ${marginColor(y.netMargin)}`}>
                    {y.netMargin !== undefined ? `${y.netMargin}%` : "—"}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Functional expense breakdown with trend direction */}
        {latest?.expenses && latest.expenses.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Cost Structure — FY{latest.year}
            </p>
            <div className="space-y-2">
              {latest.expenses.map((exp) => {
                // Find the same expense category in the prior year
                const priorYear = years.length > 1 ? years[1] : undefined;
                const priorExp = priorYear?.expenses?.find((e) => e.category === exp.category);
                const trendDir = (exp.asPercentOfRevenue !== undefined && priorExp?.asPercentOfRevenue !== undefined)
                  ? exp.asPercentOfRevenue - priorExp.asPercentOfRevenue
                  : undefined;

                return (
                  <div key={exp.category} className="flex items-center gap-2">
                    <span className="text-xs font-medium w-12">{exp.category}</span>
                    <div className="flex-1 h-5 bg-muted rounded-sm overflow-hidden">
                      <div
                        className="h-full bg-primary/20 rounded-sm flex items-center px-2"
                        style={{ width: `${Math.min(exp.asPercentOfRevenue || 0, 100)}%` }}
                      >
                        <span className="text-[10px] font-medium text-primary whitespace-nowrap">
                          {exp.asPercentOfRevenue !== undefined ? `${exp.asPercentOfRevenue}%` : ""}
                          {exp.amount !== undefined ? ` ($${exp.amount >= 1000 ? `${(exp.amount / 1000).toFixed(1)}B` : `${exp.amount}M`})` : ""}
                        </span>
                      </div>
                    </div>
                    {/* Trend direction indicator */}
                    {trendDir !== undefined && (
                      <div className="shrink-0 w-14 text-right">
                        {Math.abs(trendDir) < 0.5 ? (
                          <span className="inline-flex items-center gap-0.5">
                            <Minus className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground">flat</span>
                          </span>
                        ) : trendDir > 0 ? (
                          <span className="inline-flex items-center gap-0.5">
                            <TrendingUp className="h-3 w-3 text-red-500" />
                            <span className="text-[10px] text-red-600">+{trendDir.toFixed(1)}pp</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5">
                            <TrendingDown className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] text-emerald-600">{trendDir.toFixed(1)}pp</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Balance Sheet Summary */}
        {profile.balanceSheet && profile.balanceSheet.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Balance Sheet Highlights — FY{profile.balanceSheet[0].year}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
              {profile.balanceSheet[0].cash !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Cash & Equivalents</span>
                  <span className="font-medium">{formatAmount(profile.balanceSheet[0].cash)}</span>
                </div>
              )}
              {profile.balanceSheet[0].accountsReceivable !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Accounts Receivable</span>
                  <span className="font-medium">{formatAmount(profile.balanceSheet[0].accountsReceivable)}</span>
                </div>
              )}
              {profile.balanceSheet[0].accountsPayable !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Accounts Payable</span>
                  <span className="font-medium">{formatAmount(profile.balanceSheet[0].accountsPayable)}</span>
                </div>
              )}
              {profile.balanceSheet[0].inventoryNet !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Inventory</span>
                  <span className="font-medium">{formatAmount(profile.balanceSheet[0].inventoryNet)}</span>
                </div>
              )}
              {profile.balanceSheet[0].totalAssets !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Assets</span>
                  <span className="font-medium">{formatAmount(profile.balanceSheet[0].totalAssets)}</span>
                </div>
              )}
              {profile.balanceSheet[0].totalLiabilities !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Liabilities</span>
                  <span className="font-medium">{formatAmount(profile.balanceSheet[0].totalLiabilities)}</span>
                </div>
              )}
              {profile.balanceSheet[0].longTermDebt !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Long-Term Debt</span>
                  <span className="font-medium">{formatAmount(profile.balanceSheet[0].longTermDebt)}</span>
                </div>
              )}
              {profile.balanceSheet[0].totalEquity !== undefined && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Equity</span>
                  <span className="font-medium">{formatAmount(profile.balanceSheet[0].totalEquity)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Revenue per employee if available */}
        {profile.revenuePerEmployee && (
          <div className="flex items-center justify-between pt-2 border-t text-xs">
            <span className="text-muted-foreground">Revenue per Employee</span>
            <span className="font-medium">${Math.round(profile.revenuePerEmployee)}K</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
