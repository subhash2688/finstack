import { EngagementList } from "@/components/engagement/EngagementList";
import Link from "next/link";

export default function EngagementsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Engagements
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Your client engagements and process assessments
            </p>
          </div>
          <Link
            href="/engagements/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            + New Engagement
          </Link>
        </div>

        <EngagementList />
      </div>
    </div>
  );
}
