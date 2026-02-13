"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { CompanyIntel, FunctionalHeadcountEntry, PeerFinancials, FinancialProfile } from "@/types/diagnostic";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Database, Info, Search, X, Loader2 } from "lucide-react";
import { FinancialOverview } from "./FinancialOverview";
import { DerivedMetricsPanel } from "./DerivedMetricsPanel";
import { HeadcountBreakdown } from "./HeadcountBreakdown";
import { PeerComparisonTable } from "./PeerComparisonTable";
import { ExecutiveTeam } from "./ExecutiveTeam";
import { CompanyCommentary } from "./CompanyCommentary";
import { PeerExpenseChart } from "./PeerExpenseChart";

interface CompanyIntelDashboardProps {
  intel: CompanyIntel;
  companyName: string;
  tickerSymbol?: string;
  onFunctionalHeadcountChange?: (entries: FunctionalHeadcountEntry[]) => void;
}

interface CompanySearchResult {
  ticker: string;
  name: string;
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
}: CompanyIntelDashboardProps) {
  const hasEdgar = intel.financialProfile?.source === "edgar";
  const hasFinancials = hasEdgar && (intel.financialProfile?.yearlyData?.length ?? 0) > 0;
  const hasHeadcount = intel.headcount?.total !== undefined;
  const hasDerivedMetrics = !!intel.financialProfile?.derivedMetrics;
  const hasPeerComparison = !!intel.peerComparison && intel.peerComparison.peers.length > 0;
  const hasLeadership = !!intel.leadership && intel.leadership.executives.length > 0;
  const hasCommentary = !!intel.commentary;

  // Custom peer state
  const [customPeers, setCustomPeers] = useState<PeerFinancials[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingPeer, setIsFetchingPeer] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  const searchCompanies = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/edgar/companies?q=${encodeURIComponent(query)}`);
      if (res.ok) {
        const data: CompanySearchResult[] = await res.json();
        // Filter out already-added tickers and the target ticker
        const existingTickers = new Set([
          ...(customPeers.map((p) => p.ticker.toUpperCase())),
          ...(tickerSymbol ? [tickerSymbol.toUpperCase()] : []),
        ]);
        const filtered = data.filter((r) => !existingTickers.has(r.ticker.toUpperCase()));
        setSearchResults(filtered.slice(0, 8));
        setShowDropdown(filtered.length > 0);
      }
    } catch {
      // ignore search errors
    } finally {
      setIsSearching(false);
    }
  }, [customPeers, tickerSymbol]);

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchCompanies(value), 300);
  };

  const addCustomPeer = async (result: CompanySearchResult) => {
    if (customPeers.length >= 5) return;
    setShowDropdown(false);
    setSearchQuery("");
    setSearchResults([]);
    setIsFetchingPeer(true);

    try {
      const res = await fetch(`/api/edgar/financials?ticker=${encodeURIComponent(result.ticker)}`);
      if (res.ok) {
        const profile: FinancialProfile = await res.json();
        const peer = financialProfileToPeerFinancials(result.ticker, result.name, profile);
        if (peer) {
          setCustomPeers((prev) => [...prev, peer]);
        }
      }
    } catch {
      // ignore fetch errors
    } finally {
      setIsFetchingPeer(false);
    }
  };

  const removeCustomPeer = (ticker: string) => {
    setCustomPeers((prev) => prev.filter((p) => p.ticker !== ticker));
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

      {/* 3. Peer Comparison Table — show if auto-peers or custom peers exist */}
      {(hasPeerComparison || customPeers.length > 0) && tickerSymbol && (
        <PeerComparisonTable
          comparison={intel.peerComparison ?? { targetTicker: tickerSymbol, peers: [], generatedAt: new Date().toISOString() }}
          targetTicker={tickerSymbol}
          targetFinancials={targetFinancials}
          customPeers={customPeers}
        />
      )}

      {/* 3b. Expense-to-Revenue Chart — show if auto-peers or custom peers exist */}
      {(hasPeerComparison || customPeers.length > 0) && targetFinancials && (
        <PeerExpenseChart
          targetFinancials={targetFinancials}
          peers={intel.peerComparison?.peers ?? []}
          customPeers={customPeers}
        />
      )}

      {/* 3c. Custom Ticker Picker — always show for public companies with a ticker */}
      {tickerSymbol && (
        <div className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Add Custom Comparison
            </h4>
            <span className="text-[10px] text-muted-foreground">
              ({customPeers.length}/5)
            </span>
          </div>

          {/* Selected custom peers as removable badges */}
          {customPeers.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {customPeers.map((peer) => (
                <Badge
                  key={peer.ticker}
                  variant="outline"
                  className="text-xs pl-2 pr-1 py-0.5 bg-violet-50 text-violet-700 border-violet-200 flex items-center gap-1"
                >
                  {peer.ticker}
                  <button
                    onClick={() => removeCustomPeer(peer.ticker)}
                    className="hover:bg-violet-200 rounded-full p-0.5 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* Search input */}
          {customPeers.length < 5 && (
            <div ref={searchRef} className="relative">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search by ticker or company name..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onFocus={() => { if (searchResults.length > 0) setShowDropdown(true); }}
                  className="h-8 text-xs pr-8"
                  disabled={isFetchingPeer}
                />
                {(isSearching || isFetchingPeer) && (
                  <Loader2 className="h-3.5 w-3.5 absolute right-2.5 top-2 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Dropdown results */}
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-50 top-full mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.ticker}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-muted/50 flex items-center gap-2 border-b last:border-b-0"
                      onClick={() => addCustomPeer(result)}
                    >
                      <span className="font-semibold text-primary w-12">{result.ticker}</span>
                      <span className="text-muted-foreground truncate">{result.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground">
            Add up to 5 public company tickers for side-by-side comparison. Data from SEC EDGAR.
          </p>
        </div>
      )}

      {/* 4. Executive Team */}
      {hasLeadership && intel.leadership && (
        <ExecutiveTeam leadership={intel.leadership} companyName={companyName} />
      )}

      {/* 5. Company Commentary */}
      {hasCommentary && intel.commentary && (
        <CompanyCommentary commentary={intel.commentary} />
      )}

      {/* 6. Headcount (enhanced with editable functional breakdown) */}
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
