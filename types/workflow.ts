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
}

export interface Workflow {
  id: WorkflowId;
  name: string;
  steps: WorkflowStep[];
}
