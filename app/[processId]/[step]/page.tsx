import { redirect } from "next/navigation";

export default function StepDetailPage({
  params,
}: {
  params: { processId: string; step: string };
}) {
  redirect(`/${params.processId}?step=${params.step}`);
}
