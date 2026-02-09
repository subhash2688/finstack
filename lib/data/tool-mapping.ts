import { Tool } from "@/types/tool";
import { ToolMapping } from "@/types/engagement";
import { getToolsByIds } from "./tools";

/**
 * Get tools mapped to a generated workflow step
 * Used when displaying generated workflows
 */
export function getToolsForGeneratedStep(
  stepId: string,
  toolMappings: ToolMapping[]
): Tool[] {
  // Find the mapping for this step
  const mapping = toolMappings.find((m) => m.generatedStepId === stepId);

  if (!mapping || mapping.existingToolIds.length === 0) {
    return [];
  }

  // Get the actual tool objects
  return getToolsByIds(mapping.existingToolIds);
}
