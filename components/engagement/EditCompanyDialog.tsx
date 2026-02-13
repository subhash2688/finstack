"use client";

import { useState } from "react";
import { ClientContext } from "@/types/engagement";
import { TECH_SUB_SECTORS } from "@/lib/data/process-questions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PublicCompanyPicker } from "@/components/engagement/PublicCompanyPicker";
import { Building2 } from "lucide-react";

interface EditCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientContext: ClientContext;
  onSave: (updated: ClientContext) => void;
}

export function EditCompanyDialog({
  open,
  onOpenChange,
  clientContext,
  onSave,
}: EditCompanyDialogProps) {
  const [form, setForm] = useState<ClientContext>({ ...clientContext });

  // Reset form when dialog opens
  const handleOpenChange = (next: boolean) => {
    if (next) setForm({ ...clientContext });
    onOpenChange(next);
  };

  const handleSave = () => {
    onSave(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Company Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium mb-2">Company Name *</label>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Acme Corp"
            />
          </div>

          {/* Public / Private */}
          <div>
            <label className="block text-sm font-medium mb-2">Company Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: false, label: "Private" },
                { value: true, label: "Public" },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      isPublic: opt.value,
                      tickerSymbol: opt.value ? form.tickerSymbol : "",
                    })
                  }
                  className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    form.isPublic === opt.value
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
          {form.isPublic && (
            <PublicCompanyPicker
              value={form.tickerSymbol || ""}
              onSelect={(ticker, companyName) =>
                setForm({ ...form, tickerSymbol: ticker, companyName })
              }
            />
          )}

          {/* Private company financials */}
          {!form.isPublic && (
            <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
              <p className="text-sm font-medium">Company Financials</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Annual Revenue</label>
                  <input
                    type="text"
                    value={form.revenue || ""}
                    onChange={(e) => setForm({ ...form, revenue: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., $50M"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Revenue Growth (YoY)</label>
                  <input
                    type="text"
                    value={form.revenueGrowth || ""}
                    onChange={(e) => setForm({ ...form, revenueGrowth: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="e.g., 25%"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Headcount</label>
                <input
                  type="text"
                  value={form.headcount || ""}
                  onChange={(e) => setForm({ ...form, headcount: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g., 250"
                />
              </div>
            </div>
          )}

          {/* Technology Sub-Sector */}
          <div>
            <label className="block text-sm font-medium mb-2">Technology Sub-Sector</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TECH_SUB_SECTORS.map((sector) => (
                <button
                  key={sector}
                  type="button"
                  onClick={() => setForm({ ...form, subSector: sector })}
                  className={`px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                    form.subSector === sector
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
            <label className="block text-sm font-medium mb-2">Company Size</label>
            <div className="grid grid-cols-4 gap-2">
              {(["startup", "smb", "mid-market", "enterprise"] as const).map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => setForm({ ...form, companySize: size })}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    form.companySize === size
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-accent"
                  }`}
                >
                  {size === "smb" ? "SMB" : size.charAt(0).toUpperCase() + size.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!form.companyName.trim()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
