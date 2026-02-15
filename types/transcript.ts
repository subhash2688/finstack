import { MaturityLevel } from "./workflow";

export interface TranscriptQuote {
  text: string;
  speaker: string;
  timestamp: string;
  context?: string;
}

export interface StepEvidence {
  stepId: string;
  stepTitle: string;
  covered: boolean;
  suggestedMaturity: MaturityLevel | null;
  maturityConfidence: "high" | "medium" | "low" | null;
  painPoints: string[];
  workarounds: string[];
  quotes: TranscriptQuote[];
  automationSignals: string[];
}

export interface TranscriptMeta {
  teamSizeMentions: string[];
  toolSystemMentions: string[];
  volumeMetrics: string[];
  keyThemes: string[];
}

export interface TranscriptAnalysis {
  id: string;
  fileName: string;
  analyzedAt: string;
  stepEvidence: StepEvidence[];
  meta: TranscriptMeta;
  summary: string;
  interviewParticipants: string[];
}

export interface TranscriptReviewDecision {
  stepId: string;
  accepted: boolean;
  appliedMaturity?: MaturityLevel;
}

export interface TranscriptIntelligence {
  analyses: TranscriptAnalysis[];
  reviewDecisions: TranscriptReviewDecision[];
  lastReviewedAt?: string;
}
