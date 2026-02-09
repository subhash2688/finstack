import { WorkflowStep } from "./workflow";
import { FunctionId } from "./function";

/**
 * Client context captured during engagement creation
 */
export interface ClientContext {
  companyName: string;
  industry: string;
  companySize: "startup" | "smb" | "mid-market" | "enterprise";
  erp: string; // e.g., "SAP", "Oracle NetSuite", "QuickBooks"
  monthlyInvoiceVolume: string; // e.g., "< 100", "100-500", "500-2000", "2000+"
  characteristics: string; // Free-text: pain points, goals, constraints
}

/**
 * Maps generated workflow steps to existing tools
 */
export interface ToolMapping {
  generatedStepId: string; // ID of the generated workflow step
  existingToolIds: string[]; // IDs of tools from ap-tools.json that map to this step
}

/**
 * A single process assessment within an engagement
 * Each engagement can assess multiple processes across functions
 */
export interface ProcessAssessment {
  functionId: FunctionId; // e.g., "finance"
  processId: string; // e.g., "ap"
  processName: string; // e.g., "Accounts Payable"
  generatedWorkflow: WorkflowStep[]; // Tailored workflow for this process
  toolMappings: ToolMapping[]; // Tool mappings for this process
  score?: number; // Optional maturity score (0-5)
  notes?: string; // Optional consultant notes
}

/**
 * A saved engagement with multiple process assessments
 * NEW: Engagements can now span multiple processes and functions
 */
export interface Engagement {
  id: string; // UUID
  name: string; // e.g., "Acme Corp - Operations Assessment"
  clientContext: ClientContext;
  processAssessments: ProcessAssessment[]; // NEW: Array of assessed processes
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * LEGACY: Old engagement format (for migration)
 * TODO: Remove after migrating existing localStorage data
 */
export interface LegacyEngagement {
  id: string;
  name: string;
  clientContext: ClientContext;
  generatedWorkflow: WorkflowStep[];
  toolMappings: ToolMapping[];
  createdAt: string;
  updatedAt: string;
}
