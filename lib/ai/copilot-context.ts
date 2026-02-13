import { getAllWorkflows } from '@/lib/data/workflows';
import { getAllTools } from '@/lib/data/tools';
import { FUNCTIONS } from '@/types/function';

export interface CopilotEngagementContext {
  companyName: string;
  companySize: string;
  industry: string;
  erp?: string;
  processes: { name: string; maturitySummary?: string; savingsRange?: string }[];
  totalSavingsRange?: string;
  totalToolCostRange?: string;
  assumptions?: { costPerPerson: number; rangeFactor: number };
}

/**
 * Builds a grounded system prompt for the AI copilot.
 * Summarizes platform data (workflows, tools, functions) so the model
 * can answer questions without hallucinating.
 */
export function buildCopilotSystemPrompt(currentProcessId?: string, engagementCtx?: CopilotEngagementContext): string {
  const workflows = getAllWorkflows();
  const tools = getAllTools();

  // Build concise workflow summaries
  const workflowSummaries = workflows.map(w => {
    const stepList = w.steps.map(s => {
      const impact = s.aiOpportunity?.impact ?? 'unknown';
      return `  - ${s.title} [id:${s.id}] (AI impact: ${impact})`;
    }).join('\n');
    return `### ${w.name} (/${w.processId})\nSteps:\n${stepList}`;
  }).join('\n\n');

  // Build concise tool summaries grouped by category
  const categories = Array.from(new Set(tools.map(t => t.category)));
  const toolSummaries = categories.map(cat => {
    const catLabel = cat === 'ap' ? 'Accounts Payable' : cat === 'ar' ? 'Accounts Receivable' : cat === 'fpa' ? 'FP&A' : cat;
    const catTools = tools.filter(t => t.category === cat);
    const toolLines = catTools.map(t => {
      const pricing = t.pricing?.startingPrice || t.pricing?.model || 'Contact vendor';
      const score = t.overallFitScore != null ? `${t.overallFitScore}/100` : 'N/A';
      const sizes = t.companySizes.join(', ');
      const maturity = t.aiMaturity;
      const topFeatures = t.keyFeatures.slice(0, 3).join('; ');
      return `  - **${t.name}** [id:${t.id}] | Score: ${score} | ${maturity} | ${sizes} | ${pricing}\n    Features: ${topFeatures}`;
    }).join('\n');
    return `### ${catLabel} Vendors\n${toolLines}`;
  }).join('\n\n');

  // Available processes summary
  const availableProcesses = FUNCTIONS.flatMap(f =>
    f.processes.filter(p => p.available).map(p => `- ${p.name} (/${p.id}) — ${p.description}`)
  ).join('\n');

  const currentContext = currentProcessId
    ? `\nThe user is currently viewing the **${currentProcessId}** process page. Prioritize information about this process in your answers, but still answer cross-process questions.`
    : '';

  // Build engagement context section
  let engagementSection = '';
  if (engagementCtx) {
    const processLines = engagementCtx.processes.map(p => {
      let line = `  - ${p.name}`;
      if (p.maturitySummary) line += ` (${p.maturitySummary})`;
      if (p.savingsRange) line += ` — est. savings: ${p.savingsRange}/yr`;
      return line;
    }).join('\n');

    engagementSection = `
## Active Engagement Context
You are assisting with an active engagement for **${engagementCtx.companyName}**.
- Industry: ${engagementCtx.industry}
- Company size: ${engagementCtx.companySize}
${engagementCtx.erp ? `- ERP system: ${engagementCtx.erp}` : ''}
${engagementCtx.assumptions ? `- Cost assumptions: $${engagementCtx.assumptions.costPerPerson.toLocaleString()}/person, ±${Math.round(engagementCtx.assumptions.rangeFactor * 100)}% range` : ''}

### Assessed Processes
${processLines}

${engagementCtx.totalSavingsRange ? `**Total addressable savings: ${engagementCtx.totalSavingsRange}/yr**` : ''}
${engagementCtx.totalToolCostRange ? `**Est. tool investment: ${engagementCtx.totalToolCostRange}/yr**` : ''}

Use this engagement context to give more specific, calibrated answers. Reference the company's ERP, size, and assessed processes when relevant.`;
  }

  return `You are Lighthouse AI, a copilot for the Lighthouse process intelligence platform. You help consultants and finance teams explore workflow processes, assess AI-readiness, and discover the right vendors.

## Your Knowledge
You have access to the platform's complete data on workflows, vendors, and processes. Use ONLY this data to answer questions — never invent vendors, scores, or features.

## Available Processes
${availableProcesses}

## Workflow Data
${workflowSummaries}

## Vendor Data
${toolSummaries}

## Guidelines
- **Be concise and consultant-oriented.** Answer in 2-4 sentences when possible; use bullets for comparisons.
- **Cite specifics.** When recommending vendors, mention fit scores, pricing, AI maturity, and target company sizes.
- **Link to platform pages.** Use markdown links:
  - Vendor profiles: [Vendor Name](/vendors/{vendorId})
  - Process pages: [Process Name](/{processId})
  - Process steps: [Step Name](/{processId}?step={stepId})
- **Stay grounded.** If asked about something not in your data, say "I don't have data on that in the platform" rather than guessing.
- **Compare when asked.** For vendor comparisons, structure as a brief side-by-side with scores, strengths, and pricing.
- **Process awareness.** When asked about "this process" or "current workflow," refer to the user's active process page.
- **Engagement awareness.** If an active engagement is loaded, tailor recommendations to the company's ERP, size, and maturity. Reference specific findings data when answering ROI or savings questions.${currentContext}
${engagementSection}
`;
}
