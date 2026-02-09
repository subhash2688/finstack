"use client";

import { WorkflowStep } from "@/types/workflow";

interface ConsultantTakeawayProps {
  steps: WorkflowStep[];
}

export function ConsultantTakeaway({ steps }: ConsultantTakeawayProps) {
  // Score each step: intensity weight + impact weight
  const intensityWeights: Record<string, number> = { fire: 3, strong: 2, moderate: 1 };
  const impactWeights: Record<string, number> = { high: 3, medium: 2, low: 1 };

  const scored = steps
    .filter((s) => s.insight)
    .map((step) => ({
      step,
      score:
        (intensityWeights[step.insight.aiImpactIntensity] ?? 0) +
        impactWeights[step.aiOpportunity.impact],
    }))
    .sort((a, b) => b.score - a.score);

  const topTwo = scored.slice(0, 2);

  if (topTwo.length < 2) return null;

  return (
    <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-8 text-white">
      <h3 className="text-2xl font-light mb-6">
        If you only fix two things in AP...
      </h3>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {topTwo.map(({ step }, idx) => (
          <div
            key={step.id}
            className="bg-white/10 rounded-lg p-5 border border-white/10"
          >
            <div className="text-xs uppercase tracking-widest text-white/50 mb-2">
              Recommendation {idx + 1}
            </div>
            <h4 className="text-lg font-medium mb-2">
              {step.stepNumber}. {step.title}
            </h4>
            <p className="text-sm text-white/70 mb-3 italic leading-relaxed">
              &ldquo;{step.insight.whyItMatters}&rdquo;
            </p>
            <div className="text-sm text-white/60">
              <span className="text-white/90 font-medium">{step.impactMetrics.costImpact}</span>
              {" "}cost impact &middot;{" "}
              <span className="text-white/90 font-medium">{step.impactMetrics.timeSavings}</span>
              {" "}time savings
            </div>
          </div>
        ))}
      </div>

      <p className="text-sm text-white/50 leading-relaxed">
        These two steps account for the largest share of AP cost and cycle time. Addressing them first
        delivers the highest return on automation investment and sets the foundation for end-to-end
        process improvement.
      </p>
    </div>
  );
}
