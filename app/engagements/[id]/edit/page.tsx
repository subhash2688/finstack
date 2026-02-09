import { EngagementEditor } from "@/components/engagement/EngagementEditor";

export default function EditEngagementPage({
  params,
}: {
  params: { id: string };
}) {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-wider mb-2">
            EDIT ENGAGEMENT
          </h1>
          <p className="text-muted-foreground">
            Review and refine the generated workflow before presenting to your client
          </p>
        </div>

        <EngagementEditor engagementId={params.id} />
      </div>
    </div>
  );
}
