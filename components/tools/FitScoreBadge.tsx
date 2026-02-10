"use client";

import { FitGrade } from "@/types/tool";

interface FitScoreBadgeProps {
  score: number;
  grade: FitGrade;
  compact?: boolean;
}

const gradeConfig = {
  "best-fit": { label: "Best Fit", color: "#00B140", bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-200" },
  "good-fit": { label: "Good Fit", color: "#F59E0B", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
  "limited": { label: "Limited", color: "#9CA3AF", bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200" },
};

export function FitScoreBadge({ score, grade, compact = false }: FitScoreBadgeProps) {
  const config = gradeConfig[grade];

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="w-8 h-1.5 rounded-full bg-gray-200 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${score}%`, backgroundColor: config.color }}
          />
        </div>
        <span className={`text-[10px] font-medium ${config.text}`}>{score}</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md border ${config.bg} ${config.border}`}>
      <div className="w-16 h-2 rounded-full bg-gray-200 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: config.color }}
        />
      </div>
      <span className={`text-xs font-semibold ${config.text}`}>{score}</span>
      <span className={`text-[10px] font-medium uppercase tracking-wide ${config.text}`}>{config.label}</span>
    </div>
  );
}

export function FitScoreBar({ score, grade, className = "" }: FitScoreBadgeProps & { className?: string }) {
  const config = gradeConfig[grade];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, backgroundColor: config.color }}
        />
      </div>
      <span className={`text-sm font-semibold tabular-nums min-w-[2rem] text-right ${config.text}`}>{score}</span>
    </div>
  );
}
