"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { generateAIDiagnostic } from "@/lib/ai/diagnostic-generator";
import { FUNCTIONS } from "@/types/function";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiagnosticOverview } from "@/components/diagnostic/DiagnosticOverview";
import { Plus, Trash2, Sparkles, Loader2, Pencil, ChevronRight, BarChart3 } from "lucide-react";
import Link from "next/link";
import { EditCompanyDialog } from "@/components/engagement/EditCompanyDialog";
import { EditProcessContextDialog } from "@/components/engagement/EditProcessContextDialog";
import { PROCESS_QUESTIONS, DEFAULT_PROCESS_QUESTIONS } from "@/lib/data/process-questions";
import { ClientContext } from "@/types/engagement";

interface EngagementWorkspaceProps {
  engagementId: string;
}

export function EngagementWorkspace({ engagementId }: EngagementWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [showAddProcess, setShowAddProcess] = useState(false);
  const [isGeneratingDiagnostic, setIsGeneratingDiagnostic] = useState(false);
  const [showEditCompany, setShowEditCompany] = useState(false);
  const [editingProcess, setEditingProcess] = useState<{ processId: string; processName: string; context: Record<string, string> } | null>(null);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
  }, [engagementId, router]);

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
    }
  };

  const handleGenerateDiagnostic = async () => {
    setIsGeneratingDiagnostic(true);
    try {
      const diagnostic = await generateAIDiagnostic(
        engagement.clientContext,
        engagement.processAssessments
      );
      const updated = {
        ...engagement,
        diagnostic,
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
    } finally {
      setIsGeneratingDiagnostic(false);
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
  };

  const handleUpdateProcessContext = (processId: string, context: Record<string, string>) => {
    const updatedEngagement = {
      ...engagement,
      processAssessments: engagement.processAssessments.map((pa) =>
        pa.processId === processId ? { ...pa, context } : pa
      ),
      updatedAt: new Date().toISOString(),
    };
    saveEngagement(updatedEngagement);
    setEngagement(updatedEngagement);
  };

  const defaultTab = tabParam === "processes" || tabParam === "diagnostic"
    ? tabParam
    : engagement.diagnostic ? "diagnostic" : "processes";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-light tracking-wider">
                {engagement.name}
              </h1>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditCompany(true)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-muted-foreground">
              {engagement.clientContext.companyName}
              {engagement.clientContext.subSector && ` • ${engagement.clientContext.subSector}`}
              {!engagement.clientContext.subSector && engagement.clientContext.industry && ` • ${engagement.clientContext.industry}`}
              {engagement.clientContext.companySize && ` • ${engagement.clientContext.companySize}`}
              {engagement.clientContext.isPublic && engagement.clientContext.tickerSymbol && ` (${engagement.clientContext.tickerSymbol})`}
            </p>
          </div>

          <Button variant="outline" onClick={() => router.push("/engagements")}>
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">ERP:</span>{" "}
            <span className="font-medium">{engagement.clientContext.erp || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Invoice Volume:</span>{" "}
            <span className="font-medium">
              {engagement.clientContext.monthlyInvoiceVolume || "—"}
            </span>
          </div>
        </div>

        {engagement.clientContext.characteristics && (
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">Notes:</span>{" "}
            <p className="mt-1">{engagement.clientContext.characteristics}</p>
          </div>
        )}
      </div>

      {/* Tabbed Content */}
      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="diagnostic">
            <Sparkles className="h-4 w-4 mr-2" />
            Diagnostic
          </TabsTrigger>
          <TabsTrigger value="processes">
            <BarChart3 className="h-4 w-4 mr-2" />
            Processes ({engagement.processAssessments.length})
          </TabsTrigger>
        </TabsList>

        {/* Diagnostic Tab */}
        <TabsContent value="diagnostic" className="mt-6">
          {engagement.diagnostic ? (
            <DiagnosticOverview
              diagnostic={engagement.diagnostic}
              companyName={engagement.clientContext.companyName}
              industry={engagement.clientContext.industry}
              companySize={engagement.clientContext.companySize}
              engagementId={engagement.id}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">No diagnostic generated</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Generate a company-level AI diagnostic to identify your archetype,
                  predictable challenges, and priority areas to explore.
                </p>
                <Button onClick={handleGenerateDiagnostic} disabled={isGeneratingDiagnostic}>
                  {isGeneratingDiagnostic ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating AI diagnostic...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Diagnostic
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Processes Tab */}
        <TabsContent value="processes" className="mt-6">
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-1">
                  Assessed Processes
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select a process to explore each step, assess maturity, and discover recommended tools.
                </p>
              </div>

              <Button onClick={() => setShowAddProcess(true)} size="sm" variant="outline">
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
                {engagement.processAssessments.map((assessment) => {
                  const func = FUNCTIONS.find((f) => f.id === assessment.functionId);
                  const ratedCount = assessment.maturityRatings ? Object.keys(assessment.maturityRatings).length : 0;
                  const staticWorkflow = getWorkflow(assessment.processId as WorkflowId);
                  const totalSteps = assessment.generatedWorkflow?.length || staticWorkflow?.steps.length || 0;

                  const statusLabel = ratedCount === 0
                    ? "Not started"
                    : ratedCount >= totalSteps && totalSteps > 0
                      ? "Complete"
                      : `${ratedCount}/${totalSteps} rated`;

                  const statusColor = ratedCount === 0
                    ? "bg-muted text-muted-foreground"
                    : ratedCount >= totalSteps && totalSteps > 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";

                  return (
                    <div key={assessment.processId} className="group rounded-lg border bg-card overflow-hidden">
                      <div className="flex items-center">
                        {/* Clickable main area */}
                        <Link
                          href={`/${assessment.processId}?engagement=${engagement.id}`}
                          className="flex-1 flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
                        >
                          {/* Status chip — left */}
                          <span className={`shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${statusColor}`}>
                            {statusLabel}
                          </span>

                          {/* Process info */}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium">{assessment.processName}</span>
                            <span className="text-xs text-muted-foreground ml-2">{func?.name}</span>
                            {totalSteps > 0 && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {totalSteps} workflow steps
                              </p>
                            )}
                          </div>

                          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
                        </Link>

                        {/* Actions — always visible, separated by border */}
                        <div className="flex items-center gap-1 px-3 border-l h-full">
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
                            onClick={() => handleDeleteProcess(assessment.processId)}
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
        </TabsContent>
      </Tabs>

      {/* Edit Company Dialog */}
      <EditCompanyDialog
        open={showEditCompany}
        onOpenChange={setShowEditCompany}
        clientContext={engagement.clientContext}
        onSave={handleUpdateClientContext}
      />

      {/* Edit Process Context Dialog */}
      {editingProcess && (
        <EditProcessContextDialog
          open={!!editingProcess}
          onOpenChange={(open) => { if (!open) setEditingProcess(null); }}
          processId={editingProcess.processId}
          processName={editingProcess.processName}
          context={editingProcess.context}
          onSave={handleUpdateProcessContext}
        />
      )}

      {/* Add Process Modal (Simple Version) */}
      {showAddProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Process to Assess</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Coming soon: Select any process from Finance, GTM, or R&D to add to
                this engagement.
              </p>
              <Button onClick={() => setShowAddProcess(false)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
