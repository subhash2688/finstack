"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { PeerComparisonSet, PeerFinancials, LeadershipProfile, CompanyCommentaryData } from "@/types/diagnostic";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { generateCompanyIntel } from "@/lib/ai/diagnostic-generator";
import { CompanyIntelDashboard } from "@/components/diagnostic/company-intel/CompanyIntelDashboard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface CompanyIntelPageClientProps {
  engagementId: string;
}

/**
 * Check if we need a FULL re-gen (missing EDGAR data or old schema).
 * Missing commentary/leadership is handled by background fetch, not a full re-gen.
 */
function needsFullReGen(eng: Engagement): boolean {
  const cached = eng.companyIntel;
  if (!cached) return true;
  // Old schema fields → full re-gen
  if (cached.operationalProfile || cached.peerBenchmark || cached.competitivePosition) return true;
  // Public company without EDGAR financials → full re-gen
  if (eng.clientContext.isPublic && eng.clientContext.tickerSymbol && cached.financialProfile?.source !== "edgar") return true;
  // EDGAR data missing balance sheet → full re-gen
  if (eng.clientContext.isPublic && eng.clientContext.tickerSymbol && cached.financialProfile?.source === "edgar" && !cached.financialProfile?.balanceSheet) return true;
  return false;
}

/**
 * Check if commentary/leadership is missing and needs a background fetch.
 */
function needsCommentaryFetch(eng: Engagement): boolean {
  if (!eng.clientContext.isPublic || !eng.clientContext.tickerSymbol) return false;
  const cached = eng.companyIntel;
  if (!cached) return false;
  return !cached.leadership && !cached.commentary;
}

/**
 * Fetch peer comparison data incrementally (without regenerating everything).
 * Tries 10-K competitors first, falls back to SIC peers.
 */
async function fetchPeerComparison(ticker: string, revenue?: number): Promise<PeerComparisonSet | null> {
  try {
    const [competitorsResult, peersResult] = await Promise.allSettled([
      fetch(`/api/edgar/competitors?ticker=${encodeURIComponent(ticker)}`)
        .then(async (res) => (res.ok ? res.json() : null))
        .catch(() => null),
      fetch(`/api/edgar/peers?ticker=${encodeURIComponent(ticker)}${revenue ? `&revenue=${revenue}` : ""}`)
        .then(async (res) => {
          if (!res.ok) return null;
          const data = await res.json();
          return {
            targetTicker: ticker,
            peers: data.peers || [],
            generatedAt: new Date().toISOString(),
            competitorSource: "SIC" as const,
          } as PeerComparisonSet;
        })
        .catch(() => null),
    ]);

    // Prefer 10-K competitors over SIC peers
    if (competitorsResult.status === "fulfilled" && competitorsResult.value?.competitors?.length > 0) {
      return {
        targetTicker: ticker,
        peers: competitorsResult.value.competitors,
        generatedAt: new Date().toISOString(),
        competitorSource: "10-K",
      };
    }
    if (peersResult.status === "fulfilled" && peersResult.value && peersResult.value.peers.length > 0) {
      return peersResult.value;
    }
  } catch {
    // Silently fail — peer comparison is supplementary
  }
  return null;
}

/**
 * Fetch commentary + leadership from Claude API in the background.
 * Returns the data without blocking — caller merges into engagement.
 */
async function fetchCommentaryInBackground(
  companyName: string,
  ticker: string
): Promise<{ leadership?: LeadershipProfile; commentary?: CompanyCommentaryData } | null> {
  try {
    const res = await fetch("/api/company-commentary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, tickerSymbol: ticker }),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function CompanyIntelPageClient({
  engagementId,
}: CompanyIntelPageClientProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [commentaryLoading, setCommentaryLoading] = useState(false);

  const mergeAndSave = useCallback((updates: Partial<Engagement["companyIntel"]>) => {
    const latest = getEngagement(engagementId);
    if (!latest || !latest.companyIntel) return;
    const updated: Engagement = {
      ...latest,
      companyIntel: {
        ...latest.companyIntel,
        ...updates,
      },
      updatedAt: new Date().toISOString(),
    };
    saveEngagement(updated);
    setEngagement(updated);
    window.dispatchEvent(new Event("engagement-updated"));
  }, [engagementId]);

  useEffect(() => {
    const eng = getEngagement(engagementId);
    if (!eng) {
      router.push("/engagements");
      return;
    }
    setEngagement(eng);

    if (needsFullReGen(eng)) {
      // No EDGAR data at all — full generation needed
      loadCompanyIntel(eng);
      return;
    }

    // We have EDGAR data — show it immediately
    setLoaded(true);

    // Background: fetch missing peers
    if (
      eng.clientContext.isPublic &&
      eng.clientContext.tickerSymbol &&
      eng.companyIntel &&
      (!eng.companyIntel.peerComparison || eng.companyIntel.peerComparison.peers.length === 0)
    ) {
      const ticker = eng.clientContext.tickerSymbol;
      const revenue = eng.companyIntel.financialProfile?.yearlyData?.[0]?.revenue;
      fetchPeerComparison(ticker, revenue).then((peerComparison) => {
        if (peerComparison && peerComparison.peers.length > 0) {
          mergeAndSave({ peerComparison });
        }
      });
    }

    // Background: fetch missing commentary/leadership (Claude AI — slow, ~15s)
    if (needsCommentaryFetch(eng) && eng.clientContext.tickerSymbol) {
      setCommentaryLoading(true);
      fetchCommentaryInBackground(
        eng.clientContext.companyName,
        eng.clientContext.tickerSymbol
      ).then((result) => {
        if (result) {
          mergeAndSave({
            leadership: result.leadership,
            commentary: result.commentary,
          });
        }
        setCommentaryLoading(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, router]);

  const loadCompanyIntel = async (eng: Engagement) => {
    if (eng.companyIntel && !needsFullReGen(eng)) {
      setLoaded(true);
      return;
    }
    setIsLoading(true);
    try {
      const intel = await generateCompanyIntel(eng.clientContext);
      const updated: Engagement = {
        ...eng,
        companyIntel: intel,
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
      setLoaded(true);
      window.dispatchEvent(new Event("engagement-updated"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!engagement) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium">Loading Company Insights</p>
          <p className="text-sm text-muted-foreground mt-1">
            {engagement.clientContext.isPublic && engagement.clientContext.tickerSymbol
              ? `Fetching SEC EDGAR data for ${engagement.clientContext.tickerSymbol}...`
              : "Loading industry benchmarks and analysis..."}
          </p>
        </div>
      </div>
    );
  }

  if (engagement.companyIntel) {
    return (
      <>
        <CompanyIntelDashboard
          intel={engagement.companyIntel}
          companyName={engagement.clientContext.companyName}
          tickerSymbol={engagement.clientContext.tickerSymbol}
          onFunctionalHeadcountChange={(entries) => {
            const updated: Engagement = {
              ...engagement,
              companyIntel: {
                ...engagement.companyIntel!,
                functionalHeadcount: entries,
              },
              updatedAt: new Date().toISOString(),
            };
            saveEngagement(updated);
            setEngagement(updated);
          }}
          onPeerChange={(customPeers: PeerFinancials[], removedTickers: string[]) => {
            const latest = getEngagement(engagementId);
            if (!latest || !latest.companyIntel) return;
            const updated: Engagement = {
              ...latest,
              companyIntel: {
                ...latest.companyIntel,
                peerComparison: {
                  ...(latest.companyIntel.peerComparison ?? {
                    targetTicker: latest.clientContext.tickerSymbol ?? "",
                    peers: [],
                    generatedAt: new Date().toISOString(),
                  }),
                  customPeers,
                  removedTickers,
                },
              },
              updatedAt: new Date().toISOString(),
            };
            saveEngagement(updated);
            setEngagement(updated);
            window.dispatchEvent(new Event("engagement-updated"));
          }}
        />
        {commentaryLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-4 px-1">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading AI insights (leadership, market commentary)...
          </div>
        )}
      </>
    );
  }

  if (loaded && !engagement.companyIntel) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground mb-4">
          Failed to load company intelligence. Please try again.
        </p>
        <Button onClick={() => loadCompanyIntel(engagement)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return null;
}
