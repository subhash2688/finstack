"use client";

import { AIApplicabilitySplit } from "@/types/diagnostic";
import { Card, CardContent } from "@/components/ui/card";

interface AIApplicabilityChartProps {
  split: AIApplicabilitySplit;
}

interface SegmentProps {
  label: string;
  min: number;
  max: number;
  description: string;
  colorClass: string;
  bgClass: string;
}

function Segment({ label, min, max, description, colorClass, bgClass }: SegmentProps) {
  const midpoint = (min + max) / 2;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-sm ${colorClass}`} />
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className="text-sm font-semibold tabular-nums">
          {min}–{max}%
        </span>
      </div>
      <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${bgClass} relative`}
          style={{ width: `${midpoint}%` }}
        >
          {/* Min marker */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/60"
            style={{ left: `${(min / midpoint) * 100}%` }}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

export function AIApplicabilityChart({ split }: AIApplicabilityChartProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-5">
          AI Applicability Breakdown
        </h3>

        {/* Stacked overview bar */}
        <div className="flex h-5 rounded-full overflow-hidden mb-6">
          <div
            className="bg-emerald-500 transition-all"
            style={{
              width: `${(split.highLeverage.min + split.highLeverage.max) / 2}%`,
            }}
          />
          <div
            className="bg-amber-400 transition-all"
            style={{
              width: `${(split.humanInTheLoop.min + split.humanInTheLoop.max) / 2}%`,
            }}
          />
          <div
            className="bg-gray-300 transition-all"
            style={{
              width: `${(split.humanLed.min + split.humanLed.max) / 2}%`,
            }}
          />
        </div>

        <div className="space-y-5">
          <Segment
            label="High AI Leverage"
            min={split.highLeverage.min}
            max={split.highLeverage.max}
            description={split.highLeverage.description}
            colorClass="bg-emerald-500"
            bgClass="bg-emerald-500"
          />
          <Segment
            label="Human-in-the-Loop"
            min={split.humanInTheLoop.min}
            max={split.humanInTheLoop.max}
            description={split.humanInTheLoop.description}
            colorClass="bg-amber-400"
            bgClass="bg-amber-400"
          />
          <Segment
            label="Human-Led"
            min={split.humanLed.min}
            max={split.humanLed.max}
            description={split.humanLed.description}
            colorClass="bg-gray-300"
            bgClass="bg-gray-300"
          />
        </div>
      </CardContent>
    </Card>
  );
}
