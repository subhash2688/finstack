"use client";

import { useState } from "react";
import { MaturityLevel } from "@/types/workflow";
import { Engagement } from "@/types/engagement";
import { saveLightweightEngagement } from "@/lib/storage/engagements";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SaveEngagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ratings: Record<string, MaturityLevel>;
  processId: string;
  processName: string;
  functionId: string;
  onSaved: (engagement: Engagement) => void;
}

export function SaveEngagementDialog({
  open,
  onOpenChange,
  ratings,
  processId,
  processName,
  functionId,
  onSaved,
}: SaveEngagementDialogProps) {
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState<
    "startup" | "smb" | "mid-market" | "enterprise"
  >("mid-market");
  const [erp, setErp] = useState("");

  const handleSave = () => {
    if (!name.trim()) return;
    const engagement = saveLightweightEngagement({
      name: name.trim(),
      industry: industry.trim() || undefined,
      companySize,
      erp: erp.trim() || undefined,
      processId,
      processName,
      functionId,
      maturityRatings: ratings,
    });
    onSaved(engagement);
    onOpenChange(false);
    setName("");
    setIndustry("");
    setErp("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save as Engagement</DialogTitle>
          <DialogDescription>
            Save your maturity ratings so you can return to them later.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Engagement Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="e.g., Acme Corp AP Assessment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Industry <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input
              placeholder="e.g., Manufacturing, Healthcare"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Company Size <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={companySize}
              onChange={(e) =>
                setCompanySize(
                  e.target.value as "startup" | "smb" | "mid-market" | "enterprise"
                )
              }
            >
              <option value="startup">Startup</option>
              <option value="smb">SMB</option>
              <option value="mid-market">Mid-Market</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              ERP System <span className="text-muted-foreground text-xs">(optional)</span>
            </label>
            <Input
              placeholder="e.g., SAP, Oracle NetSuite, QuickBooks"
              value={erp}
              onChange={(e) => setErp(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            Save Engagement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
