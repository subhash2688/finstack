import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  DollarSign,
  TrendingUp,
  Microscope,
  Search,
  GitCompareArrows,
  Layers,
  ChevronRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col bg-white">
      {/* Hero — AlixPartners editorial style */}
      <section className="relative overflow-hidden">
        {/* Green accent block — top left decorative */}
        <div className="absolute top-0 left-0 w-2 h-full bg-[#00B140]" />

        <div className="container mx-auto px-4 py-24 sm:py-32 pl-8 sm:pl-12">
          <div className="max-w-4xl">
            {/* Small label */}
            <p className="text-[#00B140] font-semibold text-sm tracking-wide uppercase mb-6">
              Enterprise Technology Advisory
            </p>

            {/* Editorial headline — light weight, large */}
            <h1 className="text-4xl sm:text-6xl font-light text-gray-900 leading-[1.15] tracking-tight">
              Before you evaluate vendors,{" "}
              <span className="font-semibold">understand your process.</span>
            </h1>

            <p className="mt-8 text-xl text-gray-500 leading-relaxed max-w-2xl font-light">
              The first step of any technology transformation is diagnosing the
              challenges in your current workflows. Lighthouse maps AI-native
              solutions to the processes that matter — so you invest with clarity,
              not assumptions.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link href="/ap">
                <Button
                  size="lg"
                  className="bg-[#00B140] hover:bg-[#009934] text-white font-semibold px-8 h-12 rounded-none text-sm tracking-wide uppercase"
                >
                  Explore Processes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/engagements/new">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-8 h-12 rounded-none text-sm tracking-wide uppercase"
                >
                  New Client Engagement
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative green gradient shape — bottom right */}
        <div className="absolute bottom-0 right-0 w-80 h-64 opacity-[0.07]">
          <div className="w-full h-full bg-gradient-to-tl from-[#00B140] to-transparent" />
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Core thesis — big editorial statement */}
      <section className="py-20 sm:py-28 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <p className="text-2xl sm:text-[2rem] font-light text-gray-700 leading-relaxed">
              As AI reshapes enterprise software, organizations face an unprecedented challenge:{" "}
              <span className="font-semibold text-gray-900">
                hundreds of vendors, evolving capabilities, and no clear framework
                for evaluation.
              </span>{" "}
              Lighthouse provides the structure — starting with your processes,
              not the market&apos;s pitch.
            </p>
          </div>
        </div>
      </section>

      {/* What this tool does — numbered steps, AlixPartners style */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#00B140] font-semibold text-sm tracking-wide uppercase mb-4">
              How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-16">
              From process diagnosis to{" "}
              <span className="font-semibold">vendor selection</span>
            </h2>

            <div className="space-y-16">
              {/* Step 1 */}
              <div className="grid grid-cols-[auto_1fr] gap-8 items-start">
                <div className="step-number">1</div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Search className="h-5 w-5 text-[#00B140]" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Assess Your Current Process
                    </h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed max-w-2xl">
                    Every transformation starts with understanding what&apos;s broken today.
                    Map your current workflows, identify pain points, and surface the
                    operational bottlenecks that erode efficiency. We diagnose before
                    we prescribe.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="grid grid-cols-[auto_1fr] gap-8 items-start">
                <div className="step-number">2</div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <GitCompareArrows className="h-5 w-5 text-[#00B140]" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Visualize the Vendor Landscape
                    </h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed max-w-2xl">
                    See AI vendors mapped to your specific workflows — benchmarked by
                    capability, readiness, and fit. Identify high-value automation
                    opportunities across targeted processes before committing resources.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="grid grid-cols-[auto_1fr] gap-8 items-start">
                <div className="step-number">3</div>
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <Layers className="h-5 w-5 text-[#00B140]" />
                    <h3 className="text-xl font-semibold text-gray-900">
                      Deep Dive into Vendor Profiles
                    </h3>
                  </div>
                  <p className="text-gray-500 leading-relaxed max-w-2xl">
                    Go beyond the marketing page. Evaluate product capabilities,
                    adoption metrics, deployment complexity, and fit scores.
                    Make informed selection and prioritization decisions backed by
                    structured analysis — not vendor demos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* Functions — clean cards */}
      <section className="py-20 sm:py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#00B140] font-semibold text-sm tracking-wide uppercase mb-4">
              Coverage
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">
              Explore by <span className="font-semibold">function</span>
            </h2>
            <p className="text-gray-500 text-lg mb-14 max-w-2xl font-light">
              Deep-dive into processes across enterprise functions.
              Understand where AI creates leverage before building the business case.
            </p>

            <div className="grid gap-px bg-gray-100 md:grid-cols-3 border border-gray-100">
              {/* Finance — Active */}
              <Link href="/ap" className="group">
                <div className="bg-white p-8 h-full transition-colors hover:bg-gray-50 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-[#00B140]" />
                  <DollarSign className="h-7 w-7 text-[#00B140] mb-5" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Finance</h3>
                  <p className="text-sm text-gray-500 leading-relaxed mb-6">
                    Accounts Payable, FP&A, and Close processes. Assess invoice-to-pay
                    cycles, planning workflows, and reconciliation automation.
                  </p>
                  <div className="flex items-center text-[#00B140] font-semibold text-sm group-hover:gap-2.5 gap-1.5 transition-all">
                    Explore AP <ChevronRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>

              {/* GTM */}
              <div className="bg-white p-8 h-full relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200" />
                <TrendingUp className="h-7 w-7 text-gray-300 mb-5" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Go-To-Market</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Lead generation, sales enablement, and customer success.
                  Map tools to pipeline velocity, conversion, and retention.
                </p>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>

              {/* R&D */}
              <div className="bg-white p-8 h-full relative">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200" />
                <Microscope className="h-7 w-7 text-gray-300 mb-5" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">R&D</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-6">
                  Product development and engineering operations.
                  Accelerate roadmap execution and deployment with AI-powered workflows.
                </p>
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Audience — AlixPartners green-bar style */}
      <section className="py-20 sm:py-24 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto">
            <p className="text-[#00B140] font-semibold text-sm tracking-wide uppercase mb-4">
              Built For
            </p>
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-14">
              Strategic impact at <span className="font-semibold">every level</span>
            </h2>

            <div className="grid gap-12 md:grid-cols-2">
              <div className="green-bar pl-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  For Consultants
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Cut diagnostic time from weeks to hours. Walk into client meetings
                  with process-specific insights and pre-validated tool shortlists.
                  Generate tailored assessments that scale delivery without
                  sacrificing analytical rigor.
                </p>
              </div>

              <div className="green-bar pl-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  For Leadership
                </h3>
                <p className="text-gray-500 leading-relaxed">
                  Assess transformation readiness across the portfolio. Compare
                  maturity between business units. Identify quick wins and strategic
                  bets — with the operational evidence to justify investment to the board.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA — Clean, minimal */}
      <section className="py-20 sm:py-24 bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-light text-gray-900 mb-4">
              Ready to assess your <span className="font-semibold">technology stack</span>?
            </h2>
            <p className="text-gray-500 text-lg mb-10 font-light">
              Start with the process. The right vendor follows.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/ap">
                <Button
                  size="lg"
                  className="bg-[#00B140] hover:bg-[#009934] text-white font-semibold px-10 h-12 rounded-none text-sm tracking-wide uppercase"
                >
                  Explore Processes <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/engagements/new">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white px-10 h-12 rounded-none text-sm tracking-wide uppercase"
                >
                  New Client Engagement
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
