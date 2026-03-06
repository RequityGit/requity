import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentUploadDialog } from "@/components/admin/document-center/document-upload-dialog";
import {
  DocumentCenterTable,
  PortalDocumentRow,
} from "@/components/admin/document-center/document-center-table";

export default async function DocumentCenterPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch portal documents with joined entity names
  const { data: documents } = await supabase
    .from("portal_documents")
    .select(
      `
      *,
      profiles:uploaded_by(full_name, email),
      loans!portal_documents_loan_id_fkey(property_address, loan_number),
      funds!portal_documents_fund_id_fkey(name),
      borrowers!portal_documents_borrower_id_fkey(id),
      investors!portal_documents_investor_id_fkey(id),
      companies!portal_documents_company_id_fkey(name),
      crm_contacts!portal_documents_crm_contact_id_fkey(name, first_name, last_name)
    `
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  // Fetch borrower names via CRM contacts for display
  const { data: borrowerProfiles } = await supabase
    .from("borrowers")
    .select("id, crm_contact_id, crm_contacts(name, first_name, last_name)")
    .order("id");

  const borrowerNameMap = new Map<string, string>();
  for (const b of borrowerProfiles ?? []) {
    const contact = b.crm_contacts as { name?: string | null; first_name?: string | null; last_name?: string | null } | null;
    const name = contact?.name || [contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || b.id;
    borrowerNameMap.set(b.id, name);
  }

  // Fetch investor names via CRM contacts for display
  const { data: investorProfiles } = await supabase
    .from("investors")
    .select("id, crm_contact_id, crm_contacts(name, first_name, last_name)")
    .order("id");

  const investorNameMap = new Map<string, string>();
  for (const i of investorProfiles ?? []) {
    const contact = i.crm_contacts as { name?: string | null; first_name?: string | null; last_name?: string | null } | null;
    const name = contact?.name || [contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || i.id;
    investorNameMap.set(i.id, name);
  }

  // Map documents to row format
  const documentRows: PortalDocumentRow[] = (documents ?? []).map((doc) => {
    const profile = doc.profiles as { full_name?: string | null; email?: string | null } | null;
    const loan = doc.loans as { property_address?: string | null; loan_number?: string | null } | null;
    const fund = doc.funds as { name?: string | null } | null;
    const company = doc.companies as { name?: string | null } | null;
    const contact = doc.crm_contacts as { name?: string | null; first_name?: string | null; last_name?: string | null } | null;

    return {
      id: doc.id,
      file_name: doc.file_name,
      display_name: doc.display_name,
      file_path: doc.file_path,
      file_size: doc.file_size,
      mime_type: doc.mime_type,
      document_type: doc.document_type,
      category: doc.category,
      visibility: doc.visibility,
      notes: doc.notes,
      uploaded_by_name: profile?.full_name ?? profile?.email ?? null,
      loan_label: loan?.property_address ?? loan?.loan_number ?? null,
      fund_label: fund?.name ?? null,
      borrower_label: doc.borrower_id ? (borrowerNameMap.get(doc.borrower_id) ?? null) : null,
      investor_label: doc.investor_id ? (investorNameMap.get(doc.investor_id) ?? null) : null,
      company_label: company?.name ?? null,
      contact_label: contact?.name ?? ([contact?.first_name, contact?.last_name].filter(Boolean).join(" ") || null),
      created_at: doc.created_at,
    };
  });

  // Fetch entity options for upload dialog
  const [loansResult, fundsResult, borrowersResult, investorsResult, companiesResult, contactsResult] =
    await Promise.all([
      supabase
        .from("loans")
        .select("id, property_address, loan_number")
        .is("deleted_at", null)
        .order("property_address"),
      supabase
        .from("funds")
        .select("id, name")
        .is("deleted_at", null)
        .order("name"),
      supabase.from("borrowers").select("id"),
      supabase.from("investors").select("id"),
      supabase.from("companies").select("id, name").order("name"),
      supabase
        .from("crm_contacts")
        .select("id, name, first_name, last_name")
        .is("deleted_at", null)
        .eq("status", "active")
        .order("name"),
    ]);

  const loanOptions = (loansResult.data ?? []).map((l) => ({
    id: l.id,
    label: l.property_address || l.loan_number || l.id,
  }));

  const fundOptions = (fundsResult.data ?? []).map((f) => ({
    id: f.id,
    label: f.name,
  }));

  const borrowerOptions = (borrowersResult.data ?? []).map((b) => ({
    id: b.id,
    label: borrowerNameMap.get(b.id) || b.id,
  }));

  const investorOptions = (investorsResult.data ?? []).map((i) => ({
    id: i.id,
    label: investorNameMap.get(i.id) || i.id,
  }));

  const companyOptions = (companiesResult.data ?? []).map((c) => ({
    id: c.id,
    label: c.name,
  }));

  const contactOptions = (contactsResult.data ?? []).map((c) => ({
    id: c.id,
    label: c.name || [c.first_name, c.last_name].filter(Boolean).join(" ") || c.id,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Center"
        description="Manage, upload, and organize all portal documents in one place."
        action={
          <DocumentUploadDialog
            loans={loanOptions}
            funds={fundOptions}
            borrowers={borrowerOptions}
            investors={investorOptions}
            companies={companyOptions}
            contacts={contactOptions}
          />
        }
      />

      {/* Document Table */}
      <DocumentCenterTable data={documentRows} />
    </div>
  );
}
