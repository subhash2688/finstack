"use client";

import { useState } from "react";
import { CompanyDiagnostic, PeerFinancials } from "@/types/diagnostic";
import { Engagement } from "@/types/engagement";
import { ScoringResult } from "@/lib/scoring/automation-score";
import { ExecutiveSummaryCard } from "./ExecutiveSummaryCard";
import { ChallengeCard } from "./ChallengeCard";
import { AIApplicabilityChart } from "./AIApplicabilityChart";
import { OpportunityRanges } from "./OpportunityRanges";
import { PriorityAreaCard } from "./PriorityAreaCard";
import { ScoringInsightsPanel } from "@/components/engagement/ScoringInsightsPanel";
import { DigitalMaturitySection } from "@/components/engagement/DigitalMaturitySection";
import { BarChart3, AlertTriangle, Radar } from "lucide-react";

interface DiagnosticOverviewProps {
  diagnostic: CompanyDiagnostic;
  companyName: string;
  industry: string;
  companySize: string;
  engagementId?: string;
  scoringResult?: ScoringResult | null;
  engagement?: Engagement | null;
  setEngagement?: (eng: Engagement) => void;
}

type SectionId = "quantitative" | "challenges" | "digital";

export function DiagnosticOverview({
  diagnostic,
  companyName,
  industry,
  companySize,
  engagementId,
  scoringResult,
  engagement,
  setEngagement,
}: DiagnosticOverviewProps) {
  const [activeSection, setActiveSection] = useState<SectionId | null>("quantitative");

  const scan = engagement?.digitalMaturityScan;
  const maturityLevel = scan?.maturityAssessment?.overallLevel ?? null;

  // Peer change handler — propagates to engagement storage
  const handlePeerChange = (customPeers: PeerFinancials[], removedTickers: string[]) => {
    if (!engagement || !setEngagement) return;
    const updated: Engagement = {
      ...engagement,
      companyIntel: engagement.companyIntel ? {
        ...engagement.companyIntel,
        peerComparison: {
          ...(engagement.companyIntel.peerComparison ?? {
            targetTicker: engagement.clientContext.tickerSymbol ?? "",
            peers: [],
            generatedAt: new Date().toISOString(),
          }),
          customPeers,
          removedTickers,
        },
      } : undefined,
      updatedAt: new Date().toISOString(),
    };
    // Save via dynamic import to avoid circular dep
    import("@/lib/storage/engagements").then(({ saveEngagement }) => {
      saveEngagement(updated);
    });
    setEngagement(updated);
    window.dispatchEvent(new Event("engagement-updated"));
  };

  // Build summary lines for section tiles
  const ai = diagnostic.aiApplicability;
  const peerCount = engagement?.companyIntel?.peerComparison?.peers?.length ?? 0;
  const customCount = engagement?.companyIntel?.peerComparison?.customPeers?.length ?? 0;

  const quantSummary = scoringResult
    ? `Complexity ${scoringResult.complexityScore}/100 · Ceiling ${scoringResult.constraints.highLeverageMax}% · ${peerCount + customCount} peers`
    : `High-Leverage ${ai.highLeverage.min}–${ai.highLeverage.max}%`;

  const challengeSummary = `${diagnostic.challenges.length} challenges · ${diagnostic.priorityAreas.length} priority areas`;

  const digitalSummaryParts: string[] = [];
  if (scan?.maturityAssessment) {
    digitalSummaryParts.push(`Level ${scan.maturityAssessment.overallLevel}: ${scan.maturityAssessment.overallLevelName}`);
  }
  if (scan?.techStack?.detectedTechnologies?.length) {
    digitalSummaryParts.push(`${scan.techStack.detectedTechnologies.length} techs`);
  }
  if (scan?.marketSignals?.peerMoves?.length) {
    digitalSummaryParts.push(`${scan.marketSignals.peerMoves.length} peer moves`);
  }
  const digitalSummary = digitalSummaryParts.length > 0
    ? digitalSummaryParts.join(" · ")
    : "Run scan for tech stack & maturity";

  const toggleSection = (id: SectionId) => {
    setActiveSection(activeSection === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* 1. EXECUTIVE SUMMARY — always visible, never collapsible */}
      <ExecutiveSummaryCard
        diagnostic={diagnostic}
        companyName={companyName}
        industry={industry}
        companySize={companySize}
        scoringResult={scoringResult}
        maturityLevel={maturityLevel}
      />

      {/* 2. SECTION TILES — 3 clickable tiles in a row */}
      <div className="grid grid-cols-3 gap-3">
        <SectionTile
          icon={<BarChart3 className="h-5 w-5" />}
          title="Quantitative Analysis"
          summary={quantSummary}
          isActive={activeSection === "quantitative"}
          onClick={() => toggleSection("quantitative")}
          color="blue"
        />
        <SectionTile
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Challenges & Priorities"
          summary={challengeSummary}
          isActive={activeSection === "challenges"}
          onClick={() => toggleSection("challenges")}
          color="amber"
        />
        <SectionTile
          icon={<Radar className="h-5 w-5" />}
          title="Digital Intelligence"
          summary={digitalSummary}
          isActive={activeSection === "digital"}
          onClick={() => toggleSection("digital")}
          color="purple"
        />
      </div>

      {/* 3. EXPANDED SECTION CONTENT */}
      {activeSection === "quantitative" && (
        <div className="rounded-lg border border-blue-200 bg-white p-5 space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* AI Applicability + Automation Opportunity */}
          <div className="grid lg:grid-cols-2 gap-6">
            <AIApplicabilityChart split={diagnostic.aiApplicability} />
            <OpportunityRanges opportunity={diagnostic.automationOpportunity} />
          </div>

          {/* Scoring Insights with 3-tier peer comparison */}
          {scoringResult && (
            <ScoringInsightsPanel
              scoringResult={scoringResult}
              companyFinancials={engagement?.companyIntel?.financialProfile}
              peerComparison={engagement?.companyIntel?.peerComparison}
              onPeerChange={engagement?.companyIntel ? handlePeerChange : undefined}
            />
          )}
        </div>
      )}

      {activeSection === "challenges" && (
        <div className="rounded-lg border border-amber-200 bg-white p-5 space-y-6 animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Challenges */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Predictable Challenges
            </h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {diagnostic.challenges.map((challenge, i) => (
                <ChallengeCard key={i} challenge={challenge} />
              ))}
            </div>
          </div>

          {/* Priority Areas */}
          <div>
            <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
              Priority Areas to Explore
            </h4>
            <div className="space-y-3">
              {diagnostic.priorityAreas.map((area, i) => (
                <PriorityAreaCard
                  key={area.processId}
                  area={area}
                  rank={i + 1}
                  engagementId={engagementId}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSection === "digital" && engagement && setEngagement && (
        <div className="rounded-lg border border-purple-200 bg-white p-5 animate-in fade-in slide-in-from-top-1 duration-200">
          <DigitalMaturitySection
            engagement={engagement}
            setEngagement={setEngagement}
          />
        </div>
      )}
    </div>
  );
}

// ── Section Tile Component ──

function SectionTile({
  icon,
  title,
  summary,
  isActive,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  isActive: boolean;
  onClick: () => void;
  color: "blue" | "amber" | "purple";
}) {
  const colorMap = {
    blue: {
      active: "ring-2 ring-blue-400 border-blue-200 bg-blue-50/50",
      icon: "text-blue-600",
      hover: "hover:border-blue-200 hover:bg-blue-50/30",
    },
    amber: {
      active: "ring-2 ring-amber-400 border-amber-200 bg-amber-50/50",
      icon: "text-amber-600",
      hover: "hover:border-amber-200 hover:bg-amber-50/30",
    },
    purple: {
      active: "ring-2 ring-purple-400 border-purple-200 bg-purple-50/50",
      icon: "text-purple-600",
      hover: "hover:border-purple-200 hover:bg-purple-50/30",
    },
  };

  const c = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-4 text-left transition-all cursor-pointer ${
        isActive
          ? `${c.active} shadow-sm`
          : `border-gray-200 bg-white ${c.hover}`
      }`}
    >
      <div className={`mb-2 ${c.icon}`}>{icon}</div>
      <h3 className="text-sm font-semibold text-gray-800 mb-1">{title}</h3>
      <p className="text-xs text-gray-400 leading-relaxed">{summary}</p>
    </button>
  );
}
