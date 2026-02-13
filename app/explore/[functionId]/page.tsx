"use client";

import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FUNCTIONS, getFunctionById } from "@/types/function";
import { FunctionToolHeatmap } from "@/components/explore/FunctionToolHeatmap";
import { Category, CompanySize } from "@/types/tool";
import { ArrowLeft } from "lucide-react";

// Map function processes to tool categories
const PROCESS_CATEGORY_MAP: Record<string, Category> = {
  ap: "ap",
  ar: "ar",
  fpa: "fpa",
};

export default function FunctionExplorePage() {
  const params = useParams();
  const searchParams = useSearchParams();

  const functionId = params.functionId as string;
  const func = getFunctionById(functionId as any); // eslint-disable-line

  const companySize = searchParams.get("size") as CompanySize | undefined;
  const subSector = searchParams.get("subSector") || undefined;

  if (!func) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl text-center">
        <p className="text-gray-500">Function not found.</p>
        <Link href="/explore" className="text-[#00B140] text-sm mt-4 inline-block hover:underline">
          Back to Explorer
        </Link>
      </div>
    );
  }

  // Get active processes with their tool categories
  const processCategories = func.processes
    .filter((p) => p.available && PROCESS_CATEGORY_MAP[p.id])
    .map((p) => ({
      id: p.id,
      name: p.name,
      category: PROCESS_CATEGORY_MAP[p.id],
    }));

  return (
    <div className="container mx-auto px-4 py-16 max-w-6xl">
      {/* Back link */}
      <Link
        href="/explore"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Explorer
      </Link>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-900 tracking-tight mb-2">
          {func.name} — <span className="font-semibold">Cross-Process Tool Heatmap</span>
        </h1>
        <p className="text-gray-500 text-sm max-w-2xl">
          Compare vendor coverage across {processCategories.length} active {func.name} processes.
          Click a vendor to view their full profile, or click a process to drill into its workflow.
        </p>
      </div>

      {/* Context indicators */}
      {(companySize || subSector) && (
        <div className="flex items-center gap-2 mb-6 text-xs">
          <span className="text-gray-400">Filtered by:</span>
          {companySize && (
            <span className="px-2 py-0.5 bg-gray-100 rounded font-medium capitalize">{companySize}</span>
          )}
          {subSector && (
            <span className="px-2 py-0.5 bg-[#00B140]/10 text-[#00B140] rounded font-medium">{subSector}</span>
          )}
        </div>
      )}

      {/* Process navigation */}
      <div className="flex gap-2 mb-6">
        {processCategories.map((proc) => (
          <Link
            key={proc.id}
            href={`/${proc.id}`}
            className="text-xs px-3 py-1.5 rounded-md bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20 font-medium hover:bg-[#00B140]/20 transition-colors"
          >
            {proc.name}
          </Link>
        ))}
      </div>

      {/* Heatmap */}
      {processCategories.length > 0 ? (
        <div className="border rounded-lg p-4 bg-white">
          <FunctionToolHeatmap
            processCategories={processCategories}
            companySize={companySize || undefined}
            subSector={subSector}
          />
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No active processes in {func.name} yet.</p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="font-medium">Score legend:</span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 h-4 rounded bg-emerald-100 border border-emerald-200" /> 80+ Best Fit
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 h-4 rounded bg-amber-100 border border-amber-200" /> 50-79 Good Fit
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block w-6 h-4 rounded bg-gray-100 border border-gray-200" /> &lt;50 Limited
        </span>
      </div>
    </div>
  );
}
