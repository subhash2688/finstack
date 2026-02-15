"use client";

import { TranscriptQuote } from "@/types/transcript";
import { Quote } from "lucide-react";

interface TranscriptQuoteCardProps {
  quote: TranscriptQuote;
}

export function TranscriptQuoteCard({ quote }: TranscriptQuoteCardProps) {
  return (
    <div className="relative pl-4 border-l-2 border-primary/30 py-1">
      <Quote className="absolute -left-2.5 top-1 h-4 w-4 text-primary/40 bg-background" />
      <p className="text-sm italic text-foreground/80 leading-relaxed">
        &ldquo;{quote.text}&rdquo;
      </p>
      <div className="flex items-center gap-2 mt-1">
        <span className="text-xs font-medium text-muted-foreground">
          {quote.speaker}
        </span>
        {quote.timestamp && (
          <span className="text-xs text-muted-foreground/60">
            {quote.timestamp}
          </span>
        )}
      </div>
      {quote.context && (
        <p className="text-xs text-muted-foreground mt-0.5">{quote.context}</p>
      )}
    </div>
  );
}
