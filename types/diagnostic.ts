/**
 * Company AI Diagnostic — data model
 *
 * Represents the output of a company-level assessment that translates
 * basic company inputs into an archetype, challenges, AI applicability
 * breakdown, automation opportunity ranges, and prioritized areas.
 */

import { FunctionId } from "./function";

/**
 * Category of a diagnostic challenge or executive summary theme
 */
export type ChallengeCategory = "operational" | "cost" | "data-quality" | "scale" | "positive";

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
 * AI-generated company intelligence brief based on Claude's training knowledge.
 * For public companies, includes specific company context.
 * For private companies, includes industry-level benchmarks.
 */
export interface CompanyIntelligence {
  confidenceLevel: "high" | "medium" | "low";
  confidenceReason: string;
  knownContext?: string;
  industryBenchmarks?: string;
  competitiveLandscape?: string;
}

// ── Company Intelligence Dashboard types ──

export interface FunctionalExpense {
  category: string;
  amount?: number;
  asPercentOfRevenue?: number;
}

export interface YearlyFinancial {
  year: number;
  revenue?: number;
  revenueGrowth?: number;
  grossMargin?: number;
  operatingMargin?: number;
  netMargin?: number;
  expenses?: FunctionalExpense[];
}

export interface BalanceSheetSnapshot {
  year: number;
  cash?: number;
  accountsReceivable?: number;
  accountsPayable?: number;
  inventoryNet?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  longTermDebt?: number;
  totalEquity?: number;
}

export interface DerivedMetrics {
  dso?: number; // Days Sales Outstanding = AR / Revenue * 365
  dpo?: number; // Days Payable Outstanding = AP / COGS * 365
  inventoryTurns?: number; // COGS / Avg Inventory
  currentRatio?: number; // Current Assets proxy / Current Liabilities proxy
  debtToEquity?: number; // Total Debt / Total Equity
}

export interface FinancialProfile {
  source: "edgar" | "estimated";
  currency: string;
  revenueScale: string;
  yearlyData: YearlyFinancial[];
  balanceSheet?: BalanceSheetSnapshot[];
  derivedMetrics?: DerivedMetrics;
  employeeCount?: number;
  revenuePerEmployee?: number;
  keyInsight: string;
}

export interface OperationalMetric {
  name: string;
  value: number;
  unit: string;
  benchmark?: number;
  percentile?: number;
  trend?: "improving" | "stable" | "declining";
}

export interface OperationalProfile {
  functionName: string;
  metrics: OperationalMetric[];
  summary: string;
}

export interface HeadcountProfile {
  total?: number;
  totalFormatted: string;
  functionBreakdown?: { function: string; estimate: string }[];
  revenuePerEmployee?: string;
  insight: string;
}

export interface PeerBenchmarkDimension {
  dimension: string;
  companyScore: number;
  peerMedian: number;
  peerTopQuartile: number;
  insight: string;
}

export interface PeerBenchmark {
  peerGroup: string;
  sampleSize?: string;
  dimensions: PeerBenchmarkDimension[];
  overallInsight: string;
}

export interface Competitor {
  name: string;
  relevance: "direct" | "indirect" | "emerging";
  strengthVsCompany: string;
}

export interface CompetitivePosition {
  marketPosition: string;
  competitors: Competitor[];
  differentiators: string[];
  vulnerabilities: string[];
}

// ── Leadership Profile (LLM-powered) ──

export interface ExecutiveProfile {
  name: string;
  title: string;
  background?: string;
  linkedinUrl?: string;
}

export interface LeadershipProfile {
  executives: ExecutiveProfile[];
  source: string;
  caveat: string;
}

// ── Company Commentary (LLM-powered) ──

export interface ProductSegment {
  name: string;
  description: string;
}

export interface CompanyCommentaryData {
  productSegments: ProductSegment[];
  headwinds: string[];
  tailwinds: string[];
  marketDynamics?: string;
  caveat: string;
}

// ── Peer Comparison (EDGAR-based) ──

export interface PeerFinancials {
  ticker: string;
  companyName: string;
  revenue?: number;
  revenueGrowth?: number;
  grossMargin?: number;
  operatingMargin?: number;
  rdAsPercent?: number;
  smAsPercent?: number;
  gaAsPercent?: number;
  isPrivate?: boolean;
}

export interface PeerComparisonSet {
  targetTicker: string;
  peers: PeerFinancials[];
  customPeers?: PeerFinancials[];
  removedTickers?: string[];
  generatedAt: string;
  competitorSource?: "10-K" | "SIC";
}

// ── Functional Headcount Entry ──

export interface FunctionalHeadcountEntry {
  function: string;
  headcount: number | null;
  guidancePercent?: string;
}

export interface CompanyIntel {
  confidenceLevel: "high" | "medium" | "low";
  confidenceReason: string;
  financialProfile?: FinancialProfile;
  operationalProfile?: OperationalProfile;
  headcount?: HeadcountProfile;
  peerBenchmark?: PeerBenchmark;
  competitivePosition?: CompetitivePosition;
  leadership?: LeadershipProfile;
  commentary?: CompanyCommentaryData;
  peerComparison?: PeerComparisonSet;
  functionalHeadcount?: FunctionalHeadcountEntry[];
  generatedAt: string;
}

/**
 * Executive Summary — rich structured brief for the hypothesis page hero
 */
export interface ExecutiveSummaryTheme {
  label: string;
  category: ChallengeCategory;
}

export interface OpportunityTheme {
  theme: string;
  rationale: string;
}

export interface ExecutiveSummary {
  themes: ExecutiveSummaryTheme[];
  situation: string;
  keyFindings: string[];
  opportunityThemes: OpportunityTheme[];
}

/**
 * The full company-level diagnostic output
 */
export interface CompanyDiagnostic {
  companyArchetype: string;
  archetypeDescription: string;
  executiveSummary?: ExecutiveSummary;
  companyIntelligence?: CompanyIntelligence;
  challenges: DiagnosticChallenge[];
  aiApplicability: AIApplicabilitySplit;
  automationOpportunity: AutomationOpportunity;
  priorityAreas: PriorityArea[];
  generatedAt: string;
}
