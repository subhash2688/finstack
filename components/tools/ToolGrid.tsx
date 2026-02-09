"use client";

import { Tool } from "@/types/tool";
import { ToolCard } from "./ToolCard";

interface ToolGridProps {
  tools: Tool[];
  onToolSelect: (tool: Tool) => void;
}

export function ToolGrid({ tools, onToolSelect }: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No tools match your current filters. Try adjusting your selection.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {tools.map((tool) => (
        <ToolCard key={tool.id} tool={tool} onLearnMore={onToolSelect} />
      ))}
    </div>
  );
}
