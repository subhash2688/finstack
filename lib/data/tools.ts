import { Tool, Category, AIMaturity, CompanySize, FitGrade, ERPIntegration } from '@/types/tool';
import { getERPSignal } from '@/lib/data/erp-intelligence';
import apTools from '@/data/tools/ap-tools.json';
import arTools from '@/data/tools/ar-tools.json';
import fpaTools from '@/data/tools/fpa-tools.json';

const allTools: Tool[] = [
  ...(apTools as Tool[]),
  ...(arTools as Tool[]),
  ...(fpaTools as Tool[]),
];

export interface ToolFilters {
  category?: Category;
  workflowStep?: string;
  companySizes?: CompanySize[];
  industries?: string[];
  aiMaturity?: AIMaturity[];
  search?: string;
}

export function getAllTools(): Tool[] {
  return allTools;
}

export function getToolsByCategory(category: Category): Tool[] {
  return allTools.filter(tool => tool.category === category);
}

export function getToolById(id: string): Tool | null {
  return allTools.find(tool => tool.id === id) || null;
}

export function getToolsByIds(ids: string[]): Tool[] {
  return allTools.filter(tool => ids.includes(tool.id));
}

export function filterTools(filters: ToolFilters): Tool[] {
  let filtered = [...allTools];

  if (filters.category) {
    filtered = filtered.filter(tool => tool.category === filters.category);
  }

  if (filters.workflowStep) {
    filtered = filtered.filter(tool =>
      tool.workflowSteps.includes(filters.workflowStep!)
    );
  }

  if (filters.companySizes && filters.companySizes.length > 0) {
    filtered = filtered.filter(tool =>
      filters.companySizes!.some(size => tool.companySizes.includes(size))
    );
  }

  if (filters.industries && filters.industries.length > 0) {
    filtered = filtered.filter(tool =>
      filters.industries!.some(industry => tool.industries.includes(industry))
    );
  }

  if (filters.aiMaturity && filters.aiMaturity.length > 0) {
    filtered = filtered.filter(tool =>
      filters.aiMaturity!.includes(tool.aiMaturity)
    );
  }

  if (filters.search && filters.search.trim()) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(tool =>
      tool.name.toLowerCase().includes(searchLower) ||
      tool.vendor.toLowerCase().includes(searchLower) ||
      tool.tagline.toLowerCase().includes(searchLower) ||
      tool.description.toLowerCase().includes(searchLower)
    );
  }

  return filtered;
}

export function getAllIndustries(): string[] {
  const industries = new Set<string>();
  allTools.forEach(tool => {
    tool.industries.forEach(industry => industries.add(industry));
  });
  return Array.from(industries).sort();
}

export function getToolFitGrade(score: number): FitGrade {
  if (score >= 80) return 'best-fit';
  if (score >= 50) return 'good-fit';
  return 'limited';
}

/**
 * Filter tools by company size and sub-sector context.
 * Tools matching the context are returned first, with higher relevance.
 */
export function filterToolsByContext(
  category: Category,
  companySize?: CompanySize,
  subSector?: string
): Tool[] {
  let tools = getToolsByCategory(category);

  if (!companySize && !subSector) return tools;

  // Score each tool by context match
  const scored = tools.map((tool) => {
    let score = 0;

    // Company size match
    if (companySize && tool.companySizes.includes(companySize)) {
      score += 2;
    }

    // Sub-sector match
    if (subSector && tool.subSectors?.includes(subSector)) {
      score += 3;
    }

    return { tool, score };
  });

  // Sort by score descending, then by overall fit score
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (b.tool.overallFitScore || 0) - (a.tool.overallFitScore || 0);
  });

  return scored.map((s) => s.tool);
}

/**
 * Get ERP compatibility level for a tool given an ERP name.
 * Checks erpIntegrations first (structured data), falls back to integrations list.
 */
export function getToolERPCompatibility(
  tool: Tool,
  erpName: string
): { level: ERPIntegration["integrationLevel"]; notes?: string } | null {
  if (!erpName) return null;

  const signal = getERPSignal(erpName);
  if (!signal) return null;

  // Check structured erpIntegrations first
  if (tool.erpIntegrations && tool.erpIntegrations.length > 0) {
    const match = tool.erpIntegrations.find(
      (e) => e.erpName.toLowerCase() === signal.erpName.toLowerCase()
    );
    if (match) return { level: match.integrationLevel, notes: match.notes };
  }

  // Fallback: check integrations string array
  const erpLower = signal.erpName.toLowerCase();
  const aliases = signal.aliases;
  const hasMatch = tool.integrations.some((integ) => {
    const l = integ.toLowerCase();
    return l === erpLower || aliases.some((a) => l.includes(a));
  });

  if (hasMatch) return { level: "connector" };
  return null;
}

/**
 * ERP compatibility score boost:
 * - native: +8 points
 * - connector: +5 points
 * - middleware: +3 points
 * - api: +1 point
 */
function erpScoreBoost(level: ERPIntegration["integrationLevel"]): number {
  switch (level) {
    case "native": return 8;
    case "connector": return 5;
    case "middleware": return 3;
    case "api": return 1;
  }
}

export function getToolsForStepSorted(stepId: string, category: Category, filters?: ToolFilters, erpName?: string): Tool[] {
  let tools = filterTools({
    category,
    workflowStep: stepId,
    ...filters,
  });

  // Sort by fit score for this step (highest first), with ERP boost, tools without scores go last
  tools.sort((a, b) => {
    let aScore = a.fitScores?.find(f => f.stepId === stepId)?.score ?? -1;
    let bScore = b.fitScores?.find(f => f.stepId === stepId)?.score ?? -1;

    // Apply ERP compatibility boost
    if (erpName) {
      const aErp = getToolERPCompatibility(a, erpName);
      const bErp = getToolERPCompatibility(b, erpName);
      if (aErp && aScore >= 0) aScore += erpScoreBoost(aErp.level);
      if (bErp && bScore >= 0) bScore += erpScoreBoost(bErp.level);
    }

    return bScore - aScore;
  });

  return tools;
}

/**
 * Estimate annual tool cost for a given team size.
 */
export function estimateToolCost(tool: Tool, teamSize: number): { low: number; high: number } | null {
  const cost = tool.annualCostEstimate;
  if (!cost) return null;

  let annual = 0;
  if (cost.perUser) {
    annual = cost.perUser * teamSize;
  } else if (cost.flatFee) {
    annual = cost.flatFee;
  } else if (cost.perTransaction) {
    // Rough estimate: 500 transactions per person per year
    annual = cost.perTransaction * teamSize * 500;
  }

  if (annual === 0) return null;

  // Add implementation cost amortized over 3 years
  const implLow = cost.implementationCost?.low ?? 0;
  const implHigh = cost.implementationCost?.high ?? 0;
  const implAmort = (implLow + implHigh) / 2 / 3;

  return {
    low: Math.round(annual * 0.8 + implLow / 3),
    high: Math.round(annual * 1.2 + implHigh / 3),
  };
}
