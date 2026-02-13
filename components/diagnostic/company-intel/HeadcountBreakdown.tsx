"use client";

import { useState } from "react";
import { HeadcountProfile, FunctionalHeadcountEntry } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Info } from "lucide-react";

interface HeadcountBreakdownProps {
  headcount: HeadcountProfile;
  functionalHeadcount?: FunctionalHeadcountEntry[];
  onFunctionalChange?: (entries: FunctionalHeadcountEntry[]) => void;
  editable?: boolean;
}

const DEFAULT_FUNCTIONS: { name: string; guidancePercent: string }[] = [
  { name: "Finance & Accounting", guidancePercent: "3-5%" },
  { name: "Engineering / R&D", guidancePercent: "25-40%" },
  { name: "Sales", guidancePercent: "15-25%" },
  { name: "Marketing", guidancePercent: "5-10%" },
  { name: "Customer Success", guidancePercent: "5-10%" },
  { name: "HR / People", guidancePercent: "2-4%" },
  { name: "Operations", guidancePercent: "3-8%" },
  { name: "Legal", guidancePercent: "1-2%" },
];

export function HeadcountBreakdown({
  headcount,
  functionalHeadcount,
  onFunctionalChange,
  editable = false,
}: HeadcountBreakdownProps) {
  const [entries, setEntries] = useState<FunctionalHeadcountEntry[]>(
    functionalHeadcount ||
    DEFAULT_FUNCTIONS.map((f) => ({
      function: f.name,
      headcount: null,
      guidancePercent: f.guidancePercent,
    }))
  );

  const handleChange = (idx: number, value: string) => {
    const updated = [...entries];
    updated[idx] = { ...updated[idx], headcount: value === "" ? null : parseInt(value) || null };
    setEntries(updated);
    onFunctionalChange?.(updated);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Headcount Profile</CardTitle>
          </div>
          {headcount.total !== undefined && (
            <Badge variant="outline" className="text-xs">SEC EDGAR</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total + revenue per employee */}
        <div className="flex items-center gap-6">
          <div>
            <p className="text-2xl font-bold">{headcount.totalFormatted}</p>
            <p className="text-xs text-muted-foreground">Total Employees</p>
          </div>
          {headcount.revenuePerEmployee && (
            <div className="border-l pl-6">
              <p className="text-lg font-semibold">{headcount.revenuePerEmployee}</p>
              <p className="text-xs text-muted-foreground">Revenue / Employee</p>
            </div>
          )}
        </div>

        {/* Editable functional breakdown */}
        {editable && headcount.total !== undefined && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Functional Breakdown
              </p>
              <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-amber-50 text-amber-700 border-amber-200">
                User Provided
              </Badge>
            </div>
            <div className="space-y-1.5">
              <div className="grid grid-cols-[1fr_80px_80px] gap-2 text-[10px] text-muted-foreground uppercase tracking-wider font-medium px-1">
                <span>Function</span>
                <span className="text-right">Headcount</span>
                <span className="text-right">Typical %</span>
              </div>
              {entries.map((entry, idx) => (
                <div key={entry.function} className="grid grid-cols-[1fr_80px_80px] gap-2 items-center">
                  <span className="text-xs font-medium">{entry.function}</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="—"
                    value={entry.headcount ?? ""}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    className="text-xs text-right rounded border px-2 py-1 w-full bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="text-right flex items-center justify-end gap-1">
                    <span className="text-[10px] text-muted-foreground">{entry.guidancePercent}</span>
                    <div className="group relative">
                      <Info className="h-3 w-3 text-muted-foreground/40 cursor-help" />
                      <div className="absolute right-0 bottom-full mb-1 hidden group-hover:block bg-gray-900 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap z-10">
                        Typical for mid-market tech companies
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Static function breakdown (legacy, for non-editable mode) */}
        {!editable && headcount.functionBreakdown && headcount.functionBreakdown.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
              Functional Breakdown
            </p>
            <div className="space-y-2">
              {headcount.functionBreakdown.map((fb) => (
                <div key={fb.function} className="flex items-center justify-between text-xs">
                  <span className="font-medium">{fb.function}</span>
                  <span className="text-muted-foreground">{fb.estimate}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Insight */}
        <p className="text-xs text-muted-foreground leading-relaxed border-t pt-3">
          {headcount.insight}
        </p>
      </CardContent>
    </Card>
  );
}
