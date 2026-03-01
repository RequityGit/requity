import { redirect } from "next/navigation";

// Redirect to CRM Borrowers tab — borrower detail/new pages still work at their own routes
export default function AdminBorrowersPage() {
  redirect("/admin/crm?tab=borrowers");
}
