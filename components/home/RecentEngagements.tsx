"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getAllEngagements } from "@/lib/storage/engagements";
import { Engagement } from "@/types/engagement";
import { Briefcase, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function RecentEngagements() {
  const [engagements, setEngagements] = useState<Engagement[]>([]);

  useEffect(() => {
    const all = getAllEngagements();
    // Sort by updatedAt desc, take top 4
    const sorted = all
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
    setEngagements(sorted);
  }, []);

  if (engagements.length === 0) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-400 tracking-wide uppercase">
          Recent Engagements
        </h3>
        <Link
          href="/engagements"
          className="text-xs text-[#00B140] font-medium hover:underline flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {engagements.map((eng) => {
          const processCount = eng.processAssessments?.length || 0;
          const daysAgo = Math.floor(
            (Date.now() - new Date(eng.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
          );
          const timeLabel = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

          return (
            <Link
              key={eng.id}
              href={`/engagements/${eng.id}`}
              className="group block"
            >
              <div className="border border-gray-200 rounded-xl p-4 hover:border-[#00B140]/30 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 bg-white">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-md flex items-center justify-center shrink-0",
                    "bg-[#00B140]/10 text-[#00B140]"
                  )}>
                    <Briefcase className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {eng.clientContext.companyName}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {processCount} {processCount === 1 ? "process" : "processes"} · {timeLabel}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
