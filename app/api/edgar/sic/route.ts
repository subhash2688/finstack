import { NextRequest, NextResponse } from "next/server";
import { lookupCIK, fetchCompanySIC } from "@/lib/edgar/client";

/**
 * SIC code → Technology Sub-Sector mapping.
 * Covers major SIC codes found in the Technology industry.
 */
function mapSICToSubSector(sic: string): string | null {
  const code = parseInt(sic, 10);
  if (isNaN(code)) return null;

  // Semiconductors
  if (code === 3674) return "Semiconductor";

  // Computer Hardware
  if (code >= 3571 && code <= 3579) return "Hardware";
  if (code === 3672 || code === 3678) return "Hardware"; // PCBs, connectors
  if (code === 3669 || code === 3679) return "Hardware"; // Electronic components

  // Software / SaaS
  if (code === 7372 || code === 7371 || code === 7374) return "SaaS";

  // Telecom
  if (code >= 4810 && code <= 4899) return "Telco";
  if (code === 3661 || code === 3663 || code === 3669) return "Telco";

  // Media / Entertainment
  if (code >= 4810 && code <= 4841) return "Media";
  if (code >= 7810 && code <= 7819) return "Media";
  if (code === 2710 || code === 2711 || code === 2741) return "Media";

  // Digital Infrastructure / Data Processing
  if (code === 7375 || code === 7376 || code === 7377 || code === 7378 || code === 7379) return "Digital Infrastructure";

  // Technology Services / IT consulting
  if (code === 7373 || code === 7374) return "Technology Services";

  // Instruments (often tech-adjacent)
  if (code >= 3812 && code <= 3827) return "Hardware";

  // Broader electronic / tech manufacturing
  if (code >= 3600 && code <= 3699) return "Hardware";

  return null;
}

/**
 * GET /api/edgar/sic?ticker=DDOG
 * Returns SIC code, description, and mapped sub-sector for a public company.
 */
export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim().toUpperCase();

  if (!ticker) {
    return NextResponse.json({ error: "ticker parameter required" }, { status: 400 });
  }

  try {
    const cik = await lookupCIK(ticker);
    if (!cik) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const sicData = await fetchCompanySIC(cik);
    if (!sicData) {
      return NextResponse.json({ error: "SIC data not available" }, { status: 404 });
    }

    const subSector = mapSICToSubSector(sicData.sic);

    return NextResponse.json({
      sic: sicData.sic,
      sicDescription: sicData.sicDescription,
      subSector,
    });
  } catch (error) {
    console.error("SIC lookup error:", error);
    return NextResponse.json(
      { error: "Failed to look up SIC code" },
      { status: 500 }
    );
  }
}
