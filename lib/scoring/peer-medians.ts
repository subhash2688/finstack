/**
 * Peer Median Calculator
 *
 * Computes weighted peer medians from 3 tiers:
 * - Tier 1 (1x): SIC peers (nearest 20 by revenue)
 * - Tier 2 (1.5x): 10-K competitors
 * - Tier 3 (2x): User-selected peers
 *
 * Used by the deterministic scoring engine to anchor
 * automation opportunity ranges to real peer data.
 */

import { PeerFinancials } from "@/types/diagnostic";

export interface PeerMedians {
  gaPercent: number | null;
  rdPercent: number | null;
  smPercent: number | null;
  operatingMargin: number | null;
  grossMargin: number | null;
  dso: number | null;
  dpo: number | null;
  revenuePerEmployee: number | null;
  peerCount: number;
  medianRevenue: number | null;
  source: string;
}

interface WeightedValue {
  value: number;
  weight: number;
}

/**
 * Compute weighted median: sorts by value, walks cumulative weight to midpoint.
 */
function weightedMedian(items: WeightedValue[]): number | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0].value;

  const sorted = [...items].sort((a, b) => a.value - b.value);
  const totalWeight = sorted.reduce((sum, i) => sum + i.weight, 0);
  const midpoint = totalWeight / 2;

  let cumulative = 0;
  for (let i = 0; i < sorted.length; i++) {
    cumulative += sorted[i].weight;
    if (cumulative >= midpoint) {
      return sorted[i].value;
    }
  }
  return sorted[sorted.length - 1].value;
}

/**
 * Compute peer medians from 3 tiers of peer data.
 *
 * @param sicPeers - Tier 1: SIC code peers (weight 1x)
 * @param tenKCompetitors - Tier 2: 10-K competitors (weight 1.5x)
 * @param userSelectedPeers - Tier 3: User-selected peers (weight 2x)
 * @param targetDSO - Target company DSO (for peers that don't have it)
 * @param targetDPO - Target company DPO (for peers that don't have it)
 */
export function computePeerMedians(
  sicPeers: PeerFinancials[],
  tenKCompetitors: PeerFinancials[],
  userSelectedPeers: PeerFinancials[],
  peerDerivedMetrics?: Map<string, { dso?: number; dpo?: number; revenuePerEmployee?: number }>
): PeerMedians {
  // Deduplicate: if a ticker appears in multiple tiers, use highest weight
  const seen = new Map<string, { peer: PeerFinancials; weight: number }>();

  for (const peer of sicPeers) {
    const key = peer.ticker.toUpperCase();
    if (!seen.has(key) || seen.get(key)!.weight < 1) {
      seen.set(key, { peer, weight: 1 });
    }
  }
  for (const peer of tenKCompetitors) {
    const key = peer.ticker.toUpperCase();
    if (!seen.has(key) || seen.get(key)!.weight < 1.5) {
      seen.set(key, { peer, weight: 1.5 });
    }
  }
  for (const peer of userSelectedPeers) {
    const key = peer.ticker.toUpperCase();
    if (!seen.has(key) || seen.get(key)!.weight < 2) {
      seen.set(key, { peer, weight: 2 });
    }
  }

  const entries = Array.from(seen.values());
  if (entries.length === 0) {
    return {
      gaPercent: null,
      rdPercent: null,
      smPercent: null,
      operatingMargin: null,
      grossMargin: null,
      dso: null,
      dpo: null,
      revenuePerEmployee: null,
      peerCount: 0,
      medianRevenue: null,
      source: "none",
    };
  }

  // Collect weighted values per metric
  const gaValues: WeightedValue[] = [];
  const rdValues: WeightedValue[] = [];
  const smValues: WeightedValue[] = [];
  const opMarginValues: WeightedValue[] = [];
  const grossMarginValues: WeightedValue[] = [];
  const revenueValues: WeightedValue[] = [];
  const dsoValues: WeightedValue[] = [];
  const dpoValues: WeightedValue[] = [];
  const rpeValues: WeightedValue[] = [];

  for (const { peer, weight } of entries) {
    if (peer.gaAsPercent != null) gaValues.push({ value: peer.gaAsPercent, weight });
    if (peer.rdAsPercent != null) rdValues.push({ value: peer.rdAsPercent, weight });
    if (peer.smAsPercent != null) smValues.push({ value: peer.smAsPercent, weight });
    if (peer.operatingMargin != null) opMarginValues.push({ value: peer.operatingMargin, weight });
    if (peer.grossMargin != null) grossMarginValues.push({ value: peer.grossMargin, weight });
    if (peer.revenue != null) revenueValues.push({ value: peer.revenue, weight });

    // Derived metrics from batch-fetched profiles
    const ticker = peer.ticker.toUpperCase();
    const derived = peerDerivedMetrics?.get(ticker);
    if (derived) {
      if (derived.dso != null) dsoValues.push({ value: derived.dso, weight });
      if (derived.dpo != null) dpoValues.push({ value: derived.dpo, weight });
      if (derived.revenuePerEmployee != null) rpeValues.push({ value: derived.revenuePerEmployee, weight });
    }
  }

  // Build source label
  const sources: string[] = [];
  if (sicPeers.length > 0) sources.push(`SIC(${sicPeers.length})`);
  if (tenKCompetitors.length > 0) sources.push(`10-K(${tenKCompetitors.length})`);
  if (userSelectedPeers.length > 0) sources.push(`User(${userSelectedPeers.length})`);

  return {
    gaPercent: weightedMedian(gaValues),
    rdPercent: weightedMedian(rdValues),
    smPercent: weightedMedian(smValues),
    operatingMargin: weightedMedian(opMarginValues),
    grossMargin: weightedMedian(grossMarginValues),
    dso: weightedMedian(dsoValues),
    dpo: weightedMedian(dpoValues),
    revenuePerEmployee: weightedMedian(rpeValues),
    peerCount: entries.length,
    medianRevenue: weightedMedian(revenueValues),
    source: sources.join(" + "),
  };
}
