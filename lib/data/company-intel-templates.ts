import {
  HeadcountProfile,
  FinancialProfile,
} from "@/types/diagnostic";

/**
 * Template profiles for Company Intelligence dashboard.
 *
 * IMPORTANT: These are ONLY used as fallbacks for private companies
 * where EDGAR data is unavailable. They provide rough industry-level
 * estimates — NOT company-specific data.
 *
 * For public companies, we use real EDGAR data and do NOT show
 * operational metrics, peer benchmarks, or competitive positioning
 * because we have no credible source for those.
 */

interface CompanyIntelTemplate {
  headcount: HeadcountProfile;
  financialProfile: FinancialProfile; // Fallback for private companies
}

// ── Tech SaaS Mid-Market ──

const techSaaSMM: CompanyIntelTemplate = {
  headcount: {
    totalFormatted: "Not available",
    insight: "Employee data not available for private companies without SEC filings.",
  },
  financialProfile: {
    source: "estimated",
    currency: "USD",
    revenueScale: "Not disclosed",
    yearlyData: [],
    keyInsight: "Financial data not available — private company without SEC filings.",
  },
};

// ── Enterprise Manufacturing ──

const enterpriseMfg: CompanyIntelTemplate = {
  headcount: {
    totalFormatted: "Not available",
    insight: "Employee data not available for private companies without SEC filings.",
  },
  financialProfile: {
    source: "estimated",
    currency: "USD",
    revenueScale: "Not disclosed",
    yearlyData: [],
    keyInsight: "Financial data not available — private company without SEC filings.",
  },
};

// ── Healthcare Mid-Market ──

const healthcareMM: CompanyIntelTemplate = {
  headcount: {
    totalFormatted: "Not available",
    insight: "Employee data not available for private companies without SEC filings.",
  },
  financialProfile: {
    source: "estimated",
    currency: "USD",
    revenueScale: "Not disclosed",
    yearlyData: [],
    keyInsight: "Financial data not available — private company without SEC filings.",
  },
};

// ── Professional Services SMB ──

const proservSMB: CompanyIntelTemplate = {
  headcount: {
    totalFormatted: "Not available",
    insight: "Employee data not available for private companies without SEC filings.",
  },
  financialProfile: {
    source: "estimated",
    currency: "USD",
    revenueScale: "Not disclosed",
    yearlyData: [],
    keyInsight: "Financial data not available — private company without SEC filings.",
  },
};

// ── Template Registry ──

type IntelProfileKey = "tech-saas-mm" | "enterprise-mfg" | "healthcare-mm" | "proserv-smb";

const INTEL_TEMPLATES: Record<IntelProfileKey, CompanyIntelTemplate> = {
  "tech-saas-mm": techSaaSMM,
  "enterprise-mfg": enterpriseMfg,
  "healthcare-mm": healthcareMM,
  "proserv-smb": proservSMB,
};

const INTEL_INDUSTRY_MAP: Record<string, Record<string, IntelProfileKey>> = {
  Technology: {
    startup: "tech-saas-mm",
    smb: "tech-saas-mm",
    "mid-market": "tech-saas-mm",
    enterprise: "tech-saas-mm",
  },
  "E-commerce": {
    startup: "tech-saas-mm",
    smb: "tech-saas-mm",
    "mid-market": "tech-saas-mm",
    enterprise: "tech-saas-mm",
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

/**
 * Resolve the best company intel template for a given industry and company size.
 */
export function resolveCompanyIntelTemplate(
  industry: string,
  companySize: string
): CompanyIntelTemplate {
  const industryMap = INTEL_INDUSTRY_MAP[industry];
  let key: IntelProfileKey;

  if (industryMap) {
    key = industryMap[companySize] || "tech-saas-mm";
  } else if (companySize === "enterprise") {
    key = "enterprise-mfg";
  } else if (companySize === "startup" || companySize === "smb") {
    key = "proserv-smb";
  } else {
    key = "tech-saas-mm";
  }

  return INTEL_TEMPLATES[key];
}
