"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface PathCardProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  accent?: boolean;
}

export function PathCard({ title, description, href, icon, accent }: PathCardProps) {
  return (
    <Link href={href} className="group">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl p-7 h-full transition-all duration-300",
          "shadow-md hover:shadow-xl hover:-translate-y-1",
          accent
            ? "bg-gradient-to-br from-[#00B140] to-[#009935] text-white border border-[#00B140]"
            : "bg-white border border-gray-100 hover:border-[#00B140]/50"
        )}
      >
        {/* Subtle shimmer on hover */}
        <div className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          accent
            ? "bg-gradient-to-br from-white/10 to-transparent"
            : "bg-gradient-to-br from-[#00B140]/[0.03] to-transparent"
        )} />

        {/* Accent card inner radial glow */}
        {accent && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15)_0%,transparent_60%)]" />
        )}

        <div className="relative">
          <div className={cn(
            "mb-4 w-11 h-11 rounded-xl flex items-center justify-center",
            accent
              ? "bg-white/20 text-white"
              : "bg-[#00B140]/10 text-[#00B140]"
          )}>
            {icon}
          </div>

          <h2 className={cn(
            "text-lg font-semibold mb-2",
            accent ? "text-white" : "text-gray-900"
          )}>
            {title}
          </h2>

          <p className={cn(
            "text-sm leading-relaxed mb-6",
            accent ? "text-white/80" : "text-gray-500"
          )}>
            {description}
          </p>

          <div className={cn(
            "flex items-center font-semibold text-sm gap-1.5 group-hover:gap-2.5 transition-all",
            accent ? "text-white" : "text-[#00B140]"
          )}>
            Get Started <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>
    </Link>
  );
}
