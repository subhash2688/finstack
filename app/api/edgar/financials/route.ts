import { NextRequest, NextResponse } from "next/server";
import { getFinancialProfile } from "@/lib/db/queries";
import { lookupCIK, fetchCompanyFacts, extractFinancials } from "@/lib/edgar/client";

const useTurso = process.env.DATA_SOURCE !== "edgar_live";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json(
      { error: "Missing 'ticker' query parameter" },
      { status: 400 }
    );
  }

  try {
    // ── Turso path ──
    if (useTurso) {
      const profile = await getFinancialProfile(ticker);
      if (!profile) {
        return NextResponse.json(
          { error: `No financial data found for ${ticker}` },
          { status: 404 }
        );
      }
      return NextResponse.json(profile);
    }

    // ── Live EDGAR fallback ──
    const cik = await lookupCIK(ticker);
    if (!cik) {
      return NextResponse.json(
        { error: `Ticker "${ticker}" not found in SEC database` },
        { status: 404 }
      );
    }

    const facts = await fetchCompanyFacts(cik);
    if (!facts) {
      return NextResponse.json(
        { error: `No EDGAR data found for CIK ${cik}` },
        { status: 404 }
      );
    }

    const profile = extractFinancials(facts);
    if (!profile) {
      return NextResponse.json(
        { error: `Could not extract financial data for ${ticker}` },
        { status: 404 }
      );
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("EDGAR API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial data from SEC EDGAR" },
      { status: 500 }
    );
  }
}
