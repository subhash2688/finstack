/**
 * Core business functions in Lighthouse
 */
export type FunctionId = "finance" | "gtm" | "r&d" | "hr" | "legal";

export interface Function {
  id: FunctionId;
  name: string;
  description: string;
  icon: string; // lucide-react icon name
  processes: ProcessMeta[]; // Metadata about processes in this function
}

export interface ProcessMeta {
  id: string; // e.g., "ap", "ar", "fpa", "payroll"
  name: string; // e.g., "Accounts Payable"
  description: string;
  available: boolean; // false = coming soon
  group?: string; // Optional sub-group label, e.g., "Sales", "Marketing"
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
        id: "ar",
        name: "Accounts Receivable",
        description: "Billing, collections, cash application, and credit management",
        available: true,
      },
      {
        id: "accounting",
        name: "Accounting",
        description: "General ledger, reconciliation, month-end close, and reporting",
        available: false,
      },
      {
        id: "fpa",
        name: "FP&A",
        description: "Planning, budgeting, forecasting, and financial reporting",
        available: false,
      },
      {
        id: "payroll",
        name: "Payroll",
        description: "Payroll processing, compliance, benefits, and workforce payments",
        available: false,
      },
      {
        id: "treasury",
        name: "Treasury",
        description: "Cash management, liquidity forecasting, and banking operations",
        available: false,
      },
      {
        id: "tax",
        name: "Tax (Direct & Indirect)",
        description: "Tax compliance, reporting, provisions, and indirect tax management",
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
        description: "Inbound and outbound prospecting, lead scoring, and qualification",
        available: false,
        group: "Sales",
      },
      {
        id: "sales-ops",
        name: "Sales Operations",
        description: "Pipeline management, forecasting, territory planning, and CRM hygiene",
        available: false,
        group: "Sales",
      },
      {
        id: "sales-enablement",
        name: "Sales Enablement",
        description: "Content, training, competitive intel, and deal support",
        available: false,
        group: "Sales",
      },
      {
        id: "cs",
        name: "Customer Success",
        description: "Onboarding, retention, expansion, and churn prevention",
        available: false,
        group: "Sales",
      },
      {
        id: "demand-gen",
        name: "Demand Generation",
        description: "Campaign execution, ABM, paid media, and attribution",
        available: false,
        group: "Marketing",
      },
      {
        id: "content-marketing",
        name: "Content & Brand",
        description: "Content strategy, creation, distribution, and brand management",
        available: false,
        group: "Marketing",
      },
      {
        id: "marketing-ops",
        name: "Marketing Operations",
        description: "Martech stack, data management, reporting, and automation",
        available: false,
        group: "Marketing",
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
        id: "product-strategy",
        name: "Product Strategy",
        description: "Roadmap planning, prioritization, and market analysis",
        available: false,
        group: "Product Management",
      },
      {
        id: "product-ops",
        name: "Product Operations",
        description: "Requirements management, release coordination, and analytics",
        available: false,
        group: "Product Management",
      },
      {
        id: "user-research",
        name: "User Research",
        description: "Customer discovery, usability testing, and feedback loops",
        available: false,
        group: "Product Management",
      },
      {
        id: "sdlc",
        name: "Software Development",
        description: "Development lifecycle, code review, and CI/CD pipelines",
        available: false,
        group: "Engineering",
      },
      {
        id: "qa",
        name: "QA & Testing",
        description: "Test automation, quality assurance, and release validation",
        available: false,
        group: "Engineering",
      },
      {
        id: "devops",
        name: "DevOps & Infrastructure",
        description: "Cloud operations, deployment automation, and observability",
        available: false,
        group: "Engineering",
      },
      {
        id: "security-eng",
        name: "Security Engineering",
        description: "Application security, vulnerability management, and compliance",
        available: false,
        group: "Engineering",
      },
    ],
  },
  {
    id: "hr",
    name: "HR",
    description: "Human resources, talent management, and workforce operations",
    icon: "Users",
    processes: [
      {
        id: "talent-acquisition",
        name: "Talent Acquisition",
        description: "Sourcing, recruiting, interviewing, and offer management",
        available: false,
        group: "Talent",
      },
      {
        id: "onboarding",
        name: "Onboarding",
        description: "New hire onboarding, provisioning, and orientation",
        available: false,
        group: "Talent",
      },
      {
        id: "learning-dev",
        name: "Learning & Development",
        description: "Training programs, skills development, and career pathing",
        available: false,
        group: "Talent",
      },
      {
        id: "perf-management",
        name: "Performance Management",
        description: "Reviews, goal setting, feedback, and compensation planning",
        available: false,
        group: "People Operations",
      },
      {
        id: "hr-ops",
        name: "HR Operations",
        description: "Employee records, benefits administration, and compliance",
        available: false,
        group: "People Operations",
      },
      {
        id: "workforce-planning",
        name: "Workforce Planning",
        description: "Headcount planning, org design, and workforce analytics",
        available: false,
        group: "People Operations",
      },
    ],
  },
  {
    id: "legal",
    name: "Legal",
    description: "Legal operations, contract management, and compliance",
    icon: "Scale",
    processes: [
      {
        id: "contract-mgmt",
        name: "Contract Management",
        description: "Contract lifecycle, drafting, negotiation, and renewal tracking",
        available: false,
        group: "Contracts",
      },
      {
        id: "contract-review",
        name: "Contract Review",
        description: "AI-assisted clause analysis, risk flagging, and redlining",
        available: false,
        group: "Contracts",
      },
      {
        id: "compliance",
        name: "Compliance",
        description: "Regulatory compliance, policy management, and audit readiness",
        available: false,
        group: "Governance",
      },
      {
        id: "ip-management",
        name: "IP Management",
        description: "Patent tracking, trademark management, and IP portfolio strategy",
        available: false,
        group: "Governance",
      },
      {
        id: "legal-ops",
        name: "Legal Operations",
        description: "Outside counsel management, spend analytics, and matter tracking",
        available: false,
        group: "Governance",
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
