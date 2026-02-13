import { HypothesisPageClient } from "@/components/engagement/HypothesisPageClient";

export default function HypothesisPage({
  params,
}: {
  params: { id: string };
}) {
  return <HypothesisPageClient engagementId={params.id} />;
}
