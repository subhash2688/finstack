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
  Shield,
  Zap,
  Target,
  Layers,
  Lock,
  Sparkles,
  CheckCircle2,
  FileText,
  Users,
  Download,
} from "lucide-react";
import Link from "next/link";
import { LighthouseIcon } from "@/components/ui/lighthouse-icon";
import { PathCard } from "@/components/home/PathCard";
import { RecentEngagements } from "@/components/home/RecentEngagements";
import { getAllEngagements } from "@/lib/storage/engagements";
import { FUNCTIONS } from "@/types/function";

export default function HomePageV2() {
  const [engagementCount, setEngagementCount] = useState(0);
  const totalProcesses = FUNCTIONS.reduce(
    (sum, f) => sum + f.processes.length,
    0
  );
  const liveProcesses = FUNCTIONS.reduce(
    (sum, f) => sum + f.processes.filter((p) => p.available).length,
    0
  );

  useEffect(() => {
    setEngagementCount(getAllEngagements().length);
  }, []);

  const scrollToPlatform = () => {
    document.getElementById("platform")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00B140]" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="relative max-w-6xl mx-auto px-6">
          {/* Nav */}
          <div className="flex items-center justify-between py-5">
            <div className="flex items-center gap-3">
              <LighthouseIcon size={32} className="text-gray-900" />
              <span className="font-semibold text-gray-900 tracking-tight">Lighthouse</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/explore" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Explorer</Link>
              <Link href="/engagements" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">Engagements</Link>
            </div>
          </div>

          {/* Hero content — centered */}
          <div className="pt-16 pb-14 text-center">
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

            <h1 className="text-4xl sm:text-5xl lg:text-[56px] font-light text-gray-900 leading-[1.08] tracking-tight mb-5">
              AI-powered process intelligence
              <br />
              <span className="font-bold">for enterprise transformation.</span>
            </h1>

            <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              Lighthouse is our proprietary diagnostic platform that uses AI to map
              enterprise workflows, assess automation maturity, and match the right
              technology to the right process — giving your team a data-driven edge
              in every client engagement.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={scrollToPlatform}
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 bg-[#00B140] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#009935] hover:shadow-lg hover:shadow-[#00B140]/20 transition-all duration-300"
              >
                Launch Platform
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link
                href="/engagements/new"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 border border-gray-300 text-gray-900 font-bold text-sm uppercase tracking-wider hover:border-gray-900 transition-all duration-300"
              >
                Start Client Engagement
              </Link>
            </div>

            {/* Inline stats */}
            <div className="flex items-center justify-center gap-8 mt-12 pt-8 border-t border-gray-100">
              {[
                { value: FUNCTIONS.length, label: "Functions" },
                { value: totalProcesses, label: "Processes" },
                { value: liveProcesses, label: "Workflows" },
                { value: "60+", label: "Vendors", accent: true },
                { value: engagementCount, label: "Engagements" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className={`text-2xl font-bold ${stat.accent ? "text-[#00B140]" : "text-gray-900"}`}>{stat.value}</div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Platform Section: Path Cards + Product Preview ─── */}
      <section id="platform" className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Path Cards — left 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <PathCard
              title="Client Engagements"
              description="Run a 5-step client diagnostic: company profiling with SEC EDGAR financials, AI hypothesis, process assessment, ROI quantification, and technology recommendations — exportable as a branded deck."
              href="/engagements"
              icon={<Briefcase className="h-7 w-7" />}
              accent
            />
            <PathCard
              title="Process & Tool Explorer"
              description="Browse AI-mapped workflows across 10 business functions with step-level diagnostics, 60+ vendor profiles, ERP compatibility, and recommendations by company size and sub-industry."
              href="/explore"
              icon={<Compass className="h-7 w-7" />}
            />
          </div>

          {/* Product Preview — right 3 cols */}
          <div className="lg:col-span-3 rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl shadow-[0_0_80px_-20px_rgba(0,177,64,0.12)]">
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
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00B140]/20 text-[#00B140] font-medium flex items-center gap-1">
                <Download className="h-2.5 w-2.5" /> Export Deck
              </span>
            </div>

            <div className="p-5 space-y-4">
              {/* 5-Step Stepper */}
              <div className="flex items-center gap-0 text-[11px]">
                {["Intake", "Hypothesis", "Assessment", "Opportunities", "Technology"].map((step, i) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] ${
                      i === 3 ? "bg-[#00B140] text-white font-medium" : i < 3 ? "text-[#00B140]" : "text-gray-600"
                    }`}>
                      {i < 3 && <CheckCircle2 className="h-3 w-3" />}
                      {step}
                    </div>
                    {i < 4 && <div className={`w-5 h-px mx-0.5 ${i < 3 ? "bg-[#00B140]/40" : "bg-gray-700"}`} />}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Company Intelligence */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Company Intelligence</div>
                  <div className="space-y-1.5">
                    {[{ label: "Revenue", value: "$2.4B" }, { label: "Op. Margin", value: "18.3%" }, { label: "DSO", value: "42 days" }, { label: "Peers", value: "5 matched" }].map((item) => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">{item.label}</span>
                        <span className="text-[11px] font-medium text-gray-200">{item.value}</span>
                      </div>
                    ))}
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">SEC EDGAR</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">Derived</span>
                    </div>
                  </div>
                </div>

                {/* Maturity Assessment */}
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Maturity Assessment</div>
                  <div className="space-y-1.5">
                    {["Invoice Receipt", "3-Way Matching", "Approval Routing", "Payment Execution"].map((step, i) => (
                      <div key={step} className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">{step}</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((l) => (
                            <div key={l} className={`w-3 h-1.5 rounded-sm ${l <= [2, 3, 1, 4][i] ? "bg-[#00B140]" : "bg-gray-700"}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ROI */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">ROI Quantification</div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00B140]/20 text-[#00B140] font-medium">Editable assumptions</span>
                </div>
                <div className="flex items-end gap-6">
                  <div>
                    <div className="text-xl font-bold text-gray-100">$340K</div>
                    <div className="text-[11px] text-gray-500">annual savings</div>
                  </div>
                  <div className="flex-1 flex items-end gap-1 h-8">
                    {[35, 52, 68, 45, 72, 58, 80, 65, 90, 75].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i >= 7 ? "#00B140" : "#374151" }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Recent Engagements ─── */}
      <section className="max-w-6xl mx-auto px-6 pb-10">
        <RecentEngagements />
      </section>

      {/* ─── Engagement Flow — compact 5-step ─── */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-2 text-center">5-Step Engagement Flow</h2>
          <p className="text-sm text-gray-400 text-center mb-8 max-w-xl mx-auto">
            From company profiling to quantified impact — every insight backed by real SEC EDGAR data, AI diagnostics, and transparent calculations.
          </p>
          <div className="grid gap-4 lg:grid-cols-5">
            {[
              { step: "1", title: "Intake", desc: "Company profile, process scope, transcript upload. Public companies auto-pull EDGAR financials and peer data.", icon: <Search className="h-4 w-4" /> },
              { step: "2", title: "Hypothesis", desc: "AI diagnostic analyzing company data, transcripts, and industry context. Opportunity areas by automation leverage.", icon: <Brain className="h-4 w-4" /> },
              { step: "3", title: "Assessment", desc: "Rate each workflow step's maturity level. Auto-save with real-time downstream ROI recalculation.", icon: <Layers className="h-4 w-4" /> },
              { step: "4", title: "Opportunities", desc: "Transparent savings formulas with editable assumptions. Net ROI after tool costs with formula explainer.", icon: <TrendingUp className="h-4 w-4" /> },
              { step: "5", title: "Technology", desc: "Capability mapping, build vs buy analysis, and vendor landscape with case studies and ERP compatibility.", icon: <Target className="h-4 w-4" /> },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="w-6 h-6 rounded-full bg-[#00B140] flex items-center justify-center">
                    <span className="text-[10px] font-bold text-white">{item.step}</span>
                  </div>
                  <div className="w-5 h-5 rounded-md bg-[#00B140]/10 flex items-center justify-center text-[#00B140]">{item.icon}</div>
                </div>
                <h3 className="text-[13px] font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-[11px] text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Capabilities — dark ─── */}
      <section className="relative bg-gray-950 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(0,177,64,0.06)_0%,transparent_70%)]" />
        <div className="relative max-w-6xl mx-auto px-6 py-12">
          <h2 className="text-lg font-semibold text-white mb-2 text-center">Platform Capabilities</h2>
          <p className="text-sm text-gray-500 text-center mb-8 max-w-lg mx-auto">
            Every data point shows its source. No black boxes, no fabricated data.
          </p>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "SEC EDGAR Financials", desc: "Revenue, margins, balance sheet, derived metrics (DSO, DPO, inventory turns) from 10-K filings. 15,000+ companies via Turso.", icon: <Database className="h-4 w-4" /> },
              { title: "Peer Benchmarks", desc: "SIC code peer matching with revenue growth heat maps, P&L expense comparison, and AI-generated growth driver analysis.", icon: <Users className="h-4 w-4" /> },
              { title: "Transcript Intelligence", desc: "Upload call transcripts — AI extracts pain points per workflow step, identifies tool mentions, and feeds evidence into diagnostics.", icon: <FileText className="h-4 w-4" /> },
              { title: "Transparent ROI", desc: "Editable assumptions with instant recalculation. Every savings number shows its formula, source, and confidence range.", icon: <BarChart3 className="h-4 w-4" /> },
              { title: "Technology Landscape", desc: "Capability mapping, build vs buy analysis with ROI modeling, vendor profiles with case studies and ERP compatibility.", icon: <Target className="h-4 w-4" /> },
              { title: "Deck Export", desc: "Branded PowerPoint with customizable sections, depth toggles, and confidential watermark — one click.", icon: <Download className="h-4 w-4" /> },
            ].map((cap) => (
              <div key={cap.title} className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-gray-700 transition-colors">
                <div className="w-7 h-7 rounded-md bg-[#00B140]/20 flex items-center justify-center text-[#00B140] mb-2">{cap.icon}</div>
                <h3 className="font-semibold text-gray-100 text-[13px] mb-1">{cap.title}</h3>
                <p className="text-[11px] text-gray-400 leading-relaxed">{cap.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process Coverage ─── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-0.5">Process Coverage</h2>
            <p className="text-sm text-gray-500">{totalProcesses} processes across {FUNCTIONS.length} functions. {liveProcesses} live with step-level workflows.</p>
          </div>
          <Link href="/explore" className="text-sm text-[#00B140] font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {FUNCTIONS.map((func) => {
            const activeCount = func.processes.filter((p) => p.available).length;
            const isLive = activeCount > 0;
            return (
              <div key={func.id} className={`rounded-xl border p-3.5 transition-all duration-300 hover:-translate-y-0.5 ${isLive ? "border-[#00B140]/20 bg-[#00B140]/[0.02] hover:shadow-md" : "border-gray-100 bg-gray-50/50 opacity-70"}`}>
                <div className={`w-2 h-2 rounded-full mb-2 ${isLive ? "bg-[#00B140]" : "bg-gray-300"}`} />
                <h3 className="font-semibold text-gray-900 text-[13px] mb-0.5">{func.name}</h3>
                <p className="text-[11px] text-gray-400 mb-2">{func.description}</p>
                <div className="flex flex-wrap gap-1">
                  {func.processes.map((proc) => (
                    <span key={proc.id} className={`text-[9px] px-1.5 py-0.5 rounded ${proc.available ? "bg-[#00B140]/10 text-[#00B140] font-medium" : "bg-gray-100 text-gray-400"}`}>
                      {proc.name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="bg-gradient-to-br from-[#00B140] via-[#00B140] to-emerald-600 rounded-2xl mx-4 sm:mx-8 lg:mx-auto lg:max-w-6xl overflow-hidden">
        <div className="px-6 py-10 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Ready to start?</h2>
          <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
            Create your first engagement or explore the process knowledge base.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/engagements/new" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-[#00B140] font-bold text-sm uppercase tracking-wider hover:bg-gray-50 transition-all duration-300 shadow-lg">
              Create Engagement <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/explore" className="inline-flex items-center gap-2 px-7 py-3.5 border border-white/40 text-white font-bold text-sm uppercase tracking-wider hover:bg-white/10 transition-all duration-300">
              Browse Explorer <Compass className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 py-8 mt-12">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-xs text-gray-400">
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
