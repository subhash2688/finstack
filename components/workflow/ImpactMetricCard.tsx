import { Card, CardContent } from "@/components/ui/card";

interface ImpactMetricCardProps {
  value: string;
  label: string;
}

export function ImpactMetricCard({ value, label }: ImpactMetricCardProps) {
  return (
    <Card>
      <CardContent className="p-4 text-center">
        <p className="text-2xl font-light text-primary">{value}</p>
        <p className="text-xs text-muted-foreground mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
