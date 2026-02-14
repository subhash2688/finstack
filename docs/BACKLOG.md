# Product Backlog — Lighthouse AI Platform

> **Last updated**: February 2026
> **Sprint model**: 2-week sprints, story points (1/2/3/5/8/13)
> **Status**: `todo` → `in-progress` → `done`

---

## Sprint 6: Transcript Intelligence (Current)

| # | Story | Points | Status |
|---|-------|--------|--------|
| 6.1 | Transcript upload UI — file picker + drag-drop on engagement assessment page | 3 | todo |
| 6.2 | `/api/transcripts/analyze` — Claude-powered transcript parsing → structured findings | 8 | todo |
| 6.3 | Auto-extract: pain points, maturity signals, volumes, ERP mentions, team size, workarounds | 5 | todo |
| 6.4 | Transcript findings review panel — preview extracted insights before applying | 5 | todo |
| 6.5 | Auto-populate maturity ratings from transcript signals | 3 | todo |
| 6.6 | Evidence quotes — link each finding to source quote with timestamp | 3 | todo |
| 6.7 | Coverage tracker — show which process steps have transcript evidence vs gaps | 3 | todo |

**Sprint total**: 30 points (likely 2 sprints)

---

## Backlog (Prioritized)

| # | Story | Description | Priority |
|---|-------|-------------|----------|
| B1 | Benchmark range indicators | Visual KPI positioning vs industry ranges — horizontal track with worst/best bookends, shaded 25th-75th band, diamond marker for company value. KPIs: finance cost/revenue, AP cost/invoice, offshoring %, headcount/$B revenue, DPO, DSO, close cycle, auto-match rate | P1 |
| B2 | Context-aware copilot upgrade | Feed copilot full engagement context (financials, maturity, benchmarks, ERP, headcount). Enable consulting-quality answers with data citations | P1 |
| B3 | Auto executive summary | One-click generation of client-ready 1-page summary: company overview, benchmarks vs peers, maturity heatmap, top 3 interventions with ROI | P1 |
| B4 | Tech stack detection via job postings | Scrape LinkedIn Jobs / Greenhouse / Lever for current openings mentioning finance tools. Map to known vendor database | P2 |
| B5 | LinkedIn headcount intelligence | Finance org sizing from LinkedIn — count heads by function (AP, AR, FP&A, Treasury). Fully loaded cost model using BLS salary benchmarks x burden rate | P2 |
| B6 | Pre-engagement maturity predictor | AI estimates maturity per process step based on company size, ERP, tech stack, headcount ratios — before any interviews happen | P2 |
| B7 | Smart diagnostic questionnaire | Adaptive interview guide — AI picks next question based on previous answers, ERP context, and maturity signals | P2 |
| B8 | Vendor fit scoring with AI reasoning | AI explains WHY each tool fits: ERP integration, volume match, pain point alignment. Side-by-side comparison with trade-off analysis | P2 |
| B9 | Multi-engagement pattern recognition | Cross-engagement analytics: common bottlenecks, ERP migration impact, industry trends dashboard | P3 |
| B10 | AI interview prep | Pre-meeting brief: suggested questions based on known data, areas to probe based on diagnostic gaps, comparable case studies | P3 |

---

## Parking Lot (Legacy — Carry Forward)

| # | Story | Description | Priority |
|---|-------|-------------|----------|
| F3 | Post-creation editing | Edit company info, process intake from engagement workspace | P1 |
| F4 | Add Process modal | Wire up "Add Process" button in EngagementWorkspace | P1 |
| F6 | Expand to non-Finance functions | Enable GTM, R&D, HR, Legal as workflows are built | P2 |
| F9 | Export to PDF/PowerPoint | Client deliverable generation | P2 |
| F10 | Multi-user collaboration | Shared engagements across team members | P3 |

---

## Completed

| # | Story | Sprint | Completed |
|---|-------|--------|-----------|
| 0.1-0.4 | Cleanup & documentation | Sprint 0 | Feb 2026 |
| 1.1-1.4 | Homepage redesign — two-path hub | Sprint 1 | Feb 2026 |
| 2.1-2.5 | Process Explorer as dynamic knowledge base | Sprint 2 | Feb 2026 |
| 3.1-3.8 | Company Intelligence overhaul (EDGAR + LLM) | Sprint 3 | Feb 2026 |
| 4.1-4.6 | Diagnostic transparency & editable ROI | Sprint 4 | Feb 2026 |
| 5.1-5.5 | System-aware prompting + ERP compatibility | Sprint 5 | Feb 2026 |
| 5.6 | Competitive insights — vertical per-company chart, 10-K competitor extraction, custom ticker picker | Sprint 5.5 | Feb 2026 |
| 5.7 | SEC EDGAR rate limiter (secFetch) | Sprint 5.5 | Feb 2026 |
