"use client";

import { CompanyDiagnostic } from "@/types/diagnostic";
import { ArchetypeCard } from "@/components/diagnostic/ArchetypeCard";
import { ChallengeCard } from "@/components/diagnostic/ChallengeCard";
import { PriorityAreaCard } from "@/components/diagnostic/PriorityAreaCard";

interface HypothesisSectionProps {
  diagnostic: CompanyDiagnostic;
  companyName: string;
  industry: string;
  companySize: string;
  engagementId: string;
}

export function HypothesisSection({
  diagnostic,
  companyName,
  industry,
  companySize,
  engagementId,
}: HypothesisSectionProps) {
  return (
    <div className="space-y-6">
      <ArchetypeCard
        archetype={diagnostic.companyArchetype}
        description={diagnostic.archetypeDescription}
        companyName={companyName}
        industry={industry}
        companySize={companySize}
      />

      {diagnostic.challenges.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">
            Predictable Challenges
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {diagnostic.challenges.map((challenge, i) => (
              <ChallengeCard key={i} challenge={challenge} />
            ))}
          </div>
        </div>
      )}

      {diagnostic.priorityAreas.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">
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
      )}
    </div>
  );
}
