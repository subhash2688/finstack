# Lighthouse — Product Requirements Document

## Vision

Lighthouse is an AI-powered process intelligence platform for consultants and finance teams. It provides structured exploration of business processes (AP, AR, FP&A), maturity assessments, and vendor landscape analysis — helping teams understand where AI can transform their operations and which tools best fit their needs.

## Core Features

### 1. Process Explorer
- **Workflow visualization**: 10-step pipeline strip for each process (AP, AR, FP&A)
- **Step detail panels**: AI impact analysis, pain points, before/after comparisons, impact metrics
- **Semantic search**: AI-powered search across workflow steps
- **Step insights**: Consultant-grade analysis with "why it matters" and AI impact verdicts

### 2. Maturity Assessment
- **Inline rating**: Rate each step as Manual / Semi-Automated / Automated
- **Maturity scorecard**: Visual scorecard with compact inline display
- **Auto-save**: Ratings persist when tied to an engagement
- **Lightweight saves**: Quick-save assessment without full engagement creation

### 3. Vendor Landscape
- **Heatmap view**: Vendors x Steps matrix with fit scores (0-100)
- **Vendor profiles**: Detailed pages with adoption metrics, deployment complexity, pricing
- **Vendor comparison**: Side-by-side comparison of 2-4 vendors
- **Fit scoring**: Per-step fit grades (best-fit, good-fit, limited)
- **Filtering**: By company size, industry, AI maturity, and keyword search

### 4. Engagement Management
- **Client context capture**: Company size, ERP, invoice volume, industry
- **AI workflow generation**: Claude-powered tailored workflow generation
- **Multi-process support**: Single engagement can assess AP, AR, and FP&A
- **Migration**: Automatic upgrade from legacy single-process format

### 5. AI Copilot (v1)
- **Floating chat**: Global chat bubble available on every page (bottom-right)
- **Context-aware**: Knows which process page the user is currently on
- **Grounded responses**: Answers from platform data only — workflows, vendors, processes
- **Streaming**: Word-by-word response rendering for responsive feel
- **Vendor recommendations**: Cites fit scores, pricing, and features
- **Deep links**: Links to vendor profiles and process pages in responses
- **Rate limiting**: 20 messages/min per IP to control costs
- **Starter prompts**: Suggested questions for new users

## Architecture

- **Framework**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI**: shadcn/ui + Radix UI primitives
- **Data**: Static JSON imports (workflows, tools) + localStorage (engagements)
- **AI**: Anthropic Claude API (Sonnet for balanced cost/quality)
  - Workflow generation: `@anthropic-ai/sdk` direct API
  - Semantic search: `@anthropic-ai/sdk` direct API
  - Copilot chat: Vercel AI SDK (`ai` + `@ai-sdk/anthropic`) for streaming
- **Deployment**: Vercel-optimized

## Data Model

### Workflows
3 active workflows (AP, AR, FP&A) with 8-10 steps each. Each step includes AI opportunity assessment, pain points, impact metrics, and tool context.

### Tools (Vendors)
25+ vendors across 3 categories with comprehensive data: fit scores per step, pricing, AI maturity, company size targeting, adoption metrics, and deployment complexity.

### Engagements
Client-scoped assessments with context (company, ERP, volume), AI-generated tailored workflows, tool mappings, and maturity ratings.

## Roadmap

### v1 (Current)
- Process Explorer (AP, AR, FP&A)
- Vendor Landscape with heatmap
- Maturity Assessment with auto-save
- Engagement Management
- AI Copilot (floating chat)

### v2 (Planned)
- Additional processes (Accounting, Payroll, Treasury, Tax)
- Go-To-Market and R&D functions
- Export to PDF/PowerPoint
- Multi-user collaboration
- Copilot with tool-use (trigger searches, create engagements via chat)

### v3 (Future)
- Custom vendor database integration
- ROI calculator
- Implementation timeline generator
- Client portal
