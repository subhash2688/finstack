import { Suspense } from "react";
import { notFound } from "next/navigation";
import { findProcessById } from "@/types/function";
import { getWorkflow } from "@/lib/data/workflows";
import { getToolsByCategory } from "@/lib/data/tools";
import { WorkflowPageClient } from "@/components/workflow/WorkflowPageClient";
import { WorkflowId } from "@/types/workflow";
import { Category } from "@/types/tool";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ProcessPage({
  params,
  searchParams,
}: {
  params: { processId: string };
  searchParams: { engagement?: string };
}) {
  const result = findProcessById(params.processId);
  if (!result || !result.process.available) {
    notFound();
  }

  const workflow = getWorkflow(params.processId as WorkflowId);
  if (!workflow || workflow.steps.length === 0) {
    notFound();
  }

  // Guard category check — only count tools if processId is a valid Category
  const validCategories: string[] = ["ap", "ar", "fpa", "close"];
  const category = validCategories.includes(params.processId)
    ? (params.processId as Category)
    : undefined;
  const toolCount = category ? getToolsByCategory(category).length : 0;

  const engagementId = searchParams.engagement || null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href={engagementId ? `/engagements/${engagementId}?tab=processes` : "/dashboard"}>
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {engagementId ? "Back to Engagement" : "Back to Dashboard"}
          </Button>
        </Link>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <WorkflowPageClient
          staticWorkflow={workflow}
          toolCount={toolCount}
          engagementId={engagementId}
          processId={params.processId}
          category={category ?? ("ap" as Category)}
          processName={result.process.name}
        />
      </Suspense>
    </div>
  );
}
