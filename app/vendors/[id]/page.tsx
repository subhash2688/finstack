import { getAllTools, getToolById } from "@/lib/data/tools";
import { VendorProfileClient } from "@/components/vendors/VendorProfileClient";
import { notFound } from "next/navigation";

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ id: tool.id }));
}

export default function VendorProfilePage({ params }: { params: { id: string } }) {
  const tool = getToolById(params.id);
  if (!tool) notFound();

  return <VendorProfileClient tool={tool} />;
}
