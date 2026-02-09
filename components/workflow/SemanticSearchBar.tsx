"use client";

import { useState, useEffect, useCallback } from "react";
import { mapQueryToSteps, IntentResult } from "@/lib/search/intent-mapper";
import { WorkflowStep } from "@/types/workflow";
import { Search } from "lucide-react";

interface SemanticSearchBarProps {
  steps: WorkflowStep[];
  onStepSelect: (stepId: string) => void;
}

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return "bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200";
  if (confidence >= 60) return "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200";
  return "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200";
}

export function SemanticSearchBar({ steps, onStepSelect }: SemanticSearchBarProps) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<IntentResult | null>(null);

  const runSearch = useCallback((q: string) => {
    if (q.trim().length < 3) {
      setResult(null);
      return;
    }
    const mapped = mapQueryToSteps(q, steps);
    setResult(mapped);
  }, [steps]);

  useEffect(() => {
    const timer = setTimeout(() => {
      runSearch(query);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, runSearch]);

  return (
    <div className="w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Describe your AP challenge (e.g., 'we spend too much time on vendor disputes')"
          className="w-full pl-10 pr-4 py-3 border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
        />
      </div>
      {result && result.matches.length > 0 && (
        <div className="mt-2 flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium">Mapped to:</span>
          {result.matches.map((match) => (
            <button
              key={match.stepId}
              onClick={() => onStepSelect(match.stepId)}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-colors cursor-pointer ${confidenceColor(match.confidence)}`}
            >
              {match.stepTitle}
              <span className="opacity-60">({match.confidence}%)</span>
            </button>
          ))}
        </div>
      )}
      {result && result.matches.length === 0 && query.trim().length >= 3 && (
        <p className="mt-2 text-xs text-muted-foreground">
          No matching steps found. Try describing your challenge differently.
        </p>
      )}
    </div>
  );
}
