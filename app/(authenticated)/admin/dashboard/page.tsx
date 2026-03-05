import { redirect } from "next/navigation";
import { fetchActionDashboardData } from "./actions";
import { ActionDashboard } from "./action-dashboard";

export default async function AdminDashboardPage() {
  const result = await fetchActionDashboardData();

  if ("error" in result) {
    redirect("/login");
  }

  return <ActionDashboard initialData={result.data} />;
}
