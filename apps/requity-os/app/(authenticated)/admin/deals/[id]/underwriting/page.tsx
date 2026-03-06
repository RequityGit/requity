import { redirect } from "next/navigation";

export default async function UWRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/pipeline/debt/${id}/underwriting`);
}
