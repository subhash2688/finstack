"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClientContext } from "@/types/engagement";
import { FUNCTIONS, FunctionId, Function as FunctionType, ProcessMeta } from "@/types/function";
import { generateEngagementId, saveEngagement } from "@/lib/storage/engagements";
import { generateAIDiagnostic } from "@/lib/ai/diagnostic-generator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  TECH_SUB_SECTORS,
  PROCESS_QUESTIONS,
  DEFAULT_PROCESS_QUESTIONS,
} from "@/lib/data/process-questions";
import {
  DollarSign,
  TrendingUp,
  Microscope,
  Users,
  Scale,
  Loader2,
  Building2,
  Check,
} from "lucide-react";

const FUNCTION_ICONS: Record<string, React.ElementType> = {
  DollarSign,
  TrendingUp,
  Microscope,
  Users,
  Scale,
};

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

  // Track the furthest step reached (so we know which steps are clickable)
  const [furthestStep, setFurthestStep] = useState(0); // index into STEPS

  // Step 1 — company profile
  const [formData, setFormData] = useState<ClientContext>({
    companyName: "",
    industry: "Technology",
    subSector: "",
    isPublic: false,
    tickerSymbol: "",
    companySize: "mid-market",
  });

  // Step 2 — function & process selection
  const [selectedFunction, setSelectedFunction] = useState<FunctionType | null>(null);
  const [selectedProcessIds, setSelectedProcessIds] = useState<Set<string>>(new Set());

  // Step 3 — process-specific context (processId → { key → value })
  const [processContexts, setProcessContexts] = useState<Record<string, Record<string, string>>>({});

  // ── Validation ──
  const step1Complete =
    formData.companyName.trim() !== "" &&
    formData.subSector !== "";

  const step2Complete = selectedProcessIds.size > 0;

  // ── Navigation ──
  const currentStepIndex = STEPS.findIndex((s) => s.id === step);

  const navigateTo = (targetStep: Step) => {
    const targetIndex = STEPS.findIndex((s) => s.id === targetStep);

    // Initialize process contexts when entering step 3
    if (targetStep === "process-details") {
      const updated = { ...processContexts };
      Array.from(selectedProcessIds).forEach((pid) => {
        if (!updated[pid]) updated[pid] = {};
      });
      setProcessContexts(updated);
    }

    setStep(targetStep);
    if (targetIndex > furthestStep) {
      setFurthestStep(targetIndex);
    }
  };

  const canNavigateTo = (targetIndex: number): boolean => {
    // Always can go back to a visited step
    if (targetIndex <= furthestStep) return true;
    // Can go forward one step if current step is valid
    if (targetIndex === 1 && step1Complete) return true;
    if (targetIndex === 2 && step1Complete && step2Complete) return true;
    return false;
  };

  // ── Step 2 helpers ──
  const hasAvailableProcess = (func: FunctionType) =>
    func.processes.some((p) => p.available);

  const handleFunctionSelect = (func: FunctionType) => {
    if (!hasAvailableProcess(func)) return;
    if (selectedFunction?.id === func.id) return;
    setSelectedFunction(func);
    setSelectedProcessIds(new Set());
  };

  const handleProcessToggle = (processId: string) => {
    setSelectedProcessIds((prev) => {
      const next = new Set(prev);
      if (next.has(processId)) {
        next.delete(processId);
      } else {
        next.add(processId);
      }
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
      const clientContext: ClientContext = {
        ...formData,
        functionId: selectedFunction.id,
      };

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

  // Group processes by their group field
  const groupedProcesses = selectedFunction
    ? selectedFunction.processes.reduce<Record<string, ProcessMeta[]>>((acc, p) => {
        const group = p.group || "General";
        if (!acc[group]) acc[group] = [];
        acc[group].push(p);
        return acc;
      }, {})
    : {};

  // Selected process list (for step 3)
  const selectedProcesses = selectedFunction
    ? Array.from(selectedProcessIds)
        .map((id) => selectedFunction.processes.find((p) => p.id === id))
        .filter(Boolean) as ProcessMeta[]
    : [];

  // ── Step Nav Bar ──
  const stepNav = (
    <nav className="mb-8">
      <div className="flex items-center gap-0">
        {STEPS.map((s, i) => {
          const isActive = s.id === step;
          const isCompleted = i < currentStepIndex;
          const isClickable = canNavigateTo(i);

          return (
            <div key={s.id} className="flex items-center">
              {i > 0 && (
                <div
                  className={`w-8 sm:w-12 h-px mx-1 ${
                    i <= currentStepIndex ? "bg-primary" : "bg-border"
                  }`}
                />
              )}
              <button
                type="button"
                onClick={() => isClickable && navigateTo(s.id)}
                disabled={!isClickable}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : isCompleted
                    ? "bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                    : isClickable
                    ? "bg-muted text-foreground hover:bg-accent cursor-pointer"
                    : "bg-muted/50 text-muted-foreground cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex items-center justify-center h-5 w-5 rounded-full text-xs ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted-foreground/20 text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className="hidden sm:inline">{s.label}</span>
                <span className="sm:hidden">{s.shortLabel}</span>
              </button>
            </div>
          );
        })}
      </div>
    </nav>
  );

  // ════════════════════════════════════════
  // Step 1: Company Profile
  // ════════════════════════════════════════
  if (step === "company-info") {
    return (
      <div className="max-w-2xl mx-auto">
        {stepNav}
        <div className="space-y-6">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Company Name *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Acme Corp"
            />
          </div>

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
                  onClick={() =>
                    setFormData({
                      ...formData,
                      isPublic: opt.value,
                      tickerSymbol: opt.value ? formData.tickerSymbol : "",
                    })
                  }
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

          {/* Ticker Symbol — public only */}
          {formData.isPublic && (
            <div>
              <label className="block text-sm font-medium mb-2">Ticker Symbol</label>
              <input
                type="text"
                value={formData.tickerSymbol || ""}
                onChange={(e) =>
                  setFormData({ ...formData, tickerSymbol: e.target.value.toUpperCase() })
                }
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 uppercase"
                placeholder="e.g., AAPL"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                We&apos;ll use this to pull publicly available financial data
              </p>
            </div>
          )}

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
          </div>

          {/* Company Size */}
          <div>
            <label className="block text-sm font-medium mb-2">Company Size *</label>
            <div className="grid grid-cols-4 gap-2">
              {(["startup", "smb", "mid-market", "enterprise"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setFormData({ ...formData, companySize: size })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    formData.companySize === size
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  {size === "smb" ? "SMB" : size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
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
      </div>
    );
  }

  // ════════════════════════════════════════
  // Step 2: Function & Process Selection
  // ════════════════════════════════════════
  if (step === "function-selection") {
    return (
      <div className="max-w-3xl mx-auto">
        {stepNav}
        <div className="space-y-8">
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
                      <h3 className="text-sm font-medium text-muted-foreground mb-2">
                        {group}
                      </h3>
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
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {process.description}
                            </p>
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
      </div>
    );
  }

  // ════════════════════════════════════════
  // Step 3: Process-Specific Intake
  // ════════════════════════════════════════
  return (
    <div className="max-w-2xl mx-auto">
      {stepNav}
      <div className="space-y-8">
        {/* Per-process question sections */}
        {selectedProcesses.map((process, idx) => {
          const questions = PROCESS_QUESTIONS[process.id] || DEFAULT_PROCESS_QUESTIONS;
          const ctx = processContexts[process.id] || {};

          return (
            <div key={process.id} className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">{process.name}</h2>
                <p className="text-xs text-muted-foreground">{process.description}</p>
              </div>

              {questions.map((q) => (
                <div key={q.key}>
                  <label className="block text-sm font-medium mb-1">{q.label}</label>
                  {q.type === "select" ? (
                    <select
                      value={ctx[q.key] || ""}
                      onChange={(e) => updateProcessContext(process.id, q.key, e.target.value)}
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                      <option value="">Select...</option>
                      {q.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : q.type === "textarea" ? (
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
                      className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder={q.placeholder}
                    />
                  )}
                </div>
              ))}

              {idx < selectedProcesses.length - 1 && <hr className="border-dashed" />}
            </div>
          );
        })}

        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isLoading}
          className="w-full"
          size="lg"
        >
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
    </div>
  );
}
