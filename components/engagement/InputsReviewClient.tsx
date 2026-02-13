"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { FUNCTIONS } from "@/types/function";
import {
  PROCESS_QUESTIONS,
  DEFAULT_PROCESS_QUESTIONS,
} from "@/lib/data/process-questions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditCompanyDialog } from "@/components/engagement/EditCompanyDialog";
import { EditProcessContextDialog } from "@/components/engagement/EditProcessContextDialog";
import { ClientContext } from "@/types/engagement";
import { Pencil, Building2, Users, TrendingUp, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";
// Well-known company name → domain overrides
const DOMAIN_MAP: Record<string, string> = {
  "datadog": "datadoghq.com",
  "salesforce": "salesforce.com",
  "servicenow": "servicenow.com",
  "meta": "meta.com",
  "alphabet": "google.com",
  "microsoft": "microsoft.com",
};

function guessDomain(name: string): string {
  // Normalize: "Acme Corp" → "acme", "DataDog Inc." → "datadog"
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
      <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
        <span className="text-lg font-semibold text-primary">{initials}</span>
      </div>
    );
  }

  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={logoUrl}
      alt={`${name} logo`}
      width={56}
      height={56}
      className="h-14 w-14 rounded-xl object-contain bg-white border p-1.5 shrink-0"
      onError={() => setImgError(true)}
      onLoad={(e) => {
        // Google returns a tiny default globe for unknown domains
        const img = e.currentTarget;
        if (img.naturalWidth <= 16) setImgError(true);
      }}
    />
  );
}

interface InputsReviewClientProps {
  engagementId: string;
}

export function InputsReviewClient({ engagementId }: InputsReviewClientProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editingProcess, setEditingProcess] = useState<{
    processId: string;
    processName: string;
    context: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
  }, [engagementId, router]);

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

  const handleUpdateProcessContext = (
    processId: string,
    context: Record<string, string>
  ) => {
    if (!engagement) return;
    const updatedEngagement = {
      ...engagement,
      processAssessments: engagement.processAssessments.map((pa) =>
        pa.processId === processId ? { ...pa, context } : pa
      ),
      updatedAt: new Date().toISOString(),
    };
    saveEngagement(updatedEngagement);
    setEngagement(updatedEngagement);
    window.dispatchEvent(new Event("engagement-updated"));
  };

  if (!engagement) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  const ctx = engagement.clientContext;
  const func = FUNCTIONS.find((f) => f.id === ctx.functionId);

  // Build attribute pills for the company
  const companyPills: { label: string; icon?: React.ElementType }[] = [];
  if (ctx.isPublic) {
    companyPills.push({ label: ctx.tickerSymbol ? `Public (${ctx.tickerSymbol})` : "Public", icon: Building2 });
  } else {
    companyPills.push({ label: "Private", icon: Building2 });
  }
  if (ctx.subSector) companyPills.push({ label: ctx.subSector });
  else if (ctx.industry) companyPills.push({ label: ctx.industry });
  companyPills.push({ label: ctx.companySize === "smb" ? "SMB" : ctx.companySize.charAt(0).toUpperCase() + ctx.companySize.slice(1) });
  if (!ctx.isPublic && ctx.revenue) companyPills.push({ label: ctx.revenue, icon: DollarSign });
  if (!ctx.isPublic && ctx.revenueGrowth) companyPills.push({ label: `${ctx.revenueGrowth} YoY`, icon: TrendingUp });
  if (!ctx.isPublic && ctx.headcount) companyPills.push({ label: `${ctx.headcount} people`, icon: Users });

  return (
    <div className="space-y-8">
      {/* ── Company Hero ── */}
      <div className="relative rounded-xl border bg-gradient-to-br from-card to-muted/30 p-6 sm:p-8">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowEditCompany(true)}
          className="absolute top-4 right-4 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit
        </Button>

        <div className="flex items-start gap-4 mb-4">
          <CompanyLogo name={ctx.companyName} />
          <div>
            <p className="text-xs font-medium text-muted-foreground tracking-wider uppercase mb-1">
              {func?.name || "Assessment"}
            </p>
            <h2 className="text-2xl sm:text-3xl font-light tracking-wide">
              {ctx.companyName}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {companyPills.map((pill, i) => {
            const Icon = pill.icon;
            return (
              <Badge
                key={i}
                variant="secondary"
                className="px-3 py-1 text-xs font-normal gap-1.5"
              >
                {Icon && <Icon className="h-3 w-3" />}
                {pill.label}
              </Badge>
            );
          })}
        </div>

        {ctx.characteristics && (
          <p className="mt-4 text-sm text-muted-foreground border-t pt-4 leading-relaxed">
            {ctx.characteristics}
          </p>
        )}
      </div>

      {/* ── Process Scope ── */}
      <div>
        <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-3">
          Scope — {engagement.processAssessments.length} Process{engagement.processAssessments.length !== 1 ? "es" : ""}
        </h3>

        <div className="space-y-3">
          {engagement.processAssessments.map((pa) => {
            const questions =
              PROCESS_QUESTIONS[pa.processId] || DEFAULT_PROCESS_QUESTIONS;
            const context = pa.context || {};

            // Pull out key highlights as inline chips
            const highlights: { label: string; value: string }[] = [];
            for (const q of questions) {
              const val = context[q.key];
              if (!val?.trim()) continue;
              if (q.key === "painPoints") continue; // show separately
              highlights.push({ label: q.label, value: val });
            }
            const painPoints = context["painPoints"]?.trim();

            return (
              <Card key={pa.processId} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-5 py-4">
                    <h4 className="font-medium">{pa.processName}</h4>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground"
                      onClick={() =>
                        setEditingProcess({
                          processId: pa.processId,
                          processName: pa.processName,
                          context: context,
                        })
                      }
                    >
                      <Pencil className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  </div>

                  {highlights.length > 0 && (
                    <div className="px-5 pb-4 flex flex-wrap gap-x-5 gap-y-2">
                      {highlights.map((h) => (
                        <div key={h.label} className="flex items-baseline gap-1.5">
                          <span className="text-[11px] text-muted-foreground">{h.label}:</span>
                          <span className="text-sm font-medium">{h.value}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {painPoints && (
                    <div className="px-5 pb-4 border-t pt-3">
                      <p className="text-xs text-muted-foreground mb-1">Pain Points</p>
                      <p className="text-sm leading-relaxed">{painPoints}</p>
                    </div>
                  )}

                  {highlights.length === 0 && !painPoints && (
                    <div className="px-5 pb-4">
                      <p className="text-xs text-muted-foreground italic">
                        No details provided — click Edit to add context
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Next step nudge ── */}
      <Link href={`/engagements/${engagementId}/company-intel`}>
        <Card className="group border-dashed hover:border-primary/30 hover:bg-primary/[0.02] transition-colors cursor-pointer">
          <CardContent className="py-5 flex items-center justify-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors">
            Continue to Company Insights
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </CardContent>
        </Card>
      </Link>

      {/* ── Dialogs ── */}
      <EditCompanyDialog
        open={showEditCompany}
        onOpenChange={setShowEditCompany}
        clientContext={engagement.clientContext}
        onSave={handleUpdateClientContext}
      />

      {editingProcess && (
        <EditProcessContextDialog
          open={!!editingProcess}
          onOpenChange={(open) => {
            if (!open) setEditingProcess(null);
          }}
          processId={editingProcess.processId}
          processName={editingProcess.processName}
          context={editingProcess.context}
          onSave={handleUpdateProcessContext}
        />
      )}
    </div>
  );
}
