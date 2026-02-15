"use client";

import { useState, useEffect, useCallback } from "react";
import { CompanyIntel, FunctionalHeadcountEntry, PeerFinancials, FinancialProfile, YearlyFinancial } from "@/types/diagnostic";
import { Badge } from "@/components/ui/badge";
import { Building2, Database, Info } from "lucide-react";
import { FinancialOverview } from "./FinancialOverview";
import { DerivedMetricsPanel } from "./DerivedMetricsPanel";
import { HeadcountBreakdown } from "./HeadcountBreakdown";
import { PeerComparisonTable } from "./PeerComparisonTable";
import { ExecutiveTeam } from "./ExecutiveTeam";
import { CompanyCommentary } from "./CompanyCommentary";
import { PeerBenchmarkGrid } from "./PeerBenchmarkGrid";

interface CompanyIntelDashboardProps {
  intel: CompanyIntel;
  companyName: string;
  tickerSymbol?: string;
  onFunctionalHeadcountChange?: (entries: FunctionalHeadcountEntry[]) => void;
  onPeerChange?: (customPeers: PeerFinancials[], removedTickers: string[]) => void;
}

const confidenceBadgeStyles: Record<CompanyIntel["confidenceLevel"], string> = {
  high: "bg-emerald-100 text-emerald-800 border-emerald-200",
  medium: "bg-amber-100 text-amber-800 border-amber-200",
  low: "bg-gray-100 text-gray-600 border-gray-200",
};

const confidenceLabels: Record<CompanyIntel["confidenceLevel"], string> = {
  high: "SEC EDGAR Data",
  medium: "Partial Data",
  low: "No Public Data",
};

function financialProfileToPeerFinancials(ticker: string, name: string, profile: FinancialProfile): PeerFinancials | null {
  if (!profile.yearlyData || profile.yearlyData.length === 0) return null;
  const latest = profile.yearlyData[0];
  const expenses = latest.expenses || [];
  return {
    ticker,
    companyName: name,
    revenue: latest.revenue,
    revenueGrowth: latest.revenueGrowth,
    grossMargin: latest.grossMargin,
    operatingMargin: latest.operatingMargin,
    rdAsPercent: expenses.find((e) => e.category === "R&D")?.asPercentOfRevenue,
    smAsPercent: expenses.find((e) => e.category === "S&M" || e.category === "SG&A")?.asPercentOfRevenue,
    gaAsPercent: expenses.find((e) => e.category === "G&A")?.asPercentOfRevenue,
  };
}

export function CompanyIntelDashboard({
  intel,
  companyName,
  tickerSymbol,
  onFunctionalHeadcountChange,
  onPeerChange,
}: CompanyIntelDashboardProps) {
  const hasEdgar = intel.financialProfile?.source === "edgar";
  const hasFinancials = hasEdgar && (intel.financialProfile?.yearlyData?.length ?? 0) > 0;
  const hasHeadcount = intel.headcount?.total !== undefined;
  const hasDerivedMetrics = !!intel.financialProfile?.derivedMetrics;
  const hasPeerComparison = !!intel.peerComparison && intel.peerComparison.peers.length > 0;
  const hasLeadership = !!intel.leadership && intel.leadership.executives.length > 0;
  const hasCommentary = !!intel.commentary;

  // Custom peer state
  const [customPeers, setCustomPeers] = useState<PeerFinancials[]>(
    () => intel.peerComparison?.customPeers ?? []
  );
  const [removedPeers, setRemovedPeers] = useState<Set<string>>(
    () => new Set(intel.peerComparison?.removedTickers ?? [])
  );
  const [isFetchingPeer, setIsFetchingPeer] = useState(false);

  // Enriched multi-year data for peers (fetched from Turso profiles)
  const [peerProfiles, setPeerProfiles] = useState<Record<string, YearlyFinancial[]>>({});

  const enrichPeers = useCallback(async (tickers: string[]) => {
    const toFetch = tickers.filter((t) => !peerProfiles[t]);
    if (toFetch.length === 0) return;

    const results: Record<string, YearlyFinancial[]> = {};
    await Promise.all(
      toFetch.map(async (ticker) => {
        try {
          const res = await fetch(`/api/edgar/financials?ticker=${encodeURIComponent(ticker)}`);
          if (res.ok) {
            const profile: FinancialProfile = await res.json();
            if (profile.yearlyData?.length > 0) {
              results[ticker] = profile.yearlyData;
            }
          }
        } catch {
          // ignore
        }
      })
    );
    if (Object.keys(results).length > 0) {
      setPeerProfiles((prev) => ({ ...prev, ...results }));
    }
  }, [peerProfiles]);

  // Fetch multi-year profiles for auto-detected + custom peers
  useEffect(() => {
    const allPeerTickers = [
      ...(intel.peerComparison?.peers ?? []).filter((p) => !p.isPrivate).map((p) => p.ticker),
      ...customPeers.filter((p) => !p.isPrivate).map((p) => p.ticker),
    ];
    if (allPeerTickers.length > 0) {
      enrichPeers(allPeerTickers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intel.peerComparison?.peers, customPeers]);

  const addCustomPeer = async (result: { ticker: string; name: string }) => {
    if (customPeers.length >= 5) return;
    setIsFetchingPeer(true);

    try {
      const res = await fetch(`/api/edgar/financials?ticker=${encodeURIComponent(result.ticker)}`);
      if (res.ok) {
        const profile: FinancialProfile = await res.json();
        const peer = financialProfileToPeerFinancials(result.ticker, result.name, profile);
        if (peer) {
          const updated = [...customPeers, peer];
          setCustomPeers(updated);
          onPeerChange?.(updated, Array.from(removedPeers));
        }
      }
    } catch {
      // ignore fetch errors
    } finally {
      setIsFetchingPeer(false);
    }
  };

  // Remove an auto-detected or custom peer
  const handleRemovePeer = (ticker: string) => {
    if (customPeers.some((p) => p.ticker === ticker)) {
      const updated = customPeers.filter((p) => p.ticker !== ticker);
      setCustomPeers(updated);
      onPeerChange?.(updated, Array.from(removedPeers));
      return;
    }
    // Auto-detected peer — add to removed set
    const updated = new Set(removedPeers);
    updated.add(ticker);
    setRemovedPeers(updated);
    onPeerChange?.(customPeers, Array.from(updated));
  };

  // Build target financials for peer comparison table
  const targetFinancials: PeerFinancials | undefined = (tickerSymbol && intel.financialProfile?.yearlyData?.[0])
    ? {
        ticker: tickerSymbol,
        companyName,
        revenue: intel.financialProfile.yearlyData[0].revenue,
        revenueGrowth: intel.financialProfile.yearlyData[0].revenueGrowth,
        grossMargin: intel.financialProfile.yearlyData[0].grossMargin,
        operatingMargin: intel.financialProfile.yearlyData[0].operatingMargin,
        rdAsPercent: intel.financialProfile.yearlyData[0].expenses?.find(e => e.category === "R&D")?.asPercentOfRevenue,
        smAsPercent: intel.financialProfile.yearlyData[0].expenses?.find(e => e.category === "S&M" || e.category === "SG&A")?.asPercentOfRevenue,
        gaAsPercent: intel.financialProfile.yearlyData[0].expenses?.find(e => e.category === "G&A")?.asPercentOfRevenue,
      }
    : undefined;

  const targetYearlyData = intel.financialProfile?.yearlyData ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
            Company Intelligence — {companyName}
          </h3>
        </div>
        <Badge variant="outline" className={confidenceBadgeStyles[intel.confidenceLevel]}>
          {confidenceLabels[intel.confidenceLevel]}
        </Badge>
      </div>

      {/* Source indicator */}
      {hasEdgar && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Database className="h-3 w-3" />
          <span>Source: SEC EDGAR 10-K filings</span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">{intel.confidenceReason}</p>

      {/* 1. Financial Overview (enhanced with balance sheet + trends) */}
      {hasFinancials && intel.financialProfile && (
        <FinancialOverview profile={intel.financialProfile} />
      )}

      {/* 2. Derived Metrics Panel (DSO, DPO, inventory turns) */}
      {hasDerivedMetrics && intel.financialProfile!.derivedMetrics && (
        <DerivedMetricsPanel metrics={intel.financialProfile!.derivedMetrics} />
      )}

      {/* 3. Revenue Growth Benchmark Grid */}
      {hasFinancials && targetFinancials && targetYearlyData.length > 0 && (
        <PeerBenchmarkGrid
          targetFinancials={targetFinancials}
          targetYearlyData={targetYearlyData}
          peers={intel.peerComparison?.peers ?? []}
          customPeers={customPeers}
          removedTickers={removedPeers}
          onRemovePeer={handleRemovePeer}
          onAddPeer={tickerSymbol ? addCustomPeer : undefined}
          isFetchingPeer={isFetchingPeer}
          peerProfiles={peerProfiles}
        />
      )}

      {/* 4. Peer Comparison Table — show if auto-peers or custom peers exist */}
      {(hasPeerComparison || customPeers.length > 0) && tickerSymbol && (
        <PeerComparisonTable
          comparison={intel.peerComparison ?? { targetTicker: tickerSymbol, peers: [], generatedAt: new Date().toISOString() }}
          targetTicker={tickerSymbol}
          targetFinancials={targetFinancials}
          customPeers={customPeers}
          removedTickers={removedPeers}
          onRemovePeer={handleRemovePeer}
          onAddPeer={addCustomPeer}
          isFetchingPeer={isFetchingPeer}
          latestFiscalYear={targetYearlyData[0]?.year}
        />
      )}

      {/* 5. Executive Team */}
      {hasLeadership && intel.leadership && (
        <ExecutiveTeam leadership={intel.leadership} companyName={companyName} />
      )}

      {/* 6. Company Commentary */}
      {hasCommentary && intel.commentary && (
        <CompanyCommentary commentary={intel.commentary} />
      )}

      {/* 7. Headcount (enhanced with editable functional breakdown) */}
      {hasHeadcount && intel.headcount && (
        <HeadcountBreakdown
          headcount={intel.headcount}
          functionalHeadcount={intel.functionalHeadcount}
          onFunctionalChange={onFunctionalHeadcountChange}
          editable={hasHeadcount}
        />
      )}

      {/* No data state for private companies */}
      {!hasFinancials && !hasHeadcount && !hasLeadership && !hasCommentary && (
        <div className="rounded-lg border border-dashed border-muted-foreground/25 p-8 text-center">
          <Info className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            No public financial data available
          </p>
          <p className="text-xs text-muted-foreground/60 mt-1 max-w-md mx-auto">
            Company Intelligence requires SEC EDGAR filings (10-K).
            This is available for publicly traded companies with a valid ticker symbol.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      {(hasFinancials || hasLeadership || hasCommentary) && (
        <p className="text-[11px] text-muted-foreground/60 italic border-t pt-3">
          Financial data from SEC EDGAR 10-K filings. AI-generated commentary based on publicly available information.
          Verify against original filings for precision.
        </p>
      )}
    </div>
  );
}
