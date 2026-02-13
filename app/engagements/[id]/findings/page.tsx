import { FindingsPageClient } from "@/components/engagement/FindingsPageClient";

export default function FindingsPage({
  params,
}: {
  params: { id: string };
}) {
  return <FindingsPageClient engagementId={params.id} />;
}
