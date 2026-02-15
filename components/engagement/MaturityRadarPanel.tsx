"use client";

import { MaturityAssessment } from "@/types/digital-maturity";
import { EvidenceCardComponent } from "./EvidenceCardComponent";
import { Button } from "@/components/ui/button";
import { EvidenceCard } from "@/types/digital-maturity";
import { BarChart3, Loader2 } from "lucide-react";

const LEVEL_COLORS = [
  "",
  "bg-gray-300",    // 1 - Manual
  "bg-blue-400",    // 2 - Standardized
  "bg-emerald-400", // 3 - Optimized
  "bg-purple-400",  // 4 - Intelligent
];

const LEVEL_BG = [
  "",
  "bg-gray-100 text-gray-700",
  "bg-blue-100 text-blue-700",
  "bg-emerald-100 text-emerald-700",
  "bg-purple-100 text-purple-700",
];

interface MaturityRadarPanelProps {
  assessment: MaturityAssessment;
  onDeepDive: () => void;
  isLoadingDeepDive: boolean;
  deepDiveAnalysis?: string;
  deepDiveEvidence?: EvidenceCard[];
}

export function MaturityRadarPanel({
  assessment,
  onDeepDive,
  isLoadingDeepDive,
  deepDiveAnalysis,
  deepDiveEvidence,
}: MaturityRadarPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Digital Maturity Assessment</h3>
        </div>
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${LEVEL_BG[assessment.overallLevel]}`}>
          Level {assessment.overallLevel}: {assessment.overallLevelName}
        </span>
      </div>

      {/* Dimension bars */}
      <div className="space-y-3">
        {assessment.dimensions.map((dim) => (
          <div key={dim.name} className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">{dim.name}</span>
              <span className="text-xs text-gray-500">
                {dim.levelName}
              </span>
            </div>
            {/* 4-dot level indicator */}
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-2.5 flex-1 rounded-full ${
                    level <= dim.level
                      ? LEVEL_COLORS[dim.level]
                      : "bg-gray-100"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">{dim.rationale}</p>
            {/* Show first evidence card for this dimension */}
            {dim.evidence.length > 0 && (
              <div className="mt-1">
                <EvidenceCardComponent evidence={dim.evidence[0]} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Leadership & hiring signals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {assessment.leadershipSignals.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Leadership Signals</p>
            <ul className="space-y-1">
              {assessment.leadershipSignals.map((signal, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-emerald-500 shrink-0 mt-0.5">&bull;</span>
                  {signal}
                </li>
              ))}
            </ul>
          </div>
        )}
        {assessment.hiringPatterns.length > 0 && (
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Hiring Patterns</p>
            <ul className="space-y-1">
              {assessment.hiringPatterns.map((pattern, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                  <span className="text-blue-500 shrink-0 mt-0.5">&bull;</span>
                  {pattern}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Deep dive */}
      {deepDiveAnalysis && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-800">Deep Dive Analysis</p>
          <p className="text-sm text-blue-900 whitespace-pre-line">{deepDiveAnalysis}</p>
          {deepDiveEvidence && deepDiveEvidence.length > 0 && (
            <div className="space-y-2 mt-2">
              {deepDiveEvidence.map((ev, i) => (
                <EvidenceCardComponent key={`dd-${i}`} evidence={ev} />
              ))}
            </div>
          )}
        </div>
      )}

      {!deepDiveAnalysis && (
        <Button
          variant="outline"
          size="sm"
          onClick={onDeepDive}
          disabled={isLoadingDeepDive}
          className="w-full"
        >
          {isLoadingDeepDive ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Running deep dive...
            </>
          ) : (
            "Deep Dive: Maturity Assessment"
          )}
        </Button>
      )}
    </div>
  );
}
