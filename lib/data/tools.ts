import { Tool, Category, AIMaturity, CompanySize } from '@/types/tool';
import apTools from '@/data/tools/ap-tools.json';

const allTools: Tool[] = [
  ...(apTools as Tool[]),
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
