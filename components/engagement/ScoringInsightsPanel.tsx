"use client";

import { useState } from "react";
import { ScoringResult } from "@/lib/scoring/automation-score";
import { FinancialProfile, PeerComparisonSet, PeerFinancials } from "@/types/diagnostic";
import { PeerSearchInput } from "@/components/diagnostic/company-intel/PeerSearchInput";
import { Calculator, TrendingUp, TrendingDown, Minus, Gauge, Target, Percent, X, Users } from "lucide-react";

interface ScoringInsightsPanelProps {
  scoringResult: ScoringResult;
  companyFinancials?: FinancialProfile | null;
  peerComparison?: PeerComparisonSet | null;
  onPeerChange?: (customPeers: PeerFinancials[], removedTickers: string[]) => void;
}

// ── Helpers ──

function formatDollars(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 1_000_000_000) return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(amount / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `$${(amount / 1_000).toFixed(0)}K`;
  return `$${amount.toFixed(0)}`;
}

function scoreColor(score: number): string {
  if (score >= 75) return "text-red-600";
  if (score >= 50) return "text-amber-600";
  return "text-emerald-600";
}

function simpleMedian(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

interface TierData {
  label: string;
  count: number;
  gaPercent: number | null;
  operatingMargin: number | null;
  grossMargin: number | null;
  revenue: number | null;
}

function computeTierStats(peers: PeerFinancials[], label: string): TierData | null {
  if (peers.length === 0) return null;
  const ga = peers.map((p) => p.gaAsPercent).filter((v): v is number => v != null);
  const om = peers.map((p) => p.operatingMargin).filter((v): v is number => v != null);
  const gm = peers.map((p) => p.grossMargin).filter((v): v is number => v != null);
  const rev = peers.map((p) => p.revenue).filter((v): v is number => v != null);
  return {
    label,
    count: peers.length,
    gaPercent: simpleMedian(ga),
    operatingMargin: simpleMedian(om),
    grossMargin: simpleMedian(gm),
    revenue: simpleMedian(rev),
  };
}

// ── Visual bar ──

function ComparisonBar({
  label,
  value,
  maxValue,
  color,
  suffix = "%",
  decimals = 1,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  suffix?: string;
  decimals?: number;
}) {
  const width = maxValue > 0 ? Math.min(100, (value / maxValue) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-[140px] shrink-0 truncate">{label}</span>
      <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${width}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 tabular-nums w-[60px] text-right shrink-0">
        {value.toFixed(decimals)}{suffix}
      </span>
    </div>
  );
}

// ── Gap indicator ──

function GapIndicator({ gap, unit, positiveLabel, negativeLabel }: {
  gap: number; unit: string; positiveLabel: string; negativeLabel: string;
}) {
  const isPositive = gap > 0;
  const isNeutral = Math.abs(gap) < 0.5;
  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;
  const color = isNeutral ? "text-gray-500" : isPositive ? "text-amber-600" : "text-emerald-600";
  const bgColor = isNeutral ? "bg-gray-50" : isPositive ? "bg-amber-50" : "bg-emerald-50";
  return (
    <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md ${bgColor} text-xs ${color}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" />
      <span className="font-mono font-semibold">{gap > 0 ? "+" : ""}{gap.toFixed(unit === "pp" ? 1 : 0)}{unit}</span>
      <span className="text-gray-500">{isPositive ? positiveLabel : negativeLabel}</span>
    </div>
  );
}

// ── Metric comparison ──

function MetricComparison({ metricName, companyValue, tiers, getMetric, suffix, decimals, gapValue, gapUnit, positiveLabel, negativeLabel, narrative }: {
  metricName: string; companyValue: number | null; tiers: TierData[];
  getMetric: (t: TierData) => number | null; suffix?: string; decimals?: number;
  gapValue?: number | null; gapUnit?: string; positiveLabel?: string; negativeLabel?: string; narrative?: string | null;
}) {
  if (companyValue == null) return null;
  const allValues = [companyValue, ...tiers.map(getMetric).filter((v): v is number => v != null)];
  const maxVal = Math.max(...allValues) * 1.15;
  const tierColors = ["bg-blue-400", "bg-indigo-400", "bg-purple-400"];
  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">{metricName}</h5>
      <div className="space-y-1.5">
        <ComparisonBar label="Your Company" value={companyValue} maxValue={maxVal} color="bg-emerald-500" suffix={suffix} decimals={decimals} />
        {tiers.map((tier, i) => {
          const val = getMetric(tier);
          if (val == null) return null;
          return <ComparisonBar key={tier.label} label={`${tier.label} (${tier.count})`} value={val} maxValue={maxVal} color={tierColors[i % tierColors.length]} suffix={suffix} decimals={decimals} />;
        })}
      </div>
      {gapValue != null && gapUnit && positiveLabel && negativeLabel && (
        <GapIndicator gap={gapValue} unit={gapUnit} positiveLabel={positiveLabel} negativeLabel={negativeLabel} />
      )}
      {narrative && <p className="text-xs text-gray-500 leading-relaxed pl-0.5 italic">{narrative}</p>}
    </div>
  );
}

type TileId = "complexity" | "ceiling" | "effort";

// ── Main Panel ──

export function ScoringInsightsPanel({
  scoringResult: sr,
  companyFinancials,
  peerComparison,
  onPeerChange,
}: ScoringInsightsPanelProps) {
  const [activeTile, setActiveTile] = useState<TileId | null>(null);
  const [isFetchingPeer, setIsFetchingPeer] = useState(false);

  // Extract company metrics
  // Note: revenue and expense amounts are stored in MILLIONS in FinancialProfile
  const latest = companyFinancials?.yearlyData?.[0];
  const companyGA = latest?.expenses?.find((e) => e.category === "G&A")?.asPercentOfRevenue ?? null;
  const companyGAAmountM = latest?.expenses?.find((e) => e.category === "G&A")?.amount ?? null;
  const companyGAAmount = companyGAAmountM != null ? companyGAAmountM * 1_000_000 : null;
  const companyOpMargin = latest?.operatingMargin ?? null;
  const companyGrossMargin = latest?.grossMargin ?? null;
  const companyRevenueM = latest?.revenue ?? null;
  const companyRevenue = companyRevenueM != null ? companyRevenueM * 1_000_000 : null;
  const companyDSO = companyFinancials?.derivedMetrics?.dso ?? null;
  const companyDPO = companyFinancials?.derivedMetrics?.dpo ?? null;
  const employeeCount = companyFinancials?.employeeCount ?? null;

  // Peer data
  const systemPeers = peerComparison?.peers ?? [];
  const customPeers = peerComparison?.customPeers ?? [];
  const removedTickers = new Set(peerComparison?.removedTickers ?? []);
  const competitorSource = peerComparison?.competitorSource ?? "SIC";
  const targetTicker = peerComparison?.targetTicker ?? "";

  // Filter out removed peers for display
  const visibleSystemPeers = systemPeers.filter((p) => !removedTickers.has(p.ticker));
  const visibleCustomPeers = customPeers.filter((p) => !removedTickers.has(p.ticker));
  const allVisiblePeers = [...visibleSystemPeers, ...visibleCustomPeers];

  // Build per-tier data
  const tiers: TierData[] = [];
  const systemTier = computeTierStats(
    visibleSystemPeers,
    competitorSource === "10-K" ? "10-K Competitors" : "SIC Industry Peers"
  );
  if (systemTier) tiers.push(systemTier);
  const userTier = computeTierStats(visibleCustomPeers, "User-Selected Peers");
  if (userTier) tiers.push(userTier);

  // G&A narrative
  let gaNarrative: string | null = null;
  if (companyGA != null && companyRevenue != null && sr.gaGapVsPeers != null && sr.gaGapVsPeers > 0) {
    const gaDollars = companyGAAmount ? formatDollars(companyGAAmount) : `${companyGA.toFixed(1)}% of revenue`;
    const excessDollars = formatDollars((sr.gaGapVsPeers / 100) * companyRevenue);
    gaNarrative = `G&A spending of ${gaDollars} is ${sr.gaGapVsPeers.toFixed(1)}pp above the weighted peer median. On a ${formatDollars(companyRevenue)} revenue base, this gap represents ~${excessDollars} in potentially addressable spending.`;
  } else if (companyGA != null && sr.gaGapVsPeers != null && sr.gaGapVsPeers <= 0) {
    gaNarrative = `G&A at ${companyGA.toFixed(1)}% is already ${Math.abs(sr.gaGapVsPeers).toFixed(1)}pp below peer median — already lean. Focus on process quality and capacity unlocking.`;
  }

  const toggleTile = (id: TileId) => setActiveTile(activeTile === id ? null : id);

  // Peer management handlers
  const handleAddPeer = async (result: { ticker: string; name: string }) => {
    if (!onPeerChange) return;
    setIsFetchingPeer(true);
    try {
      const res = await fetch(`/api/edgar/financials?ticker=${encodeURIComponent(result.ticker)}`);
      if (res.ok) {
        const profile: FinancialProfile = await res.json();
        const latestYear = profile.yearlyData?.[0];
        if (latestYear) {
          const expenses = latestYear.expenses || [];
          const peer: PeerFinancials = {
            ticker: result.ticker,
            companyName: result.name,
            revenue: latestYear.revenue,
            revenueGrowth: latestYear.revenueGrowth,
            grossMargin: latestYear.grossMargin,
            operatingMargin: latestYear.operatingMargin,
            rdAsPercent: expenses.find((e) => e.category === "R&D")?.asPercentOfRevenue,
            smAsPercent: expenses.find((e) => e.category === "S&M" || e.category === "SG&A")?.asPercentOfRevenue,
            gaAsPercent: expenses.find((e) => e.category === "G&A")?.asPercentOfRevenue,
          };
          const updated = [...customPeers, peer];
          onPeerChange(updated, Array.from(removedTickers));
        }
      }
    } catch {
      // ignore
    } finally {
      setIsFetchingPeer(false);
    }
  };

  const handleRemovePeer = (ticker: string) => {
    if (!onPeerChange) return;
    if (customPeers.some((p) => p.ticker === ticker)) {
      const updated = customPeers.filter((p) => p.ticker !== ticker);
      onPeerChange(updated, Array.from(removedTickers));
    } else {
      const updated = new Set(removedTickers);
      updated.add(ticker);
      onPeerChange(customPeers, Array.from(updated));
    }
  };

  const hasPeerData = tiers.length > 0 && (companyGA != null || companyOpMargin != null);

  // Exclude tickers for search
  const excludeTickers = [
    targetTicker,
    ...systemPeers.map((p) => p.ticker),
    ...customPeers.map((p) => p.ticker),
  ].filter(Boolean);

  // 3 tiles (no Cost Savings)
  const tiles: { id: TileId; label: string; value: string; sub: string; icon: React.ReactNode; color: string; activeBorder: string }[] = [
    {
      id: "complexity",
      label: "Complexity",
      value: `${sr.complexityScore}`,
      sub: "of 100",
      icon: <Gauge className="h-4 w-4" />,
      color: scoreColor(sr.complexityScore),
      activeBorder: sr.complexityScore >= 75 ? "ring-red-400" : sr.complexityScore >= 50 ? "ring-amber-400" : "ring-emerald-400",
    },
    {
      id: "ceiling",
      label: "Automation Ceiling",
      value: `${sr.constraints.highLeverageMax}%`,
      sub: "max high-leverage",
      icon: <Target className="h-4 w-4" />,
      color: "text-blue-600",
      activeBorder: "ring-blue-400",
    },
    {
      id: "effort",
      label: "Effort Addressable",
      value: sr.constraints.effortAddressableRange,
      sub: `vs ${allVisiblePeers.length} peers`,
      icon: <Percent className="h-4 w-4" />,
      color: "text-gray-800",
      activeBorder: "ring-gray-400",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Calculator className="h-4 w-4 text-blue-600" />
        <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
          Scoring Insights
        </h4>
        <span className="text-[10px] text-gray-400 ml-1">
          EDGAR financials · {allVisiblePeers.length} peers ({sr.peerContext.source})
        </span>
      </div>

      {/* 3 clickable metric tiles */}
      <div className="grid grid-cols-3 gap-3">
        {tiles.map((tile) => {
          const isActive = activeTile === tile.id;
          return (
            <button
              key={tile.id}
              onClick={() => toggleTile(tile.id)}
              className={`rounded-lg border p-3 text-center transition-all cursor-pointer ${
                isActive
                  ? `ring-2 ${tile.activeBorder} border-transparent bg-white shadow-sm`
                  : "border-gray-200 bg-gray-50 hover:bg-gray-100 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={isActive ? tile.color : "text-gray-400"}>{tile.icon}</span>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider">{tile.label}</p>
              </div>
              <p className={`text-2xl font-bold ${tile.color}`}>{tile.value}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{tile.sub}</p>
            </button>
          );
        })}
      </div>

      {/* Detail panels */}
      {activeTile === "complexity" && (
        <DetailPanel>
          <DetailTitle>What Drives Complexity</DetailTitle>
          <p className="text-xs text-gray-500 mb-3">
            Score of <span className={`font-bold ${scoreColor(sr.complexityScore)}`}>{sr.complexityScore}/100</span> — {sr.complexityScore >= 75 ? "high" : sr.complexityScore >= 50 ? "moderate" : "low"} organizational complexity.
            {sr.complexityScore >= 60
              ? " More process layers and entrenched systems make full automation harder, but the opportunity scale is larger."
              : " Simpler structure means faster automation adoption with fewer change management barriers."}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {companyRevenue != null && (
              <FactorChip label="Revenue" value={formatDollars(companyRevenue)}
                note={companyRevenue >= 10_000_000_000 ? "Large scale = complex processes" : companyRevenue >= 1_000_000_000 ? "Mid-to-large scale" : "Smaller scale"} />
            )}
            {employeeCount != null && (
              <FactorChip label="Employees" value={`~${employeeCount.toLocaleString()}`}
                note={employeeCount >= 10000 ? "Many process layers" : employeeCount >= 1000 ? "Moderate layers" : "Lean org"} />
            )}
            {companyGA != null && (
              <FactorChip label="G&A Burden" value={`${companyGA.toFixed(1)}%`}
                note={companyGA >= 15 ? "High admin overhead" : companyGA >= 10 ? "Moderate overhead" : "Lean admin"} />
            )}
            {companyFinancials?.yearlyData && (
              <FactorChip label="Reporting History" value={`${companyFinancials.yearlyData.length} years`}
                note="More years = more mature org" />
            )}
          </div>
        </DetailPanel>
      )}

      {activeTile === "ceiling" && (
        <DetailPanel>
          <DetailTitle>What Limits Automation</DetailTitle>
          <p className="text-xs text-gray-500 mb-3">
            Maximum <span className="font-bold text-blue-600">{sr.constraints.highLeverageMax}%</span> of processes can be fully automated.
            The remaining {100 - sr.constraints.highLeverageMax}% requires human-in-the-loop or human-led approaches.
          </p>
          <div className="space-y-2">
            <div className="h-5 bg-gray-100 rounded-full overflow-hidden flex">
              <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: `${sr.constraints.highLeverageMax}%` }} />
              <div className="bg-amber-300 h-full" style={{ width: `${Math.max(0, 100 - sr.constraints.highLeverageMax - 20)}%` }} />
              <div className="bg-gray-300 h-full rounded-r-full" style={{ width: "20%" }} />
            </div>
            <div className="flex items-center gap-4 text-[10px] text-gray-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> High Leverage ({sr.constraints.highLeverageMax}%)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-300" /> Human-in-Loop</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" /> Human-Led</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-3 italic">
            Ceiling determined by ERP maturity{sr.complexityScore >= 60 ? " and adjusted for organizational complexity" : ""}.
          </p>
        </DetailPanel>
      )}

      {activeTile === "effort" && (
        <DetailPanel>
          <DetailTitle>Peer Comparison — What Makes Effort Addressable</DetailTitle>
          <p className="text-xs text-gray-500 mb-3">
            <span className="font-bold text-gray-800">{sr.constraints.effortAddressableRange}</span> of current effort is addressable through automation, anchored to G&A gap versus peers.
          </p>

          {/* Peer tier legend */}
          {tiers.length > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Your Company</span>
              {tiers.map((tier, i) => (
                <span key={tier.label} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${i === 0 ? "bg-blue-400" : "bg-indigo-400"}`} />
                  {tier.label} ({tier.count})
                </span>
              ))}
            </div>
          )}

          {/* G&A comparison */}
          <MetricComparison metricName="G&A % of Revenue" companyValue={companyGA} tiers={tiers}
            getMetric={(t) => t.gaPercent} suffix="%" decimals={1}
            gapValue={sr.gaGapVsPeers} gapUnit="pp" positiveLabel="above peers — more addressable" negativeLabel="below peers — already lean"
            narrative={gaNarrative} />

          {companyOpMargin != null && (
            <div className="mt-4">
              <MetricComparison metricName="Operating Margin" companyValue={companyOpMargin} tiers={tiers}
                getMetric={(t) => t.operatingMargin} suffix="%" decimals={1} />
            </div>
          )}
          {companyGrossMargin != null && (
            <div className="mt-4">
              <MetricComparison metricName="Gross Margin" companyValue={companyGrossMargin} tiers={tiers}
                getMetric={(t) => t.grossMargin} suffix="%" decimals={1} />
            </div>
          )}

          {/* DSO/DPO gaps inline */}
          {(companyDSO != null || companyDPO != null || (sr.revenuePerEmployee != null && sr.peerMedianRevenuePerEmployee != null)) && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              {companyDSO != null && sr.dsoGap != null && (
                <div className="rounded-md border border-gray-100 p-2.5 space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">DSO</p>
                  <p className="text-sm font-semibold text-gray-800">{Math.round(companyDSO)} days</p>
                  <GapIndicator gap={sr.dsoGap} unit=" days" positiveLabel="slower" negativeLabel="faster" />
                </div>
              )}
              {companyDPO != null && sr.dpoGap != null && (
                <div className="rounded-md border border-gray-100 p-2.5 space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">DPO</p>
                  <p className="text-sm font-semibold text-gray-800">{Math.round(companyDPO)} days</p>
                  <GapIndicator gap={sr.dpoGap} unit=" days" positiveLabel="paying slower" negativeLabel="paying faster" />
                </div>
              )}
              {sr.revenuePerEmployee != null && sr.peerMedianRevenuePerEmployee != null && (
                <div className="rounded-md border border-gray-100 p-2.5 space-y-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wider">Rev / Employee</p>
                  <p className="text-sm font-semibold text-gray-800">${Math.round(sr.revenuePerEmployee)}K</p>
                  <GapIndicator gap={sr.revenuePerEmployee - sr.peerMedianRevenuePerEmployee} unit="K" positiveLabel="more productive" negativeLabel="below peers" />
                </div>
              )}
            </div>
          )}

          {/* Peer list with add/remove */}
          <div className="mt-5 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-3.5 w-3.5 text-gray-400" />
              <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Peers in Comparison ({allVisiblePeers.length})
              </h5>
            </div>

            {/* System peers */}
            {visibleSystemPeers.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-gray-400 mb-1">
                  {competitorSource === "10-K" ? "10-K Competitors" : "SIC Industry Peers"} ({visibleSystemPeers.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {visibleSystemPeers.map((peer) => (
                    <PeerChip
                      key={peer.ticker}
                      ticker={peer.ticker}
                      name={peer.companyName}
                      onRemove={onPeerChange ? () => handleRemovePeer(peer.ticker) : undefined}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* User-selected peers */}
            {visibleCustomPeers.length > 0 && (
              <div className="mb-2">
                <p className="text-[10px] text-gray-400 mb-1">User-Selected ({visibleCustomPeers.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {visibleCustomPeers.map((peer) => (
                    <PeerChip
                      key={peer.ticker}
                      ticker={peer.ticker}
                      name={peer.companyName}
                      onRemove={onPeerChange ? () => handleRemovePeer(peer.ticker) : undefined}
                      isCustom
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Add peers CTA */}
            {onPeerChange && (
              <div className="mt-3">
                <PeerSearchInput
                  onSelect={handleAddPeer}
                  excludeTickers={excludeTickers}
                  loading={isFetchingPeer}
                  disabled={isFetchingPeer}
                  maxPeers={10}
                  currentCount={customPeers.length}
                />
              </div>
            )}

            {!onPeerChange && allVisiblePeers.length === 0 && (
              <p className="text-xs text-gray-400">
                Generate Company Intelligence for a public company to see peer comparisons.
              </p>
            )}
          </div>
        </DetailPanel>
      )}

      <p className="text-[10px] text-gray-400">
        Computed from EDGAR financials. Constraints anchor AI-generated diagnostic ranges.
      </p>
    </div>
  );
}

// ── Shared components ──

function DetailPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
      {children}
    </div>
  );
}

function DetailTitle({ children }: { children: React.ReactNode }) {
  return <h5 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">{children}</h5>;
}

function FactorChip({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="rounded-md border border-gray-100 bg-gray-50 p-2.5">
      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
      <p className="text-[10px] text-gray-400 mt-0.5">{note}</p>
    </div>
  );
}

function PeerChip({ ticker, name, onRemove, isCustom }: {
  ticker: string; name?: string; onRemove?: () => void; isCustom?: boolean;
}) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs border ${
      isCustom ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-gray-50 border-gray-200 text-gray-700"
    }`}>
      <span className="font-semibold">{ticker}</span>
      {name && name !== ticker && <span className="text-gray-400 max-w-[80px] truncate">{name}</span>}
      {onRemove && (
        <button onClick={onRemove} className="ml-0.5 text-gray-400 hover:text-red-500 transition-colors" title="Remove peer">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
