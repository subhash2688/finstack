"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TechnologyCaseStudy } from "@/types/technology";
import { Building2, ExternalLink } from "lucide-react";

interface CaseStudyCardProps {
  caseStudy: TechnologyCaseStudy;
}

export function CaseStudyCard({ caseStudy }: CaseStudyCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
            <p className="text-sm font-medium">{caseStudy.companyArchetype}</p>
          </div>
          <Badge
            variant="outline"
            className="text-[9px] bg-blue-50 text-blue-600 border-blue-200 shrink-0"
          >
            AI Analysis
          </Badge>
        </div>

        <p className="text-xs text-foreground">{caseStudy.outcome}</p>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {caseStudy.erpUsed && (
            <span>
              ERP: <span className="font-medium">{caseStudy.erpUsed}</span>
            </span>
          )}
          {caseStudy.toolUsed && (
            <span>
              Tool: <span className="font-medium">{caseStudy.toolUsed}</span>
            </span>
          )}
          {caseStudy.timeline && (
            <span>
              Timeline:{" "}
              <span className="font-medium">{caseStudy.timeline}</span>
            </span>
          )}
        </div>

        {caseStudy.sourceUrl && caseStudy.sourceLabel && (
          <a
            href={caseStudy.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline"
          >
            <ExternalLink className="h-2.5 w-2.5" />
            {caseStudy.sourceLabel}
          </a>
        )}
      </CardContent>
    </Card>
  );
}
