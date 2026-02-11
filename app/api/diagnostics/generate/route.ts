import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";
import { ClientContext } from "@/types/engagement";
import { CompanyDiagnostic } from "@/types/diagnostic";

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

interface GenerateRequest {
  clientContext: ClientContext;
  processAssessments: ProcessContext[];
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { clientContext, processAssessments } = body;

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

    const result = await callAnthropicWithRetry(async () => {
      const client = getAnthropicClient();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
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

TASK: Generate a tailored company diagnostic that reflects this SPECIFIC company's profile, scale, and pain points. Do NOT produce generic output — every field should be calibrated to the company's size, sub-sector, and stated challenges.

CRITICAL DIFFERENTIATION RULES:
- The process context above includes "processMaturity" (self-assessed), team sizes, and volume drivers. These are your PRIMARY signals for calibrating numbers.
- A company that self-reports "Mature systems in place" should have HIGHER highLeverage % (structured data = more automatable) but LOWER effortAddressable % (less waste to eliminate).
- A company that self-reports "Mostly manual / spreadsheets" should have LOWER highLeverage % (unstructured data = harder to automate) but HIGHER effortAddressable % (more manual effort to address).
- Team size directly impacts the scale of opportunity: a 3-person AP team has fundamentally different automation economics than a 25-person team.
- Volume drivers (invoice volume, transaction count, reporting entities) determine throughput gains.
- Public companies with known tickers are likely more mature than private startups at similar revenue.
- When pain points are provided, challenges MUST directly reference them — not generic industry challenges.

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

Return VALID JSON matching this EXACT structure:
{
  "companyArchetype": "string",
  "archetypeDescription": "string",
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
