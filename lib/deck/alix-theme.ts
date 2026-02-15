/**
 * AlixPartners Brand Theme for PowerPoint Deck Generation
 *
 * Brand constants, slide master definitions, and helper functions
 * for creating consultant-grade presentations.
 */

import type PptxGenJS from "pptxgenjs";

// ── Brand Colors ──

export const COLORS = {
  primaryGreen: "00694E",
  darkGreen: "004D38",
  lightGreen: "E6F2ED",
  accentGreen: "B8DCC9",
  textDark: "1A1A1A",
  textMedium: "4A4A4A",
  textGray: "888888",
  textLight: "AAAAAA",
  white: "FFFFFF",
  black: "000000",
  tableHeaderBg: "00694E",
  tableAltRow: "F7FAF9",
  red: "C62828",
  amber: "EF8C00",
  green: "2E7D32",
  lightGray: "F5F5F5",
  mediumGray: "E8E8E8",
  borderGray: "D5D5D5",
  cardBg: "F8FAF9",
} as const;

// ── Font ──

export const FONTS = {
  heading: "Arial",
  body: "Arial",
} as const;

// ── Slide Dimensions (inches, 16:9) ──

export const SLIDE = {
  width: 13.33,
  height: 7.5,
  marginLeft: 0.75,
  marginRight: 0.75,
  marginTop: 0.5,
  marginBottom: 0.9,
  contentWidth: 11.83,
  contentTop: 1.55,     // below title
  contentBottom: 6.6,    // above footer
  contentHeight: 5.05,   // contentBottom - contentTop
} as const;

// ── Maturity Level Colors ──

export const MATURITY_COLORS: Record<string, string> = {
  manual: COLORS.red,
  "semi-automated": COLORS.amber,
  automated: COLORS.green,
};

export const MATURITY_LABELS: Record<string, string> = {
  manual: "Manual",
  "semi-automated": "Semi-Automated",
  automated: "Automated",
};

// ── Section Definitions ──

export interface DeckSection {
  id:
    | "executive-summary"
    | "company-profile"
    | "current-state"
    | "gap-analysis"
    | "opportunities"
    | "technology"
    | "risks"
    | "appendix";
  label: string;
  description: string;
  defaultIncluded: boolean;
  depth: "summary" | "detailed";
}

export interface DeckConfig {
  sections: DeckSection[];
  includeConfidentialWatermark: boolean;
}

export const DEFAULT_SECTIONS: DeckSection[] = [
  {
    id: "executive-summary",
    label: "Executive Summary",
    description: "Company archetype, total savings, top opportunities",
    defaultIncluded: true,
    depth: "detailed",
  },
  {
    id: "company-profile",
    label: "Company Profile",
    description: "Company overview, financials, peer comparison",
    defaultIncluded: true,
    depth: "summary",
  },
  {
    id: "current-state",
    label: "Current State Assessment",
    description: "Process maturity ratings, pain points, transcript evidence",
    defaultIncluded: true,
    depth: "detailed",
  },
  {
    id: "gap-analysis",
    label: "Gap Analysis",
    description: "AI applicability, automation gaps, diagnostic challenges",
    defaultIncluded: true,
    depth: "summary",
  },
  {
    id: "opportunities",
    label: "Opportunity Areas",
    description: "ROI breakdown, per-step savings, assumptions",
    defaultIncluded: true,
    depth: "detailed",
  },
  {
    id: "technology",
    label: "Technology Solutions",
    description: "Capability mapping, build vs buy, vendor recommendations",
    defaultIncluded: true,
    depth: "summary",
  },
  {
    id: "risks",
    label: "Risks & Considerations",
    description: "Implementation risks, change management, disclaimers",
    defaultIncluded: true,
    depth: "summary",
  },
  {
    id: "appendix",
    label: "Appendix",
    description: "Full data tables, methodology, data sources",
    defaultIncluded: false,
    depth: "summary",
  },
];

// ── Helper: Format Currency ──

export function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`;
  }
  return `$${value.toLocaleString()}`;
}

// ── Helper: Format Percent ──

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

// ── Helper: Format Savings Range ──

export function formatSavingsRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`;
}

// ── Slide Helpers ──

/**
 * Add the thin green accent bar at the top of every content slide.
 */
function addTopBar(slide: PptxGenJS.Slide): void {
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: SLIDE.width,
    h: 0.08,
    fill: { color: COLORS.primaryGreen },
  });
}

/**
 * Add the standard AlixPartners footer to a slide.
 */
export function addFooter(
  slide: PptxGenJS.Slide,
  pageNum: number,
  companyName: string,
  confidential: boolean
): void {
  const footerY = SLIDE.height - 0.5;

  // Thin line above footer
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: SLIDE.marginLeft,
    y: footerY - 0.08,
    w: SLIDE.contentWidth,
    h: 0.01,
    fill: { color: COLORS.mediumGray },
  });

  // Left: AlixPartners
  slide.addText("AlixPartners", {
    x: SLIDE.marginLeft,
    y: footerY,
    w: 2.5,
    h: 0.3,
    fontSize: 8,
    fontFace: FONTS.heading,
    bold: true,
    color: COLORS.primaryGreen,
  });

  // Center: confidential + company
  const centerText = confidential
    ? `CONFIDENTIAL  |  ${companyName}`
    : companyName;
  slide.addText(centerText, {
    x: SLIDE.width / 2 - 3,
    y: footerY,
    w: 6,
    h: 0.3,
    fontSize: 7,
    fontFace: FONTS.body,
    color: COLORS.textLight,
    align: "center",
  });

  // Right: page number
  slide.addText(String(pageNum), {
    x: SLIDE.width - SLIDE.marginRight - 1,
    y: footerY,
    w: 1,
    h: 0.3,
    fontSize: 8,
    fontFace: FONTS.body,
    color: COLORS.textGray,
    align: "right",
  });

  addTopBar(slide);
}

/**
 * Add a slide title with optional subtitle.
 */
export function addTitle(
  slide: PptxGenJS.Slide,
  title: string,
  subtitle?: string
): void {
  slide.addText(title, {
    x: SLIDE.marginLeft,
    y: 0.35,
    w: SLIDE.contentWidth,
    h: 0.55,
    fontSize: 26,
    fontFace: FONTS.heading,
    bold: true,
    color: COLORS.textDark,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: SLIDE.marginLeft,
      y: 0.9,
      w: SLIDE.contentWidth,
      h: 0.4,
      fontSize: 13,
      fontFace: FONTS.body,
      color: COLORS.textGray,
    });
  }
}

/**
 * Create a section divider slide (full green background).
 */
export function addSectionDivider(
  pptx: PptxGenJS,
  sectionNumber: number,
  sectionTitle: string
): PptxGenJS.Slide {
  const slide = pptx.addSlide();
  slide.background = { fill: COLORS.primaryGreen };

  // Decorative lighter stripe on left
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 0,
    y: 0,
    w: 0.4,
    h: SLIDE.height,
    fill: { color: COLORS.darkGreen },
  });

  // Section number — large, light
  const numStr = sectionNumber < 10 ? `0${sectionNumber}` : String(sectionNumber);
  slide.addText(numStr, {
    x: 1.2,
    y: 2.0,
    w: 3,
    h: 0.7,
    fontSize: 20,
    fontFace: FONTS.body,
    color: COLORS.accentGreen,
  });

  // Section title — very large
  slide.addText(sectionTitle, {
    x: 1.2,
    y: 2.7,
    w: 10,
    h: 1.3,
    fontSize: 44,
    fontFace: FONTS.heading,
    bold: true,
    color: COLORS.white,
  });

  // Bottom line
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x: 1.2,
    y: SLIDE.height - 1.2,
    w: 3,
    h: 0.02,
    fill: { color: COLORS.accentGreen },
  });

  // Footer tagline
  slide.addText("When it really matters.", {
    x: 1.2,
    y: SLIDE.height - 1.0,
    w: 4,
    h: 0.35,
    fontSize: 11,
    fontFace: FONTS.body,
    color: COLORS.accentGreen,
    italic: true,
  });

  return slide;
}

/**
 * Build table header row with green background.
 */
export function makeHeaderRow(cells: string[]): PptxGenJS.TableRow {
  return cells.map((text) => ({
    text,
    options: {
      bold: true,
      color: COLORS.white,
      fill: { color: COLORS.tableHeaderBg },
      fontSize: 11,
      fontFace: FONTS.heading,
      valign: "middle" as const,
      align: "left" as const,
      margin: [6, 8, 6, 8] as [number, number, number, number],
    },
  }));
}

/**
 * Build a data row with optional alternating background.
 */
export function makeDataRow(
  cells: (string | { text: string; opts?: Record<string, unknown> })[],  // eslint-disable-line
  rowIndex: number
): PptxGenJS.TableRow {
  const fill = rowIndex % 2 === 1 ? COLORS.tableAltRow : COLORS.white;
  return cells.map((cell) => {
    const text = typeof cell === "string" ? cell : cell.text;
    const extra = typeof cell === "string" ? {} : (cell.opts || {});
    return {
      text,
      options: {
        fill: { color: fill },
        fontSize: 10,
        fontFace: FONTS.body,
        color: COLORS.textDark,
        valign: "middle" as const,
        align: "left" as const,
        margin: [5, 8, 5, 8] as [number, number, number, number],
        ...extra,
      },
    };
  });
}

/**
 * Add a KPI box (metric + label) — large, striking.
 */
export function addKpiBox(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  metric: string,
  label: string
): void {
  // Box background
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x,
    y,
    w,
    h,
    fill: { color: COLORS.lightGreen },
    rectRadius: 0.1,
  });

  // Green left accent stripe
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x,
    y,
    w: 0.06,
    h,
    fill: { color: COLORS.primaryGreen },
    rectRadius: 0.03,
  });

  // Metric value
  slide.addText(metric, {
    x: x + 0.15,
    y: y + h * 0.08,
    w: w - 0.3,
    h: h * 0.55,
    fontSize: 26,
    fontFace: FONTS.heading,
    bold: true,
    color: COLORS.primaryGreen,
    align: "center",
    valign: "bottom",
    shrinkText: true,
  });

  // Label
  slide.addText(label, {
    x: x + 0.15,
    y: y + h * 0.62,
    w: w - 0.3,
    h: h * 0.3,
    fontSize: 9,
    fontFace: FONTS.body,
    color: COLORS.textMedium,
    align: "center",
    valign: "top",
  });
}

/**
 * Add a large hero metric at the center of a slide area.
 */
export function addHeroMetric(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  metric: string,
  label: string,
  sublabel?: string
): void {
  slide.addText(metric, {
    x,
    y,
    w,
    h: 0.9,
    fontSize: 48,
    fontFace: FONTS.heading,
    bold: true,
    color: COLORS.primaryGreen,
    align: "center",
    shrinkText: true,
  });

  slide.addText(label, {
    x,
    y: y + 0.85,
    w,
    h: 0.4,
    fontSize: 14,
    fontFace: FONTS.body,
    color: COLORS.textMedium,
    align: "center",
  });

  if (sublabel) {
    slide.addText(sublabel, {
      x,
      y: y + 1.2,
      w,
      h: 0.3,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.textGray,
      align: "center",
      italic: true,
    });
  }
}

/**
 * Add a callout / insight box with green left border.
 */
export function addInsightBox(
  slide: PptxGenJS.Slide,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  label?: string
): void {
  // Background
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x,
    y,
    w,
    h,
    fill: { color: COLORS.cardBg },
    rectRadius: 0.06,
  });

  // Left accent
  slide.addShape("rect" as PptxGenJS.ShapeType, {
    x,
    y,
    w: 0.05,
    h,
    fill: { color: COLORS.primaryGreen },
  });

  if (label) {
    slide.addText(label.toUpperCase(), {
      x: x + 0.2,
      y: y + 0.08,
      w: w - 0.3,
      h: 0.25,
      fontSize: 8,
      fontFace: FONTS.heading,
      bold: true,
      color: COLORS.primaryGreen,
    });
    slide.addText(text, {
      x: x + 0.2,
      y: y + 0.3,
      w: w - 0.3,
      h: h - 0.4,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.textDark,
      valign: "top",
      wrap: true,
    });
  } else {
    slide.addText(text, {
      x: x + 0.2,
      y: y + 0.08,
      w: w - 0.3,
      h: h - 0.16,
      fontSize: 10,
      fontFace: FONTS.body,
      color: COLORS.textDark,
      valign: "top",
      wrap: true,
      italic: true,
    });
  }
}
