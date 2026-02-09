import { NewEngagementForm } from "@/components/engagement/NewEngagementForm";

export default function NewEngagementPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-2xl mx-auto mb-8">
        <h1 className="text-3xl font-light tracking-wider mb-2">
          NEW ENGAGEMENT
        </h1>
        <p className="text-muted-foreground">
          Provide client context to generate a tailored AP workflow
        </p>
      </div>

      <NewEngagementForm />
    </div>
  );
}
