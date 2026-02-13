"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";

interface VendorRecommendationCardProps {
  toolId: string;
  toolName: string;
  vendor: string;
  fitScore: number;
  stepTitle: string;
  processName: string;
  erpLevel?: string;
}

function getFitLabel(score: number): { label: string; className: string } {
  if (score >= 80) return { label: "Best Fit", className: "bg-emerald-100 text-emerald-700 border-emerald-200" };
  if (score >= 60) return { label: "Good Fit", className: "bg-blue-100 text-blue-700 border-blue-200" };
  if (score >= 40) return { label: "Moderate", className: "bg-amber-100 text-amber-700 border-amber-200" };
  return { label: "Low Fit", className: "bg-gray-100 text-gray-500 border-gray-200" };
}

const ERP_LEVEL_LABELS: Record<string, { label: string; className: string }> = {
  native: { label: "Native", className: "bg-violet-100 text-violet-700 border-violet-200" },
  connector: { label: "Connector", className: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  middleware: { label: "Middleware", className: "bg-slate-100 text-slate-600 border-slate-200" },
  api: { label: "API", className: "bg-gray-50 text-gray-500 border-gray-200" },
};

export function VendorRecommendationCard({
  toolId,
  toolName,
  vendor,
  fitScore,
  stepTitle,
  processName,
  erpLevel,
}: VendorRecommendationCardProps) {
  const fit = getFitLabel(fitScore);
  const erpBadge = erpLevel ? ERP_LEVEL_LABELS[erpLevel] : null;

  return (
    <Link
      href={`/vendors/${toolId}`}
      className="group flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{toolName}</span>
          <span className="text-xs text-muted-foreground">by {vendor}</span>
          {fitScore > 0 && (
            <Badge variant="outline" className={`text-[10px] ${fit.className}`}>
              {fit.label} ({fitScore}%)
            </Badge>
          )}
          {erpBadge && (
            <Badge variant="outline" className={`text-[9px] ${erpBadge.className}`}>
              ERP: {erpBadge.label}
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          Recommended for {stepTitle} ({processName})
        </p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
