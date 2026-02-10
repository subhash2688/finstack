"use client";

import { Tool } from "@/types/tool";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Sparkles, ExternalLink, ArrowRight } from "lucide-react";
import { FitScoreBadge } from "./FitScoreBadge";
import Link from "next/link";

interface ToolCardProps {
  tool: Tool;
  onLearnMore: (tool: Tool) => void;
  stepId?: string;
  showCompare?: boolean;
  isSelected?: boolean;
  onCompareToggle?: (toolId: string) => void;
}

export function ToolCard({ tool, onLearnMore, stepId, showCompare, isSelected, onCompareToggle }: ToolCardProps) {
  const aiMaturityLabels = {
    'ai-native': 'AI-Native',
    'ai-enabled': 'AI-Enabled',
    'traditional': 'Traditional'
  };

  const aiMaturityColors = {
    'ai-native': 'bg-emerald-100 text-emerald-800 border-emerald-300',
    'ai-enabled': 'bg-teal-100 text-teal-800 border-teal-300',
    'traditional': 'bg-gray-100 text-gray-800 border-gray-300'
  };

  const fitScore = stepId
    ? tool.fitScores?.find(f => f.stepId === stepId)
    : null;

  return (
    <Card className="hover:shadow-lg transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <CardTitle className="text-xl">{tool.name}</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">{tool.vendor}</div>
          </div>
          <Badge
            variant="outline"
            className={aiMaturityColors[tool.aiMaturity]}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {aiMaturityLabels[tool.aiMaturity]}
          </Badge>
        </div>

        {fitScore && (
          <div className="mt-2">
            <FitScoreBadge score={fitScore.score} grade={fitScore.grade} />
          </div>
        )}

        <CardDescription className="mt-2">{tool.tagline}</CardDescription>

        {stepId && tool.stepVerdicts && (() => {
          const verdict = tool.stepVerdicts.find(v => v.stepId === stepId);
          if (!verdict) return null;
          return (
            <div className="mt-3 bg-amber-50 border-l-2 border-amber-400 px-3 py-2 rounded-r">
              <p className="text-sm italic text-amber-900">{verdict.verdict}</p>
            </div>
          );
        })()}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 space-y-4">
          <div>
            <h4 className="text-sm font-semibold mb-2">Key Features:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              {tool.keyFeatures.slice(0, 3).map((feature, idx) => (
                <li key={idx} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2">Pricing:</h4>
            <p className="text-sm text-muted-foreground">
              {tool.pricing.startingPrice || tool.pricing.model}
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-2 flex items-center">
              <Building2 className="h-4 w-4 mr-1" />
              Company Size:
            </h4>
            <div className="flex flex-wrap gap-1">
              {tool.companySizes.map((size) => (
                <Badge key={size} variant="secondary" className="text-xs">
                  {size}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex gap-2">
            <Button onClick={() => onLearnMore(tool)} className="flex-1">
              Learn More
            </Button>
            {tool.website && (
              <Button
                variant="outline"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(tool.website, '_blank');
                }}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Link href={`/vendors/${tool.id}`} className="flex-1">
              <Button variant="outline" className="w-full gap-1 text-xs">
                View Full Profile
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
            {showCompare && onCompareToggle && (
              <Button
                variant={isSelected ? "default" : "outline"}
                size="sm"
                className="text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onCompareToggle(tool.id);
                }}
              >
                {isSelected ? "Selected" : "Compare"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
