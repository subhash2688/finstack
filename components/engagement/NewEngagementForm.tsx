"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientContext } from "@/types/engagement";
import { FUNCTIONS, FunctionId, Function as FunctionType, ProcessMeta } from "@/types/function";
import { generateEngagementId, saveEngagement } from "@/lib/storage/engagements";
import { generateAIDiagnostic } from "@/lib/ai/diagnostic-generator";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TECH_SUB_SECTORS,
  CORE_PROCESS_QUESTIONS,
} from "@/lib/data/process-questions";
import {
  TranscriptUploadPanel,
  PendingTranscript,
} from "@/components/engagement/TranscriptUploadPanel";
import { EngagementStepper, StepDef } from "@/components/engagement/EngagementStepper";
import { PublicCompanyPicker } from "@/components/engagement/PublicCompanyPicker";
import {
  DollarSign,
  TrendingUp,
  Microscope,
  Users,
  Scale,
  Loader2,
  Building2,
  BarChart3,
  Bot,
  FileText,
  CheckCircle2,
  Wrench,
  Hash,
  Sparkles,
} from "lucide-react";

const FUNCTION_ICONS: Record<string, React.ElementType> = {
  DollarSign,
  TrendingUp,
  Microscope,
  Users,
  Scale,
};

// ── Lightweight client-side extraction from transcript text ──
const KNOWN_SYSTEMS = [
  "SAP", "Oracle", "NetSuite", "QuickBooks", "Xero", "Sage", "Workday",
  "Coupa", "Concur", "Expensify", "Brex", "Ramp", "Bill.com", "Tipalti",
  "Zuora", "Stripe", "Anaplan", "Adaptive", "Planful", "Pigment",
  "BlackLine", "FloQast", "AvidXchange", "MineralTree", "Basware",
  "Ariba", "Great Plains", "Dynamics", "JD Edwards", "Infor",
  "Netsuite", "PeopleSoft", "Epicor",
];

function extractFromTranscripts(texts: string[]): {
  erp: string;
  teamSize: string;
  costPerPerson: string;
  systemsList: string[];
  teamMentions: string[];
  themes: string[];
} {
  const combined = texts.join("\n");
  const combinedLower = combined.toLowerCase();

  const foundSystems = KNOWN_SYSTEMS.filter((s) =>
    combinedLower.includes(s.toLowerCase())
  );
  const erp = foundSystems.length > 0 ? foundSystems.join(", ") : "";

  let teamSize = "";
  const teamMentions: string[] = [];
  const teamPatterns = [
    /(?:team\s+(?:of|is|has)\s+)(\d+)/i,
    /(\d+)\s*(?:people|person|staff|employees|FTEs?|headcount|team members)/i,
    /(?:we\s+have|there\s+are|about|around|roughly)\s+(\d+)\s+(?:people|person|staff|on the team|in the team)/i,
  ];
  for (const pat of teamPatterns) {
    const match = combined.match(pat);
    if (match) {
      teamSize = match[1];
      teamMentions.push(match[0].trim());
      break;
    }
  }

  let costPerPerson = "";
  const costPatterns = [
    /\$\s*([\d,]+)\s*(?:k|K)\s*(?:per\s+(?:person|head|employee|FTE)|a\s+year|annually|salary)/i,
    /\$\s*([\d,]+)\s*(?:per\s+(?:person|head|employee|FTE)|a\s+year|annually|salary)/i,
    /(?:salary|cost|compensation|pay)\s+(?:of|is|around|about|roughly)\s+\$\s*([\d,]+)/i,
  ];
  for (const pat of costPatterns) {
    const match = combined.match(pat);
    if (match) {
      const raw = match[1].replace(/,/g, "");
      const num = parseInt(raw, 10);
      if (/k/i.test(match[0]) && num < 1000) {
        costPerPerson = `$${num * 1000}`;
      } else {
        costPerPerson = `$${num.toLocaleString()}`;
      }
      break;
    }
  }

  // Extract broad themes from common pain-point keywords
  const themes: string[] = [];
  const themeMap: Record<string, string> = {
    "manual": "Manual processes",
    "spreadsheet": "Spreadsheet reliance",
    "duplicate": "Duplicate work",
    "approval": "Approval bottleneck",
    "visibility": "Lack of visibility",
    "reconcil": "Reconciliation pain",
    "error": "Error-prone",
    "slow": "Slow turnaround",
    "compliance": "Compliance risk",
  };
  for (const [keyword, label] of Object.entries(themeMap)) {
    if (combinedLower.includes(keyword) && themes.length < 5) {
      themes.push(label);
    }
  }

  return { erp, teamSize, costPerPerson, systemsList: foundSystems, teamMentions, themes };
}

// ── Step definitions ──
type Step = "company-info" | "function-selection" | "process-details";

const STEPS: { id: Step; label: string; shortLabel: string }[] = [
  { id: "company-info", label: "Company Profile", shortLabel: "Company" },
  { id: "function-selection", label: "Function & Processes", shortLabel: "Processes" },
  { id: "process-details", label: "Process Details", shortLabel: "Details" },
];

export function NewEngagementForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("company-info");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [furthestStep, setFurthestStep] = useState(0);

  // Step 1
  const [formData, setFormData] = useState<ClientContext>({
    companyName: "",
    industry: "Technology",
    subSector: "",
    isPublic: false,
    tickerSymbol: "",
    companySize: "mid-market",
  });
  const [sicInfo, setSicInfo] = useState<{ sic: string; sicDescription: string } | null>(null);

  // Step 2
  const [selectedFunction, setSelectedFunction] = useState<FunctionType | null>(null);
  const [selectedProcessIds, setSelectedProcessIds] = useState<Set<string>>(new Set());

  // Step 3
  const [processContexts, setProcessContexts] = useState<Record<string, Record<string, string>>>({});
  const [pendingTranscripts, setPendingTranscripts] = useState<PendingTranscript[]>([]);
  const [lastExtraction, setLastExtraction] = useState<ReturnType<typeof extractFromTranscripts> | null>(null);

  const handleTranscriptsChange = (updated: PendingTranscript[]) => {
    setPendingTranscripts(updated);

    if (updated.length === 0) {
      setLastExtraction(null);
      return;
    }

    const extracted = extractFromTranscripts(updated.map((t) => t.content));
    setLastExtraction(extracted);

    setProcessContexts((prev) => {
      const next = { ...prev };
      Array.from(selectedProcessIds).forEach((pid) => {
        const ctx = { ...(next[pid] || {}) };
        if (!ctx.erp && extracted.erp) ctx.erp = extracted.erp;
        if (!ctx.teamSize && extracted.teamSize) ctx.teamSize = extracted.teamSize;
        if (!ctx.costPerPerson && extracted.costPerPerson) ctx.costPerPerson = extracted.costPerPerson;
        next[pid] = ctx;
      });
      return next;
    });
  };

  // ── Validation ──
  const step1Complete = formData.companyName.trim() !== "" && formData.subSector !== "";
  const step2Complete = selectedProcessIds.size > 0;

  // ── Navigation ──
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const navigateTo = (targetStep: Step) => {
    const targetIndex = STEPS.findIndex((s) => s.id === targetStep);

    if (targetStep === "process-details") {
      const updated = { ...processContexts };
      Array.from(selectedProcessIds).forEach((pid) => {
        if (!updated[pid]) updated[pid] = {};
      });
      setProcessContexts(updated);
    }

    setStep(targetStep);
    if (targetIndex > furthestStep) setFurthestStep(targetIndex);
  };

  const canNavigateTo = (targetIndex: number): boolean => {
    if (targetIndex <= furthestStep) return true;
    if (targetIndex === 1 && step1Complete) return true;
    if (targetIndex === 2 && step1Complete && step2Complete) return true;
    return false;
  };

  // ── Step 2 helpers ──
  const hasAvailableProcess = (func: FunctionType) => func.processes.some((p) => p.available);

  const handleFunctionSelect = (func: FunctionType) => {
    if (!hasAvailableProcess(func)) return;
    if (selectedFunction?.id === func.id) return;
    setSelectedFunction(func);
    setSelectedProcessIds(new Set());
  };

  const handleProcessToggle = (processId: string) => {
    setSelectedProcessIds((prev) => {
      const next = new Set(prev);
      if (next.has(processId)) next.delete(processId);
      else next.add(processId);
      return next;
    });
  };

  // ── Step 3 helpers ──
  const updateProcessContext = (processId: string, key: string, value: string) => {
    setProcessContexts((prev) => ({
      ...prev,
      [processId]: { ...prev[processId], [key]: value },
    }));
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!selectedFunction) return;
    setError(null);
    setIsLoading(true);

    try {
      const clientContext: ClientContext = { ...formData, functionId: selectedFunction.id };

      const processAssessments = Array.from(selectedProcessIds).map((processId) => {
        const processMeta = selectedFunction.processes.find((p) => p.id === processId)!;
        return {
          functionId: selectedFunction.id as FunctionId,
          processId,
          processName: processMeta.name,
          generatedWorkflow: [],
          toolMappings: [],
          context: processContexts[processId] || {},
        };
      });

      const diagnostic = await generateAIDiagnostic(clientContext, processAssessments);

      const engagement = {
        id: generateEngagementId(),
        name: `${formData.companyName} - ${selectedFunction.name} Assessment`,
        clientContext,
        diagnostic,
        processAssessments,
        ...(pendingTranscripts.length > 0 && { pendingTranscripts }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveEngagement(engagement);
      router.push(`/engagements/${engagement.id}`);
    } catch (err) {
      console.error("Failed to create engagement:", err);
      setError(err instanceof Error ? err.message : "Failed to create engagement");
      setIsLoading(false);
    }
  };

  // ── Derived data ──
  const groupedProcesses = selectedFunction
    ? selectedFunction.processes.reduce<Record<string, ProcessMeta[]>>((acc, p) => {
        const group = p.group || "General";
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
      }, {})
    : {};

  const selectedProcesses = selectedFunction
    ? Array.from(selectedProcessIds)
        .map((id) => selectedFunction.processes.find((p) => p.id === id))
        .filter(Boolean) as ProcessMeta[]
    : [];

  // ── Stepper ──
  const stepDefs: StepDef[] = STEPS.map((s, i) => ({
    id: s.id,
    label: s.label,
    shortLabel: s.shortLabel,
    status:
      s.id === step
        ? "active"
        : i < currentStepIndex
        ? "completed"
        : canNavigateTo(i)
        ? "available"
        : "disabled",
  }));

  const stepNav = (
    <EngagementStepper steps={stepDefs} onStepClick={(id) => navigateTo(id as Step)} />
  );

  // ════════════════════════════════════════
  // Shared layout wrapper
  // ════════════════════════════════════════
  const SplitLayout = ({
    form,
    context,
  }: {
    form: React.ReactNode;
    context: React.ReactNode;
  }) => (
    <div className="max-w-[1100px] mx-auto">
      {stepNav}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div>{form}</div>
        <div className="hidden lg:block">
          <div className="sticky top-6">{context}</div>
        </div>
      </div>
    </div>
  );

  // ════════════════════════════════════════
  // Step 1: Company Profile
  // ════════════════════════════════════════
  if (step === "company-info") {
    const companyInitials = formData.companyName
      ? formData.companyName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()
      : "";

    return (
      <SplitLayout
        form={
          <div className="border rounded-xl bg-card p-6 space-y-6">
            {/* Public / Private */}
            <div>
              <label className="block text-sm font-medium mb-2">Company Type *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: false, label: "Private" },
                  { value: true, label: "Public" },
                ].map((opt) => (
                  <button
                    key={String(opt.value)}
                    type="button"
                    onClick={() => {
                      setFormData({
                        ...formData,
                        isPublic: opt.value,
                        tickerSymbol: opt.value ? formData.tickerSymbol : "",
                      });
                      if (!opt.value) setSicInfo(null);
                    }}
                    className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      formData.isPublic === opt.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    <Building2 className="h-4 w-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Public company picker */}
            {formData.isPublic && (
              <PublicCompanyPicker
                value={formData.tickerSymbol || ""}
                onSelect={(ticker, companyName) => {
                  setFormData((prev) => ({ ...prev, tickerSymbol: ticker, companyName }));
                  fetch(`/api/edgar/sic?ticker=${encodeURIComponent(ticker)}`)
                    .then((r) => r.ok ? r.json() : null)
                    .then((data) => {
                      if (data) {
                        setSicInfo({ sic: data.sic, sicDescription: data.sicDescription });
                        if (data.subSector) {
                          setFormData((prev) => ({
                            ...prev,
                            subSector: prev.subSector || data.subSector,
                          }));
                        }
                      }
                    })
                    .catch(() => {});
                }}
              />
            )}

            {/* Company Name */}
            <div>
              <label className="block text-sm font-medium mb-2">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder={formData.isPublic ? "Auto-filled from selection above" : "Acme Corp"}
              />
            </div>

            {/* Private company financials */}
            {!formData.isPublic && (
              <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                <p className="text-sm font-medium">Company Financials</p>
                <p className="text-xs text-muted-foreground -mt-2">
                  Help us build a baseline profile for the assessment
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium mb-1">Annual Revenue</label>
                    <input
                      type="text"
                      value={formData.revenue || ""}
                      onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., $50M"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Revenue Growth (YoY)</label>
                    <input
                      type="text"
                      value={formData.revenueGrowth || ""}
                      onChange={(e) => setFormData({ ...formData, revenueGrowth: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g., 25%"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Headcount</label>
                  <input
                    type="text"
                    value={formData.headcount || ""}
                    onChange={(e) => setFormData({ ...formData, headcount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., 250"
                  />
                </div>
              </div>
            )}

            {/* Technology Sub-Sector */}
            <div>
              <label className="block text-sm font-medium mb-2">Technology Sub-Sector *</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TECH_SUB_SECTORS.map((sector) => (
                  <button
                    key={sector}
                    type="button"
                    onClick={() => setFormData({ ...formData, subSector: sector })}
                    className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                      formData.subSector === sector
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-accent"
                    }`}
                  >
                    {sector}
                  </button>
                ))}
              </div>
              {sicInfo && formData.subSector && (
                <p className="text-xs text-primary mt-2">
                  Auto-detected from SEC filings (SIC {sicInfo.sic})
                </p>
              )}
            </div>

            <Button
              onClick={() => navigateTo("function-selection")}
              disabled={!step1Complete}
              className="w-full"
              size="lg"
            >
              Continue to Function Selection
            </Button>
          </div>
        }
        context={
          <div className="space-y-4">
            {/* Company preview card */}
            {formData.companyName ? (
              <div className="border rounded-xl bg-card p-5">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                  Company Preview
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {companyInitials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{formData.companyName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formData.isPublic && formData.tickerSymbol
                        ? `${formData.tickerSymbol} · `
                        : ""}
                      {formData.subSector || "Sub-sector not selected"}
                    </p>
                  </div>
                </div>
                {sicInfo && (
                  <div className="text-xs space-y-1.5 pt-3 border-t">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">SIC Code</span>
                      <span className="font-medium">{sicInfo.sic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Industry</span>
                      <span className="font-medium text-right max-w-[180px] truncate">{sicInfo.sicDescription}</span>
                    </div>
                  </div>
                )}
                {!formData.isPublic && (formData.revenue || formData.headcount) && (
                  <div className="text-xs space-y-1.5 pt-3 border-t">
                    {formData.revenue && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Revenue</span>
                        <span className="font-medium">{formData.revenue}</span>
                      </div>
                    )}
                    {formData.headcount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Headcount</span>
                        <span className="font-medium">{formData.headcount}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="border border-dashed rounded-xl p-5 text-center">
                <Building2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  Company preview will appear here
                </p>
              </div>
            )}

            {/* What we'll do */}
            <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                {formData.isPublic ? "What we'll pull" : "What we'll generate"}
              </p>
              <div className="space-y-3">
                {formData.isPublic ? (
                  <>
                    <div className="flex items-start gap-2.5">
                      <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground/80">
                        <span className="font-medium">SEC EDGAR Financials</span> — Revenue, margins, R&D/S&M/G&A, balance sheet
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Users className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground/80">
                        <span className="font-medium">Peer Comparison</span> — SIC-based peers with financial benchmarks
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground/80">
                        <span className="font-medium">AI Analysis</span> — Executive team, market commentary, competitive positioning
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-2.5">
                      <Bot className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground/80">
                        <span className="font-medium">AI Diagnostic</span> — Company archetype, challenges, automation opportunity
                      </p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <BarChart3 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-foreground/80">
                        <span className="font-medium">Industry Benchmarks</span> — Benchmarks for {formData.subSector || "your sub-sector"} companies
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        }
      />
    );
  }

  // ════════════════════════════════════════
  // Step 2: Function & Process Selection
  // ════════════════════════════════════════
  if (step === "function-selection") {
    return (
      <SplitLayout
        form={
          <div className="border rounded-xl bg-card p-6 space-y-8">
            {/* Function Grid */}
            <div>
              <h2 className="text-lg font-medium mb-4">Select a Function</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {FUNCTIONS.map((func) => {
                  const Icon = FUNCTION_ICONS[func.icon];
                  const available = hasAvailableProcess(func);
                  const isSelected = selectedFunction?.id === func.id;

                  return (
                    <button
                      key={func.id}
                      type="button"
                      onClick={() => handleFunctionSelect(func)}
                      disabled={!available}
                      className={`relative flex flex-col items-center gap-2 p-4 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-md"
                          : available
                          ? "bg-card hover:bg-accent hover:border-primary/30 cursor-pointer"
                          : "bg-muted/30 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      {Icon && <Icon className="h-6 w-6" />}
                      <span className="text-sm font-medium">{func.name}</span>
                      {!available && (
                        <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                          Coming Soon
                        </Badge>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Process Checkboxes */}
            {selectedFunction && (
              <div>
                <h2 className="text-lg font-medium mb-4">
                  Select Processes in {selectedFunction.name}
                </h2>
                <div className="space-y-4">
                  {Object.entries(groupedProcesses).map(([group, processes]) => (
                    <div key={group}>
                      {Object.keys(groupedProcesses).length > 1 && (
                        <h3 className="text-sm font-medium text-muted-foreground mb-2">{group}</h3>
                      )}
                      <div className="space-y-2">
                        {processes.map((process) => (
                          <label
                            key={process.id}
                            className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                              process.available
                                ? selectedProcessIds.has(process.id)
                                  ? "bg-primary/5 border-primary/30"
                                  : "bg-card hover:bg-accent cursor-pointer"
                                : "bg-muted/20 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <Checkbox
                              checked={selectedProcessIds.has(process.id)}
                              onCheckedChange={() => handleProcessToggle(process.id)}
                              disabled={!process.available}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">{process.name}</span>
                                {!process.available && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    Coming Soon
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{process.description}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={() => navigateTo("process-details")}
              disabled={!step2Complete}
              className="w-full"
              size="lg"
            >
              Continue to Process Details
            </Button>
          </div>
        }
        context={
          <div className="space-y-4">
            {/* Company summary card */}
            <div className="border rounded-xl bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Company
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                  {formData.companyName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="font-semibold text-sm">{formData.companyName}</p>
                  <p className="text-xs text-muted-foreground">
                    {formData.isPublic ? `${formData.tickerSymbol} · ` : ""}{formData.subSector}
                  </p>
                </div>
              </div>
            </div>

            {/* Selection preview */}
            <div className="border rounded-xl bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Your Assessment
              </p>
              {selectedProcessIds.size === 0 ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="h-6 w-6 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-xs text-muted-foreground">
                    Select processes to see what you&apos;ll assess
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {selectedProcesses.map((process) => {
                    const workflow = getWorkflow(process.id as WorkflowId);
                    const stepCount = workflow?.steps.length || 0;
                    return (
                      <div key={process.id} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="text-sm font-medium">{process.name}</span>
                        </div>
                        {stepCount > 0 && (
                          <span className="text-xs text-muted-foreground">{stepCount} steps</span>
                        )}
                      </div>
                    );
                  })}
                  <div className="pt-2.5 border-t mt-2.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">Total processes</span>
                      <span className="font-semibold">{selectedProcessIds.size}</span>
                    </div>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-muted-foreground">Total steps</span>
                      <span className="font-semibold">
                        {selectedProcesses.reduce((sum, p) => {
                          const w = getWorkflow(p.id as WorkflowId);
                          return sum + (w?.steps.length || 0);
                        }, 0)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* What's next hint */}
            <div className="rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Next step
              </p>
              <div className="flex items-start gap-2.5">
                <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <p className="text-xs text-foreground/80">
                  You&apos;ll add process details, upload interview transcripts, and Lighthouse will generate an AI diagnostic.
                </p>
              </div>
            </div>
          </div>
        }
      />
    );
  }

  // ════════════════════════════════════════
  // Step 3: Process Details + Transcripts
  // ════════════════════════════════════════
  return (
    <SplitLayout
      form={
        <div className="border rounded-xl bg-card p-6 space-y-6">
          {/* Transcript Upload — first */}
          <div className="space-y-3 p-4 border rounded-lg bg-muted/20">
            <div>
              <h3 className="text-sm font-medium">Interview Transcripts</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Optional</p>
            </div>
            <TranscriptUploadPanel
              transcripts={pendingTranscripts}
              onTranscriptsChange={handleTranscriptsChange}
              description="Upload transcripts from client conversations. Lighthouse will extract insights and auto-populate the fields below."
            />
          </div>

          {/* Per-process core fields */}
          {selectedProcesses.map((process, idx) => {
            const ctx = processContexts[process.id] || {};

            return (
              <div key={process.id} className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium">{process.name}</h2>
                  <p className="text-xs text-muted-foreground">{process.description}</p>
                </div>

                {CORE_PROCESS_QUESTIONS.map((q) => {
                  const isAutoFilled = lastExtraction && q.key !== "consultantNotes" && ctx[q.key] && (
                    (q.key === "erp" && lastExtraction.erp) ||
                    (q.key === "teamSize" && lastExtraction.teamSize) ||
                    (q.key === "costPerPerson" && lastExtraction.costPerPerson)
                  );

                  return (
                    <div key={q.key}>
                      <label className="block text-sm font-medium mb-1">
                        {q.label}
                        {isAutoFilled && (
                          <Badge variant="secondary" className="ml-2 text-[10px] bg-primary/10 text-primary border-primary/20">
                            from transcript
                          </Badge>
                        )}
                      </label>
                      {q.type === "textarea" ? (
                        <textarea
                          value={ctx[q.key] || ""}
                          onChange={(e) => updateProcessContext(process.id, q.key, e.target.value)}
                          rows={3}
                          className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder={q.placeholder}
                        />
                      ) : (
                        <input
                          type="text"
                          value={ctx[q.key] || ""}
                          onChange={(e) => updateProcessContext(process.id, q.key, e.target.value)}
                          className={`w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                            isAutoFilled ? "border-primary/30 bg-primary/5" : ""
                          }`}
                          placeholder={q.placeholder}
                        />
                      )}
                    </div>
                  );
                })}

                {idx < selectedProcesses.length - 1 && <hr className="border-dashed" />}
              </div>
            );
          })}

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
              {error}
            </div>
          )}

          <Button onClick={handleSubmit} disabled={isLoading} className="w-full" size="lg">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating AI diagnostic...
              </>
            ) : (
              "Create Assessment"
            )}
          </Button>
        </div>
      }
      context={
        <div className="space-y-4">
          {/* Transcript extraction preview */}
          {lastExtraction && (pendingTranscripts.length > 0) ? (
            <div className="border rounded-xl bg-card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Transcript Extraction
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Auto-detected from {pendingTranscripts.length} uploaded transcript{pendingTranscripts.length > 1 ? "s" : ""}:
              </p>

              {lastExtraction.systemsList.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Wrench className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-foreground/70">Systems Found</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lastExtraction.systemsList.map((s) => (
                      <span key={s} className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[11px] font-semibold text-primary">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lastExtraction.teamMentions.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Hash className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-foreground/70">Team Size</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lastExtraction.teamMentions.map((m, i) => (
                      <span key={i} className="inline-flex items-center px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[11px] font-semibold text-primary">
                        &ldquo;{m}&rdquo;
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {lastExtraction.themes.length > 0 && (
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Sparkles className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[11px] font-semibold text-foreground/70">Key Themes</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {lastExtraction.themes.map((t) => (
                      <span key={t} className="inline-flex items-center px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[11px] font-medium text-amber-700 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-[11px] text-muted-foreground mt-3 pt-3 border-t">
                Full AI analysis (maturity signals, per-step evidence) will run after assessment is created.
              </div>
            </div>
          ) : (
            <div className="border border-dashed rounded-xl p-5 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">
                Upload transcripts to see extracted insights here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Systems, team size, and key themes will be auto-detected
              </p>
            </div>
          )}

          {/* Assessment summary */}
          <div className="border rounded-xl bg-card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Assessment Summary
            </p>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                {formData.companyName.split(" ").map((w) => w[0]).join("").substring(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-sm">{formData.companyName}</p>
                <p className="text-xs text-muted-foreground">{formData.subSector}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              {selectedProcesses.map((p) => (
                <div key={p.id} className="flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                  <span>{p.name}</span>
                </div>
              ))}
            </div>
            {pendingTranscripts.length > 0 && (
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                {pendingTranscripts.length} transcript{pendingTranscripts.length > 1 ? "s" : ""} attached
              </div>
            )}
          </div>
        </div>
      }
    />
  );
}
