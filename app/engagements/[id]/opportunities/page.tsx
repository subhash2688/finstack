import { FindingsPageClient } from "@/components/engagement/FindingsPageClient";

export default function OpportunitiesPage({
  params,
}: {
  params: { id: string };
}) {
  return <FindingsPageClient engagementId={params.id} />;
}
