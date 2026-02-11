"use client";

import { PriorityArea, LeverageLevel } from "@/types/diagnostic";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

const LEVERAGE_STYLES: Record<
  LeverageLevel,
  { label: string; className: string }
> = {
  high: {
    label: "High Leverage",
    className: "bg-emerald-100 text-emerald-800 border-emerald-300",
  },
  medium: {
    label: "Medium Leverage",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  low: {
    label: "Low Leverage",
    className: "bg-gray-100 text-gray-800 border-gray-300",
  },
};

interface PriorityAreaCardProps {
  area: PriorityArea;
  rank: number;
  engagementId?: string;
}

export function PriorityAreaCard({
  area,
  rank,
  engagementId,
}: PriorityAreaCardProps) {
  const style = LEVERAGE_STYLES[area.expectedLeverage];
  const href = engagementId
    ? `${area.link}?engagement=${engagementId}`
    : area.link;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="text-2xl font-light text-muted-foreground/50 tabular-nums shrink-0 w-8 text-center">
            {rank}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-2">
              <h4 className="font-medium">{area.processName}</h4>
              <Badge
                variant="outline"
                className={`shrink-0 text-[10px] ${style.className}`}
              >
                {style.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-3">
              {area.rationale}
            </p>
            <Link href={href}>
              <Button variant="outline" size="sm" className="group">
                Explore
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
