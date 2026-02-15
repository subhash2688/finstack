"use client";

import { MarketSignals, EvidenceCard } from "@/types/digital-maturity";
import { EvidenceCardComponent } from "./EvidenceCardComponent";
import { Button } from "@/components/ui/button";
import { TrendingUp, Loader2, ExternalLink } from "lucide-react";

interface MarketSignalsPanelProps {
  signals: MarketSignals;
  onDeepDive: () => void;
  isLoadingDeepDive: boolean;
  deepDiveAnalysis?: string;
  deepDiveEvidence?: EvidenceCard[];
}

export function MarketSignalsPanel({
  signals,
  onDeepDive,
  isLoadingDeepDive,
  deepDiveAnalysis,
  deepDiveEvidence,
}: MarketSignalsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-gray-500" />
        <h3 className="text-sm font-semibold text-gray-800">Market Signals</h3>
      </div>

      {/* Competitive pressure */}
      <div className="rounded-lg border border-gray-200 bg-white p-3">
        <p className="text-xs font-medium text-gray-500 mb-1">Competitive Pressure</p>
        <p className="text-sm text-gray-700">{signals.competitivePressure}</p>
      </div>

      {/* Peer moves */}
      {signals.peerMoves.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Peer Digital Moves</p>
          <div className="space-y-2">
            {signals.peerMoves.map((move, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-start justify-between">
                  <span className="text-sm font-medium text-gray-800">{move.peerName}</span>
                  {move.source && (
                    <SourceLink text={move.source} />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{move.action}</p>
                <p className="text-xs text-gray-500 mt-1">{move.relevance}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analyst mentions */}
      {signals.analystMentions.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Analyst Commentary</p>
          <div className="space-y-2">
            {signals.analystMentions.map((mention, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                <blockquote className="text-sm text-gray-700 italic border-l-2 border-gray-300 pl-3">
                  &ldquo;{mention.quote}&rdquo;
                </blockquote>
                <div className="text-xs text-gray-500 mt-1.5 flex items-center gap-1 flex-wrap">
                  <span>— {mention.analyst} |</span>
                  <SourceLink text={mention.context} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* M&A activity */}
      {signals.maActivity.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">M&A Activity</p>
          <div className="space-y-2">
            {signals.maActivity.map((ma, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                <p className="text-sm text-gray-700">{ma.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-gray-500">{ma.relevance}</p>
                  {ma.date && (
                    <span className="text-xs text-gray-400">{ma.date}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            "Deep Dive: Market Signals"
          )}
        </Button>
      )}
    </div>
  );
}

// ── Source Link Helper ──
// Renders as a clickable hyperlink if the text looks like a URL, otherwise plain text

function SourceLink({ text }: { text: string }) {
  const isUrl = /^https?:\/\//i.test(text.trim());

  if (isUrl) {
    // Extract a readable label from the URL domain
    let label = text;
    try {
      const url = new URL(text.trim());
      label = url.hostname.replace(/^www\./, "");
    } catch {
      // keep full text as label
    }
    return (
      <a
        href={text.trim()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline shrink-0"
      >
        {label}
        <ExternalLink className="h-3 w-3" />
      </a>
    );
  }

  // Check if the text contains a URL embedded within it
  const urlMatch = text.match(/(https?:\/\/[^\s)]+)/i);
  if (urlMatch) {
    const url = urlMatch[1];
    let label = url;
    try {
      label = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      // keep url as label
    }
    const before = text.slice(0, urlMatch.index).trim();
    return (
      <span className="text-xs text-gray-400 shrink-0">
        {before && `${before} `}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5"
        >
          {label}
          <ExternalLink className="h-3 w-3 inline" />
        </a>
      </span>
    );
  }

  return <span className="text-xs text-gray-400 shrink-0">{text}</span>;
}
