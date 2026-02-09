/**
 * Core business functions in Lighthouse
 */
export type FunctionId = "finance" | "gtm" | "r&d";

export interface Function {
  id: FunctionId;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  processes: ProcessMeta[]; // Metadata about processes in this function
}

export interface ProcessMeta {
  id: string; // e.g., "ap", "fpa", "close"
  name: string; // e.g., "Accounts Payable"
  description: string;
  available: boolean; // false = coming soon
}

/**
 * Function registry - defines all available functions
 */
export const FUNCTIONS: Function[] = [
  {
    id: "finance",
    name: "Finance",
    description: "Financial operations and accounting processes",
    icon: "DollarSign",
    processes: [
      {
        id: "ap",
        name: "Accounts Payable",
        description: "Invoice processing, payments, and vendor management",
        available: true,
      },
      {
        id: "fpa",
        name: "FP&A",
        description: "Planning, budgeting, forecasting, and reporting",
        available: false,
      },
      {
        id: "close",
        name: "Close Management",
        description: "Month-end close, reconciliation, and reporting",
        available: false,
      },
    ],
  },
  {
    id: "gtm",
    name: "Go-To-Market",
    description: "Sales, marketing, and customer success processes",
    icon: "TrendingUp",
    processes: [
      {
        id: "lead-gen",
        name: "Lead Generation",
        description: "Inbound and outbound lead generation",
        available: false,
      },
      {
        id: "sales",
        name: "Sales Process",
        description: "Opportunity management and deal execution",
        available: false,
      },
      {
        id: "cs",
        name: "Customer Success",
        description: "Onboarding, retention, and expansion",
        available: false,
      },
    ],
  },
  {
    id: "r&d",
    name: "R&D",
    description: "Product development and engineering processes",
    icon: "Microscope",
    processes: [
      {
        id: "product-dev",
        name: "Product Development",
        description: "Product roadmap, requirements, and delivery",
        available: false,
      },
      {
        id: "engineering",
        name: "Engineering Workflow",
        description: "Development, testing, and deployment",
        available: false,
      },
    ],
  },
];

/**
 * Helper to get function by ID
 */
export function getFunctionById(id: FunctionId): Function | undefined {
  return FUNCTIONS.find((f) => f.id === id);
}

/**
 * Helper to get process metadata
 */
export function getProcessMeta(
  functionId: FunctionId,
  processId: string
): ProcessMeta | undefined {
  const func = getFunctionById(functionId);
  return func?.processes.find((p) => p.id === processId);
}
