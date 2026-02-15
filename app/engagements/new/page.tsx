import { NewEngagementForm } from "@/components/engagement/NewEngagementForm";

export default function NewEngagementPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-[1100px] mx-auto mb-8">
        <h1 className="text-3xl font-light tracking-tight mb-2">
          New Engagement
        </h1>
        <p className="text-muted-foreground">
          Company profile, function selection, and process-specific intake
        </p>
      </div>

      <NewEngagementForm />
    </div>
  );
}
