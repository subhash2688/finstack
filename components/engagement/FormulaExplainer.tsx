"use client";

import { StepSavingsEstimate } from "@/types/findings";
import { Card, CardContent } from "@/components/ui/card";
import { Calculator } from "lucide-react";

interface FormulaExplainerProps {
  topStep: StepSavingsEstimate;
  teamSize: number;
  costPerPerson: number;
}

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

export function FormulaExplainer({ topStep, teamSize, costPerPerson }: FormulaExplainerProps) {
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            How We Calculate
          </span>
        </div>

        {/* Formula */}
        <div className="bg-background rounded-md px-4 py-3 mb-3 font-mono text-xs text-center border">
          <span className="text-muted-foreground">Savings</span>
          {" = "}
          <span className="text-primary font-medium">Team Size</span>
          {" × "}
          <span className="text-primary font-medium">Capacity Weight</span>
          {" × "}
          <span className="text-primary font-medium">Automation %</span>
          {" × "}
          <span className="text-primary font-medium">Cost/Person</span>
        </div>

        {/* Worked example */}
        <div className="text-xs text-muted-foreground mb-2">
          <span className="font-medium text-foreground">Example:</span>{" "}
          {topStep.stepTitle}
        </div>

        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-background rounded p-2 border">
            <div className="text-sm font-semibold tabular-nums">{teamSize}</div>
            <div className="text-[10px] text-muted-foreground">Team</div>
          </div>
          <div className="bg-background rounded p-2 border">
            <div className="text-sm font-semibold tabular-nums">{Math.round(topStep.capacityWeight * 100)}%</div>
            <div className="text-[10px] text-muted-foreground">Capacity</div>
          </div>
          <div className="bg-background rounded p-2 border">
            <div className="text-sm font-semibold tabular-nums">{Math.round(topStep.automationPotential * 100)}%</div>
            <div className="text-[10px] text-muted-foreground">Automation</div>
          </div>
          <div className="bg-background rounded p-2 border">
            <div className="text-sm font-semibold tabular-nums">{formatCurrency(costPerPerson)}</div>
            <div className="text-[10px] text-muted-foreground">Cost</div>
          </div>
        </div>

        <div className="text-center mt-2">
          <span className="text-xs text-muted-foreground">= </span>
          <span className="text-sm font-semibold">{formatCurrency(topStep.savings.mid)}</span>
          <span className="text-xs text-muted-foreground">/yr midpoint</span>
        </div>
      </CardContent>
    </Card>
  );
}
