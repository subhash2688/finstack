import { EngagementList } from "@/components/engagement/EngagementList";

export default function EngagementsPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-light tracking-wider mb-2">
            ENGAGEMENTS
          </h1>
          <p className="text-muted-foreground">
            Manage your client engagements and tailored AP workflows
          </p>
        </div>

        <EngagementList />
      </div>
    </div>
  );
}
