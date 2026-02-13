# Lighthouse

AI-powered process intelligence platform for management consultants. Assess client processes, generate AI diagnostics, pull real SEC financial data, and quantify automation savings across AP, AR, and FP&A.

## Quick Start

```bash
# Prerequisites: Node.js 18+, npm 9+
npm install

# Create .env.local with your Anthropic API key
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local

# Start dev server
npm run dev
# → http://localhost:3000
```

## Architecture

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Radix UI |
| Icons | Lucide React |
| AI | Anthropic Claude (Vercel AI SDK for streaming, direct SDK for generation) |
| Financial Data | SEC EDGAR (free, no API key) |
| Storage | Browser localStorage |

See [docs/TECH_ARCHITECTURE.md](docs/TECH_ARCHITECTURE.md) for full system architecture, data flows, and API inventory.

## Project Structure

```
app/
  page.tsx                     # Two-path homepage (Engagements / Explorer)
  explore/                     # Process & Tool Explorer
  engagements/                 # Engagement CRUD + assessment workflow
    [id]/hypothesis/           # AI diagnostic + company intelligence
    [id]/assessment/           # Process maturity rating
    [id]/findings/             # ROI results + recommendations
  vendors/                     # Vendor profiles + comparison
  api/
    chat/                      # AI copilot (streaming)
    diagnostics/generate/      # Company diagnostic (Claude API)
    edgar/companies/           # SEC company search
    edgar/financials/          # SEC financial data
    search/                    # Semantic workflow search
    workflows/generate/        # AI workflow generation

components/
  chat/          AI copilot panel
  diagnostic/    Company intelligence dashboard
  engagement/    Engagement workflow UI
  explore/       Explorer components
  home/          Homepage components
  layout/        Sidebar, Header, Footer
  tools/         Vendor cards & filters
  ui/            shadcn/ui primitives
  vendors/       Heatmap, comparison, profiles
  workflow/      Process pipeline, maturity assessment

lib/
  ai/            Anthropic client, diagnostic generator, copilot context
  calculators/   Savings & ROI calculations
  data/          Static data loaders, sub-sector taxonomy
  edgar/         SEC EDGAR API client
  search/        Intent mapping
  storage/       localStorage persistence

data/
  tools/         Vendor catalogs (AP, AR, FP&A) — JSON
  workflows/     Process workflows (AP, AR, FP&A) — JSON

types/           TypeScript type definitions
docs/            PRD, architecture, backlog
```

## Key Features

- **Two-Path Homepage** — Client Engagements (assess a company) or Process Explorer (browse knowledge base)
- **Process Explorer** — Visual pipeline with AI impact analysis, maturity assessment, vendor matching
- **Company Intelligence** — Real SEC EDGAR financials, derived metrics (DSO/DPO), peer comparison, AI commentary
- **AI Diagnostic** — Claude-powered analysis tailored to client context (industry, size, ERP, pain points)
- **Maturity Assessment** — Rate process steps, get scorecard, auto-save to engagements
- **Vendor Landscape** — Heatmap, profiles, side-by-side comparison across 63+ vendors
- **Transparent ROI** — Editable assumptions, formula explainer, % + $ side-by-side
- **AI Copilot** — Streaming chat grounded in platform data

## Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API for diagnostics, chat, search, generation |

## Build & Deploy

```bash
npm run build    # Production build
npm start        # Start production server
npm run lint     # ESLint check
```

Optimized for Vercel deployment. Connect your repo for automatic deploys.

## Troubleshooting

- **CSS breaks or "missing required error components"**: Delete `.next/` and restart dev server
- **`useSearchParams()` Suspense errors**: Pre-existing on some pages, does not affect functionality
- **ESLint `any` casts**: Use `// eslint-disable-line` (project doesn't have `@typescript-eslint/no-explicit-any`)

## License

Private — all rights reserved.
