import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";
import { TechnologyAnalysis } from "@/types/technology";

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

interface CapabilityInput {
  id: string;
  name: string;
  stepIds: string[];
  description: string;
  painPoints: string[];
  maturityLevels: Record<string, string>;
  estimatedSavings: number;
}

interface TechnologyAnalysisRequest {
  clientContext: {
    companyName: string;
    companySize: string;
    industry: string;
    subSector?: string;
    erp?: string;
    revenue?: string;
    headcount?: string;
  };
  capabilities: CapabilityInput[];
  topTools: { capabilityId: string; toolName: string; vendor: string; fitScore: number; annualCost?: string }[];
  erpName: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: TechnologyAnalysisRequest = await request.json();
    const { clientContext, capabilities, topTools, erpName } = body;

    if (!clientContext?.companyName || !capabilities?.length) {
      return NextResponse.json(
        { error: "Client context and capabilities are required" },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 5 analyses per hour.", retryAfter: 3600 },
        { status: 429 }
      );
    }

    const capabilitiesSummary = capabilities
      .map((c) => {
        const maturity = Object.entries(c.maturityLevels)
          .map(([step, level]) => `${step}: ${level}`)
          .join(", ");
        return `- ${c.name} (${c.id}):
    Steps: ${c.stepIds.join(", ")}
    Pain points: ${c.painPoints.join("; ")}
    Maturity: ${maturity || "Not assessed"}
    Est. savings: $${c.estimatedSavings.toLocaleString()}`;
      })
      .join("\n");

    const toolsSummary = topTools
      .map(
        (t) =>
          `- ${t.toolName} (${t.vendor}) for ${t.capabilityId}: fit ${t.fitScore}%${t.annualCost ? `, ~${t.annualCost}/yr` : ""}`
      )
      .join("\n");

    const result = await callAnthropicWithRetry(async () => {
      const client = getAnthropicClient();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        temperature: 0.3,
        tools: [
          {
            type: "web_search_20250305" as const,
            name: "web_search" as const,
          },
        ],
        messages: [
          {
            role: "user",
            content: `You are a technology strategy consultant specializing in finance automation. Generate a build-vs-buy analysis and find real case studies using web search.

COMPANY PROFILE:
- Company: ${clientContext.companyName}
- Size: ${clientContext.companySize}
- Industry: ${clientContext.industry}
- Sub-Sector: ${clientContext.subSector || "General"}
- ERP: ${erpName || "Unknown"}
${clientContext.revenue ? `- Revenue: ${clientContext.revenue}` : ""}
${clientContext.headcount ? `- Headcount: ${clientContext.headcount}` : ""}

TECHNOLOGY CAPABILITIES IDENTIFIED:
${capabilitiesSummary}

TOP VENDOR MATCHES:
${toolsSummary}

TASK:
1. For each capability, provide a BUILD vs BUY analysis:
   - BUILD: estimate team composition, timeline (months), total cost, tech stack, pros, cons
   - BUY: estimate implementation cost, annual cost (based on vendor data), timeline, effort level, pros, cons
   - RECOMMENDATION: build, buy, or hybrid — with rationale calibrated to this company's size, ERP, and maturity

2. Search for 2-3 REAL case studies per capability:
   - Look for actual company implementations of these tools (from vendor websites, G2, analyst reports)
   - Include company archetype (e.g., "Mid-market SaaS company"), ERP used, tool used, outcome, timeline
   - Include source URL and label when available
   - If you cannot find exact matches, use representative examples from similar company profiles

3. Provide market context:
   - Industry adoption rate for these technologies
   - 3-5 relevant technology trends
   - Any regulatory considerations
   - Labor market insights (developer costs, finance team hiring trends)

Return VALID JSON matching this EXACT structure:
{
  "buildVsBuy": [
    {
      "capabilityId": "string",
      "build": {
        "teamComposition": [{ "role": "string", "count": number, "monthlyRate": number }],
        "timelineMonths": number,
        "estimatedCost": { "low": number, "high": number },
        "techStack": ["string"],
        "pros": ["string"],
        "cons": ["string"]
      },
      "buy": {
        "implementationCost": { "low": number, "high": number },
        "annualCost": { "low": number, "high": number },
        "typicalTimeline": "string",
        "effortLevel": "low"|"medium"|"high",
        "pros": ["string"],
        "cons": ["string"]
      },
      "recommendation": "build"|"buy"|"hybrid",
      "rationale": "string - personalized recommendation explaining why"
    }
  ],
  "caseStudies": [
    {
      "companyArchetype": "string - e.g. Mid-market SaaS company",
      "erpUsed": "string",
      "toolUsed": "string",
      "capabilityId": "string",
      "outcome": "string - specific result achieved",
      "timeline": "string - implementation duration",
      "sourceUrl": "string - URL (optional)",
      "sourceLabel": "string - source name (optional)"
    }
  ],
  "marketContext": {
    "industryAdoptionRate": "string - e.g. 45% of mid-market SaaS companies",
    "technologyTrends": ["string"],
    "regulatoryNotes": "string (optional)",
    "laborMarketInsight": "string (optional)"
  },
  "generatedAt": "${new Date().toISOString()}"
}

IMPORTANT:
- Costs should be realistic numbers (not strings), in USD
- Build costs should reflect actual market rates for engineers
- Buy costs should be based on typical vendor pricing for ${clientContext.companySize} companies
- Case studies should be as specific and real as possible — use web search
- Each capability in the input should have a corresponding buildVsBuy entry

CRITICAL: Return ONLY valid JSON. No markdown, no explanation.`,
          },
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

      const parsed: TechnologyAnalysis = JSON.parse(jsonText);
      parsed.generatedAt = new Date().toISOString();
      return parsed;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Technology analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate technology analysis. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
