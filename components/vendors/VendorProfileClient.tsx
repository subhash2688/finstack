"use client";

import { Tool } from "@/types/tool";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FitScoreBadge, FitScoreBar } from "@/components/tools/FitScoreBadge";
import { getToolFitGrade } from "@/lib/data/tools";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Calendar,
  ExternalLink,
  Globe,
  MapPin,
  Sparkles,
  Star,
  Users,
  Clock,
  Shield,
  Target,
  Plug,
  DollarSign,
  BarChart3,
  TrendingUp,
} from "lucide-react";

const STEP_LABELS: Record<string, string> = {
  "invoice-capture": "Invoice Capture",
  "data-validation": "Data Validation",
  "po-matching": "PO Matching",
  "coding-gl-allocation": "GL Coding",
  "approval-routing": "Approval Routing",
  "exception-handling": "Exception Mgmt",
  "fraud-duplicate-detection": "Fraud Detection",
  "payment-scheduling": "Payment Scheduling",
  "payment-execution": "Payment Execution",
  "reconciliation-reporting": "Reconciliation",
};

const aiMaturityLabels: Record<string, string> = {
  "ai-native": "AI-Native",
  "ai-enabled": "AI-Enabled",
  "traditional": "Traditional",
};

const aiMaturityColors: Record<string, string> = {
  "ai-native": "bg-emerald-100 text-emerald-800 border-emerald-300",
  "ai-enabled": "bg-teal-100 text-teal-800 border-teal-300",
  "traditional": "bg-gray-100 text-gray-800 border-gray-300",
};

const effortColors: Record<string, string> = {
  low: "text-emerald-600",
  medium: "text-amber-600",
  high: "text-red-600",
};

export function VendorProfileClient({ tool }: { tool: Tool }) {
  const overallGrade = tool.overallFitScore
    ? getToolFitGrade(tool.overallFitScore)
    : null;

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Back nav */}
      <Link
        href="/ap?tab=vendors"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Vendor Landscape
      </Link>

      {/* ─── Header ─── */}
      <section className="mb-10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold tracking-tight">{tool.name}</h1>
              <Badge variant="outline" className={aiMaturityColors[tool.aiMaturity]}>
                <Sparkles className="h-3 w-3 mr-1" />
                {aiMaturityLabels[tool.aiMaturity]}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">{tool.tagline}</p>
            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
              {tool.vendor && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  {tool.vendor}
                </span>
              )}
              {tool.founded && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Founded {tool.founded}
                </span>
              )}
              {tool.headquarters && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {tool.headquarters}
                </span>
              )}
              {tool.employeeCount && (
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {tool.employeeCount} employees
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {tool.overallFitScore != null && overallGrade && (
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{tool.overallFitScore}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Fit</div>
                <FitScoreBadge score={tool.overallFitScore} grade={overallGrade} compact />
              </div>
            )}
            {tool.website && (
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => window.open(tool.website, "_blank")}
              >
                <Globe className="h-3.5 w-3.5" />
                Website
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* ─── Product Overview ─── */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          Product Overview
        </h2>
        <div className="green-bar pl-5 mb-6">
          <p className="text-muted-foreground">{tool.description}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Key Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {tool.keyFeatures.map((f, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-primary">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  Pain Points Addressed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tool.painPoints.map((p, i) => (
                    <Badge key={i} variant="outline">{p}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Plug className="h-4 w-4 text-primary" />
                  Integrations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tool.integrations.map((int, i) => (
                    <Badge key={i} variant="secondary">{int}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                Company Sizes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tool.companySizes.map((s) => (
                  <Badge key={s} variant="secondary" className="capitalize">{s}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" />
                Industries
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tool.industries.map((ind, i) => (
                  <Badge key={i} variant="outline">{ind}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── Capabilities Matrix ─── */}
      {tool.fitScores && tool.fitScores.length > 0 && (
        <section className="mb-10" id="capabilities">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Workflow Fit Analysis
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {tool.fitScores.map((fs) => {
                  const verdict = tool.stepVerdicts?.find((v) => v.stepId === fs.stepId);
                  return (
                    <div key={fs.stepId} className="group">
                      <div className="flex items-center gap-4 mb-1">
                        <span className="text-sm font-medium w-40 shrink-0">
                          {STEP_LABELS[fs.stepId] || fs.stepId}
                        </span>
                        <FitScoreBar score={fs.score} grade={fs.grade} className="flex-1" />
                      </div>
                      {verdict && (
                        <p className="ml-44 text-xs text-muted-foreground leading-relaxed mb-2">
                          {verdict.verdict}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {/* ─── Adoption Metrics ─── */}
      {tool.adoptionMetrics && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Market Adoption
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tool.adoptionMetrics.customerCount && (
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{tool.adoptionMetrics.customerCount}</div>
                  <div className="text-xs text-muted-foreground mt-1">Customers</div>
                </CardContent>
              </Card>
            )}
            {tool.adoptionMetrics.revenue && (
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold">{tool.adoptionMetrics.revenue}</div>
                  <div className="text-xs text-muted-foreground mt-1">Revenue</div>
                </CardContent>
              </Card>
            )}
            {tool.adoptionMetrics.yoyGrowth && (
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold text-primary">{tool.adoptionMetrics.yoyGrowth}</div>
                  <div className="text-xs text-muted-foreground mt-1">YoY Growth</div>
                </CardContent>
              </Card>
            )}
            {tool.adoptionMetrics.g2Rating != null && (
              <Card>
                <CardContent className="pt-4 pb-4 text-center">
                  <div className="text-2xl font-bold flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    {tool.adoptionMetrics.g2Rating}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">G2 Rating</div>
                </CardContent>
              </Card>
            )}
          </div>
          {tool.adoptionMetrics.gartnerPosition && (
            <div className="mt-3 text-sm text-muted-foreground">
              Gartner Position: <strong>{tool.adoptionMetrics.gartnerPosition}</strong>
            </div>
          )}
          {tool.adoptionMetrics.notableCustomers && tool.adoptionMetrics.notableCustomers.length > 0 && (
            <div className="mt-3">
              <span className="text-sm font-medium">Notable Customers: </span>
              <span className="text-sm text-muted-foreground">
                {tool.adoptionMetrics.notableCustomers.join(", ")}
              </span>
            </div>
          )}
        </section>
      )}

      {/* ─── Deployment Complexity ─── */}
      {tool.deploymentComplexity && (
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Deployment Complexity
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid md:grid-cols-3 gap-6">
                {tool.deploymentComplexity.typicalTimeline && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Timeline</div>
                    <div className="text-lg font-semibold">{tool.deploymentComplexity.typicalTimeline}</div>
                  </div>
                )}
                {tool.deploymentComplexity.effortLevel && (
                  <div>
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Effort Level</div>
                    <div className={`text-lg font-semibold capitalize ${effortColors[tool.deploymentComplexity.effortLevel]}`}>
                      {tool.deploymentComplexity.effortLevel}
                    </div>
                  </div>
                )}
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">IT Required</div>
                  <div className="text-lg font-semibold">
                    {tool.deploymentComplexity.requiresIt ? "Yes" : "No"}
                  </div>
                </div>
              </div>

              {(tool.deploymentComplexity.dataMigration || tool.deploymentComplexity.changeManagement) && (
                <div className="grid md:grid-cols-2 gap-4 mt-6 pt-4 border-t">
                  {tool.deploymentComplexity.dataMigration && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Data Migration</div>
                      <p className="text-sm text-muted-foreground">{tool.deploymentComplexity.dataMigration}</p>
                    </div>
                  )}
                  {tool.deploymentComplexity.changeManagement && (
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Change Management</div>
                      <p className="text-sm text-muted-foreground">{tool.deploymentComplexity.changeManagement}</p>
                    </div>
                  )}
                </div>
              )}

              {tool.deploymentComplexity.requirements && tool.deploymentComplexity.requirements.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Requirements</div>
                  <ul className="space-y-1">
                    {tool.deploymentComplexity.requirements.map((req, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start">
                        <span className="mr-2 text-primary">•</span>
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </section>
      )}

      {/* ─── Pricing ─── */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Pricing
        </h2>
        <Card>
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Model</div>
                <div className="text-sm font-medium">{tool.pricing.model}</div>
              </div>
              {tool.pricing.startingPrice && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Starting Price</div>
                  <div className="text-sm font-medium">{tool.pricing.startingPrice}</div>
                </div>
              )}
              {tool.pricing.notes && (
                <div>
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notes</div>
                  <div className="text-sm text-muted-foreground">{tool.pricing.notes}</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
