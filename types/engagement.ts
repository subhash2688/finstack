import { WorkflowStep, MaturityLevel } from "./workflow";
import { FunctionId } from "./function";
import { CompanyDiagnostic, CompanyIntel } from "./diagnostic";
import { SavingsAssumptions } from "./findings";
import { TranscriptIntelligence } from "./transcript";

/**
 * Client context captured during engagement creation
 */
export interface ClientContext {
  companyName: string;
  industry: string; // Always "Technology" for now
  subSector?: string; // e.g., "SaaS", "Hardware", "Semiconductor"
  isPublic?: boolean; // Public or private company
  tickerSymbol?: string; // Stock ticker if public
  companySize: "startup" | "smb" | "mid-market" | "enterprise";
  // Private company profile fields
  revenue?: string; // e.g., "$50M", "$200M"
  revenueGrowth?: string; // e.g., "15%", "25%"
  headcount?: string; // e.g., "150", "1200"
  // Process-level fields (collected in step 3, kept for backward compat)
  erp?: string; // e.g., "SAP", "Oracle NetSuite", "QuickBooks"
  monthlyInvoiceVolume?: string; // e.g., "< 100", "100-500", "500-2000", "2000+"
  characteristics?: string; // Free-text: pain points, goals, constraints
  functionId?: FunctionId; // Function selected during engagement creation
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
  maturityRatings?: Record<string, MaturityLevel>; // stepId → maturity level
  transcriptIntelligence?: TranscriptIntelligence; // Transcript analysis results
  score?: number; // Optional maturity score (0-5)
  notes?: string; // Optional consultant notes
  context?: Record<string, string>; // Process-specific intake answers (e.g., erp, invoice volume)
}

/**
 * A saved engagement with multiple process assessments
 * NEW: Engagements can now span multiple processes and functions
 */
export interface Engagement {
  id: string; // UUID
  name: string; // e.g., "Acme Corp - Operations Assessment"
  type?: "full" | "lightweight"; // "lightweight" = quick save from inline assessment
  clientContext: ClientContext;
  diagnostic?: CompanyDiagnostic; // Company-level AI diagnostic (optional for backwards compat)
  diagnosticHistory?: CompanyDiagnostic[]; // Previous diagnostic versions for delta tracking
  companyIntel?: CompanyIntel; // Company Intelligence dashboard data (EDGAR + templates)
  processAssessments: ProcessAssessment[]; // NEW: Array of assessed processes
  customAssumptions?: SavingsAssumptions; // User-editable savings assumptions
  pendingTranscripts?: { fileName: string; content: string }[]; // Transcripts awaiting analysis
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
