import type { WorkflowStep } from "@/types/workflow";

export interface StepMatch {
  stepId: string;
  stepTitle: string;
  confidence: number;
}

export interface IntentResult {
  query: string;
  matches: StepMatch[];
}

// Stop words to ignore — common English words that add noise
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "need", "dare", "ought",
  "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
  "into", "through", "during", "before", "after", "above", "below",
  "between", "out", "off", "over", "under", "again", "further", "then",
  "once", "here", "there", "when", "where", "why", "how", "all", "both",
  "each", "few", "more", "most", "other", "some", "such", "no", "nor",
  "not", "only", "own", "same", "so", "than", "too", "very", "just",
  "about", "up", "it", "its", "we", "our", "us", "my", "me", "i",
  "you", "your", "they", "them", "their", "he", "she", "his", "her",
  "this", "that", "these", "those", "am", "if", "or", "and", "but",
  "what", "which", "who", "whom", "because", "also", "much", "many",
  "get", "got", "like", "still", "even", "way", "lot", "lots",
]);

// Simple stemming: strip common suffixes to match word roots
function stem(word: string): string {
  if (word.length <= 3) return word;
  // Order matters — try longer suffixes first
  const suffixes = ["ation", "ment", "ness", "ally", "ting", "ing", "ies", "ous", "ive", "ful", "ers", "ion", "ed", "ly", "er", "al", "es", "s"];
  for (const suffix of suffixes) {
    if (word.length > suffix.length + 2 && word.endsWith(suffix)) {
      return word.slice(0, -suffix.length);
    }
  }
  return word;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s/-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function getBigrams(tokens: string[]): string[] {
  const bigrams: string[] = [];
  for (let i = 0; i < tokens.length - 1; i++) {
    bigrams.push(`${tokens[i]} ${tokens[i + 1]}`);
  }
  return bigrams;
}

// Build a searchable text corpus from a workflow step — uses ALL content fields
function buildStepCorpus(step: WorkflowStep): string[] {
  const parts: string[] = [
    step.title,
    step.description,
    step.abbreviation,
    step.aiOpportunity.description,
    ...step.painPoints,
    step.beforeAfter.before,
    step.beforeAfter.after,
    step.impactMetrics.timeSavings,
    step.impactMetrics.errorReduction,
    step.impactMetrics.costImpact,
    step.impactMetrics.throughput,
  ];

  // Include insight content if present
  if (step.insight) {
    parts.push(
      step.insight.whyItMatters,
      step.insight.typicalPain,
      step.insight.aiImpactVerdict
    );
  }
  if (step.toolContextSentence) {
    parts.push(step.toolContextSentence);
  }

  return parts;
}

// High-value synonyms that map common user language to domain terms
const SYNONYM_MAP: Record<string, string[]> = {
  "slow": ["time", "delay", "cycle", "bottleneck", "manual", "hours", "days"],
  "expensive": ["cost", "spend", "savings", "expensive", "money", "dollar"],
  "error": ["error", "mistake", "wrong", "incorrect", "inaccurate", "miscode"],
  "late": ["delay", "overdue", "missed", "slow", "stuck", "waiting"],
  "money": ["cost", "spend", "dollar", "savings", "discount", "price"],
  "stuck": ["bottleneck", "delay", "queue", "waiting", "stuck", "stalled"],
  "wrong": ["error", "incorrect", "mismatched", "inaccurate", "bad"],
  "lost": ["missing", "lost", "undetected", "missed"],
  "manual": ["manual", "hand", "labor", "keying", "entry", "spreadsheet"],
  "time": ["time", "hours", "days", "cycle", "slow", "fast", "speed"],
  "pay": ["payment", "pay", "paying", "paid", "remit"],
  "vendor": ["vendor", "supplier", "payee"],
  "bill": ["invoice", "bill", "statement"],
  "cheat": ["fraud", "scam", "fraudulent", "phantom", "suspicious"],
  "steal": ["fraud", "theft", "fraudulent", "embezzlement"],
  "double": ["duplicate", "double", "repeated", "twice"],
  "match": ["matching", "match", "reconcile", "compare"],
  "approve": ["approval", "approve", "authorize", "sign"],
  "code": ["coding", "code", "categorize", "classify", "allocate"],
  "report": ["reporting", "report", "analytics", "dashboard", "visibility"],
  "close": ["close", "month-end", "reconciliation", "period"],
  "check": ["check", "cheque", "paper", "printing"],
  "global": ["international", "global", "cross-border", "multi-country"],
  "fix": ["resolve", "fix", "handle", "manage", "address"],
  "problem": ["issue", "exception", "error", "discrepancy", "problem"],
  "waste": ["inefficiency", "waste", "unnecessary", "overhead"],
  "speed": ["fast", "quick", "accelerate", "automate", "throughput"],
};

// Cache for built step indexes
let cachedIndex: { stepId: string; title: string; tokens: string[]; stemmed: string[]; bigrams: string[]; rawText: string }[] | null = null;
let cachedSteps: WorkflowStep[] | null = null;

function buildIndex(steps: WorkflowStep[]) {
  // Return cached if steps haven't changed
  if (cachedIndex && cachedSteps === steps) return cachedIndex;

  cachedIndex = steps.map((step) => {
    const corpusParts = buildStepCorpus(step);
    const rawText = corpusParts.join(" ").toLowerCase();
    const tokens = tokenize(rawText);
    const stemmed = tokens.map(stem);
    const bigrams = getBigrams(tokens);

    return {
      stepId: step.id,
      title: step.title,
      tokens,
      stemmed,
      bigrams,
      rawText,
    };
  });
  cachedSteps = steps;
  return cachedIndex;
}

// Expand query with synonyms
function expandQuery(tokens: string[]): string[] {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const synonyms = SYNONYM_MAP[token];
    if (synonyms) {
      for (const syn of synonyms) {
        expanded.add(syn);
      }
    }
  }
  return Array.from(expanded);
}

export function mapQueryToSteps(query: string, steps: WorkflowStep[]): IntentResult {
  const index = buildIndex(steps);

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return { query, matches: [] };
  }

  const queryStemmed = queryTokens.map(stem);
  const queryExpanded = expandQuery(queryTokens);
  const queryExpandedStemmed = queryExpanded.map(stem);
  const queryBigrams = getBigrams(queryTokens);

  const scores: { stepId: string; stepTitle: string; score: number }[] = [];

  for (const entry of index) {
    let score = 0;

    // 1. Exact token matches (highest weight)
    for (const qt of queryTokens) {
      if (entry.tokens.includes(qt)) {
        score += 4;
      }
    }

    // 2. Stemmed token matches
    for (const qs of queryStemmed) {
      if (entry.stemmed.includes(qs)) {
        score += 2.5;
      }
    }

    // 3. Synonym-expanded matches (lower weight — indirect match)
    for (const qe of queryExpandedStemmed) {
      if (entry.stemmed.includes(qe)) {
        score += 1.5;
      }
    }

    // 4. Bigram matches (strong signal — phrase-level match)
    for (const qb of queryBigrams) {
      if (entry.bigrams.includes(qb)) {
        score += 5;
      }
    }

    // 5. Substring match in raw text (catches partial matches)
    for (const qt of queryTokens) {
      if (qt.length >= 4 && entry.rawText.includes(qt)) {
        score += 1;
      }
    }

    if (score > 0) {
      // Normalize to 0-100 scale
      // A "perfect" query with 3 tokens might score ~30 (4+2.5+1.5 per token + bigrams)
      // Use queryTokens.length to scale expectations
      const maxReasonable = queryTokens.length * 10;
      const confidence = Math.min(100, Math.round((score / maxReasonable) * 100));

      if (confidence >= 25) {
        scores.push({ stepId: entry.stepId, stepTitle: entry.title, score: confidence });
      }
    }
  }

  // Sort by score descending, take top 3
  scores.sort((a, b) => b.score - a.score);
  const top = scores.slice(0, 3);

  return {
    query,
    matches: top.map((s) => ({
      stepId: s.stepId,
      stepTitle: s.stepTitle,
      confidence: s.score,
    })),
  };
}
