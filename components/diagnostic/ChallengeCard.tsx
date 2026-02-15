"use client";

import { DiagnosticChallenge, ChallengeCategory } from "@/types/diagnostic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const CATEGORY_STYLES: Record<
  ChallengeCategory,
  { label: string; className: string }
> = {
  operational: {
    label: "Operational",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  cost: {
    label: "Cost",
    className: "bg-orange-100 text-orange-800 border-orange-300",
  },
  "data-quality": {
    label: "Data Quality",
    className: "bg-purple-100 text-purple-800 border-purple-300",
  },
  scale: {
    label: "Scale",
    className: "bg-amber-100 text-amber-800 border-amber-300",
  },
  positive: {
    label: "Strength",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
};

interface ChallengeCardProps {
  challenge: DiagnosticChallenge;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
  const style = CATEGORY_STYLES[challenge.category];

  return (
    <Card className="h-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h4 className="font-medium text-sm leading-tight">
            {challenge.title}
          </h4>
          <Badge variant="outline" className={`shrink-0 text-[10px] ${style.className}`}>
            {style.label}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {challenge.description}
        </p>
      </CardContent>
    </Card>
  );
}
