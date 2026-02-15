"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { BuildVsBuyAnalysis } from "@/types/technology";
import { CapabilityDefinition } from "@/types/technology";
import { Hammer, ShoppingCart, ArrowRight, Check, X } from "lucide-react";

interface BuildVsBuyCardProps {
  analysis: BuildVsBuyAnalysis;
  capability: CapabilityDefinition;
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}K`;
  return `$${amount}`;
}

const RECOMMENDATION_LABELS: Record<string, { label: string; className: string }> = {
  build: { label: "Recommend Build", className: "bg-blue-100 text-blue-700 border-blue-200" },
  buy: { label: "Recommend Buy", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  hybrid: { label: "Recommend Hybrid", className: "bg-purple-100 text-purple-700 border-purple-200" },
};

export function BuildVsBuyCard({ analysis, capability }: BuildVsBuyCardProps) {
  const rec = RECOMMENDATION_LABELS[analysis.recommendation] || RECOMMENDATION_LABELS.buy;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">{capability.name}</h3>
          <Badge variant="outline" className={`text-[10px] ${rec.className}`}>
            {rec.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Build Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-blue-700">
              <Hammer className="h-3.5 w-3.5" />
              Build In-House
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <p className="text-muted-foreground mb-1">Team</p>
                {analysis.build.teamComposition.map((member, i) => (
                  <p key={i}>
                    {member.count}× {member.role}
                  </p>
                ))}
              </div>

              <div>
                <p className="text-muted-foreground">Timeline</p>
                <p className="font-medium">{analysis.build.timelineMonths} months</p>
              </div>

              <div>
                <p className="text-muted-foreground">Estimated Cost</p>
                <p className="font-medium">
                  {formatCurrency(analysis.build.estimatedCost.low)}–
                  {formatCurrency(analysis.build.estimatedCost.high)}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Tech Stack</p>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {analysis.build.techStack.map((t) => (
                    <Badge
                      key={t}
                      variant="outline"
                      className="text-[9px] bg-gray-50"
                    >
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Pros</p>
                {analysis.build.pros.map((p, i) => (
                  <p key={i} className="flex items-start gap-1 text-emerald-600">
                    <Check className="h-3 w-3 mt-0.5 shrink-0" />
                    {p}
                  </p>
                ))}
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Cons</p>
                {analysis.build.cons.map((c, i) => (
                  <p key={i} className="flex items-start gap-1 text-red-600">
                    <X className="h-3 w-3 mt-0.5 shrink-0" />
                    {c}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Buy Column */}
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <ShoppingCart className="h-3.5 w-3.5" />
              Buy Solution
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <p className="text-muted-foreground">Implementation Cost</p>
                <p className="font-medium">
                  {formatCurrency(analysis.buy.implementationCost.low)}–
                  {formatCurrency(analysis.buy.implementationCost.high)}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Annual Cost</p>
                <p className="font-medium">
                  {formatCurrency(analysis.buy.annualCost.low)}–
                  {formatCurrency(analysis.buy.annualCost.high)}/yr
                </p>
              </div>

              <div>
                <p className="text-muted-foreground">Timeline</p>
                <p className="font-medium">{analysis.buy.typicalTimeline}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Effort Level</p>
                <Badge
                  variant="outline"
                  className={`text-[9px] ${
                    analysis.buy.effortLevel === "low"
                      ? "bg-emerald-50 text-emerald-600"
                      : analysis.buy.effortLevel === "medium"
                      ? "bg-amber-50 text-amber-600"
                      : "bg-red-50 text-red-600"
                  }`}
                >
                  {analysis.buy.effortLevel}
                </Badge>
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Pros</p>
                {analysis.buy.pros.map((p, i) => (
                  <p key={i} className="flex items-start gap-1 text-emerald-600">
                    <Check className="h-3 w-3 mt-0.5 shrink-0" />
                    {p}
                  </p>
                ))}
              </div>

              <div>
                <p className="text-muted-foreground mb-1">Cons</p>
                {analysis.buy.cons.map((c, i) => (
                  <p key={i} className="flex items-start gap-1 text-red-600">
                    <X className="h-3 w-3 mt-0.5 shrink-0" />
                    {c}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendation */}
        <div className="bg-blue-50 rounded-lg p-3 flex items-start gap-2">
          <ArrowRight className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-900">
              AI Recommendation
            </p>
            <p className="text-xs text-blue-700 mt-0.5">
              {analysis.rationale}
            </p>
            <Badge
              variant="outline"
              className="text-[9px] mt-1.5 bg-blue-100/50 text-blue-600 border-blue-200"
            >
              AI Analysis
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
