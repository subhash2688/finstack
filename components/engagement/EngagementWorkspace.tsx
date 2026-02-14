"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { FUNCTIONS } from "@/types/function";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import {
  calculateProcessFindings,
} from "@/lib/calculators/savings-calculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Pencil, ChevronRight, BarChart3, FileText, Loader2 } from "lucide-react";
import Link from "next/link";
import { EditCompanyDialog } from "@/components/engagement/EditCompanyDialog";
import { EditProcessContextDialog } from "@/components/engagement/EditProcessContextDialog";
import { ClientContext } from "@/types/engagement";
import { TranscriptAnalysis, TranscriptReviewDecision } from "@/types/transcript";
import { MaturityLevel } from "@/types/workflow";
import { updateTranscriptIntelligence, updateMaturityRatings } from "@/lib/storage/engagements";
import { TranscriptUploadPanel, PendingTranscript } from "@/components/engagement/TranscriptUploadPanel";
import { TranscriptCoverageBar } from "@/components/engagement/TranscriptCoverageBar";
import { TranscriptReviewDialog } from "@/components/engagement/TranscriptReviewDialog";

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${Math.round(value / 1000)}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
}

interface EngagementWorkspaceProps {
  engagementId: string;
}

export function EngagementWorkspace({ engagementId }: EngagementWorkspaceProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editingProcess, setEditingProcess] = useState<{
    processId: string;
    processName: string;
    context: Record<string, string>;
  } | null>(null);

  // Transcript intelligence state
  const [transcripts, setTranscripts] = useState<PendingTranscript[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [reviewingAnalysis, setReviewingAnalysis] = useState<{
    analysis: TranscriptAnalysis;
    processId: string;
  } | null>(null);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
    // Load any pending transcripts from the engagement
    if (loaded.pendingTranscripts?.length) {
      setTranscripts(loaded.pendingTranscripts);
    }
  }, [engagementId, router]);

  // Compute findings for savings preview
  const allFindings = useMemo(() => {
    if (!engagement) return [];
    return engagement.processAssessments.map((assessment) => {
      const workflow = getWorkflow(assessment.processId as WorkflowId);
      const steps = assessment.generatedWorkflow?.length
        ? assessment.generatedWorkflow
        : workflow?.steps ?? [];
      return calculateProcessFindings(
        assessment,
        steps,
        engagement.clientContext.companySize
      );
    });
  }, [engagement]);

  if (!engagement) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const handleDeleteProcess = (processId: string) => {
    if (confirm("Remove this process from the engagement?")) {
      const updated = {
        ...engagement,
        processAssessments: engagement.processAssessments.filter(
          (p) => p.processId !== processId
        ),
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
      window.dispatchEvent(new Event("engagement-updated"));
    }
  };

  const handleUpdateClientContext = (updated: ClientContext) => {
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

  // ── Transcript analysis handler ──
  const handleAnalyzeTranscripts = async (processId: string) => {
    if (!engagement || transcripts.length === 0) return;
    setAnalyzing(true);
    setAnalysisError(null);

    const assessment = engagement.processAssessments.find(
      (pa) => pa.processId === processId
    );
    if (!assessment) return;

    const staticWorkflow = getWorkflow(assessment.processId as WorkflowId);
    const steps = assessment.generatedWorkflow?.length
      ? assessment.generatedWorkflow
      : staticWorkflow?.steps ?? [];

    try {
      // Analyze each transcript
      const analyses: TranscriptAnalysis[] = [];
      for (const transcript of transcripts) {
        const response = await fetch("/api/transcripts/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcriptText: transcript.content,
            workflowSteps: steps.map((s) => ({
              id: s.id,
              title: s.title,
              description: s.description,
              painPoints: s.painPoints,
            })),
            processName: assessment.processName,
          }),
        });

        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.error || "Analysis failed");
        }

        const result = await response.json();
        analyses.push({
          id: `ta_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          fileName: transcript.fileName,
          analyzedAt: new Date().toISOString(),
          stepEvidence: result.stepEvidence,
          meta: result.meta,
          summary: result.summary,
          interviewParticipants: result.interviewParticipants,
        });
      }

      // Show review dialog for first analysis
      if (analyses.length > 0) {
        setReviewingAnalysis({ analysis: analyses[0], processId });
      }

      // Store analyses temporarily — they'll be saved on apply
      const existingIntel = assessment.transcriptIntelligence;
      const mergedAnalyses = [
        ...(existingIntel?.analyses || []),
        ...analyses,
      ];

      // Save to engagement
      const updated = updateTranscriptIntelligence(engagementId, processId, {
        analyses: mergedAnalyses,
        reviewDecisions: existingIntel?.reviewDecisions || [],
        lastReviewedAt: existingIntel?.lastReviewedAt,
      });

      if (updated) {
        setEngagement(updated);
        setTranscripts([]);
      }
    } catch (err) {
      console.error("Transcript analysis failed:", err);
      setAnalysisError(
        err instanceof Error ? err.message : "Analysis failed"
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Apply transcript findings to maturity ratings ──
  const handleApplyTranscriptFindings = (
    processId: string,
    decisions: TranscriptReviewDecision[]
  ) => {
    if (!engagement) return;

    const assessment = engagement.processAssessments.find(
      (pa) => pa.processId === processId
    );
    if (!assessment) return;

    // Build new ratings from accepted decisions
    const newRatings: Record<string, MaturityLevel> = {
      ...(assessment.maturityRatings || {}),
    };
    decisions.forEach((d) => {
      if (d.accepted && d.appliedMaturity) {
        newRatings[d.stepId] = d.appliedMaturity;
      }
    });

    // Update maturity ratings
    const afterRatings = updateMaturityRatings(engagementId, processId, newRatings);
    if (!afterRatings) return;

    // Update transcript intelligence with review decisions
    const currentIntel = afterRatings.processAssessments.find(
      (pa) => pa.processId === processId
    )?.transcriptIntelligence;

    const updated = updateTranscriptIntelligence(engagementId, processId, {
      analyses: currentIntel?.analyses || [],
      reviewDecisions: [
        ...(currentIntel?.reviewDecisions || []),
        ...decisions,
      ],
      lastReviewedAt: new Date().toISOString(),
    });

    if (updated) {
      setEngagement(updated);
    }

    setReviewingAnalysis(null);
    window.dispatchEvent(new Event("engagement-updated"));
  };

  // Check for pending transcripts (from creation or new uploads)
  const hasPendingTranscripts = transcripts.length > 0;

  return (
    <div className="space-y-6">
      {/* ── Transcript Analysis Banner ── */}
      {hasPendingTranscripts && engagement.processAssessments.length > 0 && (
        <div className="border border-primary/30 rounded-lg p-4 bg-primary/5">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">
                {transcripts.length} transcript{transcripts.length > 1 ? "s" : ""} ready to analyze
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Analyze transcripts to extract pain points, maturity signals, and evidence quotes that pre-fill assessment ratings.
              </p>
              {analysisError && (
                <p className="text-xs text-destructive mt-1">{analysisError}</p>
              )}
              <div className="flex gap-2 mt-3">
                {engagement.processAssessments.map((pa) => (
                  <Button
                    key={pa.processId}
                    size="sm"
                    onClick={() => handleAnalyzeTranscripts(pa.processId)}
                    disabled={analyzing}
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>Analyze for {pa.processName}</>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Process Assessments ── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-1">
              Process Assessments
            </h3>
            <p className="text-sm text-muted-foreground">
              Select a process to explore each step, assess maturity, and
              discover recommended tools.
            </p>
          </div>

          <Button
            onClick={() => setShowAddProcess(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Add
          </Button>
        </div>

        {engagement.processAssessments.length === 0 ? (
          <div className="border border-dashed rounded-lg py-16 text-center">
            <p className="text-sm text-muted-foreground">
              No processes assessed yet. Add a process to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {engagement.processAssessments.map((assessment, idx) => {
              const func = FUNCTIONS.find(
                (f) => f.id === assessment.functionId
              );
              const ratedCount = assessment.maturityRatings
                ? Object.keys(assessment.maturityRatings).length
                : 0;
              const staticWorkflow = getWorkflow(
                assessment.processId as WorkflowId
              );
              const totalSteps =
                assessment.generatedWorkflow?.length ||
                staticWorkflow?.steps.length ||
                0;

              const isComplete =
                ratedCount >= totalSteps && totalSteps > 0;
              const statusLabel =
                ratedCount === 0
                  ? "Not started"
                  : isComplete
                    ? "Complete"
                    : `${ratedCount}/${totalSteps} rated`;

              const statusColor =
                ratedCount === 0
                  ? "bg-muted text-muted-foreground"
                  : isComplete
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

              const findings = allFindings[idx];
              const hasSavings =
                findings && findings.stepEstimates.length > 0;

              return (
                <div
                  key={assessment.processId}
                  className="group rounded-lg border bg-card overflow-hidden"
                >
                  <div className="flex items-center">
                    {/* Clickable main area */}
                    <Link
                      href={`/${assessment.processId}?engagement=${engagement.id}`}
                      className="flex-1 flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                    >
                      {/* Status chip */}
                      <span
                        className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}
                      >
                        {statusLabel}
                      </span>

                      {/* Process info */}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">
                          {assessment.processName}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {func?.name}
                        </span>
                        <div className="flex items-center gap-3 mt-0.5">
                          {totalSteps > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {totalSteps} steps
                            </p>
                          )}
                          {hasSavings && (
                            <p className="text-xs font-medium text-emerald-600">
                              {formatCurrency(findings.totalSavings.low)}–
                              {formatCurrency(findings.totalSavings.high)}/yr
                            </p>
                          )}
                        </div>
                        {/* Transcript coverage bar */}
                        {assessment.transcriptIntelligence?.analyses.length ? (
                          <div className="mt-1.5 max-w-xs">
                            <TranscriptCoverageBar
                              stepEvidence={
                                assessment.transcriptIntelligence.analyses[
                                  assessment.transcriptIntelligence.analyses.length - 1
                                ].stepEvidence
                              }
                            />
                          </div>
                        ) : null}
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-1 px-3 border-l h-full">
                      {isComplete && (
                        <Link
                          href={`/engagements/${engagement.id}/opportunities`}
                          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                          title="View Opportunities"
                        >
                          <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Link>
                      )}
                      <button
                        onClick={() =>
                          setEditingProcess({
                            processId: assessment.processId,
                            processName: assessment.processName,
                            context: assessment.context || {},
                          })
                        }
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                        title="Edit inputs"
                      >
                        <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() =>
                          handleDeleteProcess(assessment.processId)
                        }
                        className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-destructive/10 transition-colors"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

      {/* ── Transcript Upload Panel ── */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
          Interview Transcripts
        </h3>
        <TranscriptUploadPanel
          transcripts={transcripts}
          onTranscriptsChange={setTranscripts}
          description="Upload interview transcripts to extract pain points, maturity signals, and evidence quotes."
        />
      </div>

      {/* ── Transcript Review Dialog ── */}
      {reviewingAnalysis && (
        <TranscriptReviewDialog
          open={!!reviewingAnalysis}
          onOpenChange={(open) => {
            if (!open) setReviewingAnalysis(null);
          }}
          analysis={reviewingAnalysis.analysis}
          onApply={(decisions) =>
            handleApplyTranscriptFindings(
              reviewingAnalysis.processId,
              decisions
            )
          }
        />
      )}

      {/* Add Process Modal */}
      {showAddProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Process to Assess</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Coming soon: Select any process from Finance, GTM, or R&D to
                add to this engagement.
              </p>
              <Button
                onClick={() => setShowAddProcess(false)}
                className="w-full"
              >
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
