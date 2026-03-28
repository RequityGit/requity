import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { CRM_CONTACT_SOURCES } from "@/lib/constants";
import { ContactDetailClient } from "@/components/crm/contact-360";
import type {
  ContactData,
  RelationshipData,
  BorrowerData,
  InvestorProfileData,
  SectionLayout,
  FieldLayout,
  Contact360TabCounts,
  TeamMember,
  CompanyData,
} from "@/components/crm/contact-360/types";
import type { Profile } from "@/lib/tasks";

interface PageProps {
  params: Promise<{ id: string }>;
}

export const dynamic = "force-dynamic";

export default async function CrmContactDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user is super admin
  const { data: superAdminRole } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", user.id)
    .eq("role", "super_admin")
    .eq("is_active", true)
    .maybeSingle();

  const isSuperAdmin = !!superAdminRole;

  // Fetch the user's primary role for field permissions
  const { data: userRoleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const userRole = isSuperAdmin ? "super_admin" : (userRoleRow?.role ?? "user");

  const { id: contactNumber } = await params;
  const admin = createAdminClient();

  const { data: contact } = await supabase
    .from("crm_contacts")
    .select("id, contact_number, first_name, last_name, email, phone, company_name, company_id, source, assigned_to, next_follow_up_date, last_contacted_at, marketing_consent, created_at, updated_at, lifecycle_stage, dnc, address_line1, address_line2, city, state, zip, country, user_id, borrower_id, linked_investor_id, notes, contact_types, rating, status, user_function, language_preference")
    .eq("contact_number", contactNumber)
    .single();

  if (!contact) notFound();

  // Core + layout + tab counts; heavy tab payloads load client-side
  const [
    teamResult,
    relationshipsResult,
    companyResult,
    borrowerResult,
    investorResult,
    sectionRowsResult,
    profileSectionRowsResult,
    allCompaniesResult,
    countActivities,
    countEmails,
    countTasks,
    countPipeline,
    countInvestorCommitments,
  ] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email").order("full_name"),
    admin
      .from("contact_relationship_types")
      .select("id, contact_id, relationship_type, is_active, lender_direction, vendor_type, notes, started_at, ended_at, created_at")
      .eq("contact_id", contact.id)
      .order("created_at", { ascending: false }),
    contact.company_id
      ? admin
          .from("companies")
          .select("id, company_number, name, company_type")
          .eq("id", contact.company_id)
          .single()
      : Promise.resolve({ data: null }),
    contact.borrower_id
      ? admin
          .from("borrowers")
          .select(
            "id, credit_score, credit_report_date, experience_count, date_of_birth, is_us_citizen, marital_status, ssn_last_four, stated_liquidity, verified_liquidity, stated_net_worth, verified_net_worth"
          )
          .eq("id", contact.borrower_id)
          .single()
      : Promise.resolve({ data: null }),
    contact.linked_investor_id
      ? admin
          .from("investors")
          .select("id, accreditation_status, accreditation_verified_at")
          .eq("id", contact.linked_investor_id)
          .single()
      : Promise.resolve({ data: null }),
    admin
      .from("page_layout_sections" as never)
      .select("section_key, display_order, is_visible, visibility_rule, section_type, section_label, section_icon" as never)
      .eq("page_type" as never, "contact_detail" as never)
      .eq("sidebar" as never, false as never)
      .order("display_order" as never, { ascending: true }),
    admin
      .from("page_layout_sections" as never)
      .select("id, section_key" as never)
      .eq("page_type" as never, "contact_detail" as never)
      .eq("section_type" as never, "fields" as never),
    supabase.from("companies").select("id, company_number, name, company_type").order("name"),
    supabase
      .from("crm_activities")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contact.id),
    admin
      .from("crm_emails")
      .select("id", { count: "exact", head: true })
      .eq("linked_contact_id", contact.id),
    admin
      .from("ops_tasks")
      .select("id", { count: "exact", head: true })
      .eq("linked_entity_type", "contact")
      .eq("linked_entity_id", contact.id),
    admin
      .from("deal_contacts")
      .select("id", { count: "exact", head: true })
      .eq("contact_id", contact.id),
    contact.linked_investor_id
      ? admin
          .from("investor_commitments")
          .select("id", { count: "exact", head: true })
          .eq("investor_id", contact.linked_investor_id)
      : Promise.resolve({ count: 0 }),
  ]);

  const tabCounts: Contact360TabCounts = {
    activities: countActivities.count ?? 0,
    emails: countEmails.count ?? 0,
    tasks: countTasks.count ?? 0,
    loans: 0,
    pipelineDeals: countPipeline.count ?? 0,
    investorCommitments: countInvestorCommitments.count ?? 0,
  };

  // Build profile lookup for display names
  const profileLookup: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null; email: string | null }) => {
      profileLookup[t.id] = t.full_name || t.email || "Unknown";
    }
  );

  const teamMembers: TeamMember[] = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
    })
  );

  // Map relationships
  const relationships: RelationshipData[] = (
    relationshipsResult.data ?? []
  ).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    contact_id: r.contact_id as string,
    relationship_type: r.relationship_type as string,
    is_active: r.is_active as boolean | null,
    lender_direction: r.lender_direction as string | null,
    vendor_type: r.vendor_type as string | null,
    notes: r.notes as string | null,
    started_at: r.started_at as string | null,
    ended_at: r.ended_at as string | null,
    created_at: r.created_at as string,
  }));

  // Build profiles list for TaskSheet
  const profiles: Profile[] = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
      avatar_url: null,
    })
  );

  // Determine active relationship types
  const activeRelTypes = relationships
    .filter((r) => r.is_active)
    .map((r) => r.relationship_type);

  // Borrower / investor profile rows only (loans, entities, commitments load client-side)
  let borrowerData: BorrowerData | null = null;
  if (activeRelTypes.includes("borrower") && contact.borrower_id && borrowerResult.data) {
    const b = borrowerResult.data;
    borrowerData = {
      id: b.id,
      credit_score: b.credit_score,
      credit_report_date: b.credit_report_date,
      experience_count: b.experience_count,
      date_of_birth: b.date_of_birth,
      is_us_citizen: b.is_us_citizen,
      marital_status: b.marital_status,
      ssn_last_four: b.ssn_last_four,
      stated_liquidity: b.stated_liquidity,
      verified_liquidity: b.verified_liquidity,
      stated_net_worth: b.stated_net_worth,
      verified_net_worth: b.verified_net_worth,
    };
  }

  let investorProfile: InvestorProfileData | null = null;
  if (activeRelTypes.includes("investor") && contact.linked_investor_id && investorResult.data) {
    investorProfile = {
      id: investorResult.data.id,
      accreditation_status: investorResult.data.accreditation_status,
      accreditation_verified_at: investorResult.data.accreditation_verified_at,
    };
  }

  // Map layout config from parallel results
  const sectionOrder: SectionLayout[] = (sectionRowsResult.data ?? []).map(
    (r: Record<string, unknown>) => ({
      section_key: r.section_key as string,
      display_order: r.display_order as number,
      is_visible: r.is_visible as boolean,
      visibility_rule: r.visibility_rule as string | null,
      section_type: (r.section_type as string) ?? "fields",
      section_label: (r.section_label as string) ?? (r.section_key as string),
      section_icon: (r.section_icon as string) ?? "file-text",
    })
  );

  const sectionIdToKey: Record<string, string> = {};
  const sectionIds: string[] = [];
  for (const row of (profileSectionRowsResult.data ?? []) as Record<string, unknown>[]) {
    sectionIdToKey[row.id as string] = row.section_key as string;
    sectionIds.push(row.id as string);
  }

  // Module -> source_object_key mapping (which DB table owns fields for each module)
  const MODULE_TO_SOURCE: Record<string, string> = {
    contact_profile: "contact",
    borrower_profile: "borrower",
    investor_profile: "investor",
    borrower_entity: "borrower_entity",
  };

  // Fetch page_layout_fields with field_configurations for profile sections
  const sectionFields: Record<string, FieldLayout[]> = {};
  if (sectionIds.length > 0) {
    const { data: fieldRows } = await admin
      .from("page_layout_fields" as never)
      .select("id, field_key, display_order, column_position, column_span, is_visible, section_id, field_config_id, source_object_key" as never)
      .in("section_id" as never, sectionIds as never)
      .order("display_order" as never, { ascending: true });

    // Collect field_config_ids to fetch labels/types/module
    const fcIds = ((fieldRows ?? []) as Record<string, unknown>[])
      .map((r) => r.field_config_id as string)
      .filter(Boolean);

    let fcLookup: Record<string, { field_label: string; field_type: string; dropdown_options: unknown; module: string; conditional_rules: unknown; permissions: unknown; is_required: boolean; formula_expression: string | null; formula_output_format: string | null; formula_decimal_places: number | null }> = {};
    if (fcIds.length > 0) {
      const { data: fcRows } = await admin
        .from("field_configurations" as never)
        .select("id, field_label, field_type, dropdown_options, module, conditional_rules, permissions, is_required, formula_expression, formula_output_format, formula_decimal_places" as never)
        .in("id" as never, fcIds as never);

      for (const fc of (fcRows ?? []) as Record<string, unknown>[]) {
        fcLookup[fc.id as string] = {
          field_label: fc.field_label as string,
          field_type: fc.field_type as string,
          dropdown_options: fc.dropdown_options,
          module: fc.module as string,
          conditional_rules: fc.conditional_rules,
          permissions: fc.permissions,
          is_required: (fc.is_required as boolean) ?? false,
          formula_expression: (fc.formula_expression as string | null) ?? null,
          formula_output_format: (fc.formula_output_format as string | null) ?? null,
          formula_decimal_places: (fc.formula_decimal_places as number | null) ?? null,
        };
      }
    }

    // Group by section_key
    for (const row of (fieldRows ?? []) as Record<string, unknown>[]) {
      const sectionKey = sectionIdToKey[row.section_id as string];
      if (!sectionKey) continue;
      const fc = fcLookup[row.field_config_id as string];
      if (!fc) continue;

      const rawOpts = fc.dropdown_options;
      let dropdownOptions: { label: string; value: string }[] | null = null;
      if (Array.isArray(rawOpts)) {
        dropdownOptions = rawOpts.map((v: unknown) =>
          typeof v === "string"
            ? { label: v.charAt(0).toUpperCase() + v.slice(1).replace(/_/g, " "), value: v }
            : (v as { label: string; value: string })
        );
      }

      // Resolve source_object_key: prefer stored value, fall back to module mapping
      const sourceObjectKey = (row.source_object_key as string | null) ?? MODULE_TO_SOURCE[fc.module] ?? "contact";

      if (!sectionFields[sectionKey]) sectionFields[sectionKey] = [];
      sectionFields[sectionKey].push({
        id: row.id as string,
        field_config_id: row.field_config_id as string | null,
        field_key: row.field_key as string,
        field_label: fc.field_label,
        field_type: fc.field_type,
        column_position: row.column_position as string,
        column_span: (row.column_span as string) ?? "half",
        display_order: row.display_order as number,
        is_visible: row.is_visible as boolean,
        is_required: fc.is_required,
        dropdown_options: dropdownOptions,
        source_object_key: sourceObjectKey,
        conditional_rules: fc.conditional_rules as FieldLayout["conditional_rules"],
        permissions: fc.permissions as FieldLayout["permissions"],
        formula_expression: fc.formula_expression,
        formula_output_format: fc.formula_output_format,
        formula_decimal_places: fc.formula_decimal_places,
      });
    }
  }

  const company: CompanyData | null = companyResult.data
    ? {
        id: companyResult.data.id,
        company_number: companyResult.data.company_number,
        name: companyResult.data.name,
        company_type: companyResult.data.company_type,
      }
    : null;

  const allCompanies: CompanyData[] = (allCompaniesResult.data ?? []).map(
    (c: { id: string; company_number: string; name: string; company_type: string | null }) => ({
      id: c.id,
      company_number: c.company_number,
      name: c.name,
      company_type: c.company_type,
    })
  );

  const currentUserName = profileLookup[user.id] || user.email || "Unknown";

  const assignedToName = contact.assigned_to
    ? profileLookup[contact.assigned_to] || null
    : null;

  const sourceLabel = contact.source
    ? CRM_CONTACT_SOURCES.find(
        (s) => s.value === contact.source
      )?.label || contact.source
    : null;

  // Map contact to our typed shape
  const contactData: ContactData = {
    id: contact.id,
    contact_number: contact.contact_number,
    first_name: contact.first_name,
    last_name: contact.last_name,
    email: contact.email,
    phone: contact.phone,
    company_name: contact.company_name,
    company_id: contact.company_id,
    source: contact.source,
    assigned_to: contact.assigned_to,
    next_follow_up_date: contact.next_follow_up_date,
    last_contacted_at: contact.last_contacted_at,
    marketing_consent: contact.marketing_consent,
    created_at: contact.created_at,
    updated_at: contact.updated_at,
    lifecycle_stage: contact.lifecycle_stage,
    dnc: contact.dnc,
    address_line1: contact.address_line1,
    address_line2: contact.address_line2 ?? null,
    city: contact.city,
    state: contact.state,
    zip: contact.zip,
    country: contact.country ?? null,
    user_id: contact.user_id,
    borrower_id: contact.borrower_id,
    linked_investor_id: contact.linked_investor_id,
    notes: contact.notes,
    contact_types: contact.contact_types ?? null,
    rating: contact.rating ?? null,
    status: contact.status ?? null,
    user_function: contact.user_function ?? null,
    language_preference: contact.language_preference ?? null,
  };

  return (
    <ContactDetailClient
      contact={contactData}
      relationships={relationships}
      tabCounts={tabCounts}
      teamMembers={teamMembers}
      profiles={profiles}
      company={company}
      allCompanies={allCompanies}
      borrower={borrowerData}
      investor={investorProfile}
      currentUserId={user.id}
      currentUserName={currentUserName}
      assignedToName={assignedToName}
      sourceLabel={sourceLabel}
      isSuperAdmin={isSuperAdmin}
      userRole={userRole}
      sectionOrder={sectionOrder}
      sectionFields={sectionFields}
    />
  );
}
