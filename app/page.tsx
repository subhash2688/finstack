"use client";

import { useState, useEffect } from "react";
import { Briefcase, Compass, ArrowRight, BarChart3, Brain, Database, Search, TrendingUp, Shield, Zap, Target, Layers, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { LighthouseIcon } from "@/components/ui/lighthouse-icon";
import { PathCard } from "@/components/home/PathCard";
import { RecentEngagements } from "@/components/home/RecentEngagements";
import { getAllEngagements } from "@/lib/storage/engagements";
import { FUNCTIONS } from "@/types/function";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Profile the Company",
    description: "Enter company details — for public companies, we auto-pull real financials, headcount, and competitive positioning from SEC EDGAR filings.",
    icon: <Search className="h-5 w-5" />,
  },
  {
    step: "02",
    title: "Map & Assess Processes",
    description: "Walk through AI-generated process workflows step-by-step. Rate maturity levels and identify where manual work, errors, and bottlenecks hide.",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    step: "03",
    title: "Generate AI Diagnostics",
    description: "Claude analyzes your assessments against industry benchmarks, producing prioritized findings with specific tool recommendations.",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    step: "04",
    title: "Quantify the ROI",
    description: "See transparent savings calculations with editable assumptions. Every number shows its formula — no black boxes, no magic numbers.",
    icon: <TrendingUp className="h-5 w-5" />,
  },
];

const CAPABILITIES = [
  {
    title: "Real Financial Data",
    description: "Revenue, margins, balance sheet, and derived metrics like DSO and DPO pulled directly from public filings. No estimates, no templates.",
    icon: <Database className="h-5 w-5" />,
  },
  {
    title: "AI-Powered Diagnostics",
    description: "Claude analyzes process maturity, identifies automation opportunities, and generates executive-ready findings with industry context.",
    icon: <Brain className="h-5 w-5" />,
  },
  {
    title: "Transparent Calculations",
    description: "Every savings estimate shows its formula, assumptions, and range. Edit any input and watch results recalculate instantly.",
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    title: "60+ Vendor Profiles",
    description: "Curated database of automation tools with fit scores, pricing tiers, ERP compatibility, and side-by-side comparison across processes.",
    icon: <Target className="h-5 w-5" />,
  },
  {
    title: "Context-Aware Intelligence",
    description: "Recommendations adapt to company size, sub-industry, and existing tech stack. A SaaS startup gets different insights than a semiconductor enterprise.",
    icon: <Zap className="h-5 w-5" />,
  },
  {
    title: "Data Source Transparency",
    description: "Every data point shows its source — SEC EDGAR, derived calculation, AI analysis, or user-provided. Nothing is hidden or fabricated.",
    icon: <Shield className="h-5 w-5" />,
  },
];

export default function HomePage() {
  const [engagementCount, setEngagementCount] = useState(0);
  const totalProcesses = FUNCTIONS.reduce((sum, f) => sum + f.processes.length, 0);
  const liveProcesses = FUNCTIONS.reduce(
    (sum, f) => sum + f.processes.filter((p) => p.available).length,
    0
  );

  useEffect(() => {
    setEngagementCount(getAllEngagements().length);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/80 to-white" />
        {/* Decorative dot grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        {/* Decorative green glow behind logo area */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,177,64,0.08)_0%,transparent_70%)]" />

        <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-10 text-center">
          <div className="flex justify-center mb-5">
            <LighthouseIcon size={56} className="text-gray-900" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-gray-900 tracking-tight mb-4">
            <span className="font-semibold">Lighthouse</span>
          </h1>
          <div className="flex justify-center mb-4">
            <span className="inline-block px-4 py-1.5 rounded-full bg-gradient-to-r from-[#00B140]/10 to-emerald-50 text-[#00B140] text-sm font-medium border border-[#00B140]/20">
              AI-powered process intelligence for enterprise transformation
            </span>
          </div>
          <p className="text-base text-gray-400 max-w-xl mx-auto">
            Assess process maturity, generate AI diagnostics, pull real financials,
            and quantify savings — all with full transparency into every number.
          </p>
        </div>

        {/* ─── Stats Strip ─── */}
        <div className="relative max-w-3xl mx-auto px-6 pb-10">
          <div className="bg-white/70 backdrop-blur-sm border border-gray-200/60 rounded-2xl shadow-sm py-5 px-8">
            <div className="flex items-center justify-center gap-6 sm:gap-10 text-sm">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{FUNCTIONS.length}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Functions</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{totalProcesses}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Processes</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-3xl font-bold text-[#00B140]">60+</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Vendors</div>
              </div>
              <div className="w-px h-8 bg-gray-200" />
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900">{engagementCount}</div>
                <div className="text-[11px] text-gray-400 uppercase tracking-wider mt-0.5">Engagements</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Product Preview + Path Cards ─── */}
      <section className="max-w-6xl mx-auto px-6 py-12 pb-10">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Path Cards — left 2 cols */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <PathCard
              title="Client Engagements"
              description="Assess a specific company's processes, generate AI diagnostics, and quantify savings with editable assumptions."
              href="/engagements"
              icon={<Briefcase className="h-7 w-7" />}
              accent
            />
            <PathCard
              title="Process & Tool Explorer"
              description="Browse AI-mapped process workflows with step-level automation diagnostics and vendor recommendations by sub-industry."
              href="/explore"
              icon={<Compass className="h-7 w-7" />}
            />
          </div>

          {/* Product preview — right 3 cols, dark theme */}
          <div className="lg:col-span-3 rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-2xl shadow-[0_0_80px_-20px_rgba(0,177,64,0.15)]">
            {/* Mock title bar */}
            <div className="px-4 py-2.5 border-b border-gray-800 bg-gray-900 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
              </div>
              <div className="flex-1 text-center text-[11px] text-gray-500 font-medium">
                Engagement — Acme Corp
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Stepper mock */}
              <div className="flex items-center gap-0 text-[11px]">
                {["Inputs", "Insights", "Assessment", "Opportunities", "Impact", "Tools"].map((step, i) => (
                  <div key={step} className="flex items-center">
                    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] ${
                      i === 3 ? "bg-[#00B140] text-white font-medium" :
                      i < 3 ? "text-[#00B140]" : "text-gray-600"
                    }`}>
                      {i < 3 && <CheckCircle2 className="h-3 w-3" />}
                      {step}
                    </div>
                    {i < 5 && <div className={`w-4 h-px mx-0.5 ${i < 3 ? "bg-[#00B140]/40" : "bg-gray-700"}`} />}
                  </div>
                ))}
              </div>

              {/* Process assessment mock */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Maturity Assessment</div>
                  <div className="space-y-1.5">
                    {["Invoice Receipt", "3-Way Matching", "Approval Routing", "Payment Execution"].map((step, i) => (
                      <div key={step} className="flex items-center justify-between">
                        <span className="text-[11px] text-gray-400">{step}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((l) => (
                            <div key={l} className={`w-3 h-1.5 rounded-sm ${
                              l <= [2,3,1,4][i] ? "bg-[#00B140]" : "bg-gray-700"
                            }`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Company Intelligence</div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">Revenue</span>
                      <span className="text-[11px] font-medium text-gray-200">$2.4B</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">DSO</span>
                      <span className="text-[11px] font-medium text-gray-200">42 days</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">DPO</span>
                      <span className="text-[11px] font-medium text-gray-200">38 days</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">SEC Filings</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 font-medium">Derived</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROI mock */}
              <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider">Savings Estimate</div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00B140]/20 text-[#00B140] font-medium">Editable assumptions</span>
                </div>
                <div className="flex items-end gap-6">
                  <div>
                    <div className="text-xl font-bold text-gray-100">$340K</div>
                    <div className="text-[11px] text-gray-500">annual savings</div>
                  </div>
                  <div className="flex-1 flex items-end gap-1 h-8">
                    {[35,52,68,45,72,58,80,65,90,75].map((h, i) => (
                      <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, backgroundColor: i >= 7 ? '#00B140' : '#374151' }} />
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

      {/* ─── How It Works — green banner (inset + rounded) ─── */}
      <section className="py-12">
        <div className="relative bg-gradient-to-br from-[#00B140] via-[#00B140] to-emerald-600 rounded-2xl mx-4 sm:mx-8 lg:mx-auto lg:max-w-6xl overflow-hidden">
          {/* Decorative geometric accent */}
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 border-2 border-white rounded-full" />
            <div className="absolute top-8 right-8 w-12 h-12 border-2 border-white rotate-45" />
          </div>
          <div className="absolute bottom-0 left-0 w-24 h-24 opacity-10">
            <div className="absolute bottom-4 left-4 w-16 h-16 border-2 border-white rounded-full" />
          </div>

          <div className="relative px-6 py-8 text-center">
            <h2 className="text-xl font-semibold text-white mb-1.5">How It Works</h2>
            <p className="text-white/70 text-sm max-w-lg mx-auto">
              From company profile to quantified ROI in four steps — every insight backed by real data.
            </p>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:-translate-y-0.5 transition-all duration-300">
                <span className="text-3xl font-bold text-[#00B140] font-mono leading-none">{item.step}</span>
                <div className="w-8 h-8 rounded-lg bg-[#00B140]/10 flex items-center justify-center text-[#00B140] mt-2 mb-2">
                  {item.icon}
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{item.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Function Coverage ─── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Process Coverage</h2>
          <p className="text-gray-500 text-sm max-w-lg mx-auto">
            {totalProcesses} processes mapped across {FUNCTIONS.length} business functions.
            {" "}{liveProcesses} live with step-level workflows, maturity assessments, and tool recommendations.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {FUNCTIONS.map((func) => {
            const activeCount = func.processes.filter((p) => p.available).length;
            const isLive = activeCount > 0;
            return (
              <div
                key={func.id}
                className={`rounded-2xl border p-4 transition-all duration-300 hover:-translate-y-0.5 ${
                  isLive
                    ? "border-[#00B140]/20 bg-[#00B140]/[0.02] hover:shadow-md hover:shadow-[#00B140]/5"
                    : "border-gray-100 bg-gray-50/50 opacity-70 hover:shadow-md"
                }`}
              >
                <div className={`w-2 h-2 rounded-full mb-2.5 ${isLive ? "bg-[#00B140]" : "bg-gray-300"}`} />
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{func.name}</h3>
                <p className="text-xs text-gray-400 mb-2.5">{func.description}</p>
                <div className="flex flex-wrap gap-1">
                  {func.processes.map((proc) => (
                    <span
                      key={proc.id}
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        proc.available
                          ? "bg-[#00B140]/10 text-[#00B140] font-medium"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {proc.name}
                    </span>
                  ))}
                </div>
                {isLive && (
                  <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                    <Link
                      href="/explore"
                      className="text-[10px] font-semibold text-[#00B140] hover:underline flex items-center gap-1"
                    >
                      Explore {func.name} <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Gradient transition into dark section ─── */}
      <div className="h-10 bg-gradient-to-b from-white to-gray-950" />

      {/* ─── Capabilities — dark section ─── */}
      <section className="relative bg-gray-950 overflow-hidden">
        {/* Decorative radial green glow at top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-[radial-gradient(ellipse_at_center,rgba(0,177,64,0.06)_0%,transparent_70%)]" />

        <div className="relative max-w-6xl mx-auto px-6 py-14">
          <div className="text-center mb-10">
            <h2 className="text-xl font-semibold text-white mb-2">Built for Transparency</h2>
            <p className="text-gray-400 text-sm max-w-lg mx-auto">
              Every insight is traceable to its source. No black boxes, no fabricated data, no magic numbers.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((cap) => (
              <div key={cap.title} className="bg-gray-900 rounded-2xl border border-gray-800 p-5 hover:border-gray-700 hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-9 h-9 rounded-lg bg-[#00B140]/20 flex items-center justify-center text-[#00B140] mb-3">
                  {cap.icon}
                </div>
                <h3 className="font-semibold text-gray-100 text-sm mb-1.5">{cap.title}</h3>
                <p className="text-xs text-gray-400 leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative overflow-hidden">
        {/* Decorative radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,177,64,0.05)_0%,transparent_70%)]" />

        <div className="relative max-w-3xl mx-auto px-6 py-14 text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Ready to start?</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Create your first engagement to assess a company, or explore the process knowledge base.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/engagements/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#00B140] text-white font-semibold text-sm hover:bg-[#009935] hover:shadow-lg hover:shadow-[#00B140]/25 transition-all duration-300 shadow-sm"
            >
              Create Engagement <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-200 text-gray-700 font-semibold text-sm hover:border-[#00B140]/40 hover:text-[#00B140] transition-all duration-300"
            >
              Browse Explorer <Compass className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 py-10">
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
