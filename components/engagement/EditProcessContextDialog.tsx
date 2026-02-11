"use client";

import { useState } from "react";
import {
  PROCESS_QUESTIONS,
  DEFAULT_PROCESS_QUESTIONS,
} from "@/lib/data/process-questions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface EditProcessContextDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processId: string;
  processName: string;
  context: Record<string, string>;
  onSave: (processId: string, context: Record<string, string>) => void;
}

export function EditProcessContextDialog({
  open,
  onOpenChange,
  processId,
  processName,
  context,
  onSave,
}: EditProcessContextDialogProps) {
  const [form, setForm] = useState<Record<string, string>>({ ...context });

  const handleOpenChange = (next: boolean) => {
    if (next) setForm({ ...context });
    onOpenChange(next);
  };

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave(processId, form);
    onOpenChange(false);
  };

  const questions = PROCESS_QUESTIONS[processId] || DEFAULT_PROCESS_QUESTIONS;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {processName} Context</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {questions.map((q) => (
            <div key={q.key}>
              <label className="block text-sm font-medium mb-1">{q.label}</label>
              {q.type === "select" ? (
                <select
                  value={form[q.key] || ""}
                  onChange={(e) => updateField(q.key, e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="">Select...</option>
                  {q.options?.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : q.type === "textarea" ? (
                <textarea
                  value={form[q.key] || ""}
                  onChange={(e) => updateField(q.key, e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={q.placeholder}
                />
              ) : (
                <input
                  type="text"
                  value={form[q.key] || ""}
                  onChange={(e) => updateField(q.key, e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder={q.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
