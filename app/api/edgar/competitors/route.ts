import { NextRequest, NextResponse } from "next/server";
import { lookupCIK, fetchCompanyFacts, extractFinancials, fetch10KFilingUrl } from "@/lib/edgar/client";
import { secFetch } from "@/lib/edgar/rate-limiter";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";
import { PeerFinancials } from "@/types/diagnostic";

const USER_AGENT = "FinStackNavigator/1.0 (contact@finstack.dev)";

/**
 * Extract the competition-related sections from filing plain text.
 * Searches for keywords like "competition", "competitive", "compete" and
 * returns a ~15KB window around those sections. Falls back to first 30KB
 * if no competition section is found.
 */
function extractCompetitionText(plainText: string): string {
  const keywords = ["competition", "competitive landscape", "competitors", "we compete", "competitive environment", "principal competitors"];
  const lowerText = plainText.toLowerCase();

  // Find all positions of competition-related keywords
  const positions: number[] = [];
  for (const keyword of keywords) {
    let idx = 0;
    while (idx < lowerText.length) {
      const found = lowerText.indexOf(keyword, idx);
      if (found === -1) break;
      positions.push(found);
      idx = found + keyword.length;
    }
  }

  if (positions.length === 0) {
    // No competition section found — fall back to first 30KB
    return plainText.slice(0, 30_000);
  }

  // Sort positions and extract windows around each cluster
  positions.sort((a, b) => a - b);

  // Merge overlapping windows (5KB before, 5KB after each mention)
  const windowSize = 5_000;
  const windows: { start: number; end: number }[] = [];
  for (const pos of positions) {
    const start = Math.max(0, pos - windowSize);
    const end = Math.min(plainText.length, pos + windowSize);
    if (windows.length > 0 && start <= windows[windows.length - 1].end) {
      // Merge with previous window
      windows[windows.length - 1].end = end;
    } else {
      windows.push({ start, end });
    }
  }

  // Concatenate windows, cap at ~15KB total
  let result = "";
  for (const w of windows) {
    const chunk = plainText.slice(w.start, w.end);
    if (result.length + chunk.length > 15_000) {
      result += chunk.slice(0, 15_000 - result.length);
      break;
    }
    result += chunk + "\n\n---\n\n";
  }

  return result || plainText.slice(0, 30_000);
}

/**
 * GET /api/edgar/competitors?ticker=AAPL
 *
 * Extracts competitor names from the company's 10-K filing text using Claude,
 * then fetches EDGAR financials for public competitors.
 * Private competitors are returned with isPrivate: true.
 */
export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker");

  if (!ticker) {
    return NextResponse.json({ error: "Missing 'ticker' parameter" }, { status: 400 });
  }

  try {
    // 1. Look up CIK
    const cik = await lookupCIK(ticker);
    if (!cik) {
      return NextResponse.json({ error: `Ticker ${ticker} not found` }, { status: 404 });
    }

    // 2. Fetch 10-K filing URL
    const filingUrl = await fetch10KFilingUrl(cik);
    if (!filingUrl) {
      return NextResponse.json({ competitors: [], source: "none" });
    }

    // 3. Fetch the filing HTML — get enough to capture competition sections
    const filingRes = await secFetch(filingUrl, {
      headers: { "User-Agent": USER_AGENT },
    });

    if (!filingRes.ok) {
      return NextResponse.json({ competitors: [], source: "none" });
    }

    const filingHtml = await filingRes.text();
    // Take up to 200KB of HTML to ensure we capture competition sections
    const truncated = filingHtml.slice(0, 200_000);

    // Strip HTML tags to get plain text for Claude
    const plainText = truncated
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&rsquo;/g, "'")
      .replace(/&ldquo;|&rdquo;/g, '"')
      .replace(/&#\d+;/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // 4. Extract competition-related text sections
    const competitionText = extractCompetitionText(plainText);

    // 5. Use Claude to extract competitor names with a stronger prompt
    const client = getAnthropicClient();
    const response = await callAnthropicWithRetry(async () => {
      return client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        temperature: 0,
        system: "You extract competitor company names from SEC 10-K filing text. Return valid JSON only — no markdown, no code blocks.",
        messages: [{
          role: "user",
          content: `Extract the names of direct competitor companies from this 10-K filing section.

Rules:
- Only include companies that DIRECTLY COMPETE with this company in the same product/service market
- Do NOT include partners, customers, suppliers, or ecosystem companies
- Do NOT include companies from unrelated industries
- Prefer companies mentioned in "Competition" or "Competitive Landscape" sections
- If a company is mentioned as a partner or integration, it is NOT a competitor
- Return the most commonly used name (e.g., "Salesforce" not "Salesforce, Inc.")

Filing text:
${competitionText}

Return a JSON object:
{
  "competitors": ["Company Name 1", "Company Name 2", ...]
}

Include up to 8 direct competitors. If no clear competitors are found, return {"competitors": []}.`,
        }],
      });
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ competitors: [], source: "none" });
    }

    const parsed = JSON.parse(textBlock.text);
    const competitorNames: string[] = parsed.competitors || [];

    if (competitorNames.length === 0) {
      return NextResponse.json({ competitors: [], source: "10-K" });
    }

    // 6. For each competitor, try to find in SEC ticker cache and fetch financials
    const tickerRes = await secFetch("https://www.sec.gov/files/company_tickers.json", {
      headers: { "User-Agent": USER_AGENT },
    });

    // Build two lookup maps: by name and by ticker
    const nameMap: Record<string, { ticker: string; cik: string; fullName: string }> = {};
    const tickerLookup: Record<string, { ticker: string; cik: string; fullName: string }> = {};

    if (tickerRes.ok) {
      const data = await tickerRes.json();
      for (const key of Object.keys(data)) {
        const entry = data[key]; // eslint-disable-line
        const name = (entry.title as string || "").toUpperCase();
        const info = {
          ticker: entry.ticker,
          cik: String(entry.cik_str).padStart(10, "0"),
          fullName: name,
        };
        nameMap[name] = info;
        tickerLookup[String(entry.ticker).toUpperCase()] = info;
      }
    }

    // Match competitor names to SEC tickers with improved matching
    const peers: PeerFinancials[] = [];
    const matchedTickers = new Set<string>();

    for (const name of competitorNames.slice(0, 8)) {
      const nameUpper = name.toUpperCase().trim();

      let match: { ticker: string; cik: string; fullName: string } | undefined;

      // 1. Exact name match
      match = nameMap[nameUpper];

      // 2. Try as a ticker symbol (e.g., Claude returned "CRM" instead of "Salesforce")
      if (!match) {
        match = tickerLookup[nameUpper];
      }

      // 3. Try SEC name starts with the competitor name
      if (!match) {
        for (const [secName, info] of Object.entries(nameMap)) {
          if (secName.startsWith(nameUpper + " ") || secName.startsWith(nameUpper + ",")) {
            match = info;
            break;
          }
        }
      }

      // 4. Try first two words match (e.g., "Palo Alto" matches "PALO ALTO NETWORKS INC")
      if (!match) {
        const words = nameUpper.split(/\s+/);
        if (words.length >= 2) {
          const twoWordPrefix = words[0] + " " + words[1];
          for (const [secName, info] of Object.entries(nameMap)) {
            if (secName.startsWith(twoWordPrefix)) {
              match = info;
              break;
            }
          }
        }
      }

      // 5. Try competitor name contains SEC first word (only if word is >= 4 chars to avoid generics)
      if (!match) {
        for (const [secName, info] of Object.entries(nameMap)) {
          const secFirstWord = secName.split(" ")[0];
          if (secFirstWord.length >= 4 && nameUpper.includes(secFirstWord) && secFirstWord === nameUpper.split(" ")[0]) {
            match = info;
            break;
          }
        }
      }

      if (match && match.ticker.toUpperCase() !== ticker.toUpperCase() && !matchedTickers.has(match.ticker.toUpperCase())) {
        matchedTickers.add(match.ticker.toUpperCase());
        try {
          const facts = await fetchCompanyFacts(match.cik);
          if (facts) {
            const profile = extractFinancials(facts);
            if (profile && profile.yearlyData.length > 0) {
              const latest = profile.yearlyData[0];
              const latestExpenses = latest.expenses || [];
              peers.push({
                ticker: match.ticker,
                companyName: name,
                revenue: latest.revenue,
                revenueGrowth: latest.revenueGrowth,
                grossMargin: latest.grossMargin,
                operatingMargin: latest.operatingMargin,
                rdAsPercent: latestExpenses.find((e) => e.category === "R&D")?.asPercentOfRevenue,
                smAsPercent: latestExpenses.find((e) => e.category === "S&M" || e.category === "SG&A")?.asPercentOfRevenue,
                gaAsPercent: latestExpenses.find((e) => e.category === "G&A")?.asPercentOfRevenue,
              });
            }
          }
        } catch {
          // Skip failed lookups
        }
      } else if (!match) {
        // Private company — no public data
        peers.push({
          ticker: "—",
          companyName: name,
          isPrivate: true,
        });
      }
    }

    return NextResponse.json({
      competitors: peers,
      source: "10-K",
    });
  } catch (error) {
    console.error("Competitor extraction error:", error);
    return NextResponse.json({ error: "Failed to extract competitors" }, { status: 500 });
  }
}
