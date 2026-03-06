import { redirect } from "next/navigation";

export default async function LenderDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/models/dscr/lenders/${id}`);
}
