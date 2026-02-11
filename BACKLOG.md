# Product Backlog

## How to use
- Items are grouped by theme, not priority
- Priority column: `P0` (do next), `P1` (soon), `P2` (later), `—` (unranked)
- Status: `idea` → `spec` → `in-progress` → `done`

---

## AI & Intelligence

| # | Item | Description | Priority | Status |
|---|------|-------------|----------|--------|
| 1 | Pain points → workflow prioritization | Feed intake pain points + process context into an LLM call to reorder/highlight workflow steps, generate "focus areas" summary, and tailor recommendations to what the client actually cares about. Without this, collecting pain points is pointless. | — | idea |
| 2 | On-demand workflow generation | When user clicks "Explore Process," generate a tailored workflow using client context + process-specific intake (ERP, team size, pain points) instead of falling back to the static workflow. | — | idea |
| 3 | Context-aware AI diagnostic | Current diagnostic is a static lookup — only 4 hardcoded profiles. A $10M SaaS startup gets the identical AI applicability ranges and automation numbers as a $500M mid-market SaaS company. Replace `generateMockDiagnostic()` with an LLM call that takes ALL intake inputs (revenue, growth, headcount, sub-sector, company size, selected processes, pain points, ERP, team sizes) and generates tailored: (a) AI applicability ranges that reflect actual company scale and complexity, (b) automation opportunity numbers calibrated to their maturity, (c) challenges that reference their specific pain points, (d) priority areas weighted by what they told us matters. This is the single biggest credibility gap — consultants will immediately see that the numbers don't change between clients. | P0 | done |
| 13 | Tooling recommendations with cost sizing | After diagnostic, automatically map process pain points → relevant tool categories → specific vendors with pricing. Build toward dollar-based cost savings estimates (e.g., "Automating AP invoice processing for a 15-person team at your volume could save $X/year"). Requires: (a) tool catalog with pricing tiers, (b) effort-to-dollar conversion model (headcount × loaded cost × % addressable), (c) vendor recommendation engine. Long-term goal is a concrete ROI case, not just percentage ranges. | — | idea |
| 14 | System-aware AI prompting | Strengthen the diagnostic and workflow AI prompts to reason more deeply about the client's current systems. E.g., "QuickBooks" signals early-stage finance ops (lower automation ceiling), while "SAP S/4HANA" signals mature infrastructure (higher ceiling, harder change management). No data model change — just smarter prompting with the data we already collect. | P1 | idea |
| 15 | Structured tool compatibility data | Add `erpIntegrations: string[]` to each tool in the tools catalog. When generating workflows or vendor recommendations, filter/rank tools by actual ERP compatibility. "You're on NetSuite → these 4 tools have native connectors, these 2 would need middleware." Enables grounded vendor recommendations instead of generic lists. | P1 | idea |
| 16 | Business performance benchmarking | Collect actual performance metrics at intake (DSO, close time, error rates, duplicate payment rate) and benchmark against industry medians. Turn the diagnostic from "companies like you typically face X" into "your DSO of 45 days vs. SaaS median of 35 days suggests Y." Requires industry benchmark data and more intake fields. | P2 | idea |

## Company Data & Financials

| # | Item | Description | Priority | Status |
|---|------|-------------|----------|--------|
| 4 | EDGAR API integration (public companies) | Use SEC EDGAR XBRL APIs to pull real financial data (revenue, EBITDA, headcount, expense ratios) for public companies by ticker symbol. Auto-populate a company profile dashboard. | — | idea |
| 5 | Company financial dashboard | After engagement creation, show a dashboard with key metrics: revenue, revenue growth, headcount, EBITDA, expense-to-revenue ratios. For public companies, pull from EDGAR. For private, use manually entered data. Starting point for the assessment. | — | idea |
| 6 | Ticker symbol auto-lookup | When user enters a ticker, validate it and auto-fill company name, sub-sector, and company size from public data. | — | idea |
| 12 | Headcount by function & sub-function | For public companies, pull employee headcount broken down by function (Finance, Engineering, Sales, etc.) and sub-function (e.g., Finance → AP, FP&A). Sources: LinkedIn API/scraping, proxy statements (DEF 14A), 10-K segment disclosures, or third-party data providers (Revelio Labs, People Data Labs). Use this to size the team, estimate automation ROI, and benchmark against peers. | — | idea |

## Engagement & Workflow UX

| # | Item | Description | Priority | Status |
|---|------|-------------|----------|--------|
| 7 | Post-creation editing | Let users edit company info, process-specific intake, and add/remove processes from the engagement workspace — not just during creation. Currently the workspace is read-only for these fields. | — | idea |
| 8 | Add Process modal (workspace) | The "Add Process" button in EngagementWorkspace is a placeholder. Wire it up to let users add more processes to an existing engagement with the same intake flow (process selection + tailored questions). | — | idea |
| 9 | Process context display | Show the intake answers (ERP, team size, pain points) on the process card in the workspace and at the top of the workflow page, so the consultant sees the client context while assessing. | — | idea |

## Infrastructure & Quality

| # | Item | Description | Priority | Status |
|---|------|-------------|----------|--------|
| 10 | Expand to non-Finance functions | Currently only Finance has `available: true` processes. As process workflows are built out, enable GTM, R&D, HR, Legal. | — | idea |
| 11 | Persist form state across refresh | If the user refreshes mid-creation, all 3 steps of intake data are lost. Consider saving draft state to localStorage. | — | idea |

---

*Last updated: 2026-02-10*
