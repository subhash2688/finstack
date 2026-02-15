import { EngagementEditor } from "@/components/engagement/EngagementEditor";

export default function EditEngagementPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-light tracking-tight mb-2">
          Edit Engagement
        </h1>
        <p className="text-muted-foreground">
          Review and refine the generated workflow before presenting to your client
        </p>
      </div>

      <EngagementEditor engagementId={params.id} />
    </div>
  );
}
