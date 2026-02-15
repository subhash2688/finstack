/**
 * Deck Generator — Main Orchestrator
 *
 * Takes an Engagement + DeckConfig, computes all ROI data,
 * and builds a full PowerPoint presentation using pptxgenjs.
 */

import type PptxGenJS from "pptxgenjs";
import { Engagement } from "@/types/engagement";
import { ProcessFindings, ExecutiveSummaryData } from "@/types/findings";
import { calculateProcessFindings, buildExecutiveSummary } from "@/lib/calculators/savings-calculator";
import { DeckConfig, DeckSection } from "./alix-theme";
import { buildCoverSlide } from "./sections/cover";
import { buildExecutiveSummarySlides } from "./sections/executive-summary";
import { buildCompanyProfileSlides } from "./sections/company-profile";
import { buildCurrentStateSlides } from "./sections/current-state";
import { buildGapAnalysisSlides } from "./sections/gap-analysis";
import { buildOpportunitiesSlides } from "./sections/opportunities";
import { buildTechnologySlides } from "./sections/technology";
import { buildRisksSlides } from "./sections/risks";
import { buildAppendixSlides } from "./sections/appendix";

/**
 * Compute all process findings and executive summary from engagement data.
 */
function computeFindings(engagement: Engagement): {
  allFindings: ProcessFindings[];
  summary: ExecutiveSummaryData;
} {
  const allFindings: ProcessFindings[] = [];

  for (const assessment of engagement.processAssessments) {
    const steps = assessment.generatedWorkflow || [];
    if (steps.length === 0) continue;

    const findings = calculateProcessFindings(
      assessment,
      steps,
      engagement.clientContext.companySize,
      engagement.customAssumptions,
      engagement.clientContext.erp
    );
    allFindings.push(findings);
  }

  const summary = buildExecutiveSummary(allFindings);
  return { allFindings, summary };
}

/**
 * Get the depth setting for a section from the config.
 */
function getDepth(config: DeckConfig, sectionId: DeckSection["id"]): "summary" | "detailed" {
  const section = config.sections.find((s) => s.id === sectionId);
  return section?.depth ?? "summary";
}

/**
 * Check if a section is included in the config.
 */
function isIncluded(config: DeckConfig, sectionId: DeckSection["id"]): boolean {
  return config.sections.some((s) => s.id === sectionId);
}

/**
 * Generate a PowerPoint deck from an engagement and configuration.
 */
export async function generateDeck(
  engagement: Engagement,
  config: DeckConfig
): Promise<void> {
  // Dynamic import — pptxgenjs uses node:fs internally, so it can't be
  // statically imported in Next.js (webpack tries to bundle it at build time).
  const PptxGenJS = (await import("pptxgenjs")).default;
  const pptx = new PptxGenJS();

  // Presentation metadata
  pptx.author = "AlixPartners";
  pptx.company = "AlixPartners";
  pptx.subject = `Process Intelligence Assessment — ${engagement.clientContext.companyName}`;
  pptx.title = `${engagement.clientContext.companyName} — Assessment Deck`;
  pptx.layout = "LAYOUT_WIDE"; // 13.33" x 7.5" (16:9)

  // Compute ROI data
  const { allFindings, summary } = computeFindings(engagement);

  // Page counter (mutable ref for section builders)
  const pageCounter = { current: 0 };
  const confidential = config.includeConfidentialWatermark;
  const companyName = engagement.clientContext.companyName;

  // ── Always: Cover Slide ──
  buildCoverSlide(pptx, engagement, confidential);

  // ── Optional sections in order ──
  if (isIncluded(config, "executive-summary")) {
    buildExecutiveSummarySlides(
      pptx, engagement, summary, allFindings,
      getDepth(config, "executive-summary"), pageCounter, confidential
    );
  }

  if (isIncluded(config, "company-profile")) {
    buildCompanyProfileSlides(
      pptx, engagement,
      getDepth(config, "company-profile"), pageCounter, confidential
    );
  }

  if (isIncluded(config, "current-state")) {
    buildCurrentStateSlides(
      pptx, engagement,
      getDepth(config, "current-state"), pageCounter, confidential
    );
  }

  if (isIncluded(config, "gap-analysis")) {
    buildGapAnalysisSlides(
      pptx, engagement,
      getDepth(config, "gap-analysis"), pageCounter, confidential
    );
  }

  if (isIncluded(config, "opportunities")) {
    buildOpportunitiesSlides(
      pptx, engagement, summary, allFindings,
      getDepth(config, "opportunities"), pageCounter, confidential
    );
  }

  if (isIncluded(config, "technology")) {
    buildTechnologySlides(
      pptx, engagement, allFindings,
      getDepth(config, "technology"), pageCounter, confidential
    );
  }

  if (isIncluded(config, "risks")) {
    buildRisksSlides(
      pptx, engagement,
      getDepth(config, "risks"), pageCounter, confidential
    );
  }

  if (isIncluded(config, "appendix")) {
    buildAppendixSlides(
      pptx, engagement, allFindings,
      getDepth(config, "appendix"), pageCounter, confidential
    );
  }

  // ── Generate and download ──
  // Use write() + manual Blob download instead of writeFile() because
  // our webpack fallbacks (fs: false) break pptxgenjs's built-in FileSaver.
  const fileName = `${companyName.replace(/[^a-zA-Z0-9]/g, "_")}_Assessment_Deck.pptx`;
  const blob = await pptx.write({ outputType: "blob" }) as Blob;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
