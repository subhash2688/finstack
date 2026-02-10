import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Brain,
  Sparkles,
  Shield,
  ChevronRight,
  Zap,
  Target,
  BarChart3,
  Lock,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col bg-white">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute top-0 left-0 w-2 h-full bg-[#00B140]" />

        {/* Subtle grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, #00B140 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="container mx-auto px-4 py-24 sm:py-36 pl-8 sm:pl-12 relative">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#00B140]/10 rounded-full">
                <Lock className="h-3 w-3 text-[#00B140]" />
                <span className="text-[#00B140] font-semibold text-xs tracking-wide uppercase">
                  Proprietary Platform
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <Sparkles className="h-3 w-3 text-gray-500" />
                <span className="text-gray-500 font-medium text-xs tracking-wide uppercase">
                  AI-Powered
                </span>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl font-light text-gray-900 leading-[1.1] tracking-tight">
              AI-powered process intelligence{" "}
              <span className="font-semibold">for enterprise transformation.</span>
            </h1>

            <p className="mt-8 text-xl text-gray-500 leading-relaxed max-w-2xl font-light">
              Lighthouse is our proprietary diagnostic platform that uses AI to map
              enterprise workflows, assess automation maturity, and match the right
              technology to the right process — giving your team a data-driven edge
              in every client engagement.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/ap">
                <Button
                  size="lg"
                  className="bg-[#00B140] hover:bg-[#009934] text-white font-semibold px-8 h-12 rounded-none text-sm tracking-wide uppercase"
                >
                  Launch Platform <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/engagements/new">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 h-12 rounded-none text-sm tracking-wide uppercase"
                >
                  Start Client Engagement
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 w-96 h-80 opacity-[0.05]">
          <div className="w-full h-full bg-gradient-to-tl from-[#00B140] to-transparent" />
        </div>
      </section>

      {/* AI Thesis */}
      <section className="py-20 sm:py-28 bg-gray-950 text-white relative overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#00B140]/10 blur-3xl" />

        <div className="container mx-auto px-4 relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-8">
              <Brain className="h-4 w-4 text-[#00B140]" />
              <span className="text-sm font-medium text-gray-300">
                Built on proprietary AI models
              </span>
            </div>
            <p className="text-2xl sm:text-[2.25rem] font-light leading-relaxed text-gray-200">
              Enterprise AI adoption is accelerating.
              But most organizations are{" "}
              <span className="font-semibold text-white">
                choosing tools before understanding their processes
              </span>
              . Lighthouse reverses that — using AI to diagnose operational
              gaps, score automation maturity, and surface the highest-ROI
              opportunities{" "}
              <span className="text-[#00B140] font-semibold">
                before a single vendor is evaluated
              </span>
              .
            </p>
          </div>
        </div>
      </section>

      {/* How It Works — AI angle */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#00B140] font-semibold text-sm tracking-wide uppercase mb-4">
              The AI Advantage
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-16">
              From diagnosis to recommendation{" "}
              <span className="font-semibold">in minutes, not months</span>
            </h2>

            <div className="space-y-16">
              <div className="grid grid-cols-[auto_1fr] gap-8 items-start">
                <div className="step-number">1</div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Target className="h-5 w-5 text-[#00B140]" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      AI-Mapped Process Workflows
                    </h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed max-w-2xl">
                    Our platform decomposes enterprise processes into discrete,
                    assessable steps — each enriched with AI-generated insights on
                    pain points, automation potential, and expected ROI. What used
                    to take weeks of interviews is now available instantly.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-8 items-start">
                <div className="step-number">2</div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <BarChart3 className="h-5 w-5 text-[#00B140]" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Inline Maturity Assessment
                    </h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed max-w-2xl">
                    Rate each process step as Manual, Semi-Automated, or Automated
                    — directly within the workflow explorer. The platform instantly
                    computes a maturity scorecard, identifies priority gaps, and
                    quantifies the cost of inaction.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-[auto_1fr] gap-8 items-start">
                <div className="step-number">3</div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Zap className="h-5 w-5 text-[#00B140]" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Intelligent Vendor Matching
                    </h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed max-w-2xl">
                    Every workflow step is mapped to relevant AI-native vendors
                    with capability scores, deployment profiles, and fit analysis.
                    Move from &ldquo;which tool should we buy?&rdquo; to
                    &ldquo;which tool fits this specific gap?&rdquo; — backed by data.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />

      {/* Functions — big cards with sketches */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#00B140] font-semibold text-sm tracking-wide uppercase mb-4">
              Coverage
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">
              AI diagnostics across{" "}
              <span className="font-semibold">enterprise functions</span>
            </h2>
            <p className="text-gray-500 text-lg mb-14 max-w-2xl font-light">
              Deep-dive into processes across Finance, GTM, and R&D.
              Each function is powered by domain-specific AI models trained
              on enterprise workflow patterns.
            </p>

            <div className="grid gap-8 md:grid-cols-3">
              {/* Finance — Active */}
              <Link href="/ap" className="group">
                <div className="bg-white border border-gray-200 rounded-xl p-10 h-full transition-all hover:shadow-lg hover:border-[#00B140]/30 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#00B140]" />
                  <div className="mb-6">
                    <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="text-[#00B140]">
                      <rect x="8" y="16" width="40" height="48" rx="3" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                      <line x1="16" y1="28" x2="40" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="16" y1="36" x2="36" y2="36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <line x1="16" y1="44" x2="32" y2="44" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      <circle cx="54" cy="24" r="12" stroke="currentColor" strokeWidth="1.5" />
                      <text x="49" y="29" fontSize="14" fill="currentColor" fontFamily="serif">$</text>
                      <path d="M50 52 L58 44 L62 48 L54 56 Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">Finance</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-8">
                    Accounts Payable, FP&A, and Close processes. AI-mapped
                    invoice-to-pay cycles with step-level automation scoring
                    and vendor recommendations.
                  </p>
                  <div className="flex items-center text-[#00B140] font-semibold text-sm group-hover:gap-2.5 gap-1.5 transition-all">
                    Explore AP <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>

              {/* GTM */}
              <div className="bg-white border border-gray-200 rounded-xl p-10 h-full relative overflow-hidden opacity-75">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200" />
                <div className="mb-6">
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="text-gray-300">
                    <path d="M12 56 L24 38 L36 44 L48 24 L60 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="60" cy="16" r="4" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M56 20 L60 16 L64 20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    <rect x="8" y="56" width="56" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="16" y="48" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                    <rect x="32" y="40" width="8" height="16" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                    <rect x="48" y="32" width="8" height="24" rx="1" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Go-To-Market</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  Lead generation, sales enablement, and customer success.
                  AI-driven pipeline analysis and conversion optimization.
                </p>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>

              {/* R&D */}
              <div className="bg-white border border-gray-200 rounded-xl p-10 h-full relative overflow-hidden opacity-75">
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-200" />
                <div className="mb-6">
                  <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="text-gray-300">
                    <circle cx="36" cy="28" r="16" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 2" />
                    <circle cx="36" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="36" cy="28" r="2" fill="currentColor" />
                    <rect x="32" y="46" width="8" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
                    <line x1="28" y1="62" x2="44" y2="62" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M20 20 L16 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M52 20 L56 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M36 10 L36 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">R&D</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-8">
                  Product development and engineering operations.
                  AI-assisted roadmap acceleration and deployment intelligence.
                </p>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Lighthouse — differentiators */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#00B140] font-semibold text-sm tracking-wide uppercase mb-4">
              Why Lighthouse
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-14">
              A proprietary advantage{" "}
              <span className="font-semibold">your competitors don&apos;t have</span>
            </h2>

            <div className="grid gap-8 md:grid-cols-3">
              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#00B140]/10 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-[#00B140]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  AI-Native Intelligence
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Every workflow step is enriched with AI-generated insights —
                  pain point detection, impact scoring, and before/after
                  transformation analysis. Not a spreadsheet. A diagnostic engine.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#00B140]/10 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-[#00B140]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Proprietary Methodology
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Built on domain-specific process frameworks refined across
                  engagements. Our assessment models capture the nuances that
                  generic tools miss — giving clients defensible, actionable results.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 bg-[#00B140]/10 rounded-lg flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-[#00B140]" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Instant Client Delivery
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  Walk into a client meeting with a fully mapped process assessment,
                  maturity scorecard, and vendor shortlist — generated in minutes.
                  Scale your practice without scaling your team.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#00B140] font-semibold text-sm tracking-wide uppercase mb-4">
              Built For
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-14">
              Designed for consultants who{" "}
              <span className="font-semibold">deliver transformation</span>
            </h2>

            <div className="grid gap-12 md:grid-cols-2">
              <div className="green-bar pl-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  For Engagement Teams
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Compress weeks of process discovery into a single working session.
                  Use AI-generated process maps to align stakeholders, identify
                  quick wins, and build the business case for transformation —
                  with data, not intuition.
                </p>
              </div>

              <div className="green-bar pl-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  For Practice Leaders
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Standardize your diagnostic approach across engagements.
                  Compare automation maturity across clients and industries.
                  Lighthouse gives your practice a repeatable, scalable framework
                  powered by AI — not tribal knowledge.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 bg-gray-950 text-white">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-8">
              <Lock className="h-3.5 w-3.5 text-[#00B140]" />
              <span className="text-sm font-medium text-gray-300">
                Internal use only
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-light mb-4">
              Ready to deploy AI-powered{" "}
              <span className="font-semibold">process intelligence</span>?
            </h2>
            <p className="text-gray-400 text-lg mb-10 font-light">
              Start with the process. Let AI surface the gaps. The right vendor follows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/ap">
                <Button
                  size="lg"
                  className="bg-[#00B140] hover:bg-[#009934] text-white font-semibold px-10 h-12 rounded-none text-sm tracking-wide uppercase"
                >
                  Launch Platform <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/engagements/new">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white hover:text-gray-900 px-10 h-12 rounded-none text-sm tracking-wide uppercase"
                >
                  Start Client Engagement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
