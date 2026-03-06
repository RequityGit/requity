import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentUploadForm } from "@/components/admin/document-upload-form";
import { DocumentListTable } from "@/components/admin/document-list-table";

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch documents with owner info
  const { data: documents } = await supabase
    .from("documents")
    .select("*, profiles:uploaded_by(full_name, email), funds(name), loans(property_address)")
    .order("created_at", { ascending: false });

  // Fetch metadata for the upload form
  const [profilesResult, fundsResult, loansResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["investor", "borrower"])
      .order("full_name"),
    supabase.from("funds").select("id, name").order("name"),
    supabase
      .from("loans")
      .select("id, property_address, borrower_id")
      .order("property_address"),
  ]);

  const documentRows = (documents ?? []).map((doc) => ({
    id: doc.id,
    file_name: doc.file_name,
    description: doc.description,
    document_type: doc.document_type,
    owner_name:
      (doc as any).profiles?.full_name ??
      (doc as any).profiles?.email ??
      "—",
    fund_name: (doc as any).funds?.name ?? null,
    loan_address: (doc as any).loans?.property_address ?? null,
    status: doc.status ?? "pending",
    created_at: doc.created_at,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Center"
        description="Manage all investor and borrower documents."
      />

      <DocumentListTable
        data={documentRows}
        action={
          <DocumentUploadForm
            profiles={profilesResult.data ?? []}
            funds={fundsResult.data ?? []}
            loans={loansResult.data ?? []}
          />
        }
      />
    </div>
  );
}
