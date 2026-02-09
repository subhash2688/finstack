export interface StepMatch {
  stepId: string;
  stepTitle: string;
  confidence: number;
}

export interface IntentResult {
  query: string;
  matches: StepMatch[];
}

const stepKeywords: Record<string, { title: string; keywords: string[] }> = {
  "invoice-capture": {
    title: "Invoice Receipt & Capture",
    keywords: [
      "invoice capture", "invoice receipt", "data entry", "ocr", "scanning",
      "paper invoices", "pdf invoices", "email invoices", "digitize", "digitization",
      "manual entry", "keying", "invoice intake", "inbox", "mailroom",
      "document capture", "invoice processing", "data extraction", "scan invoices",
      "receiving invoices", "invoice ingestion", "incoming invoices", "invoice volume",
      "too many invoices", "slow processing"
    ],
  },
  "data-validation": {
    title: "Data Validation & Enrichment",
    keywords: [
      "data validation", "data quality", "data enrichment", "verify", "verification",
      "missing data", "incomplete", "master data", "vendor data", "tax id",
      "accuracy", "data errors", "bad data", "dirty data", "data cleansing",
      "cross reference", "cross-reference", "validate invoices", "enrich",
      "missing fields", "incomplete invoices", "wrong data", "incorrect data",
      "data integrity", "data cleanup"
    ],
  },
  "po-matching": {
    title: "3-Way PO Matching",
    keywords: [
      "po matching", "purchase order matching", "three way match", "3-way match",
      "3 way match", "goods receipt", "receiving", "tolerance", "mismatch",
      "invoice matching", "match rate", "unmatched", "partial shipment",
      "discrepancy", "variance", "po match", "purchase order", "receipt matching",
      "matching exceptions", "false exceptions", "matching accuracy", "auto match",
      "fuzzy match", "line item matching"
    ],
  },
  "coding-gl-allocation": {
    title: "Coding & GL Allocation",
    keywords: [
      "gl coding", "general ledger", "cost center", "department allocation",
      "account coding", "chart of accounts", "miscoding", "journal entry",
      "allocation", "coding errors", "gl account", "expense coding",
      "cost allocation", "budget coding", "department codes", "wrong codes",
      "coding consistency", "auto coding", "gl mapping", "account assignment",
      "expense categorization", "cost center allocation"
    ],
  },
  "approval-routing": {
    title: "Approval Routing & Workflow",
    keywords: [
      "approval", "approvals", "approval routing", "approval workflow",
      "approver", "authorization", "sign off", "signoff", "approval queue",
      "stuck approvals", "slow approvals", "approval bottleneck", "delegation",
      "approval chain", "escalation", "routing", "mobile approval",
      "approval delay", "waiting for approval", "approval hierarchy",
      "who approves", "approval matrix", "approval threshold"
    ],
  },
  "exception-handling": {
    title: "Exception Management",
    keywords: [
      "exception", "exceptions", "exception handling", "exception management",
      "discrepancy", "discrepancies", "dispute", "disputes", "vendor dispute",
      "vendor disputes", "resolution", "resolve", "exception queue",
      "invoice hold", "on hold", "blocked invoices", "problem invoices",
      "exception rate", "exception resolution", "troubleshoot", "investigate",
      "price variance", "quantity mismatch", "auto resolve", "exception backlog"
    ],
  },
  "fraud-duplicate-detection": {
    title: "Fraud & Duplicate Detection",
    keywords: [
      "fraud", "fraud detection", "duplicate", "duplicate invoice",
      "duplicate payment", "phantom vendor", "suspicious", "anomaly",
      "anomalies", "compliance", "internal controls", "audit",
      "fraudulent", "double payment", "overpayment", "scam",
      "bank detail change", "vendor fraud", "payment fraud", "risk",
      "duplicate detection", "near duplicate", "pattern detection",
      "forensic", "red flag"
    ],
  },
  "payment-scheduling": {
    title: "Payment Scheduling & Optimization",
    keywords: [
      "payment scheduling", "payment timing", "cash flow", "early payment",
      "discount", "early pay discount", "2/10 net 30", "payment terms",
      "payment optimization", "when to pay", "payment batch", "payment run",
      "cash management", "working capital", "discount capture", "dynamic discounting",
      "payment calendar", "payment forecast", "cash flow forecast",
      "payment prioritization", "vendor terms", "net terms", "payment strategy"
    ],
  },
  "payment-execution": {
    title: "Payment Execution",
    keywords: [
      "payment execution", "pay vendors", "ach", "wire transfer", "check",
      "virtual card", "payment method", "payment rail", "bank file",
      "payment processing", "send payment", "make payment", "international payment",
      "global payment", "cross border", "remittance", "payment file",
      "check printing", "payment automation", "payment error", "wrong payment",
      "payment reversal"
    ],
  },
  "reconciliation-reporting": {
    title: "Reconciliation & Reporting",
    keywords: [
      "reconciliation", "reconcile", "month end", "month-end", "close",
      "reporting", "reports", "ap reporting", "compliance", "audit trail",
      "kpi", "metrics", "dashboards", "analytics", "subledger",
      "1099", "tax reporting", "financial close", "period close",
      "month end close", "ap metrics", "ap kpis", "performance reporting",
      "spend analytics", "visibility", "ap dashboard"
    ],
  },
};

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function getBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

export function mapQueryToSteps(query: string): IntentResult {
  const queryTokens = tokenize(query);
  const queryBigrams = getBigrams(queryTokens);
  const queryTerms = [...queryTokens, ...queryBigrams];

  if (queryTerms.length === 0) {
    return { query, matches: [] };
  }

  const scores: { stepId: string; stepTitle: string; score: number }[] = [];

  for (const [stepId, { title, keywords }] of Object.entries(stepKeywords)) {
    let matchScore = 0;

    for (const term of queryTerms) {
      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();
        // Exact match of term against keyword tokens
        if (keywordLower === term) {
          matchScore += 3;
        } else if (keywordLower.includes(term)) {
          matchScore += 1.5;
        } else if (term.includes(keywordLower)) {
          matchScore += 1;
        }
      }
    }

    // Normalize: max possible ~ queryTerms.length * 3 (all exact matches)
    const maxPossible = queryTerms.length * 3;
    const confidence = Math.min(100, Math.round((matchScore / maxPossible) * 100));

    if (confidence >= 40) {
      scores.push({ stepId, stepTitle: title, score: confidence });
    }
  }

  // Sort by score descending, take top 3
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 3);

  return {
    query,
    matches: top.map((s) => ({
      stepId: s.stepId,
      stepTitle: s.stepTitle,
      confidence: s.score,
    })),
  };
}
