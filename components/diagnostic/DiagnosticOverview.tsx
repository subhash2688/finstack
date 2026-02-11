"use client";

import { CompanyDiagnostic } from "@/types/diagnostic";
import { ArchetypeCard } from "./ArchetypeCard";
import { ChallengeCard } from "./ChallengeCard";
import { AIApplicabilityChart } from "./AIApplicabilityChart";
import { OpportunityRanges } from "./OpportunityRanges";
import { PriorityAreaCard } from "./PriorityAreaCard";

interface DiagnosticOverviewProps {
  diagnostic: CompanyDiagnostic;
  companyName: string;
  industry: string;
  companySize: string;
  engagementId?: string;
}

export function DiagnosticOverview({
  diagnostic,
  companyName,
  industry,
  companySize,
  engagementId,
}: DiagnosticOverviewProps) {
  return (
    <div className="space-y-8">
      {/* Archetype Hero */}
      <ArchetypeCard
        archetype={diagnostic.companyArchetype}
        description={diagnostic.archetypeDescription}
        companyName={companyName}
        industry={industry}
        companySize={companySize}
      />

      {/* Two-column layout: AI Applicability + Automation Opportunity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <AIApplicabilityChart split={diagnostic.aiApplicability} />
        <OpportunityRanges opportunity={diagnostic.automationOpportunity} />
      </div>

      {/* Challenges */}
      <div>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-4">
          Predictable Challenges
        </h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {diagnostic.challenges.map((challenge, i) => (
            <ChallengeCard key={i} challenge={challenge} />
          ))}
        </div>
      </div>

      {/* Priority Areas */}
      <div>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-4">
          Priority Areas to Explore
        </h3>
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
  );
}
