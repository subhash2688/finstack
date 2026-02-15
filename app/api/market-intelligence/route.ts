import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";
import { MarketIntelligence } from "@/types/technology";

// Rate limiting: 10 requests per hour per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
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

interface MarketIntelligenceRequest {
  companyContext: {
    companyName: string;
    size: string;
    industry: string;
    subSector?: string;
    erp?: string;
  };
  queryType: "benchmarks" | "trends" | "case-studies" | "landscape" | "all";
}

export async function POST(request: NextRequest) {
  try {
    const body: MarketIntelligenceRequest = await request.json();
    const { companyContext, queryType } = body;

    if (!companyContext?.companyName) {
      return NextResponse.json(
        { error: "Company context with name is required" },
        { status: 400 }
      );
    }

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 requests per hour.", retryAfter: 3600 },
        { status: 429 }
      );
    }

    const result = await callAnthropicWithRetry(async () => {
      const client = getAnthropicClient();

      const queryFocus = queryType === "all"
        ? "benchmarks, technology trends, and competitive landscape"
        : queryType === "benchmarks"
        ? "industry benchmarks for AP/AR/FPA efficiency metrics"
        : queryType === "trends"
        ? "technology adoption trends and AI transformation"
        : queryType === "case-studies"
        ? "real-world case studies and implementation outcomes"
        : "competitive landscape and market positioning";

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4000,
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
            content: `You are a market research analyst specializing in finance technology and automation. Research the following and return structured data.

COMPANY CONTEXT:
- Company: ${companyContext.companyName}
- Size: ${companyContext.size}
- Industry: ${companyContext.industry}
- Sub-Sector: ${companyContext.subSector || "General"}
- ERP: ${companyContext.erp || "Unknown"}

RESEARCH FOCUS: ${queryFocus}

TASK: Search for current, real-world data about:
1. Industry benchmarks for finance process efficiency (AP cost per invoice, AR DSO benchmarks, FPA cycle times) for ${companyContext.size} ${companyContext.industry} companies
2. Technology adoption trends — what % of similar companies have adopted AI for AP/AR/FPA
3. Competitive landscape — how peers are approaching finance transformation
4. Any relevant regulatory or labor market trends affecting finance automation

Return VALID JSON matching this EXACT structure:
{
  "benchmarks": [
    { "metric": "string - the metric name", "value": "string - the benchmark value", "context": "string - what this means for the company", "source": "string - where this data comes from (optional)" }
  ],
  "trends": [
    { "trend": "string - the trend", "relevance": "string - why it matters for this company", "source": "string - source (optional)" }
  ],
  "landscape": "string - 2-3 sentence overview of competitive landscape for finance automation in this sector",
  "generatedAt": "${new Date().toISOString()}"
}

Include 3-5 benchmarks and 3-5 trends. Be specific with numbers when available.
If you cannot find specific data, use industry-standard benchmarks from APQC, Hackett Group, or similar.

CRITICAL: Return ONLY valid JSON. No markdown, no explanation.`,
          },
        ],
      });

      // Extract text from response (may include tool use blocks)
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

      const parsed: MarketIntelligence = JSON.parse(jsonText);
      parsed.generatedAt = new Date().toISOString();
      return parsed;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Market intelligence error:", error);
    return NextResponse.json(
      {
        error: "Failed to generate market intelligence. Please try again.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
