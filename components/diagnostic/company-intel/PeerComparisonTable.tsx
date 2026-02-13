"use client";

import { PeerComparisonSet, PeerFinancials } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface PeerComparisonTableProps {
  comparison: PeerComparisonSet;
  targetTicker: string;
  targetFinancials?: PeerFinancials;
  customPeers?: PeerFinancials[];
}

function getSourceBadge(source?: "10-K" | "SIC"): { label: string; className: string } {
  if (source === "10-K") return { label: "From 10-K Filing", className: "bg-purple-50 text-purple-700 border-purple-200" };
  return { label: "SIC Code Match", className: "" };
}

function formatPct(val: number | undefined): string {
  if (val === undefined) return "—";
  return `${val > 0 ? "+" : ""}${val}%`;
}

function formatRevenue(val: number | undefined): string {
  if (val === undefined) return "—";
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return `$${val}M`;
}

function cellColor(val: number | undefined): string {
  if (val === undefined) return "text-muted-foreground";
  if (val >= 15) return "text-emerald-700";
  if (val >= 0) return "text-amber-700";
  return "text-red-600";
}

export function PeerComparisonTable({ comparison, targetTicker, targetFinancials, customPeers = [] }: PeerComparisonTableProps) {
  const customTickers = new Set(customPeers.map((p) => p.ticker.toUpperCase()));

  const allCompanies = targetFinancials
    ? [targetFinancials, ...comparison.peers, ...customPeers]
    : [...comparison.peers, ...customPeers];

  // No peers at all (auto or custom) — show empty state
  if (comparison.peers.length === 0 && customPeers.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Peer Comparison</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No peers auto-detected. Use the custom ticker picker below to add companies for comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Peer Comparison</CardTitle>
          </div>
          {comparison.peers.length > 0 && (
            <Badge variant="outline" className={`text-xs ${getSourceBadge(comparison.competitorSource).className}`}>
              {getSourceBadge(comparison.competitorSource).label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {comparison.peers.filter(p => !p.isPrivate).length > 0 && (
            <>
              {comparison.peers.filter(p => !p.isPrivate).length} public peer{comparison.peers.filter(p => !p.isPrivate).length !== 1 ? "s" : ""}
              {comparison.peers.some(p => p.isPrivate) ? ` + ${comparison.peers.filter(p => p.isPrivate).length} private` : ""}
              {comparison.competitorSource === "10-K" ? " from 10-K filing" : " by SIC code"}
            </>
          )}
          {comparison.peers.length > 0 && customPeers.length > 0 && " + "}
          {customPeers.length > 0 && `${customPeers.length} custom`}
          {" — "}financial data from SEC EDGAR
        </p>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-muted-foreground">
                <th className="text-left py-2 font-medium">Company</th>
                <th className="text-right py-2 font-medium">Revenue</th>
                <th className="text-right py-2 font-medium">Growth</th>
                <th className="text-right py-2 font-medium">Gross</th>
                <th className="text-right py-2 font-medium">Op. Margin</th>
                <th className="text-right py-2 font-medium">R&D %</th>
                <th className="text-right py-2 font-medium">S&M %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {allCompanies.map((company) => {
                const isTarget = company.ticker === targetTicker;
                const isCustom = !isTarget && customTickers.has(company.ticker.toUpperCase());
                if (company.isPrivate) {
                  return (
                    <tr key={company.companyName} className="text-muted-foreground">
                      <td className="py-2">
                        <span className="italic text-gray-400">{company.companyName}</span>
                      </td>
                      <td colSpan={6} className="text-right py-2 italic text-gray-400 text-xs">
                        Private — no public data
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={company.ticker} className={isTarget ? "bg-[#00B140]/5 font-medium" : ""}>
                    <td className="py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={isTarget ? "text-[#00B140] font-semibold" : ""}>
                          {company.ticker}
                        </span>
                        {isTarget && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-[#00B140]/10 text-[#00B140] border-[#00B140]/20">
                            Target
                          </Badge>
                        )}
                        {isCustom && (
                          <Badge variant="outline" className="text-[9px] px-1 py-0 bg-violet-50 text-violet-600 border-violet-200">
                            Custom
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="text-right py-2">{formatRevenue(company.revenue)}</td>
                    <td className={`text-right py-2 ${cellColor(company.revenueGrowth)}`}>{formatPct(company.revenueGrowth)}</td>
                    <td className={`text-right py-2 ${cellColor(company.grossMargin)}`}>
                      {company.grossMargin !== undefined ? `${company.grossMargin}%` : "—"}
                    </td>
                    <td className={`text-right py-2 ${cellColor(company.operatingMargin)}`}>
                      {company.operatingMargin !== undefined ? `${company.operatingMargin}%` : "—"}
                    </td>
                    <td className="text-right py-2 text-muted-foreground">
                      {company.rdAsPercent !== undefined ? `${company.rdAsPercent}%` : "—"}
                    </td>
                    <td className="text-right py-2 text-muted-foreground">
                      {company.smAsPercent !== undefined ? `${company.smAsPercent}%` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
