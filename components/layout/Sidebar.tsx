"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FUNCTIONS, findProcessById } from "@/types/function";
import { getAllEngagements, getEngagement } from "@/lib/storage/engagements";
import { Engagement } from "@/types/engagement";
import {
  Briefcase,
  Plus,
  DollarSign,
  TrendingUp,
  Microscope,
  Users,
  Scale,
  Compass,
  ArrowLeft,
  FileText,
  Lightbulb,
  ClipboardCheck,
  BarChart3,
  Wrench,
  ArrowLeftRight,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { LighthouseIcon } from "@/components/ui/lighthouse-icon";

const ICON_MAP: Record<string, any> = { // eslint-disable-line
  DollarSign,
  TrendingUp,
  Microscope,
  Users,
  Scale,
};

// ─── Brand Header (shared across all modes) ───
function BrandHeader() {
  return (
    <div className="px-4 py-4 border-b">
      <Link href="/" className="flex items-center gap-2.5">
        <LighthouseIcon size={28} className="text-gray-900" />
        <span className="text-lg font-bold tracking-tight text-gray-900">
          Lighthouse
        </span>
      </Link>
    </div>
  );
}

// ─── Cross-nav footer (jump between Explorer / Engagements) ───
function CrossNav({ current }: { current: "explorer" | "engagements" | "other" }) {
  return (
    <div className="border-t px-3 py-3 space-y-0.5">
      {current !== "explorer" && (
        <Link
          href="/explore"
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Compass className="h-3.5 w-3.5" />
          Explorer
        </Link>
      )}
      {current !== "engagements" && (
        <Link
          href="/engagements"
          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <Briefcase className="h-3.5 w-3.5" />
          Engagements
        </Link>
      )}
    </div>
  );
}

// ─── Shell wrapper ───
function SidebarShell({ children, footer }: { children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <aside className="w-56 bg-white border-r flex flex-col h-screen shrink-0">
      <BrandHeader />
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
      {footer}
    </aside>
  );
}

// ═══════════════════════════════════════════════
// Explorer Mode — /explore, /explore/*
// ═══════════════════════════════════════════════
function ExplorerSidebar({ pathname }: { pathname: string }) {
  return (
    <SidebarShell footer={<CrossNav current="explorer" />}>
      <div className="p-3">
        <div className="text-[10px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3 px-2">
          Explorer
        </div>
        <div className="space-y-0.5">
          {FUNCTIONS.map((func) => {
            const Icon = ICON_MAP[func.icon] || DollarSign;
            const hasLive = func.processes.some((p) => p.available);
            const isActive = pathname === `/explore/${func.id}` ||
              pathname.startsWith(`/explore/${func.id}/`);

            // Link to explore page with function context if live, otherwise just show
            return (
              <Link
                key={func.id}
                href={hasLive ? `/explore/${func.id}` : "/explore"}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#00B140] text-white font-medium"
                    : hasLive
                    ? "text-gray-700 hover:bg-gray-50"
                    : "text-gray-400"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{func.name}</span>
                {hasLive && (
                  <span
                    className={cn(
                      "ml-auto w-1.5 h-1.5 rounded-full",
                      isActive ? "bg-white/60" : "bg-[#00B140]"
                    )}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </SidebarShell>
  );
}

// ═══════════════════════════════════════════════
// Engagements List Mode — /engagements
// ═══════════════════════════════════════════════
function EngagementsListSidebar({ pathname }: { pathname: string }) {
  const [engagements, setEngagements] = useState<Engagement[]>([]);

  useEffect(() => {
    setEngagements(getAllEngagements());
  }, [pathname]);

  return (
    <SidebarShell footer={<CrossNav current="engagements" />}>
      <div className="p-3">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="text-[10px] font-semibold text-gray-400 tracking-[0.15em] uppercase">
            Engagements
          </div>
          <Link href="/engagements/new">
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {engagements.length === 0 ? (
          <p className="text-xs text-gray-400 px-2 py-2">No engagements yet</p>
        ) : (
          <div className="space-y-0.5">
            {engagements.map((engagement) => {
              const isActive = pathname.startsWith(`/engagements/${engagement.id}`);
              const processCount = engagement.processAssessments?.length || 0;

              return (
                <Link
                  key={engagement.id}
                  href={`/engagements/${engagement.id}`}
                  className={cn(
                    "block px-2 py-2 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-[#00B140] text-white"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <div className="flex items-start gap-2">
                    <Briefcase className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate text-[13px]">
                        {engagement.clientContext.companyName}
                      </div>
                      <div
                        className={cn(
                          "text-[11px]",
                          isActive ? "text-white/70" : "text-gray-400"
                        )}
                      >
                        {processCount} {processCount === 1 ? "process" : "processes"}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </SidebarShell>
  );
}

// ═══════════════════════════════════════════════
// Engagement Detail Mode — /engagements/[id]/*
// ═══════════════════════════════════════════════
function EngagementDetailSidebar({
  pathname,
  engagementId,
}: {
  pathname: string;
  engagementId: string;
}) {
  const [engagement, setEngagement] = useState<Engagement | null>(null);

  useEffect(() => {
    setEngagement(getEngagement(engagementId));

    const handler = () => setEngagement(getEngagement(engagementId));
    window.addEventListener("engagement-updated", handler);
    return () => window.removeEventListener("engagement-updated", handler);
  }, [engagementId]);

  const basePath = `/engagements/${engagementId}`;
  const processCount = engagement?.processAssessments?.length || 0;

  const subPages = [
    {
      label: "Inputs",
      href: basePath,
      icon: FileText,
      active: pathname === basePath,
    },
    {
      label: "Company Insights",
      href: `${basePath}/company-intel`,
      icon: Briefcase,
      active: pathname === `${basePath}/company-intel`,
    },
    {
      label: "Assessment",
      href: `${basePath}/assessment`,
      icon: ClipboardCheck,
      active: pathname === `${basePath}/assessment`,
    },
    {
      label: "Opportunity Areas",
      href: `${basePath}/hypothesis`,
      icon: Lightbulb,
      active: pathname === `${basePath}/hypothesis`,
    },
    {
      label: "Business Impact",
      href: `${basePath}/findings`,
      icon: BarChart3,
      active: pathname === `${basePath}/findings`,
    },
    {
      label: "Tool Recommendations",
      href: `${basePath}/tools`,
      icon: Wrench,
      active: pathname === `${basePath}/tools`,
    },
  ];

  return (
    <SidebarShell footer={<CrossNav current="other" />}>
      <div className="p-3">
        {/* Back to engagements */}
        <Link
          href="/engagements"
          className="flex items-center gap-1.5 px-2 py-1.5 mb-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          All Engagements
        </Link>

        {/* Company name */}
        <div className="px-2 mb-4">
          <div className="font-semibold text-gray-900 text-sm truncate">
            {engagement?.clientContext.companyName || "Loading..."}
          </div>
          {engagement?.clientContext.subSector && (
            <div className="text-[11px] text-gray-400 mt-0.5">
              {engagement.clientContext.subSector}
            </div>
          )}
          <div className="text-[11px] text-gray-400 mt-0.5">
            {processCount} {processCount === 1 ? "process" : "processes"}
          </div>
        </div>

        {/* Sub-page nav */}
        <div className="space-y-0.5">
          {subPages.map((page) => {
            const Icon = page.icon;
            return (
              <Link
                key={page.label}
                href={page.href}
                className={cn(
                  "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
                  page.active
                    ? "bg-[#00B140] text-white font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {page.label}
              </Link>
            );
          })}
        </div>
      </div>
    </SidebarShell>
  );
}

// ═══════════════════════════════════════════════
// Process Mode — /ap, /ar, /fpa, etc.
// ═══════════════════════════════════════════════
function ProcessSidebar({ pathname }: { pathname: string }) {
  // Extract process ID from pathname (e.g., "/ap" → "ap")
  const processId = pathname.split("/")[1];
  const match = findProcessById(processId);

  if (!match) return <ExplorerSidebar pathname={pathname} />;

  const { func } = match;
  const Icon = ICON_MAP[func.icon] || DollarSign;

  return (
    <SidebarShell footer={<CrossNav current="explorer" />}>
      <div className="p-3">
        {/* Back to explorer */}
        <Link
          href="/explore"
          className="flex items-center gap-1.5 px-2 py-1.5 mb-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Explorer
        </Link>

        {/* Current function */}
        <div className="flex items-center gap-2 px-2 mb-4">
          <Icon className="h-4 w-4 text-gray-900" />
          <span className="font-semibold text-sm text-gray-900">{func.name}</span>
        </div>

        {/* Sibling processes */}
        <div className="space-y-0.5">
          {func.processes.map((proc) => {
            const isActive = pathname === `/${proc.id}` || pathname.startsWith(`/${proc.id}/`);

            if (!proc.available) {
              return (
                <div
                  key={proc.id}
                  className="flex items-center gap-2.5 px-2 py-1.5 text-sm text-gray-400"
                >
                  <span>{proc.name}</span>
                  <span className="ml-auto text-[9px] italic text-gray-300">soon</span>
                </div>
              );
            }

            return (
              <Link
                key={proc.id}
                href={`/${proc.id}`}
                className={cn(
                  "block px-2 py-1.5 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-[#00B140] text-white font-medium"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {proc.name}
              </Link>
            );
          })}
        </div>
      </div>
    </SidebarShell>
  );
}

// ═══════════════════════════════════════════════
// Vendor Mode — /vendors/*
// ═══════════════════════════════════════════════
function VendorSidebar({ pathname }: { pathname: string }) {
  return (
    <SidebarShell footer={<CrossNav current="explorer" />}>
      <div className="p-3">
        {/* Back to explorer */}
        <Link
          href="/explore"
          className="flex items-center gap-1.5 px-2 py-1.5 mb-3 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft className="h-3 w-3" />
          Explorer
        </Link>

        {/* Compare link */}
        <Link
          href="/vendors/compare"
          className={cn(
            "flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors",
            pathname === "/vendors/compare"
              ? "bg-[#00B140] text-white font-medium"
              : "text-gray-600 hover:bg-gray-50"
          )}
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          Compare Vendors
        </Link>
      </div>
    </SidebarShell>
  );
}

// ═══════════════════════════════════════════════
// Main Sidebar — route dispatcher
// ═══════════════════════════════════════════════
export function Sidebar() {
  const pathname = usePathname();

  // Homepage — no sidebar
  if (pathname === "/") {
    return null;
  }

  // Engagement detail — /engagements/[id] or /engagements/[id]/*
  const engagementMatch = pathname.match(/^\/engagements\/([^/]+)/);
  if (engagementMatch && engagementMatch[1] !== "new") {
    return (
      <EngagementDetailSidebar
        pathname={pathname}
        engagementId={engagementMatch[1]}
      />
    );
  }

  // Engagements list — /engagements or /engagements/new
  if (pathname === "/engagements" || pathname === "/engagements/new") {
    return <EngagementsListSidebar pathname={pathname} />;
  }

  // Explorer — /explore or /explore/*
  if (pathname === "/explore" || pathname.startsWith("/explore/")) {
    return <ExplorerSidebar pathname={pathname} />;
  }

  // Vendors — /vendors/*
  if (pathname.startsWith("/vendors")) {
    return <VendorSidebar pathname={pathname} />;
  }

  // Process pages — /ap, /ar, /fpa, etc.
  // Check if the first segment matches a known process ID
  const firstSegment = pathname.split("/")[1];
  if (firstSegment && findProcessById(firstSegment)) {
    return <ProcessSidebar pathname={pathname} />;
  }

  // Fallback — show explorer sidebar for unknown routes
  return <ExplorerSidebar pathname={pathname} />;
}
