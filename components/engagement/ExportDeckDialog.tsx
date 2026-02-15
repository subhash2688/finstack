"use client";

import { useState } from "react";
import { Engagement } from "@/types/engagement";
import { DeckConfig, DeckSection, DEFAULT_SECTIONS } from "@/lib/deck/alix-theme";
import { generateDeck } from "@/lib/deck/deck-generator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Loader2 } from "lucide-react";

interface ExportDeckDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  engagement: Engagement;
}

export function ExportDeckDialog({ open, onOpenChange, engagement }: ExportDeckDialogProps) {
  const [sections, setSections] = useState<DeckSection[]>(() =>
    DEFAULT_SECTIONS.map((s) => ({ ...s }))
  );
  const [confidential, setConfidential] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSection = (id: DeckSection["id"]) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        // Toggle: if currently in the list as included, remove it; otherwise add it
        return { ...s, defaultIncluded: !s.defaultIncluded };
      })
    );
  };

  const setDepth = (id: DeckSection["id"], depth: "summary" | "detailed") => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, depth } : s))
    );
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const config: DeckConfig = {
        sections: sections.filter((s) => s.defaultIncluded),
        includeConfidentialWatermark: confidential,
      };
      await generateDeck(engagement, config);
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Deck generation failed:", err);
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const includedCount = sections.filter((s) => s.defaultIncluded).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export Assessment Deck</DialogTitle>
          <DialogDescription>
            Select sections and depth level for the PowerPoint export.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
          {sections.map((section) => (
            <div
              key={section.id}
              className="flex items-start gap-3 py-2 border-b last:border-0"
            >
              {/* Checkbox */}
              <Checkbox
                id={`section-${section.id}`}
                checked={section.defaultIncluded}
                onCheckedChange={() => toggleSection(section.id)}
                className="mt-0.5"
              />

              {/* Label + description */}
              <div className="flex-1 min-w-0">
                <label
                  htmlFor={`section-${section.id}`}
                  className="text-sm font-medium cursor-pointer"
                >
                  {section.label}
                </label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {section.description}
                </p>
              </div>

              {/* Depth toggle */}
              <div className="flex items-center gap-2 shrink-0">
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`depth-${section.id}`}
                    checked={section.depth === "summary"}
                    onChange={() => setDepth(section.id, "summary")}
                    disabled={!section.defaultIncluded}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className={`text-xs ${section.defaultIncluded ? "text-foreground" : "text-muted-foreground"}`}>
                    Summary
                  </span>
                </label>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input
                    type="radio"
                    name={`depth-${section.id}`}
                    checked={section.depth === "detailed"}
                    onChange={() => setDepth(section.id, "detailed")}
                    disabled={!section.defaultIncluded}
                    className="w-3.5 h-3.5 accent-primary"
                  />
                  <span className={`text-xs ${section.defaultIncluded ? "text-foreground" : "text-muted-foreground"}`}>
                    Detailed
                  </span>
                </label>
              </div>
            </div>
          ))}
        </div>

        {/* Confidential watermark */}
        <div className="flex items-center gap-2 py-2 border-t">
          <Checkbox
            id="confidential"
            checked={confidential}
            onCheckedChange={(checked) => setConfidential(!!checked)}
          />
          <label htmlFor="confidential" className="text-sm cursor-pointer">
            Include &quot;Confidential&quot; watermark
          </label>
        </div>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
            Export failed: {error}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={generating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Deck ({includedCount} sections)
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
