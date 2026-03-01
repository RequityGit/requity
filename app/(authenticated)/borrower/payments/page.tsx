import { PageHeader } from "@/components/shared/page-header";
import { PaymentsTable } from "@/components/borrower/payments-table";
import { getEffectiveAuth } from "@/lib/impersonation";

export default async function BorrowerPaymentsPage() {
  const { supabase, userId } = await getEffectiveAuth();

  // Fetch all payments with loan info
  const { data: payments } = await supabase
    .from("loan_payments")
    .select(
      `
      *,
      loans (
        property_address,
        loan_number
      )
    `
    )
    .eq("borrower_id", userId)
    .order("due_date", { ascending: false });

  // Fetch borrower's loans for the filter dropdown
  const { data: loans } = await supabase
    .from("loans")
    .select("id, property_address")
    .eq("borrower_id", userId)
    .order("property_address", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Payments"
        description="View your payment history across all loans"
      />

      <PaymentsTable
        payments={(payments ?? []) as any}
        loans={loans ?? []}
      />
    </div>
  );
}
