"use client";

import { useState, useEffect, useRef } from "react";
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

// Guess a company's domain from its name for logo lookup
function guessDomain(companyName: string): string {
  const stripped = companyName
    .replace(/\b(Inc\.?|Corp\.?|Ltd\.?|LLC|Holdings|Technologies|Technology|Group|Co\.?|Company|Platforms|Software|Systems|Networks|Solutions)\b/gi, "")
    .trim()
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
  return `${stripped}.com`;
}

// Logo sources in priority order — try each, fall back on error
const LOGO_SOURCES = [
  (domain: string) => `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`,
  (domain: string) => `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
];

// Company logo: tries multiple sources, falls back to monogram
function CompanyLogo({
  companyName,
  monogram,
  colorBg,
  colorText,
  size = 36,
}: {
  companyName: string;
  monogram: string;
  colorBg: string;
  colorText: string;
  size?: number;
}) {
  const [sourceIdx, setSourceIdx] = useState(0);
  const domain = guessDomain(companyName);
  const exhausted = sourceIdx >= LOGO_SOURCES.length;

  if (exhausted) {
    return (
      <div
        className={`rounded-lg ${colorBg} ${colorText} flex items-center justify-center shrink-0 text-[10px] font-bold tracking-tight shadow-sm`}
        style={{ width: size, height: size }}
      >
        {monogram}
      </div>
    );
  }

  return (
    <div
      className="rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm"
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-line */}
      <img
        src={LOGO_SOURCES[sourceIdx](domain)}
        alt={companyName}
        width={size - 4}
        height={size - 4}
        className="object-contain"
        onError={() => setSourceIdx((prev) => prev + 1)}
      />
    </div>
  );
}

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

// ─── Scroll-triggered reveal component ───
function Reveal({
  children,
  className = "",
  animation = "scroll-reveal",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  animation?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => el.classList.add("revealed"), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={`${animation} ${className}`}>
      {children}
    </div>
  );
}

export default function HomePage() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);

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

  const hasMore = engagements.length > 4;

  return (
    <div className="min-h-screen bg-white">
      {/* ─── Header ─── */}
      <div className="max-w-[1440px] mx-auto px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LighthouseIcon size={48} className="text-gray-900" />
          <span className="text-3xl font-bold text-gray-900 tracking-tight">
            Lighthouse
          </span>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/explore"
            className="text-base text-gray-500 hover:text-gray-900 transition-colors"
          >
            Explorer
          </Link>
          <Link
            href="/engagements"
            className="text-base text-gray-500 hover:text-gray-900 transition-colors"
          >
            Engagements
          </Link>
        </div>
      </div>

      {/* ─── Hero — Centered, full-screen feel ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#00B140]" />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-50/60 to-white" />
        <div className="absolute inset-0 animated-grid" />
        <div className="shimmer-line" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="relative max-w-[1440px] mx-auto px-8 pt-10 pb-8">
          {/* ── Two-column hero ── */}
          <div className="flex flex-col lg:flex-row items-start gap-10">
            {/* Left column — headline, sub, CTAs */}
            <div className="flex-1 min-w-0">
              <h1 className="hero-animate hero-animate-d1 text-4xl sm:text-[44px] lg:text-[48px] font-bold text-gray-900 leading-[1.12] tracking-tight mb-4">
                The intelligence layer
                <br />
                <span className="text-[#00B140]">for enterprise transformation.</span>
              </h1>

              <p className="hero-animate hero-animate-d2 text-base text-gray-500 max-w-lg mb-6 leading-relaxed">
                Lighthouse integrates peer benchmarks, financial signals, and
                capability mapping to identify where AI drives the highest-return
                enterprise transformations.
              </p>

              <div className="hero-animate hero-animate-d3 flex flex-col sm:flex-row items-start gap-3 mb-5">
                <Link
                  href="/engagements/new"
                  className="group inline-flex items-center gap-3 px-7 py-3.5 bg-[#00B140] text-white font-bold text-sm tracking-wide rounded-lg shadow-md shadow-[#00B140]/15 hover:bg-[#009935] hover:shadow-lg hover:shadow-[#00B140]/25 transition-all duration-300"
                >
                  Run a Transformation Assessment
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link
                  href="/explore"
                  className="group inline-flex items-center gap-3 px-7 py-3.5 bg-gray-900 text-white font-bold text-sm tracking-wide rounded-lg hover:bg-gray-800 hover:shadow-lg transition-all duration-300"
                >
                  Explore the Platform
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <p className="hero-animate hero-animate-d4 text-[12px] text-gray-400 mb-4">
                Built for transformation teams · Deployed in client engagements · Designed to scale
              </p>

              {/* Live signal strip */}
              <div className="hero-animate hero-animate-d5 inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#00B140]/5 border border-[#00B140]/20">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="live-dot absolute inset-0 rounded-full bg-[#00B140]" />
                  <span className="relative rounded-full h-2.5 w-2.5 bg-[#00B140]" />
                </span>
                <span className="text-[13px] font-semibold text-[#00B140]">
                  Used in live enterprise engagements
                </span>
              </div>
            </div>

            {/* Right column — proof points */}
            <div className="lg:w-[380px] shrink-0 space-y-2.5">
              {[
                {
                  title: "Diagnose",
                  desc: "Identify value leakage across mission-critical workflows",
                },
                {
                  title: "Benchmark",
                  desc: "Compare performance against public peers and industry leaders",
                },
                {
                  title: "Quantify",
                  desc: "Model ROI with transparent, defensible assumptions",
                },
                {
                  title: "Deploy",
                  desc: "Generate deployment-ready transformation roadmaps",
                },
              ].map((point, i) => (
                <div
                  key={point.title}
                  className="hero-animate-right flex items-start gap-3 px-4 py-3 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md hover:border-[#00B140]/20 transition-all duration-200"
                  style={{ animationDelay: `${0.3 + i * 0.15}s` }}
                >
                  <div className="h-8 w-8 rounded-md bg-[#00B140]/10 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="h-4 w-4 text-[#00B140]" />
                  </div>
                  <div>
                    <span className="font-semibold text-gray-900 text-[13px]">
                      {point.title}
                    </span>
                    <span className="text-[13px] text-gray-500 ml-1.5">
                      — {point.desc}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Engagements */}
          {engagements.length > 0 && (
            <div className="mt-8 text-left">
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-[11px] font-semibold text-gray-400 tracking-[0.12em] uppercase">
                  Recent Engagements
                </h3>
                {hasMore && (
                  <span className="text-[10px] text-gray-300">
                    · {engagements.length} total
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {engagements.slice(0, 4).map((eng) => {
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
                      className="group block w-[260px]"
                    >
                      <div className="border border-gray-200 rounded-xl px-5 py-4 hover:border-[#00B140]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 bg-white">
                        <div className="flex items-center gap-4">
                          <CompanyLogo
                            companyName={eng.clientContext.companyName}
                            monogram={monogram}
                            colorBg={color.bg}
                            colorText={color.text}
                            size={48}
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <div className="font-semibold text-base text-gray-900 truncate group-hover:text-[#00B140] transition-colors">
                              {eng.clientContext.companyName}
                            </div>
                            <div className="text-[13px] text-gray-400 truncate">
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

                {hasMore && (
                  <Link href="/engagements" className="group block w-[260px]">
                    <div className="border border-gray-200 rounded-xl px-5 py-4 hover:border-[#00B140]/40 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 bg-gray-50 flex items-center justify-center h-full min-h-[72px] gap-2">
                      <span className="text-sm text-gray-500 group-hover:text-[#00B140] transition-colors font-semibold">
                        View all {engagements.length} engagements
                      </span>
                      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#00B140] group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      <div className="border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            {[
              { value: FUNCTIONS.length, label: "Functions" },
              { value: totalProcesses, label: "Processes" },
              { value: liveProcesses, label: "Live Workflows" },
              { value: "60+", label: "Vendors", accent: true },
              { value: engagements.length, label: "Engagements" },
            ].map((stat, i) => (
              <Reveal key={i} animation="scroll-reveal-pop" delay={i * 100} className="text-center flex-1">
                <div
                  className={`text-3xl font-bold ${stat.accent ? "text-[#00B140]" : "text-gray-900"}`}
                >
                  {stat.value}
                </div>
                <div className="text-xs text-gray-400 uppercase tracking-wider mt-1">
                  {stat.label}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Page 2: Structured Intelligence Cycle ─── */}
      <section className="relative bg-gray-950 overflow-hidden py-16">
        <div className="absolute inset-0 animated-grid-dark" />
        <div className="shimmer-line" />
        <div className="orb orb-dark-1" />
        <div className="orb orb-dark-2" />
        <div className="orb orb-dark-3" />

        <div className="relative max-w-[1440px] mx-auto px-8">
          {/* Section header */}
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-3">
              A Structured Intelligence Cycle
            </h2>
            <p className="text-base text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Every engagement flows through a defensible five-step transformation
              framework — from intake to board-ready output.
            </p>
          </Reveal>

          {/* Five-step framework */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-0 mb-12">
            {[
              {
                step: "01",
                title: "Profile the Enterprise",
                desc: "Ingest financials, transcripts, operating metrics, and structural signals.",
                icon: <Search className="h-5 w-5" />,
              },
              {
                step: "02",
                title: "Generate AI Hypotheses",
                desc: "Surface high-leverage automation and structural redesign opportunities.",
                icon: <Brain className="h-5 w-5" />,
              },
              {
                step: "03",
                title: "Assess Process Maturity",
                desc: "Evaluate workflows step-by-step with benchmark-backed scoring.",
                icon: <Layers className="h-5 w-5" />,
              },
              {
                step: "04",
                title: "Quantify & Prioritize",
                desc: "Model savings, risk reduction, and productivity gains with transparent formulas.",
                icon: <BarChart3 className="h-5 w-5" />,
              },
              {
                step: "05",
                title: "Deploy Technology Pathways",
                desc: "Map vendors, integration paths, and rollout sequencing.",
                icon: <Target className="h-5 w-5" />,
              },
            ].map((item, i) => (
              <Reveal key={item.step} delay={200 + i * 150} className="relative flex flex-col items-center text-center px-4 py-6 group">
                {/* Connector line */}
                {i < 4 && (
                  <Reveal animation="connector-grow" delay={400 + i * 150} className="hidden md:block absolute top-[52px] left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-gradient-to-r from-[#00B140]/40 to-[#00B140]/10 z-0"><span /></Reveal>
                )}

                {/* Step number + icon */}
                <div className="relative z-10 mb-4">
                  <div className="h-14 w-14 rounded-2xl bg-[#00B140]/10 border border-[#00B140]/20 flex items-center justify-center text-[#00B140] group-hover:bg-[#00B140]/20 transition-colors">
                    {item.icon}
                  </div>
                  <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#00B140] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.step}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-white mb-1.5">
                  {item.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
                  {item.desc}
                </p>
              </Reveal>
            ))}
          </div>

          {/* Framing line + platform screenshot teaser */}
          <Reveal className="text-center" delay={900}>
            <p className="text-sm text-gray-500 italic mb-6">
              From raw enterprise signals to defensible transformation strategy — fully traceable.
            </p>
            <Link
              href="/engagements/new"
              className="group inline-flex items-center gap-2 px-6 py-3 bg-[#00B140] text-white font-semibold text-sm rounded-lg hover:bg-[#009935] hover:shadow-lg hover:shadow-[#00B140]/25 transition-all duration-300"
            >
              See it in action
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ─── Page 3: Intelligence Infrastructure ─── */}
      <section className="relative border-t border-gray-100 bg-white overflow-hidden py-16">
        <div className="absolute inset-0 animated-grid" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="relative max-w-[1440px] mx-auto px-8">
          {/* Section header */}
          <Reveal className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-3">
              Enterprise-Grade Intelligence Infrastructure
            </h2>
            <p className="text-base text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Every recommendation is benchmarked, evidence-backed, and deployment-ready.
            </p>
          </Reveal>

          {/* Six capability blocks */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
            {[
              {
                title: "SEC Financial Intelligence",
                desc: "Indexed 10-K and financial statement data across 15,000+ public companies.",
                icon: <Database className="h-5 w-5" />,
              },
              {
                title: "Peer Benchmarking Engine",
                desc: "Compare cost structures, margins, and growth drivers in real time.",
                icon: <Users className="h-5 w-5" />,
              },
              {
                title: "Transcript & Signal Intelligence",
                desc: "Extract operational friction and strategic priorities directly from executive commentary.",
                icon: <FileText className="h-5 w-5" />,
              },
              {
                title: "Transparent ROI Modeling",
                desc: "Every savings number is traceable to its assumptions and source.",
                icon: <BarChart3 className="h-5 w-5" />,
              },
              {
                title: "Technology & Vendor Landscape",
                desc: "Map capability gaps to best-fit solutions with ERP compatibility insights.",
                icon: <Target className="h-5 w-5" />,
              },
              {
                title: "Engagement-Ready Export",
                desc: "Generate branded, partner-ready decks in one click.",
                icon: <Download className="h-5 w-5" />,
              },
            ].map((cap, i) => (
              <Reveal
                key={cap.title}
                animation="scroll-reveal-scale"
                delay={i * 100}
                className="group rounded-xl border border-gray-200 bg-gray-50/50 p-6 hover:border-[#00B140]/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="h-10 w-10 rounded-lg bg-[#00B140]/10 flex items-center justify-center text-[#00B140] shrink-0 group-hover:bg-[#00B140]/15 transition-colors">
                    {cap.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-[15px] mb-1">
                      {cap.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {cap.desc}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Process Coverage ─── */}
      <section className="max-w-7xl mx-auto px-8 py-12">
        <Reveal className="flex items-center justify-between mb-6">
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
        </Reveal>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {FUNCTIONS.map((func, fi) => {
            const activeCount = func.processes.filter(
              (p) => p.available
            ).length;
            const isLive = activeCount > 0;
            return (
              <Reveal
                key={func.id}
                animation="scroll-reveal-scale"
                delay={fi * 80}
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
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between text-xs text-gray-400">
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
