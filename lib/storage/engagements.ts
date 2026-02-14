import { Engagement, LegacyEngagement, ProcessAssessment, ClientContext } from "@/types/engagement";
import { MaturityLevel } from "@/types/workflow";
import { TranscriptIntelligence } from "@/types/transcript";

const STORAGE_KEY = "finstack-engagements";

/**
 * Migrate legacy engagement to new format
 */
function migrateLegacyEngagement(legacy: any): Engagement {
  // Check if it's already in new format
  if (legacy.processAssessments) {
    return legacy as Engagement;
  }

  // Migrate from old format
  const legacyEng = legacy as LegacyEngagement;
  const processAssessment: ProcessAssessment = {
    functionId: "finance",
    processId: "ap",
    processName: "Accounts Payable",
    generatedWorkflow: legacyEng.generatedWorkflow,
    toolMappings: legacyEng.toolMappings,
  };

  return {
    id: legacyEng.id,
    name: legacyEng.name,
    clientContext: legacyEng.clientContext,
    processAssessments: [processAssessment],
    createdAt: legacyEng.createdAt,
    updatedAt: legacyEng.updatedAt,
  };
}

/**
 * SSR-safe localStorage access
 */
function getStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

/**
 * Get all saved engagements (with automatic migration)
 */
export function getAllEngagements(): Engagement[] {
  const storage = getStorage();
  if (!storage) return [];

  try {
    const data = storage.getItem(STORAGE_KEY);
    if (!data) return [];

    const raw = JSON.parse(data);
    const migrated = raw.map(migrateLegacyEngagement);

    // Save migrated data back (one-time migration)
    if (JSON.stringify(raw) !== JSON.stringify(migrated)) {
      storage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    }

    return migrated;
  } catch (error) {
    console.error("Failed to load engagements:", error);
    return [];
  }
}

/**
 * Get a single engagement by ID
 */
export function getEngagement(id: string): Engagement | null {
  const engagements = getAllEngagements();
  return engagements.find((e) => e.id === id) || null;
}

/**
 * Save a new engagement or update an existing one
 */
export function saveEngagement(engagement: Engagement): void {
  const storage = getStorage();
  if (!storage) {
    throw new Error("localStorage is not available");
  }

  try {
    const engagements = getAllEngagements();
    const existingIndex = engagements.findIndex((e) => e.id === engagement.id);

    if (existingIndex >= 0) {
      // Update existing
      engagements[existingIndex] = {
        ...engagement,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Add new
      engagements.push(engagement);
    }

    storage.setItem(STORAGE_KEY, JSON.stringify(engagements));
  } catch (error) {
    console.error("Failed to save engagement:", error);
    throw error;
  }
}

/**
 * Delete an engagement by ID
 */
export function deleteEngagement(id: string): void {
  const storage = getStorage();
  if (!storage) {
    throw new Error("localStorage is not available");
  }

  try {
    const engagements = getAllEngagements();
    const filtered = engagements.filter((e) => e.id !== id);
    storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to delete engagement:", error);
    throw error;
  }
}

/**
 * Generate a simple UUID (client-side only)
 */
export function generateEngagementId(): string {
  return `eng_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Save a lightweight engagement from inline maturity assessment.
 * Only requires a name; industry/size/ERP are optional.
 */
export function saveLightweightEngagement(params: {
  name: string;
  industry?: string;
  companySize?: "startup" | "smb" | "mid-market" | "enterprise";
  erp?: string;
  processId: string;
  processName: string;
  functionId: string;
  maturityRatings: Record<string, MaturityLevel>;
}): Engagement {
  const now = new Date().toISOString();
  const engagement: Engagement = {
    id: generateEngagementId(),
    name: params.name,
    type: "lightweight",
    clientContext: {
      companyName: params.name,
      industry: params.industry || "",
      companySize: params.companySize || "mid-market",
      erp: params.erp || "",
      monthlyInvoiceVolume: "",
      characteristics: "",
    },
    processAssessments: [
      {
        functionId: params.functionId as any,
        processId: params.processId,
        processName: params.processName,
        generatedWorkflow: [],
        toolMappings: [],
        maturityRatings: params.maturityRatings,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  saveEngagement(engagement);
  return engagement;
}

/**
 * Update maturity ratings for a specific process within an engagement.
 * Auto-saves to localStorage.
 */
export function updateMaturityRatings(
  engagementId: string,
  processId: string,
  ratings: Record<string, MaturityLevel>
): Engagement | null {
  const engagement = getEngagement(engagementId);
  if (!engagement) return null;

  const updated = {
    ...engagement,
    processAssessments: engagement.processAssessments.map((pa) =>
      pa.processId === processId ? { ...pa, maturityRatings: ratings } : pa
    ),
    updatedAt: new Date().toISOString(),
  };

  saveEngagement(updated);
  return updated;
}

/**
 * Update transcript intelligence for a specific process within an engagement.
 * Also clears pendingTranscripts after analysis.
 */
export function updateTranscriptIntelligence(
  engagementId: string,
  processId: string,
  transcriptIntelligence: TranscriptIntelligence
): Engagement | null {
  const engagement = getEngagement(engagementId);
  if (!engagement) return null;

  const updated = {
    ...engagement,
    processAssessments: engagement.processAssessments.map((pa) =>
      pa.processId === processId ? { ...pa, transcriptIntelligence } : pa
    ),
    pendingTranscripts: undefined,
    updatedAt: new Date().toISOString(),
  };

  saveEngagement(updated);
  return updated;
}
