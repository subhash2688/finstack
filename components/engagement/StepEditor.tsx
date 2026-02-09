"use client";

import { WorkflowStep } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Trash2 } from "lucide-react";

interface StepEditorProps {
  step: WorkflowStep;
  onUpdate: (step: WorkflowStep) => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export function StepEditor({
  step,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: StepEditorProps) {
  const updateField = (field: keyof WorkflowStep, value: any) => {
    onUpdate({ ...step, [field]: value });
  };

  return (
    <div className="border rounded-lg p-6 bg-card space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1 space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Step Number
            </label>
            <input
              type="number"
              value={step.stepNumber}
              onChange={(e) => updateField("stepNumber", parseInt(e.target.value))}
              className="w-20 px-3 py-1 border rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Title
            </label>
            <input
              type="text"
              value={step.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Description
            </label>
            <textarea
              value={step.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border rounded text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Abbreviation
            </label>
            <input
              type="text"
              value={step.abbreviation}
              onChange={(e) => updateField("abbreviation", e.target.value)}
              className="w-24 px-3 py-1 border rounded text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
