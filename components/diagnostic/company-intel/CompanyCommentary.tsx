"use client";

import { CompanyCommentaryData } from "@/types/diagnostic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, TrendingUp, TrendingDown, Layers } from "lucide-react";

interface CompanyCommentaryProps {
  commentary: CompanyCommentaryData;
}

export function CompanyCommentary({ commentary }: CompanyCommentaryProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">Market Intelligence</CardTitle>
          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Analysis
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground italic">
          {commentary.caveat}
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Product Segments */}
        {commentary.productSegments.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Product Segments
              </p>
            </div>
            <div className="space-y-2">
              {commentary.productSegments.map((seg, idx) => (
                <div key={idx} className="pl-3 border-l-2 border-primary/20">
                  <p className="text-sm font-medium">{seg.name}</p>
                  <p className="text-xs text-muted-foreground">{seg.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tailwinds & Headwinds */}
        <div className="grid gap-4 sm:grid-cols-2">
          {commentary.tailwinds.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
                <p className="text-xs font-medium text-emerald-700 uppercase tracking-wider">
                  Tailwinds
                </p>
              </div>
              <ul className="space-y-1.5">
                {commentary.tailwinds.map((tw, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-emerald-500 mt-0.5 shrink-0">+</span>
                    {tw}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {commentary.headwinds.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
                <p className="text-xs font-medium text-red-600 uppercase tracking-wider">
                  Headwinds
                </p>
              </div>
              <ul className="space-y-1.5">
                {commentary.headwinds.map((hw, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-red-400 mt-0.5 shrink-0">-</span>
                    {hw}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Market Dynamics */}
        {commentary.marketDynamics && (
          <div className="pt-3 border-t">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
              Competitive Positioning
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {commentary.marketDynamics}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
