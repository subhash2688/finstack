// ── Shared process intake question definitions ──

export interface ProcessQuestion {
  key: string;
  label: string;
  type: "text" | "select" | "textarea";
  placeholder?: string;
  options?: string[];
}

export const MATURITY_OPTIONS = [
  "Mostly manual / spreadsheets",
  "Partially automated (some tooling)",
  "Mature systems in place",
];

export const PROCESS_QUESTIONS: Record<string, ProcessQuestion[]> = {
  ap: [
    { key: "erp", label: "ERP System", type: "text", placeholder: "e.g., SAP, Oracle NetSuite, QuickBooks" },
    { key: "monthlyInvoiceVolume", label: "Monthly Invoice Volume", type: "select", options: ["< 100", "100-500", "500-2,000", "2,000-10,000", "10,000+"] },
    { key: "apTeamSize", label: "AP Team Size", type: "text", placeholder: "e.g., 3, 10, 25" },
    { key: "processMaturity", label: "Current Process Maturity", type: "select", options: MATURITY_OPTIONS },
    { key: "painPoints", label: "Key Pain Points", type: "textarea", placeholder: "e.g., manual data entry, slow approvals, duplicate payments..." },
  ],
  ar: [
    { key: "erp", label: "ERP / Billing System", type: "text", placeholder: "e.g., Zuora, Stripe Billing, NetSuite" },
    { key: "monthlyTransactions", label: "Monthly Customer Transactions", type: "select", options: ["< 100", "100-500", "500-2,000", "2,000-10,000", "10,000+"] },
    { key: "dso", label: "Current DSO (Days Sales Outstanding)", type: "text", placeholder: "e.g., 45 days" },
    { key: "arTeamSize", label: "AR Team Size", type: "text", placeholder: "e.g., 2, 8, 20" },
    { key: "processMaturity", label: "Current Process Maturity", type: "select", options: MATURITY_OPTIONS },
    { key: "painPoints", label: "Key Pain Points", type: "textarea", placeholder: "e.g., slow collections, manual cash application, disputes..." },
  ],
  fpa: [
    { key: "planningTools", label: "Planning & Forecasting Tools", type: "text", placeholder: "e.g., Anaplan, Adaptive, Excel" },
    { key: "budgetCycle", label: "Budget Cycle Frequency", type: "select", options: ["Annual", "Semi-annual", "Quarterly", "Rolling forecast"] },
    { key: "reportingEntities", label: "Reporting Entities / Business Units", type: "select", options: ["1-3", "4-10", "11-25", "25+"] },
    { key: "fpaTeamSize", label: "FP&A Team Size", type: "text", placeholder: "e.g., 2, 5, 15" },
    { key: "processMaturity", label: "Current Process Maturity", type: "select", options: MATURITY_OPTIONS },
    { key: "painPoints", label: "Key Pain Points", type: "textarea", placeholder: "e.g., manual consolidation, forecast accuracy, reporting lag..." },
  ],
};

export const DEFAULT_PROCESS_QUESTIONS: ProcessQuestion[] = [
  { key: "currentTools", label: "Current Tools & Systems", type: "text", placeholder: "Key tools used for this process" },
  { key: "teamSize", label: "Team Size", type: "text", placeholder: "e.g., 3, 10, 25" },
  { key: "processMaturity", label: "Current Process Maturity", type: "select", options: MATURITY_OPTIONS },
  { key: "painPoints", label: "Key Pain Points", type: "textarea", placeholder: "Main challenges and areas for improvement..." },
];

/**
 * Simplified core questions used in the new engagement form (Step 3).
 * These apply to ALL processes, replacing per-process question sets in the creation flow.
 */
export const CORE_PROCESS_QUESTIONS: ProcessQuestion[] = [
  { key: "erp", label: "ERP & Systems", type: "text", placeholder: "e.g., SAP, NetSuite, Coupa, Expensify" },
  { key: "teamSize", label: "Team Size", type: "text", placeholder: "e.g., 12" },
  { key: "costPerPerson", label: "Avg Cost per Person", type: "text", placeholder: "e.g., $90,000" },
  { key: "consultantNotes", label: "Additional Observations / Insights", type: "textarea", placeholder: "Any observations from interviews or initial discovery..." },
];

export const TECH_SUB_SECTORS = [
  "SaaS",
  "Hardware",
  "Semiconductor",
  "Telco",
  "Media",
  "Digital Infrastructure",
  "Technology Services",
  "Other",
] as const;
