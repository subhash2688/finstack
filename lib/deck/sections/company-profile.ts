/**
 * Company Profile Slides
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
  addInsightBox,
  formatCurrency,
  formatPercent,
  makeHeaderRow,
  makeDataRow,
} from "../alix-theme";

export function buildCompanyProfileSlides(
  pptx: PptxGenJS,
  engagement: Engagement,
  depth: "summary" | "detailed",
  pageCounter: { current: number },
  confidential: boolean
): void {
  const companyName = engagement.clientContext.companyName;
  const ctx = engagement.clientContext;
  const intel = engagement.companyIntel;

  addSectionDivider(pptx, 2, "Company Profile");

  // ── Slide 1: Company Overview ──
  const slide1 = pptx.addSlide();
  pageCounter.current++;
  addTitle(slide1, "Company Overview", companyName);
  addFooter(slide1, pageCounter.current, companyName, confidential);

  const sizeLabels: Record<string, string> = {
    startup: "Startup (<$10M revenue, <50 employees)",
    smb: "SMB ($10M–$100M revenue, 50–500 employees)",
    "mid-market": "Mid-Market ($100M–$1B revenue, 500–5,000 employees)",
    enterprise: "Enterprise ($1B+ revenue, 5,000+ employees)",
  };

  // Left column — key attributes as styled rows
  const attributes: [string, string][] = [
    ["Company", ctx.companyName],
    ["Industry", ctx.subSector ? `${ctx.industry} — ${ctx.subSector}` : ctx.industry],
    ["Segment", sizeLabels[ctx.companySize] || ctx.companySize],
    ["Type", ctx.isPublic ? `Public (${ctx.tickerSymbol || "N/A"})` : "Private"],
  ];
  if (ctx.revenue) attributes.push(["Revenue", ctx.revenue]);
  if (ctx.revenueGrowth) attributes.push(["Revenue Growth", ctx.revenueGrowth]);
  if (ctx.headcount) attributes.push(["Headcount", `${ctx.headcount} employees`]);
  if (ctx.erp) attributes.push(["ERP System", ctx.erp]);
  if (ctx.monthlyInvoiceVolume) attributes.push(["Monthly Invoice Volume", ctx.monthlyInvoiceVolume]);

  // Add employee count from EDGAR if available
  const fp = intel?.financialProfile;
  if (fp?.employeeCount && !ctx.headcount) {
    attributes.push(["Headcount (EDGAR)", `${fp.employeeCount.toLocaleString()} employees`]);
  }

  const rows: PptxGenJS.TableRow[] = [makeHeaderRow(["Attribute", "Value"])];
  attributes.forEach(([attr, val], i) => {
    rows.push(makeDataRow([
      { text: attr, opts: { bold: true, color: COLORS.textMedium } },
      val,
    ], i));
  });

  slide1.addTable(rows, {
    x: SLIDE.marginLeft,
    y: 1.55,
    w: 6.5,
    colW: [2.3, 4.2],
    fontSize: 11,
    border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
  });

  // Right column — Processes in scope + characteristics
  const processes = engagement.processAssessments;
  if (processes.length > 0) {
    slide1.addText("Processes in Scope", {
      x: 7.8,
      y: 1.55,
      w: 4.78,
      h: 0.35,
      fontSize: 13,
      fontFace: FONTS.heading,
      bold: true,
      color: COLORS.primaryGreen,
    });

    let py = 2.0;
    for (const pa of processes) {
      const stepCount = pa.generatedWorkflow?.length || 0;
      const ratedCount = pa.maturityRatings ? Object.keys(pa.maturityRatings).length : 0;

      slide1.addShape("rect" as PptxGenJS.ShapeType, {
        x: 7.8, y: py, w: 4.78, h: 0.45,
        fill: { color: COLORS.lightGreen },
        rectRadius: 0.05,
      });
      slide1.addText(pa.processName, {
        x: 8.0, y: py, w: 2.8, h: 0.45,
        fontSize: 11, fontFace: FONTS.heading, bold: true,
        color: COLORS.primaryGreen, valign: "middle",
      });
      slide1.addText(`${ratedCount}/${stepCount} steps rated`, {
        x: 10.5, y: py, w: 2.08, h: 0.45,
        fontSize: 9, fontFace: FONTS.body,
        color: COLORS.textGray, valign: "middle", align: "right",
      });
      py += 0.55;
    }
  }

  // Characteristics
  if (ctx.characteristics) {
    const charY = processes.length > 0 ? 2.0 + processes.length * 0.55 + 0.3 : 2.0;
    addInsightBox(slide1, 7.8, charY, 4.78, 1.5,
      ctx.characteristics, "Key Characteristics"
    );
  }

  if (depth === "summary") return;

  // ── Slide 2 (Detailed): Financial Snapshot ──
  if (fp && fp.yearlyData.length > 0) {
    const slide2 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide2, "Financial Snapshot", `Source: SEC EDGAR  |  Currency: ${fp.currency}`);
    addFooter(slide2, pageCounter.current, companyName, confidential);

    // Key insight
    if (fp.keyInsight) {
      addInsightBox(slide2, SLIDE.marginLeft, 1.55, SLIDE.contentWidth, 0.6,
        fp.keyInsight, "Key Insight"
      );
    }

    const insightOffset = fp.keyInsight ? 0.8 : 0;

    // Income statement table
    const years = [...fp.yearlyData].sort((a, b) => a.year - b.year);
    const fRows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["Metric", ...years.map((y) => String(y.year))]),
    ];

    const metricDefs: [string, (y: typeof years[0]) => string][] = [
      ["Revenue", (y) => y.revenue ? formatCurrency(y.revenue) : "—"],
      ["Revenue Growth", (y) => y.revenueGrowth != null ? formatPercent(y.revenueGrowth) : "—"],
      ["Gross Margin", (y) => y.grossMargin != null ? formatPercent(y.grossMargin) : "—"],
      ["Operating Margin", (y) => y.operatingMargin != null ? formatPercent(y.operatingMargin) : "—"],
      ["Net Margin", (y) => y.netMargin != null ? formatPercent(y.netMargin) : "—"],
    ];

    metricDefs.forEach(([label, fn], i) => {
      const vals = years.map(fn);
      rows.length; // reference to avoid lint
      fRows.push(makeDataRow([
        { text: label, opts: { bold: true } },
        ...vals.map((v) => ({ text: v, opts: { align: "right" as const } })),
      ], i));
    });

    const colWidths = [2.5, ...years.map(() => (SLIDE.contentWidth - 2.5) / years.length)];
    slide2.addTable(fRows, {
      x: SLIDE.marginLeft,
      y: 1.55 + insightOffset,
      w: SLIDE.contentWidth,
      colW: colWidths,
      fontSize: 11,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });

    // Derived metrics (side panel)
    const dm = fp.derivedMetrics;
    if (dm) {
      const dmY = 1.55 + insightOffset + 0.45 * (metricDefs.length + 1) + 0.4;
      slide2.addText("Derived Financial Metrics", {
        x: SLIDE.marginLeft, y: dmY, w: SLIDE.contentWidth, h: 0.35,
        fontSize: 13, bold: true, fontFace: FONTS.heading, color: COLORS.primaryGreen,
      });

      const dmItems: [string, string][] = [];
      if (dm.dso != null) dmItems.push(["Days Sales Outstanding (DSO)", `${dm.dso.toFixed(1)} days`]);
      if (dm.dpo != null) dmItems.push(["Days Payable Outstanding (DPO)", `${dm.dpo.toFixed(1)} days`]);
      if (dm.inventoryTurns != null) dmItems.push(["Inventory Turns", dm.inventoryTurns.toFixed(1)]);
      if (dm.currentRatio != null) dmItems.push(["Current Ratio", dm.currentRatio.toFixed(2)]);
      if (dm.debtToEquity != null) dmItems.push(["Debt-to-Equity", dm.debtToEquity.toFixed(2)]);

      if (dmItems.length > 0) {
        const dmRows: PptxGenJS.TableRow[] = [makeHeaderRow(["Metric", "Value"])];
        dmItems.forEach(([label, val], i) => {
          dmRows.push(makeDataRow([label, { text: val, opts: { align: "right" as const, bold: true } }], i));
        });
        slide2.addTable(dmRows, {
          x: SLIDE.marginLeft, y: dmY + 0.4, w: 6,
          colW: [3.5, 2.5], fontSize: 10,
          border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
        });
      }
    }
  }

  // ── Slide 3 (Detailed): Peer Comparison ──
  const peers = intel?.peerComparison;
  if (peers && peers.peers.length > 0) {
    const slide3 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide3, "Peer Comparison", `Source: SEC EDGAR  |  ${peers.peers.length} peers identified`);
    addFooter(slide3, pageCounter.current, companyName, confidential);

    const peerRows: PptxGenJS.TableRow[] = [
      makeHeaderRow(["Company", "Ticker", "Revenue", "Growth", "Gross Margin", "Op. Margin"]),
    ];

    peers.peers.slice(0, 8).forEach((p, i) => {
      const isTarget = p.ticker === peers.targetTicker;
      peerRows.push(makeDataRow([
        { text: p.companyName, opts: isTarget ? { bold: true, color: COLORS.primaryGreen } : {} },
        { text: p.ticker, opts: isTarget ? { bold: true, color: COLORS.primaryGreen } : {} },
        { text: p.revenue ? formatCurrency(p.revenue) : "—", opts: { align: "right" as const } },
        { text: p.revenueGrowth != null ? formatPercent(p.revenueGrowth) : "—", opts: { align: "right" as const } },
        { text: p.grossMargin != null ? formatPercent(p.grossMargin) : "—", opts: { align: "right" as const } },
        { text: p.operatingMargin != null ? formatPercent(p.operatingMargin) : "—", opts: { align: "right" as const } },
      ], i));
    });

    slide3.addTable(peerRows, {
      x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth,
      colW: [3, 1.0, 2.2, 1.5, 1.8, 2.33], fontSize: 10,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });
  }

  // ── Slide 4 (Detailed): Leadership ──
  const leadership = intel?.leadership;
  if (leadership && leadership.executives.length > 0) {
    const slide4 = pptx.addSlide();
    pageCounter.current++;
    addTitle(slide4, "Leadership Team", "Source: AI Analysis — verify against latest filings");
    addFooter(slide4, pageCounter.current, companyName, confidential);

    const lRows: PptxGenJS.TableRow[] = [makeHeaderRow(["Name", "Title", "Background"])];
    leadership.executives.slice(0, 10).forEach((exec, i) => {
      lRows.push(makeDataRow([
        { text: exec.name, opts: { bold: true } },
        exec.title,
        exec.background || "—",
      ], i));
    });

    slide4.addTable(lRows, {
      x: SLIDE.marginLeft, y: 1.55, w: SLIDE.contentWidth,
      colW: [2.5, 3, 6.33], fontSize: 10,
      border: { type: "solid", pt: 0.5, color: COLORS.borderGray },
    });
  }
}
