import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentUploadForm } from "@/components/admin/document-upload-form";
import { DocumentListTable } from "@/components/admin/document-list-table";
import { CreateDocumentDialog } from "@/components/documents/CreateDocumentDialog";
import { DocumentCenterTabs } from "./document-center-tabs";

export default async function AdminDocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if current user is super_admin
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .limit(1)
    .single();

  const isSuperAdmin = !!superAdminRole;

  // Fetch documents from all entity tables in parallel
  const [
    documentsResult,
    contactFilesResult,
    companyFilesResult,
    dealDocsResult,
    profilesResult,
    fundsResult,
    loansResult,
  ] = await Promise.all([
    // Legacy loan/fund documents
    supabase
      .from("documents")
      .select(
        "*, profiles:uploaded_by(full_name, email), funds(name), loans(property_address)"
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),

    // CRM contact files
    supabase
      .from("contact_files")
      .select("*, crm_contacts(first_name, last_name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),

    // CRM company files
    supabase
      .from("company_files")
      .select("*, companies:company_id(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),

    // Pipeline deal documents
    supabase
      .from("unified_deal_documents")
      .select("*, unified_deals(name)")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),

    // Metadata for upload form
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

  // Normalize loan/fund documents
  const loanDocRows = (documentsResult.data ?? []).map((doc) => {
    const p = doc as Record<string, unknown> & {
      profiles?: { full_name?: string; email?: string };
      funds?: { name?: string };
      loans?: { property_address?: string };
    };
    return {
      id: doc.id,
      file_name: doc.file_name,
      description: doc.description,
      document_type: doc.document_type,
      owner_name: p.profiles?.full_name ?? p.profiles?.email ?? "—",
      entity_name: p.funds?.name ?? p.loans?.property_address ?? null,
      source: "loan" as const,
      status: doc.status ?? "pending",
      created_at: doc.created_at,
      storage_path: doc.file_path ?? null,
      storage_bucket: doc.file_path ? "loan-documents" : null,
      file_url: doc.file_url ?? null,
      mime_type: doc.mime_type ?? null,
    };
  });

  // Normalize contact files
  const contactDocRows = (contactFilesResult.data ?? []).map((doc) => {
    const c = doc as Record<string, unknown> & {
      crm_contacts?: { first_name?: string; last_name?: string };
    };
    const contactName = [c.crm_contacts?.first_name, c.crm_contacts?.last_name]
      .filter(Boolean)
      .join(" ");
    return {
      id: doc.id,
      file_name: doc.file_name,
      description: doc.notes ?? null,
      document_type: doc.file_type,
      owner_name: "—",
      entity_name: contactName || null,
      source: "contact" as const,
      status: "uploaded",
      created_at: doc.created_at ?? doc.uploaded_at ?? "",
      storage_path: doc.storage_path,
      storage_bucket: "contact-files" as const,
      file_url: null,
      mime_type: doc.mime_type ?? null,
    };
  });

  // Normalize company files
  const companyDocRows = (companyFilesResult.data ?? []).map((doc) => {
    const c = doc as Record<string, unknown> & {
      companies?: { name?: string };
    };
    return {
      id: doc.id,
      file_name: doc.file_name,
      description: doc.notes ?? null,
      document_type: doc.file_type,
      owner_name: "—",
      entity_name: c.companies?.name ?? null,
      source: "company" as const,
      status: "uploaded",
      created_at: doc.created_at ?? doc.uploaded_at ?? "",
      storage_path: doc.storage_path,
      storage_bucket: "company-files" as const,
      file_url: null,
      mime_type: doc.mime_type ?? null,
    };
  });

  // Normalize deal documents
  const dealDocRows = (dealDocsResult.data ?? []).map((doc) => {
    const d = doc as Record<string, unknown> & {
      unified_deals?: { name?: string };
    };
    return {
      id: doc.id,
      file_name: doc.document_name,
      description: null,
      document_type: doc.category,
      owner_name: "—",
      entity_name: d.unified_deals?.name ?? null,
      source: "deal" as const,
      status: doc.review_status ?? "uploaded",
      created_at: doc.created_at,
      storage_path: doc.storage_path ?? null,
      storage_bucket: doc.storage_path ? "loan-documents" : null,
      file_url: doc.file_url,
      mime_type: doc.mime_type ?? null,
    };
  });

  // Merge and sort by date descending
  const documentRows = [
    ...loanDocRows,
    ...contactDocRows,
    ...companyDocRows,
    ...dealDocRows,
  ].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

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
        isSuperAdmin={isSuperAdmin}
        uploadAction={
          <DocumentUploadForm
            profiles={profilesResult.data ?? []}
            funds={fundsResult.data ?? []}
            loans={loansResult.data ?? []}
          />
        }
        createAction={<CreateDocumentDialog />}
      />
    </div>
  );
}
