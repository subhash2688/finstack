import { Workflow, WorkflowId } from '@/types/workflow';
import apWorkflow from '@/data/workflows/ap-workflow.json';
import arWorkflow from '@/data/workflows/ar-workflow.json';
import fpaWorkflow from '@/data/workflows/fpa-workflow.json';

const workflows: Record<WorkflowId, Workflow> = {
  ap: apWorkflow as Workflow,
  ar: arWorkflow as Workflow,
  accounting: { id: 'accounting', name: 'Accounting', functionId: 'finance', processId: 'accounting', steps: [] } as Workflow,
  fpa: fpaWorkflow as Workflow,
  payroll: { id: 'payroll', name: 'Payroll', functionId: 'finance', processId: 'payroll', steps: [] } as Workflow,
  treasury: { id: 'treasury', name: 'Treasury', functionId: 'finance', processId: 'treasury', steps: [] } as Workflow,
  tax: { id: 'tax', name: 'Tax', functionId: 'finance', processId: 'tax', steps: [] } as Workflow,
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
