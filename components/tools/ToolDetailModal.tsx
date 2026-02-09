"use client";

import { Tool } from "@/types/tool";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Sparkles, ExternalLink, DollarSign, Plug, Target } from "lucide-react";

interface ToolDetailModalProps {
  tool: Tool | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ToolDetailModal({ tool, open, onOpenChange }: ToolDetailModalProps) {
  if (!tool) return null;

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{tool.name}</DialogTitle>
              <DialogDescription className="text-base mt-1">
                {tool.vendor}
              </DialogDescription>
            </div>
            <Badge
              variant="outline"
              className={aiMaturityColors[tool.aiMaturity]}
            >
              <Sparkles className="h-3 w-3 mr-1" />
              {aiMaturityLabels[tool.aiMaturity]}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div>
            <p className="text-muted-foreground">{tool.description}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold flex items-center mb-3">
                <Sparkles className="h-4 w-4 mr-2 text-primary" />
                Key Features
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tool.keyFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold flex items-center mb-3">
                  <Building2 className="h-4 w-4 mr-2 text-primary" />
                  Company Size
                </h4>
                <div className="flex flex-wrap gap-2">
                  {tool.companySizes.map((size) => (
                    <Badge key={size} variant="secondary">
                      {size}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold flex items-center mb-3">
                  <DollarSign className="h-4 w-4 mr-2 text-primary" />
                  Pricing
                </h4>
                <p className="text-sm text-muted-foreground">
                  <strong>{tool.pricing.model}</strong>
                  {tool.pricing.startingPrice && (
                    <span className="block mt-1">Starting at {tool.pricing.startingPrice}</span>
                  )}
                  {tool.pricing.notes && (
                    <span className="block mt-1 text-xs">{tool.pricing.notes}</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold flex items-center mb-3">
              <Target className="h-4 w-4 mr-2 text-primary" />
              Pain Points Addressed
            </h4>
            <div className="flex flex-wrap gap-2">
              {tool.painPoints.map((painPoint, idx) => (
                <Badge key={idx} variant="outline">
                  {painPoint}
                </Badge>
              ))}
            </div>
          </div>

          {tool.integrations.length > 0 && (
            <div>
              <h4 className="font-semibold flex items-center mb-3">
                <Plug className="h-4 w-4 mr-2 text-primary" />
                Key Integrations
              </h4>
              <div className="flex flex-wrap gap-2">
                {tool.integrations.map((integration, idx) => (
                  <Badge key={idx} variant="secondary">
                    {integration}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="font-semibold mb-3">Industries</h4>
            <div className="flex flex-wrap gap-2">
              {tool.industries.map((industry, idx) => (
                <Badge key={idx} variant="outline">
                  {industry}
                </Badge>
              ))}
            </div>
          </div>

          {tool.website && (
            <div className="pt-4 border-t">
              <Button
                onClick={() => window.open(tool.website, '_blank')}
                className="w-full gap-2"
              >
                Visit {tool.vendor} Website
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
