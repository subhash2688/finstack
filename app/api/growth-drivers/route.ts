import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, callAnthropicWithRetry } from "@/lib/ai/anthropic-client";

interface CompanyFinancialInput {
  ticker: string;
  name: string;
  revenue: Record<string, number | undefined>; // year → revenue in $M
  growth: Record<string, number | undefined>; // year → YoY growth %
  grossMargin?: number;
  operatingMargin?: number;
}

/**
 * POST /api/growth-drivers
 *
 * Generates brief growth driver commentary for a set of companies
 * using their financial data (no 10-K text needed).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companies, targetTicker } = body as {
      companies: CompanyFinancialInput[];
      targetTicker: string;
    };

    if (!companies || companies.length === 0) {
      return NextResponse.json({ error: "No companies provided" }, { status: 400 });
    }

    const client = getAnthropicClient();

    // Build a concise financial summary for the prompt
    const companyBlocks = companies.map((c) => {
      const revLines = Object.entries(c.revenue)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([yr, val]) => `  FY${yr}: ${val !== undefined ? `$${val >= 1000 ? (val / 1000).toFixed(1) + "B" : val + "M"}` : "N/A"}`)
        .join("\n");
      const growthLines = Object.entries(c.growth)
        .sort(([a], [b]) => Number(b) - Number(a))
        .map(([yr, val]) => `  FY${yr}: ${val !== undefined ? (val > 0 ? "+" : "") + val + "%" : "N/A"}`)
        .join("\n");
      const margins = [];
      if (c.grossMargin !== undefined) margins.push(`Gross margin: ${c.grossMargin}%`);
      if (c.operatingMargin !== undefined) margins.push(`Op margin: ${c.operatingMargin}%`);

      return `${c.ticker} (${c.name})${c.ticker === targetTicker ? " [TARGET]" : ""}
Revenue:\n${revLines}
YoY Growth:\n${growthLines}${margins.length > 0 ? "\n" + margins.join(", ") : ""}`;
    }).join("\n\n");

    const systemPrompt = `You are a senior financial analyst at a top consulting firm. Given revenue and growth data for a set of companies, provide brief, insightful commentary on each company's growth trajectory and likely drivers.

RULES:
1. Be specific to each company — reference actual numbers from the data.
2. Identify growth acceleration or deceleration trends.
3. Suggest likely drivers based on publicly known information about each company.
4. Keep each company's commentary to 2-3 sentences max.
5. For the target company, provide slightly more detailed analysis (3-4 sentences).
6. Return valid JSON only — no markdown, no code blocks.`;

    const userPrompt = `Analyze the growth trajectory for these companies. Target company: ${targetTicker}

${companyBlocks}

Return JSON with this exact structure:
{
  "analyses": [
    {
      "ticker": "TICKER",
      "headline": "Brief 3-5 word headline (e.g. 'Decelerating but still strong')",
      "commentary": "2-3 sentence analysis of growth drivers and trajectory"
    }
  ],
  "peerInsight": "1-2 sentence comparative insight about the target vs peers"
}

Order analyses in the same order as the companies above.`;

    const response = await callAnthropicWithRetry(async () => {
      return client.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        temperature: 0.3,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    const parsed = JSON.parse(textBlock.text);

    return NextResponse.json({
      analyses: parsed.analyses || [],
      peerInsight: parsed.peerInsight || "",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Growth drivers error:", error);
    return NextResponse.json(
      { error: "Failed to generate growth driver analysis" },
      { status: 500 }
    );
  }
}
