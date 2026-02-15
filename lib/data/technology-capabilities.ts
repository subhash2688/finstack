/**
 * Technology Capabilities — static definitions
 *
 * Maps workflow steps to higher-level technology capabilities.
 * Each capability groups related steps that are addressed by the same
 * category of technology solution.
 */

import { CapabilityDefinition, BuildDefaults } from "@/types/technology";
import { Category } from "@/types/tool";

// ── Build defaults by company size ──

const SMALL_TEAM_DEFAULTS: BuildDefaults = {
  teamComposition: [
    { role: "Full-Stack Engineer", count: 1, monthlyRate: 12000 },
    { role: "Part-Time PM", count: 1, monthlyRate: 5000 },
  ],
  timelineMonths: { low: 3, high: 6 },
  techStack: ["Python/Node.js", "PostgreSQL", "Cloud Functions"],
};

const MID_TEAM_DEFAULTS: BuildDefaults = {
  teamComposition: [
    { role: "Backend Engineer", count: 2, monthlyRate: 13000 },
    { role: "Frontend Engineer", count: 1, monthlyRate: 12000 },
    { role: "Product Manager", count: 1, monthlyRate: 14000 },
  ],
  timelineMonths: { low: 4, high: 9 },
  techStack: ["Python/Java", "PostgreSQL", "AWS/GCP", "React"],
};

const ENTERPRISE_TEAM_DEFAULTS: BuildDefaults = {
  teamComposition: [
    { role: "Backend Engineer", count: 3, monthlyRate: 15000 },
    { role: "Frontend Engineer", count: 2, monthlyRate: 14000 },
    { role: "ML Engineer", count: 1, monthlyRate: 17000 },
    { role: "Product Manager", count: 1, monthlyRate: 16000 },
    { role: "QA Engineer", count: 1, monthlyRate: 11000 },
  ],
  timelineMonths: { low: 6, high: 14 },
  techStack: ["Python/Java", "PostgreSQL", "Kubernetes", "AWS/GCP", "React", "ML Pipeline"],
};

function makeBuildDefaults(): Record<string, BuildDefaults> {
  return {
    startup: SMALL_TEAM_DEFAULTS,
    smb: SMALL_TEAM_DEFAULTS,
    "mid-market": MID_TEAM_DEFAULTS,
    enterprise: ENTERPRISE_TEAM_DEFAULTS,
  };
}

// ── AP Capabilities ──

const AP_CAPABILITIES: CapabilityDefinition[] = [
  {
    id: "intelligent-document-processing",
    name: "Intelligent Document Processing",
    category: "ap",
    stepIds: ["invoice-capture", "data-validation"],
    description: "AI-powered capture, extraction, and validation of invoice data from multiple formats — eliminating manual data entry and reducing errors.",
    iconName: "ScanLine",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "intelligent-matching",
    name: "Intelligent Matching & Exception Resolution",
    category: "ap",
    stepIds: ["po-matching", "exception-handling"],
    description: "Automated 2-way and 3-way matching with ML-powered exception routing that learns from historical resolutions.",
    iconName: "GitCompare",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "workflow-automation",
    name: "Workflow Automation",
    category: "ap",
    stepIds: ["approval-routing"],
    description: "Rule-based and AI-assisted approval workflows that route invoices to the right approvers based on amount, vendor, GL code, and historical patterns.",
    iconName: "Route",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "intelligent-gl-coding",
    name: "Intelligent GL Coding",
    category: "ap",
    stepIds: ["coding-gl-allocation"],
    description: "ML-powered general ledger coding that learns from historical patterns to auto-classify and allocate expenses across cost centers.",
    iconName: "Tag",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "fraud-detection",
    name: "AI-Powered Fraud Detection",
    category: "ap",
    stepIds: ["fraud-duplicate-detection"],
    description: "Real-time anomaly detection for duplicate invoices, suspicious vendors, and unusual payment patterns using ML models.",
    iconName: "ShieldAlert",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "payment-orchestration",
    name: "Payment Orchestration",
    category: "ap",
    stepIds: ["payment-scheduling", "payment-execution"],
    description: "Centralized payment execution across methods (ACH, wire, virtual card) with cash flow optimization and early payment discount capture.",
    iconName: "Banknote",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "continuous-reconciliation",
    name: "Continuous Reconciliation",
    category: "ap",
    stepIds: ["reconciliation-reporting"],
    description: "Automated matching of payments to invoices with real-time reconciliation dashboards and exception alerts.",
    iconName: "CheckSquare",
    buildDefaults: makeBuildDefaults(),
  },
];

// ── AR Capabilities ──

const AR_CAPABILITIES: CapabilityDefinition[] = [
  {
    id: "credit-risk-management",
    name: "Credit Risk Management",
    category: "ar",
    stepIds: ["credit-assessment"],
    description: "Automated credit scoring, customer onboarding, and risk monitoring using financial data, payment history, and third-party signals.",
    iconName: "Shield",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "billing-automation",
    name: "Billing Automation",
    category: "ar",
    stepIds: ["order-to-invoice", "invoice-delivery"],
    description: "End-to-end billing from order capture through invoice generation and multi-channel delivery with tracking.",
    iconName: "FileText",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "intelligent-cash-application",
    name: "Intelligent Cash Application",
    category: "ar",
    stepIds: ["payment-tracking", "cash-application"],
    description: "AI-powered matching of incoming payments to open invoices, handling partial payments, overpayments, and remittance data extraction.",
    iconName: "CircleDollarSign",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "dispute-resolution",
    name: "Dispute & Deduction Management",
    category: "ar",
    stepIds: ["deduction-management"],
    description: "Automated deduction identification, root cause analysis, and resolution workflows with supplier collaboration portals.",
    iconName: "MessageSquareWarning",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "collections-intelligence",
    name: "Collections Intelligence",
    category: "ar",
    stepIds: ["collections", "dunning"],
    description: "AI-prioritized collection queues with automated dunning sequences, payment prediction, and customer communication optimization.",
    iconName: "PhoneCall",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "ar-risk-analytics",
    name: "AR Risk & Analytics",
    category: "ar",
    stepIds: ["bad-debt-reserve", "ar-reporting"],
    description: "Predictive bad debt modeling, aging analytics, and real-time AR dashboards with DSO tracking and cash flow forecasting.",
    iconName: "BarChart3",
    buildDefaults: makeBuildDefaults(),
  },
];

// ── FP&A Capabilities ──

const FPA_CAPABILITIES: CapabilityDefinition[] = [
  {
    id: "strategic-planning",
    name: "Strategic Planning & Budgeting",
    category: "fpa",
    stepIds: ["annual-planning", "budgeting"],
    description: "Driver-based annual planning with collaborative budgeting workflows, version control, and multi-scenario target setting.",
    iconName: "Target",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "intelligent-forecasting",
    name: "Intelligent Forecasting",
    category: "fpa",
    stepIds: ["forecasting", "scenario-planning"],
    description: "ML-powered rolling forecasts with automated variance detection, scenario modeling, and what-if analysis capabilities.",
    iconName: "TrendingUp",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "variance-analytics",
    name: "Variance & Performance Analytics",
    category: "fpa",
    stepIds: ["variance-analysis", "financial-modeling"],
    description: "Automated variance commentary generation, driver-based financial modeling, and performance attribution analysis.",
    iconName: "PieChart",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "management-reporting",
    name: "Management & Board Reporting",
    category: "fpa",
    stepIds: ["management-reporting", "board-reporting"],
    description: "Automated report generation with dynamic dashboards, narrative commentary, and board-ready presentation outputs.",
    iconName: "Presentation",
    buildDefaults: makeBuildDefaults(),
  },
  {
    id: "revenue-workforce-planning",
    name: "Revenue & Workforce Planning",
    category: "fpa",
    stepIds: ["revenue-planning", "workforce-planning-fpa"],
    description: "Cohort-based revenue modeling, capacity planning, and headcount impact analysis with scenario comparison.",
    iconName: "Users",
    buildDefaults: makeBuildDefaults(),
  },
];

// ── Public API ──

const ALL_CAPABILITIES: CapabilityDefinition[] = [
  ...AP_CAPABILITIES,
  ...AR_CAPABILITIES,
  ...FPA_CAPABILITIES,
];

/**
 * Get capability definitions for a given process/category.
 */
export function getCapabilitiesForProcess(processId: string): CapabilityDefinition[] {
  const category = processId as Category;
  return ALL_CAPABILITIES.filter((c) => c.category === category);
}

/**
 * Get a single capability by ID.
 */
export function getCapabilityById(id: string): CapabilityDefinition | null {
  return ALL_CAPABILITIES.find((c) => c.id === id) || null;
}

/**
 * Find which capability a step belongs to.
 */
export function getCapabilityForStep(stepId: string, processId: string): CapabilityDefinition | null {
  const caps = getCapabilitiesForProcess(processId);
  return caps.find((c) => c.stepIds.includes(stepId)) || null;
}

/**
 * Get all capabilities across all processes.
 */
export function getAllCapabilities(): CapabilityDefinition[] {
  return ALL_CAPABILITIES;
}
