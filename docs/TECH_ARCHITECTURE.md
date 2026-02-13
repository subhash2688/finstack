# Technical Architecture

## System Overview

Lighthouse is a Next.js 14 App Router application with client-side storage (localStorage), server-side AI integration (Anthropic Claude API), and real-time financial data from SEC EDGAR. No database — all engagement data lives in the browser.

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                       │
│  ┌──────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ React UI │  │ localStorage │  │ URL State (params) │  │
│  └────┬─────┘  └──────┬───────┘  └────────┬──────────┘  │
│       │               │                    │             │
└───────┼───────────────┼────────────────────┼─────────────┘
        │               │                    │
        ▼               ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│                 Next.js API Routes                       │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────┐   │
│  │ /api/chat│  │/api/diagnos- │  │ /api/edgar/*    │   │
│  │          │  │tics/generate │  │                 │   │
│  │ /api/    │  │              │  │ /api/edgar/     │   │
│  │ search   │  │/api/workflows│  │  peers          │   │
│  │          │  │ /generate    │  │                 │   │
│  │          │  │              │  │ /api/company-   │   │
│  │          │  │              │  │  commentary     │   │
│  └────┬─────┘  └──────┬───────┘  └────────┬────────┘   │
└───────┼───────────────┼────────────────────┼────────────┘
        │               │                    │
        ▼               ▼                    ▼
┌──────────────┐ ┌──────────────┐  ┌──────────────────┐
│ Anthropic    │ │ Anthropic    │  │ SEC EDGAR        │
│ Claude API   │ │ Claude API   │  │ (Free, no auth)  │
│ (Streaming)  │ │ (Structured) │  │ efts.sec.gov     │
└──────────────┘ └──────────────┘  └──────────────────┘
```

## Data Flows

### 1. Engagement Creation
```
User fills form → POST /api/workflows/generate
  → Claude generates custom workflow (6-14 steps)
  → Response includes tool mappings
  → Saved to localStorage as Engagement
  → Redirect to /engagements/{id}
```

### 2. Company Intelligence (Public Company)
```
User enters ticker → GET /api/edgar/companies?q=search
  → CIK lookup from SEC EDGAR
  → GET /api/edgar/financials?ticker=X
    → Fetch 10-K facts from EDGAR XBRL API
    → Extract: revenue, margins, R&D/S&M/G&A/COGS, headcount
    → Extract: balance sheet (cash, AR, AP, total assets/liabilities, debt)
    → Calculate: DSO, DPO, inventory turns, current ratio, debt-to-equity
  → GET /api/edgar/peers?sic=XXXX&revenue=Y
    → Find peers by SIC code + revenue proximity
    → Fetch financials for each peer in parallel
  → POST /api/company-commentary
    → Claude generates: executive team, product segments, headwinds/tailwinds
  → All data rendered in CompanyIntelDashboard
```

### 3. AI Diagnostic
```
User clicks "Generate" → POST /api/diagnostics/generate
  → Builds prompt with: company context, process details, pain points, ERP signals
  → Claude generates structured diagnostic
  → Includes: archetype, gaps, AI applicability, priority areas
  → Saved to engagement, displayed in HypothesisPageClient
```

### 4. Maturity Assessment
```
User rates step → State update in WorkflowPageClient
  → Pipeline strip updates (maturity ring color)
  → Scorecard recalculates (score, status, priority gaps)
  → If engagement loaded: auto-save to localStorage via updateMaturityRatings()
```

### 5. AI Copilot
```
User sends message → POST /api/chat
  → System prompt includes: all workflows, all vendors, function registry
  → Claude streams response (Vercel AI SDK)
  → Rendered with inline markdown
```

## API Inventory

| Endpoint | Method | Purpose | Model | Rate Limit | Max Tokens |
|----------|--------|---------|-------|------------|------------|
| `/api/chat` | POST | AI copilot streaming | Claude Sonnet 4 | 20/min/IP | 1024 |
| `/api/search` | POST | Semantic step search | Claude Sonnet 4 | 30/min/IP | 300 |
| `/api/workflows/generate` | POST | AI workflow generation | Claude Sonnet 4 | 10/hr/IP | 6000 |
| `/api/diagnostics/generate` | POST | Company diagnostic | Claude Sonnet 4 | 10/hr/IP | 4000 |
| `/api/edgar/companies` | GET | SEC company search | — | — | — |
| `/api/edgar/financials` | GET | SEC financial data | — | — | — |
| `/api/edgar/peers` | GET | SIC-based peer lookup | — | — | — |
| `/api/company-commentary` | POST | Executive/market intel | Claude Sonnet 4 | 10/hr/IP | 2000 |

## Type System Map

```
types/
├── engagement.ts
│   ├── Engagement              # Root engagement object
│   ├── ClientContext           # Company info (name, industry, size, ERP, etc.)
│   ├── ProcessAssessment       # Per-process workflow + ratings
│   ├── ProcessDetails          # Intake answers (team size, pain points)
│   └── SavingsAssumptions      # Editable ROI assumptions
│
├── diagnostic.ts
│   ├── CompanyDiagnostic       # Full AI diagnostic output
│   ├── CompanyIntel            # Intelligence dashboard data
│   ├── FinancialProfile        # Revenue, margins, expenses, balance sheet
│   ├── BalanceSheetSnapshot    # Cash, AR, AP, assets, liabilities, debt
│   ├── DerivedMetrics          # DSO, DPO, inventory turns, ratios
│   ├── LeadershipProfile       # Executive team (from LLM)
│   ├── CompanyCommentary       # Product segments, headwinds/tailwinds (from LLM)
│   └── PeerComparisonSet       # Peer financials for comparison
│
├── workflow.ts
│   ├── Workflow                # Process workflow container
│   ├── WorkflowStep            # Individual step with AI insights
│   └── MaturityLevel/Rating    # Manual / Semi-Auto / Automated
│
├── findings.ts
│   ├── ProcessFindings         # Step-level savings estimates
│   ├── Finding                 # Individual recommendation
│   └── StepSavingsEstimate     # $ and % impact per step
│
├── tool.ts
│   ├── Tool / VendorTool       # Vendor with fit scores, pricing, capabilities
│   └── ERPIntegration          # ERP compatibility data
│
└── function.ts
    ├── FunctionId              # "finance" | "gtm" | "rnd" | "hr" | "legal"
    ├── Function                # Business function definition
    └── ProcessMeta             # Process metadata within a function
```

## EDGAR Pipeline

SEC EDGAR provides free access to public company financial data via XBRL APIs.

### CIK Lookup
```
GET https://efts.sec.gov/LATEST/search-index?q={query}&dateRange=custom&startdt=2020-01-01
→ Returns CIK (Central Index Key) for company
→ Also: GET company-tickers.json for ticker→CIK mapping
```

### Financial Facts
```
GET https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json
→ Returns ALL reported XBRL facts across all filings
→ We extract from "us-gaap" and "dei" taxonomies
```

### Key Extraction Rules
1. **Duration values** (revenue, expenses): Filter `form: "10-K"`, group by `end` date's calendar year (NOT `fy` — fiscal year trap)
2. **Instant values** (balance sheet): Filter `form: "10-K"`, take values at fiscal year end dates
3. **Multi-year**: 10-K contains 3 years of comparative data — all tagged same `fy`. Must deduplicate by `end` date.

### XBRL Concepts Used
| Metric | XBRL Concept | Type |
|--------|-------------|------|
| Revenue | `Revenues`, `RevenueFromContractWithCustomerExcludingAssessedTax` | Duration |
| COGS | `CostOfGoodsAndServicesSold`, `CostOfRevenue` | Duration |
| R&D | `ResearchAndDevelopmentExpense` | Duration |
| S&M | `SellingAndMarketingExpense`, `SellingGeneralAndAdministrativeExpense` | Duration |
| G&A | `GeneralAndAdministrativeExpense` | Duration |
| Employees | `EntityCommonStockSharesOutstanding` (DEI) | Instant |
| Cash | `CashAndCashEquivalentsAtCarryingValue` | Instant |
| AR | `AccountsReceivableNetCurrent` | Instant |
| AP | `AccountsPayableCurrent` | Instant |
| Total Assets | `Assets` | Instant |
| Total Liabilities | `Liabilities` | Instant |
| Long-term Debt | `LongTermDebt` | Instant |
| Inventory | `InventoryNet` | Instant |

## LLM Integration Pattern

All Claude API calls follow this pattern:
1. **Build context** — Gather all relevant data (company profile, process details, ERP info)
2. **Construct prompt** — System prompt with data + instructions for structured JSON output
3. **Call Claude** — Via Anthropic SDK (direct) or Vercel AI SDK (streaming)
4. **Parse response** — JSON.parse for structured, stream for chat
5. **Validate** — Check required fields, apply defaults
6. **Cache/persist** — Store with engagement in localStorage

### Cost Controls
- All generation uses Claude Sonnet (not Opus) — ~$3/M input, ~$15/M output tokens
- Per-route rate limiting (in-memory, per IP)
- Conservative max_tokens per route
- 5-minute server-side cache on search results
- Company commentary cached with engagement (no re-fetch on page revisit)

## Security

- **API Key**: `ANTHROPIC_API_KEY` in `.env.local` (gitignored)
- **EDGAR**: Free government API, no authentication required
- **Rate Limiting**: All AI endpoints rate-limited per IP
- **No PII stored**: Engagement data is company-level, not individual
- **Client-side only**: No database, no server-side user data

## Known Audit Issues

```
4 high severity vulnerabilities (npm audit, Feb 2026):
- glob 10.2-10.4: CLI command injection (via @next/eslint-plugin-next)
- next 10.0-15.5: Image Optimizer DoS, HTTP deserialization DoS
Fix requires Next.js 16 (breaking change) — deferred to major upgrade
```
