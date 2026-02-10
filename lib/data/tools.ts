import { Tool, Category, AIMaturity, CompanySize, FitGrade } from '@/types/tool';
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

export function getToolsForStepSorted(stepId: string, category: Category, filters?: ToolFilters): Tool[] {
  let tools = filterTools({
    category,
    workflowStep: stepId,
    ...filters,
  });

  // Sort by fit score for this step (highest first), tools without scores go last
  tools.sort((a, b) => {
    const aScore = a.fitScores?.find(f => f.stepId === stepId)?.score ?? -1;
    const bScore = b.fitScores?.find(f => f.stepId === stepId)?.score ?? -1;
    return bScore - aScore;
  });

  return tools;
}
