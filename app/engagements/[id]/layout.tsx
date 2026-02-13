import { EngagementLayoutClient } from "@/components/engagement/EngagementLayoutClient";

export default function EngagementLayout({
  params,
  children,
}: {
  params: { id: string };
  children: React.ReactNode;
}) {
  return (
    <EngagementLayoutClient engagementId={params.id}>
      {children}
    </EngagementLayoutClient>
  );
}
