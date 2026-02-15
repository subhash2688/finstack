"use client";

import { useState } from "react";
import { PeerFinancials, YearlyFinancial } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TrendingUp, Maximize2, X, Sparkles, Loader2 } from "lucide-react";
import { PeerSearchInput } from "./PeerSearchInput";

interface PeerBenchmarkGridProps {
  targetFinancials: PeerFinancials;
  targetYearlyData: YearlyFinancial[];
  peers: PeerFinancials[];
  customPeers?: PeerFinancials[];
  removedTickers?: Set<string>;
  onRemovePeer?: (ticker: string) => void;
  onAddPeer?: (result: { ticker: string; name: string }) => void;
  isFetchingPeer?: boolean;
  peerProfiles?: Record<string, YearlyFinancial[]>;
}

interface GrowthAnalysis {
  ticker: string;
  headline: string;
  commentary: string;
}

interface GrowthDriversResult {
  analyses: GrowthAnalysis[];
  peerInsight: string;
  generatedAt: string;
}

function formatRevenue(val: number | undefined): string {
  if (val === undefined) return "—";
  if (val >= 1000) return `$${(val / 1000).toFixed(1)}B`;
  return `$${val.toFixed(0)}M`;
}

/** Subtle background tint based on growth magnitude */
function growthBg(val: number | undefined): string {
  if (val === undefined) return "";
  if (val >= 40) return "bg-emerald-100/80";
  if (val >= 25) return "bg-emerald-50/80";
  if (val >= 10) return "bg-green-50/60";
  if (val >= 0) return "bg-green-50/30";
  if (val >= -10) return "bg-red-50/50";
  return "bg-red-100/60";
}

export function PeerBenchmarkGrid({
  targetFinancials,
  targetYearlyData,
  peers,
  customPeers = [],
  removedTickers = new Set(),
  onRemovePeer,
  onAddPeer,
  isFetchingPeer,
  peerProfiles = {},
}: PeerBenchmarkGridProps) {
  const [expanded, setExpanded] = useState(false);
  const [growthDrivers, setGrowthDrivers] = useState<GrowthDriversResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Determine available years (up to 5)
  const yearSet = new Set<number>();
  for (const yd of targetYearlyData) {
    if (yd.revenue !== undefined) yearSet.add(yd.year);
  }
  for (const profileYears of Object.values(peerProfiles)) {
    for (const yd of profileYears) {
      if (yd.revenue !== undefined) yearSet.add(yd.year);
    }
  }
  // Only include consecutive years from the most recent (no gaps like 2025,2024,2023,2018)
  const sortedYears = Array.from(yearSet).sort((a, b) => b - a);
  const years: number[] = [];
  for (const y of sortedYears) {
    if (years.length === 0 || years[years.length - 1] - y === 1) {
      years.push(y);
      if (years.length >= 5) break;
    } else {
      break; // gap detected, stop
    }
  }
  if (years.length === 0) return null;

  // Filter peers
  const activePeers = peers.filter(
    (p) => !p.isPrivate && !removedTickers.has(p.ticker)
  );
  const activeCustomPeers = customPeers.filter(
    (p) => !p.isPrivate && !removedTickers.has(p.ticker)
  );
  const allPeers = [...activePeers, ...activeCustomPeers];
  const customTickers = new Set(activeCustomPeers.map((p) => p.ticker));

  const companies = [
    { ticker: targetFinancials.ticker, name: targetFinancials.companyName, isTarget: true, isCustom: false },
    ...allPeers.map((p) => ({
      ticker: p.ticker,
      name: p.companyName,
      isTarget: false,
      isCustom: customTickers.has(p.ticker),
    })),
  ];

  // Data accessors
  const getYearlyData = (ticker: string): YearlyFinancial[] => {
    if (ticker === targetFinancials.ticker) return targetYearlyData;
    return peerProfiles[ticker] ?? [];
  };

  const getRevenue = (ticker: string, year: number): number | undefined => {
    return getYearlyData(ticker).find((y) => y.year === year)?.revenue;
  };

  const getGrowth = (ticker: string, year: number): number | undefined => {
    const entry = getYearlyData(ticker).find((y) => y.year === year);
    if (entry?.revenueGrowth !== undefined) return entry.revenueGrowth;
    if (year === years[0]) {
      const peer = allPeers.find((p) => p.ticker === ticker);
      return peer?.revenueGrowth;
    }
    return undefined;
  };

  const excludeTickers = [
    targetFinancials.ticker,
    ...allPeers.map((p) => p.ticker),
  ];

  // Analyze growth drivers via Claude API
  const analyzeGrowthDrivers = async () => {
    setIsAnalyzing(true);
    try {
      const payload = companies.map((c) => {
        const revenueMap: Record<string, number | undefined> = {};
        const growthMap: Record<string, number | undefined> = {};
        for (const year of years) {
          revenueMap[String(year)] = getRevenue(c.ticker, year);
          growthMap[String(year)] = getGrowth(c.ticker, year);
        }
        // Get latest margins from peer data or target
        const peerData = c.isTarget
          ? targetFinancials
          : allPeers.find((p) => p.ticker === c.ticker);
        return {
          ticker: c.ticker,
          name: c.name,
          revenue: revenueMap,
          growth: growthMap,
          grossMargin: peerData?.grossMargin,
          operatingMargin: peerData?.operatingMargin,
        };
      });

      const res = await fetch("/api/growth-drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies: payload,
          targetTicker: targetFinancials.ticker,
        }),
      });

      if (res.ok) {
        const data: GrowthDriversResult = await res.json();
        setGrowthDrivers(data);
      }
    } catch {
      // ignore
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderTable = (large: boolean) => {
    const textCls = large ? "text-sm" : "text-xs";
    const pyCls = large ? "py-2.5" : "py-2";
    const pxCls = large ? "px-3" : "px-2";
    const headerText = large ? "text-xs" : "text-[10px]";

    return (
      <div className="overflow-x-auto">
        <table className={`w-full ${textCls} border-collapse`}>
          <thead>
            {/* Group header row */}
            <tr>
              <th
                rowSpan={2}
                className={`text-left ${pyCls} ${pxCls} ${headerText} font-semibold text-muted-foreground uppercase tracking-wider bg-muted/30 sticky left-0 z-10 border-b-2 border-r`}
              >
                Company
              </th>
              <th
                colSpan={years.length}
                className={`text-center ${pyCls} ${headerText} font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b border-r`}
              >
                Revenue
              </th>
              <th
                colSpan={years.length}
                className={`text-center ${pyCls} ${headerText} font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20 border-b`}
              >
                YoY Growth
              </th>
            </tr>
            {/* Year sub-header row */}
            <tr className="border-b-2">
              {years.map((year, i) => (
                <th
                  key={`rev-${year}`}
                  className={`text-right ${pyCls} ${pxCls} ${headerText} font-medium text-muted-foreground ${
                    i === years.length - 1 ? "border-r" : ""
                  }`}
                >
                  FY {year}
                </th>
              ))}
              {years.map((year) => (
                <th
                  key={`g-${year}`}
                  className={`text-right ${pyCls} ${pxCls} ${headerText} font-medium text-muted-foreground`}
                >
                  FY {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {companies.map((company, rowIdx) => {
              const isTarget = company.isTarget;
              const rowBorder = rowIdx < companies.length - 1 ? "border-b" : "";

              return (
                <tr
                  key={company.ticker}
                  className={`${rowBorder} ${
                    isTarget ? "bg-[#00B140]/5" : ""
                  }`}
                >
                  {/* Company name cell */}
                  <td
                    className={`${pyCls} ${pxCls} font-medium sticky left-0 z-10 border-r ${
                      isTarget ? "bg-[#00B140]/5" : "bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1">
                          <span
                            className={
                              isTarget
                                ? "text-[#00B140] font-semibold"
                                : "font-semibold"
                            }
                          >
                            {company.ticker}
                          </span>
                          {isTarget && (
                            <Badge
                              variant="outline"
                              className="text-[7px] px-1 py-0 bg-[#00B140]/10 text-[#00B140] border-[#00B140]/20 leading-tight shrink-0"
                            >
                              Target
                            </Badge>
                          )}
                          {company.isCustom && (
                            <Badge
                              variant="outline"
                              className="text-[7px] px-1 py-0 bg-violet-50 text-violet-600 border-violet-200 leading-tight shrink-0"
                            >
                              Custom
                            </Badge>
                          )}
                        </div>
                        {large && (
                          <span className="text-[10px] text-muted-foreground/70 truncate leading-tight">
                            {company.name}
                          </span>
                        )}
                      </div>
                      {!isTarget && large && onRemovePeer && (
                        <button
                          onClick={() => onRemovePeer(company.ticker)}
                          className="ml-auto p-0.5 rounded hover:bg-red-100 opacity-40 hover:opacity-100 transition-opacity shrink-0"
                          title={`Remove ${company.ticker}`}
                        >
                          <X className="h-3 w-3 text-red-500" />
                        </button>
                      )}
                    </div>
                  </td>

                  {/* Revenue cells */}
                  {years.map((year, i) => {
                    const rev = getRevenue(company.ticker, year);
                    return (
                      <td
                        key={`rev-${year}`}
                        className={`text-right ${pyCls} ${pxCls} tabular-nums ${
                          i === years.length - 1 ? "border-r" : ""
                        } ${
                          isTarget
                            ? "text-[#00B140] font-semibold"
                            : "font-medium"
                        }`}
                      >
                        {formatRevenue(rev)}
                      </td>
                    );
                  })}

                  {/* Growth cells with heat-map background */}
                  {years.map((year) => {
                    const growth = getGrowth(company.ticker, year);
                    return (
                      <td
                        key={`g-${year}`}
                        className={`text-right ${pyCls} ${pxCls} tabular-nums font-medium ${growthBg(
                          growth
                        )}`}
                      >
                        {growth !== undefined ? (
                          <span
                            className={
                              growth < 0
                                ? "text-red-600"
                                : "text-emerald-700"
                            }
                          >
                            {growth > 0 ? "+" : ""}
                            {growth}%
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">
                            —
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  /** Growth driver commentary rendered in the expanded dialog */
  const renderGrowthDrivers = () => {
    if (!growthDrivers) return null;

    return (
      <div className="mt-4 pt-4 border-t space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          <h4 className="text-sm font-semibold">Growth Driver Analysis</h4>
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
            AI Analysis
          </Badge>
        </div>

        {/* Peer insight callout */}
        {growthDrivers.peerInsight && (
          <div className="rounded-lg bg-muted/40 border px-3 py-2">
            <p className="text-sm text-muted-foreground italic">
              {growthDrivers.peerInsight}
            </p>
          </div>
        )}

        {/* Per-company analyses */}
        <div className="grid gap-2">
          {growthDrivers.analyses.map((analysis) => {
            const company = companies.find((c) => c.ticker === analysis.ticker);
            const isTarget = company?.isTarget;
            return (
              <div
                key={analysis.ticker}
                className={`rounded-lg border px-3 py-2 ${
                  isTarget ? "bg-[#00B140]/5 border-[#00B140]/20" : "bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className={`text-xs font-bold ${
                      isTarget ? "text-[#00B140]" : ""
                    }`}
                  >
                    {analysis.ticker}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {analysis.headline}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {analysis.commentary}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground/60 italic">
          AI-generated analysis based on financial data. Verify against company filings and earnings calls.
        </p>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">
                Revenue & Growth
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                SEC EDGAR
              </Badge>
              <button
                onClick={() => setExpanded(true)}
                className="p-1.5 rounded-md hover:bg-muted transition-colors"
                title="Expand to full view"
              >
                <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Annual revenue &amp; year-over-year growth — target vs peers
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2">
          {renderTable(false)}
        </CardContent>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <DialogTitle>Revenue & Growth</DialogTitle>
              <Badge variant="outline" className="text-xs ml-1">
                SEC EDGAR
              </Badge>
            </div>
            <DialogDescription>
              Annual revenue and year-over-year growth —{" "}
              {targetFinancials.ticker} vs peers
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">{renderTable(true)}</div>

          {/* Growth Drivers button + results */}
          <div className="mt-3">
            {!growthDrivers && (
              <button
                onClick={analyzeGrowthDrivers}
                disabled={isAnalyzing}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                )}
                {isAnalyzing
                  ? "Analyzing growth drivers..."
                  : "Analyze Growth Drivers"}
              </button>
            )}
            {renderGrowthDrivers()}
          </div>

          {onAddPeer && (
            <div className="mt-4 pt-4 border-t">
              <PeerSearchInput
                onSelect={onAddPeer}
                excludeTickers={excludeTickers}
                loading={isFetchingPeer}
                currentCount={customPeers.length}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
