import { EngagementWorkspace } from "@/components/engagement/EngagementWorkspace";

export default function AssessmentPage({
  params,
}: {
  params: { id: string };
}) {
  return <EngagementWorkspace engagementId={params.id} />;
}
