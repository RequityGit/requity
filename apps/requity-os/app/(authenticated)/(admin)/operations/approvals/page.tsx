import { redirect } from "next/navigation";

export default function OperationsApprovalsRedirect() {
  redirect("/tasks/approvals");
}
