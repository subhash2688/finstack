"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Engagement, ClientContext } from "@/types/engagement";
import { FinancialProfile, PeerComparisonSet } from "@/types/diagnostic";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { resolveCompanyIntelTemplate } from "@/lib/data/company-intel-templates";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import { FUNCTIONS } from "@/types/function";
import { EngagementStepper, StepDef } from "@/components/engagement/EngagementStepper";
import { CompanyBriefRail } from "@/components/engagement/CompanyBriefRail";
import { CompanyBriefDrawer } from "@/components/engagement/CompanyBriefDrawer";
import { EditCompanyDialog } from "@/components/engagement/EditCompanyDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Download } from "lucide-react";
import { LighthouseIcon } from "@/components/ui/lighthouse-icon";
import { ExportDeckDialog } from "@/components/engagement/ExportDeckDialog";
import Link from "next/link";

interface EngagementLayoutClientProps {
  engagementId: string;
  children: React.ReactNode;
}

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

function CompanyLogo({ name }: { name: string }) {
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
      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-xs font-bold text-primary">{initials}</span>
      </div>
    );
  }

  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={logoUrl}
      alt=""
      width={36}
      height={36}
      className="h-9 w-9 rounded-lg object-contain bg-white border p-0.5 shrink-0"
      onError={() => setImgError(true)}
      onLoad={(e) => {
        const img = e.currentTarget;
        if (img.naturalWidth <= 16) setImgError(true);
      }}
    />
  );
}

function computeAssessmentBadge(engagement: Engagement): string {
  const total = engagement.processAssessments.length;
  if (total === 0) return "0 processes";
  const complete = engagement.processAssessments.filter((pa) => {
    const ratedCount = pa.maturityRatings
      ? Object.keys(pa.maturityRatings).length
      : 0;
    const workflow = getWorkflow(pa.processId as WorkflowId);
    const totalSteps =
      pa.generatedWorkflow?.length || workflow?.steps.length || 0;
    return ratedCount >= totalSteps && totalSteps > 0;
  }).length;
  return `${complete}/${total} assessed`;
}

function hasAnyCompleteAssessment(engagement: Engagement): boolean {
  return engagement.processAssessments.some((pa) => {
    const ratedCount = pa.maturityRatings
      ? Object.keys(pa.maturityRatings).length
      : 0;
    const workflow = getWorkflow(pa.processId as WorkflowId);
    const totalSteps =
      pa.generatedWorkflow?.length || workflow?.steps.length || 0;
    return ratedCount >= totalSteps && totalSteps > 0;
  });
}

export function EngagementLayoutClient({
  engagementId,
  children,
}: EngagementLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [railCollapsed, setRailCollapsed] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [showExportDeck, setShowExportDeck] = useState(false);

  const loadEngagement = () => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
  };

  // Eagerly fetch EDGAR data (fast via Turso) on mount for public companies.
  // This populates the right rail immediately without waiting for user to open Full Brief.
  // Slow AI data (commentary, leadership) stays lazy — loaded on Full Brief click.
  const eagerFetchEdgar = async (eng: Engagement) => {
    const ctx = eng.clientContext;
    if (!ctx.isPublic || !ctx.tickerSymbol) return;

    // Skip if we already have fresh EDGAR financials
    if (eng.companyIntel?.financialProfile?.source === "edgar" && eng.companyIntel?.financialProfile?.balanceSheet) return;

    const ticker = ctx.tickerSymbol;

    try {
      // Fetch financials first (instant via Turso)
      const finRes = await fetch(`/api/edgar/financials?ticker=${encodeURIComponent(ticker)}`);
      if (!finRes.ok) return;
      const financialProfile: FinancialProfile = await finRes.json();

      const targetRevenue = financialProfile.yearlyData?.[0]?.revenue;

      // Fetch peers in parallel (also instant via Turso)
      const peersRes = await fetch(`/api/edgar/peers?ticker=${encodeURIComponent(ticker)}${targetRevenue ? `&revenue=${targetRevenue}` : ""}`);
      let peerComparison: PeerComparisonSet | undefined;
      if (peersRes.ok) {
        const peersData = await peersRes.json();
        peerComparison = {
          targetTicker: ticker,
          peers: peersData.peers || [],
          generatedAt: new Date().toISOString(),
          competitorSource: "SIC" as const,
        };
      }

      // Build headcount from EDGAR employee data
      const template = resolveCompanyIntelTemplate(ctx.industry, ctx.companySize);
      const headcount = { ...template.headcount };
      if (financialProfile.employeeCount) {
        headcount.total = financialProfile.employeeCount;
        headcount.totalFormatted = financialProfile.employeeCount.toLocaleString();
        if (financialProfile.revenuePerEmployee) {
          headcount.revenuePerEmployee = `$${Math.round(financialProfile.revenuePerEmployee)}K`;
        }
        headcount.insight = `${financialProfile.employeeCount.toLocaleString()} employees reported in most recent SEC 10-K filing.`;
      }

      // Merge into existing companyIntel (preserve any commentary/leadership already cached)
      const current = getEngagement(eng.id);
      if (!current) return;

      const updated: Engagement = {
        ...current,
        companyIntel: {
          ...current.companyIntel,
          confidenceLevel: "high",
          confidenceReason: `Financial data from SEC EDGAR 10-K filings (${ticker})`,
          financialProfile,
          headcount,
          peerComparison: current.companyIntel?.peerComparison || peerComparison,
          generatedAt: current.companyIntel?.generatedAt || new Date().toISOString(),
        },
        updatedAt: new Date().toISOString(),
      };

      saveEngagement(updated);
      setEngagement(updated);
      window.dispatchEvent(new Event("engagement-updated"));
    } catch (err) {
      console.warn("Eager EDGAR fetch failed (non-blocking):", err);
    }
  };

  useEffect(() => {
    loadEngagement();
    const handler = () => loadEngagement();
    window.addEventListener("engagement-updated", handler);
    return () => window.removeEventListener("engagement-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId]);

  // Trigger eager EDGAR fetch once engagement is loaded
  useEffect(() => {
    if (engagement) {
      eagerFetchEdgar(engagement);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagement?.id]);

  const handleUpdateClientContext = (updated: ClientContext) => {
    if (!engagement) return;
    const updatedEngagement = {
      ...engagement,
      clientContext: updated,
      updatedAt: new Date().toISOString(),
    };
    saveEngagement(updatedEngagement);
    setEngagement(updatedEngagement);
    window.dispatchEvent(new Event("engagement-updated"));
  };

  if (!engagement) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const ctx = engagement.clientContext;
  const func = FUNCTIONS.find((f) => f.id === ctx.functionId);

  // Determine active step from pathname
  const isIntake = pathname === `/engagements/${engagementId}`;
  const isHypothesis = pathname === `/engagements/${engagementId}/hypothesis`;
  const isAssessment = pathname === `/engagements/${engagementId}/assessment`;
  const isOpportunities = pathname === `/engagements/${engagementId}/opportunities`
    || pathname === `/engagements/${engagementId}/findings`;
  const isTechnology = pathname === `/engagements/${engagementId}/technology`
    || pathname === `/engagements/${engagementId}/tools`;

  const hasDiagnostic = !!engagement.diagnostic;
  const hasComplete = hasAnyCompleteAssessment(engagement);
  const assessmentBadge = computeAssessmentBadge(engagement);

  // Build pills for header
  const pills: string[] = [];
  if (ctx.isPublic && ctx.tickerSymbol) pills.push(ctx.tickerSymbol);
  if (ctx.subSector) pills.push(ctx.subSector);
  else if (ctx.industry) pills.push(ctx.industry);
  if (func?.name) pills.push(func.name);

  const steps: StepDef[] = [
    {
      id: "intake",
      label: "Intake",
      shortLabel: "Intake",
      href: `/engagements/${engagementId}`,
      status: isIntake ? "active" : "completed",
    },
    {
      id: "hypothesis",
      label: "Hypothesis",
      shortLabel: "Hypo",
      href: `/engagements/${engagementId}/hypothesis`,
      status: isHypothesis
        ? "active"
        : hasDiagnostic
        ? "completed"
        : "available",
    },
    {
      id: "assessment",
      label: "Assessment",
      shortLabel: "Assess",
      href: `/engagements/${engagementId}/assessment`,
      status: isAssessment
        ? "active"
        : hasComplete
        ? "completed"
        : "available",
      badge: assessmentBadge,
    },
    {
      id: "opportunities",
      label: "Opportunities",
      shortLabel: "Opps",
      href: hasComplete ? `/engagements/${engagementId}/opportunities` : undefined,
      status: isOpportunities
        ? "active"
        : hasComplete
        ? "available"
        : "disabled",
    },
    {
      id: "technology",
      label: "Technology",
      shortLabel: "Tech",
      href: hasComplete ? `/engagements/${engagementId}/technology` : undefined,
      status: isTechnology
        ? "active"
        : hasComplete
        ? "available"
        : "disabled",
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-1rem)]">
      {/* Top chrome: merged header + stepper */}
      <div className="px-4 pt-4 pb-0 shrink-0">
        {/* Merged breadcrumb with company identity */}
        <div className="max-w-[1400px] mx-auto flex items-center gap-4 mb-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <LighthouseIcon size={32} className="text-gray-900" />
            <span className="text-lg font-bold tracking-tight text-gray-900">Lighthouse</span>
          </Link>
          <span className="text-xl text-muted-foreground/25">/</span>
          <Link href="/engagements" className="text-base text-muted-foreground hover:text-foreground transition-colors">
            Engagements
          </Link>
          <span className="text-xl text-muted-foreground/25">/</span>
          <CompanyLogo name={ctx.companyName} />
          <h1 className="text-xl font-semibold truncate max-w-sm">
            {ctx.companyName}
          </h1>
          <div className="flex items-center gap-2">
            {pills.map((pill) => (
              <Badge
                key={pill}
                variant="secondary"
                className="px-2.5 py-0.5 text-xs font-medium"
              >
                {pill}
              </Badge>
            ))}
          </div>
          <button
            onClick={() => setShowEditCompany(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 ml-1"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            onClick={() => setShowExportDeck(true)}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 ml-1"
          >
            <Download className="h-3.5 w-3.5" />
            Export Deck
          </button>
        </div>

        {/* Stepper */}
        <div className="max-w-[1400px] mx-auto">
          <EngagementStepper steps={steps} />
        </div>
      </div>

      {/* Main content area: page + right rail */}
      <div className="flex flex-1 min-h-0 max-w-[1400px] mx-auto w-full">
        {/* Page content — scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto px-4 py-6">
          {children}
        </div>

        {/* Company Brief right rail */}
        <CompanyBriefRail
          engagement={engagement}
          collapsed={railCollapsed}
          onToggle={() => setRailCollapsed((c) => !c)}
          onOpenFull={() => setDrawerOpen(true)}
        />
      </div>

      {/* Full Company Brief drawer */}
      <CompanyBriefDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        engagementId={engagementId}
      />

      {/* Edit company dialog */}
      <EditCompanyDialog
        open={showEditCompany}
        onOpenChange={setShowEditCompany}
        clientContext={ctx}
        onSave={handleUpdateClientContext}
      />

      {/* Export deck dialog */}
      <ExportDeckDialog
        open={showExportDeck}
        onOpenChange={setShowExportDeck}
        engagement={engagement}
      />
    </div>
  );
}
