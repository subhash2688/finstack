/**
 * Company AI Diagnostic — data model
 *
 * Represents the output of a company-level assessment that translates
 * basic company inputs into an archetype, challenges, AI applicability
 * breakdown, automation opportunity ranges, and prioritized areas.
 */

import { FunctionId } from "./function";

/**
 * Category of a diagnostic challenge
 */
export type ChallengeCategory = "operational" | "cost" | "data-quality" | "scale";

/**
 * Expected leverage level for a priority area
 */
export type LeverageLevel = "high" | "medium" | "low";

/**
 * A predictable challenge surfaced by the diagnostic
 */
export interface DiagnosticChallenge {
  title: string;
  description: string;
  category: ChallengeCategory;
}

/**
 * Numeric range used throughout the diagnostic
 */
export interface Range {
  min: number;
  max: number;
}

/**
 * Three-way AI applicability breakdown
 */
export interface AIApplicabilitySplit {
  highLeverage: { min: number; max: number; description: string };
  humanInTheLoop: { min: number; max: number; description: string };
  humanLed: { min: number; max: number; description: string };
}

/**
 * Automation opportunity ranges with disclaimer
 */
export interface AutomationOpportunity {
  effortAddressable: Range;
  costSavingsRange: Range;
  capacityUnlocked: Range;
  disclaimer: string;
}

/**
 * A prioritized process area to explore
 */
export interface PriorityArea {
  functionId: FunctionId;
  processId: string;
  processName: string;
  rationale: string;
  expectedLeverage: LeverageLevel;
  link: string;
}

/**
 * The full company-level diagnostic output
 */
export interface CompanyDiagnostic {
  companyArchetype: string;
  archetypeDescription: string;
  challenges: DiagnosticChallenge[];
  aiApplicability: AIApplicabilitySplit;
  automationOpportunity: AutomationOpportunity;
  priorityAreas: PriorityArea[];
  generatedAt: string;
}
