import { ProcessAssessment } from "@/types/engagement";
import { WorkflowStep, MaturityLevel } from "@/types/workflow";
import { Category } from "@/types/tool";
import {
  SavingsRange,
  SavingsAssumptions,
  DEFAULT_ASSUMPTIONS,
  StepSavingsEstimate,
  ProcessFindings,
  RankedOpportunity,
  ExecutiveSummaryData,
} from "@/types/findings";
import { calculateCapacityWeights } from "@/lib/data/capacity-weights";
import { getToolsForStepSorted, getToolERPCompatibility, estimateToolCost, getToolById } from "@/lib/data/tools";

const TEAM_SIZE_KEYS: Record<string, string> = {
  ap: "apTeamSize",
  ar: "arTeamSize",
  fpa: "fpaTeamSize",
};

function parseTeamSize(assessment: ProcessAssessment): number {
  const key = TEAM_SIZE_KEYS[assessment.processId] || "teamSize";
  const raw = assessment.context?.[key];
  if (raw) {
    const parsed = parseInt(raw, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 5;
}

function makeSavingsRange(mid: number, rangeFactor: number): SavingsRange {
  return {
    low: Math.round(mid * (1 - rangeFactor)),
    mid: Math.round(mid),
    high: Math.round(mid * (1 + rangeFactor)),
  };
}

function getAutomationPotential(
  maturity: MaturityLevel,
  assumptions: SavingsAssumptions
): number {
  switch (maturity) {
    case "manual": return assumptions.automationPotential.manual;
    case "semi-automated": return assumptions.automationPotential.semiAutomated;
    case "automated": return assumptions.automationPotential.automated;
  }
}

/**
 * Resolve assumptions: custom overrides merged with defaults for given company size.
 */
export function resolveAssumptions(
  companySize: string,
  custom?: SavingsAssumptions
): SavingsAssumptions {
  if (custom) return custom;
  return DEFAULT_ASSUMPTIONS[companySize] ?? DEFAULT_ASSUMPTIONS["smb"];
}

/**
 * Calculate per-step savings for a single process assessment.
 */
export function calculateProcessFindings(
  assessment: ProcessAssessment,
  steps: WorkflowStep[],
  companySize: string,
  customAssumptions?: SavingsAssumptions,
  erpName?: string
): ProcessFindings {
  const assumptions = resolveAssumptions(companySize, customAssumptions);
  const teamSize = parseTeamSize(assessment);
  const costPerPerson = assumptions.costPerPerson;
  const totalTeamCost = teamSize * costPerPerson;
  const capacityWeights = calculateCapacityWeights(steps);
  const ratings = assessment.maturityRatings || {};
  const category = assessment.processId as Category;

  const stepEstimates: StepSavingsEstimate[] = [];
  const seenToolIds = new Set<string>();

  for (const step of steps) {
    const maturity = ratings[step.id];
    if (!maturity) continue;

    const stepOverride = assumptions.stepOverrides?.[step.id];
    const capacityWeight = stepOverride?.capacityWeight ?? capacityWeights[step.id] ?? 0;
    const automationPotential = stepOverride?.automationPotential ?? getAutomationPotential(maturity, assumptions);
    const midSavings = teamSize * capacityWeight * automationPotential * costPerPerson;

    // % impact = this step's mid savings / total team cost
    const percentImpact = totalTeamCost > 0
      ? Math.round((midSavings / totalTeamCost) * 1000) / 10
      : 0;

    // Get top tool for this step — use overallFitScore for display, with ERP boost
    const tools = getToolsForStepSorted(step.id, category, undefined, erpName);
    let topTool: StepSavingsEstimate["topTool"] = null;

    if (tools.length > 0) {
      const t = tools[0];
      const erpCompat = erpName ? getToolERPCompatibility(t, erpName) : null;
      topTool = {
        id: t.id,
        name: t.name,
        vendor: t.vendor,
        fitScore: t.overallFitScore ?? t.fitScores?.find((f) => f.stepId === step.id)?.score ?? 0,
        erpCompatibility: erpCompat ? { level: erpCompat.level, notes: erpCompat.notes } : undefined,
      };
      seenToolIds.add(t.id);
    }

    stepEstimates.push({
      stepId: step.id,
      stepTitle: step.title,
      stepNumber: step.stepNumber,
      maturity,
      capacityWeight,
      automationPotential,
      savings: makeSavingsRange(midSavings, assumptions.rangeFactor),
      percentImpact,
      topTool,
    });
  }

  // Sort by savings midpoint descending
  stepEstimates.sort((a, b) => b.savings.mid - a.savings.mid);

  const totalMid = stepEstimates.reduce((sum, e) => sum + e.savings.mid, 0);
  const assessedStepCount = Object.keys(ratings).length;
  const totalStepCount = steps.length;

  // Estimate combined tool cost for unique recommended tools
  let estimatedToolCostResult: { low: number; high: number } | null = null;
  const toolIds = Array.from(seenToolIds);
  if (toolIds.length > 0) {
    let totalLow = 0;
    let totalHigh = 0;
    let hasAnyCost = false;
    for (const toolId of toolIds) {
      const tool = getToolById(toolId);
      if (tool) {
        const cost = estimateToolCost(tool, teamSize);
        if (cost) {
          totalLow += cost.low;
          totalHigh += cost.high;
          hasAnyCost = true;
        }
      }
    }
    if (hasAnyCost) {
      estimatedToolCostResult = { low: totalLow, high: totalHigh };
    }
  }

  return {
    processId: assessment.processId,
    processName: assessment.processName,
    category,
    teamSize,
    costPerPerson,
    totalSavings: makeSavingsRange(totalMid, assumptions.rangeFactor),
    estimatedToolCost: estimatedToolCostResult,
    stepEstimates,
    assessedStepCount,
    totalStepCount,
    isComplete: assessedStepCount >= totalStepCount && totalStepCount > 0,
  };
}

/**
 * Aggregate findings across all processes into an executive summary.
 */
export function buildExecutiveSummary(
  allFindings: ProcessFindings[]
): ExecutiveSummaryData {
  const totalMid = allFindings.reduce((sum, f) => sum + f.totalSavings.mid, 0);

  // Collect all step-level opportunities across processes
  const allOpportunities: RankedOpportunity[] = allFindings.flatMap((f) =>
    f.stepEstimates.map((est) => ({
      rank: 0,
      stepId: est.stepId,
      stepTitle: est.stepTitle,
      processId: f.processId,
      processName: f.processName,
      savings: est.savings,
      maturity: est.maturity,
      topTool: est.topTool,
    }))
  );

  // Sort by savings midpoint descending, take top 5
  allOpportunities.sort((a, b) => b.savings.mid - a.savings.mid);
  const top5 = allOpportunities.slice(0, 5).map((opp, i) => ({
    ...opp,
    rank: i + 1,
  }));

  const assessedCount = allFindings.filter((f) => f.assessedStepCount > 0).length;
  const hasAnyComplete = allFindings.some((f) => f.isComplete);

  // Aggregate tool costs across processes
  let totalToolCost: { low: number; high: number } | null = null;
  const costsFound = allFindings.filter((f) => f.estimatedToolCost != null);
  if (costsFound.length > 0) {
    totalToolCost = {
      low: costsFound.reduce((sum, f) => sum + (f.estimatedToolCost?.low ?? 0), 0),
      high: costsFound.reduce((sum, f) => sum + (f.estimatedToolCost?.high ?? 0), 0),
    };
  }

  // Use first finding's range factor or default
  const rangeFactor = 0.25;

  return {
    totalSavings: makeSavingsRange(totalMid, rangeFactor),
    totalToolCost,
    topOpportunities: top5,
    assessedProcessCount: assessedCount,
    totalProcessCount: allFindings.length,
    hasAnyComplete,
  };
}
