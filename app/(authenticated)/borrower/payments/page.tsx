import { PageHeader } from "@/components/shared/page-header";
import { PaymentsTable } from "@/components/borrower/payments-table";
import { getEffectiveAuth, getBorrowerId } from "@/lib/impersonation";

export default async function BorrowerPaymentsPage() {
  const { supabase, userId } = await getEffectiveAuth();

  // Resolve auth user to borrowers.id
  const borrowerId = await getBorrowerId(supabase, userId);

  // Fetch borrower's loans first (to filter payments by loan)
  const { data: loans } = borrowerId
    ? await supabase
        .from("loans")
        .select("id, property_address")
        .eq("borrower_id", borrowerId)
        .is("deleted_at", null)
        .order("property_address", { ascending: true })
    : { data: null };

  const loanIds = (loans ?? []).map((l) => l.id);

  // Fetch payments for borrower's loans
  const { data: payments } = loanIds.length > 0
    ? await supabase
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
        .in("loan_id", loanIds)
        .order("payment_date", { ascending: false })
    : { data: null };

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
