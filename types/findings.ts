import { MaturityLevel } from "./workflow";
import { Category } from "./tool";

export interface SavingsRange {
  low: number;
  mid: number;
  high: number;
}

/** Editable assumptions for savings calculations */
export interface SavingsAssumptions {
  costPerPerson: number;
  automationPotential: {
    manual: number;
    semiAutomated: number;
    automated: number;
  };
  rangeFactor: number;
  stepOverrides?: Record<string, { automationPotential?: number; capacityWeight?: number }>;
}

export const DEFAULT_ASSUMPTIONS: Record<string, SavingsAssumptions> = {
  startup: {
    costPerPerson: 65_000,
    automationPotential: { manual: 0.75, semiAutomated: 0.35, automated: 0.05 },
    rangeFactor: 0.25,
  },
  smb: {
    costPerPerson: 75_000,
    automationPotential: { manual: 0.75, semiAutomated: 0.35, automated: 0.05 },
    rangeFactor: 0.25,
  },
  "mid-market": {
    costPerPerson: 90_000,
    automationPotential: { manual: 0.75, semiAutomated: 0.35, automated: 0.05 },
    rangeFactor: 0.25,
  },
  enterprise: {
    costPerPerson: 110_000,
    automationPotential: { manual: 0.75, semiAutomated: 0.35, automated: 0.05 },
    rangeFactor: 0.25,
  },
};

export interface StepSavingsEstimate {
  stepId: string;
  stepTitle: string;
  stepNumber: number;
  maturity: MaturityLevel;
  capacityWeight: number;
  automationPotential: number;
  savings: SavingsRange;
  percentImpact: number; // % of total team cost this step represents
  topTool: {
    id?: string;
    name: string;
    vendor: string;
    fitScore: number;
    erpCompatibility?: { level: string; notes?: string };
  } | null;
}

export interface ProcessFindings {
  processId: string;
  processName: string;
  category: Category;
  teamSize: number;
  costPerPerson: number;
  totalSavings: SavingsRange;
  estimatedToolCost: { low: number; high: number } | null; // annual cost of top recommended tools
  stepEstimates: StepSavingsEstimate[];
  assessedStepCount: number;
  totalStepCount: number;
  isComplete: boolean;
}

export interface RankedOpportunity {
  rank: number;
  stepId: string;
  stepTitle: string;
  processId: string;
  processName: string;
  savings: SavingsRange;
  maturity: MaturityLevel;
  topTool: {
    id?: string;
    name: string;
    vendor: string;
    fitScore: number;
  } | null;
}

export interface ExecutiveSummaryData {
  totalSavings: SavingsRange;
  totalToolCost: { low: number; high: number } | null;
  topOpportunities: RankedOpportunity[];
  assessedProcessCount: number;
  totalProcessCount: number;
  hasAnyComplete: boolean;
}
