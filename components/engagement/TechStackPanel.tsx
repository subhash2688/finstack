"use client";

import { TechStackScan } from "@/types/digital-maturity";
import { EvidenceCardComponent } from "./EvidenceCardComponent";
import { Button } from "@/components/ui/button";
import { Cpu, Loader2 } from "lucide-react";

const MATURITY_LABELS = ["", "Manual", "Standardized", "Optimized", "Intelligent"];
const MATURITY_COLORS = ["", "bg-gray-200", "bg-blue-200", "bg-emerald-200", "bg-purple-200"];

interface TechStackPanelProps {
  techStack: TechStackScan;
  onDeepDive: () => void;
  isLoadingDeepDive: boolean;
  deepDiveAnalysis?: string;
  deepDiveEvidence?: TechStackScan["evidence"];
}

export function TechStackPanel({
  techStack,
  onDeepDive,
  isLoadingDeepDive,
  deepDiveAnalysis,
  deepDiveEvidence,
}: TechStackPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-800">Technology Stack</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${MATURITY_COLORS[techStack.overallTechMaturity]} text-gray-800`}>
            Level {techStack.overallTechMaturity}: {MATURITY_LABELS[techStack.overallTechMaturity]}
          </span>
        </div>
      </div>

      {/* Detected technologies */}
      {techStack.detectedTechnologies.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Detected Technologies</p>
          <div className="flex flex-wrap gap-1.5">
            {techStack.detectedTechnologies.map((tech) => (
              <span
                key={tech}
                className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-xs font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ERP Landscape & Automation Footprint */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">ERP Landscape</p>
          <p className="text-sm text-gray-700">{techStack.erpLandscape}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-3">
          <p className="text-xs font-medium text-gray-500 mb-1">Automation Footprint</p>
          <p className="text-sm text-gray-700">{techStack.automationFootprint}</p>
        </div>
      </div>

      {/* Evidence cards */}
      {techStack.evidence.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Evidence</p>
          <div className="space-y-2">
            {techStack.evidence.map((ev, i) => (
              <EvidenceCardComponent key={i} evidence={ev} />
            ))}
          </div>
        </div>
      )}

      {/* Deep dive section */}
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
            "Deep Dive: Technology Stack"
          )}
        </Button>
      )}
    </div>
  );
}
