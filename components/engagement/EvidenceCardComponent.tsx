"use client";

import { EvidenceCard, SourceType, ConfidenceLevel } from "@/types/digital-maturity";
import { ExternalLink } from "lucide-react";

const SOURCE_COLORS: Record<SourceType, string> = {
  "Job Posting": "bg-amber-100 text-amber-800",
  "SEC Filing": "bg-emerald-100 text-emerald-800",
  "Earnings Call": "bg-blue-100 text-blue-800",
  "News": "bg-gray-100 text-gray-800",
  "Press Release": "bg-purple-100 text-purple-800",
};

const CONFIDENCE_COLORS: Record<ConfidenceLevel, string> = {
  "High": "bg-emerald-100 text-emerald-700",
  "Medium": "bg-amber-100 text-amber-700",
  "Low": "bg-gray-100 text-gray-600",
};

interface EvidenceCardComponentProps {
  evidence: EvidenceCard;
}

export function EvidenceCardComponent({ evidence }: EvidenceCardComponentProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 space-y-2">
      <blockquote className="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3">
        &ldquo;{evidence.quote}&rdquo;
      </blockquote>

      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${SOURCE_COLORS[evidence.sourceType] || "bg-gray-100 text-gray-700"}`}>
          {evidence.sourceType}
        </span>
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${CONFIDENCE_COLORS[evidence.confidence] || "bg-gray-100 text-gray-600"}`}>
          {evidence.confidence}
        </span>
        {evidence.sourceUrl && (
          <a
            href={evidence.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            {evidence.sourceLabel || "Source"}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      <p className="text-xs text-gray-600">{evidence.interpretation}</p>
    </div>
  );
}
