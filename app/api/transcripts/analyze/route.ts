import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";

// Rate limiting: 30 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

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

interface WorkflowStepInput {
  id: string;
  title: string;
  description: string;
  painPoints: string[];
}

interface AnalyzeRequest {
  transcriptText: string;
  workflowSteps: WorkflowStepInput[];
  processName: string;
  processContext?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { transcriptText, workflowSteps, processName, processContext } = body;

    if (!transcriptText || !workflowSteps || workflowSteps.length === 0) {
      return NextResponse.json(
        { error: "transcriptText and workflowSteps are required" },
        { status: 400 }
      );
    }

    if (transcriptText.length > 200000) {
      return NextResponse.json(
        { error: "Transcript too long. Maximum 200,000 characters." },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Maximum 30 transcript analyses per hour.",
          retryAfter: 3600,
        },
        { status: 429 }
      );
    }

    const stepsDescription = workflowSteps
      .map(
        (s, i) =>
          `${i + 1}. ${s.id} — "${s.title}": ${s.description}\n   Known pain points: ${s.painPoints.join("; ")}`
      )
      .join("\n");

    const apiStart = Date.now();
    console.log(`[API transcript] Starting Claude call for "${processName}" (${transcriptText.length} chars)`);

    const result = await callAnthropicWithRetry(async () => {
      const client = getAnthropicClient();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 6000,
        temperature: 0.2,
        messages: [
          {
            role: "user",
            content: `You are a senior process consultant analyzing an interview transcript from a client engagement. Your job is to extract evidence about the client's current ${processName} process, map it to specific workflow steps, and assess maturity.

WORKFLOW STEPS FOR ${processName.toUpperCase()}:
${stepsDescription}
${processContext ? `\nADDITIONAL CONTEXT:\n${processContext}` : ""}

TRANSCRIPT:
---
${transcriptText}
---

TASK: Analyze this transcript and extract evidence mapped to each workflow step above.

RULES:
1. Include ALL workflow steps in your response — set "covered" to true only if the transcript contains evidence about that step, false otherwise.
2. Quotes must be VERBATIM from the transcript. Include speaker name and any timestamps if present.
3. For maturity assessment, use these levels:
   - "manual": Process is done by hand, spreadsheets, email, paper
   - "semi-automated": Some tooling exists but significant manual work remains
   - "automated": Systems handle most of the work with minimal human intervention
4. When ambiguous, err toward "manual" — it's safer to underestimate maturity.
5. Set maturityConfidence to "high" only when multiple clear signals confirm the level, "medium" for reasonable inference, "low" for single/weak signals.
6. Pain points should be concrete observations from the transcript, not generic industry statements.
7. Workarounds are specific things the team does to cope with process gaps (e.g., "They maintain a side spreadsheet to track...").
8. Automation signals are mentions of tools, systems, or automated processes relevant to that step.

Return VALID JSON matching this EXACT structure:
{
  "stepEvidence": [
    {
      "stepId": "string (must match a workflow step ID)",
      "stepTitle": "string",
      "covered": boolean,
      "suggestedMaturity": "manual" | "semi-automated" | "automated" | null,
      "maturityConfidence": "high" | "medium" | "low" | null,
      "painPoints": ["string"],
      "workarounds": ["string"],
      "quotes": [
        {
          "text": "verbatim quote from transcript",
          "speaker": "speaker name or role",
          "timestamp": "timestamp if available, otherwise empty string",
          "context": "brief context about what prompted this quote"
        }
      ],
      "automationSignals": ["string"]
    }
  ],
  "meta": {
    "teamSizeMentions": ["any mentions of team size, headcount, or staffing"],
    "toolSystemMentions": ["any tools, systems, or software mentioned"],
    "volumeMetrics": ["any volume, throughput, or scale metrics mentioned"],
    "keyThemes": ["3-5 overarching themes from the interview"]
  },
  "summary": "2-3 sentence summary of key findings from this transcript",
  "interviewParticipants": ["names/roles of people in the interview"]
}

CRITICAL: Return ONLY valid JSON. No markdown, no explanation, just the JSON object.`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") {
        throw new Error("Unexpected response type");
      }

      let jsonText = content.text.trim();
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
      }

      const parsed = JSON.parse(jsonText);

      // Validate response structure
      if (!parsed.stepEvidence || !Array.isArray(parsed.stepEvidence)) {
        throw new Error("Invalid response: missing stepEvidence array");
      }
      if (!parsed.meta || !parsed.summary) {
        throw new Error("Invalid response: missing meta or summary");
      }

      return parsed;
    });

    const apiEnd = Date.now();
    console.log(`[API transcript] Claude call done in ${((apiEnd - apiStart) / 1000).toFixed(1)}s`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Transcript analysis error:", error);

    return NextResponse.json(
      {
        error: "Failed to analyze transcript. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
