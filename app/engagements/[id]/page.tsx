import { EngagementWorkspace } from "@/components/engagement/EngagementWorkspace";

export default function EngagementPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto px-4 py-12">
      <EngagementWorkspace engagementId={params.id} />
    </div>
  );
}
