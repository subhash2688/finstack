import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";
import { DigitalMaturityScan, DigitalMaturityDeepDive } from "@/types/digital-maturity";

// Rate limiting: 5 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (record.count >= RATE_LIMIT) return false;
  record.count++;
  return true;
}

interface ScanRequest {
  clientContext: {
    companyName: string;
    companySize: string;
    industry: string;
    subSector?: string;
    isPublic?: boolean;
    tickerSymbol?: string;
    erp?: string;
  };
  existingIntel?: {
    revenue?: string;
    employees?: string;
    competitors?: string[];
  };
  deepDiveSection?: "techStack" | "maturity" | "marketSignals";
}

function buildInitialScanPrompt(req: ScanRequest): string {
  const { clientContext, existingIntel } = req;
  return `You are a technology due diligence analyst conducting a Digital Operations Maturity Assessment for ${clientContext.companyName}.

COMPANY PROFILE:
- Company: ${clientContext.companyName}
- Size: ${clientContext.companySize}
- Industry: ${clientContext.industry}
- Sub-Sector: ${clientContext.subSector || "General"}
- Type: ${clientContext.isPublic ? "Public" : "Private"}${clientContext.tickerSymbol ? ` (${clientContext.tickerSymbol})` : ""}
- ERP: ${clientContext.erp || "Unknown"}
${existingIntel?.revenue ? `- Revenue: ${existingIntel.revenue}` : ""}
${existingIntel?.employees ? `- Employees: ${existingIntel.employees}` : ""}
${existingIntel?.competitors?.length ? `- Known competitors: ${existingIntel.competitors.join(", ")}` : ""}

TASK: Conduct a thorough digital maturity scan using web search. Search for:

1. TECHNOLOGY STACK SIGNALS:
   - Search job postings (LinkedIn, Indeed, company careers) for technology mentions
   - Search 10-K filings or earnings calls for technology/transformation discussions
   - Look for press releases about technology initiatives
   - Identify ERP, automation tools, data platforms, AI/ML usage

2. MATURITY ASSESSMENT:
   - Assess across 4 dimensions: Process Automation, Data & Analytics, Technology Infrastructure, Digital Culture
   - Use a 4-level framework: 1=Manual, 2=Standardized, 3=Optimized, 4=Intelligent
   - Look for leadership titles that signal digital maturity (CDO, VP Digital Transformation, etc.)
   - Check hiring patterns for tech roles in finance/operations

3. MARKET SIGNALS:
   - Search for peer company digital moves and technology investments
   - Look for M&A activity related to technology capabilities
   - Find analyst commentary on the company's or industry's digital trajectory
   - Assess competitive pressure to digitize

IMPORTANT RULES:
- Every claim MUST have an evidence card with a direct quote and source
- If you cannot find evidence for a claim, say so — do not fabricate
- For private companies, evidence will be sparser — note this as a limitation
- sourceType must be one of: "Job Posting", "SEC Filing", "Earnings Call", "News", "Press Release"
- confidence: "High" = direct quote, "Medium" = inferred from context, "Low" = indirect signal
- maturity levels: 1=Manual, 2=Standardized, 3=Optimized, 4=Intelligent

Return VALID JSON matching this EXACT structure:
{
  "techStack": {
    "detectedTechnologies": ["string"],
    "erpLandscape": "string - current ERP and surrounding tech ecosystem",
    "automationFootprint": "string - what's automated vs manual",
    "overallTechMaturity": 1|2|3|4,
    "evidence": [
      { "quote": "string", "sourceType": "string", "sourceUrl": "string (optional)", "sourceLabel": "string (optional)", "interpretation": "string", "confidence": "High"|"Medium"|"Low" }
    ]
  },
  "maturityAssessment": {
    "overallLevel": 1|2|3|4,
    "overallLevelName": "Manual"|"Standardized"|"Optimized"|"Intelligent",
    "dimensions": [
      {
        "name": "string - e.g. Process Automation",
        "level": 1|2|3|4,
        "levelName": "Manual"|"Standardized"|"Optimized"|"Intelligent",
        "rationale": "string",
        "evidence": [{ "quote": "string", "sourceType": "string", "sourceUrl": "string (optional)", "sourceLabel": "string (optional)", "interpretation": "string", "confidence": "High"|"Medium"|"Low" }]
      }
    ],
    "leadershipSignals": ["string - titles/hires that signal maturity"],
    "hiringPatterns": ["string - what roles they're hiring for"]
  },
  "marketSignals": {
    "peerMoves": [
      { "peerName": "string", "action": "string", "relevance": "string", "source": "string (optional)" }
    ],
    "competitivePressure": "string - overall assessment of competitive pressure to digitize",
    "analystMentions": [
      { "analyst": "string", "quote": "string", "context": "string" }
    ],
    "maActivity": [
      { "description": "string", "relevance": "string", "date": "string (optional)" }
    ]
  },
  "methodology": {
    "researchSteps": [
      { "description": "string - what was searched", "sourcesFound": number }
    ],
    "totalSourcesExamined": number,
    "totalSignalsFound": number,
    "limitationsAndCaveats": ["string"]
  },
  "generatedAt": "${new Date().toISOString()}"
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanation.`;
}

function buildDeepDivePrompt(req: ScanRequest): string {
  const { clientContext, deepDiveSection } = req;
  const sectionLabels: Record<string, string> = {
    techStack: "Technology Stack",
    maturity: "Digital Maturity Assessment",
    marketSignals: "Market Signals & Competitive Intelligence",
  };
  const label = sectionLabels[deepDiveSection!] || deepDiveSection;

  return `You are a technology due diligence analyst conducting a DEEP DIVE into the ${label} for ${clientContext.companyName}.

COMPANY PROFILE:
- Company: ${clientContext.companyName}
- Size: ${clientContext.companySize}
- Industry: ${clientContext.industry}
- Type: ${clientContext.isPublic ? "Public" : "Private"}${clientContext.tickerSymbol ? ` (${clientContext.tickerSymbol})` : ""}

TASK: Conduct a focused deep dive into ${label}. Search more broadly and deeply than an initial scan. Look for:
${deepDiveSection === "techStack" ? `
- Specific technology vendor mentions in job postings, case studies, press releases
- Technology modernization initiatives or cloud migration projects
- Integration architecture signals (API-first, middleware, point-to-point)
- Data infrastructure (data warehouse, data lake, BI tools)
- AI/ML initiatives or RPA deployments` : ""}
${deepDiveSection === "maturity" ? `
- Organizational maturity signals (dedicated transformation teams, C-suite digital roles)
- Process standardization evidence (shared services, centers of excellence)
- Employee enablement signals (training programs, change management)
- Innovation culture (hackathons, R&D labs, startup partnerships)
- Governance and compliance automation` : ""}
${deepDiveSection === "marketSignals" ? `
- Specific peer technology investments and outcomes
- Industry analyst reports on digital transformation in this sector
- Venture capital / PE interest in automation for this vertical
- Regulatory drivers for digitization
- Customer/market pressure for digital capabilities` : ""}

Return VALID JSON:
{
  "section": "${deepDiveSection}",
  "additionalEvidence": [
    { "quote": "string", "sourceType": "Job Posting"|"SEC Filing"|"Earnings Call"|"News"|"Press Release", "sourceUrl": "string (optional)", "sourceLabel": "string (optional)", "interpretation": "string", "confidence": "High"|"Medium"|"Low" }
  ],
  "expandedAnalysis": "string - 2-3 paragraph deeper analysis based on findings",
  "generatedAt": "${new Date().toISOString()}"
}

CRITICAL: Return ONLY valid JSON. No markdown.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ScanRequest = await request.json();
    const { clientContext, deepDiveSection } = body;

    if (!clientContext?.companyName) {
      return NextResponse.json(
        { error: "Client context with company name is required" },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 5 scans per hour.", retryAfter: 3600 },
        { status: 429 }
      );
    }

    const isDeepDive = !!deepDiveSection;
    const prompt = isDeepDive ? buildDeepDivePrompt(body) : buildInitialScanPrompt(body);

    const result = await callAnthropicWithRetry(async () => {
      const client = getAnthropicClient();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: isDeepDive ? 4000 : 8000,
        temperature: 0.3,
        tools: [
          {
            type: "web_search_20250305" as const,
            name: "web_search" as const,
          },
        ],
        messages: [
          { role: "user", content: prompt },
        ],
      });

      // Extract text from response (may include web search result blocks)
      let jsonText = "";
      for (const block of response.content) {
        if (block.type === "text") {
          jsonText += block.text;
        }
      }

      jsonText = jsonText.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }

      if (isDeepDive) {
        const parsed: DigitalMaturityDeepDive = JSON.parse(jsonText);
        parsed.generatedAt = new Date().toISOString();
        return parsed;
      } else {
        const parsed: DigitalMaturityScan = JSON.parse(jsonText);
        parsed.generatedAt = new Date().toISOString();
        return parsed;
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Digital maturity scan error:", error);
    return NextResponse.json(
      {
        error: "Failed to run digital maturity scan. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
