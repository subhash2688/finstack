"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { getAllEngagements, deleteEngagement } from "@/lib/storage/engagements";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import { FUNCTIONS } from "@/types/function";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Plus,
  Trash2,
  ChevronRight,
  Building2,
  FileText,
  Sparkles,
  CheckCircle2,
  Clock,
} from "lucide-react";

// ── Company logo (favicon-based) ──
const DOMAIN_MAP: Record<string, string> = {
  datadog: "datadoghq.com",
  salesforce: "salesforce.com",
  servicenow: "servicenow.com",
  meta: "meta.com",
  alphabet: "google.com",
  microsoft: "microsoft.com",
};

function guessDomain(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/\b(inc|corp|co|ltd|llc|group|holdings|technologies|systems|software)\b\.?/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
  return DOMAIN_MAP[cleaned] || `${cleaned}.com`;
}

function CompanyLogo({ name, size = 40 }: { name: string; size?: number }) {
  const [imgError, setImgError] = useState(false);
  const domain = guessDomain(name);
  const logoUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  if (imgError) {
    return (
      <div
        className="rounded-xl bg-primary/10 flex items-center justify-center shrink-0"
        style={{ width: size, height: size }}
      >
        <span className="text-sm font-bold text-primary">{initials}</span>
      </div>
    );
  }

  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={logoUrl}
      alt=""
      width={size}
      height={size}
      className="rounded-xl object-contain bg-white border p-1 shrink-0"
      style={{ width: size, height: size }}
      onError={() => setImgError(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth <= 16) setImgError(true);
      }}
    />
  );
}

// ── Time ago helper ──
function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ── Compute engagement progress ──
// AlixPartners green gradient for progress stages
const PROGRESS_COLORS = {
  intake:     "#8DC63F", // Lime green
  hypothesis: "#4CAF50", // Medium green
  assessing:  "#00B140", // AlixPartners primary
  complete:   "#145C30", // Forest green
};

function computeProgress(engagement: Engagement): {
  label: string;
  step: number;
  accent: string; // hex color for left border
} {
  const hasDiagnostic = !!engagement.diagnostic;
  const hasCompleteAssessment = engagement.processAssessments.some((pa) => {
    const ratedCount = pa.maturityRatings ? Object.keys(pa.maturityRatings).length : 0;
    const workflow = getWorkflow(pa.processId as WorkflowId);
    const totalSteps = pa.generatedWorkflow?.length || workflow?.steps.length || 0;
    return ratedCount >= totalSteps && totalSteps > 0;
  });
  const hasAnyRatings = engagement.processAssessments.some(
    (pa) => pa.maturityRatings && Object.keys(pa.maturityRatings).length > 0
  );

  if (hasCompleteAssessment) {
    return { label: "Assessment Complete", step: 3, accent: PROGRESS_COLORS.complete };
  }
  if (hasAnyRatings) {
    return { label: "Assessing", step: 2, accent: PROGRESS_COLORS.assessing };
  }
  if (hasDiagnostic) {
    return { label: "Hypothesis Ready", step: 1, accent: PROGRESS_COLORS.hypothesis };
  }
  return { label: "Intake", step: 0, accent: PROGRESS_COLORS.intake };
}

export function EngagementList() {
  const router = useRouter();
  const [engagements, setEngagements] = useState<Engagement[]>([]);

  useEffect(() => {
    setEngagements(getAllEngagements());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this engagement?")) {
      deleteEngagement(id);
      setEngagements(getAllEngagements());
    }
  };

  if (engagements.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="h-16 w-16 mx-auto rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
          <Briefcase className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-semibold mb-2">No engagements yet</h2>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
          Create your first engagement to start assessing client processes and uncovering opportunities.
        </p>
        <Button
          size="lg"
          className="gap-2"
          onClick={() => router.push("/engagements/new")}
        >
          <Plus className="h-4 w-4" />
          New Engagement
        </Button>
      </div>
    );
  }

  // Sort by most recently updated
  const sorted = [...engagements].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-4">
      {sorted.map((engagement) => {
        const ctx = engagement.clientContext;
        const func = FUNCTIONS.find((f) => f.id === ctx.functionId);
        const processCount = engagement.processAssessments?.length || 0;
        const totalSteps = engagement.processAssessments.reduce((sum, pa) => {
          const workflow = getWorkflow(pa.processId as WorkflowId);
          return sum + (pa.generatedWorkflow?.length || workflow?.steps.length || 0);
        }, 0);
        const progress = computeProgress(engagement);
        const hasIntel = !!engagement.companyIntel;

        // Build pills
        const pills: string[] = [];
        if (ctx.isPublic && ctx.tickerSymbol) pills.push(ctx.tickerSymbol);
        if (ctx.subSector) pills.push(ctx.subSector);
        else if (ctx.industry) pills.push(ctx.industry);
        if (func?.name) pills.push(func.name);

        // Process names
        const processNames = engagement.processAssessments
          .map((pa) => pa.processName)
          .slice(0, 3);

        return (
          <div
            key={engagement.id}
            onClick={() => router.push(`/engagements/${engagement.id}`)}
            className="group border rounded-xl bg-white hover:shadow-lg hover:shadow-primary/5 transition-all duration-200 cursor-pointer overflow-hidden"
            style={{ borderLeft: `4px solid ${progress.accent}` }}
          >
            <div className="p-5">
              {/* Top row: logo + company info + actions */}
              <div className="flex items-start gap-4">
                <CompanyLogo name={ctx.companyName} size={44} />

                <div className="flex-1 min-w-0">
                  {/* Company name + pills */}
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold truncate">
                      {ctx.companyName}
                    </h3>
                    {pills.map((pill) => (
                      <Badge
                        key={pill}
                        variant="secondary"
                        className="px-2 py-0 text-[10px] font-medium h-5 shrink-0"
                      >
                        {pill}
                      </Badge>
                    ))}
                  </div>

                  {/* Process list */}
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" />
                      {processCount} {processCount === 1 ? "process" : "processes"} &middot; {totalSteps} steps
                    </span>
                    {processNames.length > 0 && (
                      <>
                        <span className="text-muted-foreground/30">|</span>
                        <span className="truncate">
                          {processNames.join(", ")}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Right side: status + actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-0.5">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: progress.accent }} />
                      <span className="text-sm font-semibold">{progress.label}</span>
                    </div>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                      <Clock className="h-3.5 w-3.5" />
                      {timeAgo(engagement.updatedAt)}
                    </span>
                  </div>

                  <button
                    onClick={(e) => handleDelete(e, engagement.id)}
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete engagement"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>

                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </div>

              {/* Bottom row: status indicators */}
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100">
                {hasIntel && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    Company Intel
                  </span>
                )}
                {engagement.diagnostic && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Sparkles className="h-3.5 w-3.5 text-violet-500" />
                    Hypothesis
                  </span>
                )}
                {engagement.processAssessments.some(
                  (pa) => pa.maturityRatings && Object.keys(pa.maturityRatings).length > 0
                ) && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
                    Assessment
                  </span>
                )}
                {engagement.processAssessments.some(
                  (pa) => pa.transcriptIntelligence?.analyses?.length
                ) && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                    Transcripts
                  </span>
                )}
                {ctx.erp && (
                  <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-auto">
                    <Building2 className="h-3.5 w-3.5" />
                    {ctx.erp.length > 30 ? ctx.erp.slice(0, 30) + "..." : ctx.erp}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
