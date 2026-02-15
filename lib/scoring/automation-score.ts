/**
 * Deterministic Scoring Engine
 *
 * Computes automation complexity scores, ceilings, and savings ranges
 * from EDGAR financial data + peer medians. No LLM — pure TypeScript.
 *
 * These computed values are passed as HARD CONSTRAINTS to the diagnostic
 * prompt so the LLM generates narrative that respects the numbers rather
 * than inventing its own.
 */

import { FinancialProfile, DerivedMetrics } from "@/types/diagnostic";
import { getERPSignal } from "@/lib/data/erp-intelligence";
import { PeerMedians } from "./peer-medians";

export interface ScoringResult {
  complexityScore: number;           // 0-100
  automationCeiling: number;         // 0-1
  effortAddressable: { min: number; max: number };
  costSavingsRange: { min: number; max: number };
  gaGapVsPeers: number | null;       // percentage points
  dsoGap: number | null;             // days vs peer median
  dpoGap: number | null;             // days vs peer median
  revenuePerEmployee: number | null;
  peerMedianRevenuePerEmployee: number | null;
  constraints: {
    highLeverageMax: number;         // automationCeiling * 100
    effortAddressableRange: string;  // e.g., "45-55%"
    costSavingsRange: string;        // e.g., "$350M-$525M"
  };
  peerContext: {
    peerCount: number;
    medianRevenue: number | null;
    medianGA: number | null;
    medianDSO: number | null;
    medianDPO: number | null;
    source: string;
  };
}

interface ScoringInputs {
  financialProfile: FinancialProfile;
  peerMedians: PeerMedians;
  erpName?: string;
  companySize: "startup" | "smb" | "mid-market" | "enterprise";
}

/**
 * Compute complexity score from financial characteristics.
 * Higher score = more complex organization = harder to automate fully.
 *
 * Factors (weighted):
 * - Revenue scale (0-25 pts): larger = more complex
 * - Employee count (0-20 pts): more people = more process layers
 * - G&A as % of revenue (0-15 pts): higher = more administrative burden
 * - Number of reporting years (0-10 pts): proxy for organizational age/maturity
 * - ERP maturity signal (0-15 pts): more mature ERP = more entrenched processes
 * - Company size category (0-15 pts): maps directly to organizational complexity
 */
function computeComplexityScore(
  profile: FinancialProfile,
  erpName?: string,
  companySize?: string
): number {
  let score = 0;
  const latest = profile.yearlyData?.[0];
  if (!latest) return 30; // fallback — moderate complexity

  // Revenue scale (0-25)
  // Note: revenue is stored in millions in FinancialProfile
  const revB = (latest.revenue || 0) / 1_000; // M → B
  if (revB >= 50) score += 25;
  else if (revB >= 10) score += 20;
  else if (revB >= 1) score += 15;
  else if (revB >= 0.1) score += 10;
  else score += 5;

  // Employee count (0-20)
  const emp = profile.employeeCount || 0;
  if (emp >= 50000) score += 20;
  else if (emp >= 10000) score += 16;
  else if (emp >= 1000) score += 12;
  else if (emp >= 100) score += 8;
  else score += 4;

  // G&A burden (0-15): higher G&A% = more administrative complexity
  const gaExpense = latest.expenses?.find((e) => e.category === "G&A");
  const gaPct = gaExpense?.asPercentOfRevenue;
  if (gaPct != null) {
    if (gaPct >= 20) score += 15;
    else if (gaPct >= 15) score += 12;
    else if (gaPct >= 10) score += 9;
    else if (gaPct >= 5) score += 6;
    else score += 3;
  } else {
    score += 7; // no data — assume moderate
  }

  // Reporting maturity — number of years of data (0-10)
  const yearCount = profile.yearlyData?.length || 0;
  score += Math.min(yearCount * 3, 10);

  // ERP maturity (0-15)
  if (erpName) {
    const signal = getERPSignal(erpName);
    if (signal) {
      switch (signal.maturitySignal) {
        case "mature": score += 15; break;
        case "established": score += 11; break;
        case "growing": score += 7; break;
        case "early-stage": score += 3; break;
      }
    } else {
      score += 7; // unknown ERP — assume moderate
    }
  } else {
    score += 5; // no ERP info
  }

  // Company size (0-15)
  switch (companySize) {
    case "enterprise": score += 15; break;
    case "mid-market": score += 10; break;
    case "smb": score += 6; break;
    case "startup": score += 3; break;
    default: score += 7;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Determine automation ceiling based on ERP maturity and complexity.
 * Higher ceiling = more headroom for automation.
 *
 * Counterintuitively, simpler orgs have HIGHER ceilings because
 * there's less organizational inertia blocking change.
 */
function computeAutomationCeiling(
  complexityScore: number,
  erpName?: string
): number {
  // Base ceiling from ERP
  let ceiling: number;
  if (erpName) {
    const signal = getERPSignal(erpName);
    if (signal) {
      ceiling = signal.automationCeiling;
    } else {
      ceiling = 0.45; // unknown ERP
    }
  } else {
    ceiling = 0.50; // no ERP info — moderate
  }

  // Adjust by complexity: higher complexity slightly reduces ceiling
  // because change management is harder
  if (complexityScore >= 80) ceiling *= 0.90;
  else if (complexityScore >= 60) ceiling *= 0.95;
  // below 60: no reduction

  // Cap at realistic bounds
  return Math.min(0.85, Math.max(0.25, ceiling));
}

/**
 * Compute effort addressable range based on G&A gap vs peers
 * and ERP maturity.
 */
function computeEffortAddressable(
  gaGap: number | null,
  erpName?: string,
  complexityScore?: number
): { min: number; max: number } {
  // Base rate varies by ERP maturity
  let baseMin = 30;
  let baseMax = 45;

  if (erpName) {
    const signal = getERPSignal(erpName);
    if (signal) {
      switch (signal.maturitySignal) {
        case "early-stage":
          baseMin = 40; baseMax = 55; break; // more manual = more addressable
        case "growing":
          baseMin = 35; baseMax = 50; break;
        case "established":
          baseMin = 25; baseMax = 40; break;
        case "mature":
          baseMin = 20; baseMax = 35; break;
      }
    }
  }

  // G&A gap adjustment: positive gap = more excess G&A = more addressable
  if (gaGap != null) {
    if (gaGap > 5) {
      baseMin += 8;
      baseMax += 10;
    } else if (gaGap > 2) {
      baseMin += 4;
      baseMax += 6;
    } else if (gaGap > 0) {
      baseMin += 2;
      baseMax += 3;
    } else if (gaGap < -3) {
      // Already below peers — less addressable
      baseMin -= 5;
      baseMax -= 5;
    }
  }

  // Complexity adjustment
  if (complexityScore != null && complexityScore >= 75) {
    // Very complex orgs have more process waste but harder to address
    baseMin -= 3;
    baseMax += 2;
  }

  return {
    min: Math.max(10, Math.min(70, baseMin)),
    max: Math.max(15, Math.min(75, baseMax)),
  };
}

/**
 * Compute cost savings range anchored to real EDGAR financials.
 */
function computeCostSavingsRange(
  profile: FinancialProfile,
  gaGap: number | null,
  effortAddressable: { min: number; max: number }
): { min: number; max: number } {
  const latest = profile.yearlyData?.[0];
  if (!latest?.revenue) return { min: 0, max: 0 };

  // Note: revenue and expense amounts are stored in MILLIONS in FinancialProfile
  // Convert to raw dollars for savings output
  const revenueRaw = latest.revenue * 1_000_000;
  const gaExpense = latest.expenses?.find((e) => e.category === "G&A");
  const gaAmountRaw = gaExpense?.amount ? gaExpense.amount * 1_000_000 : undefined;

  if (gaAmountRaw && gaGap != null && gaGap > 0) {
    // Anchor to the excess G&A vs peers
    const excessGA = (gaGap / 100) * revenueRaw;
    // Addressable fraction of the excess
    const minSavings = excessGA * (effortAddressable.min / 100) * 0.5;
    const maxSavings = excessGA * (effortAddressable.max / 100) * 0.7;
    return {
      min: Math.round(minSavings),
      max: Math.round(maxSavings),
    };
  } else if (gaAmountRaw) {
    // No gap or already efficient — savings from total G&A
    const minSavings = gaAmountRaw * 0.05;
    const maxSavings = gaAmountRaw * 0.15;
    return {
      min: Math.round(minSavings),
      max: Math.round(maxSavings),
    };
  } else {
    // No G&A data — rough estimate from revenue
    return {
      min: Math.round(revenueRaw * 0.005),
      max: Math.round(revenueRaw * 0.02),
    };
  }
}

/**
 * Format a dollar amount as a human-readable string.
 */
function formatDollars(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

/**
 * Main scoring function. Pure TypeScript, no LLM.
 *
 * Takes EDGAR financial data + peer medians, returns computed
 * ranges that become HARD CONSTRAINTS in the diagnostic prompt.
 */
export function computeAutomationScore(inputs: ScoringInputs): ScoringResult {
  const { financialProfile, peerMedians, erpName, companySize } = inputs;
  const latest = financialProfile.yearlyData?.[0];
  const derivedMetrics: DerivedMetrics | undefined = financialProfile.derivedMetrics;

  // 1. Complexity score
  const complexityScore = computeComplexityScore(financialProfile, erpName, companySize);

  // 2. Automation ceiling
  const automationCeiling = computeAutomationCeiling(complexityScore, erpName);

  // 3. G&A gap vs peers
  const targetGA = latest?.expenses?.find((e) => e.category === "G&A")?.asPercentOfRevenue;
  const gaGapVsPeers = (targetGA != null && peerMedians.gaPercent != null)
    ? targetGA - peerMedians.gaPercent
    : null;

  // 4. DSO/DPO gaps
  const targetDSO = derivedMetrics?.dso;
  const targetDPO = derivedMetrics?.dpo;
  const dsoGap = (targetDSO != null && peerMedians.dso != null)
    ? targetDSO - peerMedians.dso
    : null;
  const dpoGap = (targetDPO != null && peerMedians.dpo != null)
    ? targetDPO - peerMedians.dpo
    : null;

  // 5. Revenue per employee comparison
  const revenuePerEmployee = financialProfile.revenuePerEmployee ?? null;
  const peerMedianRevenuePerEmployee = peerMedians.revenuePerEmployee ?? null;

  // 6. Effort addressable range
  const effortAddressable = computeEffortAddressable(gaGapVsPeers, erpName, complexityScore);

  // 7. Cost savings range
  const costSavingsRange = computeCostSavingsRange(financialProfile, gaGapVsPeers, effortAddressable);

  // 8. Build constraints for the LLM prompt
  const constraints = {
    highLeverageMax: Math.round(automationCeiling * 100),
    effortAddressableRange: `${effortAddressable.min}-${effortAddressable.max}%`,
    costSavingsRange: `${formatDollars(costSavingsRange.min)}-${formatDollars(costSavingsRange.max)}`,
  };

  return {
    complexityScore,
    automationCeiling,
    effortAddressable,
    costSavingsRange,
    gaGapVsPeers,
    dsoGap,
    dpoGap,
    revenuePerEmployee,
    peerMedianRevenuePerEmployee,
    constraints,
    peerContext: {
      peerCount: peerMedians.peerCount,
      medianRevenue: peerMedians.medianRevenue,
      medianGA: peerMedians.gaPercent,
      medianDSO: peerMedians.dso,
      medianDPO: peerMedians.dpo,
      source: peerMedians.source,
    },
  };
}
