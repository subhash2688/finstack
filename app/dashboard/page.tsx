import Link from "next/link";
import { FUNCTIONS } from "@/types/function";
import { ChevronRight, Lock } from "lucide-react";

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
      <rect x="16" y="48" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
      <rect x="32" y="40" width="8" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
      <rect x="48" y="32" width="8" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  ),
  "r&d": (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="text-gray-300">
      <circle cx="36" cy="28" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
      <circle cx="36" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="36" cy="28" r="2" fill="currentColor" />
      <rect x="32" y="46" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <line x1="28" y1="62" x2="44" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20 20 L16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52 20 L56 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  hr: (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="text-gray-300">
      <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="48" cy="20" r="8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10 44 C10 36 17 32 24 32 C28 32 31 33 33 35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
      <path d="M62 44 C62 36 55 32 48 32 C44 32 41 33 39 35" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 2" />
      <circle cx="36" cy="38" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M36 41 L36 52" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M30 48 L42 48" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="58" x2="60" y2="58" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 3" />
    </svg>
  ),
  legal: (
    <svg width="56" height="56" viewBox="0 0 72 72" fill="none" className="text-gray-300">
      <line x1="36" y1="8" x2="36" y2="56" stroke="currentColor" strokeWidth="1.5" />
      <path d="M18 20 L36 14 L54 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 20 C18 20 14 32 18 32 C22 32 18 20 18 20Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
      <path d="M54 20 C54 20 50 32 54 32 C58 32 54 20 54 20Z" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
      <rect x="24" y="56" width="24" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="36" cy="14" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
};

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00B140]/10 rounded-full">
            <Lock className="h-3 w-3 text-[#00B140]" />
            <span className="text-[#00B140] font-semibold text-xs tracking-wide uppercase">
              Proprietary Platform
            </span>
          </div>
        </div>
        <h1 className="text-4xl font-light text-gray-900 tracking-tight mb-3">
          Choose a <span className="font-semibold">function</span> to explore
        </h1>
        <p className="text-gray-500 text-lg font-light max-w-2xl">
          Each function contains AI-mapped process workflows with step-level
          automation diagnostics and vendor recommendations.
        </p>
      </div>

      {/* Function Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {FUNCTIONS.map((func) => {
          const activeProcess = func.processes.find((p) => p.available);
          const hasActive = !!activeProcess;
          const processCount = func.processes.length;
          const activeCount = func.processes.filter((p) => p.available).length;

          // Group processes for display
          const groups = new Map<string, typeof func.processes>();
          func.processes.forEach((p) => {
            const group = p.group || "Processes";
            if (!groups.has(group)) groups.set(group, []);
            groups.get(group)!.push(p);
          });

          const card = (
            <div
              className={`
                bg-white border rounded-xl p-8 h-full relative overflow-hidden transition-all
                ${hasActive
                  ? "border-gray-200"
                  : "border-gray-100 opacity-70"
                }
              `}
            >
              {/* Top accent */}
              <div className={`absolute top-0 left-0 right-0 h-1.5 ${hasActive ? "bg-[#00B140]" : "bg-gray-200"}`} />

              {/* Icon */}
              <div className="mb-5">
                {functionSketches[func.id]}
              </div>

              {/* Title + meta */}
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">{func.name}</h2>
              <p className="text-sm text-gray-500 leading-relaxed mb-5">
                {func.description}
              </p>

              {/* Process groups */}
              <div className="space-y-3 mb-6">
                {Array.from(groups.entries()).map(([group, processes]) => (
                  <div key={group}>
                    {groups.size > 1 && (
                      <p className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider mb-1">
                        {group}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1.5">
                      {processes.map((proc) =>
                        proc.available ? (
                          <Link
                            key={proc.id}
                            href={`/${proc.id}`}
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

              {/* Footer */}
              <div className="pt-4 border-t border-gray-100">
                {hasActive ? (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {activeCount} of {processCount} live
                    </span>
                    <span className="flex items-center text-[#00B140] font-medium text-xs gap-1">
                      Click a process above to explore
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">
                      {processCount} processes mapped
                    </span>
                    <span className="text-xs font-semibold text-gray-300 uppercase tracking-wide">
                      Coming Soon
                    </span>
                  </div>
                )}
              </div>
            </div>
          );

          return <div key={func.id}>{card}</div>;
        })}
      </div>

      {/* Bottom note */}
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-400 font-light">
          New functions and processes are added regularly. Use the sidebar to navigate between modules.
        </p>
      </div>
    </div>
  );
}
