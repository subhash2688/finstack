import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";

// Simple in-memory rate limiter
const requestLog: { timestamp: number; ip: string }[] = [];
const RATE_LIMIT = 10;
const RATE_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;
  const recentRequests = requestLog.filter(
    (r) => r.ip === ip && r.timestamp > windowStart
  );
  return recentRequests.length < RATE_LIMIT;
}

/**
 * POST /api/company-commentary
 *
 * Generates executive team info and market commentary using Claude LLM.
 * Returns structured data with transparency caveats.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Try again later." },
      { status: 429 }
    );
  }

  requestLog.push({ timestamp: Date.now(), ip });

  try {
    const body = await request.json();
    const { companyName, tickerSymbol } = body;

    if (!companyName) {
      return NextResponse.json({ error: "Missing companyName" }, { status: 400 });
    }

    const client = getAnthropicClient();

    const systemPrompt = `You are a business intelligence analyst. Given a company name (and optionally ticker symbol), provide structured information based on your training knowledge.

IMPORTANT RULES:
1. Only include executives you are highly confident about. Focus on the current leadership team.
2. For executive team, include the most publicly known leaders (CEO, CFO, CTO, etc.)
3. Be specific but acknowledge that information may be outdated.
4. For product segments, focus on the main revenue drivers.
5. For headwinds/tailwinds, be specific to the company, not generic industry trends.
6. For each executive, include their LinkedIn profile URL if you are confident about it. Set to null if unsure.
7. Return valid JSON only — no markdown, no code blocks.`;

    const userPrompt = `Company: ${companyName}${tickerSymbol ? ` (${tickerSymbol})` : ""}

Return a JSON object with this exact structure:
{
  "executives": [
    { "name": "Full Name", "title": "Title", "background": "One sentence background", "linkedinUrl": "https://linkedin.com/in/slug or null" }
  ],
  "productSegments": [
    { "name": "Segment Name", "description": "Brief description of this revenue line" }
  ],
  "headwinds": ["Specific headwind 1", "Specific headwind 2", "Specific headwind 3"],
  "tailwinds": ["Specific tailwind 1", "Specific tailwind 2", "Specific tailwind 3"],
  "marketDynamics": "2-3 sentence overview of competitive positioning and market share"
}

Include 3-6 executives, 2-4 product segments, 3 headwinds, and 3 tailwinds.
For linkedinUrl, only include if you are confident about the exact URL. Otherwise set to null.`;

    const response = await callAnthropicWithRetry(async () => {
      return client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse the JSON response
    const parsed = JSON.parse(textBlock.text);

    // Map executives with linkedinUrl
    const executives = (parsed.executives || []).map((exec: { name: string; title: string; background?: string; linkedinUrl?: string | null }) => ({  // eslint-disable-line
      name: exec.name,
      title: exec.title,
      background: exec.background,
      linkedinUrl: exec.linkedinUrl || undefined,
    }));

    return NextResponse.json({
      leadership: {
        executives,
        source: "Claude LLM (training knowledge)",
        caveat: "Based on publicly available information — verify against latest filings and announcements",
      },
      commentary: {
        productSegments: parsed.productSegments || [],
        headwinds: parsed.headwinds || [],
        tailwinds: parsed.tailwinds || [],
        marketDynamics: parsed.marketDynamics || "",
        caveat: "AI-generated analysis based on publicly available information. May not reflect the most recent developments.",
      },
    });
  } catch (error) {
    console.error("Company commentary error:", error);
    return NextResponse.json(
      { error: "Failed to generate company commentary" },
      { status: 500 }
    );
  }
}
