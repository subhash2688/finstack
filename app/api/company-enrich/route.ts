import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic-client";

// Simple in-memory rate limiter — 20 lookups per hour per IP
const requestLog: { timestamp: number; ip: string }[] = [];
const RATE_LIMIT = 20;
const RATE_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowStart = now - RATE_WINDOW;
  // Clean old entries
  while (requestLog.length > 0 && requestLog[0].timestamp < windowStart) {
    requestLog.shift();
  }
  const recentRequests = requestLog.filter(
    (r) => r.ip === ip && r.timestamp > windowStart
  );
  return recentRequests.length < RATE_LIMIT;
}

/**
 * POST /api/company-enrich
 *
 * Uses Claude + web_search to look up basic info about any company (especially private).
 * Returns estimated revenue, headcount, HQ, description, and sub-sector suggestion.
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
    const { companyName } = body;

    if (!companyName || companyName.trim().length < 2) {
      return NextResponse.json({ error: "Missing or too short companyName" }, { status: 400 });
    }

    const client = getAnthropicClient();

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      temperature: 0.2,
      tools: [
        {
          type: "web_search_20250305" as const,
          name: "web_search" as const,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Look up the company "${companyName.trim()}" and return basic company information.

Search the web to find current data about this company. Focus on:
- What the company does (1-2 sentences)
- Estimated annual revenue (or revenue range)
- Estimated employee headcount
- Headquarters location
- Year founded
- Technology sub-sector: First determine the company's ACTUAL sub-sector (e.g., "FinTech", "HealthTech", "Cybersecurity", "E-Commerce", etc.). Then pick the BEST fit from ONLY these platform options: "SaaS", "Hardware", "Semiconductor", "Telco", "Media", "Digital Infrastructure", "Technology Services", "Other". If the actual sub-sector doesn't match any option well, use "Other".

IMPORTANT:
- If you cannot find reliable data for a field, set it to null — do NOT guess.
- For revenue, use format like "$50M", "$1.2B", "$200M-$500M" (range OK).
- For headcount, use a number string like "250", "1200", "5000-10000" (range OK).

Return VALID JSON only — no markdown, no code fences:
{
  "description": "string or null",
  "revenue": "string or null",
  "revenueGrowth": "string or null",
  "headcount": "string or null",
  "headquarters": "string or null",
  "founded": "string or null",
  "subSector": "string - must be one of: SaaS, Hardware, Semiconductor, Telco, Media, Digital Infrastructure, Technology Services, Other",
  "actualSubSector": "string or null - the company's real sub-sector if it differs from the mapped subSector (e.g., FinTech, HealthTech, Cybersecurity)",
  "website": "string or null"
}`,
        },
      ],
    });

    // Extract text from response (may include tool_use blocks for web_search)
    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    // Parse JSON — strip markdown fences and <cite> tags
    const cleaned = textBlock.text
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "")
      .replace(/<cite[^>]*>/g, "")
      .replace(/<\/cite>/g, "")
      .trim();
    const parsed = JSON.parse(cleaned);

    // Also strip any remaining cite tags from individual values
    const stripCites = (v: string | null | undefined) =>
      v ? v.replace(/<cite[^>]*>/g, "").replace(/<\/cite>/g, "").trim() : v;

    const result = {
      description: stripCites(parsed.description),
      revenue: stripCites(parsed.revenue),
      revenueGrowth: stripCites(parsed.revenueGrowth),
      headcount: stripCites(parsed.headcount),
      headquarters: stripCites(parsed.headquarters),
      founded: stripCites(parsed.founded),
      subSector: stripCites(parsed.subSector),
      actualSubSector: stripCites(parsed.actualSubSector),
      website: stripCites(parsed.website),
    };

    return NextResponse.json({
      ...result,
      source: "AI Web Search",
      caveat: "Estimates based on publicly available information — verify with the client.",
    });
  } catch (error) {
    console.error("Company enrich error:", error);
    return NextResponse.json(
      { error: "Failed to enrich company data" },
      { status: 500 }
    );
  }
}
