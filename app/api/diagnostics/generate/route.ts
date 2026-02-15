import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";
import { ClientContext } from "@/types/engagement";
import { CompanyDiagnostic, CompanyIntelligence, FinancialProfile, PeerComparisonSet, LeadershipProfile, CompanyCommentaryData } from "@/types/diagnostic";
import { buildERPContext } from "@/lib/data/erp-intelligence";
import { ScoringResult } from "@/lib/scoring/automation-score";

// Rate limiting: 10 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

interface ProcessContext {
  processId: string;
  processName: string;
  context?: Record<string, string>;
}

interface MaturityDataEntry {
  processId: string;
  processName: string;
  ratings: Record<string, string>;
  totalSteps: number;
  ratedSteps: number;
}

interface TranscriptEvidenceEntry {
  processId: string;
  painPoints: string[];
  quotes: { text: string; speaker: string }[];
  toolMentions: string[];
}

interface CompanyIntelEnrichment {
  financialProfile?: FinancialProfile;
  peerComparison?: PeerComparisonSet;
  leadership?: LeadershipProfile;
  commentary?: CompanyCommentaryData;
}

interface GenerateRequest {
  clientContext: ClientContext;
  processAssessments: ProcessContext[];
  maturityData?: MaturityDataEntry[];
  isRefinement?: boolean;
  companyIntel?: CompanyIntelEnrichment;
  transcriptEvidence?: TranscriptEvidenceEntry[];
  scoringResult?: ScoringResult;
  digitalMaturitySummary?: string;
}

/**
 * Build financial profile section for the prompt.
 */
function buildFinancialSection(fp: FinancialProfile): string {
  const latest = fp.yearlyData?.[0];
  if (!latest) return "";

  const lines: string[] = ["FINANCIAL PROFILE (from SEC EDGAR):"];

  if (latest.revenue != null) {
    const revB = latest.revenue / 1_000_000_000;
    const revM = latest.revenue / 1_000_000;
    const revStr = revB >= 1 ? `$${revB.toFixed(2)}B` : `$${revM.toFixed(0)}M`;
    lines.push(`- Revenue: ${revStr}${latest.revenueGrowth != null ? ` (${latest.revenueGrowth > 0 ? "+" : ""}${latest.revenueGrowth.toFixed(1)}% YoY)` : ""}`);
  }

  if (latest.grossMargin != null) lines.push(`- Gross Margin: ${latest.grossMargin.toFixed(1)}%`);
  if (latest.operatingMargin != null) lines.push(`- Operating Margin: ${latest.operatingMargin.toFixed(1)}%`);

  // Expense breakdown
  if (latest.expenses && latest.expenses.length > 0 && latest.revenue) {
    const expLines = latest.expenses
      .filter((e) => e.amount && e.amount > 0)
      .map((e) => {
        const pct = e.asPercentOfRevenue ? `${e.asPercentOfRevenue.toFixed(1)}%` : `${((e.amount! / latest.revenue!) * 100).toFixed(1)}%`;
        return `${e.category}: ${pct} of revenue`;
      });
    if (expLines.length > 0) lines.push(`- ${expLines.join(", ")}`);
  }

  if (fp.employeeCount) {
    lines.push(`- Employees: ~${fp.employeeCount.toLocaleString()}`);
    if (fp.revenuePerEmployee) {
      lines.push(`- Revenue/Employee: $${Math.round(fp.revenuePerEmployee)}K`);
    }
  }

  // Derived metrics
  const dm = fp.derivedMetrics;
  if (dm) {
    const metricParts: string[] = [];
    if (dm.dso != null) metricParts.push(`DSO: ${dm.dso} days`);
    if (dm.dpo != null) metricParts.push(`DPO: ${dm.dpo} days`);
    if (dm.currentRatio != null) metricParts.push(`Current Ratio: ${dm.currentRatio.toFixed(1)}`);
    if (dm.debtToEquity != null) metricParts.push(`Debt/Equity: ${dm.debtToEquity.toFixed(2)}`);
    if (metricParts.length > 0) lines.push(`- ${metricParts.join(", ")}`);
  }

  // Balance sheet highlights
  const bs = fp.balanceSheet?.[0];
  if (bs) {
    const bsParts: string[] = [];
    if (bs.cash != null) bsParts.push(`Cash: $${(bs.cash / 1_000_000).toFixed(0)}M`);
    if (bs.accountsReceivable != null) bsParts.push(`AR: $${(bs.accountsReceivable / 1_000_000).toFixed(0)}M`);
    if (bs.accountsPayable != null) bsParts.push(`AP: $${(bs.accountsPayable / 1_000_000).toFixed(0)}M`);
    if (bsParts.length > 0) lines.push(`- Balance Sheet: ${bsParts.join(", ")}`);
  }

  if (fp.keyInsight) lines.push(`- Key Insight: ${fp.keyInsight}`);

  return lines.join("\n");
}

/**
 * Build peer comparison section for the prompt.
 */
function buildPeerSection(pc: PeerComparisonSet): string {
  if (!pc.peers || pc.peers.length === 0) return "";
  const lines: string[] = [`PEER COMPARISON [Source: ${pc.competitorSource || "SIC"}]:`];
  for (const peer of pc.peers.slice(0, 5)) {
    const parts: string[] = [`- vs ${peer.companyName || peer.ticker}`];
    if (peer.revenue != null) parts.push(`Revenue $${(peer.revenue / 1_000_000_000).toFixed(1)}B`);
    if (peer.operatingMargin != null) parts.push(`Op Margin ${peer.operatingMargin.toFixed(1)}%`);
    if (peer.grossMargin != null) parts.push(`Gross ${peer.grossMargin.toFixed(1)}%`);
    lines.push(parts.join(", "));
  }
  return lines.join("\n");
}

/**
 * Build leadership context section for the prompt.
 */
function buildLeadershipSection(lp: LeadershipProfile): string {
  if (!lp.executives || lp.executives.length === 0) return "";
  const lines: string[] = ["LEADERSHIP:"];
  for (const exec of lp.executives.slice(0, 5)) {
    let line = `- ${exec.name}, ${exec.title}`;
    if (exec.background) line += ` (${exec.background})`;
    lines.push(line);
  }
  lines.push("[Use this to calibrate sophistication of finance operations]");
  return lines.join("\n");
}

/**
 * Build company commentary section for the prompt.
 */
function buildCommentarySection(cc: CompanyCommentaryData): string {
  const lines: string[] = ["COMPANY COMMENTARY:"];
  if (cc.headwinds?.length) lines.push(`- Headwinds: ${cc.headwinds.join("; ")}`);
  if (cc.tailwinds?.length) lines.push(`- Tailwinds: ${cc.tailwinds.join("; ")}`);
  if (cc.productSegments?.length) {
    lines.push(`- Segments: ${cc.productSegments.map((s) => s.name).join(", ")}`);
  }
  if (cc.marketDynamics) lines.push(`- Market: ${cc.marketDynamics}`);
  return lines.join("\n");
}

/**
 * Build transcript evidence section for the prompt.
 */
function buildTranscriptSection(evidence: TranscriptEvidenceEntry[]): string {
  if (!evidence || evidence.length === 0) return "";
  const lines: string[] = ["TRANSCRIPT EVIDENCE (from client interviews):"];
  for (const e of evidence) {
    if (e.painPoints.length > 0) {
      for (const pp of e.painPoints.slice(0, 3)) {
        lines.push(`- Pain point (${e.processId}): "${pp}"`);
      }
    }
    if (e.quotes.length > 0) {
      for (const q of e.quotes.slice(0, 3)) {
        lines.push(`- Quote (${q.speaker}): "${q.text}"`);
      }
    }
    if (e.toolMentions.length > 0) {
      lines.push(`- Tool mentions (${e.processId}): ${e.toolMentions.join(", ")}`);
    }
  }
  return lines.join("\n");
}

/**
 * Build scoring constraints section for the prompt.
 * These are HARD CONSTRAINTS the LLM must respect.
 */
function buildScoringConstraints(sr: ScoringResult): string {
  const lines: string[] = [
    "COMPUTED CONSTRAINTS (from EDGAR financial data — DO NOT override these numbers):",
    `- Complexity score: ${sr.complexityScore}/100`,
    `- Automation ceiling: ${sr.constraints.highLeverageMax}% (your highLeverage.max MUST NOT exceed this)`,
    `- Effort addressable range: ${sr.constraints.effortAddressableRange}`,
    `- Cost savings potential: ${sr.constraints.costSavingsRange}`,
  ];

  if (sr.gaGapVsPeers != null) {
    const direction = sr.gaGapVsPeers > 0 ? "above" : "below";
    lines.push(`- G&A gap: ${sr.gaGapVsPeers > 0 ? "+" : ""}${sr.gaGapVsPeers.toFixed(1)}pp ${direction} peer median${sr.peerContext.medianGA != null ? ` (${sr.peerContext.medianGA.toFixed(1)}%)` : ""}`);
  }
  if (sr.dsoGap != null) {
    lines.push(`- DSO gap: ${sr.dsoGap > 0 ? "+" : ""}${sr.dsoGap.toFixed(0)} days vs peers → ${sr.dsoGap > 0 ? "AR process improvement signal" : "AR already efficient"}`);
  }
  if (sr.dpoGap != null) {
    lines.push(`- DPO gap: ${sr.dpoGap > 0 ? "+" : ""}${sr.dpoGap.toFixed(0)} days vs peers → ${sr.dpoGap > 0 ? "AP paying slower than peers" : "AP already efficient"}`);
  }
  if (sr.revenuePerEmployee != null && sr.peerMedianRevenuePerEmployee != null) {
    lines.push(`- Revenue/employee: $${Math.round(sr.revenuePerEmployee)}K vs peer median $${Math.round(sr.peerMedianRevenuePerEmployee)}K`);
  }

  lines.push(`- Peer context: ${sr.peerContext.peerCount} peers [${sr.peerContext.source}]`);
  lines.push("");
  lines.push("Explain WHY these numbers make sense for this specific company. Use the computed ranges as your anchor — do not invent different numbers.");

  return lines.join("\n");
}

/**
 * Build digital maturity section for the prompt.
 */
function buildDigitalMaturitySection(summary: string): string {
  return `DIGITAL MATURITY SIGNALS (from web research):
${summary}

[Use these maturity signals to calibrate technology recommendations and change management complexity]`;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { clientContext, processAssessments, maturityData, isRefinement, companyIntel, transcriptEvidence, scoringResult, digitalMaturitySummary } = body;

    if (!clientContext || !clientContext.companyName) {
      return NextResponse.json(
        { error: "Client context with company name is required" },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Maximum 10 diagnostic generations per hour.",
          retryAfter: 3600,
        },
        { status: 429 }
      );
    }

    // Resolve ERP from client context or process-level context
    const erpName = clientContext.erp
      || (processAssessments || []).map((p) => p.context?.erp).find(Boolean)
      || "";

    // Build process context section for the prompt
    const processSection = (processAssessments || [])
      .map((p) => {
        const ctx = p.context || {};
        const details = Object.entries(ctx)
          .filter(([, v]) => v)
          .map(([k, v]) => `  - ${k}: ${v}`)
          .join("\n");
        return `- ${p.processName} (${p.processId})${details ? "\n" + details : ""}`;
      })
      .join("\n");

    // Build the selected process list for priority areas instruction
    const selectedProcessIds = (processAssessments || []).map((p) => ({
      processId: p.processId,
      processName: p.processName,
      functionId: clientContext.functionId || "finance",
    }));

    // Build company intelligence prompt section
    const isPublicCompany = clientContext.isPublic && clientContext.tickerSymbol;
    const companyIntelligencePrompt = isPublicCompany
      ? `\nCOMPANY INTELLIGENCE REQUEST:
This is a PUBLIC company with ticker ${clientContext.tickerSymbol}. Use your training knowledge to provide:
- Known products/services, business model, and revenue scale
- Industry positioning and key competitors
- Technology stack and operational characteristics relevant to finance transformation
- Any known challenges, recent strategic shifts, or market dynamics
Generate a "companyIntelligence" section with confidenceLevel "high" if you recognize the company, "medium" if partially recognized.`
      : `\nCOMPANY INTELLIGENCE REQUEST:
This is a PRIVATE company. Generate a "companyIntelligence" section with:
- confidenceLevel: "low" (unless you happen to recognize the company, then use "medium")
- Industry-level benchmarks for ${clientContext.industry} companies of ${clientContext.companySize} size
- Typical competitive landscape patterns for this segment`;

    // Build maturity data section for refinements
    const maturitySection = maturityData && maturityData.length > 0
      ? `\nACTUAL ASSESSMENT DATA (from completed maturity assessments):
${maturityData.map((m) => {
  const ratingEntries = Object.entries(m.ratings)
    .map(([stepId, level]) => `    ${stepId}: ${level}`)
    .join("\n");
  return `- ${m.processName} (${m.ratedSteps}/${m.totalSteps} steps rated):\n${ratingEntries}`;
}).join("\n")}

${isRefinement ? "IMPORTANT: This is a REFINEMENT of a previous hypothesis. Recalibrate ALL ranges and assessments based on the actual maturity data above rather than assumptions. The assessment data should visibly shift your estimates — if a process was assessed as more mature than expected, narrow the opportunity ranges; if less mature, widen them." : ""}`
      : "";

    // Build enrichment sections from Company Intel + Transcripts
    const enrichmentSections: string[] = [];
    if (companyIntel?.financialProfile) {
      const s = buildFinancialSection(companyIntel.financialProfile);
      if (s) enrichmentSections.push(s);
    }
    if (companyIntel?.peerComparison) {
      const s = buildPeerSection(companyIntel.peerComparison);
      if (s) enrichmentSections.push(s);
    }
    if (companyIntel?.leadership) {
      const s = buildLeadershipSection(companyIntel.leadership);
      if (s) enrichmentSections.push(s);
    }
    if (companyIntel?.commentary) {
      const s = buildCommentarySection(companyIntel.commentary);
      if (s) enrichmentSections.push(s);
    }
    if (transcriptEvidence && transcriptEvidence.length > 0) {
      const s = buildTranscriptSection(transcriptEvidence);
      if (s) enrichmentSections.push(s);
    }
    if (scoringResult) {
      enrichmentSections.push(buildScoringConstraints(scoringResult));
    }
    if (digitalMaturitySummary) {
      enrichmentSections.push(buildDigitalMaturitySection(digitalMaturitySummary));
    }

    const enrichmentBlock = enrichmentSections.length > 0
      ? "\n" + enrichmentSections.join("\n\n") + "\n"
      : "";

    const result = await callAnthropicWithRetry(async () => {
      const client = getAnthropicClient();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 5000,
        temperature: 0.3,
        messages: [
          {
            role: "user",
            content: `You are a management consultant specializing in finance transformation and AI readiness assessments. Generate a company-level AI diagnostic based on the intake data below.

COMPANY PROFILE:
- Company Name: ${clientContext.companyName}
- Industry: ${clientContext.industry}
- Sub-Sector: ${clientContext.subSector || "General"}
- Company Type: ${clientContext.isPublic ? "Public" : "Private"}${clientContext.tickerSymbol ? ` (${clientContext.tickerSymbol})` : ""}
- Company Size: ${clientContext.companySize}${clientContext.revenue ? `\n- Revenue: ${clientContext.revenue}` : ""}${clientContext.revenueGrowth ? `\n- Revenue Growth: ${clientContext.revenueGrowth}` : ""}${clientContext.headcount ? `\n- Headcount: ${clientContext.headcount}` : ""}

SELECTED FUNCTION: ${clientContext.functionId || "finance"}

SELECTED PROCESSES WITH CONTEXT:
${processSection || "No process-specific context provided"}
${companyIntelligencePrompt}
${maturitySection}
${enrichmentBlock}
${erpName ? "\n" + buildERPContext(erpName) : ""}

TASK: Generate a tailored company diagnostic that reflects this SPECIFIC company's profile, scale, and pain points. Do NOT produce generic output — every field should be calibrated to the company's size, sub-sector, and stated challenges.

CRITICAL DIFFERENTIATION RULES:
- The process context above includes "processMaturity" (self-assessed), team sizes, and volume drivers. These are your PRIMARY signals for calibrating numbers.
- A company that self-reports "Mature systems in place" should have HIGHER highLeverage % (structured data = more automatable) but LOWER effortAddressable % (less waste to eliminate).
- A company that self-reports "Mostly manual / spreadsheets" should have LOWER highLeverage % (unstructured data = harder to automate) but HIGHER effortAddressable % (more manual effort to address).
- Team size directly impacts the scale of opportunity: a 3-person AP team has fundamentally different automation economics than a 25-person team.
- Volume drivers (invoice volume, transaction count, reporting entities) determine throughput gains.
- Public companies with known tickers are likely more mature than private startups at similar revenue.
- When pain points are provided, challenges MUST directly reference them — not generic industry challenges.
- When EDGAR financials are provided, EVERY challenge and opportunity MUST reference specific numbers.
  NOT: "The company has high R&D spending"
  YES: "With R&D at 43% of revenue ($917M), significantly above the SaaS median of ~25%, there's..."
- When peer data is provided, frame opportunities relative to peers.
  NOT: "There may be room to improve margins"
  YES: "Operating margin at 20% trails Dynatrace (22.5%) — closing this gap on a $2.1B base represents..."
- When transcript quotes are provided, cite them directly.
  NOT: "Teams report manual processes"
  YES: "Your AP Manager noted spending '2 hours daily matching POs' — at $90K fully loaded cost, this represents..."
- When leadership data is available, reference executive context.
  NOT: "The finance team should consider..."
  YES: "Given CFO David Obstler's background scaling Akamai's finance ops, the team likely has appetite for..."

REQUIREMENTS:
1. Use HYPOTHESIS LANGUAGE throughout:
   - "We typically see..." not "You will save..."
   - "Worth investigating..." not "You must..."
   - Use ranges, not point estimates

2. companyArchetype: A concise label that captures this company's specific profile (e.g., "Growth-Stage SaaS ($50M ARR) — Scaling Finance Ops"). Include revenue or scale indicator when provided.

3. archetypeDescription: 2-3 sentences grounded in the company's actual size, sub-sector, and growth profile. Reference specific characteristics, team sizes, and maturity level when available.

4. challenges: 3-6 challenges that reference the company's actual pain points, scale, and context. If they mentioned specific pain points (e.g., "duplicate payments", "slow approvals"), those MUST appear as challenges. Each challenge should feel specific to THIS company, not generic.

5. aiApplicability: Three-way split (highLeverage, humanInTheLoop, humanLed). Calibrate ranges using BOTH company size AND self-reported process maturity:
   - "Mostly manual / spreadsheets" → highLeverage: 15-30%, humanLed: 30-45% (data isn't structured enough for full automation)
   - "Partially automated" → highLeverage: 25-40%, humanLed: 20-35% (some structure to build on)
   - "Mature systems in place" → highLeverage: 35-50%, humanLed: 10-25% (structured data enables more automation)
   - These are guidelines — adjust based on the full context, but the maturity signal should visibly move the numbers
   - Each bucket needs min, max (percentages), and a description referencing their specific systems and maturity

6. automationOpportunity: Calibrate to company scale AND maturity:
   - effortAddressable: % of current effort AI could address (HIGHER for manual processes, LOWER for already-automated)
   - costSavingsRange: % cost reduction — reference team sizes when available (e.g., "For a team of X, we typically see...")
   - capacityUnlocked: % capacity freed up — tie to volume drivers (e.g., "At Y invoices/month...")
   - disclaimer: Grounded, consultant-appropriate caveat that references their specific situation

7. priorityAreas: ONLY include the processes they selected (listed below). Rank by expected leverage given their pain points and maturity.
   Selected processes: ${JSON.stringify(selectedProcessIds)}
   Each priority area needs: functionId, processId, processName, rationale (reference their specific pain points, team size, and volume), expectedLeverage ("high"|"medium"|"low"), link (format: "/{processId}")

8. executiveSummary: A structured executive brief for the hypothesis page hero. This is what consultants read first — make it rich, specific, and grounded in the data.
   - themes: 3-5 scannable tags derived from the diagnostic. Each has a label (short, e.g., "High G&A Gap (+5pp)", "Legacy ERP", "Manual AR") and a category ("operational"|"cost"|"data-quality"|"scale"|"positive"). Use "positive" for strengths.
   - situation: 1 paragraph (3-4 sentences) combining the archetype with company-specific context. Reference revenue, industry, team sizes, and maturity level.
   - keyFindings: 3-5 bullet points with specific numbers. Each bullet should be a concrete finding, not a vague observation. Reference EDGAR data, peer gaps, transcript quotes, or scoring constraints when available.
   - opportunityThemes: 2-3 high-level themes with a brief rationale. These group the challenges into actionable themes (e.g., "Process Automation" + "AR and AP processes show 40-60% manual effort that standard automation can address").

Return VALID JSON matching this EXACT structure:
{
  "companyArchetype": "string",
  "archetypeDescription": "string",
  "executiveSummary": {
    "themes": [{ "label": "string", "category": "operational"|"cost"|"data-quality"|"scale"|"positive" }],
    "situation": "string — 1 paragraph combining archetype + company context",
    "keyFindings": ["string — specific finding with numbers"],
    "opportunityThemes": [{ "theme": "string", "rationale": "string" }]
  },
  "companyIntelligence": {
    "confidenceLevel": "high"|"medium"|"low",
    "confidenceReason": "string explaining why this confidence level",
    "knownContext": "string — what you know about this specific company (omit if low confidence)",
    "industryBenchmarks": "string — relevant industry benchmarks for companies of this size/sector",
    "competitiveLandscape": "string — key competitors and market positioning"
  },
  "challenges": [
    { "title": "string", "description": "string", "category": "operational"|"cost"|"data-quality"|"scale" }
  ],
  "aiApplicability": {
    "highLeverage": { "min": number, "max": number, "description": "string" },
    "humanInTheLoop": { "min": number, "max": number, "description": "string" },
    "humanLed": { "min": number, "max": number, "description": "string" }
  },
  "automationOpportunity": {
    "effortAddressable": { "min": number, "max": number },
    "costSavingsRange": { "min": number, "max": number },
    "capacityUnlocked": { "min": number, "max": number },
    "disclaimer": "string"
  },
  "priorityAreas": [
    { "functionId": "string", "processId": "string", "processName": "string", "rationale": "string", "expectedLeverage": "high"|"medium"|"low", "link": "string" }
  ],
  "generatedAt": "${new Date().toISOString()}"
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, just the JSON object.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type");
      }

      // Extract JSON from response (handle markdown fences)
      let jsonText = content.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }

      const parsed: CompanyDiagnostic = JSON.parse(jsonText);

      // Validate response structure
      if (!parsed.companyArchetype || !parsed.challenges || !Array.isArray(parsed.challenges)) {
        throw new Error("Invalid response: missing companyArchetype or challenges");
      }

      if (!parsed.aiApplicability || !parsed.automationOpportunity) {
        throw new Error("Invalid response: missing aiApplicability or automationOpportunity");
      }

      if (!parsed.priorityAreas || !Array.isArray(parsed.priorityAreas)) {
        throw new Error("Invalid response: missing priorityAreas");
      }

      // Ensure generatedAt is set
      parsed.generatedAt = new Date().toISOString();

      return parsed;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Diagnostic generation error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate diagnostic. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
