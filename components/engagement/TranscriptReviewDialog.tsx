"use client";

import { useState } from "react";
import { TranscriptAnalysis, TranscriptReviewDecision } from "@/types/transcript";
import { MaturityLevel } from "@/types/workflow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TranscriptQuoteCard } from "./TranscriptQuoteCard";
import { TranscriptCoverageBar } from "./TranscriptCoverageBar";
import {
  ChevronDown,
  ChevronRight,
  Users,
  Wrench,
  BarChart3,
  Lightbulb,
} from "lucide-react";

const MATURITY_COLORS: Record<MaturityLevel, string> = {
  manual: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  "semi-automated": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  automated: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  low: "bg-muted text-muted-foreground",
};

interface TranscriptReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  analysis: TranscriptAnalysis;
  onApply: (decisions: TranscriptReviewDecision[]) => void;
}

export function TranscriptReviewDialog({
  open,
  onOpenChange,
  analysis,
  onApply,
}: TranscriptReviewDialogProps) {
  // Track which steps the user accepts
  const [accepted, setAccepted] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    analysis.stepEvidence.forEach((step) => {
      if (step.covered && step.suggestedMaturity) {
        initial[step.stepId] = true; // Pre-accept covered steps with maturity
      }
    });
    return initial;
  });

  // Track which steps are expanded
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    analysis.stepEvidence.forEach((step) => {
      initial[step.stepId] = step.covered; // Expand covered, collapse uncovered
    });
    return initial;
  });

  const toggleAccepted = (stepId: string) => {
    setAccepted((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const toggleExpanded = (stepId: string) => {
    setExpanded((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const acceptedCount = Object.values(accepted).filter(Boolean).length;

  const handleApply = () => {
    const decisions: TranscriptReviewDecision[] = analysis.stepEvidence
      .filter((step) => step.covered && step.suggestedMaturity)
      .map((step) => ({
        stepId: step.stepId,
        accepted: !!accepted[step.stepId],
        appliedMaturity: accepted[step.stepId]
          ? (step.suggestedMaturity as MaturityLevel)
          : undefined,
      }));
    onApply(decisions);
  };

  const coveredSteps = analysis.stepEvidence.filter((s) => s.covered);
  const uncoveredSteps = analysis.stepEvidence.filter((s) => !s.covered);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Transcript Analysis Review</DialogTitle>
          <DialogDescription>{analysis.fileName}</DialogDescription>

          {/* Summary */}
          <p className="text-sm text-foreground mt-2">{analysis.summary}</p>

          {/* Meta badges */}
          <div className="flex flex-wrap gap-2 mt-3">
            {analysis.interviewParticipants.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <Users className="h-3 w-3" />
                {analysis.interviewParticipants.join(", ")}
              </div>
            )}
            {analysis.meta.toolSystemMentions.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <Wrench className="h-3 w-3" />
                {analysis.meta.toolSystemMentions.slice(0, 4).join(", ")}
              </div>
            )}
            {analysis.meta.volumeMetrics.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <BarChart3 className="h-3 w-3" />
                {analysis.meta.volumeMetrics.slice(0, 2).join(", ")}
              </div>
            )}
            {analysis.meta.keyThemes.length > 0 && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <Lightbulb className="h-3 w-3" />
                {analysis.meta.keyThemes.slice(0, 3).join(", ")}
              </div>
            )}
          </div>

          {/* Coverage bar */}
          <div className="mt-3">
            <TranscriptCoverageBar stepEvidence={analysis.stepEvidence} />
          </div>
        </DialogHeader>

        {/* Scrollable step list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {/* Covered steps */}
          {coveredSteps.map((step) => (
            <div
              key={step.stepId}
              className="border rounded-lg overflow-hidden"
            >
              {/* Step header */}
              <button
                onClick={() => toggleExpanded(step.stepId)}
                className="w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors text-left"
              >
                {expanded[step.stepId] ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                )}

                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{step.stepTitle}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {step.suggestedMaturity && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${MATURITY_COLORS[step.suggestedMaturity]}`}
                    >
                      {step.suggestedMaturity}
                    </Badge>
                  )}
                  {step.maturityConfidence && (
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${CONFIDENCE_COLORS[step.maturityConfidence]}`}
                    >
                      {step.maturityConfidence} conf.
                    </Badge>
                  )}
                </div>

                {step.suggestedMaturity && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0"
                  >
                    <Checkbox
                      checked={!!accepted[step.stepId]}
                      onCheckedChange={() => toggleAccepted(step.stepId)}
                    />
                  </div>
                )}
              </button>

              {/* Expanded content */}
              {expanded[step.stepId] && (
                <div className="px-4 pb-4 space-y-3 border-t bg-muted/20">
                  {/* Pain points */}
                  {step.painPoints.length > 0 && (
                    <div className="pt-3">
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Pain Points
                      </p>
                      <ul className="space-y-1">
                        {step.painPoints.map((p, i) => (
                          <li
                            key={i}
                            className="text-sm text-foreground/80 flex items-start gap-1.5"
                          >
                            <span className="text-destructive mt-0.5">*</span>
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Workarounds */}
                  {step.workarounds.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Workarounds
                      </p>
                      <ul className="space-y-1">
                        {step.workarounds.map((w, i) => (
                          <li
                            key={i}
                            className="text-sm text-foreground/80 flex items-start gap-1.5"
                          >
                            <span className="text-amber-500 mt-0.5">~</span>
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Automation signals */}
                  {step.automationSignals.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1">
                        Automation Signals
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {step.automationSignals.map((s, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Quotes */}
                  {step.quotes.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">
                        Evidence
                      </p>
                      <div className="space-y-3">
                        {step.quotes.map((q, i) => (
                          <TranscriptQuoteCard key={i} quote={q} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Uncovered steps */}
          {uncoveredSteps.length > 0 && (
            <div className="pt-2">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Not covered in transcript ({uncoveredSteps.length} steps)
              </p>
              <div className="space-y-1">
                {uncoveredSteps.map((step) => (
                  <div
                    key={step.stepId}
                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 text-sm text-muted-foreground"
                  >
                    <div className="h-2 w-2 rounded-full bg-muted" />
                    {step.stepTitle}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={acceptedCount === 0}>
            Apply {acceptedCount} Accepted
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
