/**
 * ERP Intelligence Database
 *
 * Captures maturity signals, automation ceilings, and change management
 * complexity for major ERP platforms. Used to:
 * 1. Inform diagnostic prompts with system-aware context
 * 2. Boost/penalize tool recommendations based on ERP compatibility
 * 3. Set realistic expectations for automation potential
 */

export interface ERPSignal {
  erpName: string;
  /** Aliases users might type (lowercase) */
  aliases: string[];
  /** What this ERP signals about the company's finance maturity */
  maturitySignal: "early-stage" | "growing" | "established" | "mature";
  /** Description of what the ERP choice tells us */
  maturityDescription: string;
  /** Max automation potential (0-1) before ERP becomes the bottleneck */
  automationCeiling: number;
  /** Change management complexity when introducing new tools alongside this ERP */
  changeManagement: "low" | "medium" | "high";
  changeManagementNotes: string;
  /** What this ERP can do natively (no third-party tools needed) */
  nativeCapabilities: string[];
  /** Known limitations that create opportunities for third-party tools */
  gaps: string[];
  /** Typical company profile using this ERP */
  typicalProfile: string;
}

export const ERP_SIGNALS: ERPSignal[] = [
  {
    erpName: "QuickBooks",
    aliases: ["quickbooks", "qbo", "quickbooks online", "qb", "intuit quickbooks"],
    maturitySignal: "early-stage",
    maturityDescription: "QuickBooks signals early-stage finance operations — likely a small team, manual workflows, and basic reporting. High opportunity for automation, but integration depth may be limited.",
    automationCeiling: 0.85,
    changeManagement: "low",
    changeManagementNotes: "Small teams adapt quickly. QuickBooks users are accustomed to adding apps from the Intuit marketplace.",
    nativeCapabilities: [
      "Basic invoicing and bill pay",
      "Simple bank reconciliation",
      "Standard financial reports",
      "Basic expense tracking",
    ],
    gaps: [
      "No multi-step approval workflows",
      "Limited 3-way matching",
      "Basic reporting — no variance analysis or scenario planning",
      "No built-in vendor management",
      "Manual data entry for most processes",
    ],
    typicalProfile: "Startups and SMBs with <$50M revenue, 1-5 person finance team",
  },
  {
    erpName: "Xero",
    aliases: ["xero", "xero accounting"],
    maturitySignal: "early-stage",
    maturityDescription: "Xero signals a modern, cloud-first SMB — often more tech-savvy than QuickBooks users but still early-stage in finance operations. Strong API ecosystem enables good tool integration.",
    automationCeiling: 0.85,
    changeManagement: "low",
    changeManagementNotes: "Cloud-native user base is generally receptive to new tools. Strong marketplace ecosystem.",
    nativeCapabilities: [
      "Invoicing with online payments",
      "Bank feeds and reconciliation",
      "Basic expense claims",
      "Multi-currency support",
    ],
    gaps: [
      "No advanced AP automation",
      "Limited approval workflows",
      "Basic FP&A capabilities",
      "No inventory management (requires add-ons)",
    ],
    typicalProfile: "Cloud-first SMBs, often international, <$30M revenue",
  },
  {
    erpName: "Sage",
    aliases: ["sage", "sage intacct", "sage 100", "sage 300", "sage x3", "sage 50"],
    maturitySignal: "growing",
    maturityDescription: "Sage (especially Intacct) signals a company that has outgrown basic accounting and is investing in more sophisticated finance operations. Multi-entity, multi-currency needs are common.",
    automationCeiling: 0.80,
    changeManagement: "medium",
    changeManagementNotes: "Sage users have invested in their ERP and may be cautious about adding tools that overlap. Intacct's API is strong; older Sage versions (50/100/300) are harder to integrate.",
    nativeCapabilities: [
      "Multi-entity consolidation (Intacct)",
      "Dimensional reporting",
      "Contract revenue management",
      "Project accounting",
      "Basic AP/AR automation",
    ],
    gaps: [
      "Limited AI/ML capabilities",
      "AP automation requires add-ons for OCR/matching",
      "No built-in FP&A or planning tools",
      "Vendor management is basic",
    ],
    typicalProfile: "Mid-market companies $20M-$500M, 5-20 person finance team, often SaaS or professional services",
  },
  {
    erpName: "Oracle NetSuite",
    aliases: ["netsuite", "oracle netsuite", "oracle ns", "ns"],
    maturitySignal: "established",
    maturityDescription: "NetSuite signals a company with established finance operations and meaningful complexity — multi-subsidiary, multi-currency, growing transaction volumes. The platform is capable but often under-utilized.",
    automationCeiling: 0.75,
    changeManagement: "medium",
    changeManagementNotes: "NetSuite is customizable, so teams may have built workarounds they're attached to. SuiteFlow/SuiteScript customizations can complicate new tool integrations.",
    nativeCapabilities: [
      "Full AP/AR with approval workflows",
      "Multi-subsidiary consolidation",
      "Revenue recognition (ASC 606)",
      "Inventory and supply chain",
      "Basic planning and budgeting",
      "SuiteAnalytics for reporting",
    ],
    gaps: [
      "OCR and intelligent document processing",
      "Advanced cash forecasting",
      "Sophisticated FP&A and scenario modeling",
      "Vendor risk management",
      "AI-powered matching and anomaly detection",
    ],
    typicalProfile: "Growth-stage and mid-market companies $30M-$1B, 10-50 person finance team",
  },
  {
    erpName: "Microsoft Dynamics",
    aliases: ["dynamics", "dynamics 365", "microsoft dynamics", "d365", "dynamics gp", "dynamics nav", "dynamics bc", "business central"],
    maturitySignal: "established",
    maturityDescription: "Dynamics signals enterprise-grade infrastructure with deep Microsoft ecosystem integration. Companies often have complex requirements but benefit from Excel/Power BI connectivity.",
    automationCeiling: 0.75,
    changeManagement: "medium",
    changeManagementNotes: "Heavy Microsoft ecosystem dependency. Teams are comfortable with Power Automate/Power BI but may resist non-Microsoft tools. D365 Finance has good APIs; older GP/NAV versions are harder.",
    nativeCapabilities: [
      "Full AP/AR with workflow automation",
      "Multi-company, multi-currency",
      "Fixed assets management",
      "Budgeting and forecasting (basic)",
      "Power BI integration for reporting",
      "Bank reconciliation",
    ],
    gaps: [
      "AI-powered document processing (needs AI Builder add-on)",
      "Advanced FP&A beyond basic budgeting",
      "Sophisticated vendor management",
      "Real-time cash flow forecasting",
    ],
    typicalProfile: "Mid-market to enterprise, $50M-$5B, often manufacturing, distribution, or professional services",
  },
  {
    erpName: "SAP",
    aliases: ["sap", "sap s/4hana", "sap hana", "sap ecc", "sap r/3", "sap business one", "sap b1"],
    maturitySignal: "mature",
    maturityDescription: "SAP signals a mature, complex finance organization with significant process standardization. High automation ceiling but also high change management complexity. Often the ERP constrains what's possible rather than enabling it.",
    automationCeiling: 0.70,
    changeManagement: "high",
    changeManagementNotes: "SAP environments are heavily customized and change-resistant. New tools must fit within established SAP workflows. IT involvement is mandatory. Expect 6-12 month implementation cycles for new integrations.",
    nativeCapabilities: [
      "Comprehensive AP/AR with complex approval chains",
      "Multi-entity global consolidation",
      "Treasury and cash management",
      "Advanced revenue recognition",
      "GRC (Governance, Risk, Compliance)",
      "Embedded analytics (SAP Analytics Cloud)",
    ],
    gaps: [
      "User experience (complex UI drives workarounds)",
      "Agile reporting (rigid data structures)",
      "AI-native processing (bolted on, not embedded)",
      "Vendor onboarding and risk management",
      "Real-time scenario planning",
    ],
    typicalProfile: "Enterprise $500M+, 50+ person finance team, global operations, heavily regulated industries",
  },
  {
    erpName: "Workday",
    aliases: ["workday", "workday financials", "workday financial management"],
    maturitySignal: "mature",
    maturityDescription: "Workday Financials signals a modern enterprise that has invested heavily in cloud-first infrastructure. Strong data model but the finance module is less mature than HR — gaps exist in AP automation and planning.",
    automationCeiling: 0.75,
    changeManagement: "high",
    changeManagementNotes: "Workday's unified data model means changes ripple across HR and Finance. Strong partner ecosystem but tools must be Workday-certified. IT and procurement gatekeeping is typical.",
    nativeCapabilities: [
      "Unified HR + Finance data model",
      "Real-time financial reporting",
      "Multi-entity management",
      "Expense management",
      "Basic procurement",
      "Audit trail and compliance",
    ],
    gaps: [
      "AP automation (basic — no intelligent OCR)",
      "Advanced FP&A (Adaptive Planning is separate SKU)",
      "AR collections and cash application",
      "Vendor risk management",
      "AI-powered anomaly detection",
    ],
    typicalProfile: "Enterprise $500M+, modern cloud-first companies, often tech or professional services",
  },
];

/**
 * Look up ERP signal by name (case-insensitive, alias-aware).
 */
export function getERPSignal(erpName: string): ERPSignal | null {
  if (!erpName) return null;
  const lower = erpName.toLowerCase().trim();
  return ERP_SIGNALS.find(
    (s) => s.erpName.toLowerCase() === lower || s.aliases.includes(lower)
  ) || null;
}

/**
 * Build a concise ERP context string for injection into diagnostic prompts.
 */
export function buildERPContext(erpName: string): string {
  const signal = getERPSignal(erpName);
  if (!signal) return "";

  return `ERP SYSTEM CONTEXT:
The company uses ${signal.erpName}, which signals ${signal.maturitySignal} finance operations.
${signal.maturityDescription}
- Automation ceiling: ${Math.round(signal.automationCeiling * 100)}% (beyond this, the ERP becomes the bottleneck)
- Change management: ${signal.changeManagement} complexity — ${signal.changeManagementNotes}
- Native capabilities: ${signal.nativeCapabilities.join(", ")}
- Key gaps (opportunities for tools): ${signal.gaps.join(", ")}
- Typical profile: ${signal.typicalProfile}

IMPORTANT: Factor the ERP context into your diagnostic. A ${signal.erpName} user with ${signal.changeManagement} change management complexity will need different recommendations than a QuickBooks user.`;
}
