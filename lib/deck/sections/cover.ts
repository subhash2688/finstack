/**
 * Cover Slide Builder
 */

import type PptxGenJS from "pptxgenjs";
import { Engagement } from "@/types/engagement";
import { COLORS, FONTS, SLIDE } from "../alix-theme";

export function buildCoverSlide(
  pptx: PptxGenJS,
  engagement: Engagement,
  confidential: boolean
): void {
  const slide = pptx.addSlide();
  slide.background = { fill: COLORS.white };
  const ctx = engagement.clientContext;

  // ── Left green panel ──
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: 5.2,
    h: SLIDE.height,
    fill: { color: COLORS.primaryGreen },
  });

  // Darker accent stripe
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: 0.35,
    h: SLIDE.height,
    fill: { color: COLORS.darkGreen },
  });

  // Company name — big bold white
  slide.addText(ctx.companyName, {
    x: 0.8,
    y: 1.6,
    w: 3.8,
    h: 1.4,
    fontSize: 38,
    fontFace: FONTS.heading,
    bold: true,
    color: COLORS.white,
    wrap: true,
    valign: "bottom",
  });

  // Thin accent line
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0.8,
    y: 3.15,
    w: 2.0,
    h: 0.03,
    fill: { color: COLORS.accentGreen },
  });

  // Engagement name
  slide.addText(engagement.name, {
    x: 0.8,
    y: 3.35,
    w: 3.8,
    h: 0.7,
    fontSize: 14,
    fontFace: FONTS.body,
    color: COLORS.accentGreen,
    wrap: true,
    valign: "top",
  });

  // Date
  const date = new Date(engagement.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  slide.addText(date, {
    x: 0.8,
    y: 4.2,
    w: 3.8,
    h: 0.35,
    fontSize: 11,
    fontFace: FONTS.body,
    color: COLORS.accentGreen,
  });

  // "When it really matters." tagline
  slide.addText("When it really matters.", {
    x: 0.8,
    y: SLIDE.height - 1.0,
    w: 3.5,
    h: 0.3,
    fontSize: 10,
    fontFace: FONTS.body,
    color: COLORS.accentGreen,
    italic: true,
  });

  // ── Right side ──

  // Title block
  slide.addText("Process Intelligence\nAssessment", {
    x: 6.2,
    y: 1.8,
    w: 6.3,
    h: 1.6,
    fontSize: 32,
    fontFace: FONTS.heading,
    bold: true,
    color: COLORS.textDark,
    lineSpacingMultiple: 1.15,
  });

  // Context details
  const sizeLabels: Record<string, string> = {
    startup: "Startup",
    smb: "SMB",
    "mid-market": "Mid-Market",
    enterprise: "Enterprise",
  };

  const details: string[] = [];
  if (ctx.subSector) details.push(ctx.subSector);
  else if (ctx.industry) details.push(ctx.industry);
  details.push(sizeLabels[ctx.companySize] || ctx.companySize);
  if (ctx.isPublic && ctx.tickerSymbol) details.push(`${ctx.tickerSymbol}`);
  if (ctx.erp) details.push(ctx.erp);

  // Context pills as individual items
  let pillY = 3.8;
  for (const detail of details) {
    slide.addShape("rect" as PptxGenJS.ShapeType, {
      x: 6.2,
      y: pillY,
      w: 2.8,
      h: 0.38,
      fill: { color: COLORS.lightGreen },
      rectRadius: 0.04,
    });
    slide.addText(detail, {
      x: 6.2,
      y: pillY,
      w: 2.8,
      h: 0.38,
      fontSize: 11,
      fontFace: FONTS.body,
      color: COLORS.primaryGreen,
      align: "center",
      valign: "middle",
      bold: true,
    });
    pillY += 0.48;
  }

  // Process count
  const processCount = engagement.processAssessments.length;
  if (processCount > 0) {
    const processNames = engagement.processAssessments.map((a) => a.processName).join(", ");
    slide.addText(`${processCount} Process${processCount > 1 ? "es" : ""} Assessed: ${processNames}`, {
      x: 6.2,
      y: pillY + 0.2,
      w: 6.3,
      h: 0.35,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.textGray,
    });
  }

  // Confidential
  if (confidential) {
    slide.addText("CONFIDENTIAL", {
      x: 6.2,
      y: SLIDE.height - 1.6,
      w: 3,
      h: 0.35,
      fontSize: 12,
      fontFace: FONTS.heading,
      bold: true,
      color: COLORS.primaryGreen,
    });
  }

  // AlixPartners branding
  slide.addText("AlixPartners", {
    x: SLIDE.width - 3.5,
    y: SLIDE.height - 0.8,
    w: 3,
    h: 0.35,
    fontSize: 16,
    fontFace: FONTS.heading,
    bold: true,
    color: COLORS.primaryGreen,
    align: "right",
  });
}
