/**
 * Database schema migration for Lighthouse EDGAR data.
 *
 * Usage:
 *   cd scripts && npx tsx migrate-schema.ts
 *
 * Requires TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env
 * (reads from ../finstack-navigator/.env.local)
 */

import "dotenv/config";
import { createClient } from "@libsql/client";

const SCHEMA_STATEMENTS = [
  // ── Companies table ──
  `CREATE TABLE IF NOT EXISTS companies (
    cik TEXT PRIMARY KEY,
    ticker TEXT,
    company_name TEXT NOT NULL,
    sic TEXT,
    sic_description TEXT,
    exchange TEXT,
    fiscal_year_end TEXT,
    updated_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_companies_ticker ON companies(ticker)`,
  `CREATE INDEX IF NOT EXISTS idx_companies_sic ON companies(sic)`,
  `CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(company_name)`,

  // ── Raw financial facts table ──
  `CREATE TABLE IF NOT EXISTS financial_facts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cik TEXT NOT NULL,
    namespace TEXT NOT NULL,
    concept TEXT NOT NULL,
    unit TEXT NOT NULL,
    value REAL NOT NULL,
    period_end TEXT NOT NULL,
    period_start TEXT,
    fiscal_year INTEGER,
    fiscal_period TEXT,
    form_type TEXT,
    accession_number TEXT,
    filed_date TEXT,
    frame TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_facts_cik_concept ON financial_facts(cik, concept)`,
  `CREATE INDEX IF NOT EXISTS idx_facts_cik_form ON financial_facts(cik, form_type, fiscal_period)`,

  // ── Pre-computed financial profiles ──
  `CREATE TABLE IF NOT EXISTS financial_profiles (
    cik TEXT PRIMARY KEY,
    ticker TEXT NOT NULL,
    company_name TEXT,
    profile_json TEXT NOT NULL,
    latest_revenue REAL,
    latest_year INTEGER,
    computed_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_profiles_ticker ON financial_profiles(ticker)`,
  `CREATE INDEX IF NOT EXISTS idx_profiles_revenue ON financial_profiles(latest_revenue)`,

  // ── Import run tracking ──
  `CREATE TABLE IF NOT EXISTS import_runs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    companies_processed INTEGER DEFAULT 0,
    facts_inserted INTEGER DEFAULT 0,
    status TEXT DEFAULT 'running'
  )`,
];

async function main() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url) {
    console.error("Error: TURSO_DATABASE_URL not set.");
    console.error("Create a .env file or set environment variables.");
    process.exit(1);
  }

  console.log(`Connecting to ${url}...`);
  const client = createClient({ url, authToken });

  for (const sql of SCHEMA_STATEMENTS) {
    const label = sql.slice(0, 60).replace(/\s+/g, " ").trim();
    console.log(`  Running: ${label}...`);
    await client.execute(sql);
  }

  console.log(`\nSchema migration complete — ${SCHEMA_STATEMENTS.length} statements executed.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
