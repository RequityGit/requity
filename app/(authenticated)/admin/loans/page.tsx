import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { LoanListView } from "@/components/admin/loan-list-view";

export default async function AdminLoansPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: loans } = await supabase
    .from("loans")
    .select("*, profiles!loans_borrower_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  const loanRows = (loans ?? []).map((l) => ({
    id: l.id,
    loan_number: l.loan_number,
    property_address: l.property_address,
    property_city: l.property_city,
    property_state: l.property_state,
    borrower_name: (l as any).profiles?.full_name ?? "—",
    borrower_id: l.borrower_id,
    loan_type: l.loan_type,
    loan_amount: l.loan_amount,
    ltv: l.ltv,
    interest_rate: l.interest_rate,
    stage: l.stage,
    origination_date: l.origination_date,
    created_at: l.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Loans"
        description="Manage all loans in the pipeline."
        action={
          <Link href="/admin/loans">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Loan
            </Button>
          </Link>
        }
      />

      <LoanListView data={loanRows} />
    </div>
  );
}
