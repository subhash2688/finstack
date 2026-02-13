"use client";

import Link from "next/link";
import { getToolsByCategory } from "@/lib/data/tools";
import { Category, Tool, CompanySize } from "@/types/tool";
import { cn } from "@/lib/utils/cn";

interface FunctionToolHeatmapProps {
  processCategories: { id: string; name: string; category: Category }[];
  companySize?: CompanySize;
  subSector?: string;
}

function getScoreColor(score: number | undefined): string {
  if (score === undefined || score === 0) return "bg-gray-50 text-gray-300";
  if (score >= 80) return "bg-emerald-100 text-emerald-800";
  if (score >= 50) return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-600";
}

export function FunctionToolHeatmap({ processCategories, companySize, subSector }: FunctionToolHeatmapProps) {
  // Collect all unique tools across categories
  const toolsByCategory = new Map<string, Tool[]>();
  const allToolIds = new Set<string>();

  for (const proc of processCategories) {
    const tools = getToolsByCategory(proc.category);
    toolsByCategory.set(proc.id, tools);
    tools.forEach((t) => allToolIds.add(t.id));
  }

  // Build unified tool list (tools that appear in any category)
  const allTools = new Map<string, { tool: Tool; categories: Set<string> }>();

  for (const proc of processCategories) {
    const tools = toolsByCategory.get(proc.id) || [];
    for (const tool of tools) {
      if (!allTools.has(tool.id)) {
        allTools.set(tool.id, { tool, categories: new Set() });
      }
      allTools.get(tool.id)!.categories.add(proc.id);
    }
  }

  // Sort tools: context-matched first, then by number of categories covered
  const sortedTools = Array.from(allTools.values()).sort((a, b) => {
    // Boost tools matching sub-sector
    const aSubMatch = subSector && a.tool.subSectors?.includes(subSector) ? 1 : 0;
    const bSubMatch = subSector && b.tool.subSectors?.includes(subSector) ? 1 : 0;
    if (bSubMatch !== aSubMatch) return bSubMatch - aSubMatch;

    // Boost tools matching company size
    const aSizeMatch = companySize && a.tool.companySizes.includes(companySize) ? 1 : 0;
    const bSizeMatch = companySize && b.tool.companySizes.includes(companySize) ? 1 : 0;
    if (bSizeMatch !== aSizeMatch) return bSizeMatch - aSizeMatch;

    // More categories = broader coverage
    if (b.categories.size !== a.categories.size) return b.categories.size - a.categories.size;

    // Overall score
    return (b.tool.overallFitScore || 0) - (a.tool.overallFitScore || 0);
  });

  const displayTools = sortedTools.slice(0, 20);

  if (displayTools.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No tools found for this function.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2 px-3 font-medium text-gray-500 sticky left-0 bg-white min-w-[180px]">
              Vendor
            </th>
            {processCategories.map((proc) => (
              <th key={proc.id} className="text-center py-2 px-2 font-medium text-gray-500 min-w-[80px]">
                {proc.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {displayTools.map(({ tool, categories }) => {
            const isContextMatch = (subSector && tool.subSectors?.includes(subSector)) ||
              (companySize && tool.companySizes.includes(companySize));

            return (
              <tr key={tool.id} className={cn(
                "hover:bg-gray-50",
                isContextMatch && "bg-[#00B140]/[0.03]"
              )}>
                <td className="py-2 px-3 sticky left-0 bg-inherit">
                  <Link href={`/vendors/${tool.id}`} className="hover:text-[#00B140]">
                    <span className="font-medium">{tool.name}</span>
                    <span className="text-gray-400 ml-1">({tool.vendor})</span>
                  </Link>
                  {isContextMatch && (
                    <span className="ml-1.5 text-[9px] px-1 py-0.5 bg-[#00B140]/10 text-[#00B140] rounded">
                      match
                    </span>
                  )}
                </td>
                {processCategories.map((proc) => {
                  const isInCategory = categories.has(proc.id);
                  return (
                    <td key={proc.id} className="text-center py-2 px-2">
                      {isInCategory ? (
                        <span className={cn(
                          "inline-block px-2 py-0.5 rounded text-[10px] font-medium",
                          getScoreColor(tool.overallFitScore)
                        )}>
                          {tool.overallFitScore || "—"}
                        </span>
                      ) : (
                        <span className="text-gray-200">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
