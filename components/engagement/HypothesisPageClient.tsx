"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { CompanyDiagnostic } from "@/types/diagnostic";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import {
  generateAIDiagnostic,
  generateRefinedDiagnostic,
  DiagnosticEnrichment,
} from "@/lib/ai/diagnostic-generator";
import { computeAutomationScore, ScoringResult } from "@/lib/scoring/automation-score";
import { computePeerMedians } from "@/lib/scoring/peer-medians";
import { DiagnosticOverview } from "@/components/diagnostic/DiagnosticOverview";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Sparkles, ChevronDown, ChevronUp, Info, ArrowRight } from "lucide-react";
import Link from "next/link";

interface HypothesisPageClientProps {
  engagementId: string;
}

/**
 * Check whether the diagnostic is stale — i.e., maturity ratings
 * have been added or changed since the diagnostic was generated.
 */
function isDiagnosticStale(engagement: Engagement): boolean {
  const diagnostic = engagement.diagnostic;
  if (!diagnostic?.generatedAt) return false;

  const generatedAt = new Date(diagnostic.generatedAt).getTime();

  const hasRatings = engagement.processAssessments.some(
    (pa) => pa.maturityRatings && Object.keys(pa.maturityRatings).length > 0
  );

  if (!hasRatings) return false;

  const updatedAt = new Date(engagement.updatedAt).getTime();
  return updatedAt > generatedAt;
}

/**
 * Compute delta summary between previous and current diagnostics.
 */
interface DiagnosticDelta {
  aiApplicabilityShifts: {
    bucket: string;
    oldRange: string;
    newRange: string;
  }[];
  opportunityShifts: {
    metric: string;
    oldRange: string;
    newRange: string;
  }[];
}

function computeDelta(
  previous: CompanyDiagnostic,
  current: CompanyDiagnostic
): DiagnosticDelta | null {
  const aiShifts: DiagnosticDelta["aiApplicabilityShifts"] = [];
  const oppShifts: DiagnosticDelta["opportunityShifts"] = [];

  const buckets = [
    { key: "highLeverage" as const, label: "High Leverage" },
    { key: "humanInTheLoop" as const, label: "Human-in-the-Loop" },
    { key: "humanLed" as const, label: "Human-Led" },
  ];
  for (const { key, label } of buckets) {
    const prev = previous.aiApplicability[key];
    const curr = current.aiApplicability[key];
    if (prev.min !== curr.min || prev.max !== curr.max) {
      aiShifts.push({
        bucket: label,
        oldRange: `${prev.min}–${prev.max}%`,
        newRange: `${curr.min}–${curr.max}%`,
      });
    }
  }

  const metrics = [
    { key: "effortAddressable" as const, label: "Effort Addressable" },
    { key: "costSavingsRange" as const, label: "Cost Savings" },
    { key: "capacityUnlocked" as const, label: "Capacity Unlocked" },
  ];
  for (const { key, label } of metrics) {
    const prev = previous.automationOpportunity[key];
    const curr = current.automationOpportunity[key];
    if (prev.min !== curr.min || prev.max !== curr.max) {
      oppShifts.push({
        metric: label,
        oldRange: `${prev.min}–${prev.max}%`,
        newRange: `${curr.min}–${curr.max}%`,
      });
    }
  }

  if (aiShifts.length === 0 && oppShifts.length === 0) return null;
  return { aiApplicabilityShifts: aiShifts, opportunityShifts: oppShifts };
}

function hasAssessmentData(engagement: Engagement): boolean {
  return engagement.processAssessments.some(
    (pa) => pa.maturityRatings && Object.keys(pa.maturityRatings).length > 0
  );
}

/**
 * Build enrichment data from all available engagement sources.
 */
function buildEnrichment(eng: Engagement): DiagnosticEnrichment | undefined {
  const enrichment: DiagnosticEnrichment = {};
  let hasData = false;

  // Company Intel (EDGAR + LLM)
  if (eng.companyIntel) {
    const ci = eng.companyIntel;
    const companyIntel: DiagnosticEnrichment["companyIntel"] = {};
    if (ci.financialProfile) { companyIntel.financialProfile = ci.financialProfile; hasData = true; }
    if (ci.peerComparison) { companyIntel.peerComparison = ci.peerComparison; hasData = true; }
    if (ci.leadership) { companyIntel.leadership = ci.leadership; hasData = true; }
    if (ci.commentary) { companyIntel.commentary = ci.commentary; hasData = true; }
    if (hasData) enrichment.companyIntel = companyIntel;
  }

  // Deterministic Scoring (Layer 1) — runs if EDGAR data is available
  if (eng.companyIntel?.financialProfile && eng.companyIntel?.peerComparison) {
    const fp = eng.companyIntel.financialProfile;
    const pc = eng.companyIntel.peerComparison;

    // Split peers into tiers
    const sicPeers = pc.competitorSource === "SIC" ? pc.peers : [];
    const tenKPeers = pc.competitorSource === "10-K" ? pc.peers : [];
    const userPeers = pc.customPeers || [];

    // Build derived metrics map for peers (from the peer data we have)
    // Note: full derived metrics require batch-fetching profiles which happens server-side
    // For client-side scoring, we use what's available in PeerFinancials

    const peerMedians = computePeerMedians(sicPeers, tenKPeers, userPeers);

    const erpName = eng.clientContext.erp
      || eng.processAssessments.map((p) => p.context?.erp).find(Boolean)
      || undefined;

    const scoringResult = computeAutomationScore({
      financialProfile: fp,
      peerMedians,
      erpName,
      companySize: eng.clientContext.companySize,
    });

    enrichment.scoringResult = scoringResult;
    hasData = true;
  }

  // Digital Maturity Summary (Layer 2) — if scan has been run
  if (eng.digitalMaturityScan) {
    const scan = eng.digitalMaturityScan;
    const parts: string[] = [];
    if (scan.techStack) {
      const techs = scan.techStack.detectedTechnologies || [];
      if (techs.length > 0) parts.push(`Tech stack: ${techs.slice(0, 8).join(", ")}`);
      if (scan.techStack.overallTechMaturity) parts.push(`Tech maturity: Level ${scan.techStack.overallTechMaturity}/4`);
    }
    if (scan.maturityAssessment) {
      parts.push(`Overall maturity: Level ${scan.maturityAssessment.overallLevel}/4 (${scan.maturityAssessment.overallLevelName})`);
    }
    if (scan.marketSignals?.competitivePressure) {
      parts.push(`Competitive pressure: ${scan.marketSignals.competitivePressure}`);
    }
    if (parts.length > 0) {
      enrichment.digitalMaturitySummary = parts.join("\n");
      hasData = true;
    }
  }

  // Transcript Evidence
  const transcriptEvidence: DiagnosticEnrichment["transcriptEvidence"] = [];
  for (const pa of eng.processAssessments) {
    if (!pa.transcriptIntelligence?.analyses?.length) continue;
    const painPoints: string[] = [];
    const quotes: { text: string; speaker: string }[] = [];
    const toolMentions: string[] = [];

    for (const analysis of pa.transcriptIntelligence.analyses) {
      for (const step of analysis.stepEvidence) {
        painPoints.push(...step.painPoints);
        for (const q of step.quotes) {
          quotes.push({ text: q.text, speaker: q.speaker });
        }
      }
      toolMentions.push(...analysis.meta.toolSystemMentions);
    }

    if (painPoints.length > 0 || quotes.length > 0) {
      transcriptEvidence.push({
        processId: pa.processId,
        painPoints: painPoints.slice(0, 5),
        quotes: quotes.slice(0, 5),
        toolMentions: Array.from(new Set(toolMentions)),
      });
      hasData = true;
    }
  }
  if (transcriptEvidence.length > 0) enrichment.transcriptEvidence = transcriptEvidence;

  return hasData ? enrichment : undefined;
}

export function HypothesisPageClient({
  engagementId,
}: HypothesisPageClientProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [delta, setDelta] = useState<DiagnosticDelta | null>(null);
  const [showDelta, setShowDelta] = useState(true);
  const hasAutoGenerated = useRef(false);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
  }, [engagementId, router]);

  // Auto-generate diagnostic on mount if not present
  useEffect(() => {
    if (!engagement || hasAutoGenerated.current) return;
    if (engagement.diagnostic) return;

    hasAutoGenerated.current = true;
    generateDiagnostic(engagement);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagement]);

  const stale = useMemo(
    () => (engagement ? isDiagnosticStale(engagement) : false),
    [engagement]
  );

  // Compute scoring result for display (same logic as buildEnrichment, but for the panel)
  const scoringResult: ScoringResult | null = useMemo(() => {
    if (!engagement?.companyIntel?.financialProfile || !engagement?.companyIntel?.peerComparison) return null;
    const fp = engagement.companyIntel.financialProfile;
    const pc = engagement.companyIntel.peerComparison;
    const sicPeers = pc.competitorSource === "SIC" ? pc.peers : [];
    const tenKPeers = pc.competitorSource === "10-K" ? pc.peers : [];
    const userPeers = pc.customPeers || [];
    const peerMedians = computePeerMedians(sicPeers, tenKPeers, userPeers);
    const erpName = engagement.clientContext.erp
      || engagement.processAssessments.map((p) => p.context?.erp).find(Boolean)
      || undefined;
    return computeAutomationScore({
      financialProfile: fp,
      peerMedians,
      erpName,
      companySize: engagement.clientContext.companySize,
    });
  }, [engagement]);

  const generateDiagnostic = async (eng: Engagement) => {
    setIsGenerating(true);
    setDelta(null);
    try {
      const enrichment = buildEnrichment(eng);
      const diagnostic = await generateAIDiagnostic(
        eng.clientContext,
        eng.processAssessments,
        enrichment
      );
      const updated = {
        ...eng,
        diagnostic,
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
      window.dispatchEvent(new Event("engagement-updated"));
    } finally {
      setIsGenerating(false);
    }
  };

  const refineDiagnostic = async (eng: Engagement) => {
    if (!eng.diagnostic) return;
    setIsRefining(true);
    setDelta(null);
    try {
      const enrichment = buildEnrichment(eng);
      const previousDiagnostic = eng.diagnostic;
      const refined = await generateRefinedDiagnostic(
        eng.clientContext,
        eng.processAssessments,
        previousDiagnostic,
        enrichment
      );

      const history = [...(eng.diagnosticHistory || []), previousDiagnostic];

      const updated: Engagement = {
        ...eng,
        diagnostic: refined,
        diagnosticHistory: history,
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
      window.dispatchEvent(new Event("engagement-updated"));

      const computedDelta = computeDelta(previousDiagnostic, refined);
      setDelta(computedDelta);
      setShowDelta(true);
    } finally {
      setIsRefining(false);
    }
  };

  if (!engagement) {
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  if (isGenerating || isRefining) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <div className="text-center">
          <p className="font-medium">
            {isRefining ? "Refining Opportunity Areas" : "Generating Opportunity Areas"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            {isRefining
              ? "Recalibrating based on your assessment data..."
              : `Analyzing ${engagement.clientContext.companyName}\u2019s profile and processes...`}
          </p>
        </div>
      </div>
    );
  }

  if (!engagement.diagnostic) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-muted-foreground mb-4">
          Failed to generate opportunity areas. Please try again.
        </p>
        <Button onClick={() => generateDiagnostic(engagement)}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const isRefined =
    engagement.diagnosticHistory && engagement.diagnosticHistory.length > 0;
  const hasAssessment = hasAssessmentData(engagement);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
          {isRefined ? "Refined Opportunity Areas" : "Initial Opportunity Areas (Outside-In)"}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => generateDiagnostic(engagement)}
          disabled={isGenerating || isRefining}
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Regenerate
        </Button>
      </div>

      {/* Outside-in banner when no assessment data */}
      {!hasAssessment && !stale && (
        <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-2.5">
            <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-blue-900">
                Outside-in analysis
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                These opportunities are based on outside-in analysis of company profile and industry benchmarks. Take the process assessment to refine with internal expert knowledge.
              </p>
            </div>
          </div>
          <Link href={`/engagements/${engagementId}/assessment`}>
            <Button
              size="sm"
              variant="outline"
              className="ml-4 shrink-0 border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              Take Assessment
              <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      )}

      {/* Staleness banner — assessment data exists but diagnostic is stale */}
      {stale && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-amber-900">
              Assessment data available
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Assessment data available — refresh to incorporate your process-level insights into these opportunity areas.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => refineDiagnostic(engagement)}
            disabled={isRefining}
            className="ml-4 shrink-0"
          >
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            Refresh Opportunities
          </Button>
        </div>
      )}

      {/* Delta summary after refinement */}
      {delta && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <button
            onClick={() => setShowDelta(!showDelta)}
            className="flex items-center justify-between w-full text-left"
          >
            <p className="text-sm font-medium text-blue-900">
              Opportunity areas updated — see what changed
            </p>
            {showDelta ? (
              <ChevronUp className="h-4 w-4 text-blue-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-blue-600" />
            )}
          </button>
          {showDelta && (
            <div className="mt-3 space-y-2">
              {delta.aiApplicabilityShifts.map((shift) => (
                <div
                  key={shift.bucket}
                  className="flex items-center gap-2 text-xs text-blue-800"
                >
                  <span className="font-medium">{shift.bucket}:</span>
                  <span className="text-blue-600 line-through">
                    {shift.oldRange}
                  </span>
                  <span className="text-blue-900 font-medium">
                    {shift.newRange}
                  </span>
                </div>
              ))}
              {delta.opportunityShifts.map((shift) => (
                <div
                  key={shift.metric}
                  className="flex items-center gap-2 text-xs text-blue-800"
                >
                  <span className="font-medium">{shift.metric}:</span>
                  <span className="text-blue-600 line-through">
                    {shift.oldRange}
                  </span>
                  <span className="text-blue-900 font-medium">
                    {shift.newRange}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <DiagnosticOverview
        diagnostic={engagement.diagnostic}
        companyName={engagement.clientContext.companyName}
        industry={engagement.clientContext.industry}
        companySize={engagement.clientContext.companySize}
        engagementId={engagement.id}
        scoringResult={scoringResult}
        engagement={engagement}
        setEngagement={setEngagement}
      />
    </div>
  );
}
