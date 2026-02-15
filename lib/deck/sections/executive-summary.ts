/**
 * Executive Summary Slides
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
  makeHeaderRow,
  makeDataRow,
  MATURITY_LABELS,
} from "../alix-theme";

export function buildExecutiveSummarySlides(
  pptx: PptxGenJS,
  engagement: Engagement,
  summary: ExecutiveSummaryData,
  allFindings: ProcessFindings[],
  depth: "summary" | "detailed",
  pageCounter: { current: number },
  confidential: boolean
): void {
  const companyName = engagement.clientContext.companyName;
  const diagnostic = engagement.diagnostic;

  addSectionDivider(pptx, 1, "Executive Summary");

  // ── Slide 1: Hero metric + KPIs ──
  const slide1 = pptx.addSlide();
  pageCounter.current++;

  const subtitle = diagnostic?.companyArchetype
    ? `${companyName} — ${diagnostic.companyArchetype}`
    : companyName;
  addTitle(slide1, "Executive Summary", subtitle);
  addFooter(slide1, pageCounter.current, companyName, confidential);

  // Archetype description insight box
  if (diagnostic?.archetypeDescription) {
    addInsightBox(
      slide1, SLIDE.marginLeft, 1.5, SLIDE.contentWidth, 0.7,
      diagnostic.archetypeDescription, "Company Archetype"
    );
  }

  // KPI row
  const kpiY = diagnostic?.archetypeDescription ? 2.45 : 1.6;
  const kpiW = 2.7;
  const kpiH = 1.15;
  const kpiGap = 0.25;

  const hasSavings = summary.totalSavings.mid > 0;

  if (hasSavings) {
    addKpiBox(slide1, SLIDE.marginLeft, kpiY, kpiW, kpiH,
      formatSavingsRange(summary.totalSavings.low, summary.totalSavings.high),
      "Total Addressable Savings"
    );

    if (summary.totalToolCost) {
      addKpiBox(slide1, SLIDE.marginLeft + kpiW + kpiGap, kpiY, kpiW, kpiH,
        formatSavingsRange(summary.totalToolCost.low, summary.totalToolCost.high),
        "Estimated Tool Investment"
      );

      const netLow = Math.max(0, summary.totalSavings.low - summary.totalToolCost.high);
      const netHigh = Math.max(0, summary.totalSavings.high - summary.totalToolCost.low);
      addKpiBox(slide1, SLIDE.marginLeft + (kpiW + kpiGap) * 2, kpiY, kpiW, kpiH,
        formatSavingsRange(netLow, netHigh),
        "Net Annual Benefit"
      );
    }

    addKpiBox(
      slide1,
      SLIDE.marginLeft + (kpiW + kpiGap) * (summary.totalToolCost ? 3 : 2),
      kpiY, kpiW, kpiH,
      `${summary.assessedProcessCount} of ${summary.totalProcessCount}`,
      "Processes Assessed"
    );
  } else {
    // No ROI data yet — show process summary
    addKpiBox(slide1, SLIDE.marginLeft, kpiY, 3.5, kpiH,
      `${summary.totalProcessCount}`,
      "Processes in Scope"
    );
    addKpiBox(slide1, SLIDE.marginLeft + 3.75, kpiY, 3.5, kpiH,
      `${summary.assessedProcessCount}`,
      "Assessments Complete"
    );
  }

  // Top Opportunities table
  if (summary.topOpportunities.length > 0) {
    const tableY = kpiY + kpiH + 0.35;
    slide1.addText("Top Opportunities by Savings Impact", {
      x: SLIDE.marginLeft,
      y: tableY - 0.05,
      w: SLIDE.contentWidth,
      h: 0.35,
      fontSize: 13,
      fontFace: FONTS.heading,
      bold: true,
      color: COLORS.primaryGreen,
    });

    const rows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["Rank", "Opportunity", "Process", "Current State", "Annual Savings", "Recommended Tool"]),
    ];

    for (let i = 0; i < Math.min(summary.topOpportunities.length, 5); i++) {
      const opp = summary.topOpportunities[i];
      rows.push(
        makeDataRow([
          `#${opp.rank}`,
          opp.stepTitle,
          opp.processName,
          { text: MATURITY_LABELS[opp.maturity] || opp.maturity, opts: { bold: true, color: opp.maturity === "manual" ? COLORS.red : opp.maturity === "semi-automated" ? COLORS.amber : COLORS.green } },
          { text: formatSavingsRange(opp.savings.low, opp.savings.high), opts: { bold: true } },
          opp.topTool ? `${opp.topTool.name}` : "—",
        ], i)
      );
    }

    slide1.addTable(rows, {
      x: SLIDE.marginLeft,
      y: tableY + 0.3,
      w: SLIDE.contentWidth,
      colW: [0.6, 2.8, 1.8, 1.5, 2.3, 2.83],
      fontSize: 10,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });
  }

  if (depth === "summary") return;

  // ── Slide 2 (Detailed): Key Challenges ──
  if (diagnostic && diagnostic.challenges.length > 0) {
    const slide2 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide2, "Key Challenges Identified", `${diagnostic.challenges.length} challenges across operations, cost, data quality, and scale`);
    addFooter(slide2, pageCounter.current, companyName, confidential);

    const categoryLabels: Record<string, string> = {
      operational: "Operational",
      cost: "Cost",
      "data-quality": "Data Quality",
      scale: "Scale",
    };
    const categoryColors: Record<string, string> = {
      operational: COLORS.amber,
      cost: COLORS.red,
      "data-quality": COLORS.primaryGreen,
      scale: COLORS.textMedium,
    };

    let yPos = 1.6;
    for (const challenge of diagnostic.challenges) {
      if (yPos > 6.0) break;

      // Category tag
      const catLabel = categoryLabels[challenge.category] || challenge.category;
      const catColor = categoryColors[challenge.category] || COLORS.textGray;
      slide2.addShape("rect" as PptxGenJS.ShapeType, {
        x: SLIDE.marginLeft,
        y: yPos,
        w: 1.3,
        h: 0.28,
        fill: { color: COLORS.lightGray },
        rectRadius: 0.04,
      });
      slide2.addText(catLabel.toUpperCase(), {
        x: SLIDE.marginLeft,
        y: yPos,
        w: 1.3,
        h: 0.28,
        fontSize: 7,
        fontFace: FONTS.heading,
        bold: true,
        color: catColor,
        align: "center",
        valign: "middle",
      });

      // Challenge title + description
      slide2.addText(challenge.title, {
        x: SLIDE.marginLeft + 1.5,
        y: yPos - 0.03,
        w: SLIDE.contentWidth - 1.5,
        h: 0.3,
        fontSize: 12,
        fontFace: FONTS.heading,
        bold: true,
        color: COLORS.textDark,
      });
      slide2.addText(challenge.description, {
        x: SLIDE.marginLeft + 1.5,
        y: yPos + 0.28,
        w: SLIDE.contentWidth - 1.5,
        h: 0.45,
        fontSize: 10,
        fontFace: FONTS.body,
        color: COLORS.textMedium,
        wrap: true,
        valign: "top",
      });
      yPos += 0.9;
    }
  }

  // ── Slide 3 (Detailed): Priority Areas ──
  if (diagnostic && diagnostic.priorityAreas.length > 0) {
    const slide3 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide3, "Priority Areas for Exploration", "Ranked by expected leverage and improvement potential");
    addFooter(slide3, pageCounter.current, companyName, confidential);

    const rows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["Process", "Expected Leverage", "Rationale"]),
    ];

    for (let i = 0; i < diagnostic.priorityAreas.length; i++) {
      const area = diagnostic.priorityAreas[i];
      const leverageColor = area.expectedLeverage === "high" ? COLORS.green : area.expectedLeverage === "medium" ? COLORS.amber : COLORS.textGray;
      rows.push(
        makeDataRow([
          { text: area.processName, opts: { bold: true } },
          { text: area.expectedLeverage.toUpperCase(), opts: { bold: true, color: leverageColor, align: "center" } },
          area.rationale,
        ], i)
      );
    }

    slide3.addTable(rows, {
      x: SLIDE.marginLeft,
      y: 1.6,
      w: SLIDE.contentWidth,
      colW: [2.5, 1.8, 7.53],
      fontSize: 10,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });
  }
}
