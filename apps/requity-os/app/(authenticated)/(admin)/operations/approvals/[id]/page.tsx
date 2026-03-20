import { redirect } from "next/navigation";

export default function OperationsApprovalDetailRedirect({
  params,
}: {
  params: { id: string };
}) {
  redirect(`/tasks/approvals/${params.id}`);
}
