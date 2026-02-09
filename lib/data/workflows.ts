import { Workflow, WorkflowId } from '@/types/workflow';
import apWorkflow from '@/data/workflows/ap-workflow.json';

const workflows: Record<WorkflowId, Workflow> = {
  ap: apWorkflow as Workflow,
  fpa: { id: 'fpa', name: 'FP&A', steps: [] } as Workflow, // Coming soon
  close: { id: 'close', name: 'Close', steps: [] } as Workflow, // Coming soon
};

export function getWorkflow(id: WorkflowId): Workflow | null {
  return workflows[id] || null;
}

export function getAllWorkflows(): Workflow[] {
  return Object.values(workflows).filter(w => w.steps.length > 0);
}

export function getWorkflowStep(workflowId: WorkflowId, stepId: string) {
  const workflow = getWorkflow(workflowId);
  return workflow?.steps.find(step => step.id === stepId) || null;
}
