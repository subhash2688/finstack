"use client";

import Link from "next/link";
import { Check } from "lucide-react";

export type StepStatus = "completed" | "active" | "available" | "disabled";

export interface StepDef {
  id: string;
  label: string;
  shortLabel: string;
  href?: string;
  status: StepStatus;
  badge?: string;
}

interface EngagementStepperProps {
  steps: StepDef[];
  onStepClick?: (stepId: string) => void;
}

// AlixPartners green gradient — light to dark across 5 steps
const STEP_COLORS = [
  { bg: "#8DC63F", text: "white", border: "#7CB342" },  // Lime green
  { bg: "#4CAF50", text: "white", border: "#43A047" },  // Medium-light green
  { bg: "#00B140", text: "white", border: "#009935" },  // AlixPartners primary
  { bg: "#1B7A3D", text: "white", border: "#156B34" },  // Dark green
  { bg: "#145C30", text: "white", border: "#0E4D27" },  // Forest green
];

const DISABLED_COLOR = { bg: "#F3F4F6", text: "#9CA3AF", border: "#E5E7EB" };
const AVAILABLE_COLOR = { bg: "#E8E8E8", text: "#6B7280", border: "#D1D5DB" };

function ChevronStep({
  step,
  index,
  total,
  isFirst,
  isLast,
  onClick,
}: {
  step: StepDef;
  index: number;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  onClick?: () => void;
}) {
  const isActive = step.status === "active";
  const isCompleted = step.status === "completed";
  const isClickable = step.status !== "disabled";
  const isDisabled = step.status === "disabled";
  const isAvailable = step.status === "available";

  // Pick color from the gradient palette
  const palette = isDisabled
    ? DISABLED_COLOR
    : isAvailable
    ? AVAILABLE_COLOR
    : STEP_COLORS[Math.min(index, STEP_COLORS.length - 1)];

  const bg = palette.bg;
  const borderColor = palette.border;
  const textCls = isDisabled
    ? "text-gray-400"
    : isAvailable
    ? "text-gray-500"
    : "text-white";

  const circleCls = isDisabled
    ? "bg-gray-300 text-gray-400"
    : isAvailable
    ? "bg-gray-400 text-white"
    : "bg-white/25 text-white";

  const h = 42;
  const arrowW = 14;

  const inner = (
    <div className={`relative flex items-center h-[42px] ${isClickable && !isActive ? "hover:brightness-110" : ""} transition-all`}>
      <svg
        className="absolute inset-0 w-full h-full drop-shadow-sm"
        viewBox={`0 0 200 ${h}`}
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d={
            isFirst
              ? `M3,1 H${200 - arrowW} L200,${h / 2} L${200 - arrowW},${h - 1} H3 Q1,${h - 1} 1,${h - 3} V3 Q1,1 3,1 Z`
              : isLast
              ? `M0,1 L${arrowW},${h / 2} L0,${h - 1} H${197} Q${199},${h - 1} ${199},${h - 3} V3 Q${199},1 ${197},1 Z`
              : `M0,1 L${arrowW},${h / 2} L0,${h - 1} H${200 - arrowW} L200,${h / 2} L${200 - arrowW},1 Z`
          }
          fill={bg}
          stroke={borderColor}
          strokeWidth="1"
        />
        {/* Active step: subtle inner glow */}
        {isActive && (
          <path
            d={
              isFirst
                ? `M3,1 H${200 - arrowW} L200,${h / 2} L${200 - arrowW},${h - 1} H3 Q1,${h - 1} 1,${h - 3} V3 Q1,1 3,1 Z`
                : isLast
                ? `M0,1 L${arrowW},${h / 2} L0,${h - 1} H${197} Q${199},${h - 1} ${199},${h - 3} V3 Q${199},1 ${197},1 Z`
                : `M0,1 L${arrowW},${h / 2} L0,${h - 1} H${200 - arrowW} L200,${h / 2} L${200 - arrowW},1 Z`
            }
            fill="none"
            stroke="white"
            strokeWidth="2"
            opacity="0.3"
          />
        )}
      </svg>

      <div className={`relative z-10 flex items-center gap-1.5 w-full justify-center ${isFirst ? "pl-3 pr-4" : "pl-6 pr-4"} ${isLast ? "pr-3" : ""}`}>
        <span
          className={`flex items-center justify-center h-5 w-5 rounded-full text-[10px] font-bold shrink-0 ${circleCls}`}
        >
          {isCompleted ? <Check className="h-3 w-3" strokeWidth={3} /> : index + 1}
        </span>
        <span className={`text-sm font-medium whitespace-nowrap ${textCls}`}>
          <span className="hidden sm:inline">{step.label}</span>
          <span className="sm:hidden">{step.shortLabel}</span>
        </span>
        {step.badge && (
          <span className={`text-[9px] font-medium opacity-70 ${textCls}`}>{step.badge}</span>
        )}
      </div>
    </div>
  );

  if (step.href && isClickable) {
    return (
      <Link href={step.href} className="flex-1 min-w-0">
        {inner}
      </Link>
    );
  }

  return (
    <div
      className={`flex-1 min-w-0 ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
      onClick={() => { if (isClickable && onClick) onClick(); }}
    >
      {inner}
    </div>
  );
}

export function EngagementStepper({ steps, onStepClick }: EngagementStepperProps) {
  return (
    <nav className="mb-6">
      <div className="flex">
        {steps.map((s, i) => (
          <ChevronStep
            key={s.id}
            step={s}
            index={i}
            total={steps.length}
            isFirst={i === 0}
            isLast={i === steps.length - 1}
            onClick={onStepClick ? () => onStepClick(s.id) : undefined}
          />
        ))}
      </div>
    </nav>
  );
}
