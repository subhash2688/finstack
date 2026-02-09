"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Engagement, ProcessAssessment } from "@/types/engagement";
import { WorkflowStep } from "@/types/workflow";
import { getEngagement, saveEngagement } from "@/lib/storage/engagements";
import { StepEditor } from "./StepEditor";
import { Button } from "@/components/ui/button";
import { Save, Eye } from "lucide-react";

interface EngagementEditorProps {
  engagementId: string;
}

export function EngagementEditor({ engagementId }: EngagementEditorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processId = searchParams.get("process") || "ap"; // Default to AP for backwards compat

  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [processAssessment, setProcessAssessment] = useState<ProcessAssessment | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loaded = getEngagement(engagementId);
    if (!loaded) {
      router.push("/engagements");
      return;
    }
    setEngagement(loaded);

    // Find the process assessment
    const assessment = loaded.processAssessments.find(
      (p) => p.processId === processId
    );
    if (!assessment && loaded.processAssessments.length > 0) {
      // Fallback to first assessment
      setProcessAssessment(loaded.processAssessments[0]);
    } else {
      setProcessAssessment(assessment || null);
    }
  }, [engagementId, processId, router]);

  if (!engagement || !processAssessment) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const updateStep = (index: number, updatedStep: WorkflowStep) => {
    const newSteps = [...processAssessment.generatedWorkflow];
    newSteps[index] = updatedStep;

    const updatedAssessment = {
      ...processAssessment,
      generatedWorkflow: newSteps,
    };

    setProcessAssessment(updatedAssessment);

    // Update in engagement
    const updatedEngagement = {
      ...engagement,
      processAssessments: engagement.processAssessments.map((p) =>
        p.processId === processAssessment.processId ? updatedAssessment : p
      ),
    };
    setEngagement(updatedEngagement);
  };

  const deleteStep = (index: number) => {
    if (confirm("Are you sure you want to delete this step?")) {
      const newSteps = processAssessment.generatedWorkflow.filter(
        (_, i) => i !== index
      );

      const updatedAssessment = {
        ...processAssessment,
        generatedWorkflow: newSteps,
      };

      setProcessAssessment(updatedAssessment);

      const updatedEngagement = {
        ...engagement,
        processAssessments: engagement.processAssessments.map((p) =>
          p.processId === processAssessment.processId ? updatedAssessment : p
        ),
      };
      setEngagement(updatedEngagement);
    }
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= processAssessment.generatedWorkflow.length)
      return;

    const newSteps = [...processAssessment.generatedWorkflow];
    [newSteps[index], newSteps[newIndex]] = [newSteps[newIndex], newSteps[index]];

    // Update step numbers
    newSteps[index].stepNumber = index + 1;
    newSteps[newIndex].stepNumber = newIndex + 1;

    const updatedAssessment = {
      ...processAssessment,
      generatedWorkflow: newSteps,
    };

    setProcessAssessment(updatedAssessment);

    const updatedEngagement = {
      ...engagement,
      processAssessments: engagement.processAssessments.map((p) =>
        p.processId === processAssessment.processId ? updatedAssessment : p
      ),
    };
    setEngagement(updatedEngagement);
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
      saveEngagement(engagement);
      setTimeout(() => setIsSaving(false), 500);
    } catch (error) {
      console.error("Failed to save:", error);
      alert("Failed to save engagement");
      setIsSaving(false);
    }
  };

  const handleSaveAndPresent = () => {
    handleSave();
    router.push(`/${processAssessment.processId}?engagement=${engagement.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-2">
          CLIENT CONTEXT
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Company:</span>{" "}
            <span className="font-medium">{engagement.clientContext.companyName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Industry:</span>{" "}
            <span className="font-medium">{engagement.clientContext.industry}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Size:</span>{" "}
            <span className="font-medium">{engagement.clientContext.companySize}</span>
          </div>
          <div>
            <span className="text-muted-foreground">ERP:</span>{" "}
            <span className="font-medium">{engagement.clientContext.erp}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">
          {processAssessment.processName} - WORKFLOW STEPS ({processAssessment.generatedWorkflow.length})
        </h3>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save"}
          </Button>

          <Button onClick={handleSaveAndPresent}>
            <Eye className="h-4 w-4 mr-2" />
            Save & Present
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {processAssessment.generatedWorkflow.map((step, index) => (
          <StepEditor
            key={step.id}
            step={step}
            onUpdate={(updated) => updateStep(index, updated)}
            onDelete={() => deleteStep(index)}
            onMoveUp={() => moveStep(index, "up")}
            onMoveDown={() => moveStep(index, "down")}
            canMoveUp={index > 0}
            canMoveDown={index < processAssessment.generatedWorkflow.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
