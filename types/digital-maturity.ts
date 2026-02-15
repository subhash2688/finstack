/**
 * Digital Maturity Scan Types
 *
 * Layer 2 of Phase H: qualitative market signals from Claude + web_search.
 * Detects tech stack, maturity level, and competitive pressure.
 */

export type SourceType = "Job Posting" | "SEC Filing" | "Earnings Call" | "News" | "Press Release";
export type ConfidenceLevel = "High" | "Medium" | "Low";
export type MaturityLevel = 1 | 2 | 3 | 4;
export type MaturityLevelName = "Manual" | "Standardized" | "Optimized" | "Intelligent";

export interface EvidenceCard {
  quote: string;
  sourceType: SourceType;
  sourceUrl?: string;
  sourceLabel?: string;
  interpretation: string;
  confidence: ConfidenceLevel;
}

export interface MaturityDimension {
  name: string;
  level: MaturityLevel;
  levelName: MaturityLevelName;
  rationale: string;
  evidence: EvidenceCard[];
}

export interface TechStackScan {
  detectedTechnologies: string[];
  erpLandscape: string;
  automationFootprint: string;
  overallTechMaturity: MaturityLevel;
  evidence: EvidenceCard[];
}

export interface MaturityAssessment {
  overallLevel: MaturityLevel;
  overallLevelName: MaturityLevelName;
  dimensions: MaturityDimension[];
  leadershipSignals: string[];
  hiringPatterns: string[];
}

export interface PeerMove {
  peerName: string;
  action: string;
  relevance: string;
  source?: string;
}

export interface AnalystMention {
  analyst: string;
  quote: string;
  context: string;
}

export interface MAActivity {
  description: string;
  relevance: string;
  date?: string;
}

export interface MarketSignals {
  peerMoves: PeerMove[];
  competitivePressure: string;
  analystMentions: AnalystMention[];
  maActivity: MAActivity[];
}

export interface ResearchStep {
  description: string;
  sourcesFound: number;
}

export interface Methodology {
  researchSteps: ResearchStep[];
  totalSourcesExamined: number;
  totalSignalsFound: number;
  limitationsAndCaveats: string[];
}

export interface DigitalMaturityDeepDive {
  section: "techStack" | "maturity" | "marketSignals";
  additionalEvidence: EvidenceCard[];
  expandedAnalysis: string;
  generatedAt: string;
}

export interface DigitalMaturityScan {
  techStack: TechStackScan;
  maturityAssessment: MaturityAssessment;
  marketSignals: MarketSignals;
  methodology: Methodology;
  generatedAt: string;
  deepDives?: Record<string, DigitalMaturityDeepDive>;
}
