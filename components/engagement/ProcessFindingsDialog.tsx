"use client";

import { ProcessFindings } from "@/types/findings";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ProcessFindingsInline } from "@/components/engagement/ProcessFindingsInline";

interface ProcessFindingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  findings: ProcessFindings;
}

export function ProcessFindingsDialog({
  open,
  onOpenChange,
  findings,
}: ProcessFindingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{findings.processName} — Findings</DialogTitle>
          <DialogDescription>
            Based on {findings.assessedStepCount} of {findings.totalStepCount} steps assessed
            {" · "}{findings.teamSize} team member{findings.teamSize !== 1 ? "s" : ""}
          </DialogDescription>
        </DialogHeader>
        <ProcessFindingsInline findings={findings} />
      </DialogContent>
    </Dialog>
  );
}
