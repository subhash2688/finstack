interface SummaryStatsBarProps {
  stepCount: number;
  toolCount: number;
  avgImpact: string;
}

export function SummaryStatsBar({ stepCount, toolCount, avgImpact }: SummaryStatsBarProps) {
  return (
    <div className="flex items-center justify-center gap-6 py-3 px-6 bg-muted/50 rounded-lg text-sm text-muted-foreground">
      <span>
        <strong className="text-foreground">{stepCount}</strong> Process Steps
      </span>
      <span className="h-4 w-px bg-border" aria-hidden="true" />
      <span>
        <strong className="text-foreground">{toolCount}</strong> Tools Mapped
      </span>
      <span className="h-4 w-px bg-border" aria-hidden="true" />
      <span>
        Avg. <strong className="text-foreground">{avgImpact}</strong> AI Impact
      </span>
    </div>
  );
}
