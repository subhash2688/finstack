/**
 * Risk & Considerations Slides
 */

import type PptxGenJS from "pptxgenjs";
import { Engagement } from "@/types/engagement";
import { getERPSignal } from "@/lib/data/erp-intelligence";
import {
  COLORS,
  FONTS,
  SLIDE,
  addFooter,
  addTitle,
  addSectionDivider,
  addInsightBox,
  makeHeaderRow,
  makeDataRow,
} from "../alix-theme";

export function buildRisksSlides(
  pptx: PptxGenJS,
  engagement: Engagement,
  depth: "summary" | "detailed",
  pageCounter: { current: number },
  confidential: boolean
): void {
  const companyName = engagement.clientContext.companyName;
  const diagnostic = engagement.diagnostic;
  const commentary = engagement.companyIntel?.commentary;
  const erpName = engagement.clientContext.erp;

  addSectionDivider(pptx, 7, "Risks &\nConsiderations");

  // ── Slide 1: Risk Overview ──
  const slide1 = pptx.addSlide();
  pageCounter.current++;
  addTitle(slide1, "Implementation Risks", "Key factors to consider during planning and execution");
  addFooter(slide1, pageCounter.current, companyName, confidential);

  let yPos = 1.55;

  // ERP-related risks
  if (erpName) {
    const erpSignal = getERPSignal(erpName);
    if (erpSignal) {
      slide1.addText("ERP Environment", {
        x: SLIDE.marginLeft, y: yPos, w: SLIDE.contentWidth, h: 0.35,
        fontSize: 14, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
      });
      yPos += 0.4;

      const erpRows: PptxGenJS.TableRow[] = [
        makeHeaderRow(["Factor", "Assessment"]),
        makeDataRow([
          { text: "ERP System", opts: { bold: true } },
          erpName,
        ], 0),
        makeDataRow([
          { text: "Maturity Signal", opts: { bold: true } },
          erpSignal.maturityDescription,
        ], 1),
        makeDataRow([
          { text: "Automation Ceiling", opts: { bold: true } },
          { text: `${(erpSignal.automationCeiling * 100).toFixed(0)}%`, opts: { bold: true, color: COLORS.primaryGreen } },
        ], 2),
        makeDataRow([
          { text: "Change Management", opts: { bold: true } },
          { text: `${erpSignal.changeManagement.toUpperCase()} — ${erpSignal.changeManagementNotes}`, opts: { color: erpSignal.changeManagement === "high" ? COLORS.red : erpSignal.changeManagement === "medium" ? COLORS.amber : COLORS.green } },
        ], 3),
      ];

      slide1.addTable(erpRows, {
        x: SLIDE.marginLeft, y: yPos, w: 8,
        colW: [2.2, 5.8], fontSize: 10,
        border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
      });
      yPos += 0.4 * 5 + 0.3;

      // ERP gaps
      if (erpSignal.gaps && erpSignal.gaps.length > 0) {
        slide1.addText("Known ERP Limitations", {
          x: 8.5, y: 1.95, w: 4.08, h: 0.3,
          fontSize: 12, bold: true, fontFace: FONTS.heading, color: COLORS.red,
        });
        let gapY = 2.35;
        for (const gap of erpSignal.gaps.slice(0, 5)) {
          slide1.addText(gap, {
            x: 8.5, y: gapY, w: 4.08, h: 0.4,
            fontSize: 9, color: COLORS.textDark,
            bullet: { type: "bullet" }, wrap: true, valign: "top",
          });
          gapY += 0.45;
        }
      }
    }
  }

  // Automation disclaimer
  if (diagnostic?.automationOpportunity?.disclaimer) {
    addInsightBox(slide1, SLIDE.marginLeft, Math.max(yPos, 4.5), SLIDE.contentWidth, 1.0,
      diagnostic.automationOpportunity.disclaimer, "Disclaimer"
    );
  }

  if (depth === "summary") return;

  // ── Slide 2 (Detailed): Market Risks ──
  if (commentary && (commentary.headwinds.length > 0 || commentary.tailwinds.length > 0)) {
    const slide2 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide2, "Market & Competitive Context", "Source: AI Analysis — verify against latest filings");
    addFooter(slide2, pageCounter.current, companyName, confidential);

    // Two-column layout: headwinds left, tailwinds right
    const colW = 5.5;

    if (commentary.headwinds.length > 0) {
      slide2.addShape("rect" as PptxGenJS.ShapeType, {
        x: SLIDE.marginLeft, y: 1.55, w: colW, h: 0.35,
        fill: { color: "FBE9E7" }, rectRadius: 0.04,
      });
      slide2.addText("HEADWINDS", {
        x: SLIDE.marginLeft + 0.15, y: 1.55, w: colW - 0.3, h: 0.35,
        fontSize: 10, fontFace: FONTS.heading, bold: true, color: COLORS.red,
        valign: "middle",
      });

      let hwY = 2.05;
      for (const hw of commentary.headwinds.slice(0, 5)) {
        slide2.addText(hw, {
          x: SLIDE.marginLeft + 0.15, y: hwY, w: colW - 0.3, h: 0.45,
          fontSize: 10, color: COLORS.textDark,
          bullet: { type: "bullet" }, wrap: true, valign: "top",
        });
        hwY += 0.5;
      }
    }

    if (commentary.tailwinds.length > 0) {
      const rightX = SLIDE.marginLeft + colW + 0.83;
      slide2.addShape("rect" as PptxGenJS.ShapeType, {
        x: rightX, y: 1.55, w: colW, h: 0.35,
        fill: { color: "E8F5E9" }, rectRadius: 0.04,
      });
      slide2.addText("TAILWINDS", {
        x: rightX + 0.15, y: 1.55, w: colW - 0.3, h: 0.35,
        fontSize: 10, fontFace: FONTS.heading, bold: true, color: COLORS.green,
        valign: "middle",
      });

      let twY = 2.05;
      for (const tw of commentary.tailwinds.slice(0, 5)) {
        slide2.addText(tw, {
          x: rightX + 0.15, y: twY, w: colW - 0.3, h: 0.45,
          fontSize: 10, color: COLORS.textDark,
          bullet: { type: "bullet" }, wrap: true, valign: "top",
        });
        twY += 0.5;
      }
    }

    // Market dynamics
    if (commentary.marketDynamics) {
      addInsightBox(slide2, SLIDE.marginLeft, 5.0, SLIDE.contentWidth, 1.0,
        commentary.marketDynamics, "Market Dynamics"
      );
    }
  }

  // ── Slide 3 (Detailed): Implementation Playbook ──
  const slide3 = pptx.addSlide();
  pageCounter.current++;
  addTitle(slide3, "Implementation Playbook", "Recommended approach for successful transformation");
  addFooter(slide3, pageCounter.current, companyName, confidential);

  const playbook: { title: string; items: string[]; color: string }[] = [
    {
      title: "Phase 1: Foundation (Months 1–3)",
      color: COLORS.primaryGreen,
      items: [
        "Secure executive sponsorship and define transformation charter",
        "Conduct data quality assessment across target processes",
        "Prioritize quick wins: high-ROI, low-complexity automation targets",
        "Begin tool evaluation for top 2–3 capabilities",
      ],
    },
    {
      title: "Phase 2: Implementation (Months 3–9)",
      color: COLORS.amber,
      items: [
        "Deploy first automation tools with phased rollout",
        "Establish change management program and training curriculum",
        "Build integration layer with existing ERP ecosystem",
        "Monitor early metrics and iterate on process design",
      ],
    },
    {
      title: "Phase 3: Optimization (Months 9–12+)",
      color: COLORS.textMedium,
      items: [
        "Expand automation to remaining process steps",
        "Implement advanced AI capabilities (ML models, predictive analytics)",
        "Measure and report on realized savings vs. projections",
        "Transition team capacity to higher-value activities",
      ],
    },
  ];

  let py = 1.55;
  for (const phase of playbook) {
    // Phase header
    slide3.addShape("rect" as PptxGenJS.ShapeType, {
      x: SLIDE.marginLeft, y: py, w: 0.06, h: 1.55,
      fill: { color: phase.color },
    });
    slide3.addText(phase.title, {
      x: SLIDE.marginLeft + 0.25, y: py, w: SLIDE.contentWidth - 0.25, h: 0.35,
      fontSize: 13, fontFace: FONTS.heading, bold: true, color: phase.color,
    });

    let iy = py + 0.38;
    for (const item of phase.items) {
      slide3.addText(item, {
        x: SLIDE.marginLeft + 0.4, y: iy, w: SLIDE.contentWidth - 0.4, h: 0.3,
        fontSize: 10, color: COLORS.textDark,
        bullet: { type: "bullet" }, wrap: true,
      });
      iy += 0.3;
    }
    py += 1.7;
  }
}
