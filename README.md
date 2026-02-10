# Lighthouse

AI-powered process intelligence platform for consultants and finance teams. Explore workflows, assess maturity, compare vendors, and get AI-powered recommendations across AP, AR, and FP&A.

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
ANTHROPIC_API_KEY=sk-ant-...
```

The API key is required for:
- AI Copilot chat (streaming responses)
- Semantic search across workflow steps
- AI-powered workflow generation for engagements

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Build

```bash
npm run build
npm start
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Radix UI |
| Icons | Lucide React |
| AI (Chat) | Vercel AI SDK + `@ai-sdk/anthropic` |
| AI (Generation) | `@anthropic-ai/sdk` |
| Storage | localStorage (client-side) |

## Project Structure

```
app/
  layout.tsx              # Root layout with sidebar + copilot
  page.tsx                # Homepage
  dashboard/              # Dashboard with function cards
  [processId]/            # Dynamic process pages (AP, AR, FP&A)
  engagements/            # Engagement CRUD
  vendors/                # Vendor profiles + comparison
  api/
    chat/route.ts         # AI copilot streaming endpoint
    search/route.ts       # Semantic search endpoint
    workflows/generate/   # AI workflow generation

components/
  chat/                   # AI copilot (CopilotButton, CopilotPanel)
  workflow/               # Process explorer components
  engagement/             # Engagement management
  tools/                  # Vendor cards, filters, modals
  vendors/                # Vendor landscape, comparison, profiles
  layout/                 # Sidebar, Footer
  ui/                     # shadcn/ui primitives

lib/
  ai/                     # AI utilities (Anthropic client, copilot context)
  data/                   # Data loaders (workflows, tools)
  storage/                # localStorage persistence

data/
  workflows/              # AP, AR, FP&A workflow JSON
  tools/                  # Vendor data JSON (AP, AR, FP&A)

types/                    # TypeScript type definitions
```

## Features

- **Process Explorer** — Visual pipeline with AI impact analysis per step
- **Maturity Assessment** — Rate steps, get a scorecard, auto-save to engagements
- **Vendor Landscape** — Heatmap, profiles, side-by-side comparison
- **AI Copilot** — Ask questions about vendors, workflows, and processes
- **Engagement Management** — Create client assessments with AI-generated workflows

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Or connect your GitHub repository to Vercel for automatic deployments.

## License

Private — all rights reserved.
