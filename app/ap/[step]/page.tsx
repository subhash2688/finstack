import { redirect } from "next/navigation";

export default function StepDetailPage({ params }: { params: { step: string } }) {
  redirect(`/ap?step=${params.step}`);
}
