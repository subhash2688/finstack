"use client";

import { useSearchParams } from "next/navigation";
import { getToolsByIds } from "@/lib/data/tools";
import { getWorkflow } from "@/lib/data/workflows";
import { VendorComparisonClient } from "@/components/vendors/VendorComparisonClient";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import { WorkflowId } from "@/types/workflow";
import { Category } from "@/types/tool";

function ComparisonContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids") || "";
  const ids = idsParam.split(",").filter(Boolean);
  const tools = getToolsByIds(ids);
  const categoryParam = searchParams.get("category") || tools[0]?.category || "ap";
  const category = categoryParam as Category;

  if (tools.length < 2) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">Select Vendors to Compare</h1>
        <p className="text-muted-foreground mb-6">
          Choose 2-3 vendors from the Vendor Landscape to compare them side by side.
        </p>
        <Link href={`/${category}?tab=vendors`}>
          <Button className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go to Vendor Landscape
          </Button>
        </Link>
      </div>
    );
  }

  const workflow = getWorkflow(category as WorkflowId);
  const workflowSteps = workflow?.steps;

  return (
    <VendorComparisonClient
      tools={tools}
      workflowSteps={workflowSteps}
      category={category}
    />
  );
}

export default function ComparisonPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-6 py-16 text-center">
        <p className="text-muted-foreground">Loading comparison...</p>
      </div>
    }>
      <ComparisonContent />
    </Suspense>
  );
}
