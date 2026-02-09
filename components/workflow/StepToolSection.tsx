"use client";

import { useState, useMemo, useEffect } from "react";
import { ToolGrid } from "@/components/tools/ToolGrid";
import { ToolFilters, FilterState } from "@/components/tools/ToolFilters";
import { ToolDetailModal } from "@/components/tools/ToolDetailModal";
import { filterTools, getAllIndustries } from "@/lib/data/tools";
import { Tool } from "@/types/tool";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal, ChevronDown, ChevronRight } from "lucide-react";

interface StepToolSectionProps {
  stepId: string;
  toolContextSentence?: string;
}

const defaultFilters: FilterState = {
  companySizes: [],
  industries: [],
  aiMaturity: [],
  search: "",
};

export function StepToolSection({ stepId, toolContextSentence }: StepToolSectionProps) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [collapsed, setCollapsed] = useState(true);

  // Reset filters and collapse when step changes
  useEffect(() => {
    setFilters(defaultFilters);
    setFiltersVisible(false);
    setCollapsed(true);
  }, [stepId]);

  const filteredTools = useMemo(() => {
    return filterTools({
      category: "ap",
      workflowStep: stepId,
      ...filters,
    });
  }, [stepId, filters]);

  const availableIndustries = getAllIndustries();

  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    setModalOpen(true);
  };

  return (
    <div>
      {toolContextSentence && (
        <p className="text-sm italic text-muted-foreground mb-3">
          {toolContextSentence}
        </p>
      )}

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors mb-4"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        View {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"} for this step
      </button>

      {!collapsed && (
        <>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">
                Tools for This Step
              </h3>
              <p className="text-sm text-muted-foreground">
                {filteredTools.length} {filteredTools.length === 1 ? "tool" : "tools"} found
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltersVisible(!filtersVisible)}
              className="gap-2"
            >
              <SlidersHorizontal className="h-4 w-4" />
              {filtersVisible ? "Hide Filters" : "Show Filters"}
            </Button>
          </div>

          {filtersVisible && (
            <div className="mb-6">
              <ToolFilters
                filters={filters}
                onFiltersChange={setFilters}
                availableIndustries={availableIndustries}
              />
            </div>
          )}

          <ToolGrid tools={filteredTools} onToolSelect={handleToolSelect} stepId={stepId} />
        </>
      )}

      <ToolDetailModal
        tool={selectedTool}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
}
