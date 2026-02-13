import { CompanyDiagnostic } from "@/types/diagnostic";

/**
 * Mock diagnostic profiles keyed by industry + company size.
 * These represent consultant-grade patterns for common company archetypes.
 */

const techSaaSMidMarket: CompanyDiagnostic = {
  companyArchetype: "Mid-Market SaaS — Finance & GTM Heavy",
  archetypeDescription:
    "Companies in this archetype typically have 200–1,500 employees with rapid revenue growth outpacing back-office investment. Finance teams are lean relative to transaction volume, and GTM motions generate significant downstream data that finance must reconcile. The gap between growth velocity and operational maturity creates predictable pain points.",
  companyIntelligence: {
    confidenceLevel: "low",
    confidenceReason: "Private company — using industry-level benchmarks for mid-market SaaS",
    industryBenchmarks: "Mid-market SaaS companies typically spend 8–12% of revenue on G&A, with finance teams of 5–15 people. Invoice volumes range from 200–2,000/month, with 60–70% of AP effort spent on manual data entry and approval routing.",
    competitiveLandscape: "The mid-market SaaS finance automation space is served by tools like Tipalti, Bill.com, Ramp, and Brex for AP; Tesorio and HighRadius for AR; and Mosaic, Pigment, and Anaplan for FP&A.",
  },
  challenges: [
    {
      title: "Manual invoice processing at scale",
      description:
        "SaaS companies with growing vendor ecosystems see invoice volumes climb 30–50% annually while AP teams stay flat. Manual coding, approval routing, and duplicate checking become bottlenecks that delay close.",
      category: "operational",
    },
    {
      title: "Revenue recognition complexity",
      description:
        "Multi-element arrangements, usage-based pricing, and mid-contract changes create ASC 606 compliance pressure. Spreadsheet-based rev rec breaks down past $20M ARR.",
      category: "cost",
    },
    {
      title: "Cash application backlog",
      description:
        "Customer payments arrive via ACH, wire, and card with inconsistent remittance data. Matching payments to invoices consumes 15–25 hours per week in mid-market AR teams.",
      category: "operational",
    },
    {
      title: "Forecast accuracy drift",
      description:
        "FP&A teams rely on static models that lag behind pipeline changes. Board-ready forecasts require 3–5 days of manual data gathering from CRM, billing, and GL systems.",
      category: "data-quality",
    },
    {
      title: "Vendor sprawl and spend visibility",
      description:
        "Fast-growing SaaS companies accumulate 200+ vendors with limited centralized tracking. Duplicate contracts, missed renewals, and untracked commitments create cost leakage of 5–12%.",
      category: "cost",
    },
  ],
  aiApplicability: {
    highLeverage: {
      min: 30,
      max: 45,
      description:
        "Invoice data extraction, payment matching, anomaly detection, and routine journal entries can be fully automated with current AI capabilities.",
    },
    humanInTheLoop: {
      min: 35,
      max: 45,
      description:
        "Approval workflows, exception handling, vendor negotiations, and non-standard rev rec require human judgment but benefit from AI-prepared recommendations.",
    },
    humanLed: {
      min: 15,
      max: 30,
      description:
        "Strategic vendor relationships, board reporting narratives, audit responses, and policy decisions remain human-led with AI providing supporting analysis.",
    },
  },
  automationOpportunity: {
    effortAddressable: { min: 40, max: 60 },
    costSavingsRange: { min: 15, max: 30 },
    capacityUnlocked: { min: 25, max: 45 },
    disclaimer:
      "Ranges reflect patterns from similar companies. Actual results depend on current process maturity, data quality, and implementation approach. These are hypothesis-level estimates meant to guide exploration, not commitments.",
  },
  priorityAreas: [
    {
      functionId: "finance",
      processId: "ap",
      processName: "Accounts Payable",
      rationale:
        "High invoice volume relative to team size, with manual coding and approval routing as primary bottlenecks. AI-powered extraction and three-way matching can unlock 40–60% of AP effort.",
      expectedLeverage: "high",
      link: "/ap",
    },
    {
      functionId: "finance",
      processId: "ar",
      processName: "Accounts Receivable",
      rationale:
        "Cash application backlog and aging tracking consume disproportionate effort. Payment matching automation and intelligent dunning can cut DSO by 10–20%.",
      expectedLeverage: "high",
      link: "/ar",
    },
    {
      functionId: "finance",
      processId: "fpa",
      processName: "FP&A",
      rationale:
        "Manual data aggregation from CRM and billing systems makes forecasting slow and brittle. AI-assisted modeling and automated variance analysis can cut forecast cycle time by 50%.",
      expectedLeverage: "medium",
      link: "/fpa",
    },
  ],
  generatedAt: new Date().toISOString(),
};

const enterpriseManufacturing: CompanyDiagnostic = {
  companyArchetype: "Enterprise Manufacturing — Ops & Finance Integration",
  archetypeDescription:
    "Large manufacturing enterprises with 5,000+ employees face unique challenges at the intersection of operational technology and financial systems. Complex supply chains, multi-entity structures, and high transaction volumes create process density that manual workflows cannot sustain. The primary opportunity is closing the gap between shop floor data and financial reporting.",
  companyIntelligence: {
    confidenceLevel: "low",
    confidenceReason: "Using industry-level benchmarks for enterprise manufacturing",
    industryBenchmarks: "Enterprise manufacturers typically process 10,000–50,000 invoices monthly with shared services centers. Finance teams of 50–200 people manage multi-entity consolidation across 10–50 legal entities. Average close cycle is 8–12 business days.",
    competitiveLandscape: "Enterprise manufacturing finance automation is dominated by SAP, Oracle, and Coupa for procurement; BlackLine and Trintech for close management; and OneStream and Planful for consolidation and planning.",
  },
  challenges: [
    {
      title: "Three-way match at high volume",
      description:
        "Manufacturing AP processes 10,000+ invoices monthly across multiple plants. PO-to-invoice-to-receipt matching requires reconciling data from ERP, WMS, and supplier portals — a labor-intensive process prone to exceptions.",
      category: "scale",
    },
    {
      title: "Intercompany reconciliation burden",
      description:
        "Multi-entity structures with transfer pricing generate thousands of intercompany transactions monthly. Manual reconciliation for elimination entries delays consolidation by 2–4 days each close.",
      category: "operational",
    },
    {
      title: "Cost accounting accuracy",
      description:
        "Standard cost variances, overhead allocation, and WIP valuation require pulling data from production, procurement, and quality systems. Errors cascade into misstated margins and incorrect pricing decisions.",
      category: "data-quality",
    },
    {
      title: "Supplier risk and compliance",
      description:
        "Global supply chains with 500+ suppliers require continuous monitoring for financial health, compliance certifications, and geopolitical risk. Manual monitoring creates blind spots.",
      category: "cost",
    },
    {
      title: "Audit-ready documentation gap",
      description:
        "SOX compliance across multiple entities requires extensive documentation of controls, approvals, and exceptions. Manual evidence collection consumes 2,000+ hours annually.",
      category: "operational",
    },
    {
      title: "Capital expenditure tracking",
      description:
        "Large capital projects span multiple fiscal years with complex capitalization rules. Tracking CapEx against budgets across plants requires manual consolidation of project data.",
      category: "data-quality",
    },
  ],
  aiApplicability: {
    highLeverage: {
      min: 25,
      max: 40,
      description:
        "Invoice matching, GL coding, intercompany reconciliation, and standard variance analysis are highly automatable given the structured, high-volume nature of manufacturing data.",
    },
    humanInTheLoop: {
      min: 35,
      max: 45,
      description:
        "Exception resolution, supplier negotiations, non-standard cost allocations, and audit responses benefit from AI-prepared analysis with human final judgment.",
    },
    humanLed: {
      min: 20,
      max: 35,
      description:
        "Strategic sourcing decisions, capital allocation, compliance strategy, and transfer pricing policy remain human-led given regulatory and strategic complexity.",
    },
  },
  automationOpportunity: {
    effortAddressable: { min: 35, max: 55 },
    costSavingsRange: { min: 20, max: 35 },
    capacityUnlocked: { min: 30, max: 50 },
    disclaimer:
      "Ranges reflect patterns from similar manufacturing enterprises. Actual results depend on ERP integration maturity, data standardization across plants, and change management approach.",
  },
  priorityAreas: [
    {
      functionId: "finance",
      processId: "ap",
      processName: "Accounts Payable",
      rationale:
        "Highest transaction volume in the finance function. Three-way matching automation alone can address 50–70% of invoice processing effort and significantly reduce exception rates.",
      expectedLeverage: "high",
      link: "/ap",
    },
    {
      functionId: "finance",
      processId: "ar",
      processName: "Accounts Receivable",
      rationale:
        "Complex billing terms (progress billing, milestone-based) and high customer count make cash application and credit management prime candidates for AI assistance.",
      expectedLeverage: "medium",
      link: "/ar",
    },
    {
      functionId: "finance",
      processId: "fpa",
      processName: "FP&A",
      rationale:
        "Multi-plant budget consolidation and rolling forecasts currently require 5+ days of manual work. AI-driven data aggregation and variance detection can cut this significantly.",
      expectedLeverage: "medium",
      link: "/fpa",
    },
  ],
  generatedAt: new Date().toISOString(),
};

const healthcareMidMarket: CompanyDiagnostic = {
  companyArchetype: "Mid-Market Healthcare — Compliance & Revenue Cycle",
  archetypeDescription:
    "Healthcare organizations with 500–3,000 employees operate under intense regulatory scrutiny while managing complex revenue cycles spanning payer contracts, patient billing, and reimbursement. Finance teams must balance compliance requirements with operational efficiency, and the cost of errors extends beyond financial impact to patient care and regulatory risk.",
  companyIntelligence: {
    confidenceLevel: "low",
    confidenceReason: "Using industry-level benchmarks for mid-market healthcare",
    industryBenchmarks: "Mid-market healthcare organizations typically see 3–8% revenue leakage from claim denials and underpayments. Finance teams of 10–30 people manage revenue cycles of $50M–$500M with 20+ payer contracts. Average days in AR ranges from 35–55 days.",
    competitiveLandscape: "Healthcare finance automation is served by Waystar, Availity, and Change Healthcare for revenue cycle; Workday and Infor for back-office finance; and nThrive and R1 RCM for outsourced revenue cycle management.",
  },
  challenges: [
    {
      title: "Revenue cycle leakage",
      description:
        "Claim denials, underpayments, and coding errors result in 3–8% revenue leakage. Manual follow-up on denied claims is labor-intensive and time-sensitive — appeals windows are often 30–90 days.",
      category: "cost",
    },
    {
      title: "Payer contract complexity",
      description:
        "Managing fee schedules across 20+ payers with different reimbursement methodologies creates pricing accuracy challenges. Contract terms are manually tracked in spreadsheets, leading to missed rate changes.",
      category: "data-quality",
    },
    {
      title: "Regulatory compliance burden",
      description:
        "HIPAA, Stark Law, Anti-Kickback, and state-specific regulations require extensive documentation and monitoring. Compliance teams spend 40% of time on manual evidence gathering.",
      category: "operational",
    },
    {
      title: "Vendor credentialing and management",
      description:
        "Medical supply vendors and service providers require specialized credentialing, insurance verification, and compliance checks that standard AP workflows don't accommodate.",
      category: "operational",
    },
    {
      title: "Budget variance in clinical operations",
      description:
        "Patient volume fluctuations, staffing costs, and supply chain disruptions create persistent budget variances. Manual variance analysis delays corrective action by 2–3 weeks.",
      category: "scale",
    },
  ],
  aiApplicability: {
    highLeverage: {
      min: 20,
      max: 35,
      description:
        "Claim status checking, payment posting, invoice matching, and routine compliance monitoring can be automated with appropriate guardrails given the structured nature of healthcare transactions.",
    },
    humanInTheLoop: {
      min: 40,
      max: 50,
      description:
        "Clinical coding review, denial management, payer negotiations, and audit preparation benefit significantly from AI-prepared analysis but require human judgment for final decisions.",
    },
    humanLed: {
      min: 20,
      max: 35,
      description:
        "Payer strategy, regulatory interpretation, clinical staffing decisions, and compliance policy remain firmly human-led given the regulatory and patient safety stakes.",
    },
  },
  automationOpportunity: {
    effortAddressable: { min: 30, max: 50 },
    costSavingsRange: { min: 12, max: 25 },
    capacityUnlocked: { min: 20, max: 40 },
    disclaimer:
      "Ranges reflect patterns from similar healthcare organizations. Regulatory constraints may limit automation scope in specific areas. HIPAA and patient data considerations require careful implementation planning.",
  },
  priorityAreas: [
    {
      functionId: "finance",
      processId: "ar",
      processName: "Accounts Receivable",
      rationale:
        "Revenue cycle management is the highest-leverage area. AI-powered claim scrubbing, denial prediction, and automated payment posting can recover 2–5% of currently leaked revenue.",
      expectedLeverage: "high",
      link: "/ar",
    },
    {
      functionId: "finance",
      processId: "ap",
      processName: "Accounts Payable",
      rationale:
        "Medical supply procurement and service vendor management generate high invoice volumes with specialized compliance requirements. Automation can reduce processing time by 40–60%.",
      expectedLeverage: "medium",
      link: "/ap",
    },
    {
      functionId: "finance",
      processId: "fpa",
      processName: "FP&A",
      rationale:
        "Patient volume-driven budgeting and staffing models benefit from AI-assisted forecasting. Connecting clinical volume data to financial projections can cut variance analysis time by 60%.",
      expectedLeverage: "medium",
      link: "/fpa",
    },
  ],
  generatedAt: new Date().toISOString(),
};

const professionalServicesSMB: CompanyDiagnostic = {
  companyArchetype: "Professional Services SMB — People & Project Economics",
  archetypeDescription:
    "Professional services firms with 50–500 employees are fundamentally people businesses where project economics drive profitability. Finance operations center on billable hour tracking, project profitability, and cash flow management. Lean finance teams (often 2–5 people) handle disproportionate complexity across time-based billing, milestone invoicing, and multi-currency operations.",
  companyIntelligence: {
    confidenceLevel: "low",
    confidenceReason: "Using industry-level benchmarks for professional services SMBs",
    industryBenchmarks: "Professional services SMBs typically target 60–70% utilization rates with average project margins of 30–45%. Finance teams of 2–5 people manage 50–200 active projects with billing cycles of 15–30 days. Time-to-invoice averages 5–15 days.",
    competitiveLandscape: "Professional services finance is served by Sage Intacct and QuickBooks for accounting; BigTime, Kantata, and Harvest for project billing; and Expensify and SAP Concur for expense management.",
  },
  challenges: [
    {
      title: "Time-to-invoice lag",
      description:
        "Billable hours captured in project management tools take 5–15 days to become invoices. Manual review, rate verification, and approval cycles delay billing and compress cash flow.",
      category: "operational",
    },
    {
      title: "Project profitability blind spots",
      description:
        "True project costs (loaded labor, subcontractors, expenses) are scattered across systems. Real-time margin visibility requires manual data assembly, often available only after project completion.",
      category: "data-quality",
    },
    {
      title: "Expense report burden",
      description:
        "Travel-heavy consulting models generate 200+ expense reports monthly. Manual receipt matching, policy compliance checking, and client-billable allocation consume 20+ hours per week.",
      category: "operational",
    },
    {
      title: "Cash flow forecasting difficulty",
      description:
        "Project-based revenue with variable billing milestones and payment terms makes cash flow unpredictable. Forecast accuracy below 70% is common for firms without automated pipelines.",
      category: "cost",
    },
    {
      title: "Multi-entity and multi-currency complexity",
      description:
        "Firms with international offices or clients face currency translation, intercompany billing, and jurisdiction-specific tax requirements that strain small finance teams.",
      category: "scale",
    },
  ],
  aiApplicability: {
    highLeverage: {
      min: 25,
      max: 40,
      description:
        "Expense categorization, receipt matching, time entry validation, and routine billing generation are highly automatable given the repetitive, rules-based nature of these tasks.",
    },
    humanInTheLoop: {
      min: 35,
      max: 45,
      description:
        "Invoice customization, project budget adjustments, client negotiations on billing disputes, and non-standard allocation decisions benefit from AI-prepared drafts with human review.",
    },
    humanLed: {
      min: 20,
      max: 35,
      description:
        "Client relationship management, pricing strategy, partner compensation, and strategic resource allocation remain human-led given their relationship and judgment intensity.",
    },
  },
  automationOpportunity: {
    effortAddressable: { min: 35, max: 55 },
    costSavingsRange: { min: 15, max: 28 },
    capacityUnlocked: { min: 25, max: 45 },
    disclaimer:
      "Ranges reflect patterns from similar professional services firms. Firms with established project management and time tracking tools will see faster time-to-value. Results depend on data integration maturity.",
  },
  priorityAreas: [
    {
      functionId: "finance",
      processId: "ap",
      processName: "Accounts Payable",
      rationale:
        "Expense processing and subcontractor invoicing are the highest-volume AP activities. Automated receipt matching and policy compliance checking can eliminate 60–70% of manual review.",
      expectedLeverage: "high",
      link: "/ap",
    },
    {
      functionId: "finance",
      processId: "ar",
      processName: "Accounts Receivable",
      rationale:
        "Reducing time-to-invoice from 15 days to 3 days directly improves cash flow. AI-assisted billing generation from time entries can transform AR cycle times.",
      expectedLeverage: "high",
      link: "/ar",
    },
    {
      functionId: "finance",
      processId: "fpa",
      processName: "FP&A",
      rationale:
        "Project-level profitability analysis and cash flow forecasting are critical but currently manual. AI-driven consolidation of project data into financial models can improve forecast accuracy by 20–30%.",
      expectedLeverage: "medium",
      link: "/fpa",
    },
  ],
  generatedAt: new Date().toISOString(),
};

/**
 * Lookup table: industry × company size → mock profile key
 */
type ProfileKey = "tech-saas-mm" | "enterprise-mfg" | "healthcare-mm" | "proserv-smb";

const INDUSTRY_SIZE_MAP: Record<string, Record<string, ProfileKey>> = {
  Technology: {
    startup: "tech-saas-mm",
    smb: "tech-saas-mm",
    "mid-market": "tech-saas-mm",
    enterprise: "enterprise-mfg", // large tech behaves more like enterprise
  },
  "E-commerce": {
    startup: "tech-saas-mm",
    smb: "tech-saas-mm",
    "mid-market": "tech-saas-mm",
    enterprise: "enterprise-mfg",
  },
  Manufacturing: {
    startup: "proserv-smb",
    smb: "proserv-smb",
    "mid-market": "enterprise-mfg",
    enterprise: "enterprise-mfg",
  },
  Healthcare: {
    startup: "healthcare-mm",
    smb: "healthcare-mm",
    "mid-market": "healthcare-mm",
    enterprise: "healthcare-mm",
  },
  "Professional Services": {
    startup: "proserv-smb",
    smb: "proserv-smb",
    "mid-market": "proserv-smb",
    enterprise: "enterprise-mfg",
  },
  "Financial Services": {
    startup: "tech-saas-mm",
    smb: "proserv-smb",
    "mid-market": "enterprise-mfg",
    enterprise: "enterprise-mfg",
  },
  Retail: {
    startup: "proserv-smb",
    smb: "proserv-smb",
    "mid-market": "enterprise-mfg",
    enterprise: "enterprise-mfg",
  },
};

export const MOCK_PROFILES: Record<ProfileKey, CompanyDiagnostic> = {
  "tech-saas-mm": techSaaSMidMarket,
  "enterprise-mfg": enterpriseManufacturing,
  "healthcare-mm": healthcareMidMarket,
  "proserv-smb": professionalServicesSMB,
};

/**
 * Resolve the best mock profile key for a given industry and company size.
 * Falls back to tech-saas-mm as the default.
 */
export function resolveProfileKey(
  industry: string,
  companySize: string
): ProfileKey {
  const industryMap = INDUSTRY_SIZE_MAP[industry];
  if (industryMap) {
    return industryMap[companySize] || "tech-saas-mm";
  }
  // Default fallback based on company size alone
  if (companySize === "enterprise") return "enterprise-mfg";
  if (companySize === "startup" || companySize === "smb") return "proserv-smb";
  return "tech-saas-mm";
}
