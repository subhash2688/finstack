import { getDbClient } from "./client";
import { FinancialProfile, PeerFinancials } from "@/types/diagnostic";

// ── Company types ──

export interface CompanyRecord {
  cik: string;
  ticker: string;
  company_name: string;
  sic: string;
  sic_description: string;
  exchange: string;
  fiscal_year_end: string;
}

// ── 1. Search companies by ticker or name ──

export async function searchCompanies(
  query: string,
  limit: number = 15
): Promise<{ ticker: string; name: string }[]> {
  const db = getDbClient();
  const q = query.trim().toUpperCase();
  if (!q) return [];

  // Score-based matching via UNION with priority ordering:
  // exact ticker (100), ticker starts with (80), name contains (60)
  const result = await db.execute({
    sql: `
      SELECT ticker, company_name, 100 as score FROM companies WHERE UPPER(ticker) = ?
      UNION ALL
      SELECT ticker, company_name, 80 as score FROM companies WHERE UPPER(ticker) LIKE ? AND UPPER(ticker) != ?
      UNION ALL
      SELECT ticker, company_name, 60 as score FROM companies WHERE UPPER(company_name) LIKE ? AND UPPER(ticker) != ? AND NOT (UPPER(ticker) LIKE ?)
      ORDER BY score DESC, ticker ASC
      LIMIT ?
    `,
    args: [q, `${q}%`, q, `%${q}%`, q, `${q}%`, limit],
  });

  return result.rows.map((row) => ({
    ticker: row.ticker as string,
    name: titleCase(row.company_name as string),
  }));
}

// ── 2. Get company by ticker ──

export async function getCompanyByTicker(
  ticker: string
): Promise<CompanyRecord | null> {
  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT * FROM companies WHERE UPPER(ticker) = ?",
    args: [ticker.trim().toUpperCase()],
  });

  if (result.rows.length === 0) return null;

  const row = result.rows[0];
  return {
    cik: row.cik as string,
    ticker: row.ticker as string,
    company_name: row.company_name as string,
    sic: row.sic as string,
    sic_description: row.sic_description as string,
    exchange: row.exchange as string,
    fiscal_year_end: row.fiscal_year_end as string,
  };
}

// ── 3. Get pre-computed financial profile ──

export async function getFinancialProfile(
  ticker: string
): Promise<FinancialProfile | null> {
  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT profile_json FROM financial_profiles WHERE UPPER(ticker) = ?",
    args: [ticker.trim().toUpperCase()],
  });

  if (result.rows.length === 0) return null;

  try {
    return JSON.parse(result.rows[0].profile_json as string) as FinancialProfile;
  } catch {
    return null;
  }
}

// ── 4. Find peers by SIC code sorted by revenue proximity ──

export async function findPeersBySIC(
  sic: string,
  targetRevenue: number | undefined,
  excludeTicker: string,
  limit: number = 20
): Promise<{
  peers: PeerFinancials[];
  sic: string;
  sicDescription: string;
}> {
  const db = getDbClient();

  // Get SIC description from any company with this SIC
  const sicResult = await db.execute({
    sql: "SELECT sic_description FROM companies WHERE sic = ? LIMIT 1",
    args: [sic],
  });
  const sicDescription = (sicResult.rows[0]?.sic_description as string) || "";

  // Find peers: join financial_profiles with companies on SIC, exclude self,
  // sort by revenue proximity to target
  let sql: string;
  let args: (string | number)[];

  if (targetRevenue !== undefined) {
    sql = `
      SELECT fp.ticker, fp.company_name, fp.profile_json, fp.latest_revenue
      FROM financial_profiles fp
      JOIN companies c ON fp.cik = c.cik
      WHERE c.sic = ?
        AND UPPER(fp.ticker) != ?
        AND fp.latest_revenue IS NOT NULL
      ORDER BY ABS(fp.latest_revenue - ?)
      LIMIT ?
    `;
    args = [sic, excludeTicker.toUpperCase(), targetRevenue, limit];
  } else {
    sql = `
      SELECT fp.ticker, fp.company_name, fp.profile_json, fp.latest_revenue
      FROM financial_profiles fp
      JOIN companies c ON fp.cik = c.cik
      WHERE c.sic = ?
        AND UPPER(fp.ticker) != ?
        AND fp.latest_revenue IS NOT NULL
      ORDER BY fp.latest_revenue DESC
      LIMIT ?
    `;
    args = [sic, excludeTicker.toUpperCase(), limit];
  }

  const result = await db.execute({ sql, args });

  const peers: PeerFinancials[] = [];
  for (const row of result.rows) {
    try {
      const profile = JSON.parse(row.profile_json as string) as FinancialProfile;
      if (!profile.yearlyData || profile.yearlyData.length === 0) continue;

      const latest = profile.yearlyData[0];
      const latestExpenses = latest.expenses || [];

      peers.push({
        ticker: row.ticker as string,
        companyName: titleCase((row.company_name as string) || (row.ticker as string)),
        revenue: latest.revenue,
        revenueGrowth: latest.revenueGrowth,
        grossMargin: latest.grossMargin,
        operatingMargin: latest.operatingMargin,
        rdAsPercent: latestExpenses.find((e) => e.category === "R&D")
          ?.asPercentOfRevenue,
        smAsPercent: latestExpenses.find(
          (e) => e.category === "S&M" || e.category === "SG&A"
        )?.asPercentOfRevenue,
        gaAsPercent: latestExpenses.find((e) => e.category === "G&A")
          ?.asPercentOfRevenue,
      });
    } catch {
      // Skip malformed profiles
    }
  }

  return { peers, sic, sicDescription };
}

// ── 5. Get financial profiles for multiple tickers ──

export async function getFinancialProfilesForTickers(
  tickers: string[]
): Promise<Map<string, FinancialProfile>> {
  const db = getDbClient();
  const result = new Map<string, FinancialProfile>();
  if (tickers.length === 0) return result;

  const placeholders = tickers.map(() => "?").join(", ");
  const upperTickers = tickers.map((t) => t.trim().toUpperCase());

  const rows = await db.execute({
    sql: `SELECT ticker, profile_json FROM financial_profiles WHERE UPPER(ticker) IN (${placeholders})`,
    args: upperTickers,
  });

  for (const row of rows.rows) {
    try {
      const profile = JSON.parse(row.profile_json as string) as FinancialProfile;
      result.set((row.ticker as string).toUpperCase(), profile);
    } catch {
      // Skip malformed
    }
  }

  return result;
}

// ── 6. Match company by name (fuzzy) ──

export async function matchCompanyByName(
  name: string
): Promise<{ ticker: string; cik: string; fullName: string } | null> {
  const db = getDbClient();
  const nameUpper = name.trim().toUpperCase();

  // 1. Exact name match
  let result = await db.execute({
    sql: "SELECT cik, ticker, company_name FROM companies WHERE UPPER(company_name) = ? LIMIT 1",
    args: [nameUpper],
  });
  if (result.rows.length > 0) {
    const r = result.rows[0];
    return { ticker: r.ticker as string, cik: r.cik as string, fullName: r.company_name as string };
  }

  // 2. Ticker symbol match
  result = await db.execute({
    sql: "SELECT cik, ticker, company_name FROM companies WHERE UPPER(ticker) = ? LIMIT 1",
    args: [nameUpper],
  });
  if (result.rows.length > 0) {
    const r = result.rows[0];
    return { ticker: r.ticker as string, cik: r.cik as string, fullName: r.company_name as string };
  }

  // 3. Name starts with
  result = await db.execute({
    sql: "SELECT cik, ticker, company_name FROM companies WHERE UPPER(company_name) LIKE ? LIMIT 1",
    args: [`${nameUpper}%`],
  });
  if (result.rows.length > 0) {
    const r = result.rows[0];
    return { ticker: r.ticker as string, cik: r.cik as string, fullName: r.company_name as string };
  }

  // 4. First two words match
  const words = nameUpper.split(/\s+/);
  if (words.length >= 2) {
    const twoWordPrefix = `${words[0]} ${words[1]}%`;
    result = await db.execute({
      sql: "SELECT cik, ticker, company_name FROM companies WHERE UPPER(company_name) LIKE ? LIMIT 1",
      args: [twoWordPrefix],
    });
    if (result.rows.length > 0) {
      const r = result.rows[0];
      return { ticker: r.ticker as string, cik: r.cik as string, fullName: r.company_name as string };
    }
  }

  // 5. First word match (>= 4 chars)
  if (words[0] && words[0].length >= 4) {
    result = await db.execute({
      sql: "SELECT cik, ticker, company_name FROM companies WHERE UPPER(company_name) LIKE ? LIMIT 1",
      args: [`${words[0]}%`],
    });
    if (result.rows.length > 0) {
      const r = result.rows[0];
      return { ticker: r.ticker as string, cik: r.cik as string, fullName: r.company_name as string };
    }
  }

  return null;
}

// ── 7. Look up CIK by ticker ──

export async function lookupCIK(ticker: string): Promise<string | null> {
  const db = getDbClient();
  const result = await db.execute({
    sql: "SELECT cik FROM companies WHERE UPPER(ticker) = ?",
    args: [ticker.trim().toUpperCase()],
  });

  if (result.rows.length === 0) return null;
  return result.rows[0].cik as string;
}

// ── Utility ──

/** Convert "DATADOG INC" → "Datadog Inc" */
function titleCase(s: string): string {
  return s
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(
      /\b(Inc|Corp|Ltd|Llc|Plc|Lp|Co)\b/gi,
      (m) => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()
    );
}
