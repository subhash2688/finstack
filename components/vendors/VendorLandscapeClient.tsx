"use client";

import { useState, useMemo } from "react";
import { Tool, AIMaturity } from "@/types/tool";
import { VendorHeatmap } from "./VendorHeatmap";
import { ComparisonBar } from "./ComparisonBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";

interface VendorLandscapeClientProps {
  tools: Tool[];
  embedded?: boolean;
}

export function VendorLandscapeClient({ tools, embedded = false }: VendorLandscapeClientProps) {
  const [search, setSearch] = useState("");
  const [maturityFilter, setMaturityFilter] = useState<AIMaturity | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    let result = tools;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.vendor.toLowerCase().includes(q) ||
          t.tagline.toLowerCase().includes(q)
      );
    }

    if (maturityFilter) {
      result = result.filter((t) => t.aiMaturity === maturityFilter);
    }

    return result;
  }, [tools, search, maturityFilter]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) return prev; // max 3
      return [...prev, id];
    });
  };

  const maturityCounts = useMemo(() => {
    const counts = { "ai-native": 0, "ai-enabled": 0, "traditional": 0 };
    tools.forEach((t) => counts[t.aiMaturity]++);
    return counts;
  }, [tools]);

  return (
    <div className={embedded ? "" : "max-w-[1400px] mx-auto px-6 py-8"}>
      {/* Header */}
      {!embedded && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Vendor Landscape</h1>
          <p className="text-muted-foreground">
            {tools.length} AP automation vendors evaluated across 10 workflow steps. Color intensity reflects fit score.
          </p>
        </div>
      )}
      {embedded && (
        <p className="text-sm text-muted-foreground mb-4">
          {tools.length} vendors evaluated across 10 workflow steps. Color intensity reflects fit score — click any vendor to see their full profile.
        </p>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filter
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-2 mb-6 p-4 rounded-lg bg-gray-50 border">
          <span className="text-sm font-medium text-muted-foreground mr-2 self-center">AI Maturity:</span>
          {(["ai-native", "ai-enabled", "traditional"] as AIMaturity[]).map((m) => (
            <Badge
              key={m}
              variant={maturityFilter === m ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setMaturityFilter(maturityFilter === m ? null : m)}
            >
              {m === "ai-native" ? "AI-Native" : m === "ai-enabled" ? "AI-Enabled" : "Traditional"}
              {" "}({maturityCounts[m]})
            </Badge>
          ))}
          {maturityFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => setMaturityFilter(null)}
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <span className="font-medium">Legend:</span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-emerald-500 inline-block" />
          Best Fit (80+)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-amber-400 inline-block" />
          Good Fit (50-79)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-gray-300 inline-block" />
          Limited (&lt;50)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-4 h-3 rounded-sm bg-gray-50 border inline-block" />
          Not Covered
        </span>
      </div>

      {/* Heatmap */}
      <VendorHeatmap
        tools={filtered}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

      {/* Comparison bar */}
      {selectedIds.length > 0 && (
        <ComparisonBar
          selectedIds={selectedIds}
          tools={tools}
          onRemove={(id) => setSelectedIds((prev) => prev.filter((x) => x !== id))}
          onClear={() => setSelectedIds([])}
        />
      )}
    </div>
  );
}
