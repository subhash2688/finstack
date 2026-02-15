import { TechnologyPageClient } from "@/components/engagement/TechnologyPageClient";

export default function TechnologyPage({
  params,
}: {
  params: { id: string };
}) {
  return <TechnologyPageClient engagementId={params.id} />;
}
