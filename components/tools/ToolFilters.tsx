"use client";

import { CompanySize, AIMaturity } from "@/types/tool";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

export interface FilterState {
  companySizes: CompanySize[];
  industries: string[];
  aiMaturity: AIMaturity[];
  search: string;
}

interface ToolFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableIndustries: string[];
}

export function ToolFilters({ filters, onFiltersChange, availableIndustries }: ToolFiltersProps) {
  const companySizes: CompanySize[] = ['startup', 'smb', 'mid-market', 'enterprise'];
  const aiMaturityLevels: AIMaturity[] = ['ai-native', 'ai-enabled', 'traditional'];

  const aiMaturityLabels = {
    'ai-native': 'AI-Native',
    'ai-enabled': 'AI-Enabled',
    'traditional': 'Traditional'
  };

  const companySizeLabels = {
    'startup': 'Startup',
    'smb': 'Small Business',
    'mid-market': 'Mid-Market',
    'enterprise': 'Enterprise'
  };

  const toggleCompanySize = (size: CompanySize) => {
    const newSizes = filters.companySizes.includes(size)
      ? filters.companySizes.filter(s => s !== size)
      : [...filters.companySizes, size];
    onFiltersChange({ ...filters, companySizes: newSizes });
  };

  const toggleIndustry = (industry: string) => {
    const newIndustries = filters.industries.includes(industry)
      ? filters.industries.filter(i => i !== industry)
      : [...filters.industries, industry];
    onFiltersChange({ ...filters, industries: newIndustries });
  };

  const toggleAIMaturity = (maturity: AIMaturity) => {
    const newMaturity = filters.aiMaturity.includes(maturity)
      ? filters.aiMaturity.filter(m => m !== maturity)
      : [...filters.aiMaturity, maturity];
    onFiltersChange({ ...filters, aiMaturity: newMaturity });
  };

  const clearFilters = () => {
    onFiltersChange({
      companySizes: [],
      industries: [],
      aiMaturity: [],
      search: ''
    });
  };

  const hasActiveFilters =
    filters.companySizes.length > 0 ||
    filters.industries.length > 0 ||
    filters.aiMaturity.length > 0 ||
    filters.search.length > 0;

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs"
            >
              <X className="h-3 w-3 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <label className="text-sm font-medium mb-3 block">
            <Search className="h-4 w-4 inline mr-1" />
            Search
          </label>
          <Input
            placeholder="Search tools..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Company Size</label>
          <div className="space-y-2">
            {companySizes.map((size) => (
              <div key={size} className="flex items-center space-x-2">
                <Checkbox
                  id={`size-${size}`}
                  checked={filters.companySizes.includes(size)}
                  onCheckedChange={() => toggleCompanySize(size)}
                />
                <label
                  htmlFor={`size-${size}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {companySizeLabels[size]}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">AI Maturity</label>
          <div className="space-y-2">
            {aiMaturityLevels.map((maturity) => (
              <div key={maturity} className="flex items-center space-x-2">
                <Checkbox
                  id={`maturity-${maturity}`}
                  checked={filters.aiMaturity.includes(maturity)}
                  onCheckedChange={() => toggleAIMaturity(maturity)}
                />
                <label
                  htmlFor={`maturity-${maturity}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {aiMaturityLabels[maturity]}
                </label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium mb-3 block">Industry</label>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableIndustries.map((industry) => (
              <div key={industry} className="flex items-center space-x-2">
                <Checkbox
                  id={`industry-${industry}`}
                  checked={filters.industries.includes(industry)}
                  onCheckedChange={() => toggleIndustry(industry)}
                />
                <label
                  htmlFor={`industry-${industry}`}
                  className="text-sm cursor-pointer flex-1"
                >
                  {industry}
                </label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
