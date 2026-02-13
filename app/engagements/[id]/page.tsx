import { InputsReviewClient } from "@/components/engagement/InputsReviewClient";

export default function EngagementPage({
  params,
}: {
  params: { id: string };
}) {
  return <InputsReviewClient engagementId={params.id} />;
}
