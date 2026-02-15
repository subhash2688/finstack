"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CompanyIntelPageClient } from "@/components/engagement/CompanyIntelPageClient";

interface CompanyBriefDrawerProps {
  open: boolean;
  onClose: () => void;
  engagementId: string;
}

export function CompanyBriefDrawer({
  open,
  onClose,
  engagementId,
}: CompanyBriefDrawerProps) {
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gray-50/80">
          <h2 className="text-lg font-semibold">Company Brief</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content — scrollable, reuses full CompanyIntelPageClient */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <CompanyIntelPageClient engagementId={engagementId} />
        </div>
      </div>
    </>
  );
}
