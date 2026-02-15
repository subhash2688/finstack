/**
 * Appendix Slides
 */

import type PptxGenJS from "pptxgenjs";
import { Engagement } from "@/types/engagement";
import { ProcessFindings } from "@/types/findings";
import {
  COLORS,
  SLIDE,
  addFooter,
  addTitle,
  addSectionDivider,
  addInsightBox,
  formatCurrency,
  formatPercent,
  MATURITY_LABELS,
  makeHeaderRow,
  makeDataRow,
} from "../alix-theme";

export function buildAppendixSlides(
  pptx: PptxGenJS,
  engagement: Engagement,
  allFindings: ProcessFindings[],
  _depth: "summary" | "detailed",
  pageCounter: { current: number },
  confidential: boolean
): void {
  const companyName = engagement.clientContext.companyName;

  addSectionDivider(pptx, 8, "Appendix");

  // ── Full savings tables per process ──
  for (const findings of allFindings) {
    if (findings.stepEstimates.length === 0) continue;

    const slide = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide, `${findings.processName} — Full Savings Detail`,
      `Team: ${findings.teamSize} FTEs  |  Cost/Person: ${formatCurrency(findings.costPerPerson)}/yr  |  ${findings.assessedStepCount}/${findings.totalStepCount} steps assessed`);
    addFooter(slide, pageCounter.current, companyName, confidential);

    const rows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["#", "Step", "Maturity", "Weight", "Auto %", "Low", "Mid", "High"]),
    ];

    findings.stepEstimates.forEach((step, i) => {
      rows.push(makeDataRow([
        { text: String(step.stepNumber), opts: { align: "center" as const } },
        step.stepTitle,
        { text: MATURITY_LABELS[step.maturity] || step.maturity, opts: { bold: true } },
        { text: formatPercent(step.capacityWeight * 100), opts: { align: "right" as const } },
        { text: formatPercent(step.automationPotential * 100), opts: { align: "right" as const } },
        { text: formatCurrency(step.savings.low), opts: { align: "right" as const } },
        { text: formatCurrency(step.savings.mid), opts: { align: "right" as const, bold: true } },
        { text: formatCurrency(step.savings.high), opts: { align: "right" as const } },
      ], i));
    });

    // Total row
    rows.push(makeDataRow([
      "", { text: "TOTAL", opts: { bold: true } }, "", "", "",
      { text: formatCurrency(findings.totalSavings.low), opts: { align: "right" as const, bold: true } },
      { text: formatCurrency(findings.totalSavings.mid), opts: { align: "right" as const, bold: true, color: COLORS.primaryGreen } },
      { text: formatCurrency(findings.totalSavings.high), opts: { align: "right" as const, bold: true } },
    ], findings.stepEstimates.length));

    slide.addTable(rows, {
      x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth,
      colW: [0.4, 3.0, 1.2, 0.9, 0.9, 1.4, 1.6, 2.43], fontSize: 9,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });

    // Tool cost note
    if (findings.estimatedToolCost) {
      const tcNote = `Estimated annual tool cost for ${findings.processName}: ${formatCurrency(findings.estimatedToolCost.low)} – ${formatCurrency(findings.estimatedToolCost.high)}`;
      slide.addText(tcNote, {
        x: SLIDE.marginLeft, y: 6.3, w: SLIDE.contentWidth, h: 0.25,
        fontSize: 8, color: COLORS.textGray, italic: true,
      });
    }
  }

  // ── Data Sources ──
  const slide2 = pptx.addSlide();
  pageCounter.current++;
  addTitle(slide2, "Data Sources & Methodology", "Transparency in data provenance");
  addFooter(slide2, pageCounter.current, companyName, confidential);

  const sources = [
    { source: "SEC EDGAR", badge: "Primary", description: "Financial statements from 10-K filings for public companies — revenue, margins, balance sheet, and derived efficiency metrics." },
    { source: "Derived from SEC Filings", badge: "Calculated", description: "Computed metrics: DSO, DPO, inventory turns, current ratio, debt-to-equity from raw EDGAR data points." },
    { source: "AI Analysis (Claude)", badge: "AI-Generated", description: "Executive team profiles, company commentary, market positioning, and qualitative insights. Should be independently verified." },
    { source: "User Provided", badge: "Manual Input", description: "Company profile, process context, team sizes, ERP system, maturity assessments from engagement intake and assessment steps." },
    { source: "Savings Calculator", badge: "Modeled", description: "ROI estimates using: Savings = Team Size × Capacity Weight × Automation Potential × Cost Per Person, with configurable assumptions." },
  ];

  const srcRows: PptxGenJS.TableRow[] = [makeHeaderRow(["Source", "Type", "Description"])];
  sources.forEach((s, i) => {
    srcRows.push(makeDataRow([
      { text: s.source, opts: { bold: true } },
      { text: s.badge, opts: { bold: true, color: COLORS.primaryGreen } },
      s.description,
    ], i));
  });

  slide2.addTable(srcRows, {
    x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth,
    colW: [2.5, 1.3, 8.03], fontSize: 10,
    border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
  });

  // Final disclaimer
  addInsightBox(slide2, SLIDE.marginLeft, 4.8, SLIDE.contentWidth, 1.2,
    "This assessment is based on data available at the time of analysis. Financial projections and savings estimates are indicative " +
    "and should not be construed as guarantees. Actual results may vary based on implementation approach, organizational readiness, " +
    "and market conditions. All AI-generated content should be independently verified against authoritative sources.",
    "Legal Disclaimer"
  );
}
