"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { getEngagement } from "@/lib/storage/engagements";
import { getWorkflow } from "@/lib/data/workflows";
import { WorkflowId } from "@/types/workflow";
import { EngagementStepper, StepDef } from "@/components/engagement/EngagementStepper";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface EngagementLayoutClientProps {
  engagementId: string;
  children: React.ReactNode;
}

function computeAssessmentBadge(engagement: Engagement): string {
  const total = engagement.processAssessments.length;
  if (total === 0) return "0 processes";
  const complete = engagement.processAssessments.filter((pa) => {
    const ratedCount = pa.maturityRatings
      ? Object.keys(pa.maturityRatings).length
      : 0;
    const workflow = getWorkflow(pa.processId as WorkflowId);
    const totalSteps =
      pa.generatedWorkflow?.length || workflow?.steps.length || 0;
    return ratedCount >= totalSteps && totalSteps > 0;
  }).length;
  return `${complete}/${total} assessed`;
}

function hasAnyCompleteAssessment(engagement: Engagement): boolean {
  return engagement.processAssessments.some((pa) => {
    const ratedCount = pa.maturityRatings
      ? Object.keys(pa.maturityRatings).length
      : 0;
    const workflow = getWorkflow(pa.processId as WorkflowId);
    const totalSteps =
      pa.generatedWorkflow?.length || workflow?.steps.length || 0;
    return ratedCount >= totalSteps && totalSteps > 0;
  });
}

export function EngagementLayoutClient({
  engagementId,
  children,
}: EngagementLayoutClientProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);

  const loadEngagement = () => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
  };

  useEffect(() => {
    loadEngagement();
    // Listen for engagement updates from child pages
    const handler = () => loadEngagement();
    window.addEventListener("engagement-updated", handler);
    return () => window.removeEventListener("engagement-updated", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engagementId]);

  if (!engagement) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Determine active step from pathname
  const isInputs = pathname === `/engagements/${engagementId}`;
  const isCompanyIntel = pathname === `/engagements/${engagementId}/company-intel`;
  const isHypothesis = pathname === `/engagements/${engagementId}/hypothesis`;
  const isAssessment = pathname === `/engagements/${engagementId}/assessment`;
  const isFindings = pathname === `/engagements/${engagementId}/findings`;
  const isTools = pathname === `/engagements/${engagementId}/tools`;

  const hasIntel = !!engagement.companyIntel;
  const hasDiagnostic = !!engagement.diagnostic;
  const hasComplete = hasAnyCompleteAssessment(engagement);
  const assessmentBadge = computeAssessmentBadge(engagement);

  const steps: StepDef[] = [
    {
      id: "inputs",
      label: "Inputs",
      shortLabel: "Inputs",
      href: `/engagements/${engagementId}`,
      status: isInputs ? "active" : "completed",
    },
    {
      id: "company-intel",
      label: "Company Insights",
      shortLabel: "Insights",
      href: `/engagements/${engagementId}/company-intel`,
      status: isCompanyIntel
        ? "active"
        : hasIntel
        ? "completed"
        : "available",
    },
    {
      id: "assessment",
      label: "Assessment",
      shortLabel: "Assess",
      href: `/engagements/${engagementId}/assessment`,
      status: isAssessment
        ? "active"
        : hasComplete
        ? "completed"
        : "available",
      badge: assessmentBadge,
    },
    {
      id: "hypothesis",
      label: "Opportunity Areas",
      shortLabel: "Opps",
      href: `/engagements/${engagementId}/hypothesis`,
      status: isHypothesis
        ? "active"
        : hasDiagnostic
        ? "completed"
        : "available",
    },
    {
      id: "findings",
      label: "Business Impact",
      shortLabel: "Impact",
      href: hasComplete ? `/engagements/${engagementId}/findings` : undefined,
      status: isFindings
        ? "active"
        : hasComplete
        ? "available"
        : "disabled",
    },
    {
      id: "tools",
      label: "Tool Recommendations",
      shortLabel: "Tools",
      href: hasComplete ? `/engagements/${engagementId}/tools` : undefined,
      status: isTools
        ? "active"
        : hasComplete
        ? "available"
        : "disabled",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Compact header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Link href="/engagements">
            <Button variant="ghost" size="sm" className="gap-1.5 -ml-2">
              <ArrowLeft className="h-4 w-4" />
              Engagements
            </Button>
          </Link>
          <span className="text-muted-foreground">/</span>
          <h1 className="text-lg font-medium truncate max-w-md">
            {engagement.clientContext.companyName}
          </h1>
          {engagement.clientContext.subSector && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {engagement.clientContext.subSector}
            </span>
          )}
        </div>
      </div>

      {/* Stepper */}
      <EngagementStepper steps={steps} />

      {/* Page content */}
      {children}
    </div>
  );
}
