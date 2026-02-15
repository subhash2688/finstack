/**
 * Technology Solutions Slides
 */

import type PptxGenJS from "pptxgenjs";
import { Engagement } from "@/types/engagement";
import { ProcessFindings } from "@/types/findings";
import { getCapabilitiesForProcess } from "@/lib/data/technology-capabilities";
import {
  COLORS,
  FONTS,
  SLIDE,
  addFooter,
  addTitle,
  addSectionDivider,
  addInsightBox,
  formatCurrency,
  makeHeaderRow,
  makeDataRow,
} from "../alix-theme";

export function buildTechnologySlides(
  pptx: PptxGenJS,
  engagement: Engagement,
  allFindings: ProcessFindings[],
  depth: "summary" | "detailed",
  pageCounter: { current: number },
  confidential: boolean
): void {
  const companyName = engagement.clientContext.companyName;
  const techAnalysis = engagement.technologyAnalysis;
  const marketIntel = engagement.marketIntelligence;

  const processIds = Array.from(new Set(engagement.processAssessments.map((a) => a.processId)));
  const allCapabilities = processIds.flatMap((pid) => getCapabilitiesForProcess(pid));

  if (allCapabilities.length === 0 && !techAnalysis) return;

  addSectionDivider(pptx, 6, "Technology\nSolutions");

  // ── Slide 1: Capability Map ──
  const slide1 = pptx.addSlide();
  pageCounter.current++;
  addTitle(slide1, "Technology Capabilities", `${allCapabilities.length} capabilities mapped across ${processIds.length} process${processIds.length > 1 ? "es" : ""}`);
  addFooter(slide1, pageCounter.current, companyName, confidential);

  const categoryLabels: Record<string, string> = {
    ap: "Accounts Payable", ar: "Accounts Receivable", fpa: "FP&A",
  };

  // Group capabilities by category
  const byCategory = new Map<string, typeof allCapabilities>();
  for (const cap of allCapabilities) {
    const list = byCategory.get(cap.category) || [];
    list.push(cap);
    byCategory.set(cap.category, list);
  }

  let yPos = 1.55;
  for (const [category, caps] of Array.from(byCategory.entries())) {
    // Category header
    slide1.addShape("rect" as PptxGenJS.ShapeType, {
      x: SLIDE.marginLeft, y: yPos, w: SLIDE.contentWidth, h: 0.35,
      fill: { color: COLORS.lightGreen }, rectRadius: 0.04,
    });
    slide1.addText(categoryLabels[category] || category.toUpperCase(), {
      x: SLIDE.marginLeft + 0.15, y: yPos, w: 4, h: 0.35,
      fontSize: 11, fontFace: FONTS.heading, bold: true,
      color: COLORS.primaryGreen, valign: "middle",
    });
    yPos += 0.45;

    for (const cap of caps) {
      if (yPos > 6.2) break;
      slide1.addText(cap.name, {
        x: SLIDE.marginLeft + 0.3, y: yPos, w: 3.2, h: 0.3,
        fontSize: 10, fontFace: FONTS.heading, bold: true, color: COLORS.textDark,
      });
      slide1.addText(cap.description.length > 100 ? cap.description.slice(0, 97) + "..." : cap.description, {
        x: SLIDE.marginLeft + 3.5, y: yPos, w: SLIDE.contentWidth - 3.5, h: 0.3,
        fontSize: 9, fontFace: FONTS.body, color: COLORS.textMedium, wrap: true,
      });
      yPos += 0.38;
    }
    yPos += 0.15;
  }

  // ── Slide 2: Top Tool Recommendations ──
  const toolRecs: { step: string; process: string; tool: string; vendor: string; fit: number }[] = [];
  for (const f of allFindings) {
    for (const s of f.stepEstimates) {
      if (s.topTool) {
        toolRecs.push({
          step: s.stepTitle, process: f.processName,
          tool: s.topTool.name, vendor: s.topTool.vendor, fit: s.topTool.fitScore,
        });
      }
    }
  }

  if (toolRecs.length > 0) {
    toolRecs.sort((a, b) => b.fit - a.fit);
    const seen = new Set<string>();
    const uniqueRecs = toolRecs.filter((r) => {
      if (seen.has(r.tool)) return false;
      seen.add(r.tool);
      return true;
    });

    const slide2 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide2, "Vendor Recommendations", `${uniqueRecs.length} tools recommended based on step-level fit scoring`);
    addFooter(slide2, pageCounter.current, companyName, confidential);

    const trRows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["Tool", "Vendor", "Best Fit For", "Fit Score"]),
    ];

    uniqueRecs.slice(0, 12).forEach((r, i) => {
      const scoreDisplay = `${Math.round(r.fit * 10)}/100`;
      const scoreColor = r.fit >= 8 ? COLORS.green : r.fit >= 6 ? COLORS.amber : COLORS.textGray;
      trRows.push(makeDataRow([
        { text: r.tool, opts: { bold: true } },
        r.vendor,
        `${r.step} (${r.process})`,
        { text: scoreDisplay, opts: { bold: true, color: scoreColor, align: "center" as const } },
      ], i));
    });

    slide2.addTable(trRows, {
      x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth,
      colW: [3, 2, 4.83, 2], fontSize: 10,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });
  }

  if (depth === "summary") return;

  // ── Slide 3 (Detailed): Build vs Buy ──
  if (techAnalysis && techAnalysis.buildVsBuy.length > 0) {
    const slide3 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide3, "Build vs Buy Analysis", "AI-powered assessment per technology capability");
    addFooter(slide3, pageCounter.current, companyName, confidential);

    const bvbRows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["Capability", "Rec.", "Build Cost", "Buy Cost/yr", "Rationale"]),
    ];

    techAnalysis.buildVsBuy.forEach((bvb, i) => {
      const cap = allCapabilities.find((c) => c.id === bvb.capabilityId);
      const recColor = bvb.recommendation === "buy" ? COLORS.green : bvb.recommendation === "build" ? COLORS.amber : COLORS.textMedium;
      bvbRows.push(makeDataRow([
        { text: cap?.name || bvb.capabilityId, opts: { bold: true } },
        { text: bvb.recommendation.toUpperCase(), opts: { bold: true, color: recColor, align: "center" as const } },
        { text: `${formatCurrency(bvb.build.estimatedCost.low)}–${formatCurrency(bvb.build.estimatedCost.high)}`, opts: { align: "right" as const } },
        { text: `${formatCurrency(bvb.buy.annualCost.low)}–${formatCurrency(bvb.buy.annualCost.high)}`, opts: { align: "right" as const } },
        bvb.rationale.length > 80 ? bvb.rationale.slice(0, 77) + "..." : bvb.rationale,
      ], i));
    });

    slide3.addTable(bvbRows, {
      x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth,
      colW: [2.3, 0.9, 2.2, 2.0, 4.43], fontSize: 9,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });
  }

  // ── Slide 4 (Detailed): Case Studies ──
  if (techAnalysis && techAnalysis.caseStudies.length > 0) {
    const slide4 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide4, "Implementation Case Studies", "Real-world examples from similar organizations");
    addFooter(slide4, pageCounter.current, companyName, confidential);

    let csY = 1.55;
    for (const cs of techAnalysis.caseStudies.slice(0, 3)) {
      const cap = allCapabilities.find((c) => c.id === cs.capabilityId);
      const cardH = 1.5;

      slide4.addShape("rect" as PptxGenJS.ShapeType, {
        x: SLIDE.marginLeft, y: csY, w: SLIDE.contentWidth, h: cardH,
        fill: { color: COLORS.cardBg }, rectRadius: 0.06,
      });
      slide4.addShape("rect" as PptxGenJS.ShapeType, {
        x: SLIDE.marginLeft, y: csY, w: 0.06, h: cardH,
        fill: { color: COLORS.primaryGreen },
      });

      // Capability name
      slide4.addText(cap?.name || cs.capabilityId, {
        x: SLIDE.marginLeft + 0.25, y: csY + 0.08, w: 5, h: 0.3,
        fontSize: 13, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
      });

      // Context line
      slide4.addText(`${cs.companyArchetype}  |  ERP: ${cs.erpUsed}  |  Tool: ${cs.toolUsed}  |  Timeline: ${cs.timeline}`, {
        x: SLIDE.marginLeft + 0.25, y: csY + 0.4, w: SLIDE.contentWidth - 0.5, h: 0.25,
        fontSize: 9, color: COLORS.textGray,
      });

      // Outcome
      slide4.addText(cs.outcome, {
        x: SLIDE.marginLeft + 0.25, y: csY + 0.7, w: SLIDE.contentWidth - 0.5, h: 0.65,
        fontSize: 11, color: COLORS.textDark, wrap: true, valign: "top",
      });

      csY += cardH + 0.25;
    }
  }

  // ── Slide 5 (Detailed): Market Context ──
  if (marketIntel || techAnalysis?.marketContext) {
    const slide5 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide5, "Market Context & Trends", "Industry benchmarks and technology adoption landscape");
    addFooter(slide5, pageCounter.current, companyName, confidential);

    let yPos2 = 1.55;
    const mc = techAnalysis?.marketContext;
    if (mc) {
      if (mc.industryAdoptionRate) {
        addInsightBox(slide5, SLIDE.marginLeft, yPos2, SLIDE.contentWidth, 0.5,
          `Industry Adoption Rate: ${mc.industryAdoptionRate}`, "Market Signal"
        );
        yPos2 += 0.7;
      }

      if (mc.technologyTrends.length > 0) {
        slide5.addText("Technology Trends", {
          x: SLIDE.marginLeft, y: yPos2, w: SLIDE.contentWidth, h: 0.35,
          fontSize: 13, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
        });
        yPos2 += 0.4;
        for (const trend of mc.technologyTrends.slice(0, 5)) {
          slide5.addText(trend, {
            x: SLIDE.marginLeft + 0.15, y: yPos2, w: SLIDE.contentWidth - 0.15, h: 0.4,
            fontSize: 10, color: COLORS.textDark,
            bullet: { type: "bullet" }, wrap: true, valign: "top",
          });
          yPos2 += 0.45;
        }
      }
    }

    if (marketIntel && marketIntel.benchmarks.length > 0) {
      yPos2 += 0.15;
      slide5.addText("Industry Benchmarks", {
        x: SLIDE.marginLeft, y: yPos2, w: SLIDE.contentWidth, h: 0.35,
        fontSize: 13, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
      });
      yPos2 += 0.4;

      const bmRows: PptxGenJS.TableRow[] = [
        makeHeaderRow(["Metric", "Value", "Context"]),
      ];
      marketIntel.benchmarks.slice(0, 6).forEach((bm, i) => {
        bmRows.push(makeDataRow([
          { text: bm.metric, opts: { bold: true } },
          { text: bm.value, opts: { bold: true, color: COLORS.primaryGreen } },
          bm.context,
        ], i));
      });

      slide5.addTable(bmRows, {
        x: SLIDE.marginLeft, y: yPos2, w: SLIDE.contentWidth,
        colW: [3, 2, 6.83], fontSize: 10,
        border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
      });
    }
  }
}
