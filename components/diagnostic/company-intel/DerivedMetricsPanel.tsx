"use client";

import { DerivedMetrics } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calculator } from "lucide-react";

interface DerivedMetricsPanelProps {
  metrics: DerivedMetrics;
}

function MetricRow({ label, value, unit, description }: { label: string; value: number | undefined; unit: string; description: string }) {
  if (value === undefined) return null;

  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <span className="text-sm font-medium">{label}</span>
        <p className="text-[10px] text-muted-foreground">{description}</p>
      </div>
      <div className="text-right">
        <span className="text-lg font-semibold">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <span className="text-xs text-muted-foreground ml-1">{unit}</span>
      </div>
    </div>
  );
}

export function DerivedMetricsPanel({ metrics }: DerivedMetricsPanelProps) {
  const hasAny = metrics.dso !== undefined || metrics.dpo !== undefined ||
    metrics.inventoryTurns !== undefined || metrics.currentRatio !== undefined ||
    metrics.debtToEquity !== undefined;

  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Derived Metrics</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Derived from SEC filings
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        <MetricRow
          label="DSO"
          value={metrics.dso}
          unit="days"
          description="Days Sales Outstanding (AR / Revenue x 365)"
        />
        <MetricRow
          label="DPO"
          value={metrics.dpo}
          unit="days"
          description="Days Payable Outstanding (AP / COGS x 365)"
        />
        <MetricRow
          label="Inventory Turns"
          value={metrics.inventoryTurns}
          unit="x"
          description="COGS / Average Inventory"
        />
        <MetricRow
          label="Current Ratio"
          value={metrics.currentRatio}
          unit="x"
          description="Current Assets / Current Liabilities"
        />
        <MetricRow
          label="Debt-to-Equity"
          value={metrics.debtToEquity}
          unit="x"
          description="Total Liabilities / Total Equity"
        />
      </CardContent>
    </Card>
  );
}
