/**
 * Opportunity Areas Slides
 */

import type PptxGenJS from "pptxgenjs";
import { Engagement } from "@/types/engagement";
import { ExecutiveSummaryData, ProcessFindings } from "@/types/findings";
import {
  COLORS,
  FONTS,
  SLIDE,
  addFooter,
  addTitle,
  addSectionDivider,
  addKpiBox,
  addHeroMetric,
  addInsightBox,
  formatCurrency,
  formatSavingsRange,
  formatPercent,
  MATURITY_LABELS,
  MATURITY_COLORS,
  makeHeaderRow,
  makeDataRow,
} from "../alix-theme";
import { resolveAssumptions } from "@/lib/calculators/savings-calculator";

export function buildOpportunitiesSlides(
  pptx: PptxGenJS,
  engagement: Engagement,
  summary: ExecutiveSummaryData,
  allFindings: ProcessFindings[],
  depth: "summary" | "detailed",
  pageCounter: { current: number },
  confidential: boolean
): void {
  const companyName = engagement.clientContext.companyName;

  if (allFindings.length === 0) return;

  addSectionDivider(pptx, 5, "Opportunity Areas");

  // ── Slide 1: Hero ROI + Process Waterfall ──
  const slide1 = pptx.addSlide();
  pageCounter.current++;
  addTitle(slide1, "Return on Investment Summary", "Annual savings potential across all assessed processes");
  addFooter(slide1, pageCounter.current, companyName, confidential);

  // Hero total savings
  addHeroMetric(slide1, SLIDE.marginLeft, 1.5, 5.5,
    formatSavingsRange(summary.totalSavings.low, summary.totalSavings.high),
    "Total Addressable Annual Savings"
  );

  // Side KPIs
  if (summary.totalToolCost) {
    addKpiBox(slide1, 7.0, 1.6, 2.8, 1.0,
      formatSavingsRange(summary.totalToolCost.low, summary.totalToolCost.high),
      "Tool Investment"
    );
    const netLow = Math.max(0, summary.totalSavings.low - summary.totalToolCost.high);
    const netHigh = Math.max(0, summary.totalSavings.high - summary.totalToolCost.low);
    addKpiBox(slide1, 10.1, 1.6, 2.48, 1.0,
      formatSavingsRange(netLow, netHigh),
      "Net Annual Benefit"
    );
  }

  // Process-level waterfall table
  slide1.addText("Savings by Process", {
    x: SLIDE.marginLeft, y: 3.5, w: SLIDE.contentWidth, h: 0.35,
    fontSize: 14, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
  });

  const wfRows: PptxGenJS.TableRow[] = [
    makeHeaderRow(["Process", "Team", "Steps", "Annual Savings (Range)", "Tool Cost", "Net Benefit"]),
  ];

  allFindings.forEach((f, i) => {
    const net = f.estimatedToolCost
      ? formatSavingsRange(
          Math.max(0, f.totalSavings.low - f.estimatedToolCost.high),
          Math.max(0, f.totalSavings.high - f.estimatedToolCost.low))
      : formatSavingsRange(f.totalSavings.low, f.totalSavings.high);
    wfRows.push(makeDataRow([
      { text: f.processName, opts: { bold: true } },
      `${f.teamSize} FTEs`,
      `${f.assessedStepCount}/${f.totalStepCount}`,
      { text: formatSavingsRange(f.totalSavings.low, f.totalSavings.high), opts: { bold: true, align: "right" as const } },
      { text: f.estimatedToolCost ? formatSavingsRange(f.estimatedToolCost.low, f.estimatedToolCost.high) : "—", opts: { align: "right" as const } },
      { text: net, opts: { bold: true, color: COLORS.primaryGreen, align: "right" as const } },
    ], i));
  });

  // Total row
  const netTotal = summary.totalToolCost
    ? formatSavingsRange(
        Math.max(0, summary.totalSavings.low - summary.totalToolCost.high),
        Math.max(0, summary.totalSavings.high - summary.totalToolCost.low))
    : formatSavingsRange(summary.totalSavings.low, summary.totalSavings.high);

  wfRows.push(makeDataRow([
    { text: "TOTAL", opts: { bold: true } },
    "", "",
    { text: formatSavingsRange(summary.totalSavings.low, summary.totalSavings.high), opts: { bold: true, align: "right" as const } },
    { text: summary.totalToolCost ? formatSavingsRange(summary.totalToolCost.low, summary.totalToolCost.high) : "—", opts: { bold: true, align: "right" as const } },
    { text: netTotal, opts: { bold: true, color: COLORS.primaryGreen, align: "right" as const } },
  ], allFindings.length));

  slide1.addTable(wfRows, {
    x: SLIDE.marginLeft, y: 3.9, w: SLIDE.contentWidth,
    colW: [2.5, 1.0, 0.8, 2.8, 2.5, 2.23], fontSize: 10,
    border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
  });

  if (depth === "summary") return;

  // ── Slide 2 (Detailed): Top 10 step-level ──
  const allSteps = allFindings.flatMap((f) =>
    f.stepEstimates.map((s) => ({ ...s, processName: f.processName }))
  );
  allSteps.sort((a, b) => b.savings.mid - a.savings.mid);
  const top10 = allSteps.slice(0, 10);

  if (top10.length > 0) {
    const slide2 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide2, "Top 10 Savings Opportunities", "Ranked by annual savings potential (mid-point estimate)");
    addFooter(slide2, pageCounter.current, companyName, confidential);

    const rows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["#", "Step", "Process", "Maturity", "Impact", "Annual Savings", "Top Tool"]),
    ];

    top10.forEach((step, i) => {
      const mColor = MATURITY_COLORS[step.maturity] || COLORS.textDark;
      rows.push(makeDataRow([
        { text: String(i + 1), opts: { align: "center" as const, bold: true, color: COLORS.primaryGreen } },
        step.stepTitle,
        step.processName,
        { text: MATURITY_LABELS[step.maturity] || step.maturity, opts: { color: mColor, bold: true } },
        { text: formatPercent(step.percentImpact), opts: { align: "right" as const } },
        { text: formatSavingsRange(step.savings.low, step.savings.high), opts: { bold: true, align: "right" as const } },
        step.topTool ? step.topTool.name : "—",
      ], i));
    });

    slide2.addTable(rows, {
      x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth,
      colW: [0.5, 2.5, 1.5, 1.3, 0.9, 2.5, 2.63], fontSize: 9,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });
  }

  // ── Slide 3 (Detailed): Assumptions ──
  const slide3 = pptx.addSlide();
  pageCounter.current++;
  addTitle(slide3, "Assumptions & Methodology", "Full transparency in how savings estimates are calculated");
  addFooter(slide3, pageCounter.current, companyName, confidential);

  const assumptions = resolveAssumptions(
    engagement.clientContext.companySize,
    engagement.customAssumptions
  );

  // Formula highlight
  slide3.addShape("rect" as PptxGenJS.ShapeType, {
    x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth, h: 0.7,
    fill: { color: COLORS.lightGreen }, rectRadius: 0.06,
  });
  slide3.addText("SAVINGS FORMULA", {
    x: SLIDE.marginLeft + 0.2, y: 1.58, w: 2, h: 0.25,
    fontSize: 8, fontFace: FONTS.heading, bold: true,
    color: COLORS.primaryGreen,
  });
  slide3.addText("Savings  =  Team Size  ×  Capacity Weight  ×  Automation Potential  ×  Cost Per Person", {
    x: SLIDE.marginLeft + 0.2, y: 1.82, w: SLIDE.contentWidth - 0.4, h: 0.35,
    fontSize: 14, fontFace: FONTS.heading, bold: true, color: COLORS.textDark,
  });

  // Assumptions table
  const aRows: PptxGenJS.TableRow[] = [
    makeHeaderRow(["Parameter", "Value", "Description"]),
    makeDataRow([
      { text: "Cost per Person", opts: { bold: true } },
      { text: formatCurrency(assumptions.costPerPerson) + "/yr", opts: { bold: true, color: COLORS.primaryGreen, align: "center" as const } },
      "Fully loaded annual cost per FTE",
    ], 0),
    makeDataRow([
      { text: "Automation % (Manual)", opts: { bold: true } },
      { text: formatPercent(assumptions.automationPotential.manual * 100), opts: { bold: true, align: "center" as const } },
      "Addressable effort when step is currently manual",
    ], 1),
    makeDataRow([
      { text: "Automation % (Semi-Auto)", opts: { bold: true } },
      { text: formatPercent(assumptions.automationPotential.semiAutomated * 100), opts: { bold: true, align: "center" as const } },
      "Addressable effort when step is semi-automated",
    ], 2),
    makeDataRow([
      { text: "Automation % (Automated)", opts: { bold: true } },
      { text: formatPercent(assumptions.automationPotential.automated * 100), opts: { bold: true, align: "center" as const } },
      "Remaining improvement when already automated",
    ], 3),
    makeDataRow([
      { text: "Range Factor", opts: { bold: true } },
      { text: `±${(assumptions.rangeFactor * 100).toFixed(0)}%`, opts: { bold: true, align: "center" as const } },
      "Uncertainty range applied to mid-point estimates (low = mid×(1−factor), high = mid×(1+factor))",
    ], 4),
  ];

  slide3.addTable(aRows, {
    x: SLIDE.marginLeft, y: 2.5, w: SLIDE.contentWidth,
    colW: [2.5, 1.5, 7.83], fontSize: 10,
    border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
  });

  // Caveat
  addInsightBox(slide3, SLIDE.marginLeft, 5.4, SLIDE.contentWidth, 0.8,
    "Savings estimates represent potential capacity reallocation, not guaranteed cost reductions. " +
    "Actual results depend on implementation scope, change management, organizational readiness, " +
    "and the specific tools selected for deployment.",
    "Important Note"
  );
}
