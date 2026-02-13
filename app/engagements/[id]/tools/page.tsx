import { ToolRecommendationsPageClient } from "@/components/engagement/ToolRecommendationsPageClient";

export default function ToolsPage({
  params,
}: {
  params: { id: string };
}) {
  return <ToolRecommendationsPageClient engagementId={params.id} />;
}
