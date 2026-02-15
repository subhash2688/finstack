/**
 * EDGAR bulk data importer for Lighthouse.
 *
 * Downloads SEC's companyfacts.zip and submissions.zip, extracts them,
 * and loads all ~15,000 US-listed companies + their financial data into Turso.
 *
 * Usage:
 *   cd scripts && npm install && npx tsx import-edgar.ts
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in environment or .env file.
 *
 * Runtime: ~30-60 minutes (1+ GB download, ~15K companies to process)
 */

import "dotenv/config";
import { createClient, Client } from "@libsql/client";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import yauzl from "yauzl";

// ── Configuration ──

const SEC_BASE = "https://www.sec.gov";
const USER_AGENT = "FinStackNavigator/1.0 (contact@finstack.dev)";
const BATCH_SIZE = 50; // Turso batch size for inserts

// 21 XBRL concepts we extract (mirrored from lib/edgar/client.ts)
const REVENUE_CONCEPTS = [
  "RevenueFromContractWithCustomerExcludingAssessedTax",
  "Revenues",
  "SalesRevenueNet",
  "RevenueFromContractWithCustomerIncludingAssessedTax",
];
const GROSS_PROFIT_CONCEPTS = ["GrossProfit"];
const OPERATING_INCOME_CONCEPTS = ["OperatingIncomeLoss"];
const NET_INCOME_CONCEPTS = ["NetIncomeLoss"];
const EXPENSE_CONCEPT_KEYS = [
  "ResearchAndDevelopmentExpense",
  "SellingAndMarketingExpense",
  "SellingGeneralAndAdministrativeExpense",
  "GeneralAndAdministrativeExpense",
  "CostOfRevenue",
  "CostOfGoodsAndServicesSold",
];
const BALANCE_SHEET_KEYS = [
  "CashAndCashEquivalentsAtCarryingValue",
  "AccountsReceivableNetCurrent",
  "AccountsPayableCurrent",
  "InventoryNet",
  "Assets",
  "Liabilities",
  "LongTermDebt",
];
const EMPLOYEE_CONCEPTS = ["EntityNumberOfEmployees"];

const ALL_US_GAAP_CONCEPTS = [
  ...REVENUE_CONCEPTS,
  ...GROSS_PROFIT_CONCEPTS,
  ...OPERATING_INCOME_CONCEPTS,
  ...NET_INCOME_CONCEPTS,
  ...EXPENSE_CONCEPT_KEYS,
  ...BALANCE_SHEET_KEYS,
];
const ALL_DEI_CONCEPTS = [...EMPLOYEE_CONCEPTS];
const TARGET_CONCEPTS = new Set([...ALL_US_GAAP_CONCEPTS, ...ALL_DEI_CONCEPTS]);

// Expense label mapping (duplicated from lib/edgar/client.ts)
const EXPENSE_LABELS: Record<string, string> = {
  ResearchAndDevelopmentExpense: "R&D",
  SellingAndMarketingExpense: "S&M",
  SellingGeneralAndAdministrativeExpense: "SG&A",
  GeneralAndAdministrativeExpense: "G&A",
  CostOfRevenue: "COGS",
  CostOfGoodsAndServicesSold: "COGS",
};

// Balance sheet field mapping
const BALANCE_SHEET_FIELDS: Record<string, string> = {
  CashAndCashEquivalentsAtCarryingValue: "cash",
  AccountsReceivableNetCurrent: "accountsReceivable",
  AccountsPayableCurrent: "accountsPayable",
  InventoryNet: "inventoryNet",
  Assets: "totalAssets",
  Liabilities: "totalLiabilities",
  LongTermDebt: "longTermDebt",
};

// ── Types (self-contained, no Next.js imports) ──

interface FactUnit {
  val: number;
  end: string;
  start?: string;
  fy: number;
  fp: string;
  form: string;
  accn: string;
  frame?: string;
  filed?: string;
}

interface FunctionalExpense {
  category: string;
  amount?: number;
  asPercentOfRevenue?: number;
}

interface YearlyFinancial {
  year: number;
  revenue?: number;
  revenueGrowth?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  expenses?: FunctionalExpense[];
}

interface BalanceSheetSnapshot {
  year: number;
  cash?: number;
  accountsReceivable?: number;
  accountsPayable?: number;
  inventoryNet?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  longTermDebt?: number;
  totalEquity?: number;
}

interface DerivedMetrics {
  dso?: number;
  dpo?: number;
  inventoryTurns?: number;
  currentRatio?: number;
  debtToEquity?: number;
}

interface FinancialProfile {
  source: "edgar";
  currency: string;
  revenueScale: string;
  yearlyData: YearlyFinancial[];
  balanceSheet?: BalanceSheetSnapshot[];
  derivedMetrics?: DerivedMetrics;
  employeeCount?: number;
  revenuePerEmployee?: number;
  keyInsight: string;
}

// ── Extraction logic (duplicated from lib/edgar/client.ts) ──

function extractAnnualValues(
  facts: Record<string, any>, // eslint-disable-line
  namespace: string,
  conceptKeys: string[]
): Map<number, number> {
  const result = new Map<number, number>();
  const ns = facts?.facts?.[namespace];
  if (!ns) return result;

  for (const key of conceptKeys) {
    const concept = ns[key];
    if (!concept) continue;

    const units = concept["units"] as Record<string, FactUnit[]> | undefined;
    if (!units) continue;

    const usdUnits = units["USD"];
    if (!usdUnits) continue;

    const annualFacts = usdUnits.filter(
      (f: FactUnit) => f.form === "10-K" && f.fp === "FY" && f.start
    );

    const byEndYear = new Map<number, FactUnit>();
    for (const fact of annualFacts) {
      const endYear = new Date(fact.end).getFullYear();
      if (fact.start) {
        const startDate = new Date(fact.start);
        const endDate = new Date(fact.end);
        const months =
          (endDate.getFullYear() - startDate.getFullYear()) * 12 +
          (endDate.getMonth() - startDate.getMonth());
        if (months < 10 || months > 14) continue;
      }
      const existing = byEndYear.get(endYear);
      if (!existing || fact.fy > existing.fy) {
        byEndYear.set(endYear, fact);
      }
    }

    byEndYear.forEach((fact, year) => {
      result.set(year, fact.val);
    });

    if (result.size > 0) break;
  }

  return result;
}

function extractInstantValues(
  facts: Record<string, any>, // eslint-disable-line
  namespace: string,
  conceptKey: string
): Map<number, number> {
  const result = new Map<number, number>();
  const ns = facts?.facts?.[namespace];
  if (!ns) return result;

  const concept = ns[conceptKey];
  if (!concept) return result;

  const units = concept["units"] as Record<string, FactUnit[]> | undefined;
  if (!units) return result;

  const usdUnits = units["USD"];
  if (!usdUnits) return result;

  const annualFacts = usdUnits.filter(
    (f: FactUnit) => f.form === "10-K" && f.fp === "FY"
  );

  const byEndYear = new Map<number, FactUnit>();
  for (const fact of annualFacts) {
    const endYear = new Date(fact.end).getFullYear();
    const existing = byEndYear.get(endYear);
    if (!existing || fact.fy > existing.fy) {
      byEndYear.set(endYear, fact);
    }
  }

  byEndYear.forEach((fact, year) => {
    result.set(year, fact.val);
  });

  return result;
}

function extractEmployeeCount(facts: Record<string, any>): number | undefined { // eslint-disable-line
  const deiNs = facts?.facts?.["dei"];
  if (!deiNs) return undefined;

  for (const key of EMPLOYEE_CONCEPTS) {
    const concept = deiNs[key];
    if (!concept) continue;

    const units = concept["units"] as Record<string, FactUnit[]> | undefined;
    if (!units) continue;

    const pureFacts = units["pure"] || units["employees"] || Object.values(units)[0];
    if (!pureFacts) continue;

    const annual = (pureFacts as FactUnit[])
      .filter((f) => f.form === "10-K")
      .sort((a, b) => b.end.localeCompare(a.end));

    if (annual.length > 0) return annual[0].val;
  }

  return undefined;
}

function extractExpensesForYear(
  facts: Record<string, any>, // eslint-disable-line
  calendarYear: number,
  revenue: number | undefined
): FunctionalExpense[] {
  const expenses: FunctionalExpense[] = [];
  const seenLabels = new Set<string>();

  for (const key of EXPENSE_CONCEPT_KEYS) {
    const label = EXPENSE_LABELS[key];
    if (seenLabels.has(label)) continue;

    const values = extractAnnualValues(facts, "us-gaap", [key]);
    const val = values.get(calendarYear);
    if (val !== undefined) {
      seenLabels.add(label);
      const amountM = val / 1_000_000;
      expenses.push({
        category: label,
        amount: Math.round(amountM),
        asPercentOfRevenue: revenue
          ? Math.round((val / revenue) * 1000) / 10
          : undefined,
      });
    }
  }

  const hasSmAndGa =
    expenses.some((e) => e.category === "S&M") &&
    expenses.some((e) => e.category === "G&A");
  if (hasSmAndGa) {
    return expenses.filter((e) => e.category !== "SG&A");
  }

  return expenses;
}

function extractBalanceSheet(
  facts: Record<string, any>, // eslint-disable-line
  years: number[]
): BalanceSheetSnapshot[] {
  const snapshots: BalanceSheetSnapshot[] = [];

  const conceptMaps = new Map<string, Map<number, number>>();
  for (const key of BALANCE_SHEET_KEYS) {
    const field = BALANCE_SHEET_FIELDS[key];
    const values = extractInstantValues(facts, "us-gaap", key);
    if (values.size > 0) {
      conceptMaps.set(field, values);
    }
  }

  if (conceptMaps.size === 0) return [];

  for (const year of years) {
    const snapshot: BalanceSheetSnapshot = { year };
    let hasData = false;

    for (const key of BALANCE_SHEET_KEYS) {
      const field = BALANCE_SHEET_FIELDS[key] as keyof BalanceSheetSnapshot;
      const map = conceptMaps.get(field as string);
      if (map) {
        const val = map.get(year);
        if (val !== undefined) {
          (snapshot as any)[field] = Math.round(val / 1_000_000); // eslint-disable-line
          hasData = true;
        }
      }
    }

    if (snapshot.totalAssets !== undefined && snapshot.totalLiabilities !== undefined) {
      snapshot.totalEquity = snapshot.totalAssets - snapshot.totalLiabilities;
    }

    if (hasData) snapshots.push(snapshot);
  }

  return snapshots;
}

function calculateDerivedMetrics(
  yearlyData: YearlyFinancial[],
  balanceSheet: BalanceSheetSnapshot[]
): DerivedMetrics | undefined {
  if (yearlyData.length === 0 || balanceSheet.length === 0) return undefined;

  const latest = yearlyData[0];
  const latestBS = balanceSheet.find((bs) => bs.year === latest.year);
  if (!latestBS) return undefined;

  const revenueRaw = latest.revenue ? latest.revenue * 1_000_000 : undefined;
  const cogsItem = latest.expenses?.find((e) => e.category === "COGS");
  const cogsRaw = cogsItem?.amount ? cogsItem.amount * 1_000_000 : undefined;

  const metrics: DerivedMetrics = {};

  if (latestBS.accountsReceivable !== undefined && revenueRaw) {
    metrics.dso = Math.round(
      ((latestBS.accountsReceivable * 1_000_000) / revenueRaw) * 365
    );
  }

  if (latestBS.accountsPayable !== undefined && cogsRaw) {
    metrics.dpo = Math.round(
      ((latestBS.accountsPayable * 1_000_000) / cogsRaw) * 365
    );
  }

  if (latestBS.inventoryNet !== undefined && latestBS.inventoryNet > 0 && cogsRaw) {
    metrics.inventoryTurns =
      Math.round((cogsRaw / (latestBS.inventoryNet * 1_000_000)) * 10) / 10;
  }

  if (
    latestBS.totalAssets !== undefined &&
    latestBS.totalLiabilities !== undefined &&
    latestBS.totalLiabilities > 0
  ) {
    if (latestBS.totalEquity !== undefined && latestBS.totalEquity > 0) {
      metrics.debtToEquity =
        Math.round((latestBS.totalLiabilities / latestBS.totalEquity) * 100) / 100;
    }
  }

  const currentAssets =
    (latestBS.cash || 0) +
    (latestBS.accountsReceivable || 0) +
    (latestBS.inventoryNet || 0);
  const currentLiabilities = latestBS.accountsPayable || 0;
  if (currentAssets > 0 && currentLiabilities > 0) {
    metrics.currentRatio =
      Math.round((currentAssets / currentLiabilities) * 100) / 100;
  }

  const hasAny = Object.values(metrics).some((v) => v !== undefined);
  return hasAny ? metrics : undefined;
}

function formatRevenueScale(revenueM: number): string {
  if (revenueM >= 1000) return `$${(revenueM / 1000).toFixed(1)}B`;
  return `$${Math.round(revenueM)}M`;
}

function extractFinancials(facts: Record<string, any>): FinancialProfile | null { // eslint-disable-line
  const revenueMap = extractAnnualValues(facts, "us-gaap", REVENUE_CONCEPTS);
  if (revenueMap.size === 0) return null;

  const grossProfitMap = extractAnnualValues(facts, "us-gaap", GROSS_PROFIT_CONCEPTS);
  const opIncomeMap = extractAnnualValues(facts, "us-gaap", OPERATING_INCOME_CONCEPTS);
  const netIncomeMap = extractAnnualValues(facts, "us-gaap", NET_INCOME_CONCEPTS);
  const employeeCount = extractEmployeeCount(facts);

  const years = Array.from(revenueMap.keys())
    .sort((a, b) => b - a)
    .slice(0, 3);

  const yearlyData: YearlyFinancial[] = years.map((calYear) => {
    const revenue = revenueMap.get(calYear)!;
    const revenueM = revenue / 1_000_000;
    const prevRevenue = revenueMap.get(calYear - 1);

    const grossProfit = grossProfitMap.get(calYear);
    const opIncome = opIncomeMap.get(calYear);
    const netIncome = netIncomeMap.get(calYear);

    const expenses = extractExpensesForYear(facts, calYear, revenue);

    const grossMarginRaw = grossProfit
      ? (grossProfit / revenue) * 100
      : undefined;
    const opMarginRaw = opIncome ? (opIncome / revenue) * 100 : undefined;
    const netMarginRaw = netIncome ? (netIncome / revenue) * 100 : undefined;

    return {
      year: calYear,
      revenue: Math.round(revenueM),
      revenueGrowth: prevRevenue
        ? Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10
        : undefined,
      grossMargin:
        grossMarginRaw !== undefined &&
        grossMarginRaw <= 100 &&
        grossMarginRaw >= -200
          ? Math.round(grossMarginRaw * 10) / 10
          : undefined,
      operatingMargin:
        opMarginRaw !== undefined &&
        opMarginRaw <= 100 &&
        opMarginRaw >= -200
          ? Math.round(opMarginRaw * 10) / 10
          : undefined,
      netMargin:
        netMarginRaw !== undefined &&
        netMarginRaw <= 100 &&
        netMarginRaw >= -200
          ? Math.round(netMarginRaw * 10) / 10
          : undefined,
      expenses: expenses.length > 0 ? expenses : undefined,
    };
  });

  const balanceSheet = extractBalanceSheet(facts, years);
  const derivedMetrics = calculateDerivedMetrics(yearlyData, balanceSheet);

  const latestRevenue = yearlyData[0]?.revenue;
  const revenuePerEmployee =
    latestRevenue && employeeCount
      ? Math.round((latestRevenue * 1_000_000) / employeeCount / 1000)
      : undefined;

  const latestYear = yearlyData[0];
  const insights: string[] = [];
  if (latestYear?.revenueGrowth !== undefined) {
    insights.push(
      `${latestYear.revenueGrowth > 0 ? "+" : ""}${latestYear.revenueGrowth}% revenue growth in FY${latestYear.year}`
    );
  }
  if (latestYear?.operatingMargin !== undefined) {
    insights.push(`${latestYear.operatingMargin}% operating margin`);
  }
  if (employeeCount) {
    insights.push(`${employeeCount.toLocaleString()} employees`);
  }

  return {
    source: "edgar",
    currency: "USD",
    revenueScale: latestRevenue ? formatRevenueScale(latestRevenue) : "N/A",
    yearlyData,
    balanceSheet: balanceSheet.length > 0 ? balanceSheet : undefined,
    derivedMetrics,
    employeeCount,
    revenuePerEmployee,
    keyInsight:
      insights.join(" | ") || "Financial data retrieved from SEC filings",
  };
}

// ── Download helpers ──

async function downloadFile(url: string, dest: string): Promise<void> {
  console.log(`  Downloading ${url}...`);
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Failed to download ${url}: ${res.status} ${res.statusText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  const sizeMB = (buffer.length / 1_000_000).toFixed(1);
  console.log(`  Downloaded ${sizeMB} MB → ${dest}`);
}

/**
 * Extract a ZIP file and call handler for each JSON entry.
 * Streams entries one at a time to keep memory bounded.
 */
function extractZipEntries(
  zipPath: string,
  filter: (name: string) => boolean,
  handler: (name: string, data: Buffer) => Promise<void>
): Promise<number> {
  return new Promise((resolve, reject) => {
    let count = 0;

    yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
      if (err || !zipfile) return reject(err || new Error("Failed to open ZIP"));

      zipfile.readEntry();

      zipfile.on("entry", (entry) => {
        if (!filter(entry.fileName)) {
          zipfile.readEntry();
          return;
        }

        zipfile.openReadStream(entry, (streamErr, readStream) => {
          if (streamErr || !readStream) {
            zipfile.readEntry();
            return;
          }

          const chunks: Buffer[] = [];
          readStream.on("data", (chunk: Buffer) => chunks.push(chunk));
          readStream.on("end", async () => {
            const data = Buffer.concat(chunks);
            try {
              await handler(entry.fileName, data);
              count++;
            } catch (handlerErr) {
              console.error(`  Error processing ${entry.fileName}:`, handlerErr);
            }
            zipfile.readEntry();
          });
        });
      });

      zipfile.on("end", () => resolve(count));
      zipfile.on("error", reject);
    });
  });
}

// ── Main import logic ──

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("Error: TURSO_DATABASE_URL not set.");
    process.exit(1);
  }

  console.log("=== Lighthouse EDGAR Import ===\n");

  const client = createClient({ url, authToken });
  const tmpDir = path.join(os.tmpdir(), "lighthouse-edgar-import");
  fs.mkdirSync(tmpDir, { recursive: true });

  // Record import run
  const runResult = await client.execute({
    sql: "INSERT INTO import_runs (started_at, status) VALUES (?, 'running') RETURNING id",
    args: [new Date().toISOString()],
  });
  const runId = runResult.rows[0]?.id as number;
  console.log(`Import run #${runId} started.\n`);

  let companiesProcessed = 0;
  let factsInserted = 0;

  try {
    // ── Step 1: Download bulk data files ──
    console.log("Step 1: Downloading SEC bulk data files...");

    const submissionsZip = path.join(tmpDir, "submissions.zip");
    const companyFactsZip = path.join(tmpDir, "companyfacts.zip");

    if (!fs.existsSync(submissionsZip)) {
      await downloadFile(
        `${SEC_BASE}/Archives/edgar/daily-index/bulkdata/submissions.zip`,
        submissionsZip
      );
    } else {
      console.log(`  Using cached ${submissionsZip}`);
    }

    if (!fs.existsSync(companyFactsZip)) {
      await downloadFile(
        `${SEC_BASE}/Archives/edgar/daily-index/xbrl/companyfacts.zip`,
        companyFactsZip
      );
    } else {
      console.log(`  Using cached ${companyFactsZip}`);
    }

    // ── Step 2: Parse submissions → companies table ──
    console.log("\nStep 2: Importing company metadata from submissions.zip...");

    // Build a CIK → company info map from submissions
    const companyMap = new Map<
      string,
      { cik: string; ticker: string; name: string; sic: string; sicDesc: string; exchange: string; fyEnd: string }
    >();

    const subCount = await extractZipEntries(
      submissionsZip,
      (name) => name.startsWith("CIK") && name.endsWith(".json"),
      async (_name, data) => {
        try {
          const sub = JSON.parse(data.toString("utf-8"));
          const cik = String(sub.cik).padStart(10, "0");
          const tickers: string[] = sub.tickers || [];
          const ticker = tickers[0] || "";

          if (!ticker) return; // Skip companies without tickers

          companyMap.set(cik, {
            cik,
            ticker: ticker.toUpperCase(),
            name: sub.name || "",
            sic: sub.sic || "",
            sicDesc: sub.sicDescription || "",
            exchange: (sub.exchanges || [])[0] || "",
            fyEnd: sub.fiscalYearEnd || "",
          });
        } catch {
          // Skip malformed entries
        }
      }
    );

    console.log(`  Parsed ${subCount} submission files → ${companyMap.size} companies with tickers.`);

    // Batch insert companies
    console.log("  Inserting companies into database...");
    const companyEntries = Array.from(companyMap.values());
    const now = new Date().toISOString();

    for (let i = 0; i < companyEntries.length; i += BATCH_SIZE) {
      const batch = companyEntries.slice(i, i + BATCH_SIZE);
      await client.batch(
        batch.map((c) => ({
          sql: `INSERT OR REPLACE INTO companies (cik, ticker, company_name, sic, sic_description, exchange, fiscal_year_end, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [c.cik, c.ticker, c.name, c.sic, c.sicDesc, c.exchange, c.fyEnd, now],
        }))
      );

      if ((i + BATCH_SIZE) % 1000 === 0 || i + BATCH_SIZE >= companyEntries.length) {
        console.log(`    ${Math.min(i + BATCH_SIZE, companyEntries.length)} / ${companyEntries.length} companies`);
      }
    }

    companiesProcessed = companyEntries.length;
    console.log(`  Inserted ${companiesProcessed} companies.\n`);

    // ── Step 3: Parse companyfacts → financial_facts + financial_profiles ──
    console.log("Step 3: Importing financial facts from companyfacts.zip...");
    console.log("  (This processes ~15,000 companies and may take 20-40 minutes)\n");

    let processed = 0;
    let profilesCreated = 0;

    await extractZipEntries(
      companyFactsZip,
      (name) => name.startsWith("CIK") && name.endsWith(".json"),
      async (fileName, data) => {
        processed++;

        // Extract CIK from filename: "CIK0000320193.json" → "0000320193"
        const cikMatch = fileName.match(/CIK(\d+)\.json/);
        if (!cikMatch) return;
        const cik = cikMatch[1].padStart(10, "0");

        // Only process companies we know about (have tickers)
        const companyInfo = companyMap.get(cik);
        if (!companyInfo) return;

        let facts: Record<string, any>; // eslint-disable-line
        try {
          facts = JSON.parse(data.toString("utf-8"));
        } catch {
          return;
        }

        // Extract facts for our 21 target concepts
        const factRows: {
          namespace: string;
          concept: string;
          unit: string;
          value: number;
          periodEnd: string;
          periodStart: string | null;
          fiscalYear: number;
          fiscalPeriod: string;
          formType: string;
          accn: string;
          filed: string | null;
          frame: string | null;
        }[] = [];

        // Process us-gaap concepts
        const usGaap = facts?.facts?.["us-gaap"];
        if (usGaap) {
          for (const concept of ALL_US_GAAP_CONCEPTS) {
            const conceptData = usGaap[concept];
            if (!conceptData?.units) continue;

            for (const [unit, unitFacts] of Object.entries(conceptData.units)) {
              for (const f of unitFacts as FactUnit[]) {
                if (f.form !== "10-K" || f.fp !== "FY") continue;
                factRows.push({
                  namespace: "us-gaap",
                  concept,
                  unit,
                  value: f.val,
                  periodEnd: f.end,
                  periodStart: f.start || null,
                  fiscalYear: f.fy,
                  fiscalPeriod: f.fp,
                  formType: f.form,
                  accn: f.accn,
                  filed: f.filed || null,
                  frame: f.frame || null,
                });
              }
            }
          }
        }

        // Process dei concepts (employees)
        const dei = facts?.facts?.["dei"];
        if (dei) {
          for (const concept of ALL_DEI_CONCEPTS) {
            const conceptData = dei[concept];
            if (!conceptData?.units) continue;

            for (const [unit, unitFacts] of Object.entries(conceptData.units)) {
              for (const f of unitFacts as FactUnit[]) {
                if (f.form !== "10-K") continue;
                factRows.push({
                  namespace: "dei",
                  concept,
                  unit,
                  value: f.val,
                  periodEnd: f.end,
                  periodStart: f.start || null,
                  fiscalYear: f.fy,
                  fiscalPeriod: f.fp || "FY",
                  formType: f.form,
                  accn: f.accn,
                  filed: f.filed || null,
                  frame: f.frame || null,
                });
              }
            }
          }
        }

        if (factRows.length === 0) return;

        // Delete existing facts for this CIK, then batch insert new ones
        await client.execute({
          sql: "DELETE FROM financial_facts WHERE cik = ?",
          args: [cik],
        });

        for (let i = 0; i < factRows.length; i += BATCH_SIZE) {
          const batch = factRows.slice(i, i + BATCH_SIZE);
          await client.batch(
            batch.map((r) => ({
              sql: `INSERT INTO financial_facts (cik, namespace, concept, unit, value, period_end, period_start, fiscal_year, fiscal_period, form_type, accession_number, filed_date, frame)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              args: [
                cik,
                r.namespace,
                r.concept,
                r.unit,
                r.value,
                r.periodEnd,
                r.periodStart,
                r.fiscalYear,
                r.fiscalPeriod,
                r.formType,
                r.accn,
                r.filed,
                r.frame,
              ],
            }))
          );
        }

        factsInserted += factRows.length;

        // Compute and store financial profile
        const profile = extractFinancials(facts);
        if (profile) {
          const latestRevenue = profile.yearlyData[0]?.revenue || null;
          const latestYear = profile.yearlyData[0]?.year || null;

          await client.execute({
            sql: `INSERT OR REPLACE INTO financial_profiles (cik, ticker, company_name, profile_json, latest_revenue, latest_year, computed_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?)`,
            args: [
              cik,
              companyInfo.ticker,
              companyInfo.name,
              JSON.stringify(profile),
              latestRevenue,
              latestYear,
              now,
            ],
          });

          profilesCreated++;
        }

        if (processed % 500 === 0) {
          console.log(
            `  ${processed} files processed | ${profilesCreated} profiles | ${factsInserted} fact rows`
          );
        }
      }
    );

    console.log(
      `\n  Final: ${processed} files processed, ${profilesCreated} profiles created, ${factsInserted} fact rows inserted.`
    );

    // ── Step 4: Update import run ──
    await client.execute({
      sql: `UPDATE import_runs SET completed_at = ?, companies_processed = ?, facts_inserted = ?, status = 'completed' WHERE id = ?`,
      args: [new Date().toISOString(), companiesProcessed, factsInserted, runId],
    });

    console.log(`\n=== Import complete! Run #${runId} ===`);
    console.log(`  Companies: ${companiesProcessed}`);
    console.log(`  Financial profiles: ${profilesCreated}`);
    console.log(`  Raw fact rows: ${factsInserted}`);
  } catch (error) {
    console.error("\nImport failed:", error);

    await client.execute({
      sql: `UPDATE import_runs SET completed_at = ?, status = 'failed' WHERE id = ?`,
      args: [new Date().toISOString(), runId],
    });

    process.exit(1);
  }

  // Cleanup temp files (optional — useful for re-runs during development)
  // fs.rmSync(tmpDir, { recursive: true, force: true });

  process.exit(0);
}

main();
