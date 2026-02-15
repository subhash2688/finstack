/**
 * Technology Solutions types
 *
 * Supports the redesigned Technology step (Step 5) with:
 * - Capability grouping (workflow steps → technology capabilities)
 * - Build vs Buy analysis per capability
 * - Case studies from real market data
 * - Market context (adoption rates, trends, regulatory)
 */

import { Category } from "./tool";

// ── Capability Definitions ──

export interface TechnologyCapability {
  id: string;
  name: string;
  category: Category;
  stepIds: string[];
  description: string;
  iconName: string; // lucide icon name
}

export interface BuildDefaults {
  teamComposition: { role: string; count: number; monthlyRate: number }[];
  timelineMonths: { low: number; high: number };
  techStack: string[];
}

export interface CapabilityDefinition extends TechnologyCapability {
  buildDefaults: Record<string, BuildDefaults>; // keyed by company size
}

// ── Build vs Buy ──

export interface BuildOption {
  teamComposition: { role: string; count: number; monthlyRate: number }[];
  timelineMonths: number;
  estimatedCost: { low: number; high: number };
  techStack: string[];
  pros: string[];
  cons: string[];
}

export interface BuyOption {
  implementationCost: { low: number; high: number };
  annualCost: { low: number; high: number };
  typicalTimeline: string;
  effortLevel: "low" | "medium" | "high";
  pros: string[];
  cons: string[];
}

export interface BuildVsBuyAnalysis {
  capabilityId: string;
  build: BuildOption;
  buy: BuyOption;
  recommendation: "build" | "buy" | "hybrid";
  rationale: string;
}

// ── Case Studies ──

export interface TechnologyCaseStudy {
  companyArchetype: string;
  erpUsed: string;
  toolUsed: string;
  capabilityId: string;
  outcome: string;
  timeline: string;
  sourceUrl?: string;
  sourceLabel?: string;
}

// ── Market Context ──

export interface MarketContext {
  industryAdoptionRate?: string;
  technologyTrends: string[];
  regulatoryNotes?: string;
  laborMarketInsight?: string;
}

// ── Cached Analysis (stored on Engagement) ──

export interface TechnologyAnalysis {
  buildVsBuy: BuildVsBuyAnalysis[];
  caseStudies: TechnologyCaseStudy[];
  marketContext: MarketContext;
  generatedAt: string;
}

// ── Market Intelligence (web search powered) ──

export interface MarketBenchmark {
  metric: string;
  value: string;
  context: string;
  source?: string;
}

export interface MarketTrend {
  trend: string;
  relevance: string;
  source?: string;
}

export interface MarketIntelligence {
  benchmarks: MarketBenchmark[];
  trends: MarketTrend[];
  landscape: string;
  generatedAt: string;
}
