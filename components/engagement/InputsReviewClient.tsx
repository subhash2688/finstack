"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import {
  PROCESS_QUESTIONS,
  DEFAULT_PROCESS_QUESTIONS,
} from "@/lib/data/process-questions";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EditProcessContextDialog } from "@/components/engagement/EditProcessContextDialog";
import {
  Pencil,
  FileText,
  Sparkles,
  ListChecks,
  CircleDot,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

interface InputsReviewClientProps {
  engagementId: string;
}

export function InputsReviewClient({ engagementId }: InputsReviewClientProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
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

    const handler = () => {
      const updated = getEngagement(engagementId);
      if (updated) setEngagement(updated);
    };
    window.addEventListener("engagement-updated", handler);
    return () => window.removeEventListener("engagement-updated", handler);
  }, [engagementId, router]);

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
    return (
      <div className="text-center py-12 text-muted-foreground">Loading...</div>
    );
  }

  const ctx = engagement.clientContext;
  const hasDiagnostic = !!engagement.diagnostic;
  const hasIntel = !!engagement.companyIntel;
  const hasTranscripts = (engagement.pendingTranscripts?.length || 0) > 0;
  const hasAnalyzedTranscripts = engagement.processAssessments.some(
    (pa) => pa.transcriptIntelligence?.analyses?.length
  );

  // Compute assessment progress
  const totalProcesses = engagement.processAssessments.length;
  const assessedProcesses = engagement.processAssessments.filter((pa) => {
    const ratedCount = pa.maturityRatings
      ? Object.keys(pa.maturityRatings).length
      : 0;
    const workflow = getWorkflow(pa.processId as WorkflowId);
    const totalSteps =
      pa.generatedWorkflow?.length || workflow?.steps.length || 0;
    return ratedCount >= totalSteps && totalSteps > 0;
  }).length;

  // Total workflow steps across all processes
  const totalSteps = engagement.processAssessments.reduce((sum, pa) => {
    const workflow = getWorkflow(pa.processId as WorkflowId);
    return sum + (pa.generatedWorkflow?.length || workflow?.steps.length || 0);
  }, 0);

  // Readiness checklist
  const readinessItems = [
    {
      label: "Company profile",
      done: true,
      detail: ctx.companyName,
    },
    {
      label: "Processes selected",
      done: totalProcesses > 0,
      detail: `${totalProcesses} process${totalProcesses !== 1 ? "es" : ""}, ${totalSteps} steps`,
    },
    {
      label: "Company intelligence",
      done: hasIntel,
      detail: hasIntel ? "EDGAR data loaded" : "Open Company Brief to fetch",
    },
    {
      label: "AI hypothesis",
      done: hasDiagnostic,
      detail: hasDiagnostic ? "Generated" : "Go to Hypothesis step",
    },
    {
      label: "Transcript insights",
      done: hasAnalyzedTranscripts,
      detail: hasTranscripts
        ? `${engagement.pendingTranscripts!.length} pending`
        : hasAnalyzedTranscripts
        ? "Analyzed"
        : "None uploaded",
    },
  ];
  const readinessPct = Math.round(
    (readinessItems.filter((r) => r.done).length / readinessItems.length) * 100
  );

  return (
    <div className="space-y-6">
      {/* ── Two-column: Process scope + Readiness ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Process Scope — 2/3 width */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground flex items-center gap-2">
            <ListChecks className="h-3.5 w-3.5" />
            Scope — {totalProcesses} Process{totalProcesses !== 1 ? "es" : ""} · {totalSteps} Steps
          </h3>

          {engagement.processAssessments.map((pa) => {
            const questions =
              PROCESS_QUESTIONS[pa.processId] || DEFAULT_PROCESS_QUESTIONS;
            const context = pa.context || {};
            const workflow = getWorkflow(pa.processId as WorkflowId);
            const stepCount =
              pa.generatedWorkflow?.length || workflow?.steps.length || 0;
            const ratedCount = pa.maturityRatings
              ? Object.keys(pa.maturityRatings).length
              : 0;
            const isAssessed = ratedCount >= stepCount && stepCount > 0;

            const highlights: { label: string; value: string }[] = [];
            for (const q of questions) {
              const val = context[q.key];
              if (!val?.trim()) continue;
              if (q.key === "painPoints" || q.key === "consultantNotes")
                continue;
              highlights.push({ label: q.label, value: val });
            }
            const painPoints = context["painPoints"]?.trim();
            const notes = context["consultantNotes"]?.trim();

            return (
              <Card key={pa.processId} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <h4 className="font-medium text-sm">{pa.processName}</h4>
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 h-5 font-normal"
                      >
                        {stepCount} steps
                      </Badge>
                      {isAssessed && (
                        <Badge className="text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-700 border-emerald-200 font-normal">
                          Assessed
                        </Badge>
                      )}
                      {!isAssessed && ratedCount > 0 && (
                        <Badge className="text-[10px] px-1.5 py-0 h-5 bg-amber-100 text-amber-700 border-amber-200 font-normal">
                          {ratedCount}/{stepCount} rated
                        </Badge>
                      )}
                    </div>
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
                    <div className="px-4 pb-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {highlights.map((h) => (
                        <div
                          key={h.label}
                          className="flex items-baseline gap-1.5"
                        >
                          <span className="text-[10px] text-muted-foreground">
                            {h.label}:
                          </span>
                          <span className="text-[13px] font-medium">
                            {h.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {painPoints && (
                    <div className="px-4 pb-3 border-t pt-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        Pain Points
                      </p>
                      <p className="text-[13px] leading-relaxed">
                        {painPoints}
                      </p>
                    </div>
                  )}

                  {notes && (
                    <div className="px-4 pb-3 border-t pt-2.5">
                      <p className="text-[10px] text-muted-foreground mb-0.5">
                        Consultant Notes
                      </p>
                      <p className="text-[13px] leading-relaxed text-muted-foreground">
                        {notes}
                      </p>
                    </div>
                  )}

                  {highlights.length === 0 && !painPoints && !notes && (
                    <div className="px-4 pb-3">
                      <p className="text-[11px] text-muted-foreground italic">
                        No details provided — click Edit to add context
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Engagement Readiness — 1/3 width */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Engagement Readiness
              </h3>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-[11px] text-muted-foreground">
                    {readinessItems.filter((r) => r.done).length} of{" "}
                    {readinessItems.length} complete
                  </span>
                  <span className="text-xs font-semibold">{readinessPct}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${readinessPct}%` }}
                  />
                </div>
              </div>

              {/* Checklist */}
              <div className="space-y-2">
                {readinessItems.map((item) => (
                  <div key={item.label} className="flex items-start gap-2">
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <CircleDot className="h-4 w-4 text-gray-300 shrink-0 mt-0.5" />
                    )}
                    <div className="min-w-0">
                      <p
                        className={`text-[12px] font-medium ${item.done ? "text-foreground" : "text-muted-foreground"}`}
                      >
                        {item.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {item.detail}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-3">
                Next Steps
              </h3>
              <div className="space-y-2">
                {!hasDiagnostic && (
                  <Link href={`/engagements/${engagementId}/hypothesis`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-9 text-[12px]"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      Generate Hypothesis
                    </Button>
                  </Link>
                )}
                <Link href={`/engagements/${engagementId}/assessment`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-2 h-9 text-[12px]"
                  >
                    <ListChecks className="h-3.5 w-3.5 text-primary" />
                    {assessedProcesses > 0
                      ? `Continue Assessment (${assessedProcesses}/${totalProcesses})`
                      : "Start Assessment"}
                  </Button>
                </Link>
                {hasDiagnostic && (
                  <Link href={`/engagements/${engagementId}/hypothesis`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start gap-2 h-9 text-[12px]"
                    >
                      <FileText className="h-3.5 w-3.5 text-primary" />
                      View Hypothesis
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Dialogs ── */}
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
