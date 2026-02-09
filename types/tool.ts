export type AIMaturity = 'ai-native' | 'ai-enabled' | 'traditional';
export type CompanySize = 'startup' | 'smb' | 'mid-market' | 'enterprise';
export type Category = 'ap' | 'fpa' | 'close';

export interface PricingInfo {
  model: string;
  startingPrice?: string;
  notes?: string;
}

export interface StepVerdict {
  stepId: string;
  verdict: string;
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
}
