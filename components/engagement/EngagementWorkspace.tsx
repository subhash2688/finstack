"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Engagement, ProcessAssessment } from "@/types/engagement";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { FUNCTIONS } from "@/types/function";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, FileText, BarChart3 } from "lucide-react";
import Link from "next/link";

interface EngagementWorkspaceProps {
  engagementId: string;
}

export function EngagementWorkspace({ engagementId }: EngagementWorkspaceProps) {
  const router = useRouter();
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [showAddProcess, setShowAddProcess] = useState(false);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);
  }, [engagementId, router]);

  if (!engagement) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const handleDeleteProcess = (processId: string) => {
    if (confirm("Remove this process from the engagement?")) {
      const updated = {
        ...engagement,
        processAssessments: engagement.processAssessments.filter(
          (p) => p.processId !== processId
        ),
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-light tracking-wider mb-2">
              {engagement.name}
            </h1>
            <p className="text-muted-foreground">
              {engagement.clientContext.companyName}
              {engagement.clientContext.industry && ` • ${engagement.clientContext.industry}`}
              {engagement.clientContext.companySize && ` • ${engagement.clientContext.companySize}`}
            </p>
          </div>

          <Button variant="outline" onClick={() => router.push("/engagements")}>
            Back to List
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">ERP:</span>{" "}
            <span className="font-medium">{engagement.clientContext.erp || "—"}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Invoice Volume:</span>{" "}
            <span className="font-medium">
              {engagement.clientContext.monthlyInvoiceVolume || "—"}
            </span>
          </div>
        </div>

        {engagement.clientContext.characteristics && (
          <div className="mt-4 text-sm">
            <span className="text-muted-foreground">Notes:</span>{" "}
            <p className="mt-1">{engagement.clientContext.characteristics}</p>
          </div>
        )}
      </div>

      {/* Process Assessments */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-light tracking-wider">
            ASSESSED PROCESSES ({engagement.processAssessments.length})
          </h2>

          <Button onClick={() => setShowAddProcess(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Process
          </Button>
        </div>

        {engagement.processAssessments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                No processes assessed yet. Add a process to begin.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {engagement.processAssessments.map((assessment) => {
              const func = FUNCTIONS.find((f) => f.id === assessment.functionId);
              const processName = assessment.processName;

              return (
                <Card key={assessment.processId} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-muted-foreground">
                          {func?.name}
                        </div>
                        <div>{processName}</div>
                      </div>

                      <div className="flex gap-2">
                        <Link
                          href={`/engagements/${engagement.id}/edit?process=${assessment.processId}`}
                        >
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProcess(assessment.processId)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Steps:</span>
                        <span className="font-medium">
                          {assessment.generatedWorkflow?.length || 0}
                        </span>
                      </div>

                      {assessment.maturityRatings && Object.keys(assessment.maturityRatings).length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Maturity Rated:</span>
                          <span className="font-medium">
                            {Object.keys(assessment.maturityRatings).length} steps
                          </span>
                        </div>
                      )}

                      {assessment.score !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Score:</span>
                          <span className="font-medium">{assessment.score}/5</span>
                        </div>
                      )}

                      <Link
                        href={`/${assessment.processId}?engagement=${engagement.id}`}
                      >
                        <Button className="w-full mt-2" size="sm">
                          <BarChart3 className="h-4 w-4 mr-2" />
                          View Workflow
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Process Modal (Simple Version) */}
      {showAddProcess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Add Process to Assess</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Coming soon: Select any process from Finance, GTM, or R&D to add to
                this engagement.
              </p>
              <Button onClick={() => setShowAddProcess(false)} className="w-full">
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
