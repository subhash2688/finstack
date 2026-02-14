import { ToolRecommendationsPageClient } from "@/components/engagement/ToolRecommendationsPageClient";

export default function TechnologyPage({
  params,
}: {
  params: { id: string };
}) {
  return <ToolRecommendationsPageClient engagementId={params.id} />;
}
