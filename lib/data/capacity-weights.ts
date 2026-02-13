import { WorkflowStep, ImpactLevel } from "@/types/workflow";

const IMPACT_WEIGHT: Record<ImpactLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

/**
 * Distributes team capacity across workflow steps using aiOpportunity.impact
 * as weight proxy. Returns Record<stepId, percentage> summing to 1.0.
 */
export function calculateCapacityWeights(
  steps: WorkflowStep[]
): Record<string, number> {
  if (steps.length === 0) return {};

  const totalWeight = steps.reduce(
    (sum, step) => sum + IMPACT_WEIGHT[step.aiOpportunity.impact],
    0
  );

  const weights: Record<string, number> = {};
  for (const step of steps) {
    weights[step.id] = IMPACT_WEIGHT[step.aiOpportunity.impact] / totalWeight;
  }

  return weights;
}
