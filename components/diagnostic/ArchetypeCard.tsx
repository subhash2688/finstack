"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface ArchetypeCardProps {
  archetype: string;
  description: string;
  companyName: string;
  industry: string;
  companySize: string;
}

export function ArchetypeCard({
  archetype,
  description,
  companyName,
  industry,
  companySize,
}: ArchetypeCardProps) {
  return (
    <Card className="border-l-4 border-l-emerald-500">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="mt-1 p-2 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-xl font-semibold tracking-tight">
                {archetype}
              </h2>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{companyName}</span>
              <span className="text-muted-foreground/40">|</span>
              <span>{industry}</span>
              <span className="text-muted-foreground/40">|</span>
              <span className="capitalize">{companySize}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
