import { Suspense } from "react";
import { getWorkflow } from "@/lib/data/workflows";
import { getToolsByCategory } from "@/lib/data/tools";
import { APWorkflowPageClient } from "@/components/workflow/APWorkflowPageClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function APPage({
  searchParams,
}: {
  searchParams: { engagement?: string };
}) {
  const workflow = getWorkflow('ap');

  if (!workflow) {
    return <div>Workflow not found</div>;
  }

  const toolCount = getToolsByCategory('ap').length;
  const engagementId = searchParams.engagement || null;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <APWorkflowPageClient
          staticWorkflow={workflow}
          toolCount={toolCount}
          engagementId={engagementId}
        />
      </Suspense>
    </div>
  );
}
