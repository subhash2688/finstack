import { CompanySize } from "@/types/tool";

export interface SubSectorConfig {
  id: string;
  name: string;
  typicalPainPoints: Record<string, string[]>;
  toolAffinities: Record<string, string[]>;
  processCharacteristics: Record<string, {
    volumeProfile: string;
    maturityBaseline: string;
    keyMetrics: string[];
  }>;
}

export const TECH_SUB_SECTORS: SubSectorConfig[] = [
  {
    id: "saas",
    name: "SaaS",
    typicalPainPoints: {
      ap: ["High volume of SaaS subscriptions", "Complex multi-entity structures", "Prepaid expense amortization"],
      ar: ["Subscription revenue recognition", "Complex billing rules", "High volume dunning"],
      fpa: ["MRR/ARR forecasting", "Cohort analysis", "Unit economics tracking"],
    },
    toolAffinities: {
      ap: ["bill", "airbase", "ramp", "brex"],
      ar: ["chargebee", "stripe-billing", "zuora"],
      fpa: ["mosaic", "pigment", "drivetrain"],
    },
    processCharacteristics: {
      ap: { volumeProfile: "Medium-high, recurring subscriptions", maturityBaseline: "Semi-automated", keyMetrics: ["Cost per invoice", "Cycle time", "Duplicate rate"] },
      ar: { volumeProfile: "High, subscription-based", maturityBaseline: "Automated", keyMetrics: ["DSO", "Net retention", "Collections rate"] },
      fpa: { volumeProfile: "Monthly cadence", maturityBaseline: "Semi-automated", keyMetrics: ["Forecast accuracy", "Budget variance", "Close time"] },
    },
  },
  {
    id: "semiconductor",
    name: "Semiconductor",
    typicalPainPoints: {
      ap: ["Complex supply chain payments", "Multi-currency transactions", "Capital equipment POs"],
      ar: ["Long payment terms (net-60+)", "Design win revenue recognition", "Distributor rebates"],
      fpa: ["Fab utilization forecasting", "Capex planning", "Wafer cost modeling"],
    },
    toolAffinities: {
      ap: ["coupa", "sap-ariba", "tipalti"],
      ar: ["highradius", "billtrust"],
      fpa: ["anaplan", "oracle-epm", "planful"],
    },
    processCharacteristics: {
      ap: { volumeProfile: "Lower volume, high value", maturityBaseline: "Semi-automated", keyMetrics: ["PO match rate", "DPO", "Early payment discount capture"] },
      ar: { volumeProfile: "Lower volume, complex terms", maturityBaseline: "Semi-automated", keyMetrics: ["DSO", "Bad debt ratio", "Dispute resolution time"] },
      fpa: { volumeProfile: "Quarterly cycle", maturityBaseline: "Mature", keyMetrics: ["Forecast accuracy", "Capex vs budget", "Gross margin variance"] },
    },
  },
  {
    id: "hardware",
    name: "Hardware / Devices",
    typicalPainPoints: {
      ap: ["Component supplier management", "Landed cost tracking", "Warranty accruals"],
      ar: ["Channel partner billing", "Hardware + services bundling", "Returns processing"],
      fpa: ["BOM cost forecasting", "Inventory planning", "Channel mix analysis"],
    },
    toolAffinities: {
      ap: ["coupa", "sap-ariba", "stampli"],
      ar: ["highradius", "esker"],
      fpa: ["anaplan", "adaptive-planning", "vena"],
    },
    processCharacteristics: {
      ap: { volumeProfile: "High, manufacturing-related", maturityBaseline: "Semi-automated", keyMetrics: ["3-way match rate", "DPO", "Supplier payment accuracy"] },
      ar: { volumeProfile: "Medium, mixed direct/channel", maturityBaseline: "Semi-automated", keyMetrics: ["DSO", "Returns rate", "Channel AR aging"] },
      fpa: { volumeProfile: "Monthly/quarterly", maturityBaseline: "Semi-automated", keyMetrics: ["COGS forecast accuracy", "Inventory turns", "Gross margin"] },
    },
  },
  {
    id: "fintech",
    name: "FinTech",
    typicalPainPoints: {
      ap: ["Regulatory compliance in payments", "High transaction volumes", "Multi-entity complexity"],
      ar: ["Transaction-based revenue recognition", "Interchange fee tracking", "Merchant settlements"],
      fpa: ["Transaction volume forecasting", "Take rate analysis", "Regulatory capital planning"],
    },
    toolAffinities: {
      ap: ["airbase", "ramp", "bill"],
      ar: ["stripe-billing", "zuora", "chargebee"],
      fpa: ["mosaic", "pigment", "cube"],
    },
    processCharacteristics: {
      ap: { volumeProfile: "High volume", maturityBaseline: "Automated", keyMetrics: ["Cost per transaction", "Compliance rate", "Cycle time"] },
      ar: { volumeProfile: "Very high, automated", maturityBaseline: "Automated", keyMetrics: ["Settlement time", "Revenue leakage", "Dispute rate"] },
      fpa: { volumeProfile: "Real-time + monthly", maturityBaseline: "Automated", keyMetrics: ["Revenue forecast accuracy", "Unit economics", "Burn rate"] },
    },
  },
  {
    id: "enterprise-software",
    name: "Enterprise Software",
    typicalPainPoints: {
      ap: ["License true-ups", "Professional services accruals", "Multi-entity consolidation"],
      ar: ["Complex deal structures", "Multi-year contracts", "ASC 606 compliance"],
      fpa: ["Bookings vs billings vs revenue", "Pipeline forecasting", "Headcount planning"],
    },
    toolAffinities: {
      ap: ["stampli", "tipalti", "coupa"],
      ar: ["highradius", "tesorio", "billtrust"],
      fpa: ["anaplan", "adaptive-planning", "planful"],
    },
    processCharacteristics: {
      ap: { volumeProfile: "Medium", maturityBaseline: "Semi-automated", keyMetrics: ["Invoice processing time", "DPO", "Policy compliance"] },
      ar: { volumeProfile: "Lower volume, high value", maturityBaseline: "Semi-automated", keyMetrics: ["DSO", "Rev rec accuracy", "Collection effectiveness"] },
      fpa: { volumeProfile: "Monthly/quarterly", maturityBaseline: "Semi-automated", keyMetrics: ["Forecast accuracy", "Quota attainment", "Rule of 40"] },
    },
  },
  {
    id: "marketplace",
    name: "Marketplace / Platform",
    typicalPainPoints: {
      ap: ["Seller payouts at scale", "Tax withholding complexity", "Cross-border payments"],
      ar: ["Take rate tracking", "Buyer/seller disputes", "Refund processing"],
      fpa: ["GMV forecasting", "Take rate optimization", "Marketplace liquidity modeling"],
    },
    toolAffinities: {
      ap: ["tipalti", "bill", "payoneer"],
      ar: ["stripe-billing", "chargebee"],
      fpa: ["mosaic", "pigment", "cube"],
    },
    processCharacteristics: {
      ap: { volumeProfile: "Very high, automated payouts", maturityBaseline: "Automated", keyMetrics: ["Payout accuracy", "Time to payout", "Error rate"] },
      ar: { volumeProfile: "Very high, transaction-based", maturityBaseline: "Automated", keyMetrics: ["GMV", "Take rate", "Dispute resolution time"] },
      fpa: { volumeProfile: "Real-time + monthly", maturityBaseline: "Semi-automated", keyMetrics: ["GMV forecast accuracy", "Cohort retention", "Contribution margin"] },
    },
  },
];

export function getSubSectorById(id: string): SubSectorConfig | undefined {
  return TECH_SUB_SECTORS.find((s) => s.id === id);
}

export function getSubSectorNames(): { id: string; name: string }[] {
  return TECH_SUB_SECTORS.map((s) => ({ id: s.id, name: s.name }));
}

export const COMPANY_SIZES: { id: CompanySize; label: string; range: string }[] = [
  { id: "startup", label: "Startup", range: "<$10M revenue, <50 employees" },
  { id: "smb", label: "SMB", range: "$10M-$50M revenue, 50-200 employees" },
  { id: "mid-market", label: "Mid-Market", range: "$50M-$500M revenue, 200-2000 employees" },
  { id: "enterprise", label: "Enterprise", range: "$500M+ revenue, 2000+ employees" },
];
