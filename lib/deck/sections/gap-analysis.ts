/**
 * Gap Analysis Slides
 */

import type PptxGenJS from "pptxgenjs";
import { Engagement } from "@/types/engagement";
import {
  COLORS,
  FONTS,
  SLIDE,
  addFooter,
  addTitle,
  addSectionDivider,
  addKpiBox,
  addInsightBox,
  MATURITY_LABELS,
  MATURITY_COLORS,
  makeHeaderRow,
  makeDataRow,
} from "../alix-theme";

export function buildGapAnalysisSlides(
  pptx: PptxGenJS,
  engagement: Engagement,
  depth: "summary" | "detailed",
  pageCounter: { current: number },
  confidential: boolean
): void {
  const companyName = engagement.clientContext.companyName;
  const diagnostic = engagement.diagnostic;

  if (!diagnostic) return;

  addSectionDivider(pptx, 4, "Gap Analysis");

  // ── Slide 1: AI Applicability ──
  const slide1 = pptx.addSlide();
  pageCounter.current++;
  addTitle(slide1, "AI Applicability Analysis", "How much of the current workload can be addressed by AI and automation");
  addFooter(slide1, pageCounter.current, companyName, confidential);

  const ai = diagnostic.aiApplicability;

  // Three big KPI boxes
  const kpiW = 3.6;
  const kpiH = 1.5;
  const kpiGap = 0.3;

  addKpiBox(slide1, SLIDE.marginLeft, 1.7, kpiW, kpiH,
    `${ai.highLeverage.min}–${ai.highLeverage.max}%`,
    "High Leverage (Full Automation)"
  );
  addKpiBox(slide1, SLIDE.marginLeft + kpiW + kpiGap, 1.7, kpiW, kpiH,
    `${ai.humanInTheLoop.min}–${ai.humanInTheLoop.max}%`,
    "Human-in-the-Loop"
  );
  addKpiBox(slide1, SLIDE.marginLeft + (kpiW + kpiGap) * 2, 1.7, kpiW, kpiH,
    `${ai.humanLed.min}–${ai.humanLed.max}%`,
    "Human-Led"
  );

  // Descriptions below KPIs
  const descs: [string, string, string][] = [
    ["HIGH LEVERAGE", ai.highLeverage.description, COLORS.green],
    ["HUMAN-IN-THE-LOOP", ai.humanInTheLoop.description, COLORS.amber],
    ["HUMAN-LED", ai.humanLed.description, COLORS.textMedium],
  ];

  let descX = SLIDE.marginLeft;
  for (const [label, desc, color] of descs) {
    slide1.addText(label, {
      x: descX, y: 3.4, w: kpiW, h: 0.3,
      fontSize: 8, fontFace: FONTS.heading, bold: true,
      color,
    });
    slide1.addText(desc, {
      x: descX, y: 3.7, w: kpiW, h: 0.8,
      fontSize: 9, fontFace: FONTS.body, color: COLORS.textMedium,
      wrap: true, valign: "top",
    });
    descX += kpiW + kpiGap;
  }

  // Automation opportunity summary
  const ao = diagnostic.automationOpportunity;
  slide1.addText("Automation Opportunity Summary", {
    x: SLIDE.marginLeft, y: 4.7, w: SLIDE.contentWidth, h: 0.35,
    fontSize: 14, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
  });

  const aoRows: PptxGenJS.TableRow[] = [
    makeHeaderRow(["Dimension", "Range", "What This Means"]),
    makeDataRow([
      { text: "Effort Addressable", opts: { bold: true } },
      { text: `${ao.effortAddressable.min}–${ao.effortAddressable.max}%`, opts: { bold: true, color: COLORS.primaryGreen, align: "center" as const } },
      "Percentage of current manual effort that can be automated or augmented",
    ], 0),
    makeDataRow([
      { text: "Cost Savings", opts: { bold: true } },
      { text: `${ao.costSavingsRange.min}–${ao.costSavingsRange.max}%`, opts: { bold: true, color: COLORS.primaryGreen, align: "center" as const } },
      "Expected reduction in operational costs from process improvement",
    ], 1),
    makeDataRow([
      { text: "Capacity Unlocked", opts: { bold: true } },
      { text: `${ao.capacityUnlocked.min}–${ao.capacityUnlocked.max}%`, opts: { bold: true, color: COLORS.primaryGreen, align: "center" as const } },
      "Team capacity freed up for higher-value work",
    ], 2),
  ];

  slide1.addTable(aoRows, {
    x: SLIDE.marginLeft, y: 5.15, w: SLIDE.contentWidth,
    colW: [2.2, 1.5, 8.13], fontSize: 10,
    border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
  });

  if (depth === "summary") return;

  // ── Slide 2 (Detailed): Manual Bottlenecks ──
  const manualSteps: { process: string; step: string; aiImpact: string; painPoint: string }[] = [];
  for (const assessment of engagement.processAssessments) {
    const ratings = assessment.maturityRatings || {};
    const steps = assessment.generatedWorkflow || [];
    for (const step of steps) {
      if (ratings[step.id] === "manual") {
        manualSteps.push({
          process: assessment.processName,
          step: step.title,
          aiImpact: step.aiOpportunity?.impact || "—",
          painPoint: step.insight?.typicalPain || step.painPoints?.[0] || "—",
        });
      }
    }
  }

  if (manualSteps.length > 0) {
    const slide2 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide2, "Manual Process Bottlenecks",
      `${manualSteps.length} steps currently require fully manual effort — highest automation opportunity`);
    addFooter(slide2, pageCounter.current, companyName, confidential);

    const rows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["Process", "Step", "AI Impact", "Typical Pain Point"]),
    ];

    // Sort: high AI impact first
    const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
    manualSteps.sort((a, b) => (impactOrder[a.aiImpact] ?? 2) - (impactOrder[b.aiImpact] ?? 2));

    manualSteps.slice(0, 12).forEach((item, i) => {
      const impactColor = item.aiImpact === "high" ? COLORS.green : item.aiImpact === "medium" ? COLORS.amber : COLORS.textGray;
      rows.push(makeDataRow([
        { text: item.process, opts: { bold: true } },
        item.step,
        { text: item.aiImpact.toUpperCase(), opts: { bold: true, color: impactColor, align: "center" as const } },
        item.painPoint,
      ], i));
    });

    slide2.addTable(rows, {
      x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth,
      colW: [2.2, 2.8, 1.2, 5.63], fontSize: 10,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });
  }

  // ── Slide 3 (Detailed): Disclaimer ──
  if (ao.disclaimer) {
    const lastSlide = pptx.addSlide();
    pageCounter.current++;
    addTitle(lastSlide, "Important Considerations");
    addFooter(lastSlide, pageCounter.current, companyName, confidential);

    addInsightBox(lastSlide, SLIDE.marginLeft, 1.6, SLIDE.contentWidth, 1.2,
      ao.disclaimer, "Automation Opportunity Disclaimer"
    );

    // Also show challenges if they exist
    if (diagnostic.challenges.length > 0) {
      lastSlide.addText("Diagnostic Challenges Summary", {
        x: SLIDE.marginLeft, y: 3.2, w: SLIDE.contentWidth, h: 0.35,
        fontSize: 14, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
      });

      let cy = 3.6;
      for (const c of diagnostic.challenges.slice(0, 6)) {
        lastSlide.addText(`${c.title}: ${c.description}`, {
          x: SLIDE.marginLeft + 0.15, y: cy, w: SLIDE.contentWidth - 0.15, h: 0.45,
          fontSize: 10, color: COLORS.textDark,
          bullet: { type: "bullet" }, wrap: true, valign: "top",
        });
        cy += 0.5;
      }
    }
  }
}
