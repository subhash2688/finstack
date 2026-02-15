"use client";

import { Fragment, useState } from "react";
import { PeerComparisonSet, PeerFinancials } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Users, Maximize2, X } from "lucide-react";
import { PeerSearchInput } from "./PeerSearchInput";

interface PeerComparisonTableProps {
  comparison: PeerComparisonSet;
  targetTicker: string;
  targetFinancials?: PeerFinancials;
  customPeers?: PeerFinancials[];
  removedTickers?: Set<string>;
  onRemovePeer?: (ticker: string) => void;
  onAddPeer?: (result: { ticker: string; name: string }) => void;
  isFetchingPeer?: boolean;
  /** The fiscal year the expense data corresponds to */
  latestFiscalYear?: number;
}

function getSourceBadge(source?: "10-K" | "SIC"): { label: string; className: string } {
  if (source === "10-K") return { label: "From 10-K Filing", className: "bg-purple-50 text-purple-700 border-purple-200" };
  return { label: "SIC Code Match", className: "" };
}

function cellColor(val: number | undefined): string {
  if (val === undefined) return "text-muted-foreground";
  if (val >= 15) return "text-emerald-700";
  if (val >= 0) return "text-amber-700";
  return "text-red-600";
}

type MetricKey = "grossMargin" | "rdAsPercent" | "smAsPercent" | "gaAsPercent" | "operatingMargin";

const metricDefs: { label: string; key: MetricKey; isMargin: boolean }[] = [
  { label: "Gross Margin", key: "grossMargin", isMargin: true },
  { label: "R&D Expenses\n[% of rev.]", key: "rdAsPercent", isMargin: false },
  { label: "S&M Expenses\n[% of rev.]", key: "smAsPercent", isMargin: false },
  { label: "G&A Expenses\n[% of rev.]", key: "gaAsPercent", isMargin: false },
  { label: "Op. Margin", key: "operatingMargin", isMargin: true },
];

export function PeerComparisonTable({
  comparison,
  targetTicker,
  targetFinancials,
  customPeers = [],
  removedTickers = new Set(),
  onRemovePeer,
  onAddPeer,
  isFetchingPeer,
  latestFiscalYear,
}: PeerComparisonTableProps) {
  const [expanded, setExpanded] = useState(false);

  const customTickers = new Set(customPeers.map((p) => p.ticker.toUpperCase()));

  const visibleAutoPeers = comparison.peers.filter(
    (p) => !removedTickers.has(p.ticker)
  );

  // Only public companies in columns
  const allCompanies: PeerFinancials[] = targetFinancials
    ? [targetFinancials, ...visibleAutoPeers.filter((p) => !p.isPrivate), ...customPeers]
    : [...visibleAutoPeers.filter((p) => !p.isPrivate), ...customPeers];

  const excludeTickers = [
    targetTicker,
    ...visibleAutoPeers.map((p) => p.ticker),
    ...customPeers.map((p) => p.ticker),
  ];

  // No peers — empty state
  if (visibleAutoPeers.length === 0 && customPeers.length === 0) {
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

  // Compute means for each metric (excluding undefined)
  const meanValues: Record<MetricKey, number | undefined> = {
    grossMargin: undefined,
    rdAsPercent: undefined,
    smAsPercent: undefined,
    gaAsPercent: undefined,
    operatingMargin: undefined,
  };
  for (const metric of metricDefs) {
    const values = allCompanies
      .filter((c) => c[metric.key] !== undefined)
      .map((c) => c[metric.key] as number);
    if (values.length > 0) {
      meanValues[metric.key] = Math.round(
        values.reduce((a, b) => a + b, 0) / values.length
      );
    }
  }

  const renderGrid = (large: boolean) => {
    const maxBarH = large ? 40 : 24;
    const metricLabelW = large ? "110px" : "90px";
    const colMin = large ? "90px" : "60px";
    const meanColW = large ? "56px" : "44px";
    const cellPx = large ? "px-2" : "px-1.5";
    const cellPy = large ? "py-2" : "py-1.5";
    const textSize = large ? "text-xs" : "text-[10px]";
    const headerText = large ? "text-xs" : "text-[10px]";
    const barWidth = large ? "w-10" : "w-7";
    const barScale = 60;

    return (
      <div className="overflow-x-auto">
        <div
          className="min-w-fit"
          style={{
            display: "grid",
            gridTemplateColumns: `${metricLabelW} repeat(${allCompanies.length}, minmax(${colMin}, 1fr)) ${meanColW}`,
          }}
        >
          {/* Header row: P&L label + company columns + Mean */}
          <div
            className={`${cellPx} ${cellPy} ${headerText} font-semibold text-muted-foreground uppercase tracking-wider border-b bg-muted/30 sticky left-0 z-10`}
          >
            P&L
          </div>
          {allCompanies.map((company) => {
            const isTarget = company.ticker === targetTicker;
            const isCustom =
              !isTarget && customTickers.has(company.ticker.toUpperCase());
            return (
              <div
                key={company.ticker}
                className={`${cellPx} ${cellPy} border-b text-center ${
                  isTarget ? "bg-[#00B140]/10" : "bg-muted/20"
                }`}
              >
                <div className="flex flex-col items-center gap-0.5">
                  <div className="flex items-center justify-center gap-1">
                    <span
                      className={`${headerText} font-bold ${
                        isTarget ? "text-[#00B140]" : ""
                      }`}
                    >
                      {company.ticker}
                    </span>
                    {isTarget && (
                      <Badge
                        variant="outline"
                        className="text-[7px] px-1 py-0 bg-[#00B140]/10 text-[#00B140] border-[#00B140]/20 leading-tight"
                      >
                        Target
                      </Badge>
                    )}
                    {isCustom && (
                      <Badge
                        variant="outline"
                        className="text-[7px] px-1 py-0 bg-violet-50 text-violet-600 border-violet-200 leading-tight"
                      >
                        Custom
                      </Badge>
                    )}
                    {!isTarget && large && onRemovePeer && (
                      <button
                        onClick={() => onRemovePeer(company.ticker)}
                        className="p-0.5 rounded hover:bg-red-100 opacity-40 hover:opacity-100 transition-opacity shrink-0"
                        title={`Remove ${company.ticker}`}
                      >
                        <X className="h-3 w-3 text-red-500" />
                      </button>
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground/70 truncate max-w-full leading-tight">
                    {company.companyName}
                  </span>
                </div>
              </div>
            );
          })}
          {/* Mean header */}
          <div
            className={`${cellPx} ${cellPy} ${headerText} font-semibold text-muted-foreground border-b bg-muted/30 text-center`}
          >
            Mean
          </div>

          {/* Metric rows */}
          {metricDefs.map((metric) => {
            const mean = meanValues[metric.key];
            const meanLineH =
              mean !== undefined
                ? Math.min(Math.abs(mean), barScale) / barScale * maxBarH
                : 0;

            return (
              <Fragment key={metric.key}>
                {/* Metric label */}
                <div
                  className={`${cellPx} ${cellPy} ${textSize} font-medium border-b sticky left-0 z-10 bg-white flex items-center leading-tight`}
                >
                  <span className="whitespace-pre-line">{metric.label}</span>
                </div>

                {/* Company cells */}
                {allCompanies.map((company) => {
                  const isTarget = company.ticker === targetTicker;
                  const value = company[metric.key];

                  if (value === undefined) {
                    return (
                      <div
                        key={company.ticker}
                        className={`${cellPx} ${cellPy} border-b text-center ${
                          isTarget ? "bg-[#00B140]/5" : ""
                        }`}
                      >
                        <div className="flex flex-col items-center gap-0.5">
                          <span className="text-[10px] text-muted-foreground/40 italic">
                            N/A
                          </span>
                          <div
                            className="relative"
                            style={{ height: `${maxBarH}px` }}
                          >
                            {/* Mean line even when no data */}
                            {mean !== undefined && (
                              <div
                                className="absolute left-0 right-0 border-t-2 border-dashed border-red-400/50"
                                style={{ bottom: `${meanLineH}px` }}
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }

                  const barH = Math.max(
                    (Math.min(Math.abs(value), barScale) / barScale) * maxBarH,
                    2
                  );
                  const isNeg = value < 0;
                  const barColor = isNeg
                    ? "bg-red-400"
                    : isTarget
                      ? "bg-[#00B140]/70"
                      : "bg-slate-800";
                  const textColor = metric.isMargin
                    ? cellColor(value)
                    : "text-muted-foreground";

                  return (
                    <div
                      key={company.ticker}
                      className={`${cellPx} ${cellPy} border-b text-center ${
                        isTarget ? "bg-[#00B140]/5" : ""
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span
                          className={`${textSize} tabular-nums font-medium ${textColor}`}
                        >
                          {value}%
                        </span>
                        <div
                          className="relative w-full"
                          style={{ height: `${maxBarH}px` }}
                        >
                          {/* Bar from bottom */}
                          <div className="absolute bottom-0 w-full flex justify-center">
                            <div
                              className={`${barWidth} rounded-t ${barColor} transition-all`}
                              style={{ height: `${barH}px` }}
                            />
                          </div>
                          {/* Red dashed mean line */}
                          {mean !== undefined && (
                            <div
                              className="absolute left-0 right-0 border-t-2 border-dashed border-red-400/50"
                              style={{ bottom: `${meanLineH}px` }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Mean column */}
                <div
                  className={`${cellPx} ${cellPy} border-b text-center bg-muted/10 flex items-center justify-center`}
                >
                  {mean !== undefined ? (
                    <span className={`${textSize} font-bold tabular-nums text-red-600`}>
                      ◀ {mean}%
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/40">—</span>
                  )}
                </div>
              </Fragment>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 px-2 pt-2 pb-1">
          <span className="w-4 h-0 border-t-2 border-dashed border-red-400/50 inline-block" />
          <span className="text-[9px] text-muted-foreground italic">
            Overall mean of dataset (excludes companies where data was not available)
          </span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Peer Comparison</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {visibleAutoPeers.length > 0 && (
                <Badge variant="outline" className={`text-xs ${getSourceBadge(comparison.competitorSource).className}`}>
                  {getSourceBadge(comparison.competitorSource).label}
                </Badge>
              )}
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
            {visibleAutoPeers.filter(p => !p.isPrivate).length > 0 && (
              <>
                {visibleAutoPeers.filter(p => !p.isPrivate).length} public peer{visibleAutoPeers.filter(p => !p.isPrivate).length !== 1 ? "s" : ""}
                {visibleAutoPeers.some(p => p.isPrivate) ? ` + ${visibleAutoPeers.filter(p => p.isPrivate).length} private` : ""}
                {comparison.competitorSource === "10-K" ? " from 10-K filing" : " by SIC code"}
              </>
            )}
            {visibleAutoPeers.length > 0 && customPeers.length > 0 && " + "}
            {customPeers.length > 0 && `${customPeers.length} custom`}
            {" — "}expense ratios from SEC EDGAR 10-K
            {latestFiscalYear ? ` (FY ${latestFiscalYear})` : ""}
          </p>
        </CardHeader>
        <CardContent className="p-0 pb-2">{renderGrid(false)}</CardContent>
      </Card>

      {/* Expanded Dialog */}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <DialogTitle>Peer Comparison</DialogTitle>
              {visibleAutoPeers.length > 0 && (
                <Badge variant="outline" className={`text-xs ml-1 ${getSourceBadge(comparison.competitorSource).className}`}>
                  {getSourceBadge(comparison.competitorSource).label}
                </Badge>
              )}
            </div>
            <DialogDescription>
              Expense ratios comparison — {targetTicker} vs peers (SEC EDGAR 10-K{latestFiscalYear ? `, FY ${latestFiscalYear}` : ""})
            </DialogDescription>
          </DialogHeader>
          <div className="mt-2">{renderGrid(true)}</div>
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
