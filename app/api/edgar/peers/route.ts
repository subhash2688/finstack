import { NextRequest, NextResponse } from "next/server";
import { getCompanyByTicker, findPeersBySIC } from "@/lib/db/queries";
import { lookupCIK, fetchCompanyFacts, extractFinancials, fetchCompanySIC } from "@/lib/edgar/client";
import { secFetch } from "@/lib/edgar/rate-limiter";
import { PeerFinancials } from "@/types/diagnostic";

const useTurso = process.env.DATA_SOURCE !== "edgar_live";

const USER_AGENT = "FinStackNavigator/1.0 (contact@finstack.dev)";

/**
 * GET /api/edgar/peers?ticker=AAPL&revenue=394328
 *
 * Finds peer companies by SIC code, returns up to 20 peers with comparable revenue.
 *
 * Turso: 1 SQL query (<500ms, deterministic)
 * Live:  88+ EDGAR API calls (30-60s, random sampling)
 */
export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");
  const targetRevenueStr = request.nextUrl.searchParams.get("revenue");

  if (!ticker) {
    return NextResponse.json({ error: "Missing 'ticker' parameter" }, { status: 400 });
  }

  try {
    const targetRevenue = targetRevenueStr ? parseFloat(targetRevenueStr) : undefined;

    // ── Turso path: 1 SQL query ──
    if (useTurso) {
      const company = await getCompanyByTicker(ticker);
      if (!company) {
        return NextResponse.json({ error: `Ticker ${ticker} not found` }, { status: 404 });
      }

      if (!company.sic) {
        return NextResponse.json({ error: "Could not determine SIC code" }, { status: 404 });
      }

      const result = await findPeersBySIC(company.sic, targetRevenue, ticker, 20);

      return NextResponse.json({
        peers: result.peers,
        sic: result.sic,
        sicDescription: result.sicDescription,
      });
    }

    // ── Live EDGAR fallback: 88+ API calls ──
    const cik = await lookupCIK(ticker);
    if (!cik) {
      return NextResponse.json({ error: `Ticker ${ticker} not found` }, { status: 404 });
    }

    const companyInfo = await fetchCompanySIC(cik);
    if (!companyInfo?.sic) {
      return NextResponse.json({ error: "Could not determine SIC code" }, { status: 404 });
    }

    // Fetch full tickers list
    const tickerRes = await secFetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!tickerRes.ok) {
      return NextResponse.json({ error: "Failed to fetch company list" }, { status: 500 });
    }

    const allTickers = await tickerRes.json();
    const candidates: { ticker: string; cik: string }[] = [];
    const entries = Object.values(allTickers) as { ticker: string; cik_str: number; title: string }[];

    // Random sample to find SIC matches
    const shuffled = entries.sort(() => Math.random() - 0.5).slice(0, 80);

    const batchSize = 10;
    for (let i = 0; i < shuffled.length && candidates.length < 8; i += batchSize) {
      const batch = shuffled.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(async (entry) => {
          const candidateCik = String(entry.cik_str).padStart(10, "0");
          if (candidateCik === cik) return null;

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

    // Fetch financials for peers
    const peerCandidates = candidates.slice(0, 20);
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
          companyName: candidate.ticker,
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

    // Sort by revenue proximity
    if (targetRevenue) {
      peers.sort((a, b) => {
        const aDiff = Math.abs((a.revenue || 0) - targetRevenue);
        const bDiff = Math.abs((b.revenue || 0) - targetRevenue);
        return aDiff - bDiff;
      });
    }

    return NextResponse.json({
      peers: peers.slice(0, 20),
      sic: companyInfo.sic,
      sicDescription: companyInfo.sicDescription,
    });
  } catch (error) {
    console.error("Peer lookup error:", error);
    return NextResponse.json({ error: "Failed to find peer companies" }, { status: 500 });
  }
}
