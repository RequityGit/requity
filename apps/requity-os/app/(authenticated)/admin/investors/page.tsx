import { redirect } from "next/navigation";

// Redirect to CRM Investors tab — investor detail/new pages still work at their own routes
export default function AdminInvestorsPage() {
  redirect("/admin/crm?tab=investors");
}
