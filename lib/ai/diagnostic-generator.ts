import { ClientContext, ProcessAssessment } from "@/types/engagement";
import { CompanyDiagnostic, CompanyIntelligence, CompanyIntel, FinancialProfile, LeadershipProfile, CompanyCommentaryData, PeerComparisonSet } from "@/types/diagnostic";
import { MaturityLevel } from "@/types/workflow";
import { MOCK_PROFILES, resolveProfileKey } from "@/lib/data/mock-diagnostics";
import { resolveCompanyIntelTemplate } from "@/lib/data/company-intel-templates";
import { ScoringResult } from "@/lib/scoring/automation-score";

/**
 * Enrichment data passed to the diagnostic API for deep personalization.
 */
export interface DiagnosticEnrichment {
  companyIntel?: {
    financialProfile?: FinancialProfile;
    peerComparison?: PeerComparisonSet;
    leadership?: LeadershipProfile;
    commentary?: CompanyCommentaryData;
  };
  transcriptEvidence?: {
    processId: string;
    painPoints: string[];
    quotes: { text: string; speaker: string }[];
    toolMentions: string[];
  }[];
  scoringResult?: ScoringResult;
  digitalMaturitySummary?: string;
}

/**
 * Generate an AI-powered diagnostic by calling the API route.
 * Falls back to generateMockDiagnostic() on any error.
 */
export async function generateAIDiagnostic(
  clientContext: ClientContext,
  processAssessments: Pick<ProcessAssessment, "processId" | "processName" | "context">[],
  enrichment?: DiagnosticEnrichment
): Promise<CompanyDiagnostic> {
  try {
    const response = await fetch("/api/diagnostics/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientContext,
        processAssessments: processAssessments.map((p) => ({
          processId: p.processId,
          processName: p.processName,
          context: p.context,
        })),
        ...(enrichment?.companyIntel ? { companyIntel: enrichment.companyIntel } : {}),
        ...(enrichment?.transcriptEvidence ? { transcriptEvidence: enrichment.transcriptEvidence } : {}),
        ...(enrichment?.scoringResult ? { scoringResult: enrichment.scoringResult } : {}),
        ...(enrichment?.digitalMaturitySummary ? { digitalMaturitySummary: enrichment.digitalMaturitySummary } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API returned ${response.status}`);
    }

    const diagnostic: CompanyDiagnostic = await response.json();
    return diagnostic;
  } catch (error) {
    console.warn("AI diagnostic generation failed, falling back to mock:", error);
    return generateMockDiagnostic(clientContext);
  }
}

/**
 * Generate a mock diagnostic for a given client context.
 *
 * Uses industry + companySize to pick the closest mock profile,
 * then customizes the archetype label based on the specific inputs.
 * This is the "static data first" approach — deterministic, no API call.
 * Also serves as the fallback when the AI generation fails.
 */
export function generateMockDiagnostic(
  clientContext: ClientContext
): CompanyDiagnostic {
  const profileKey = resolveProfileKey(
    clientContext.industry,
    clientContext.companySize
  );
  const base = MOCK_PROFILES[profileKey];

  // Customize the archetype label with the company's specifics
  const sizeLabel = formatSize(clientContext.companySize);
  const industryLabel = clientContext.industry || "General";
  const erpNote = clientContext.erp ? ` (${clientContext.erp})` : "";

  const customArchetype = `${sizeLabel} ${industryLabel}${erpNote} — ${extractFocus(base.companyArchetype)}`;

  // Customize priority area links to include engagement context later
  const priorityAreas = base.priorityAreas.map((area) => ({
    ...area,
  }));

  // Build company intelligence with company-specific labeling
  const companyIntelligence: CompanyIntelligence = {
    ...(base.companyIntelligence || {
      industryBenchmarks: `Industry-level benchmarks for ${industryLabel} ${sizeLabel} companies.`,
      competitiveLandscape: "Contact us for competitive landscape analysis.",
    }),
    confidenceLevel: "low" as const,
    confidenceReason: `Using industry-level benchmarks for ${sizeLabel} ${industryLabel} companies`,
  };

  return {
    ...base,
    companyArchetype: customArchetype,
    companyIntelligence,
    priorityAreas,
    generatedAt: new Date().toISOString(),
  };
}

function formatSize(size: string): string {
  switch (size) {
    case "startup":
      return "Startup";
    case "smb":
      return "SMB";
    case "mid-market":
      return "Mid-Market";
    case "enterprise":
      return "Enterprise";
    default:
      return size;
  }
}

/**
 * Extract the focus part from an archetype label (after the em-dash)
 */
function extractFocus(archetype: string): string {
  const dashIndex = archetype.indexOf("—");
  if (dashIndex === -1) return archetype;
  return archetype.substring(dashIndex + 1).trim();
}

/**
 * Maturity data shape expected by the API
 */
export interface MaturityDataEntry {
  processId: string;
  processName: string;
  ratings: Record<string, string>;
  totalSteps: number;
  ratedSteps: number;
}

/**
 * Generate a refined diagnostic that incorporates actual maturity assessment data.
 * Falls back to the existing diagnostic (unchanged) on failure.
 */
export async function generateRefinedDiagnostic(
  clientContext: ClientContext,
  processAssessments: ProcessAssessment[],
  existingDiagnostic: CompanyDiagnostic,
  enrichment?: DiagnosticEnrichment
): Promise<CompanyDiagnostic> {
  // Build maturity data from process assessments
  const maturityData: MaturityDataEntry[] = processAssessments
    .filter((pa) => pa.maturityRatings && Object.keys(pa.maturityRatings).length > 0)
    .map((pa) => ({
      processId: pa.processId,
      processName: pa.processName,
      ratings: pa.maturityRatings as Record<string, string>,
      totalSteps: pa.generatedWorkflow.length,
      ratedSteps: Object.keys(pa.maturityRatings!).length,
    }));

  if (maturityData.length === 0) {
    return existingDiagnostic;
  }

  try {
    const response = await fetch("/api/diagnostics/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientContext,
        processAssessments: processAssessments.map((p) => ({
          processId: p.processId,
          processName: p.processName,
          context: p.context,
        })),
        maturityData,
        isRefinement: true,
        ...(enrichment?.companyIntel ? { companyIntel: enrichment.companyIntel } : {}),
        ...(enrichment?.transcriptEvidence ? { transcriptEvidence: enrichment.transcriptEvidence } : {}),
        ...(enrichment?.scoringResult ? { scoringResult: enrichment.scoringResult } : {}),
        ...(enrichment?.digitalMaturitySummary ? { digitalMaturitySummary: enrichment.digitalMaturitySummary } : {}),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API returned ${response.status}`);
    }

    const diagnostic: CompanyDiagnostic = await response.json();
    return diagnostic;
  } catch (error) {
    console.warn("Refined diagnostic generation failed, keeping existing:", error);
    return existingDiagnostic;
  }
}

/**
 * Generate Company Intelligence data.
 * - Public company with ticker → real financials + headcount from EDGAR
 * - Private company → shows "not available" (no fabricated data)
 * Zero Claude API calls — EDGAR is free.
 *
 * We intentionally do NOT include operational metrics, peer benchmarks,
 * or competitive positioning because we have no credible source for those.
 */
export async function generateCompanyIntel(
  clientContext: ClientContext
): Promise<CompanyIntel> {
  const template = resolveCompanyIntelTemplate(
    clientContext.industry,
    clientContext.companySize
  );

  let financialProfile: FinancialProfile | undefined;
  let confidenceLevel: CompanyIntel["confidenceLevel"] = "low";
  let confidenceReason = "Private company — no public financial data available";

  // Try EDGAR for public companies with a ticker
  if (clientContext.isPublic && clientContext.tickerSymbol) {
    try {
      const res = await fetch(
        `/api/edgar/financials?ticker=${encodeURIComponent(clientContext.tickerSymbol)}`
      );
      if (res.ok) {
        financialProfile = await res.json();
        confidenceLevel = "high";
        confidenceReason = `Financial data from SEC EDGAR 10-K filings (${clientContext.tickerSymbol})`;
      } else {
        confidenceReason = `Public company, but could not retrieve SEC data for ${clientContext.tickerSymbol}`;
        confidenceLevel = "low";
      }
    } catch (error) {
      console.warn("EDGAR fetch failed:", error);
      confidenceReason = `Public company, but SEC data fetch failed for ${clientContext.tickerSymbol}`;
    }
  }

  // Fallback to template (which just says "not available")
  if (!financialProfile) {
    financialProfile = template.financialProfile;
  }

  // Build headcount from EDGAR if available
  const headcount = { ...template.headcount };
  if (financialProfile?.employeeCount) {
    headcount.total = financialProfile.employeeCount;
    headcount.totalFormatted = financialProfile.employeeCount.toLocaleString();
    if (financialProfile.revenuePerEmployee) {
      headcount.revenuePerEmployee = `$${Math.round(financialProfile.revenuePerEmployee)}K`;
    }
    headcount.insight = `${financialProfile.employeeCount.toLocaleString()} employees reported in most recent SEC 10-K filing.`;
  }

  // Fetch additional data for public companies in parallel
  let leadership: LeadershipProfile | undefined;
  let commentary: CompanyCommentaryData | undefined;
  let peerComparison: PeerComparisonSet | undefined;

  if (clientContext.isPublic && clientContext.tickerSymbol) {
    const ticker = clientContext.tickerSymbol;
    const targetRevenue = financialProfile?.yearlyData?.[0]?.revenue;

    // Fetch competitors (10-K), peers (SIC fallback), and commentary in parallel
    const [competitorsResult, peersResult, commentaryResult] = await Promise.allSettled([
      // 10-K competitor extraction
      fetch(`/api/edgar/competitors?ticker=${encodeURIComponent(ticker)}`)
        .then(async (res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .catch(() => null),

      // SIC-based peer comparison (fallback)
      fetch(`/api/edgar/peers?ticker=${encodeURIComponent(ticker)}${targetRevenue ? `&revenue=${targetRevenue}` : ""}`)
        .then(async (res) => {
          if (!res.ok) return null;
          const data = await res.json();
          return {
            targetTicker: ticker,
            peers: data.peers || [],
            generatedAt: new Date().toISOString(),
            competitorSource: "SIC" as const,
          } as PeerComparisonSet;
        })
        .catch(() => null),

      // Executive team + commentary
      fetch("/api/company-commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: clientContext.companyName,
          tickerSymbol: ticker,
        }),
      })
        .then(async (res) => {
          if (!res.ok) return null;
          return res.json();
        })
        .catch(() => null),
    ]);

    // Prefer 10-K competitors over SIC peers
    if (competitorsResult.status === "fulfilled" && competitorsResult.value?.competitors?.length > 0) {
      peerComparison = {
        targetTicker: ticker,
        peers: competitorsResult.value.competitors,
        generatedAt: new Date().toISOString(),
        competitorSource: "10-K",
      };
    } else if (peersResult.status === "fulfilled" && peersResult.value) {
      peerComparison = peersResult.value;
    }

    if (commentaryResult.status === "fulfilled" && commentaryResult.value) {
      leadership = commentaryResult.value.leadership;
      commentary = commentaryResult.value.commentary;
    }
  }

  return {
    confidenceLevel,
    confidenceReason,
    financialProfile,
    headcount,
    leadership,
    commentary,
    peerComparison,
    generatedAt: new Date().toISOString(),
  };
}
