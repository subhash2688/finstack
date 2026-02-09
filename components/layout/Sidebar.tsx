"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FUNCTIONS } from "@/types/function";
import { getAllEngagements } from "@/lib/storage/engagements";
import { Engagement } from "@/types/engagement";
import {
  ChevronDown,
  ChevronRight,
  Briefcase,
  Plus,
  DollarSign,
  TrendingUp,
  Microscope,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { LighthouseIcon } from "@/components/ui/lighthouse-icon";

const ICON_MAP: Record<string, any> = {
  DollarSign,
  TrendingUp,
  Microscope,
};

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedFunctions, setExpandedFunctions] = useState<Set<string>>(
    new Set(["finance"]) // Finance expanded by default
  );
  const [engagements, setEngagements] = useState<Engagement[]>([]);

  // Load engagements
  useEffect(() => {
    setEngagements(getAllEngagements());
  }, [pathname]); // Reload when pathname changes

  const toggleFunction = (functionId: string) => {
    setExpandedFunctions((prev) => {
      const next = new Set(prev);
      if (next.has(functionId)) {
        next.delete(functionId);
      } else {
        next.add(functionId);
      }
      return next;
    });
  };

  // Collapsed state — narrow rail with icons only
  if (collapsed) {
    return (
      <aside className="w-16 bg-white border-r flex flex-col h-screen shrink-0">
        <div className="p-3 border-b flex items-center justify-center">
          <button
            onClick={() => setCollapsed(false)}
            className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center py-4 gap-1">
          {/* Lighthouse icon mark */}
          <Link
            href="/"
            className="mb-4"
            title="Lighthouse Home"
          >
            <LighthouseIcon size={36} className="text-gray-900" />
          </Link>

          {FUNCTIONS.map((func) => {
            const Icon = ICON_MAP[func.icon] || DollarSign;
            const hasActiveProcess = func.processes.some(
              (p) => p.available && pathname.startsWith(`/${p.id}`)
            );
            return (
              <Link
                key={func.id}
                href={func.processes.find((p) => p.available) ? `/${func.processes.find((p) => p.available)!.id}` : "#"}
                className={cn(
                  "w-9 h-9 rounded-md flex items-center justify-center transition-colors",
                  hasActiveProcess
                    ? "bg-[#00B140] text-white"
                    : "hover:bg-gray-100 text-gray-500"
                )}
                title={func.name}
              >
                <Icon className="h-4 w-4" />
              </Link>
            );
          })}

          <div className="border-t w-6 my-2" />

          <Link
            href="/engagements/new"
            className="w-9 h-9 rounded-md flex items-center justify-center hover:bg-gray-100 text-gray-500 transition-colors"
            title="New Engagement"
          >
            <Plus className="h-4 w-4" />
          </Link>

          {engagements.slice(0, 3).map((engagement) => {
            const isActive = pathname.startsWith(`/engagements/${engagement.id}`);
            return (
              <Link
                key={engagement.id}
                href={`/engagements/${engagement.id}`}
                className={cn(
                  "w-9 h-9 rounded-md flex items-center justify-center transition-colors",
                  isActive
                    ? "bg-[#00B140] text-white"
                    : "hover:bg-gray-100 text-gray-500"
                )}
                title={engagement.clientContext.companyName}
              >
                <Briefcase className="h-4 w-4" />
              </Link>
            );
          })}
        </div>
      </aside>
    );
  }

  // Expanded state
  return (
    <aside className="w-64 bg-white border-r flex flex-col h-screen shrink-0">
      {/* Logo / Header */}
      <div className="px-5 py-5 border-b flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <LighthouseIcon size={36} className="text-gray-900" />
          <span className="text-2xl font-bold tracking-tight text-gray-900">
            Lighthouse
          </span>
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
          title="Collapse sidebar"
        >
          <PanelLeftClose className="h-4 w-4 text-gray-400" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* EXPLORE Section */}
        <div className="p-4">
          <div className="text-[10px] font-semibold text-gray-400 tracking-[0.15em] uppercase mb-3 px-3">
            Explore
          </div>

          <div className="space-y-0.5">
            {FUNCTIONS.map((func) => {
              const isExpanded = expandedFunctions.has(func.id);
              const Icon = ICON_MAP[func.icon] || DollarSign;

              return (
                <div key={func.id}>
                  {/* Function Header */}
                  <button
                    onClick={() => toggleFunction(func.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                      "hover:bg-gray-50 text-gray-700"
                    )}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    )}
                    <Icon className="h-4 w-4" />
                    <span>{func.name}</span>
                  </button>

                  {/* Processes */}
                  {isExpanded && (
                    <div className="ml-6 mt-0.5 space-y-0.5">
                      {func.processes.map((process) => {
                        const processPath = `/${func.id}/${process.id}`;
                        const isActive = pathname.startsWith(processPath) || pathname.startsWith(`/${process.id}`);

                        if (!process.available) {
                          return (
                            <div
                              key={process.id}
                              className="px-3 py-1.5 text-sm text-gray-400 flex items-center justify-between"
                            >
                              <span>{process.name}</span>
                              <span className="text-[10px] uppercase tracking-wider">Soon</span>
                            </div>
                          );
                        }

                        return (
                          <Link
                            key={process.id}
                            href={`/${process.id}`}
                            className={cn(
                              "block px-3 py-1.5 rounded-md text-sm transition-colors",
                              isActive
                                ? "bg-[#00B140] text-white font-medium"
                                : "text-gray-600 hover:bg-gray-50"
                            )}
                          >
                            {process.name}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t mx-4 my-1" />

        {/* ENGAGEMENTS Section */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3 px-3">
            <div className="text-[10px] font-semibold text-gray-400 tracking-[0.15em] uppercase">
              Engagements
            </div>
            <Link href="/engagements/new">
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600">
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>

          {engagements.length === 0 ? (
            <p className="text-xs text-gray-400 px-3 py-2">
              No engagements yet
            </p>
          ) : (
            <div className="space-y-0.5">
              {engagements.map((engagement) => {
                const engagementPath = `/engagements/${engagement.id}`;
                const isActive = pathname.startsWith(engagementPath);

                const processCount = engagement.processAssessments?.length || 0;

                return (
                  <Link
                    key={engagement.id}
                    href={`/engagements/${engagement.id}`}
                    className={cn(
                      "block px-3 py-2 rounded-md text-sm transition-colors",
                      isActive
                        ? "bg-[#00B140] text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start gap-2">
                      <Briefcase className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">
                          {engagement.clientContext.companyName}
                        </div>
                        <div className={cn(
                          "text-xs",
                          isActive ? "text-white/70" : "text-gray-400"
                        )}>
                          {processCount} {processCount === 1 ? "process" : "processes"}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
