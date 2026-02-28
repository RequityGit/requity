import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { BorrowerListTable } from "@/components/admin/borrower-list-table";

export default async function AdminBorrowersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all borrowers from the dedicated borrowers table
  const { data: borrowers } = await admin
    .from("borrowers")
    .select("*")
    .order("created_at", { ascending: false });

  // Fetch entity counts per borrower
  const { data: entities } = await admin
    .from("borrower_entities")
    .select("borrower_id");

  // Fetch loan counts per borrower (loans may still FK to profiles or borrowers)
  const { data: loans } = await admin
    .from("loans")
    .select("borrower_id, stage");

  // Aggregate entity counts
  const entityCountByBorrower = new Map<string, number>();
  entities?.forEach((e) => {
    entityCountByBorrower.set(
      e.borrower_id,
      (entityCountByBorrower.get(e.borrower_id) || 0) + 1
    );
  });

  // Aggregate loan counts
  const loanCountByBorrower = new Map<string, number>();
  loans?.forEach((l) => {
    if (l.borrower_id) {
      loanCountByBorrower.set(
        l.borrower_id,
        (loanCountByBorrower.get(l.borrower_id) || 0) + 1
      );
    }
  });

  const borrowerRows = (borrowers ?? []).map((b) => ({
    id: b.id,
    first_name: b.first_name,
    last_name: b.last_name,
    email: b.email || "—",
    phone: b.phone || "—",
    state: b.state || "—",
    credit_score: b.credit_score,
    experience_count: b.experience_count ?? 0,
    entity_count: entityCountByBorrower.get(b.id) || 0,
    loan_count: loanCountByBorrower.get(b.id) || 0,
    created_at: b.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowers"
        description="Manage all borrower profiles and their loan activity."
        action={
          <Link href="/admin/borrowers/new">
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Borrower
            </Button>
          </Link>
        }
      />

      <BorrowerListTable data={borrowerRows} />
    </div>
  );
}
