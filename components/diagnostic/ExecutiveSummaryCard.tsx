"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CompanyDiagnostic, ExecutiveSummary, ChallengeCategory } from "@/types/diagnostic";
import { ScoringResult } from "@/lib/scoring/automation-score";
import { Sparkles } from "lucide-react";

interface ExecutiveSummaryCardProps {
  diagnostic: CompanyDiagnostic;
  companyName: string;
  industry: string;
  companySize: string;
  scoringResult?: ScoringResult | null;
  maturityLevel?: number | null;
}

const categoryColors: Record<ChallengeCategory, { bg: string; text: string }> = {
  operational: { bg: "bg-blue-100", text: "text-blue-800" },
  cost: { bg: "bg-amber-100", text: "text-amber-800" },
  "data-quality": { bg: "bg-purple-100", text: "text-purple-800" },
  scale: { bg: "bg-orange-100", text: "text-orange-800" },
  positive: { bg: "bg-emerald-100", text: "text-emerald-800" },
};

function ThemePills({ themes }: { themes: ExecutiveSummary["themes"] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {themes.map((theme, i) => {
        const colors = categoryColors[theme.category] || categoryColors.operational;
        return (
          <span
            key={i}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
          >
            {theme.label}
          </span>
        );
      })}
    </div>
  );
}

export function ExecutiveSummaryCard({
  diagnostic,
  companyName,
  industry,
  companySize,
  scoringResult,
  maturityLevel,
}: ExecutiveSummaryCardProps) {
  const summary = diagnostic.executiveSummary;

  // Fallback: render old archetype-style card if no executiveSummary
  if (!summary) {
    return (
      <Card className="border-l-4 border-l-emerald-500">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="mt-1 p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight">
                {diagnostic.companyArchetype}
              </h2>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{companyName}</span>
                <span className="text-muted-foreground/40">|</span>
                <span>{industry}</span>
                <span className="text-muted-foreground/40">|</span>
                <span className="capitalize">{companySize}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {diagnostic.archetypeDescription}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Build key metrics from available data
  const metrics: { label: string; value: string }[] = [];
  if (scoringResult) {
    metrics.push({ label: "Complexity", value: `${scoringResult.complexityScore}/100` });
    metrics.push({ label: "Automation Ceiling", value: `${scoringResult.constraints.highLeverageMax}%` });
    metrics.push({ label: "Cost Savings", value: scoringResult.constraints.costSavingsRange });
  }
  if (maturityLevel != null) {
    metrics.push({ label: "Digital Maturity", value: `Level ${maturityLevel}/4` });
  }

  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardContent className="p-6 space-y-5">
        {/* Header row */}
        <div className="flex items-start gap-4">
          <div className="mt-1 p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-2 min-w-0 flex-1">
            <h2 className="text-xl font-semibold tracking-tight">
              {diagnostic.companyArchetype}
            </h2>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{companyName}</span>
              <span className="text-muted-foreground/40">|</span>
              <span>{industry}</span>
              <span className="text-muted-foreground/40">|</span>
              <span className="capitalize">{companySize}</span>
            </div>
          </div>
        </div>

        {/* Theme pills */}
        {summary.themes.length > 0 && (
          <ThemePills themes={summary.themes} />
        )}

        {/* Structured brief */}
        <div className="space-y-4 pl-0.5">
          {/* Situation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Situation
            </h4>
            <p className="text-sm text-gray-700 leading-relaxed">
              {summary.situation}
            </p>
          </div>

          {/* Key Findings */}
          {summary.keyFindings.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Key Findings
              </h4>
              <ul className="space-y-1">
                {summary.keyFindings.map((finding, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-500 mt-1 shrink-0">&#x2022;</span>
                    <span className="leading-relaxed">{finding}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Opportunity Themes */}
          {summary.opportunityThemes.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Opportunity Themes
              </h4>
              <div className="space-y-2">
                {summary.opportunityThemes.map((ot, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-medium text-gray-800">{ot.theme}</span>
                    <span className="text-gray-500"> — </span>
                    <span className="text-gray-600">{ot.rationale}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Key metrics bar */}
        {metrics.length > 0 && (
          <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100">
            {metrics.map((m) => (
              <div key={m.label} className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-400">{m.label}:</span>
                <span className="font-semibold text-gray-700">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
