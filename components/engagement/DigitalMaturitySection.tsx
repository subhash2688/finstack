"use client";

import { useState } from "react";
import { Engagement } from "@/types/engagement";
import { DigitalMaturityScan, DigitalMaturityDeepDive } from "@/types/digital-maturity";
import { saveEngagement } from "@/lib/storage/engagements";
import { TechStackPanel } from "./TechStackPanel";
import { MaturityRadarPanel } from "./MaturityRadarPanel";
import { MarketSignalsPanel } from "./MarketSignalsPanel";
import { MethodologyPanel } from "./MethodologyPanel";
import { Button } from "@/components/ui/button";
import { Loader2, Radar, Cpu, BarChart3, TrendingUp } from "lucide-react";

interface DigitalMaturitySectionProps {
  engagement: Engagement;
  setEngagement: (eng: Engagement) => void;
}

type DeepDiveSection = "techStack" | "maturity" | "marketSignals";

export function DigitalMaturitySection({
  engagement,
  setEngagement,
}: DigitalMaturitySectionProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [loadingDeepDive, setLoadingDeepDive] = useState<DeepDiveSection | null>(null);
  const [activeSubTile, setActiveSubTile] = useState<DeepDiveSection | null>(null);

  const toggleSubTile = (id: DeepDiveSection) => {
    setActiveSubTile(activeSubTile === id ? null : id);
  };

  const scan = engagement.digitalMaturityScan;

  const runScan = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const fp = engagement.companyIntel?.financialProfile;
      const response = await fetch("/api/digital-maturity-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientContext: {
            companyName: engagement.clientContext.companyName,
            companySize: engagement.clientContext.companySize,
            industry: engagement.clientContext.industry,
            subSector: engagement.clientContext.subSector,
            isPublic: engagement.clientContext.isPublic,
            tickerSymbol: engagement.clientContext.tickerSymbol,
            erp: engagement.clientContext.erp,
          },
          existingIntel: {
            revenue: fp?.yearlyData?.[0]?.revenue
              ? `$${(fp.yearlyData[0].revenue / 1_000_000_000).toFixed(1)}B`
              : engagement.clientContext.revenue,
            employees: fp?.employeeCount
              ? fp.employeeCount.toLocaleString()
              : engagement.clientContext.headcount,
            competitors: engagement.companyIntel?.peerComparison?.peers
              ?.slice(0, 5)
              .map((p) => p.companyName || p.ticker),
          },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Scan failed (${response.status})`);
      }

      const result: DigitalMaturityScan = await response.json();
      const updated: Engagement = {
        ...engagement,
        digitalMaturityScan: result,
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
      window.dispatchEvent(new Event("engagement-updated"));
    } catch (err) {
      setScanError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setIsScanning(false);
    }
  };

  const runDeepDive = async (section: DeepDiveSection) => {
    if (!scan) return;
    setLoadingDeepDive(section);
    try {
      const response = await fetch("/api/digital-maturity-scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientContext: {
            companyName: engagement.clientContext.companyName,
            companySize: engagement.clientContext.companySize,
            industry: engagement.clientContext.industry,
            subSector: engagement.clientContext.subSector,
            isPublic: engagement.clientContext.isPublic,
            tickerSymbol: engagement.clientContext.tickerSymbol,
            erp: engagement.clientContext.erp,
          },
          deepDiveSection: section,
        }),
      });

      if (!response.ok) {
        throw new Error(`Deep dive failed (${response.status})`);
      }

      const result: DigitalMaturityDeepDive = await response.json();
      const deepDives = { ...(scan.deepDives || {}), [section]: result };
      const updatedScan: DigitalMaturityScan = { ...scan, deepDives };
      const updated: Engagement = {
        ...engagement,
        digitalMaturityScan: updatedScan,
        updatedAt: new Date().toISOString(),
      };
      saveEngagement(updated);
      setEngagement(updated);
      window.dispatchEvent(new Event("engagement-updated"));
    } catch {
      // Silently fail deep dives — user can retry
    } finally {
      setLoadingDeepDive(null);
    }
  };

  // Not yet scanned — show the button
  if (!scan) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-purple-50 flex items-center justify-center">
              <Radar className="h-4.5 w-4.5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mt-0.5">
                AI-powered scan of technology stack, maturity signals, and competitive pressure
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={runScan}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Scanning...
              </>
            ) : (
              "Run Scan"
            )}
          </Button>
        </div>
        {scanError && (
          <p className="text-xs text-red-600 mt-2">{scanError}</p>
        )}
      </div>
    );
  }

  // Scan complete — show results with sub-tiles
  const techDeepDive = scan.deepDives?.techStack;
  const maturityDeepDive = scan.deepDives?.maturity;
  const marketDeepDive = scan.deepDives?.marketSignals;

  const MATURITY_LABELS = ["", "Manual", "Standardized", "Optimized", "Intelligent"];

  // Build sub-tile summaries
  const techSummary = [
    `Level ${scan.techStack.overallTechMaturity}: ${MATURITY_LABELS[scan.techStack.overallTechMaturity]}`,
    scan.techStack.detectedTechnologies.length > 0
      ? `${scan.techStack.detectedTechnologies.length} technologies`
      : null,
  ].filter(Boolean).join(" · ");

  const maturitySummary = [
    `Level ${scan.maturityAssessment.overallLevel}: ${scan.maturityAssessment.overallLevelName}`,
    `${scan.maturityAssessment.dimensions.length} dimensions`,
  ].join(" · ");

  const marketSummary = [
    scan.marketSignals.peerMoves.length > 0
      ? `${scan.marketSignals.peerMoves.length} peer moves`
      : null,
    scan.marketSignals.analystMentions.length > 0
      ? `${scan.marketSignals.analystMentions.length} analyst mentions`
      : null,
    scan.marketSignals.maActivity.length > 0
      ? `${scan.marketSignals.maActivity.length} M&A events`
      : null,
  ].filter(Boolean).join(" · ") || "No signals detected";

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs text-gray-400">
          Scanned {new Date(scan.generatedAt).toLocaleDateString()}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={runScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Rescanning...
            </>
          ) : (
            "Rescan"
          )}
        </Button>
      </div>

      {/* 3 Sub-tiles */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <SubTile
          icon={<Cpu className="h-4.5 w-4.5" />}
          title="Tech Stack"
          summary={techSummary}
          isActive={activeSubTile === "techStack"}
          onClick={() => toggleSubTile("techStack")}
          color="blue"
        />
        <SubTile
          icon={<BarChart3 className="h-4.5 w-4.5" />}
          title="Maturity"
          summary={maturitySummary}
          isActive={activeSubTile === "maturity"}
          onClick={() => toggleSubTile("maturity")}
          color="emerald"
        />
        <SubTile
          icon={<TrendingUp className="h-4.5 w-4.5" />}
          title="Market Signals"
          summary={marketSummary}
          isActive={activeSubTile === "marketSignals"}
          onClick={() => toggleSubTile("marketSignals")}
          color="amber"
        />
      </div>

      {/* Expanded sub-tile content */}
      {activeSubTile === "techStack" && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/30 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <TechStackPanel
            techStack={scan.techStack}
            onDeepDive={() => runDeepDive("techStack")}
            isLoadingDeepDive={loadingDeepDive === "techStack"}
            deepDiveAnalysis={techDeepDive?.expandedAnalysis}
            deepDiveEvidence={techDeepDive?.additionalEvidence}
          />
        </div>
      )}

      {activeSubTile === "maturity" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <MaturityRadarPanel
            assessment={scan.maturityAssessment}
            onDeepDive={() => runDeepDive("maturity")}
            isLoadingDeepDive={loadingDeepDive === "maturity"}
            deepDiveAnalysis={maturityDeepDive?.expandedAnalysis}
            deepDiveEvidence={maturityDeepDive?.additionalEvidence}
          />
        </div>
      )}

      {activeSubTile === "marketSignals" && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
          <MarketSignalsPanel
            signals={scan.marketSignals}
            onDeepDive={() => runDeepDive("marketSignals")}
            isLoadingDeepDive={loadingDeepDive === "marketSignals"}
            deepDiveAnalysis={marketDeepDive?.expandedAnalysis}
            deepDiveEvidence={marketDeepDive?.additionalEvidence}
          />
        </div>
      )}

      {/* Methodology always visible at bottom */}
      <div className="mt-4">
        <MethodologyPanel methodology={scan.methodology} />
      </div>
    </div>
  );
}

// ── Sub-Tile Component ──

function SubTile({
  icon,
  title,
  summary,
  isActive,
  onClick,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  summary: string;
  isActive: boolean;
  onClick: () => void;
  color: "blue" | "emerald" | "amber";
}) {
  const colorMap = {
    blue: {
      active: "ring-2 ring-blue-400 border-blue-200 bg-blue-50/50",
      icon: "text-blue-600",
      hover: "hover:border-blue-200 hover:bg-blue-50/30",
    },
    emerald: {
      active: "ring-2 ring-emerald-400 border-emerald-200 bg-emerald-50/50",
      icon: "text-emerald-600",
      hover: "hover:border-emerald-200 hover:bg-emerald-50/30",
    },
    amber: {
      active: "ring-2 ring-amber-400 border-amber-200 bg-amber-50/50",
      icon: "text-amber-600",
      hover: "hover:border-amber-200 hover:bg-amber-50/30",
    },
  };

  const c = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition-all cursor-pointer ${
        isActive
          ? `${c.active} shadow-sm`
          : `border-gray-200 bg-white ${c.hover}`
      }`}
    >
      <div className={`mb-1.5 ${c.icon}`}>{icon}</div>
      <h4 className="text-xs font-semibold text-gray-800 mb-0.5">{title}</h4>
      <p className="text-[11px] text-gray-400 leading-relaxed">{summary}</p>
    </button>
  );
}
