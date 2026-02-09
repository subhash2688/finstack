import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";

// ============================================================================
// COST-SAVING MEASURES
// ============================================================================

// 1. In-memory cache (5-minute TTL) to avoid duplicate API calls
const searchCache = new Map<string, { result: SearchResult; expiresAt: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// 2. Rate limiting (30 requests per minute per IP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

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

interface SearchRequest {
  query: string;
  steps: Array<{
    id: string;
    title: string;
    description: string;
  }>;
}

interface StepMatch {
  stepId: string;
  stepTitle: string;
  confidence: number;
}

interface SearchResult {
  matches: StepMatch[];
}

// ============================================================================
// API ROUTE
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request
    const body: SearchRequest = await request.json();
    const { query, steps } = body;

    // Validate input
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    if (!steps || steps.length === 0) {
      return NextResponse.json(
        { error: "Steps array is required" },
        { status: 400 }
      );
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    // Check cache first (COST SAVING: avoid duplicate API calls)
    const cacheKey = `${query}:${steps.map((s) => s.id).join(",")}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return NextResponse.json(cached.result);
    }

    // Call Claude API with conservative settings
    const result = await callAnthropicWithRetry(async () => {
      const client = getAnthropicClient();

      const response = await client.messages.create({
        model: "claude-sonnet-4-20250514", // Using Sonnet (cheaper than Opus)
        max_tokens: 300, // COST SAVING: minimal tokens (was 512 in original plan)
        temperature: 0, // Deterministic output
        messages: [
          {
            role: "user",
            content: `Given this search query: "${query}"

Match it to the most relevant workflow steps from this list:

${steps.map((s, i) => `${i + 1}. ${s.title} (${s.id}): ${s.description}`).join("\n")}

Return ONLY a JSON array of matches with this exact format:
[{"stepId": "step-id", "stepTitle": "Step Title", "confidence": 0.95}]

Rules:
- confidence: 0-1 (1 = perfect match)
- Return max 3 matches
- Only include matches with confidence > 0.5
- If no good matches, return []`,
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

      const matches: StepMatch[] = JSON.parse(jsonText);

      return { matches };
    });

    // Cache the result (COST SAVING: avoid duplicate calls for same query)
    searchCache.set(cacheKey, {
      result,
      expiresAt: Date.now() + CACHE_TTL,
    });

    // Clean up old cache entries periodically
    if (searchCache.size > 100) {
      const now = Date.now();
      const entries = Array.from(searchCache.entries());
      for (const [key, value] of entries) {
        if (now > value.expiresAt) {
          searchCache.delete(key);
        }
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Search API error:", error);

    // GRACEFUL DEGRADATION: Return empty matches instead of breaking the app
    // The client will fall back to keyword-based search
    return NextResponse.json(
      { matches: [], error: "Search temporarily unavailable" },
      { status: 200 } // Return 200 so client can handle gracefully
    );
  }
}
