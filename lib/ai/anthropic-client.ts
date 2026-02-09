import Anthropic from "@anthropic-ai/sdk";

/**
 * Anthropic API Client Singleton
 * Server-side only - do not import in client components
 */

let anthropicInstance: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  if (!anthropicInstance) {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Please add it to your .env.local file."
      );
    }

    anthropicInstance = new Anthropic({
      apiKey,
    });
  }

  return anthropicInstance;
}

/**
 * Conservative API call wrapper with error handling
 * Helps minimize unnecessary API costs
 */
export async function callAnthropicWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 1 // Conservative: only 1 retry to avoid excessive costs
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx) - only server errors (5xx)
      if (error instanceof Anthropic.APIError && error.status && error.status < 500) {
        throw error;
      }

      // Only retry if we have attempts left
      if (attempt < maxRetries) {
        // Conservative backoff: 1 second
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  throw lastError;
}
