"use client";

import { useState } from "react";
import { Methodology } from "@/types/digital-maturity";
import { ChevronDown, ChevronUp, FlaskConical } from "lucide-react";

interface MethodologyPanelProps {
  methodology: Methodology;
}

export function MethodologyPanel({ methodology }: MethodologyPanelProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">
            How We Assessed This
          </span>
          <span className="text-xs text-gray-500">
            {methodology.totalSourcesExamined} sources examined, {methodology.totalSignalsFound} signals found
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200 pt-3">
          <div>
            <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Research Steps
            </h4>
            <div className="space-y-1">
              {methodology.researchSteps.map((step, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="text-gray-400 shrink-0">{i + 1}.</span>
                  <span>{step.description}</span>
                  <span className="text-gray-400 shrink-0 ml-auto">
                    ({step.sourcesFound} found)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {methodology.limitationsAndCaveats.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                Limitations
              </h4>
              <ul className="space-y-1">
                {methodology.limitationsAndCaveats.map((caveat, i) => (
                  <li key={i} className="text-xs text-gray-500 flex items-start gap-1.5">
                    <span className="text-amber-500 shrink-0">*</span>
                    {caveat}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
