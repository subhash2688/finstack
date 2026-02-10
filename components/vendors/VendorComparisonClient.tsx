"use client";

import { useMemo } from "react";
import { Tool, Category } from "@/types/tool";
import { WorkflowStep } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FitScoreBar } from "@/components/tools/FitScoreBadge";
import { getToolFitGrade } from "@/lib/data/tools";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  Clock,
  DollarSign,
  MapPin,
  Minus,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

const aiMaturityLabels: Record<string, string> = {
  "ai-native": "AI-Native",
  "ai-enabled": "AI-Enabled",
  "traditional": "Traditional",
};

const aiMaturityColors: Record<string, string> = {
  "ai-native": "bg-emerald-100 text-emerald-800",
  "ai-enabled": "bg-teal-100 text-teal-800",
  "traditional": "bg-gray-100 text-gray-800",
};

const effortColors: Record<string, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-red-600",
};

interface VendorComparisonClientProps {
  tools: Tool[];
  workflowSteps?: WorkflowStep[];
  category?: Category;
}

export function VendorComparisonClient({ tools, workflowSteps, category }: VendorComparisonClientProps) {
  const colCount = tools.length;

  const steps = useMemo(() => {
    if (workflowSteps && workflowSteps.length > 0) {
      return workflowSteps.map((s) => ({ id: s.id, label: s.abbreviation || s.title }));
    }
    // Fallback: derive from tools' fitScores
    const stepIds = new Set<string>();
    tools.forEach((t) => t.fitScores?.forEach((f) => stepIds.add(f.stepId)));
    return Array.from(stepIds).map((id) => ({ id, label: id }));
  }, [workflowSteps, tools]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <Link
        href={`/${category || 'ap'}?tab=vendors`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Vendor Landscape
      </Link>

      <h1 className="text-3xl font-bold tracking-tight mb-2">Vendor Comparison</h1>
      <p className="text-muted-foreground mb-8">
        Side-by-side evaluation of {tools.length} vendors across all dimensions.
      </p>

      {/* ─── Overview ─── */}
      <ComparisonSection title="Overview">
        <ComparisonRow label="Vendor">
          {tools.map((t) => (
            <div key={t.id}>
              <Link href={`/vendors/${t.id}`} className="text-lg font-bold hover:text-primary transition-colors">
                {t.name}
              </Link>
              <p className="text-xs text-muted-foreground mt-0.5">{t.tagline}</p>
            </div>
          ))}
        </ComparisonRow>
        <ComparisonRow label="AI Maturity">
          {tools.map((t) => (
            <Badge key={t.id} className={aiMaturityColors[t.aiMaturity]}>
              <Sparkles className="h-3 w-3 mr-1" />
              {aiMaturityLabels[t.aiMaturity]}
            </Badge>
          ))}
        </ComparisonRow>
        <ComparisonRow label="Overall Fit">
          {tools.map((t) => (
            <div key={t.id} className="flex items-center gap-2">
              <span className="text-2xl font-bold">{t.overallFitScore ?? "—"}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          ))}
        </ComparisonRow>
        <ComparisonRow label="Company Sizes">
          {tools.map((t) => (
            <div key={t.id} className="flex flex-wrap gap-1">
              {t.companySizes.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs capitalize">{s}</Badge>
              ))}
            </div>
          ))}
        </ComparisonRow>
        <ComparisonRow label="Company Info">
          {tools.map((t) => (
            <div key={t.id} className="space-y-1 text-xs text-muted-foreground">
              {t.founded && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> Founded {t.founded}
                </div>
              )}
              {t.headquarters && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {t.headquarters}
                </div>
              )}
              {t.employeeCount && (
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" /> {t.employeeCount}
                </div>
              )}
            </div>
          ))}
        </ComparisonRow>
      </ComparisonSection>

      {/* ─── Pricing ─── */}
      <ComparisonSection title="Pricing">
        <ComparisonRow label="Model">
          {tools.map((t) => (
            <span key={t.id} className="text-sm">{t.pricing.model}</span>
          ))}
        </ComparisonRow>
        <ComparisonRow label="Starting Price">
          {tools.map((t) => (
            <span key={t.id} className="text-sm font-medium">{t.pricing.startingPrice || "Contact sales"}</span>
          ))}
        </ComparisonRow>
      </ComparisonSection>

      {/* ─── Fit Scores by Step ─── */}
      <ComparisonSection title="Workflow Fit Scores">
        {steps.map((step) => (
          <ComparisonRow key={step.id} label={step.label}>
            {tools.map((t) => {
              const fs = t.fitScores?.find((f) => f.stepId === step.id);
              if (!fs) {
                return (
                  <span key={t.id} className="text-xs text-gray-400 flex items-center gap-1">
                    <Minus className="h-3 w-3" /> Not covered
                  </span>
                );
              }
              return (
                <FitScoreBar key={t.id} score={fs.score} grade={fs.grade} />
              );
            })}
          </ComparisonRow>
        ))}
      </ComparisonSection>

      {/* ─── Step Coverage ─── */}
      <ComparisonSection title="Step Coverage">
        {steps.map((step) => (
          <ComparisonRow key={step.id} label={step.label}>
            {tools.map((t) => {
              const covered = t.workflowSteps.includes(step.id);
              return (
                <span key={t.id}>
                  {covered ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Minus className="h-4 w-4 text-gray-300" />
                  )}
                </span>
              );
            })}
          </ComparisonRow>
        ))}
        <ComparisonRow label="Total Steps">
          {tools.map((t) => (
            <span key={t.id} className="text-sm font-semibold">
              {t.workflowSteps.length} / {steps.length}
            </span>
          ))}
        </ComparisonRow>
      </ComparisonSection>

      {/* ─── Adoption ─── */}
      <ComparisonSection title="Market Adoption">
        <ComparisonRow label="Customers">
          {tools.map((t) => (
            <span key={t.id} className="text-sm font-medium">{t.adoptionMetrics?.customerCount ?? "—"}</span>
          ))}
        </ComparisonRow>
        <ComparisonRow label="Revenue">
          {tools.map((t) => (
            <span key={t.id} className="text-sm">{t.adoptionMetrics?.revenue ?? "—"}</span>
          ))}
        </ComparisonRow>
        <ComparisonRow label="YoY Growth">
          {tools.map((t) => (
            <span key={t.id} className="text-sm text-primary font-medium">{t.adoptionMetrics?.yoyGrowth ?? "—"}</span>
          ))}
        </ComparisonRow>
        <ComparisonRow label="G2 Rating">
          {tools.map((t) => (
            <span key={t.id} className="text-sm flex items-center gap-1">
              {t.adoptionMetrics?.g2Rating != null ? (
                <>
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  {t.adoptionMetrics.g2Rating}
                </>
              ) : "—"}
            </span>
          ))}
        </ComparisonRow>
        <ComparisonRow label="Gartner">
          {tools.map((t) => (
            <span key={t.id} className="text-sm">{t.adoptionMetrics?.gartnerPosition ?? "—"}</span>
          ))}
        </ComparisonRow>
      </ComparisonSection>

      {/* ─── Deployment ─── */}
      <ComparisonSection title="Deployment">
        <ComparisonRow label="Timeline">
          {tools.map((t) => (
            <span key={t.id} className="text-sm">{t.deploymentComplexity?.typicalTimeline ?? "—"}</span>
          ))}
        </ComparisonRow>
        <ComparisonRow label="Effort">
          {tools.map((t) => (
            <span key={t.id} className={`text-sm font-medium capitalize ${t.deploymentComplexity?.effortLevel ? effortColors[t.deploymentComplexity.effortLevel] : ""}`}>
              {t.deploymentComplexity?.effortLevel ?? "—"}
            </span>
          ))}
        </ComparisonRow>
        <ComparisonRow label="IT Required">
          {tools.map((t) => (
            <span key={t.id} className="text-sm">
              {t.deploymentComplexity?.requiresIt != null
                ? (t.deploymentComplexity.requiresIt ? "Yes" : "No")
                : "—"}
            </span>
          ))}
        </ComparisonRow>
      </ComparisonSection>

      {/* ─── Features ─── */}
      <ComparisonSection title="Key Features">
        {tools.map((t) => t.keyFeatures.length).reduce((a, b) => Math.max(a, b), 0) > 0 && (
          <ComparisonRow label="Features">
            {tools.map((t) => (
              <ul key={t.id} className="space-y-1">
                {t.keyFeatures.slice(0, 5).map((f, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start">
                    <span className="mr-1.5 text-primary shrink-0">•</span>
                    {f}
                  </li>
                ))}
              </ul>
            ))}
          </ComparisonRow>
        )}
        <ComparisonRow label="Integrations">
          {tools.map((t) => (
            <div key={t.id} className="flex flex-wrap gap-1">
              {t.integrations.slice(0, 4).map((int, i) => (
                <Badge key={i} variant="secondary" className="text-[10px]">{int}</Badge>
              ))}
              {t.integrations.length > 4 && (
                <Badge variant="secondary" className="text-[10px]">+{t.integrations.length - 4}</Badge>
              )}
            </div>
          ))}
        </ComparisonRow>
      </ComparisonSection>
    </div>
  );
}

/* ─── Helper Components ─── */

function ComparisonSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-3 text-gray-900 border-b pb-2">{title}</h2>
      <div className="space-y-0">{children}</div>
    </div>
  );
}

function ComparisonRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="comparison-row">
      <div className="comparison-label">{label}</div>
      {items.map((child, i) => (
        <div key={i} className="comparison-cell">
          {child}
        </div>
      ))}
    </div>
  );
}
