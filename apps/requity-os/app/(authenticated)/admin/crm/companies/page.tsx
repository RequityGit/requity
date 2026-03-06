import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CompaniesView } from "@/components/crm/companies-view";
import type { CompanyRowV2 } from "@/components/crm/crm-v2-page";

export const dynamic = "force-dynamic";

/* eslint-disable @typescript-eslint/no-explicit-any */

export default async function CompaniesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch companies-related data in parallel
  const [
    contactsResult,
    companiesResult,
    companyFilesCountResult,
  ] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("company_id")
      .is("deleted_at", null),
    admin
      .from("companies")
      .select("*")
      .eq("is_active", true)
      .order("updated_at", { ascending: false }),
    (admin as any).from("company_files").select("company_id"),
  ]);

  const companiesData = companiesResult.data ?? [];
  const contacts = contactsResult.data ?? [];

  // Count contacts per company
  const contactsPerCompany: Record<string, number> = {};
  contacts.forEach((c: { company_id: string | null }) => {
    if (c.company_id) {
      contactsPerCompany[c.company_id] =
        (contactsPerCompany[c.company_id] ?? 0) + 1;
    }
  });

  // Count files per company
  const filesPerCompany: Record<string, number> = {};
  const companyFilesData = (companyFilesCountResult.data ?? []) as Array<{ company_id: string }>;
  companyFilesData.forEach((f) => {
    filesPerCompany[f.company_id] =
      (filesPerCompany[f.company_id] ?? 0) + 1;
  });

  // Build enriched company rows
  const companyRows: CompanyRowV2[] = companiesData.map((c: any) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    website: c.website,
    company_type: c.company_type,
    company_subtype: c.company_subtype,
    city: c.city,
    state: c.state,
    contact_count: contactsPerCompany[c.id] ?? 0,
    file_count: filesPerCompany[c.id] ?? 0,
    active_deals: 0,
    nda_created_date: c.nda_created_date,
    nda_expiration_date: c.nda_expiration_date,
    fee_agreement_on_file: c.fee_agreement_on_file,
    is_active: c.is_active,
    notes: c.notes,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Companies"
        description="Manage companies and partnerships."
      />
      <CompaniesView companies={companyRows} />
    </div>
  );
}
