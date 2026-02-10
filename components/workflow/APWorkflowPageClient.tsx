"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useCallback, useState, useEffect, useRef } from "react";
import { Workflow, MaturityLevel } from "@/types/workflow";
import { Engagement } from "@/types/engagement";
import { getEngagement, updateMaturityRatings, deleteEngagement } from "@/lib/storage/engagements";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SummaryStatsBar } from "./SummaryStatsBar";
import { SemanticSearchBar } from "./SemanticSearchBar";
import { PipelineStrip } from "./PipelineStrip";
import { StepDetailPanel } from "./StepDetailPanel";
import { ConsultantTakeaway } from "./ConsultantTakeaway";
import { MaturityScorecard } from "./MaturityScorecard";
import { SaveEngagementDialog } from "./SaveEngagementDialog";
import { VendorLandscapeClient } from "@/components/vendors/VendorLandscapeClient";
import { getAllTools } from "@/lib/data/tools";
import { Button } from "@/components/ui/button";
import { Edit, Briefcase, Save, Trash2 } from "lucide-react";
import Link from "next/link";

interface APWorkflowPageClientProps {
  staticWorkflow: Workflow;
  toolCount: number;
  engagementId: string | null;
}

export function APWorkflowPageClient({
  staticWorkflow,
  toolCount,
  engagementId,
}: APWorkflowPageClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedStepId = searchParams.get("step");
  const activeTab = searchParams.get("tab") || "explore";

  // Load engagement if ID is provided (DUAL-MODE)
  const [engagement, setEngagement] = useState<Engagement | null>(null);

  // Lifted maturity ratings state
  const [ratings, setRatings] = useState<Record<string, MaturityLevel>>({});
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);

  // Track whether we've initialized ratings from engagement to avoid overwriting
  const initializedRef = useRef<string | null>(null);

  useEffect(() => {
    if (engagementId) {
      const loaded = getEngagement(engagementId);
      setEngagement(loaded);
      // Restore ratings from engagement (only on first load or engagement change)
      if (loaded && initializedRef.current !== engagementId) {
        const pa = loaded.processAssessments.find((p) => p.processId === "ap");
        if (pa?.maturityRatings) {
          setRatings(pa.maturityRatings);
        }
        initializedRef.current = engagementId;
      }
    } else {
      setEngagement(null);
      if (initializedRef.current !== null) {
        initializedRef.current = null;
      }
    }
  }, [engagementId]);

  // Find the AP process assessment from the engagement
  const processAssessment = engagement?.processAssessments.find(
    (p) => p.processId === "ap"
  );

  // Use generated workflow if engagement has one, otherwise use static
  const workflow: Workflow =
    processAssessment && processAssessment.generatedWorkflow.length > 0
      ? {
          id: "ap",
          name: processAssessment.processName,
          functionId: "finance",
          processId: "ap",
          steps: processAssessment.generatedWorkflow,
        }
      : staticWorkflow;

  const selectedStep = selectedStepId
    ? workflow.steps.find((s) => s.id === selectedStepId) ?? null
    : null;

  // Compute average impact
  const impactValues = { high: 3, medium: 2, low: 1 };
  const avgImpactScore =
    workflow.steps.reduce((sum, s) => sum + impactValues[s.aiOpportunity.impact], 0) /
    workflow.steps.length;
  const avgImpact = avgImpactScore >= 2.5 ? "High" : avgImpactScore >= 1.5 ? "Medium" : "Low";

  const ratedCount = Object.keys(ratings).length;

  // Handle rating a step — auto-save if engagement is loaded
  const handleRate = useCallback(
    (stepId: string, level: MaturityLevel) => {
      setRatings((prev) => {
        const next = { ...prev, [stepId]: level };
        // Auto-save for loaded engagements
        if (engagementId) {
          updateMaturityRatings(engagementId, "ap", next);
        }
        return next;
      });
    },
    [engagementId]
  );

  // Helper to build URLs with engagement param preserved
  const buildUrl = useCallback(
    (params: Record<string, string>) => {
      const urlParams = new URLSearchParams();
      if (engagementId) {
        urlParams.set("engagement", engagementId);
      }
      Object.entries(params).forEach(([key, value]) => {
        urlParams.set(key, value);
      });
      return `/ap?${urlParams.toString()}`;
    },
    [engagementId]
  );

  const handleStepSelect = useCallback(
    (stepId: string) => {
      if (selectedStepId === stepId) {
        router.push(buildUrl({ tab: "explore" }), { scroll: false });
      } else {
        router.push(buildUrl({ tab: "explore", step: stepId }), { scroll: false });
      }
    },
    [selectedStepId, router, buildUrl]
  );

  const handleTabChange = useCallback(
    (value: string) => {
      router.push(buildUrl({ tab: value }), { scroll: false });
    },
    [router, buildUrl]
  );

  const handleDeleteEngagement = useCallback(() => {
    if (!engagementId) return;
    if (!confirm("Delete this engagement? This cannot be undone.")) return;
    deleteEngagement(engagementId);
    setEngagement(null);
    setRatings({});
    initializedRef.current = null;
    router.push("/ap?tab=explore", { scroll: false });
  }, [engagementId, router]);

  const handleEngagementSaved = useCallback(
    (saved: Engagement) => {
      setEngagement(saved);
      initializedRef.current = saved.id;
      // Navigate to include engagement param so auto-save works
      router.push(`/ap?engagement=${saved.id}&tab=explore`, { scroll: false });
    },
    [router]
  );

  return (
    <div className="space-y-6">
      {/* Engagement Context Banner (only shown when in generated mode) */}
      {engagement && (
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Briefcase className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium text-sm">
                  {engagement.type === "lightweight" ? "Quick Assessment" : "Custom Engagement"}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {engagement.name}
                  {engagement.clientContext.industry &&
                    ` • ${engagement.clientContext.industry}`}
                  {engagement.clientContext.companySize &&
                    ` • ${engagement.clientContext.companySize}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {engagement.type !== "lightweight" && (
                <Link href={`/engagements/${engagement.id}/edit`}>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Workflow
                  </Button>
                </Link>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteEngagement}
                className="text-destructive hover:text-destructive"
                title="Delete engagement"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="text-center mb-2">
        <h2 className="text-3xl font-bold mb-2">{workflow.name} Workflow</h2>
        <p className="text-muted-foreground">
          {engagement
            ? "Tailored workflow for your client engagement"
            : "Explore the process, assess maturity, and evaluate the vendor landscape"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="explore">Process Explorer</TabsTrigger>
            <TabsTrigger value="vendors">Vendor Landscape</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="explore" className="mt-6">
          <div className="space-y-6">
            <SummaryStatsBar
              stepCount={workflow.steps.length}
              toolCount={toolCount}
              avgImpact={avgImpact}
              ratedCount={ratedCount}
              totalSteps={workflow.steps.length}
            />

            <SemanticSearchBar steps={workflow.steps} onStepSelect={handleStepSelect} />

            <PipelineStrip
              steps={workflow.steps}
              selectedStepId={selectedStepId}
              onStepSelect={handleStepSelect}
              ratings={ratings}
            />

            {/* Inline MaturityScorecard — appears when any ratings exist */}
            {ratedCount > 0 && (
              <div className="space-y-4">
                <MaturityScorecard
                  steps={workflow.steps}
                  ratings={ratings}
                  compact
                />
                {/* Save as Engagement button (only when not already saved) */}
                {!engagementId && (
                  <div className="flex justify-center">
                    <Button
                      onClick={() => setSaveDialogOpen(true)}
                      variant="outline"
                      className="gap-2"
                    >
                      <Save className="h-4 w-4" />
                      Save as Engagement
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedStep && (
              <StepDetailPanel
                step={selectedStep}
                toolMappings={processAssessment?.toolMappings}
                maturityRating={ratings[selectedStep.id]}
                onRate={handleRate}
              />
            )}

            <ConsultantTakeaway steps={workflow.steps} />
          </div>
        </TabsContent>

        <TabsContent value="vendors" className="mt-6">
          <VendorLandscapeClient tools={getAllTools()} embedded />
        </TabsContent>
      </Tabs>

      {/* Save Engagement Dialog */}
      <SaveEngagementDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        ratings={ratings}
        processId="ap"
        processName="Accounts Payable"
        functionId="finance"
        onSaved={handleEngagementSaved}
      />
    </div>
  );
}
