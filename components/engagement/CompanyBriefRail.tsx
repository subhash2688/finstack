"use client";

import { Engagement } from "@/types/engagement";
import { Button } from "@/components/ui/button";
import {
  Building2,
  ChevronRight,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";

interface CompanyBriefRailProps {
  engagement: Engagement;
  collapsed: boolean;
  onToggle: () => void;
  onOpenFull: () => void;
}

// Revenue/expenses stored in $M from EDGAR extraction
function fmtM(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (Math.abs(n) >= 1000) return `$${(n / 1000).toFixed(1)}B`;
  return `$${Math.round(n)}M`;
}

// Margins stored as percentages (79.8 = 79.8%) from EDGAR extraction
function pct(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${n.toFixed(1)}%`;
}

// Revenue per employee stored in raw dollars
function fmtDollar(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (Math.abs(n) >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function days(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return `${Math.round(n)} days`;
}

function ratio(n: number | undefined): string {
  if (n === undefined || n === null) return "—";
  return n.toFixed(2);
}

// ── Collapsed state: thin vertical strip ──
function CollapsedRail({
  companyName,
  onToggle,
}: {
  companyName: string;
  onToggle: () => void;
}) {
  const initials = companyName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-10 border-l bg-gray-50/80 flex flex-col items-center py-3 gap-3 shrink-0">
      <button
        onClick={onToggle}
        className="h-8 w-8 rounded-lg bg-white border flex items-center justify-center hover:bg-gray-100 transition-colors"
        title="Expand Company Brief"
      >
        <PanelRightOpen className="h-3.5 w-3.5 text-gray-500" />
      </button>
      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <span className="text-[10px] font-bold text-primary">{initials}</span>
      </div>
      <div className="flex-1 flex items-center">
        <span
          className="text-[10px] font-medium text-gray-400 writing-mode-vertical"
          style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
        >
          Company Brief
        </span>
      </div>
    </div>
  );
}

// ── Metric row ──
function MetricRow({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex justify-between items-baseline py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <div className="text-right">
        <span className="text-[12px] font-semibold">{value}</span>
        {sub && (
          <span className="text-[10px] text-muted-foreground ml-1">{sub}</span>
        )}
      </div>
    </div>
  );
}

// ── Section header ──
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-1.5 first:mt-0">
      {title}
    </div>
  );
}

export function CompanyBriefRail({
  engagement,
  collapsed,
  onToggle,
  onOpenFull,
}: CompanyBriefRailProps) {
  const ctx = engagement.clientContext;
  const intel = engagement.companyIntel;
  const fp = intel?.financialProfile;
  const latestYear = fp?.yearlyData?.[0];
  const dm = fp?.derivedMetrics;
  const hc = intel?.headcount;

  if (collapsed) {
    return <CollapsedRail companyName={ctx.companyName} onToggle={onToggle} />;
  }

  const initials = ctx.companyName
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const hasEdgar = fp?.source === "edgar" && latestYear;

  return (
    <div className="w-[280px] border-l bg-gray-50/80 flex flex-col shrink-0 overflow-hidden">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {/* Company header */}
        <div className="flex items-center gap-2.5 mb-3 pb-3 border-b">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-primary">{initials}</span>
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold truncate">{ctx.companyName}</div>
            <div className="text-[11px] text-muted-foreground">
              {ctx.isPublic && ctx.tickerSymbol
                ? `${ctx.tickerSymbol}`
                : "Private"}
              {ctx.subSector && ` · ${ctx.subSector}`}
            </div>
          </div>
        </div>

        {/* ── Financials (EDGAR) ── */}
        {hasEdgar ? (
          <>
            <SectionHeader title="Financials" />
            <MetricRow
              label="Revenue"
              value={fmtM(latestYear.revenue)}
              sub={
                latestYear.revenueGrowth !== undefined
                  ? `${latestYear.revenueGrowth > 0 ? "+" : ""}${Math.round(latestYear.revenueGrowth)}% YoY`
                  : undefined
              }
            />
            {latestYear.grossMargin !== undefined && (
              <MetricRow label="Gross Margin" value={pct(latestYear.grossMargin)} />
            )}
            {latestYear.operatingMargin !== undefined && (
              <MetricRow label="Op. Margin" value={pct(latestYear.operatingMargin)} />
            )}
            {latestYear.expenses && latestYear.expenses.length > 0 && (
              <>
                {latestYear.expenses
                  .filter((e) => e.asPercentOfRevenue !== undefined && ["G&A", "R&D", "S&M"].includes(e.category))
                  .slice(0, 3)
                  .map((e) => (
                    <MetricRow
                      key={e.category}
                      label={`${e.category} % Rev`}
                      value={pct(e.asPercentOfRevenue)}
                    />
                  ))}
              </>
            )}
          </>
        ) : (
          <>
            {/* Private company — show what we have */}
            {(ctx.revenue || ctx.revenueGrowth || ctx.headcount) && (
              <>
                <SectionHeader title="Profile" />
                {ctx.revenue && <MetricRow label="Revenue" value={ctx.revenue} />}
                {ctx.revenueGrowth && (
                  <MetricRow label="Growth" value={`${ctx.revenueGrowth} YoY`} />
                )}
                {ctx.headcount && (
                  <MetricRow label="Headcount" value={ctx.headcount} />
                )}
              </>
            )}
          </>
        )}

        {/* ── Company ── */}
        {(fp?.employeeCount || hc?.totalFormatted) && (
          <>
            <SectionHeader title="Company" />
            {(fp?.employeeCount || hc?.totalFormatted) && (
              <MetricRow
                label="Headcount"
                value={
                  fp?.employeeCount
                    ? `~${fp.employeeCount.toLocaleString()}`
                    : hc?.totalFormatted || "—"
                }
              />
            )}
            {fp?.revenuePerEmployee && (
              <MetricRow
                label="Rev / Employee"
                value={`$${fp.revenuePerEmployee}K`}
              />
            )}
          </>
        )}

        {/* ── Working Capital ── */}
        {dm && (dm.dso || dm.dpo || dm.currentRatio || dm.debtToEquity) && (
          <>
            <SectionHeader title="Efficiency" />
            {dm.dso !== undefined && <MetricRow label="DSO" value={days(dm.dso)} />}
            {dm.dpo !== undefined && <MetricRow label="DPO" value={days(dm.dpo)} />}
            {dm.currentRatio !== undefined && (
              <MetricRow label="Current Ratio" value={ratio(dm.currentRatio)} />
            )}
            {dm.debtToEquity !== undefined && (
              <MetricRow label="Debt / Equity" value={ratio(dm.debtToEquity)} />
            )}
          </>
        )}

        {/* ── Key Insight ── */}
        {fp?.keyInsight && (
          <>
            <SectionHeader title="Key Insight" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {fp.keyInsight}
            </p>
          </>
        )}

        {/* ── No data yet ── */}
        {!hasEdgar && !ctx.revenue && !ctx.headcount && (
          <div className="text-center py-6">
            <Building2 className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-[11px] text-muted-foreground">
              No company data yet.
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Open the full brief to fetch EDGAR data.
            </p>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="px-3 py-2.5 border-t bg-white space-y-1.5">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-[11px] h-8 gap-1.5 font-semibold text-primary border-primary/30 hover:bg-primary/5"
          onClick={onOpenFull}
        >
          View Full Brief
          <ChevronRight className="h-3 w-3" />
        </Button>
        <button
          className="w-full text-[10px] text-muted-foreground hover:text-foreground transition-colors py-1 flex items-center justify-center gap-1"
          onClick={onToggle}
        >
          <PanelRightClose className="h-3 w-3" />
          Collapse
        </button>
      </div>
    </div>
  );
}
