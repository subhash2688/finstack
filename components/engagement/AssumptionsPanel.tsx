"use client";

import { useState } from "react";
import { SavingsAssumptions, DEFAULT_ASSUMPTIONS } from "@/types/findings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp, RotateCcw, Settings2 } from "lucide-react";

interface AssumptionsPanelProps {
  assumptions: SavingsAssumptions;
  companySize: string;
  onChange: (assumptions: SavingsAssumptions) => void;
}

function formatCurrency(value: number): string {
  return `$${Math.round(value / 1000)}K`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function AssumptionsPanel({ assumptions, companySize, onChange }: AssumptionsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const defaults = DEFAULT_ASSUMPTIONS[companySize] ?? DEFAULT_ASSUMPTIONS["smb"];

  const isCustom = JSON.stringify(assumptions) !== JSON.stringify(defaults);

  function handleReset() {
    onChange({ ...defaults });
  }

  function update(patch: Partial<SavingsAssumptions>) {
    onChange({ ...assumptions, ...patch });
  }

  function updateAutomation(key: "manual" | "semiAutomated" | "automated", value: number) {
    onChange({
      ...assumptions,
      automationPotential: { ...assumptions.automationPotential, [key]: value },
    });
  }

  return (
    <Card className="border-dashed">
      <CardContent className="p-0">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-accent/30 transition-colors"
        >
          <Settings2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="text-sm font-medium flex-1">Assumptions</span>
          {isCustom && (
            <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 border-amber-200">
              Customized
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            {formatCurrency(assumptions.costPerPerson)}/person
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-5">
            {/* Cost per person */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">Fully-loaded cost per person</label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(assumptions.costPerPerson)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                Annual salary + benefits + overhead for a finance team member.
              </p>
              <input
                type="range"
                min={40000}
                max={200000}
                step={5000}
                value={assumptions.costPerPerson}
                onChange={(e) => update({ costPerPerson: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>$40K</span>
                <span>$200K</span>
              </div>
            </div>

            {/* Automation potential by maturity */}
            <div>
              <label className="text-xs font-medium block mb-1.5">Automation potential by maturity level</label>
              <p className="text-[10px] text-muted-foreground mb-3">
                What % of a step's effort can automation address at each maturity level?
              </p>
              <div className="space-y-3">
                {/* Manual */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-[11px]">Manual processes</span>
                    </div>
                    <span className="text-[11px] tabular-nums font-medium">
                      {formatPercent(assumptions.automationPotential.manual)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={assumptions.automationPotential.manual}
                    onChange={(e) => updateAutomation("manual", Number(e.target.value))}
                    className="w-full accent-red-400"
                  />
                </div>
                {/* Semi-automated */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="text-[11px]">Semi-automated</span>
                    </div>
                    <span className="text-[11px] tabular-nums font-medium">
                      {formatPercent(assumptions.automationPotential.semiAutomated)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={0.8}
                    step={0.05}
                    value={assumptions.automationPotential.semiAutomated}
                    onChange={(e) => updateAutomation("semiAutomated", Number(e.target.value))}
                    className="w-full accent-amber-400"
                  />
                </div>
                {/* Automated */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[11px]">Already automated</span>
                    </div>
                    <span className="text-[11px] tabular-nums font-medium">
                      {formatPercent(assumptions.automationPotential.automated)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={0.3}
                    step={0.01}
                    value={assumptions.automationPotential.automated}
                    onChange={(e) => updateAutomation("automated", Number(e.target.value))}
                    className="w-full accent-emerald-400"
                  />
                </div>
              </div>
            </div>

            {/* Range factor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium">Estimate range (±)</label>
                <span className="text-xs text-muted-foreground tabular-nums">
                  ±{Math.round(assumptions.rangeFactor * 100)}%
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-2">
                How wide should the low–high range be around the midpoint estimate?
              </p>
              <input
                type="range"
                min={0.1}
                max={0.5}
                step={0.05}
                value={assumptions.rangeFactor}
                onChange={(e) => update({ rangeFactor: Number(e.target.value) })}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>±10%</span>
                <span>±50%</span>
              </div>
            </div>

            {/* Reset button */}
            {isCustom && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs gap-1.5"
              >
                <RotateCcw className="h-3 w-3" />
                Reset to Defaults
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
