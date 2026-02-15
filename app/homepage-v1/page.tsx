"use client";

import { useState, useEffect } from "react";
import {
  Briefcase,
  Compass,
  ArrowRight,
  BarChart3,
  Brain,
  Database,
  Search,
  TrendingUp,
  Target,
  Layers,
  Lock,
  Sparkles,
  CheckCircle2,
  FileText,
  Users,
  Download,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { LighthouseIcon } from "@/components/ui/lighthouse-icon";
import { getAllEngagements } from "@/lib/storage/engagements";
import { Engagement } from "@/types/engagement";
import { FUNCTIONS } from "@/types/function";

// Deterministic color from company name for monogram
const MONOGRAM_COLORS = [
  { bg: "bg-blue-600", text: "text-white" },
  { bg: "bg-emerald-600", text: "text-white" },
  { bg: "bg-violet-600", text: "text-white" },
  { bg: "bg-amber-500", text: "text-white" },
  { bg: "bg-rose-600", text: "text-white" },
  { bg: "bg-cyan-600", text: "text-white" },
  { bg: "bg-indigo-600", text: "text-white" },
  { bg: "bg-orange-500", text: "text-white" },
];

function getMonogramColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return MONOGRAM_COLORS[Math.abs(hash) % MONOGRAM_COLORS.length];
}

function getMonogramText(eng: Engagement) {
  if (eng.clientContext.tickerSymbol) {
    return eng.clientContext.tickerSymbol.slice(0, 4);
  }
  const name = eng.clientContext.companyName;
  const words = name.split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export default function HomePageV1() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);
  const [showAllEngagements, setShowAllEngagements] = useState(false);
  const totalProcesses = FUNCTIONS.reduce(
    (sum, f) => sum + f.processes.length,
    0
  );
  const liveProcesses = FUNCTIONS.reduce(
    (sum, f) => sum + f.processes.filter((p) => p.available).length,
    0
  );

  useEffect(() => {
    const all = getAllEngagements();
    const sorted = all.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    setEngagements(sorted);
  }, []);

  const visibleEngagements = engagements.slice(0, 4);
  const hasMore = engagements.length > 4;

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Header ─── */}
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LighthouseIcon size={44} className="text-gray-900" />
          <span className="text-3xl font-bold text-gray-900 tracking-tight">
            Lighthouse
          </span>
        </div>
        <div className="flex items-center gap-5">
          <Link
            href="/explore"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Explorer
          </Link>
          <Link
            href="/engagements"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Engagements
          </Link>
        </div>
      </div>

      {/* ─── Hero — Centered, full-screen feel ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00B140]" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/60 to-white" />
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "radial-gradient(circle, #000 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-8 pt-12 pb-8 text-center">
          {/* Badges */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#00B140]/30 bg-[#00B140]/5 text-[#00B140] text-xs font-semibold uppercase tracking-wider">
              <Lock className="h-3 w-3" />
              Proprietary Platform
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 text-gray-500 text-xs font-medium uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-light text-gray-900 leading-[1.12] tracking-tight mb-5">
            AI-powered process intelligence
            <br />
            <span className="font-bold">for enterprise transformation.</span>
          </h1>

          {/* Body */}
          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Lighthouse is our proprietary diagnostic platform that uses AI to
            map enterprise workflows, assess automation maturity, and match the
            right technology to the right process — giving your team a
            data-driven edge in every client engagement.
          </p>

          {/* Two action tiles — compact, inline */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/engagements"
              className="group inline-flex items-center gap-3 px-7 py-4 bg-[#00B140] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#009935] hover:shadow-lg hover:shadow-[#00B140]/20 transition-all duration-300"
            >
              <Briefcase className="h-4 w-4" />
              Client Engagements
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/explore"
              className="group inline-flex items-center gap-3 px-7 py-4 border border-gray-300 text-gray-900 font-bold text-sm uppercase tracking-wider hover:border-gray-900 transition-all duration-300"
            >
              <Compass className="h-4 w-4" />
              Process & Tool Explorer
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Recent Engagements — inline, compact */}
          {engagements.length > 0 && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-3">
                <h3 className="text-[11px] font-semibold text-gray-400 tracking-wider uppercase">
                  Recent Engagements
                </h3>
                {hasMore && (
                  <span className="text-[10px] text-gray-300">
                    · {engagements.length} total
                  </span>
                )}
              </div>

              <div className="grid grid-cols-4 gap-3">
                {/* Up to 4 engagement cards */}
                {visibleEngagements.map((eng) => {
                  const color = getMonogramColor(
                    eng.clientContext.companyName
                  );
                  const monogram = getMonogramText(eng);
                  const processCount =
                    eng.processAssessments?.length || 0;

                  return (
                    <Link
                      key={eng.id}
                      href={`/engagements/${eng.id}`}
                      className="group block"
                    >
                      <div className="border border-gray-200 rounded-lg px-3 py-2.5 hover:border-[#00B140]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 bg-white">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={`w-9 h-9 rounded-lg ${color.bg} ${color.text} flex items-center justify-center shrink-0 text-[10px] font-bold tracking-tight shadow-sm`}
                          >
                            {monogram}
                          </div>
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-semibold text-[13px] text-gray-900 truncate group-hover:text-[#00B140] transition-colors">
                              {eng.clientContext.companyName}
                            </div>
                            <div className="text-[10px] text-gray-400 truncate">
                              {processCount}{" "}
                              {processCount === 1
                                ? "process"
                                : "processes"}
                              {eng.clientContext.subSector &&
                                ` · ${eng.clientContext.subSector}`}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}

                {/* Empty slots for 4-wide grid */}
                {visibleEngagements.length < 4 &&
                  Array.from(
                    { length: 4 - visibleEngagements.length },
                    (_, i) => (
                      <Link
                        key={`empty-${i}`}
                        href="/engagements/new"
                        className="group block"
                      >
                        <div className="border border-dashed border-gray-200 rounded-lg px-3 py-2.5 hover:border-[#00B140]/30 hover:bg-[#00B140]/[0.02] transition-all duration-300 flex items-center justify-center h-full min-h-[54px]">
                          <span className="text-[11px] text-gray-300 group-hover:text-[#00B140] transition-colors font-medium">
                            + New
                          </span>
                        </div>
                      </Link>
                    )
                  )}
              </div>

              {/* Select more */}
              {hasMore && (
                <div className="mt-3">
                  <button
                    onClick={() =>
                      setShowAllEngagements(!showAllEngagements)
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
                  >
                    Select Engagement
                    <ChevronDown
                      className={`h-3 w-3 transition-transform ${showAllEngagements ? "rotate-180" : ""}`}
                    />
                  </button>
                </div>
              )}

              {hasMore && showAllEngagements && (
                <div className="mt-2 border border-gray-200 rounded-lg bg-white divide-y divide-gray-100 max-h-48 overflow-y-auto shadow-sm text-left max-w-md mx-auto">
                  {engagements.slice(4).map((eng) => {
                    const color = getMonogramColor(
                      eng.clientContext.companyName
                    );
                    const monogram = getMonogramText(eng);
                    const processCount =
                      eng.processAssessments?.length || 0;

                    return (
                      <Link
                        key={eng.id}
                        href={`/engagements/${eng.id}`}
                        className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className={`w-7 h-7 rounded-md ${color.bg} ${color.text} flex items-center justify-center shrink-0 text-[9px] font-bold`}
                        >
                          {monogram}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {eng.clientContext.companyName}
                          </div>
                          <div className="text-[10px] text-gray-400">
                            {processCount}{" "}
                            {processCount === 1
                              ? "process"
                              : "processes"}
                          </div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-gray-300" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      <div className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            {[
              { value: FUNCTIONS.length, label: "Functions" },
              { value: totalProcesses, label: "Processes" },
              { value: liveProcesses, label: "Live Workflows" },
              { value: "60+", label: "Vendors", accent: true },
              { value: engagements.length, label: "Engagements" },
            ].map((stat, i) => (
              <div key={i} className="text-center flex-1">
                <div
                  className={`text-2xl font-bold ${stat.accent ? "text-[#00B140]" : "text-gray-900"}`}
                >
                  {stat.value}
                </div>
                <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Product Mockup ─── */}
      <section className="bg-white">
        <div className="max-w-5xl mx-auto px-8 py-12">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Platform Preview
            </h2>
            <p className="text-sm text-gray-400">
              Every engagement flows through five steps — from intake to
              exportable deliverables.
            </p>
          </div>

          <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl shadow-[0_0_80px_-20px_rgba(0,177,64,0.12)] max-w-4xl mx-auto">
            {/* Title bar */}
            <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 text-center text-[11px] text-gray-500 font-medium">
                Engagement — Acme Corp
              </div>
              <span className="text-[9px] px-2 py-1 rounded bg-[#00B140]/20 text-[#00B140] font-medium flex items-center gap-1">
                <Download className="h-2.5 w-2.5" /> Export Deck
              </span>
            </div>

            <div className="p-5 space-y-3.5">
              {/* 5-Step Stepper */}
              <div className="flex items-center justify-between px-2">
                {[
                  "Intake",
                  "Hypothesis",
                  "Assessment",
                  "Opportunities",
                  "Technology",
                ].map((label, i) => (
                  <div key={label} className="flex items-center">
                    <div
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] ${
                        i === 1
                          ? "bg-[#00B140] text-white font-medium"
                          : i < 1
                          ? "text-[#00B140]"
                          : "text-gray-500"
                      }`}
                    >
                      {i < 1 && <CheckCircle2 className="h-3 w-3" />}
                      {i === 1 && (
                        <span className="w-3 h-3 rounded-full border-2 border-white/60 inline-block" />
                      )}
                      {label}
                    </div>
                    {i < 4 && (
                      <div
                        className={`w-6 h-px mx-1 ${i < 1 ? "bg-[#00B140]/40" : "bg-gray-700"}`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* 3-column panels */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
                    Company Brief
                  </div>
                  <div className="space-y-1.5">
                    {[
                      { label: "Revenue", value: "$2.4B" },
                      { label: "Op. Margin", value: "18.3%" },
                      { label: "Employees", value: "~5,200" },
                      { label: "SIC Peers", value: "5 matched" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[11px] text-gray-500">
                          {item.label}
                        </span>
                        <span className="text-[11px] font-medium text-gray-200">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">
                      SEC EDGAR
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">
                      Turso
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
                    AI Hypothesis
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00B140]" />
                      <span className="text-[11px] text-gray-300">
                        High leverage: AP automation
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#00B140]" />
                      <span className="text-[11px] text-gray-300">
                        Human-in-loop: Approvals
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      <span className="text-[11px] text-gray-300">
                        Human-led: Exception mgmt
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-1">
                    <FileText className="h-2.5 w-2.5 text-gray-500" />
                    <span className="text-[9px] text-gray-500">
                      2 transcripts · EDGAR-enriched
                    </span>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
                    Maturity Assessment
                  </div>
                  <div className="space-y-1.5">
                    {[
                      "Invoice Receipt",
                      "3-Way Matching",
                      "Approval Routing",
                      "Payment Exec.",
                    ].map((step, i) => (
                      <div
                        key={step}
                        className="flex items-center justify-between"
                      >
                        <span className="text-[11px] text-gray-500">
                          {step}
                        </span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((l) => (
                            <div
                              key={l}
                              className={`w-3 h-1.5 rounded-sm ${l <= [2, 4, 1, 3][i] ? "bg-[#00B140]" : "bg-gray-700"}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider font-medium">
                      Opportunities
                    </div>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-[#00B140]/20 text-[#00B140] font-medium">
                      Editable
                    </span>
                  </div>
                  <div className="flex items-end gap-5">
                    <div>
                      <div className="text-xl font-bold text-gray-100">
                        $340K
                      </div>
                      <div className="text-[10px] text-gray-500">
                        annual savings
                      </div>
                    </div>
                    <div className="flex-1 flex items-end gap-0.5 h-8">
                      {[35, 52, 68, 45, 72, 58, 80, 65, 90, 75].map(
                        (h, i) => (
                          <div
                            key={i}
                            className="flex-1 rounded-t"
                            style={{
                              height: `${h}%`,
                              backgroundColor:
                                i >= 7 ? "#00B140" : "#374151",
                            }}
                          />
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2 font-medium">
                    Technology & Peer Benchmarks
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <div className="text-[9px] text-gray-600 uppercase">
                        Top Vendors
                      </div>
                      {["Coupa", "SAP Ariba", "Tipalti"].map((v) => (
                        <div
                          key={v}
                          className="flex items-center gap-1.5 text-[10px]"
                        >
                          <div className="w-1 h-1 rounded-full bg-[#00B140]" />
                          <span className="text-gray-300">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] text-gray-600 uppercase">
                        P&L Benchmark
                      </div>
                      {[
                        { label: "COGS%", val: "19%", bar: 19 },
                        { label: "S&M%", val: "28%", bar: 28 },
                        { label: "R&D%", val: "43%", bar: 43 },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-center gap-1.5"
                        >
                          <span className="text-[9px] text-gray-500 w-8">
                            {row.label}
                          </span>
                          <div className="flex-1 bg-gray-800 rounded-sm h-1.5">
                            <div
                              className="bg-[#00B140] h-full rounded-sm"
                              style={{ width: `${row.bar * 1.8}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-gray-400 w-6 text-right">
                            {row.val}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="border-t border-gray-100 bg-gray-50/50 py-12">
        <div className="max-w-6xl mx-auto px-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-7 text-center">
            How It Works
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                step: "01",
                title: "Profile the Company",
                desc: "Search by ticker to auto-pull SEC EDGAR financials, peer benchmarks, and executive team. Upload call transcripts for AI extraction.",
                icon: <Search className="h-4 w-4" />,
              },
              {
                step: "02",
                title: "Generate AI Hypothesis",
                desc: "Claude analyzes company data, transcripts, and industry context to produce a diagnostic with prioritized opportunity areas.",
                icon: <Brain className="h-4 w-4" />,
              },
              {
                step: "03",
                title: "Assess Process Maturity",
                desc: "Walk through AI-generated workflows step-by-step. Rate maturity levels with real-time downstream ROI recalculation.",
                icon: <Layers className="h-4 w-4" />,
              },
              {
                step: "04",
                title: "Quantify & Recommend",
                desc: "Transparent savings formulas with editable assumptions, vendor comparison, and export as a branded PowerPoint deck.",
                icon: <TrendingUp className="h-4 w-4" />,
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl font-bold text-[#00B140] font-mono">
                    {item.step}
                  </span>
                  <div className="w-6 h-6 rounded-md bg-[#00B140]/10 flex items-center justify-center text-[#00B140]">
                    {item.icon}
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Capabilities — dark ─── */}
      <section className="relative bg-gray-950 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(0,177,64,0.06)_0%,transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-8 py-12">
          <h2 className="text-lg font-semibold text-white mb-7 text-center">
            Built for Transparency
          </h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "SEC EDGAR Financials",
                desc: "Revenue, margins, balance sheet, and derived metrics from 10-K filings. 15,000+ public companies indexed via Turso.",
                icon: <Database className="h-4 w-4" />,
              },
              {
                title: "Peer Benchmarks",
                desc: "SIC code peer matching with revenue growth heat maps, P&L expense comparison, and AI growth driver analysis.",
                icon: <Users className="h-4 w-4" />,
              },
              {
                title: "Transcript Intelligence",
                desc: "Upload call transcripts — AI extracts pain points per workflow step and feeds evidence into the diagnostic.",
                icon: <FileText className="h-4 w-4" />,
              },
              {
                title: "Transparent ROI",
                desc: "Editable assumptions with instant recalculation. Every savings number shows its formula and source.",
                icon: <BarChart3 className="h-4 w-4" />,
              },
              {
                title: "Technology Landscape",
                desc: "Capability mapping, build vs buy analysis, and vendor landscape with case studies and ERP compatibility.",
                icon: <Target className="h-4 w-4" />,
              },
              {
                title: "Deck Export",
                desc: "Branded PowerPoint with customizable sections and depth toggles — one click.",
                icon: <Download className="h-4 w-4" />,
              },
            ].map((cap) => (
              <div
                key={cap.title}
                className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-[#00B140]/20 flex items-center justify-center text-[#00B140] mb-2.5">
                  {cap.icon}
                </div>
                <h3 className="font-semibold text-gray-100 text-sm mb-1">
                  {cap.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process Coverage ─── */}
      <section className="max-w-6xl mx-auto px-8 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-0.5">
              Process Coverage
            </h2>
            <p className="text-sm text-gray-500">
              {totalProcesses} processes across {FUNCTIONS.length} functions.{" "}
              {liveProcesses} live with step-level workflows.
            </p>
          </div>
          <Link
            href="/explore"
            className="text-sm text-[#00B140] font-medium hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {FUNCTIONS.map((func) => {
            const activeCount = func.processes.filter(
              (p) => p.available
            ).length;
            const isLive = activeCount > 0;
            return (
              <div
                key={func.id}
                className={`rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5 ${isLive ? "border-[#00B140]/20 bg-[#00B140]/[0.02] hover:shadow-md" : "border-gray-100 bg-gray-50/50 opacity-70"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full mb-2 ${isLive ? "bg-[#00B140]" : "bg-gray-300"}`}
                />
                <h3 className="font-semibold text-gray-900 text-[13px] mb-0.5">
                  {func.name}
                </h3>
                <p className="text-[11px] text-gray-400 mb-2">
                  {func.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {func.processes.map((proc) => (
                    <span
                      key={proc.id}
                      className={`text-[9px] px-1.5 py-0.5 rounded ${proc.available ? "bg-[#00B140]/10 text-[#00B140] font-medium" : "bg-gray-100 text-gray-400"}`}
                    >
                      {proc.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <LighthouseIcon size={18} className="text-gray-400" />
            <span>Lighthouse</span>
          </div>
          <span>AI-powered process intelligence</span>
        </div>
      </footer>
    </div>
  );
}
