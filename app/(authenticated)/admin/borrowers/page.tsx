import { createClient } from "@/lib/supabase/server";
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

  // Fetch all borrower profiles
  const { data: borrowers } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "borrower")
    .order("full_name");

  // Fetch all loans grouped by borrower
  const { data: loans } = await supabase
    .from("loans")
    .select("borrower_id, loan_amount, stage");

  // Aggregate loans per borrower
  const loansByBorrower = new Map<
    string,
    { activeCount: number; totalOutstanding: number }
  >();

  loans?.forEach((l) => {
    const existing = loansByBorrower.get(l.borrower_id) || {
      activeCount: 0,
      totalOutstanding: 0,
    };
    if (["funded", "servicing"].includes(l.stage)) {
      existing.activeCount += 1;
      existing.totalOutstanding += l.loan_amount || 0;
    }
    loansByBorrower.set(l.borrower_id, existing);
  });

  const borrowerRows = (borrowers ?? []).map((b) => {
    const agg = loansByBorrower.get(b.id) || {
      activeCount: 0,
      totalOutstanding: 0,
    };
    return {
      id: b.id,
      full_name: b.full_name || "—",
      email: b.email,
      company: b.company_name || "—",
      phone: b.phone || "—",
      activeLoans: agg.activeCount,
      totalOutstanding: agg.totalOutstanding,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowers"
        description="Manage all borrower profiles and their loan activity."
        action={
          <Link href="/admin/borrowers">
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
