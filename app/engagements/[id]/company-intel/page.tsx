import { CompanyIntelPageClient } from "@/components/engagement/CompanyIntelPageClient";

export default function CompanyIntelPage({
  params,
}: {
  params: { id: string };
}) {
  return <CompanyIntelPageClient engagementId={params.id} />;
}
