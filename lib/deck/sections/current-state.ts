/**
 * Current State Assessment Slides
 */

import type PptxGenJS from "pptxgenjs";
import { Engagement, ProcessAssessment } from "@/types/engagement";
import {
  COLORS,
  FONTS,
  SLIDE,
  addFooter,
  addTitle,
  addSectionDivider,
  MATURITY_COLORS,
  MATURITY_LABELS,
  makeHeaderRow,
  makeDataRow,
} from "../alix-theme";

function getMaturityCounts(assessment: ProcessAssessment) {
  const ratings = assessment.maturityRatings || {};
  let manual = 0, semi = 0, auto = 0;
  for (const val of Object.values(ratings)) {
    if (val === "manual") manual++;
    else if (val === "semi-automated") semi++;
    else if (val === "automated") auto++;
  }
  return { manual, semi, auto, total: manual + semi + auto };
}

export function buildCurrentStateSlides(
  pptx: PptxGenJS,
  engagement: Engagement,
  depth: "summary" | "detailed",
  pageCounter: { current: number },
  confidential: boolean
): void {
  const companyName = engagement.clientContext.companyName;
  const assessments = engagement.processAssessments.filter((a) => {
    const ratings = a.maturityRatings || {};
    return Object.keys(ratings).length > 0;
  });

  if (assessments.length === 0) return;

  addSectionDivider(pptx, 3, "Current State\nAssessment");

  // ── Slide 1: Maturity Overview ──
  const slide1 = pptx.addSlide();
  pageCounter.current++;

  const totalSteps = assessments.reduce((s, a) => s + Object.keys(a.maturityRatings || {}).length, 0);
  const totalManual = assessments.reduce((s, a) => s + getMaturityCounts(a).manual, 0);
  addTitle(slide1, "Process Maturity Overview",
    `${totalSteps} steps assessed across ${assessments.length} process${assessments.length > 1 ? "es" : ""}  |  ${totalManual} manual steps identified`);
  addFooter(slide1, pageCounter.current, companyName, confidential);

  // Legend at top
  const legendItems: [string, string][] = [
    ["Manual", MATURITY_COLORS.manual],
    ["Semi-Automated", MATURITY_COLORS["semi-automated"]],
    ["Automated", MATURITY_COLORS.automated],
  ];
  let legendX = SLIDE.marginLeft + 3.5;
  for (const [label, color] of legendItems) {
    slide1.addShape("rect" as PptxGenJS.ShapeType, {
      x: legendX, y: 1.55, w: 0.3, h: 0.22,
      fill: { color }, rectRadius: 0.03,
    });
    slide1.addText(label, {
      x: legendX + 0.38, y: 1.53, w: 1.5, h: 0.26,
      fontSize: 9, color: COLORS.textMedium, fontFace: FONTS.body,
    });
    legendX += 2.2;
  }

  // Per-process maturity bars
  let yPos = 2.1;
  const barMaxW = 7.0;
  const barStartX = SLIDE.marginLeft + 3.2;
  const barHeight = 0.5;

  for (const assessment of assessments) {
    const counts = getMaturityCounts(assessment);
    if (counts.total === 0) continue;

    // Process label
    slide1.addText(assessment.processName, {
      x: SLIDE.marginLeft, y: yPos, w: 3.0, h: barHeight,
      fontSize: 13, bold: true, fontFace: FONTS.heading,
      color: COLORS.textDark, align: "right", valign: "middle",
    });

    // Stacked bar segments
    const total = counts.total;
    const segments: [number, string, number][] = [
      [counts.manual, MATURITY_COLORS.manual, counts.manual],
      [counts.semi, MATURITY_COLORS["semi-automated"], counts.semi],
      [counts.auto, MATURITY_COLORS.automated, counts.auto],
    ];

    let barX = barStartX;
    for (const [count, color, displayCount] of segments) {
      if (count === 0) continue;
      const segW = (count / total) * barMaxW;
      slide1.addShape("rect" as PptxGenJS.ShapeType, {
        x: barX, y: yPos + 0.05, w: segW, h: barHeight - 0.1,
        fill: { color }, rectRadius: 0.04,
      });
      if (segW > 0.6) {
        slide1.addText(`${displayCount}`, {
          x: barX, y: yPos, w: segW, h: barHeight,
          fontSize: 12, color: COLORS.white, fontFace: FONTS.heading,
          bold: true, align: "center", valign: "middle",
        });
      }
      barX += segW;
    }

    // Step count label
    slide1.addText(`${counts.total} steps`, {
      x: barStartX + barMaxW + 0.2, y: yPos, w: 1.5, h: barHeight,
      fontSize: 10, color: COLORS.textGray, valign: "middle",
    });

    yPos += barHeight + 0.35;
    if (yPos > 6.0) break;
  }

  if (depth === "summary") return;

  // ── Detailed: Per-process step tables ──
  for (const assessment of assessments) {
    const ratings = assessment.maturityRatings || {};
    const steps = assessment.generatedWorkflow || [];
    if (steps.length === 0 || Object.keys(ratings).length === 0) continue;

    const slide = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide, assessment.processName, "Step-by-step maturity assessment");
    addFooter(slide, pageCounter.current, companyName, confidential);

    // Context badges at top
    const context = assessment.context || {};
    const teamKey = `${assessment.processId}TeamSize`;
    const contextParts: string[] = [];
    if (context[teamKey]) contextParts.push(`Team: ${context[teamKey]} FTEs`);
    if (context.erp) contextParts.push(`ERP: ${context.erp}`);
    if (context.invoiceVolume) contextParts.push(`Volume: ${context.invoiceVolume}/mo`);

    if (contextParts.length > 0) {
      let cx = SLIDE.marginLeft;
      for (const part of contextParts) {
        const pw = part.length * 0.08 + 0.4;
        slide.addShape("rect" as PptxGenJS.ShapeType, {
          x: cx, y: 1.0, w: pw, h: 0.3,
          fill: { color: COLORS.lightGreen }, rectRadius: 0.04,
        });
        slide.addText(part, {
          x: cx, y: 1.0, w: pw, h: 0.3,
          fontSize: 9, fontFace: FONTS.body, color: COLORS.primaryGreen,
          align: "center", valign: "middle", bold: true,
        });
        cx += pw + 0.15;
      }
    }

    // Steps table (left side — ~8 inches)
    const sortedSteps = [...steps].sort((a, b) => a.stepNumber - b.stepNumber);
    const tableRows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["#", "Process Step", "Current Maturity"]),
    ];

    sortedSteps.forEach((step, i) => {
      const maturity = ratings[step.id];
      if (!maturity) return;
      const mColor = MATURITY_COLORS[maturity] || COLORS.textDark;
      tableRows.push(makeDataRow([
        { text: String(step.stepNumber), opts: { align: "center" as const } },
        step.title,
        { text: MATURITY_LABELS[maturity] || maturity, opts: { color: mColor, bold: true, align: "center" as const } },
      ], i));
    });

    slide.addTable(tableRows, {
      x: SLIDE.marginLeft, y: 1.55, w: 7.8,
      colW: [0.5, 5.2, 2.1], fontSize: 10,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });

    // Pain points from transcripts (right side)
    const ti = assessment.transcriptIntelligence;
    if (ti && ti.analyses.length > 0) {
      slide.addText("Pain Points", {
        x: 9.0, y: 1.55, w: 3.58, h: 0.35,
        fontSize: 13, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
      });
      slide.addText("From transcript analysis", {
        x: 9.0, y: 1.85, w: 3.58, h: 0.25,
        fontSize: 8, fontFace: FONTS.body, color: COLORS.textGray, italic: true,
      });

      let ppY = 2.2;
      const painPoints: string[] = [];
      for (const analysis of ti.analyses) {
        for (const evidence of analysis.stepEvidence) {
          for (const pain of evidence.painPoints) {
            painPoints.push(pain);
          }
        }
      }

      // Deduplicate and limit
      const unique = Array.from(new Set(painPoints));
      for (const pain of unique.slice(0, 8)) {
        if (ppY > 6.2) break;
        slide.addText(pain, {
          x: 9.0, y: ppY, w: 3.58, h: 0.45,
          fontSize: 9, color: COLORS.textDark,
          bullet: { type: "bullet" }, wrap: true, valign: "top",
        });
        ppY += 0.5;
      }
    }
  }
}
