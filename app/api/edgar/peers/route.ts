import { NextRequest, NextResponse } from "next/server";
import { lookupCIK, fetchCompanyFacts, extractFinancials, fetchCompanySIC } from "@/lib/edgar/client";
import { secFetch } from "@/lib/edgar/rate-limiter";
import { PeerFinancials } from "@/types/diagnostic";

const USER_AGENT = "FinStackNavigator/1.0 (contact@finstack.dev)";

/**
 * GET /api/edgar/peers?ticker=AAPL
 *
 * Finds peer companies by SIC code, fetches their financials from EDGAR.
 * Returns up to 5 peers with comparable revenue.
 */
export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const targetRevenueStr = request.nextUrl.searchParams.get("revenue");

  if (!ticker) {
    return NextResponse.json({ error: "Missing 'ticker' parameter" }, { status: 400 });
  }

  try {
    // 1. Look up target CIK and SIC
    const cik = await lookupCIK(ticker);
    if (!cik) {
      return NextResponse.json({ error: `Ticker ${ticker} not found` }, { status: 404 });
    }

    const companyInfo = await fetchCompanySIC(cik);
    if (!companyInfo?.sic) {
      return NextResponse.json({ error: "Could not determine SIC code" }, { status: 404 });
    }

    // 2. Find companies with same SIC via EDGAR full-text search
    const searchUrl = `https://efts.sec.gov/LATEST/search-index?q=%22${companyInfo.sic}%22&dateRange=custom&startdt=2023-01-01&forms=10-K&from=0&size=20`;
    // Alternative: Use the company tickers file and check SIC for each
    // Since EDGAR search-index doesn't directly support SIC filtering well,
    // we use the submissions endpoint to check SIC for candidate companies.

    // Fetch full tickers list
    const tickerRes = await secFetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!tickerRes.ok) {
      return NextResponse.json({ error: "Failed to fetch company list" }, { status: 500 });
    }

    const allTickers = await tickerRes.json();
    const candidates: { ticker: string; cik: string }[] = [];

    // Collect some candidate CIKs to check
    const entries = Object.values(allTickers) as { ticker: string; cik_str: number; title: string }[];

    // Take a sample of tickers to check SIC (we can't check all 10K+ companies)
    // Strategy: check up to 50 random companies to find SIC matches
    const shuffled = entries.sort(() => Math.random() - 0.5).slice(0, 80);

    // Check SIC for each candidate in parallel (batched)
    const batchSize = 10;
    for (let i = 0; i < shuffled.length && candidates.length < 8; i += batchSize) {
      const batch = shuffled.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (entry) => {
          const candidateCik = String(entry.cik_str).padStart(10, "0");
          if (candidateCik === cik) return null; // Skip self

          const info = await fetchCompanySIC(candidateCik);
          if (info?.sic === companyInfo.sic) {
            return { ticker: entry.ticker, cik: candidateCik };
          }
          return null;
        })
      );

      for (const result of results) {
        if (result.status === "fulfilled" && result.value) {
          candidates.push(result.value);
        }
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ peers: [], sic: companyInfo.sic, sicDescription: companyInfo.sicDescription });
    }

    // 3. Fetch financials for peers (in parallel, up to 5)
    const peerCandidates = candidates.slice(0, 5);
    const peerResults = await Promise.allSettled(
      peerCandidates.map(async (candidate) => {
        const facts = await fetchCompanyFacts(candidate.cik);
        if (!facts) return null;

        const profile = extractFinancials(facts);
        if (!profile || profile.yearlyData.length === 0) return null;

        const latest = profile.yearlyData[0];
        const latestExpenses = latest.expenses || [];

        const peerData: PeerFinancials = {
          ticker: candidate.ticker,
          companyName: candidate.ticker, // Will be enriched if needed
          revenue: latest.revenue,
          revenueGrowth: latest.revenueGrowth,
          grossMargin: latest.grossMargin,
          operatingMargin: latest.operatingMargin,
          rdAsPercent: latestExpenses.find((e) => e.category === "R&D")?.asPercentOfRevenue,
          smAsPercent: latestExpenses.find((e) => e.category === "S&M" || e.category === "SG&A")?.asPercentOfRevenue,
          gaAsPercent: latestExpenses.find((e) => e.category === "G&A")?.asPercentOfRevenue,
        };

        return peerData;
      })
    );

    const peers: PeerFinancials[] = [];
    for (const result of peerResults) {
      if (result.status === "fulfilled" && result.value) {
        peers.push(result.value);
      }
    }

    // Sort by revenue proximity to target if available
    const targetRevenue = targetRevenueStr ? parseFloat(targetRevenueStr) : undefined;
    if (targetRevenue) {
      peers.sort((a, b) => {
        const aDiff = Math.abs((a.revenue || 0) - targetRevenue);
        const bDiff = Math.abs((b.revenue || 0) - targetRevenue);
        return aDiff - bDiff;
      });
    }

    return NextResponse.json({
      peers: peers.slice(0, 5),
      sic: companyInfo.sic,
      sicDescription: companyInfo.sicDescription,
    });
  } catch (error) {
    console.error("Peer lookup error:", error);
    return NextResponse.json({ error: "Failed to find peer companies" }, { status: 500 });
  }
}
