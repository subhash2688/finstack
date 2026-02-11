# Lighthouse — Product Requirements Document

> **Version**: 1.0 (v1 Complete)
> **Last updated**: February 2026
> **Status**: Shipped

---

## 1. Vision & Strategy

Lighthouse is a proprietary AI-powered process intelligence platform built for management consultants specializing in enterprise transformation. The platform maps enterprise workflows at the step level, scores AI automation opportunity, assesses organizational maturity, and matches vendors to process gaps — compressing weeks of manual discovery into minutes.

**Core thesis**: *Choose tools AFTER understanding processes, not before.* Lighthouse inverts the typical vendor-first approach by starting with AI-mapped process diagnostics, surfacing automation gaps, and only then recommending vendors grounded in step-level fit scores.

**Target users**:
- **Engagement teams** — Use during client discovery to compress weeks of process mapping into a single diagnostic session
- **Practice leaders** — Standardize the diagnostic methodology across teams and engagements

---

## 2. Platform Overview

### 2.1 Data Coverage (v1)

| Dimension | Count | Detail |
|-----------|-------|--------|
| Business functions | 5 | Finance, Go-To-Market, R&D, HR, Legal |
| Processes mapped | 32 | 3 active (AP, AR, FP&A), 29 coming soon |
| Workflow steps | 30 | 10 per active process, each with AI impact analysis |
| Vendors profiled | 63 | AP: 28, AR: 20, FP&A: 15 |
| Step-level fit scores | 630+ | Each vendor scored per workflow step (0-100) |
| AI models | 1 | Claude Sonnet 4 (semantic search, chat, workflow generation) |

### 2.2 Page Map

| Route | Page | Purpose |
|-------|------|---------|
| `/` | Homepage | Platform introduction, thesis, CTAs |
| `/dashboard` | Function Hub | Browse all 5 functions, click into active processes |
| `/{processId}` | Process Explorer | Pipeline strip, step details, maturity assessment, vendor landscape |
| `/{processId}?step={stepId}` | Step Focus | Deep-links to a specific workflow step |
| `/vendors/{id}` | Vendor Profile | Full vendor detail (scores, pricing, deployment, integrations) |
| `/vendors/compare?ids=...&category=...` | Vendor Comparison | Side-by-side vendor evaluation (up to 3) |
| `/engagements` | Engagement List | All saved client engagements |
| `/engagements/new` | New Engagement | Client context form + AI workflow generation |
| `/engagements/{id}` | Engagement Workspace | Multi-process assessment hub |
| `/engagements/{id}/edit` | Engagement Editor | Edit custom workflow steps |

---

## 3. Feature Specifications

### 3.1 Homepage (`/`)

The homepage establishes the platform thesis and funnels users into two primary paths: structured exploration (dashboard) or client engagement creation.

**Sections (top to bottom)**:

1. **Hero**: Green accent bar, grid-pattern overlay. Two badges ("Proprietary Platform", "AI-Powered"). Headline: *"AI-powered process intelligence for enterprise transformation."* Two CTAs: "Launch Platform" → `/dashboard`, "Start Client Engagement" → `/engagements/new`.

2. **AI Thesis** (dark section): Black background with glowing green orb effect. Explains the "diagnose first, recommend second" methodology. Three pillars: AI-mapped workflows → maturity scoring → vendor selection.

3. **How It Works** (3-step cards):
   - Step 1: AI-Mapped Process Workflows — Decomposes processes into assessable steps with AI insights
   - Step 2: Inline Maturity Assessment — Rate each step (Manual / Semi-Auto / Automated) for instant scorecard
   - Step 3: Intelligent Vendor Matching — Maps vendors to gaps with per-step capability scores

4. **Function Coverage Grid** (6 cards): Finance (active, green accent, links to processes), GTM / R&D / HR / Legal (grayed out, "Coming Soon"). Each card has a custom SVG illustration and process count.

5. **Why Lighthouse** (3 value props): AI-Native Intelligence, Proprietary Methodology, Instant Client Delivery.

6. **Built For** (2 audience cards): Engagement Teams, Practice Leaders.

7. **Final CTA** (dark section): Repeats hero CTAs. "Internal use only" badge.

---

### 3.2 Function Hub / Dashboard (`/dashboard`)

Grid of 5 function cards. Each card displays:

- Custom SVG illustration (invoice icon for Finance, pipeline chart for GTM, microscope for R&D, people graph for HR, scales for Legal)
- Function name, description
- **Process list** grouped by sub-function (e.g., GTM → "Sales" group, "Marketing" group):
  - **Active processes**: Green clickable badges linking to `/{processId}`
  - **Coming soon processes**: Gray disabled badges
- Footer: "X of Y live" count or "Coming Soon" label

**Active processes (v1)**: Accounts Payable (`/ap`), Accounts Receivable (`/ar`), FP&A (`/fpa`)

---

### 3.3 Process Explorer (`/{processId}`)

The core product surface. A 2-tab layout that combines workflow exploration, maturity assessment, and vendor evaluation in a single view.

**URL parameters**:
- `?step={stepId}` — Pre-selects a step
- `?tab=explore|vendors` — Switches tabs
- `?engagement={id}` — Loads saved engagement context (enables auto-save)

#### 3.3.1 Engagement Context Banner

Appears when `?engagement={id}` is present. Shows engagement name, client metadata (industry, company size), and action buttons ("Edit Workflow" for full engagements, "Delete" trash icon). Green-tinted background.

#### 3.3.2 Tab 1: Process Explorer

**A. Summary Stats Bar** (gray background, 4 metrics):
- Total process steps
- Total tools mapped
- Average AI impact level (High / Medium / Low)
- Rated count (e.g., "3/10 Rated") — only shown if any steps are rated

**B. Semantic Search Bar**:
- Text input with 300ms debounce
- Placeholder: *"Describe your AP challenge (e.g., 'we spend too much time on vendor disputes')"*
- Calls `/api/search` with the query + current workflow steps
- Returns up to 3 matched steps with confidence scores (0-100)
- Results shown as colored badge pills:
  - Green (>80%): High confidence match
  - Yellow (>60%): Medium confidence
  - Gray (<60%): Low confidence
- Clicking a badge selects the matched step
- **Fallback**: If API fails, falls back to keyword-based local search (no error shown to user)

**C. Pipeline Strip** (horizontal scrollable):
- Each step rendered as a circle with:
  - Step number (1-10)
  - **Maturity ring** (if rated): Red = Manual, Yellow = Semi-Auto, Green = Automated
  - **Dot indicator**: Shows maturity color if rated, or AI impact color if unrated (green = high, yellow = medium, gray = low)
  - Abbreviation label below (e.g., "Capture", "Validate", "Match")
  - Arrow connectors between steps
- Click step → selects it → scrolls to step detail panel
- Active step has highlighted/elevated styling

**D. Maturity Scorecard** (compact inline, appears after first rating):
- **Header** (green gradient):
  - Large percentage score (e.g., "33%")
  - Breakdown: Manual count (red), Semi-Auto count (yellow), Automated count (green)
  - Status label: "Largely Manual" (0-34%) / "Partially Automated" (35-69%) / "Well Automated" (70-100%)
- **Priority Gaps**: Top 3 manual steps with high AI impact, shown as inline badges
- **"Save as Engagement" button**: Opens SaveEngagementDialog to create a lightweight engagement

**E. Step Detail Panel** (shown when a step is selected):

The detail panel is the richest information surface in the product. Sections from top to bottom:

1. **Step Header**: Step number + title (e.g., *"1. Invoice Receipt & Capture"*), description paragraph

2. **Maturity Rating Buttons**: Three colored pills — Manual (red) / Semi-Auto (yellow) / Automated (green). Click to rate. Selected state shows filled background. Rating immediately updates the pipeline strip and scorecard. If engagement is loaded, auto-saves via `updateMaturityRatings()`.

3. **AI Impact Badge**: Shows the step's automation opportunity — "High Leverage" (flame icon, red-orange), "Strong Leverage" (zap icon, yellow), or "Moderate Leverage" (check icon, green). Based on `aiOpportunity.impact` field.

4. **Step Insight Panel** (green-bordered card):
   - **Why It Matters**: Business context for the step (e.g., *"Invoice capture is the highest-volume manual task in AP — errors here cascade downstream"*)
   - **Typical Pain**: Common challenges (e.g., *"Manual data entry from PDFs and emails, 5-15 min per invoice"*)
   - **AI Impact Verdict**: Expert assessment (e.g., *"AI capture eliminates 85%+ of manual data entry with 95%+ accuracy"*)
   - **Intensity**: Fire / Strong / Moderate indicator

5. **Before/After Cards** (2-column grid):
   - **Red card** ("Today (Manual)"): Current-state pain description
   - **Green card** ("With AI"): Automated future-state description

6. **Impact Metrics** (4-column grid, each with icon):
   - Time Savings (e.g., "85% reduction")
   - Error Reduction (e.g., "90% fewer errors")
   - Cost Impact (e.g., "$3-5 saved per invoice")
   - Throughput (e.g., "10x more invoices/day")

7. **Pain Points**: Row of outline badges listing common challenges

8. **Vendor Recommendations** (`StepToolSection`):
   - Section title: *"Vendors for {Step Name}"*
   - Context sentence (from `toolContextSentence` field)
   - Up to 3 vendor cards, sorted by fit score for this step (highest first):
     - Vendor name + product name
     - AI maturity badge (AI-Native / AI-Enabled / Traditional)
     - Fit score number + grade badge (Best Fit 80+ / Good Fit 50-79 / Limited <50)
     - Tagline
     - Top 3 key features (bullet list)
     - "View Profile" link → `/vendors/{id}`

9. **Consultant Takeaway** (bottom callout, green left border): AI-generated consulting insight summarizing the step's strategic importance

#### 3.3.3 Tab 2: Vendor Landscape

Embeds the full `VendorLandscapeClient` component (detailed in section 3.5.1).

---

### 3.4 Step Detail Page (`/{processId}/{step}`)

**Redirect only** — immediately redirects to `/{processId}?step={step}` to maintain the single-page Process Explorer UX. No standalone step page.

---

### 3.5 Vendor System

#### 3.5.1 Vendor Landscape / Heatmap

Accessed via the "Vendor Landscape" tab on process pages, or as a standalone component.

**Controls**:
- **Search bar**: Filters vendors by name, company, or tagline (client-side)
- **AI Maturity filter**: Toggle badges for AI-Native / AI-Enabled / Traditional (shows count per category, click to toggle)

**Legend** (color key):
- Best Fit (80+): Emerald green
- Good Fit (50-79): Amber
- Limited (<50): Gray
- Not Covered: White with border

**Heatmap Table** (custom CSS grid):
- **Columns**: Vendor name (sticky) | Overall Score | 10 step columns (abbreviated headers) | Compare checkbox
- **Rows**: One per vendor, sorted by overall fit score (descending)
- **Cells**: Step-specific fit score (0-100) with background color intensity matching grade
- **Hover on cell**: Tooltip shows vendor's detailed verdict for that step
- **Click cell**: Navigates to vendor profile `#capabilities` section
- **Compare checkbox**: Select up to 3 vendors for comparison

**Comparison Bar** (sticky footer, appears when 1+ vendors selected):
- Selected vendor names as removable pills (max 3)
- "Clear" button
- "Compare" button → `/vendors/compare?ids={id1},{id2}&category={category}`

#### 3.5.2 Vendor Profile (`/vendors/{id}`)

Full-page vendor detail. Sections:

1. **Header**:
   - Vendor name (h1), AI maturity badge, tagline
   - Metadata row: Company name, founded year, headquarters, employee count (with icons)
   - Overall fit score (large number) + fit grade badge
   - Website button (external link)

2. **Product Overview**:
   - Description paragraph
   - 2-column grid: Key Features (bulleted list) + Target Customers (company sizes as badges, industries list)

3. **Workflow Capabilities** (anchor: `#capabilities`):
   - Grid of 10 step cards (one per workflow step)
   - Each card: Step name, fit score with color-coded progress bar, step verdict text

4. **Adoption & Market Position** (conditional — only shown if data exists):
   - Customer count, revenue, YoY growth, G2 rating (star icon), Gartner position, notable customers (badge list)

5. **Deployment Complexity**:
   - Timeline (e.g., "4-6 weeks"), effort level (Low/Medium/High with color), IT requirement (Yes/No badge)
   - Data migration notes, change management notes, requirements list

6. **Pricing**:
   - Pricing model, starting price, notes

7. **Integrations**:
   - Badge cloud of supported systems (e.g., "SAP", "NetSuite", "Salesforce")

#### 3.5.3 Vendor Comparison (`/vendors/compare`)

URL: `/vendors/compare?ids={id1},{id2},{id3}&category={category}`

Side-by-side comparison of 2-3 vendors across all dimensions:

- **Overview**: Name + tagline, AI maturity, overall fit scores, target company sizes, company info
- **Pricing**: Model, starting price, notes (per vendor column)
- **Key Features**: Feature list per vendor
- **Workflow Capabilities**: Step-by-step fit score grid with color-coded bars
- **Deployment**: Timeline, effort level, IT requirements
- **Adoption Metrics**: Customer count, revenue, G2 ratings, notable customers

Layout: First column = attribute labels, subsequent columns = one per vendor.

---

### 3.6 Engagement System

#### 3.6.1 Engagement Types

| Type | Created from | Has AI-generated workflow? | Use case |
|------|-------------|--------------------------|----------|
| **Full** | `/engagements/new` form | Yes | Deep client assessment with custom workflow |
| **Lightweight** | "Save as Engagement" button on Process Explorer | No (uses standard workflow) | Quick save of maturity ratings during exploration |

#### 3.6.2 Engagement List (`/engagements`)

- Header: "ENGAGEMENTS" title, "New Engagement" button
- **Empty state**: Briefcase icon, "No engagements yet" message, CTA button
- **Engagement cards** (grid): Each shows name, company + industry + size metadata, "Quick Assessment" badge (if lightweight), actions (Present / Edit / Delete), stats row (steps count, ERP, created date)
- **"Present" button**: Opens `/{processId}?engagement={id}` — loads the engagement into the Process Explorer with auto-save enabled

#### 3.6.3 New Engagement Form (`/engagements/new`)

Form fields:
1. **Company Name** (required, text)
2. **Industry** (required, dropdown): Technology, Manufacturing, Healthcare, Professional Services, Retail, Financial Services, E-commerce, Other
3. **Company Size** (required, visual button group): Startup / SMB / Mid-Market / Enterprise
4. **ERP System** (required, text): e.g., "SAP", "Oracle NetSuite", "QuickBooks"
5. **Monthly Invoice Volume** (required, dropdown): <100 / 100-500 / 500-2000 / 2000+
6. **Client Characteristics** (optional, textarea): Free-text for pain points, goals, constraints

**Submit**: Calls `/api/workflows/generate` → AI generates custom workflow (6-14 steps) + tool mappings → saves engagement → redirects to `/engagements/{id}`

#### 3.6.4 Engagement Workspace (`/engagements/{id}`)

Multi-process assessment hub:
- **Header card**: Engagement name, client context metadata (company, industry, size, ERP, volume, characteristics)
- **Process assessments grid**: Cards for each assessed process showing step count, maturity progress, score, and action buttons (Edit Workflow, View Workflow, Delete)
- **"Add Process" button** (placeholder for future multi-process support)

#### 3.6.5 Save Engagement Dialog

Triggered from the inline maturity scorecard "Save as Engagement" button:
- Fields: Engagement name (required), industry (optional), company size (optional), ERP (optional)
- Creates lightweight engagement, saves current maturity ratings
- Redirects with `?engagement={id}` to enable auto-save going forward

#### 3.6.6 Auto-Save Behavior

When an engagement is loaded via `?engagement={id}`:
- Every maturity rating change calls `updateMaturityRatings(engagementId, processId, ratings)`
- Persists to localStorage immediately
- No manual save needed — ratings survive page refresh and session changes

---

### 3.7 AI Features

#### 3.7.1 AI Copilot Chat

**Trigger**: Floating green circular button (bottom-right, Sparkles icon) with pulse animation on first load. Available on every page.

**Panel** (400px wide, max 520px tall, fixed position):
- **Header**: Green gradient, "Lighthouse AI" title, "Process & vendor intelligence" subtitle, close button
- **Message area**: Scrollable, user messages (green bubbles, right-aligned), assistant messages (gray bubbles, left-aligned with inline markdown rendering)
- **Input**: Text input + send button, disabled while loading

**Starter prompts** (shown when conversation is empty):
1. "What AP vendors handle PO matching?"
2. "Compare Anaplan vs Pigment for forecasting"
3. "Which AR steps have the highest AI impact?"
4. "What are the key FP&A workflow steps?"

**Context awareness**: Extracts `currentProcessId` from URL path (e.g., `/ap` → copilot prioritizes AP data). Cross-process questions still answered.

**Grounding**: System prompt includes serialized summaries of all workflows (step names, IDs, AI impact levels), all vendors (name, category, fit score, AI maturity, pricing, top features), and the function registry. Model instructed to cite specific scores, link to platform pages, and decline questions outside its data.

**Streaming**: Responses stream word-by-word via `ReadableStream` for responsive UX. Loading state shows animated dots.

**Error handling**: Error messages shown inline with "Retry" button. Abort controller cancels in-flight requests.

**Backend** (`/api/chat`):
- Model: Claude Sonnet 4, max 1024 output tokens, temperature 0.3
- Rate limit: 20 messages/min per IP
- Uses Vercel AI SDK `streamText` + `@ai-sdk/anthropic` provider

#### 3.7.2 Semantic Search

- Lives inside the Process Explorer tab
- Natural language input → Claude maps to workflow steps with confidence scores
- Results as clickable colored badges (green >80%, yellow >60%, gray <60%)
- 300ms debounce, abort controller for in-flight requests
- 5-minute server-side cache (identical queries avoid repeat API calls)
- Graceful fallback to keyword search if API fails

**Backend** (`/api/search`):
- Model: Claude Sonnet 4, max 300 tokens, temperature 0
- Rate limit: 30 requests/min per IP
- Returns max 3 matches with confidence > 0.5

#### 3.7.3 AI Workflow Generation

- Triggered from `/engagements/new` form submission
- Generates custom workflow (6-14 steps) tailored to client context + tool mappings
- Uses hypothesis language ("This step typically..." not "You must...")

**Backend** (`/api/workflows/generate`):
- Model: Claude Sonnet 4, max 6000 tokens, temperature 0.3
- Rate limit: 10 requests/hour per IP (strictest — most expensive call)
- Retry: 1 retry with 1-second backoff (server errors only)

---

### 3.8 Navigation / Sidebar

**Collapsed state** (64px rail):
- Lighthouse icon mark (green)
- Function icons (DollarSign, TrendingUp, Microscope, Users, Scale) — green if function has active processes, gray otherwise
- Tooltip on hover with function name
- Divider
- "+" icon (new engagement)
- Top 3 engagement icons (Briefcase, green if active)

**Expanded state** (288px):
- Lighthouse icon + "Lighthouse" wordmark + collapse button
- **EXPLORE section**: Collapsible accordion per function. Expanded shows process list — active processes are clickable green links, coming-soon processes show gray text + italic "coming soon" label. Processes grouped by sub-function (e.g., "Sales", "Marketing") where applicable.
- **ENGAGEMENTS section**: "+" button for new engagement. Lists saved engagements with company name and process count. Empty state: "No engagements yet".

---

## 4. Data Model

### 4.1 Workflow

```
Workflow {
  id: "ap" | "ar" | "fpa"
  name: string
  functionId: FunctionId
  processId: string
  steps: WorkflowStep[]
}

WorkflowStep {
  id: string                    // e.g., "invoice-capture"
  title: string                 // e.g., "Invoice Receipt & Capture"
  description: string
  stepNumber: number            // 1-10
  abbreviation: string          // e.g., "Capture"
  aiOpportunity: {
    impact: "high" | "medium" | "low"
    description: string
  }
  painPoints: string[]
  beforeAfter: { before: string, after: string }
  impactMetrics: {
    timeSavings: string
    errorReduction: string
    costImpact: string
    throughput: string
  }
  insight: {
    whyItMatters: string
    typicalPain: string
    aiImpactVerdict: string
    aiImpactIntensity: "fire" | "strong" | "moderate"
  }
  toolContextSentence: string
}
```

### 4.2 Tool (Vendor)

```
Tool {
  id: string                    // e.g., "stampli"
  name: string                  // Product name
  vendor: string                // Company name
  category: "ap" | "ar" | "fpa" | "close"
  aiMaturity: "ai-native" | "ai-enabled" | "traditional"
  companySizes: CompanySize[]
  industries: string[]
  painPoints: string[]
  integrations: string[]
  pricing: { model, startingPrice?, notes? }
  keyFeatures: string[]
  workflowSteps: string[]       // Step IDs this tool covers
  tagline: string
  description: string
  website?: string
  overallFitScore?: number      // 0-100
  fitScores?: [{ stepId, score: 0-100, grade }]
  stepVerdicts?: [{ stepId, verdict: string }]
  adoptionMetrics?: { customerCount, revenue, yoyGrowth, g2Rating, gartnerPosition, notableCustomers }
  deploymentComplexity?: { typicalTimeline, effortLevel, requiresIt, dataMigration, changeManagement, requirements }
  founded?: string
  headquarters?: string
  employeeCount?: string
}
```

**Fit grades**: Best Fit (80-100, emerald), Good Fit (50-79, amber), Limited (0-49, gray)

### 4.3 Engagement

```
Engagement {
  id: string                    // UUID
  name: string
  type?: "full" | "lightweight"
  clientContext: {
    companyName, industry, companySize, erp, monthlyInvoiceVolume, characteristics
  }
  processAssessments: [{
    functionId: FunctionId
    processId: string
    processName: string
    generatedWorkflow: WorkflowStep[]
    toolMappings: ToolMapping[]
    maturityRatings?: Record<stepId, MaturityLevel>
    score?: number
    notes?: string
  }]
  createdAt: string
  updatedAt: string
}
```

**Storage**: Browser localStorage (key: `"lighthouse:engagements"`). Automatic migration from legacy single-process format to multi-process format.

### 4.4 Function Registry

5 functions, 32 processes total:

| Function | Active Processes | Coming Soon |
|----------|-----------------|-------------|
| Finance | AP, AR, FP&A | Accounting, Payroll, Treasury, Tax |
| Go-To-Market | — | Lead Gen, Sales Ops, Sales Enablement, Customer Success, Demand Gen, Content & Brand, Marketing Ops |
| R&D | — | Product Strategy, Product Ops, User Research, SDLC, QA, DevOps, Security Eng |
| HR | — | Talent Acquisition, Onboarding, Learning & Dev, Performance Mgmt, HR Ops, Workforce Planning |
| Legal | — | Contract Mgmt, Contract Review, Compliance, IP Mgmt, Legal Ops |

---

## 5. Maturity Assessment System

### 5.1 Rating Levels

| Level | Color | Score | Description |
|-------|-------|-------|-------------|
| Manual | Red | 0 | No automation, fully human-driven |
| Semi-Automated | Yellow | 50 | Partial automation, human-in-the-loop |
| Automated | Green | 100 | Fully automated, minimal human touch |

### 5.2 User Flow

1. User navigates to Process Explorer tab
2. Selects a step from the pipeline strip
3. Clicks one of three rating buttons (Manual / Semi-Auto / Automated)
4. Pipeline strip immediately updates with maturity ring color
5. After first rating, compact scorecard appears inline
6. If engagement is loaded (`?engagement=id`), rating auto-saves to localStorage
7. If no engagement loaded, user can click "Save as Engagement" on the scorecard to persist

### 5.3 Scorecard Calculation

- **Score**: Average of all rated steps on 0-100 scale
- **Status labels**: "Largely Manual" (0-34%), "Partially Automated" (35-69%), "Well Automated" (70-100%)
- **Priority gaps**: Manual-rated steps with high AI impact, ranked by impact intensity
- **Compact mode**: Inline in Process Explorer (score + breakdown + top 3 gaps as badges)

---

## 6. Architecture

### 6.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui (button, card, badge, dialog, input, tabs, checkbox, tooltip) + Radix UI primitives |
| Icons | Lucide React |
| AI (streaming chat) | Vercel AI SDK v6 (`ai` + `@ai-sdk/anthropic`) |
| AI (search, generation) | `@anthropic-ai/sdk` direct API |
| Data | Static JSON imports (workflows, tools) |
| Storage | Browser localStorage (engagements) |
| Deployment | Vercel-optimized |

### 6.2 API Routes

| Endpoint | Method | Purpose | Model | Rate Limit | Max Tokens |
|----------|--------|---------|-------|------------|------------|
| `/api/chat` | POST | AI copilot streaming | Sonnet 4 | 20/min | 1024 |
| `/api/search` | POST | Semantic step search | Sonnet 4 | 30/min | 300 |
| `/api/workflows/generate` | POST | AI workflow generation | Sonnet 4 | 10/hour | 6000 |

### 6.3 Cost Controls

- **Rate limiting**: Per-IP, in-memory tracking per route
- **Model choice**: Sonnet (not Opus) for all AI calls
- **Token caps**: Conservative per-route maximums
- **Caching**: 5-minute TTL on search results (avoids duplicate API calls)
- **Retry policy**: Max 1 retry, 1-second backoff, only on 5xx errors (no retry on 4xx)

### 6.4 Project Structure

```
app/
  layout.tsx                    Root layout (sidebar + copilot button)
  page.tsx                      Homepage
  dashboard/page.tsx            Function hub
  [processId]/page.tsx          Process explorer (AP, AR, FP&A)
  [processId]/[step]/page.tsx   Step redirect
  vendors/[id]/page.tsx         Vendor profile
  vendors/compare/page.tsx      Vendor comparison
  engagements/page.tsx          Engagement list
  engagements/new/page.tsx      New engagement form
  engagements/[id]/page.tsx     Engagement workspace
  engagements/[id]/edit/page.tsx  Engagement editor
  api/chat/route.ts             Copilot streaming endpoint
  api/search/route.ts           Semantic search endpoint
  api/workflows/generate/route.ts  AI workflow generation

components/
  chat/          CopilotButton, CopilotPanel
  workflow/      WorkflowPageClient, PipelineStrip, StepDetailPanel,
                 MaturityScorecard, SemanticSearchBar, SummaryStatsBar,
                 StepToolSection, StepInsightPanel, ConsultantTakeaway,
                 SaveEngagementDialog, ImpactMetricCard
  vendors/       VendorLandscapeClient, VendorHeatmap, VendorProfileClient,
                 VendorComparisonClient, ComparisonBar
  tools/         ToolCard, ToolGrid, ToolDetailModal, ToolFilters, FitScoreBadge
  engagement/    EngagementList, NewEngagementForm, EngagementWorkspace,
                 EngagementEditor, StepEditor
  layout/        Sidebar, Header, Footer
  ui/            shadcn/ui primitives (button, card, badge, dialog, input,
                 tabs, checkbox, tooltip, lighthouse-icon)

lib/
  ai/            anthropic-client.ts, copilot-context.ts
  data/          workflows.ts, tools.ts, tool-mapping.ts
  storage/       engagements.ts

data/
  workflows/     ap-workflow.json, ar-workflow.json, fpa-workflow.json
  tools/         ap-tools.json, ar-tools.json, fpa-tools.json

types/           workflow.ts, tool.ts, function.ts, engagement.ts
```

---

## 7. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | API key for Claude (chat, search, generation) |

---

## 8. Roadmap

### v1 (Shipped)
- Process Explorer with 2-tab layout (AP, AR, FP&A)
- 30 workflow steps with AI impact analysis, pain points, before/after, metrics
- 63 vendor profiles with 630+ step-level fit scores
- Vendor heatmap, profiles, and side-by-side comparison
- Inline maturity assessment with auto-save
- Full + lightweight engagement management
- AI workflow generation from client context
- Semantic search across workflow steps
- AI Copilot floating chat (streaming, context-aware, grounded)
- Collapsible sidebar with function/engagement navigation
- 5 functions mapped (32 processes, 3 active)

### v2 (Planned)
- Additional Finance processes (Accounting, Payroll, Treasury, Tax)
- Go-To-Market function activation (Lead Gen, Sales Ops)
- Export to PDF / PowerPoint for client deliverables
- Multi-user collaboration (shared engagements)
- Copilot with tool-use (trigger searches, create engagements via chat)
- Engagement comparison (before/after across time)

### v3 (Future)
- Custom vendor database integration (import client's own vendor data)
- ROI calculator tied to maturity gaps
- Implementation timeline generator
- Client-facing portal (read-only view for clients)
- R&D and HR function activation
