"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { ProcessFindings, SavingsAssumptions, DEFAULT_ASSUMPTIONS } from "@/types/findings";
import { MaturityLevel } from "@/types/workflow";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import {
  calculateProcessFindings,
  buildExecutiveSummary,
} from "@/lib/calculators/savings-calculator";
import { ExecutiveSummary } from "@/components/engagement/ExecutiveSummary";
import { AssumptionsPanel } from "@/components/engagement/AssumptionsPanel";
import { FormulaExplainer } from "@/components/engagement/FormulaExplainer";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ChevronDown, ChevronUp, Zap, ShieldCheck, Users, Timer, DollarSign } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function formatCurrency(value: number): string {
  if (value >= 1000) return `$${Math.round(value / 1000)}K`;
  return `$${Math.round(value).toLocaleString()}`;
}

function formatRange(low: number, high: number): string {
  return `${formatCurrency(low)} – ${formatCurrency(high)}`;
}

const MATURITY_COLORS: Record<MaturityLevel, string> = {
  manual: "bg-red-400",
  "semi-automated": "bg-amber-400",
  automated: "bg-emerald-400",
};

const MATURITY_LABELS: Record<MaturityLevel, { label: string; className: string }> = {
  manual: { label: "Manual", className: "bg-red-100 text-red-700 border-red-200" },
  "semi-automated": { label: "Semi-auto", className: "bg-amber-100 text-amber-700 border-amber-200" },
  automated: { label: "Automated", className: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

// ── Compact process tile ──
function ProcessFindingsTile({ findings }: { findings: ProcessFindings }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {/* Tile header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 p-4 text-left hover:bg-accent/30 transition-colors"
        >
          {/* Maturity strip (mini) */}
          <div className="flex gap-0.5 w-20 shrink-0">
            {findings.stepEstimates
              .slice()
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((est) => (
                <div
                  key={est.stepId}
                  className={`flex-1 h-1.5 rounded-full ${MATURITY_COLORS[est.maturity]}`}
                />
              ))}
          </div>

          <div className="flex-1 min-w-0">
            <span className="font-medium text-sm">{findings.processName}</span>
            <p className="text-xs text-muted-foreground">
              {findings.assessedStepCount}/{findings.totalStepCount} steps
              {" · "}{findings.teamSize} team
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="text-sm font-semibold tabular-nums">
              {formatRange(findings.totalSavings.low, findings.totalSavings.high)}
            </p>
            <p className="text-[10px] text-muted-foreground">/yr savings</p>
          </div>

          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div className="border-t px-4 pb-4 pt-3 space-y-2">
            {findings.stepEstimates.map((est) => {
              const style = MATURITY_LABELS[est.maturity];
              return (
                <div
                  key={est.stepId}
                  className="flex items-center gap-3 py-1.5 text-sm"
                >
                  <Badge
                    variant="outline"
                    className={`text-[10px] shrink-0 ${style.className}`}
                  >
                    {style.label}
                  </Badge>
                  <span className="flex-1 min-w-0 truncate">{est.stepTitle}</span>
                  {/* % impact */}
                  <span className="tabular-nums text-xs text-muted-foreground shrink-0 w-10 text-right">
                    {est.percentImpact}%
                  </span>
                  {/* $ range */}
                  <span className="tabular-nums text-xs text-muted-foreground shrink-0">
                    {formatRange(est.savings.low, est.savings.high)}
                  </span>
                  <span className="shrink-0 hidden sm:flex items-center gap-1">
                    {est.topTool && (
                      <span className="text-xs text-muted-foreground">
                        {est.topTool.name}
                      </span>
                    )}
                    {est.topTool?.erpCompatibility && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 bg-violet-50 text-violet-600 border-violet-200">
                        {est.topTool.erpCompatibility.level}
                      </Badge>
                    )}
                  </span>
                </div>
              );
            })}

            {/* Tool cost & net ROI summary */}
            {findings.estimatedToolCost && (
              <div className="flex items-center gap-2 pt-2 border-t text-xs">
                <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Est. tool cost:</span>
                <span className="tabular-nums font-medium">
                  {formatRange(findings.estimatedToolCost.low, findings.estimatedToolCost.high)}
                </span>
                <span className="text-muted-foreground">/yr</span>
                <span className="text-muted-foreground ml-2">Net ROI:</span>
                <span className="tabular-nums font-semibold text-emerald-600">
                  {formatRange(
                    findings.totalSavings.low - findings.estimatedToolCost.high,
                    findings.totalSavings.high - findings.estimatedToolCost.low
                  )}
                </span>
              </div>
            )}

            <p className="text-[10px] text-muted-foreground italic pt-2 border-t">
              Directional estimates based on team size, maturity, and benchmarks. % shows impact as portion of total team cost.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main page ──
interface FindingsPageClientProps {
  engagementId: string;
}

export function FindingsPageClient({ engagementId }: FindingsPageClientProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [assumptions, setAssumptions] = useState<SavingsAssumptions | null>(null);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
    const defaults = DEFAULT_ASSUMPTIONS[loaded.clientContext.companySize] ?? DEFAULT_ASSUMPTIONS["smb"];
    setAssumptions(loaded.customAssumptions ?? defaults);
  }, [engagementId, router]);

  const handleAssumptionsChange = useCallback((newAssumptions: SavingsAssumptions) => {
    setAssumptions(newAssumptions);
    // Persist to engagement
    if (engagement) {
      const updated = { ...engagement, customAssumptions: newAssumptions, updatedAt: new Date().toISOString() };
      saveEngagement(updated);
      setEngagement(updated);
    }
  }, [engagement]);

  const erpName = engagement?.clientContext?.erp || "";

  const allFindings = useMemo(() => {
    if (!engagement || !assumptions) return [];
    return engagement.processAssessments.map((assessment) => {
      const workflow = getWorkflow(assessment.processId as WorkflowId);
      const steps = assessment.generatedWorkflow?.length
        ? assessment.generatedWorkflow
        : workflow?.steps ?? [];
      return calculateProcessFindings(
        assessment,
        steps,
        engagement.clientContext.companySize,
        assumptions,
        erpName || undefined
      );
    });
  }, [engagement, assumptions, erpName]);

  const executiveSummary = useMemo(
    () => buildExecutiveSummary(allFindings),
    [allFindings]
  );

  if (!engagement || !assumptions) {
    return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  }

  const findingsWithData = allFindings.filter((f) => f.stepEstimates.length > 0);
  const hasAnyFindings = findingsWithData.length > 0;

  if (!hasAnyFindings) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-16 text-center">
          <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground mb-4">
            No impact data yet. Complete at least one process assessment to see business impact.
          </p>
          <Link href={`/engagements/${engagementId}/assessment`}>
            <Button variant="outline">Go to Assessment</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Top step for formula explainer
  const topStep = findingsWithData[0]?.stepEstimates[0];

  const operationalCategories = [
    {
      title: "Process Efficiency",
      description: "Streamlined workflows, reduced cycle times, and elimination of redundant handoffs across assessed processes.",
      icon: Zap,
    },
    {
      title: "Error Reduction",
      description: "Fewer manual data entry errors, improved accuracy in calculations, and automated validation checks.",
      icon: Timer,
    },
    {
      title: "Compliance & Controls",
      description: "Stronger audit trails, automated policy enforcement, and real-time compliance monitoring.",
      icon: ShieldCheck,
    },
    {
      title: "Employee Experience",
      description: "Reduced repetitive tasks, more time for strategic work, and improved job satisfaction for finance teams.",
      icon: Users,
    },
  ];

  return (
    <Tabs defaultValue="cost-savings" className="space-y-6">
      <TabsList>
        <TabsTrigger value="cost-savings">Cost Savings</TabsTrigger>
        <TabsTrigger value="operational">Operational Improvements</TabsTrigger>
      </TabsList>

      <TabsContent value="cost-savings">
        <div className="space-y-8">
          {/* ── Assumptions Panel ── */}
          <AssumptionsPanel
            assumptions={assumptions}
            companySize={engagement.clientContext.companySize}
            onChange={handleAssumptionsChange}
          />

          {/* ── Section 1: Summary ── */}
          <ExecutiveSummary summary={executiveSummary} />

          {/* ── Section 2: Formula Explainer ── */}
          {topStep && (
            <FormulaExplainer
              topStep={topStep}
              teamSize={findingsWithData[0].teamSize}
              costPerPerson={findingsWithData[0].costPerPerson}
            />
          )}

          {/* ── Section 3: Per-Process Tiles ── */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground">
              Process Breakdown
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {findingsWithData.map((findings) => (
                <ProcessFindingsTile key={findings.processId} findings={findings} />
              ))}
            </div>
          </div>

        </div>
      </TabsContent>

      <TabsContent value="operational">
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold tracking-wider uppercase text-muted-foreground mb-1">
              Operational Improvements
            </h2>
            <p className="text-sm text-muted-foreground">
              Beyond cost savings, process automation and optimization deliver qualitative improvements across your operations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {operationalCategories.map((cat) => {
              const Icon = cat.icon;
              return (
                <Card key={cat.title}>
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-4.5 w-4.5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-sm">{cat.title}</h3>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Coming soon
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {cat.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
