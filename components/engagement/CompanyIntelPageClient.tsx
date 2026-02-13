"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { PeerComparisonSet } from "@/types/diagnostic";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { generateCompanyIntel } from "@/lib/ai/diagnostic-generator";
import { CompanyIntelDashboard } from "@/components/diagnostic/company-intel/CompanyIntelDashboard";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";

interface CompanyIntelPageClientProps {
  engagementId: string;
}

/**
 * Check if cached companyIntel is stale and needs full re-fetching.
 * NOTE: Missing peerComparison is handled separately via incremental fetch,
 * NOT here — a full re-gen can lose previously good EDGAR data if the API is temporarily down.
 */
function isCompanyIntelStale(eng: Engagement): boolean {
  const cached = eng.companyIntel;
  if (!cached) return false;
  if (cached.operationalProfile || cached.peerBenchmark || cached.competitivePosition) return true;
  if (eng.clientContext.isPublic && eng.clientContext.tickerSymbol && cached.financialProfile?.source !== "edgar") return true;
  if (eng.clientContext.isPublic && eng.clientContext.tickerSymbol) {
    if (!cached.leadership && !cached.commentary) return true;
    if (cached.financialProfile?.source === "edgar" && !cached.financialProfile?.balanceSheet) return true;
  }
  return false;
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

export function CompanyIntelPageClient({
  engagementId,
}: CompanyIntelPageClientProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const eng = getEngagement(engagementId);
    if (!eng) {
      router.push("/engagements");
      return;
    }
    setEngagement(eng);

    if (eng.companyIntel && !isCompanyIntelStale(eng)) {
      setLoaded(true);
      // Incremental peer fetch: if cached intel exists but peers are missing, fetch them separately
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
            // Re-read from storage to avoid stale closure
            const latest = getEngagement(engagementId);
            if (!latest) return;
            const updated: Engagement = {
              ...latest,
              companyIntel: {
                ...latest.companyIntel!,
                peerComparison,
              },
              updatedAt: new Date().toISOString(),
            };
            saveEngagement(updated);
            setEngagement(updated);
            window.dispatchEvent(new Event("engagement-updated"));
          }
        });
      }
    } else {
      // Auto-fetch on mount
      loadCompanyIntel(eng);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId, router]);

  const loadCompanyIntel = async (eng: Engagement) => {
    if (eng.companyIntel && !isCompanyIntelStale(eng)) {
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
      />
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
