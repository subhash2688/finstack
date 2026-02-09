import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Target, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-emerald-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Discover AI Tools for{" "}
              <span className="text-primary">Finance Teams</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Navigate the landscape of AI-powered finance tools. Built for management consultants
              and finance leaders to quickly discover, evaluate, and recommend the right tech stack.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link href="/ap">
                <Button size="lg" className="gap-2">
                  Explore AP Tools <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-3">
            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">10-Second Value</CardTitle>
                <CardDescription>
                  See the landscape immediately. No forms, no interviews, just instant discovery.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Discovery-First</CardTitle>
                <CardDescription>
                  Browse freely, filter optionally. Discover tools by workflow step, company size, or AI maturity.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary mb-2" />
                <CardTitle className="text-xl">Client-Ready</CardTitle>
                <CardDescription>
                  Professional, polished interface ready to show clients. Export recommendations instantly.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Functions */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Explore by Finance Function</h2>
          <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
            <Link href="/ap">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle>Accounts Payable</CardTitle>
                  <CardDescription className="mt-2">
                    Discover 12 AI-powered tools for invoice processing, payments, and workflow automation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-primary font-medium">
                    Explore AP Tools <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle>FP&A</CardTitle>
                <CardDescription className="mt-2">
                  Planning, budgeting, forecasting, and reporting tools with AI capabilities.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground font-medium">Coming Soon</div>
              </CardContent>
            </Card>

            <Card className="opacity-60">
              <CardHeader>
                <CardTitle>Close Management</CardTitle>
                <CardDescription className="mt-2">
                  Streamline month-end close with AI-powered reconciliation and automation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground font-medium">Coming Soon</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Roadmap Teaser */}
      <section id="coming-soon" className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">More Coming Soon</h2>
          <p className="text-lg text-muted-foreground mb-8">
            We&apos;re rapidly expanding FinStack Navigator with additional functions and features:
          </p>
          <div className="grid gap-4 text-left md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">FP&A Function</h3>
              <p className="text-sm text-muted-foreground">
                Planning, budgeting, forecasting tools
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Close Management</h3>
              <p className="text-sm text-muted-foreground">
                Month-end close and reconciliation
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">AI Advisor</h3>
              <p className="text-sm text-muted-foreground">
                Chat with Claude for personalized recommendations
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">PDF Export</h3>
              <p className="text-sm text-muted-foreground">
                Export tool recommendations as professional reports
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
