import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentUploadForm } from "@/components/admin/document-upload-form";
import { DocumentListTable } from "@/components/admin/document-list-table";
import { DocumentCenterTabs } from "./document-center-tabs";

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
      (doc as Record<string, unknown> & { profiles?: { full_name?: string; email?: string } }).profiles?.full_name ??
      (doc as Record<string, unknown> & { profiles?: { full_name?: string; email?: string } }).profiles?.email ??
      "—",
    fund_name: (doc as Record<string, unknown> & { funds?: { name?: string } }).funds?.name ?? null,
    loan_address: (doc as Record<string, unknown> & { loans?: { property_address?: string } }).loans?.property_address ?? null,
    status: doc.status ?? "pending",
    created_at: doc.created_at,
  }));

  // Fetch generated documents
  const { data: generatedDocs } = await supabase
    .from("generated_documents")
    .select("*, document_templates(name, template_type)")
    .order("generated_at", { ascending: false });

  // Get profile names for generated_by
  const generatorIds = Array.from(
    new Set((generatedDocs ?? []).map((d) => d.generated_by))
  );
  const { data: generatorProfiles } = generatorIds.length > 0
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", generatorIds)
    : { data: [] };

  const profileMap = new Map(
    (generatorProfiles ?? []).map((p) => [p.id, p.full_name ?? "Unknown"])
  );

  const generatedRows = (generatedDocs ?? []).map((doc) => {
    const template = (doc as Record<string, unknown>).document_templates as {
      name?: string;
      template_type?: string;
    } | null;
    return {
      id: doc.id,
      file_name: doc.file_name,
      template_name: template?.name ?? "Unknown Template",
      template_type: template?.template_type ?? "other",
      record_type: doc.record_type,
      record_id: doc.record_id,
      status: doc.status,
      generated_by_name: profileMap.get(doc.generated_by) ?? "Unknown",
      generated_at: doc.generated_at,
      gdrive_file_id: doc.gdrive_file_id,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Center"
        description="Manage all investor, borrower, and generated documents."
      />

      <DocumentCenterTabs
        uploadedDocuments={documentRows}
        generatedDocuments={generatedRows}
        uploadAction={
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
