import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";
import { ClientContext, ToolMapping } from "@/types/engagement";
import { WorkflowStep } from "@/types/workflow";
import { getAllTools } from "@/lib/data/tools";

// ============================================================================
// COST-SAVING MEASURES (This is the most expensive API call!)
// ============================================================================

// VERY strict rate limiting: 10 requests per hour per IP
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

// ============================================================================
// TYPES
// ============================================================================

interface GenerateRequest {
  clientContext: ClientContext;
}

interface GenerateResponse {
  steps: WorkflowStep[];
  toolMappings: ToolMapping[];
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request
    const body: GenerateRequest = await request.json();
    const { clientContext } = body;

    // Validate input
    if (!clientContext || !clientContext.companyName) {
      return NextResponse.json(
        { error: "Client context with company name is required" },
        { status: 400 }
      );
    }

    // VERY strict rate limiting (COST SAVING: 10 per hour, not per minute!)
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Maximum 10 workflow generations per hour.",
          retryAfter: 3600,
        },
        { status: 429 }
      );
    }

    // Get all available tools for context
    const allTools = getAllTools().filter((t) => t.category === "ap");
    const toolsSummary = allTools
      .map((t) => `${t.id}: ${t.name} - ${t.tagline} (Steps: ${t.workflowSteps.join(", ")})`)
      .join("\n");

    // Call Claude API with CONSERVATIVE settings
    const result = await callAnthropicWithRetry(async () => {
      const client = getAnthropicClient();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514", // Using Sonnet (cheaper than Opus)
        max_tokens: 6000, // COST SAVING: conservative limit (was 8192 in plan)
        temperature: 0.3, // Some creativity but not too much
        messages: [
          {
            role: "user",
            content: `You are a management consultant specializing in Accounts Payable process design.

CLIENT CONTEXT:
- Company: ${clientContext.companyName}
- Industry: ${clientContext.industry}
- Size: ${clientContext.companySize}
- ERP: ${clientContext.erp}
- Monthly Invoice Volume: ${clientContext.monthlyInvoiceVolume}
- Characteristics: ${clientContext.characteristics}

TASK: Generate a tailored AP workflow for this client (6-14 steps).

AVAILABLE TOOLS:
${toolsSummary}

REQUIREMENTS:
1. Use HYPOTHESIS LANGUAGE (not prescriptive):
   - "We typically see 15-25% time savings" (not "Will save 20%")
   - "Worth investigating..." (not "You must...")
   - Use ranges, not point estimates

2. Generate 6-14 steps tailored to client's specific context

3. For each step, map 2-5 relevant tools from the available tools list above

4. Return VALID JSON with this EXACT structure:
{
  "steps": [
    {
      "id": "step-1",
      "title": "Invoice Receipt & Capture",
      "description": "...",
      "stepNumber": 1,
      "abbreviation": "CAPT",
      "aiOpportunity": {
        "impact": "high",
        "description": "..."
      },
      "painPoints": ["...", "..."],
      "beforeAfter": {
        "before": "Manual data entry, 10-15 min per invoice",
        "after": "Automated capture, <1 min review time"
      },
      "impactMetrics": {
        "timeSavings": "60-75% reduction in data entry time",
        "errorReduction": "80-90% fewer keying errors",
        "costImpact": "$5-8K monthly savings for typical mid-market AP team",
        "throughput": "3-4x more invoices processed per FTE"
      },
      "insight": {
        "whyItMatters": "...",
        "typicalPain": "...",
        "aiImpactVerdict": "...",
        "aiImpactIntensity": "fire"
      },
      "toolContextSentence": "Tools for intelligent invoice capture and data extraction"
    }
  ],
  "toolMappings": [
    {
      "generatedStepId": "step-1",
      "existingToolIds": ["stampli", "tipalti"]
    }
  ]
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, just the JSON object.`,
          },
        ],
      });

      // Parse response
      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type");
      }

      // Extract JSON from response (handle markdown fences)
      let jsonText = content.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }

      const parsed: GenerateResponse = JSON.parse(jsonText);

      // Validate response structure
      if (!parsed.steps || !Array.isArray(parsed.steps) || parsed.steps.length === 0) {
        throw new Error("Invalid response: missing or empty steps array");
      }

      if (!parsed.toolMappings || !Array.isArray(parsed.toolMappings)) {
        throw new Error("Invalid response: missing or invalid toolMappings");
      }

      return parsed;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Workflow generation error:", error);

    return NextResponse.json(
      {
        error: "Failed to generate workflow. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
