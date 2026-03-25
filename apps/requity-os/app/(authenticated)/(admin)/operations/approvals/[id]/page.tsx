import { redirect } from "next/navigation";

export default async function OperationsApprovalDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/tasks/approvals/${id}`);
}
