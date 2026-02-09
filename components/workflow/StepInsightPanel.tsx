"use client";

import { StepInsight } from "@/types/workflow";
import { Flame, Zap, CheckCircle } from "lucide-react";

interface StepInsightPanelProps {
  insight: StepInsight;
}

const intensityConfig = {
  fire: {
    icon: Flame,
    iconColor: "text-orange-500",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  strong: {
    icon: Zap,
    iconColor: "text-emerald-600",
    bgColor: "bg-emerald-50",
    borderColor: "border-emerald-200",
  },
  moderate: {
    icon: CheckCircle,
    iconColor: "text-blue-500",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

export function StepInsightPanel({ insight }: StepInsightPanelProps) {
  const config = intensityConfig[insight.aiImpactIntensity];
  const Icon = config.icon;

  return (
    <div className="bg-gray-50 border rounded-xl p-6 space-y-5">
      {/* Why This Step Matters */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
          Why This Step Matters
        </p>
        <p className="text-xl font-light text-gray-900 leading-relaxed">
          {insight.whyItMatters}
        </p>
      </div>

      {/* Two-column: Typical Pain + AI Impact Verdict */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-2">
            Typical Pain
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {insight.typicalPain}
          </p>
        </div>
        <div className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4`}>
          <div className="flex items-center gap-2 mb-2">
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
            <p className="text-[10px] uppercase tracking-widest text-gray-500">
              AI Impact Verdict
            </p>
          </div>
          <p className="text-sm text-gray-800 leading-relaxed">
            {insight.aiImpactVerdict}
          </p>
        </div>
      </div>
    </div>
  );
}
