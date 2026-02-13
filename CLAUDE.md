# Lighthouse (finstack-navigator)

## Project Overview
AI-powered process intelligence platform for enterprise transformation. Consultants use it to create client engagements, assess process maturity, generate AI diagnostics, and pull real financial data from SEC EDGAR.

## Tech Stack
- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui (Radix UI primitives) — components in `components/ui/`. Available: dialog, button, input, tabs, card, badge, checkbox, tooltip. NOT available: command, popover.
- **Storage**: localStorage via `lib/storage/engagements.ts` (with migration support)
- **AI**: Anthropic Claude API for diagnostics, chat, search, workflow generation
- **Data**: SEC EDGAR (free, no API key) for public company financials

## Dev Server
```bash
npx next dev -p 3000
```
If CSS breaks or "missing required error components" appears: delete `.next/` and restart.

## Key Architecture

### Two-Path Homepage
- `/` → Two cards: "Client Engagements" (→ /engagements) and "Process & Tool Explorer" (→ /explore)
- Recent engagements shown below

### Engagement Flow
1. **Create** (`/engagements/new`) → Company profile + function/process selection + process details
2. **Hub** (`/engagements/[id]`) → Overview with navigation to sub-pages
3. **Hypothesis** (`/engagements/[id]/hypothesis`) → Two tabs: Diagnostic + Company Intelligence
4. **Assessment** (`/engagements/[id]/assessment`) → Process-level maturity rating
5. **Findings** (`/engagements/[id]/findings`) → Transparent ROI with editable assumptions

### Company Intelligence (EDGAR Integration)
- Public companies: real financial data from SEC EDGAR 10-K filings
  - Income statement: revenue, margins, R&D/S&M/G&A/COGS (3-year history)
  - Balance sheet: cash, AR, AP, assets, liabilities, debt
  - Derived metrics: DSO, DPO, inventory turns, current ratio, debt-to-equity
  - Peer comparison: SIC code-based peer lookup with EDGAR financials
- LLM-powered (Claude): executive team, product segments, headwinds/tailwinds
  - Always shown with "AI Analysis" badge + staleness caveat
- Private companies: shows "not available" (NO fabricated data)
- Public company intake uses PublicCompanyPicker that auto-fills ticker + company name

### Diagnostic Transparency
- Findings show editable assumptions panel (cost per person, automation potential, range factor)
- Formula explainer: `Savings = Team Size x Capacity Weight x Automation Potential x Cost Per Person`
- Both % impact and $ impact shown for every step
- Tool cost sizing alongside savings for net ROI

### ERP-Aware Intelligence
- ERP intelligence database: signals maturity level, automation ceiling, change management complexity
- Diagnostic prompts incorporate ERP context
- Tool recommendations show ERP compatibility badges (native/connector/middleware/api)

### Type System
- `types/engagement.ts` — `Engagement`, `ClientContext`, `ProcessAssessment`, `SavingsAssumptions`
- `types/diagnostic.ts` — `CompanyDiagnostic`, `CompanyIntel`, `FinancialProfile`, `BalanceSheetSnapshot`, `DerivedMetrics`, `LeadershipProfile`, `CompanyCommentary`, `PeerComparisonSet`
- `types/workflow.ts` — `WorkflowStep`, `MaturityLevel`
- `types/findings.ts` — `ProcessFindings`, `StepSavingsEstimate`
- `types/function.ts` — `FunctionId`, `Function`, `ProcessMeta`
- `types/tool.ts` — `Tool`, `VendorTool`, `ERPIntegration`

## Important Patterns

### Cache Invalidation
localStorage data can become stale when data shapes change. Pattern used:
- `isCompanyIntelStale()` in `HypothesisPageClient.tsx` checks for old fields or missing EDGAR data
- Check on mount AND on user interaction (not just one)

### EDGAR Data Extraction
10-K filings include 3 years of comparative data all tagged with the same `fy` value. Must group by `end` date's calendar year, NOT the `fy` field. See `extractAnnualValues()` in `lib/edgar/client.ts`.
- **Duration values** (revenue, expenses): grouped by period end date
- **Instant values** (balance sheet): taken at fiscal year end dates

### ESLint
Basic ESLint config — `@typescript-eslint/no-explicit-any` rule does NOT exist. Use `// eslint-disable-line` for `any` casts, not `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.

### Data Source Transparency
Every data point must show its source:
- "SEC EDGAR" badge → direct EDGAR data
- "Derived from SEC filings" → calculated from EDGAR data
- "AI Analysis — verify against latest filings" → Claude LLM
- "User Provided" → manual entry

## Code Principles
- **Never fabricate data**: If there's no credible source, show "not available" rather than made-up numbers
- **EDGAR is the only financial data source**: No estimated/template financials for display
- **Lazy loading**: Company Intelligence tab only fetches on click, not on page load
- **Auto-save**: Maturity ratings persist immediately on change when engagement is loaded
- **No new dependencies**: All features built with existing packages (Next.js, Anthropic SDK, Radix UI, Tailwind, fetch)
- **Sub-sector aware**: Explorer filters by company size + sub-industry, affecting tool highlights and process insights

## Directory Structure (key paths)
```
app/
  page.tsx                        # Two-path homepage
  explore/                        # Process & Tool Explorer
  api/edgar/financials/           # GET ?ticker=X → FinancialProfile
  api/edgar/companies/            # GET ?q=search → [{ticker, name}]
  api/edgar/peers/                # GET ?sic=X&revenue=Y → peer tickers
  api/diagnostics/generate/       # POST → CompanyDiagnostic (Claude API)
  api/company-commentary/         # POST → executive team, market commentary
  engagements/[id]/hypothesis/    # Diagnostic + Company Intel tabs
  engagements/[id]/findings/      # Transparent ROI results
  engagements/new/                # New engagement wizard (3-step)
components/
  diagnostic/company-intel/       # CompanyIntelDashboard, FinancialOverview, HeadcountBreakdown, etc.
  engagement/                     # HypothesisPageClient, FindingsPageClient, AssumptionsPanel, etc.
  explore/                        # FunctionToolHeatmap, context selectors
  home/                           # PathCard, RecentEngagements
  ui/                             # shadcn/ui primitives
lib/
  edgar/client.ts                 # EDGAR CIK lookup, facts fetching, financial extraction
  ai/diagnostic-generator.ts      # generateAIDiagnostic, generateCompanyIntel, etc.
  data/sub-sector-taxonomy.ts     # Sub-sector configs with pain points, tool affinities
  data/erp-intelligence.ts        # ERP signal database
  calculators/savings-calculator.ts # ROI with editable assumptions
  storage/engagements.ts          # localStorage CRUD
types/                            # TypeScript interfaces
docs/                             # PRD, TECH_ARCHITECTURE, BACKLOG
```

## Documentation
- `docs/PRD.md` — Full product requirements document
- `docs/TECH_ARCHITECTURE.md` — System architecture, data flows, API inventory, EDGAR pipeline
- `docs/BACKLOG.md` — Sprint-assigned scrum backlog with story points
