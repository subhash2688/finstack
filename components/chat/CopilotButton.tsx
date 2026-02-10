'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { CopilotPanel } from './CopilotPanel';

export function CopilotButton() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Derive currentProcessId from the URL (e.g., /ap, /ar, /fpa)
  const currentProcessId = extractProcessId(pathname);

  return (
    <>
      {isOpen && (
        <CopilotPanel
          onClose={() => setIsOpen(false)}
          currentProcessId={currentProcessId}
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
