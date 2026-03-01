import { PageHeader } from "@/components/shared/page-header";
import { DocumentsTable } from "@/components/borrower/documents-table";
import { getEffectiveAuth } from "@/lib/impersonation";

export default async function BorrowerDocumentsPage() {
  const { supabase, userId } = await getEffectiveAuth();

  // Fetch all documents owned by this user that are tied to a loan
  const { data: documents } = await supabase
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
    .eq("owner_id", userId)
    .not("loan_id", "is", null)
    .order("created_at", { ascending: false });

  // Fetch borrower's loans for the filter dropdown
  const { data: loans } = await supabase
    .from("loans")
    .select("id, property_address")
    .eq("borrower_id", userId)
    .order("property_address", { ascending: true });

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
