# Product Backlog — Sprint Assigned

> **Last updated**: February 2026
> **Sprint model**: 2-week sprints, story points (1/2/3/5/8/13)
> **Status**: `todo` → `in-progress` → `done`

---

## Sprint 0: Cleanup & Documentation (Current)

| # | Story | Points | Status |
|---|-------|--------|--------|
| 0.1 | Rewrite README.md, create TECH_ARCHITECTURE.md, consolidate docs | 2 | done |
| 0.2 | Run npm audit, document results | 1 | done |
| 0.3 | Delete orphaned components (CompanyIntelligenceBrief, OperationalMetrics, PeerBenchmark, CompetitivePosition) | 1 | done |
| 0.4 | Update CLAUDE.md with new architecture decisions | 1 | done |

**Sprint total**: 5 points

---

## Sprint 1: Homepage Redesign — Two Paths

| # | Story | Points | Status |
|---|-------|--------|--------|
| 1.1 | Rewrite homepage with two-path hub (Engagements vs Process Explorer) | 5 | todo |
| 1.2 | Create /explore route, redirect /dashboard → /explore | 3 | todo |
| 1.3 | Update Sidebar — add Home link, rename sections | 2 | todo |
| 1.4 | Create PathCard.tsx + RecentEngagements.tsx components | 3 | todo |

**Sprint total**: 13 points

---

## Sprint 3: Company Intelligence Overhaul (runs before Sprint 2)

| # | Story | Points | Status |
|---|-------|--------|--------|
| 3.1 | EDGAR balance sheet expansion — instant values + derived metrics (DSO, DPO, inventory turns, current ratio) | 8 | todo |
| 3.2 | Expense trend direction indicators in FinancialOverview | 3 | todo |
| 3.3 | Competitor comparison — SIC-based peer lookup + EDGAR financials for up to 5 peers | 13 | todo |
| 3.4 | Executive team via Claude LLM with "AI Analysis" caveat | 5 | todo |
| 3.5 | Product segments & market commentary via Claude LLM | 5 | todo |
| 3.6 | Enhanced headcount — editable functional breakdown with industry ratio guidance | 5 | todo |
| 3.7 | Update CompanyIntelDashboard layout with new sections | 3 | todo |
| 3.8 | Data source transparency badges on all data points | 2 | todo |

**Sprint total**: 44 points (likely 2-3 sprints)

---

## Sprint 2: Process Explorer as Dynamic Knowledge Base

| # | Story | Points | Status |
|---|-------|--------|--------|
| 2.1 | Create sub-sector taxonomy data (SubSectorConfig per industry) | 5 | todo |
| 2.2 | Context selectors on Explorer (Company Size + Sub-Industry pickers, URL params) | 5 | todo |
| 2.3 | Function-level tool heatmap drill-down (/explore/[functionId]) | 8 | todo |
| 2.4 | Enrich 42+ vendor entries with subSectors tags | 3 | todo |
| 2.5 | Context-aware filtering in tool data + VendorHeatmap | 5 | todo |

**Sprint total**: 26 points

---

## Sprint 4: Diagnostic Transparency & Editable ROI

| # | Story | Points | Status |
|---|-------|--------|--------|
| 4.1 | Create SavingsAssumptions type, add to Engagement | 2 | todo |
| 4.2 | Modify savings-calculator.ts to accept custom assumptions | 3 | todo |
| 4.3 | AssumptionsPanel component (collapsible, real-time recalculation) | 5 | todo |
| 4.4 | FormulaExplainer component (worked example) | 3 | todo |
| 4.5 | Show % impact alongside $ impact for every step | 3 | todo |
| 4.6 | Tool cost sizing — pricing data + net ROI display | 5 | todo |

**Sprint total**: 21 points

---

## Sprint 5: System-Aware Prompting + ERP Compatibility

| # | Story | Points | Status |
|---|-------|--------|--------|
| 5.1 | Create ERP intelligence database (ERPSignal per system) | 3 | todo |
| 5.2 | Inject ERP signals into diagnostic prompt | 3 | todo |
| 5.3 | Add ERPIntegration type to tools, enrich tool JSONs | 5 | todo |
| 5.4 | ERP-aware tool recommendation boosting + badges | 3 | todo |
| 5.5 | Enhance copilot context with assumptions + findings data | 3 | todo |

**Sprint total**: 17 points

---

## Parking Lot (Future — not sprint-assigned)

| # | Story | Description | Priority |
|---|-------|-------------|----------|
| F1 | Pain points → workflow prioritization | Feed intake pain points into LLM to reorder workflow steps | P2 |
| F2 | On-demand workflow generation from explorer | Generate tailored workflow when clicking "Explore Process" with context | P2 |
| F3 | Post-creation editing | Edit company info, process intake from engagement workspace | P1 |
| F4 | Add Process modal | Wire up "Add Process" button in EngagementWorkspace | P1 |
| F5 | Process context display | Show intake answers on process cards and workflow page | P1 |
| F6 | Expand to non-Finance functions | Enable GTM, R&D, HR, Legal as workflows are built | P2 |
| F7 | Persist form state across refresh | Save draft state to localStorage during engagement creation | P2 |
| F8 | Business performance benchmarking | Collect actual metrics (DSO, close time) and benchmark vs industry | P2 |
| F9 | Export to PDF/PowerPoint | Client deliverable generation | P2 |
| F10 | Multi-user collaboration | Shared engagements across team members | P3 |

---

## Completed

| # | Story | Sprint | Completed |
|---|-------|--------|-----------|
| 3-old | Context-aware AI diagnostic | Pre-sprint | Feb 2026 |
| 4-old | EDGAR API integration (public companies) | Pre-sprint | Feb 2026 |
| 5-old | Company financial dashboard | Pre-sprint | Feb 2026 |
| 6-old | Ticker symbol auto-lookup | Pre-sprint | Feb 2026 |
