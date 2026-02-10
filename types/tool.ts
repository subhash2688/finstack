export type AIMaturity = 'ai-native' | 'ai-enabled' | 'traditional';
export type CompanySize = 'startup' | 'smb' | 'mid-market' | 'enterprise';
export type Category = 'ap' | 'ar' | 'fpa' | 'close';
export type FitGrade = 'best-fit' | 'good-fit' | 'limited';
export type EffortLevel = 'low' | 'medium' | 'high';

export interface PricingInfo {
  model: string;
  startingPrice?: string;
  notes?: string;
}

export interface StepVerdict {
  stepId: string;
  verdict: string;
}

export interface StepFitScore {
  stepId: string;
  score: number; // 0-100
  grade: FitGrade;
}

export interface AdoptionMetrics {
  customerCount?: string;
  revenue?: string;
  yoyGrowth?: string;
  g2Rating?: number;
  gartnerPosition?: string;
  notableCustomers?: string[];
}

export interface DeploymentComplexity {
  typicalTimeline?: string;
  effortLevel?: EffortLevel;
  requiresIt?: boolean;
  dataMigration?: string;
  changeManagement?: string;
  requirements?: string[];
}

export interface Tool {
  id: string;
  name: string;
  vendor: string;
  category: Category;
  aiMaturity: AIMaturity;
  companySizes: CompanySize[];
  industries: string[];
  painPoints: string[];
  integrations: string[];
  pricing: PricingInfo;
  keyFeatures: string[];
  workflowSteps: string[];
  tagline: string;
  description: string;
  website?: string;
  stepVerdicts?: StepVerdict[];
  fitScores?: StepFitScore[];
  overallFitScore?: number;
  adoptionMetrics?: AdoptionMetrics;
  deploymentComplexity?: DeploymentComplexity;
  founded?: string;
  headquarters?: string;
  employeeCount?: string;
}
