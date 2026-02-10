"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement } from "@/types/engagement";
import { getAllEngagements, deleteEngagement } from "@/lib/storage/engagements";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar, FileText, Trash2, Edit, Eye } from "lucide-react";

export function EngagementList() {
  const router = useRouter();
  const [engagements, setEngagements] = useState<Engagement[]>([]);

  useEffect(() => {
    setEngagements(getAllEngagements());
  }, []);

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this engagement?")) {
      deleteEngagement(id);
      setEngagements(getAllEngagements());
    }
  };

  if (engagements.length === 0) {
    return (
      <div className="text-center py-16">
        <Briefcase className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-2xl font-light tracking-wider mb-2">
          NO ENGAGEMENTS YET
        </h2>
        <p className="text-muted-foreground mb-6">
          Create your first engagement to generate a tailored AP workflow
        </p>
        <Button onClick={() => router.push("/engagements/new")}>
          New Engagement
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-light tracking-wider">
          YOUR ENGAGEMENTS
        </h2>
        <Button onClick={() => router.push("/engagements/new")}>
          New Engagement
        </Button>
      </div>

      <div className="grid gap-4">
        {engagements.map((engagement) => (
          <div
            key={engagement.id}
            className="border rounded-lg p-6 bg-card hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium mb-1">{engagement.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {engagement.clientContext.companyName}
                  {engagement.clientContext.industry && ` • ${engagement.clientContext.industry}`}
                  {engagement.clientContext.companySize && ` • ${engagement.clientContext.companySize}`}
                  {engagement.type === "lightweight" && (
                    <span className="ml-2 inline-block px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Quick Assessment</span>
                  )}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/${engagement.processAssessments[0]?.processId || 'ap'}?engagement=${engagement.id}`)}
                  title="Present to client"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Present
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/engagements/${engagement.id}/edit`)}
                  title="Edit engagement"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(engagement.id)}
                  title="Delete engagement"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>
                  {engagement.processAssessments?.reduce((sum, pa) => sum + (pa.generatedWorkflow?.length || 0), 0) || 0} steps
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>{engagement.clientContext.erp || "—"}</span>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {new Date(engagement.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
