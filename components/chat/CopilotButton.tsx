'use client';

import { useState, useMemo } from 'react';
import { Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { CopilotPanel } from './CopilotPanel';
import { getEngagement } from '@/lib/storage/engagements';
import { CopilotEngagementContext } from '@/lib/ai/copilot-context';

export function CopilotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Derive currentProcessId from the URL (e.g., /ap, /ar, /fpa)
  const currentProcessId = extractProcessId(pathname);

  // Detect engagement pages and build context
  const engagementContext = useMemo((): CopilotEngagementContext | undefined => {
    const engagementId = extractEngagementId(pathname);
    if (!engagementId) return undefined;

    try {
      const eng = getEngagement(engagementId);
      if (!eng) return undefined;

      const ctx: CopilotEngagementContext = {
        companyName: eng.clientContext.companyName,
        companySize: eng.clientContext.companySize,
        industry: eng.clientContext.industry,
        erp: eng.clientContext.erp,
        processes: eng.processAssessments.map((pa) => {
          const ratings = pa.maturityRatings || {};
          const ratedCount = Object.keys(ratings).length;
          const maturityValues = Object.values(ratings);
          const maturitySummary = ratedCount > 0
            ? `${ratedCount} steps rated`
            : undefined;

          return {
            name: pa.processName,
            maturitySummary,
          };
        }),
      };

      if (eng.customAssumptions) {
        ctx.assumptions = {
          costPerPerson: eng.customAssumptions.costPerPerson,
          rangeFactor: eng.customAssumptions.rangeFactor,
        };
      }

      return ctx;
    } catch {
      return undefined;
    }
  }, [pathname]);

  return (
    <>
      {isOpen && (
        <CopilotPanel
          onClose={() => setIsOpen(false)}
          currentProcessId={currentProcessId}
          engagementContext={engagementContext}
        />
      )}

      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
        aria-label={isOpen ? 'Close AI copilot' : 'Open AI copilot'}
      >
        <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        {/* Pulse ring on first load */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-20 pointer-events-none" />
        )}
      </button>
    </>
  );
}

/** Extract process ID from pathname like /ap, /ar, /fpa */
function extractProcessId(pathname: string): string | undefined {
  const match = pathname.match(/^\/(ap|ar|fpa|accounting|payroll|treasury|tax)(?:\/|$)/);
  return match?.[1];
}

/** Extract engagement ID from pathname like /engagements/{id}/... */
function extractEngagementId(pathname: string): string | undefined {
  const match = pathname.match(/^\/engagements\/([^/]+)/);
  return match?.[1];
}
