import { ClientContext, ProcessAssessment } from "@/types/engagement";
import { CompanyDiagnostic } from "@/types/diagnostic";
import { MOCK_PROFILES, resolveProfileKey } from "@/lib/data/mock-diagnostics";

/**
 * Generate an AI-powered diagnostic by calling the API route.
 * Falls back to generateMockDiagnostic() on any error.
 */
export async function generateAIDiagnostic(
  clientContext: ClientContext,
  processAssessments: Pick<ProcessAssessment, "processId" | "processName" | "context">[]
): Promise<CompanyDiagnostic> {
  try {
    const response = await fetch("/api/diagnostics/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientContext,
        processAssessments: processAssessments.map((p) => ({
          processId: p.processId,
          processName: p.processName,
          context: p.context,
        })),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `API returned ${response.status}`);
    }

    const diagnostic: CompanyDiagnostic = await response.json();
    return diagnostic;
  } catch (error) {
    console.warn("AI diagnostic generation failed, falling back to mock:", error);
    return generateMockDiagnostic(clientContext);
  }
}

/**
 * Generate a mock diagnostic for a given client context.
 *
 * Uses industry + companySize to pick the closest mock profile,
 * then customizes the archetype label based on the specific inputs.
 * This is the "static data first" approach — deterministic, no API call.
 * Also serves as the fallback when the AI generation fails.
 */
export function generateMockDiagnostic(
  clientContext: ClientContext
): CompanyDiagnostic {
  const profileKey = resolveProfileKey(
    clientContext.industry,
    clientContext.companySize
  );
  const base = MOCK_PROFILES[profileKey];

  // Customize the archetype label with the company's specifics
  const sizeLabel = formatSize(clientContext.companySize);
  const industryLabel = clientContext.industry || "General";
  const erpNote = clientContext.erp ? ` (${clientContext.erp})` : "";

  const customArchetype = `${sizeLabel} ${industryLabel}${erpNote} — ${extractFocus(base.companyArchetype)}`;

  // Customize priority area links to include engagement context later
  const priorityAreas = base.priorityAreas.map((area) => ({
    ...area,
  }));

  return {
    ...base,
    companyArchetype: customArchetype,
    priorityAreas,
    generatedAt: new Date().toISOString(),
  };
}

function formatSize(size: string): string {
  switch (size) {
    case "startup":
      return "Startup";
    case "smb":
      return "SMB";
    case "mid-market":
      return "Mid-Market";
    case "enterprise":
      return "Enterprise";
    default:
      return size;
  }
}

/**
 * Extract the focus part from an archetype label (after the em-dash)
 */
function extractFocus(archetype: string): string {
  const dashIndex = archetype.indexOf("—");
  if (dashIndex === -1) return archetype;
  return archetype.substring(dashIndex + 1).trim();
}
