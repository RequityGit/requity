import { PageHeader } from "@/components/shared/page-header";
import { DocumentsTable } from "@/components/borrower/documents-table";
import { getEffectiveAuth, getBorrowerId } from "@/lib/impersonation";

export default async function BorrowerDocumentsPage() {
  const { supabase, userId } = await getEffectiveAuth();

  // Resolve auth user to borrowers.id
  const borrowerId = await getBorrowerId(supabase, userId);

  // Fetch borrower's loans first
  const { data: loans } = borrowerId
    ? await supabase
        .from("loans")
        .select("id, property_address")
        .eq("borrower_id", borrowerId)
        .is("deleted_at", null)
        .order("property_address", { ascending: true })
    : { data: null };

  const loanIds = (loans ?? []).map((l) => l.id);

  // Fetch documents for borrower's loans
  const { data: documents } = loanIds.length > 0
    ? await supabase
        .from("documents")
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
        .order("created_at", { ascending: false })
    : { data: null };

  return (
    <div>
      <PageHeader
        title="Documents"
        description="View and download documents related to your loans"
      />

      <DocumentsTable
        documents={(documents ?? []) as any}
        loans={loans ?? []}
      />
    </div>
  );
}
