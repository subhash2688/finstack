import { NextRequest, NextResponse } from "next/server";
import { searchCompanies } from "@/lib/db/queries";
import { secFetch } from "@/lib/edgar/rate-limiter";

const useTurso = process.env.DATA_SOURCE !== "edgar_live";

const USER_AGENT = "FinStackNavigator/1.0 (contact@finstack.dev)";

interface CompanyEntry {
  ticker: string;
  title: string;
  cik: number;
}

// Server-side cache — loaded once, stays in memory (live fallback only)
let companyList: CompanyEntry[] | null = null;

async function loadCompanies(): Promise<CompanyEntry[]> {
  if (companyList) return companyList;

  const res = await secFetch("https://www.sec.gov/files/company_tickers.json", {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch company tickers: ${res.status}`);
  }

  const data = await res.json();
  companyList = Object.values(data).map((entry: any) => ({ // eslint-disable-line
    ticker: entry.ticker,
    title: entry.title,
    cik: entry.cik_str,
  }));

  return companyList;
}

/**
 * GET /api/edgar/companies?q=datad
 * Returns up to 15 matching companies by ticker or name.
 */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json([]);
  }

  try {
    // ── Turso path ──
    if (useTurso) {
      const results = await searchCompanies(q, 15);
      return NextResponse.json(results);
    }

    // ── Live EDGAR fallback ──
    const companies = await loadCompanies();
    const query = q.toUpperCase();

    const results: { entry: CompanyEntry; score: number }[] = [];

    for (const entry of companies) {
      const tickerUpper = entry.ticker.toUpperCase();
      const titleUpper = entry.title.toUpperCase();

      if (tickerUpper === query) {
        results.push({ entry, score: 100 });
      } else if (tickerUpper.startsWith(query)) {
        results.push({ entry, score: 80 });
      } else if (titleUpper.includes(query)) {
        results.push({ entry, score: 60 });
      }
    }

    results.sort((a, b) => b.score - a.score || a.entry.ticker.localeCompare(b.entry.ticker));

    return NextResponse.json(
      results.slice(0, 15).map((r) => ({
        ticker: r.entry.ticker,
        name: titleCase(r.entry.title),
      }))
    );
  } catch (error) {
    console.error("Company search error:", error);
    return NextResponse.json(
      { error: "Failed to search companies" },
      { status: 500 }
    );
  }
}

/** Convert "DATADOG INC" → "Datadog Inc" */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\b(Inc|Corp|Ltd|Llc|Plc|Lp|Co)\b/gi, (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase());
}
