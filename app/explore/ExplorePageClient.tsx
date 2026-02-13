"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { FUNCTIONS } from "@/types/function";
import { TECH_SUB_SECTORS, COMPANY_SIZES } from "@/lib/data/sub-sector-taxonomy";
import { CompanySize } from "@/types/tool";

const functionSketches: Record<string, React.ReactNode> = {
  finance: (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="text-[#00B140]">
      <rect x="8" y="16" width="40" height="48" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
      <line x1="16" y1="28" x2="40" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="36" x2="36" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="16" y1="44" x2="32" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="54" cy="24" r="12" stroke="currentColor" strokeWidth="1.5" />
      <text x="49" y="29" fontSize="14" fill="currentColor" fontFamily="serif">$</text>
    </svg>
  ),
  gtm: (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="text-gray-300">
      <path d="M12 56 L24 38 L36 44 L48 24 L60 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="60" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="56" width="56" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  ),
  "r&d": (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="text-gray-300">
      <circle cx="36" cy="28" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
      <circle cx="36" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="36" cy="28" r="2" fill="currentColor" />
    </svg>
  ),
  hr: (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="text-gray-300">
      <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="48" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  legal: (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="text-gray-300">
      <line x1="36" y1="8" x2="36" y2="56" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 20 L36 14 L54 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function ExplorePageClient() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [selectedSize, setSelectedSize] = useState<CompanySize | "">(
    (searchParams.get("size") as CompanySize) || ""
  );
  const [selectedSubSector, setSelectedSubSector] = useState<string>(
    searchParams.get("subSector") || ""
  );

  const updateParams = (size: CompanySize | "", subSector: string) => {
    const params = new URLSearchParams();
    if (size) params.set("size", size);
    if (subSector) params.set("subSector", subSector);
    const qs = params.toString();
    router.replace(`/explore${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const handleSizeChange = (size: CompanySize | "") => {
    setSelectedSize(size);
    updateParams(size, selectedSubSector);
  };

  const handleSubSectorChange = (subSector: string) => {
    setSelectedSubSector(subSector);
    updateParams(selectedSize, subSector);
  };

  const activeSubSector = TECH_SUB_SECTORS.find((s) => s.id === selectedSubSector);

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-3">
          Process & Tool <span className="font-semibold">Explorer</span>
        </h1>
        <p className="text-gray-500 text-lg font-light max-w-2xl">
          Browse AI-mapped process workflows with step-level automation diagnostics and vendor recommendations.
        </p>
      </div>

      {/* Context Selectors */}
      <div className="flex flex-wrap items-center gap-3 mb-10 p-4 bg-gray-50 rounded-lg border">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Filter by:</span>

        <select
          value={selectedSize}
          onChange={(e) => handleSizeChange(e.target.value as CompanySize | "")}
          className="text-sm border rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#00B140]"
        >
          <option value="">All Company Sizes</option>
          {COMPANY_SIZES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>

        <select
          value={selectedSubSector}
          onChange={(e) => handleSubSectorChange(e.target.value)}
          className="text-sm border rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#00B140]"
        >
          <option value="">All Sub-Industries</option>
          {TECH_SUB_SECTORS.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {(selectedSize || selectedSubSector) && (
          <button
            onClick={() => {
              setSelectedSize("");
              setSelectedSubSector("");
              router.replace("/explore", { scroll: false });
            }}
            className="text-xs text-gray-500 hover:text-gray-900 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Context-specific insights */}
      {activeSubSector && (
        <div className="mb-8 p-4 rounded-lg border border-[#00B140]/20 bg-[#00B140]/[0.02]">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {activeSubSector.name} Context
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            {Object.entries(activeSubSector.processCharacteristics).map(([processId, chars]) => (
              <div key={processId} className="text-xs">
                <span className="font-medium uppercase text-[#00B140]">{processId.toUpperCase()}</span>
                <p className="text-gray-500 mt-1">Volume: {chars.volumeProfile}</p>
                <p className="text-gray-500">Baseline: {chars.maturityBaseline}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {chars.keyMetrics.map((m) => (
                    <span key={m} className="px-1.5 py-0.5 bg-gray-100 rounded text-[10px] text-gray-600">{m}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Function Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {FUNCTIONS.map((func) => {
          const hasActive = func.processes.some((p) => p.available);
          const processCount = func.processes.length;
          const activeCount = func.processes.filter((p) => p.available).length;

          const groups = new Map<string, typeof func.processes>();
          func.processes.forEach((p) => {
            const group = p.group || "Processes";
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group)!.push(p);
          });

          const contextParams = new URLSearchParams();
          if (selectedSize) contextParams.set("size", selectedSize);
          if (selectedSubSector) contextParams.set("subSector", selectedSubSector);
          const contextQs = contextParams.toString();

          return (
            <div key={func.id}>
              <div className={`bg-white border rounded-xl p-8 h-full relative overflow-hidden transition-all ${hasActive ? "border-gray-200" : "border-gray-100 opacity-70"}`}>
                <div className={`absolute top-0 left-0 right-0 h-1.5 ${hasActive ? "bg-[#00B140]" : "bg-gray-200"}`} />
                <div className="mb-5">{functionSketches[func.id]}</div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">{func.name}</h2>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{func.description}</p>

                {activeSubSector && hasActive && (
                  <div className="mb-4">
                    <p className="text-[10px] font-semibold text-[#00B140] uppercase tracking-wider mb-1">
                      {activeSubSector.name} Pain Points
                    </p>
                    {func.processes.filter((p) => p.available).map((proc) => {
                      const pains = activeSubSector.typicalPainPoints[proc.id];
                      if (!pains || pains.length === 0) return null;
                      return (
                        <div key={proc.id} className="mb-1.5">
                          <span className="text-[10px] font-medium text-gray-500">{proc.name}:</span>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {pains.slice(0, 2).map((pain) => (
                              <span key={pain} className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200">
                                {pain}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="space-y-3 mb-6">
                  {Array.from(groups.entries()).map(([group, processes]) => (
                    <div key={group}>
                      {groups.size > 1 && (
                        <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-1">{group}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5">
                        {processes.map((proc) =>
                          proc.available ? (
                            <Link
                              key={proc.id}
                              href={`/${proc.id}${contextQs ? `?${contextQs}` : ""}`}
                              className="text-xs px-2 py-0.5 rounded bg-[#00B140]/10 text-[#00B140] border border-[#00B140]/20 font-medium hover:bg-[#00B140]/20 transition-colors"
                            >
                              {proc.name}
                            </Link>
                          ) : (
                            <span
                              key={proc.id}
                              className="text-xs px-2 py-0.5 rounded bg-gray-50 text-gray-400 border border-gray-100"
                            >
                              {proc.name}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-gray-100">
                  {hasActive ? (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{activeCount} of {processCount} live</span>
                      <Link
                        href={`/explore/${func.id}${contextQs ? `?${contextQs}` : ""}`}
                        className="text-[#00B140] font-medium text-xs hover:underline"
                      >
                        View Heatmap
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{processCount} processes mapped</span>
                      <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">Coming Soon</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400 font-light">
          New functions and processes are added regularly. Use the sidebar to navigate between modules.
        </p>
      </div>
    </div>
  );
}
