/**
 * SEC EDGAR rate limiter.
 *
 * SEC enforces a 10-requests-per-second limit on data.sec.gov and www.sec.gov.
 * Exceeding it results in a 429 response and a 10-minute IP block.
 *
 * This module provides `secFetch()` — a drop-in replacement for `fetch()` that
 * queues requests so they are spaced at least MIN_INTERVAL_MS apart, keeping us
 * safely under the limit. The queue serializes timing only; once a request slot
 * is assigned the HTTP call runs concurrently with future slot assignments.
 */

const MIN_INTERVAL_MS = 150; // ~6.7 req/sec — safely under SEC's 10/sec

let nextAvailableTime = 0;
let slotChain: Promise<void> = Promise.resolve();

/**
 * Rate-limited fetch for SEC EDGAR endpoints.
 * Same signature as global `fetch()`, but queues requests to avoid 429s.
 */
export function secFetch(url: string | URL, init?: RequestInit): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    slotChain = slotChain.then(async () => {
      const now = Date.now();
      const waitMs = Math.max(0, nextAvailableTime - now);
      if (waitMs > 0) {
        await new Promise<void>((r) => setTimeout(r, waitMs));
      }
      nextAvailableTime = Date.now() + MIN_INTERVAL_MS;
      // Fire the actual request — don't await it in the chain so the next
      // slot can be assigned while this request is in flight.
      fetch(url, init).then(resolve, reject);
    });
  });
}
