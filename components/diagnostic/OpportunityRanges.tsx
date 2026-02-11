"use client";

import { AutomationOpportunity } from "@/types/diagnostic";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface OpportunityRangesProps {
  opportunity: AutomationOpportunity;
}

interface RangeBarProps {
  label: string;
  min: number;
  max: number;
  unit?: string;
  color: string;
}

function RangeBar({ label, min, max, unit = "%", color }: RangeBarProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {min}–{max}{unit}
        </span>
      </div>
      <div className="relative w-full h-3 bg-muted rounded-full">
        {/* Range fill */}
        <div
          className={`absolute top-0 bottom-0 rounded-full ${color}`}
          style={{
            left: `${min}%`,
            width: `${max - min}%`,
          }}
        />
        {/* Min marker */}
        <div
          className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-foreground/40 rounded-full"
          style={{ left: `${min}%` }}
        />
        {/* Max marker */}
        <div
          className="absolute top-[-2px] bottom-[-2px] w-0.5 bg-foreground/40 rounded-full"
          style={{ left: `${max}%` }}
        />
      </div>
    </div>
  );
}

export function OpportunityRanges({ opportunity }: OpportunityRangesProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-5">
          Automation Opportunity
        </h3>

        <div className="space-y-5">
          <RangeBar
            label="Effort Addressable by AI"
            min={opportunity.effortAddressable.min}
            max={opportunity.effortAddressable.max}
            color="bg-emerald-500"
          />
          <RangeBar
            label="Potential Cost Savings"
            min={opportunity.costSavingsRange.min}
            max={opportunity.costSavingsRange.max}
            color="bg-blue-500"
          />
          <RangeBar
            label="Capacity Unlocked"
            min={opportunity.capacityUnlocked.min}
            max={opportunity.capacityUnlocked.max}
            color="bg-violet-500"
          />
        </div>

        <div className="mt-5 flex gap-2 p-3 bg-muted/50 rounded-lg">
          <AlertTriangle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {opportunity.disclaimer}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
