import { FunctionId } from "./function";

export type WorkflowId = 'ap' | 'fpa' | 'close';
export type ImpactLevel = 'high' | 'medium' | 'low';
export type MaturityLevel = 'manual' | 'semi-automated' | 'automated';

export interface AIOpportunity {
  impact: ImpactLevel;
  description: string;
}

export interface BeforeAfterComparison {
  before: string;
  after: string;
}

export interface ImpactMetrics {
  timeSavings: string;
  errorReduction: string;
  costImpact: string;
  throughput: string;
}

export interface StepInsight {
  whyItMatters: string;
  typicalPain: string;
  aiImpactVerdict: string;
  aiImpactIntensity: 'fire' | 'strong' | 'moderate';
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  stepNumber: number;
  abbreviation: string;
  aiOpportunity: AIOpportunity;
  painPoints: string[];
  beforeAfter: BeforeAfterComparison;
  impactMetrics: ImpactMetrics;
  insight: StepInsight;
  toolContextSentence: string;
}

export interface Workflow {
  id: WorkflowId;
  name: string;
  functionId: FunctionId; // NEW: parent function
  processId: string; // NEW: process ID (e.g., "ap")
  steps: WorkflowStep[];
}
