"use client";

import { Tool } from "@/types/tool";
import { Button } from "@/components/ui/button";
import { X, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface ComparisonBarProps {
  selectedIds: string[];
  tools: Tool[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

export function ComparisonBar({ selectedIds, tools, onRemove, onClear }: ComparisonBarProps) {
  const router = useRouter();
  const selected = tools.filter((t) => selectedIds.includes(t.id));

  if (selected.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
      <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-sm font-medium text-muted-foreground shrink-0">
            Compare ({selected.length}/3):
          </span>
          <div className="flex gap-2 flex-wrap">
            {selected.map((tool) => (
              <span
                key={tool.id}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
              >
                {tool.name}
                <button
                  onClick={() => onRemove(tool.id)}
                  className="hover:bg-primary/20 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={onClear} className="text-xs">
            Clear
          </Button>
          <Button
            size="sm"
            className="gap-1"
            disabled={selected.length < 2}
            onClick={() => {
              const ids = selectedIds.join(",");
              router.push(`/vendors/compare?ids=${ids}`);
            }}
          >
            Compare
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
