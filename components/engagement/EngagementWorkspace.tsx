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
import { Plus, Trash2, Pencil, ChevronRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import { EditCompanyDialog } from "@/components/engagement/EditCompanyDialog";
import { EditProcessContextDialog } from "@/components/engagement/EditProcessContextDialog";
import { ClientContext } from "@/types/engagement";

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

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
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

  return (
    <div className="space-y-6">
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
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                    </Link>

                    {/* Actions */}
                    <div className="flex items-center gap-1 px-3 border-l h-full">
                      {isComplete && (
                        <Link
                          href={`/engagements/${engagement.id}/findings`}
                          className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted transition-colors"
                          title="View Findings"
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
