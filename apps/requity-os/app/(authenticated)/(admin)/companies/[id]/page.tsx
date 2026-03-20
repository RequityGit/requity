import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import { CompanyDetailClient } from "@/components/crm/company-360/company-detail-client";
import type {
  CompanyDetailData,
  CompanyContactData,
  CompanyActivityData,
  CompanyFileData,
  CompanyTaskData,
  CompanyNoteData,
  CompanyWireData,
  CompanyFollowerData,
  CompanyDealData,
  CompanyQuoteData,
  TabBadgeCounts,
} from "@/components/crm/company-360/types";
import type {
  SectionLayout,
  FieldLayout,
} from "@/components/crm/contact-360/types";

interface PageProps {
  params: { id: string };
}

export const dynamic = "force-dynamic";

export default async function CompanyDetailPage({ params }: PageProps) {
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

  const { id: companyNumber } = await params;
  const admin = createAdminClient();

  // Fetch company by company_number
  const { data: company } = await admin
    .from("companies")
    .select("*")
    .eq("company_number", companyNumber)
    .single();

  if (!company) notFound();

  // Fetch all related data in parallel (profiles + tab data + layout config)
  const [
    profilesResult,
    contactsResult,
    primaryContactResult,
    activitiesResult,
    filesResult,
    tasksResult,
    notesResult,
    wireResult,
    followersResult,
    sectionRowsResult,
  ] = await Promise.all([
    // Profiles for lookup
    admin
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .order("full_name"),
    // Contacts
    admin
      .from("crm_contacts")
      .select(
        "id, contact_number, first_name, last_name, email, phone, user_function, last_contacted_at"
      )
      .eq("company_id", company.id)
      .is("deleted_at", null)
      .order("first_name"),
    // Primary contact
    company.primary_contact_id
      ? admin
          .from("crm_contacts")
          .select("id, first_name, last_name, email, phone, user_function")
          .eq("id", company.primary_contact_id)
          .single()
      : Promise.resolve({ data: null }),
    // Activities
    admin
      .from("crm_activities")
      .select("*")
      .eq("company_id", company.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    // Files
    admin
      .from("company_files")
      .select("*")
      .eq("company_id", company.id)
      .order("uploaded_at", { ascending: false }),
    // Tasks
    admin
      .from("ops_tasks")
      .select("*")
      .eq("linked_entity_type", "company")
      .eq("linked_entity_id", company.id)
      .order("created_at", { ascending: false }),
    // Notes (from unified notes table)
    admin
      .from("notes" as never)
      .select("*" as never)
      .eq("company_id" as never, company.id as never)
      .is("deleted_at" as never, null)
      .order("is_pinned" as never, { ascending: false })
      .order("created_at" as never, { ascending: false }),
    // Wire instructions
    admin
      .from("company_wire_instructions")
      .select("*")
      .eq("company_id", company.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Followers
    admin
      .from("crm_followers")
      .select("id, user_id")
      .eq("company_id", company.id),
    // Layout config
    admin
      .from("page_layout_sections" as never)
      .select("id, section_key, display_order, is_visible, visibility_rule" as never)
      .eq("page_type" as never, "company_detail" as never)
      .eq("sidebar" as never, false as never)
      .order("display_order" as never, { ascending: true }),
  ]);

  // Build profile lookup
  const profileLookup: Record<string, string> = {};
  const teamMembers: { id: string; full_name: string }[] = [];
  (profilesResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null; email: string | null }) => {
      const displayName = t.full_name || t.email || "Unknown";
      profileLookup[t.id] = displayName;
      teamMembers.push({ id: t.id, full_name: displayName });
    }
  );

  // Map contacts
  const contacts: CompanyContactData[] = (contactsResult.data ?? []).map(
    (c: Record<string, unknown>) => ({
      id: c.id as string,
      contact_number: c.contact_number as string,
      first_name: c.first_name as string | null,
      last_name: c.last_name as string | null,
      email: c.email as string | null,
      phone: c.phone as string | null,
      user_function: c.user_function as string | null,
      last_contacted_at: c.last_contacted_at as string | null,
      is_primary: c.id === company.primary_contact_id,
    })
  );

  // Map primary contact info
  const primaryContact = primaryContactResult.data
    ? {
        id: primaryContactResult.data.id as string,
        first_name: primaryContactResult.data.first_name as string | null,
        last_name: primaryContactResult.data.last_name as string | null,
        user_function: primaryContactResult.data.user_function as string | null,
      }
    : null;

  // Map activities
  const activities: CompanyActivityData[] = (activitiesResult.data ?? []).map(
    (a: Record<string, unknown>) => ({
      id: a.id as string,
      activity_type: a.activity_type as string,
      subject: a.subject as string | null,
      description: a.description as string | null,
      direction: (a.direction as string | null) ?? null,
      call_duration_seconds: (a.call_duration_seconds as number | null) ?? null,
      performed_by_name: a.performed_by
        ? (a.performed_by_name as string | null) ||
          profileLookup[a.performed_by as string] ||
          null
        : null,
      created_at: a.created_at as string,
    })
  );

  // Map files
  const files: CompanyFileData[] = (filesResult.data ?? []).map(
    (f: Record<string, unknown>) => ({
      id: f.id as string,
      file_name: f.file_name as string,
      file_type: f.file_type as string,
      file_size: f.file_size as number | null,
      mime_type: f.mime_type as string | null,
      storage_path: f.storage_path as string,
      uploaded_by_name: f.uploaded_by
        ? profileLookup[f.uploaded_by as string] || null
        : null,
      uploaded_at: f.uploaded_at as string | null,
      notes: f.notes as string | null,
    })
  );

  // Map tasks
  const tasks: CompanyTaskData[] = (tasksResult.data ?? []).map(
    (t: Record<string, unknown>) => ({
      id: t.id as string,
      subject: (t.title as string) || "",
      description: t.description as string | null,
      task_type: (t.category as string) || "other",
      priority: (t.priority as string) || "Medium",
      status: t.status === "Complete" ? "completed" : t.status === "In Progress" ? "in_progress" : "not_started",
      due_date: t.due_date as string | null,
      assigned_to: t.assigned_to as string | null,
      assigned_to_name: t.assigned_to
        ? profileLookup[t.assigned_to as string] || null
        : null,
      completed_at: t.completed_at as string | null,
    })
  );

  // Map notes
  const notes: CompanyNoteData[] = (notesResult.data ?? []).map(
    (n: Record<string, unknown>) => ({
      id: n.id as string,
      body: (n.body as string) || "",
      author_name: n.author_id
        ? profileLookup[n.author_id as string] || null
        : null,
      author_id: n.author_id as string | null,
      is_pinned: (n.is_pinned as boolean) || false,
      created_at: n.created_at as string,
    })
  );

  // Map wire instructions
  const wireInstructions: CompanyWireData | null = wireResult.data
    ? {
        id: wireResult.data.id,
        bank_name: wireResult.data.bank_name,
        account_name: wireResult.data.account_name,
        account_number: wireResult.data.account_number,
        routing_number: wireResult.data.routing_number,
        wire_type: wireResult.data.wire_type,
        updated_at: wireResult.data.updated_at,
        updated_by: wireResult.data.updated_by,
      }
    : null;

  // Map followers
  const followers: CompanyFollowerData[] = (followersResult.data ?? []).map(
    (f: Record<string, unknown>) => ({
      id: f.id as string,
      user_id: f.user_id as string,
      user_name: profileLookup[f.user_id as string] || null,
    })
  );

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

  // Build section_id → section_key lookup for sections that have field-level layout
  const fieldSectionKeys = ["company_information", "address", "wire_instructions"];
  const sectionIdToKey: Record<string, string> = {};
  const sectionIds: string[] = [];
  for (const row of (sectionRowsResult.data ?? []) as Record<string, unknown>[]) {
    if (fieldSectionKeys.includes(row.section_key as string)) {
      sectionIdToKey[row.id as string] = row.section_key as string;
      sectionIds.push(row.id as string);
    }
  }

  // Fetch page_layout_fields with field_configurations for relevant sections
  const sectionFields: Record<string, FieldLayout[]> = {};
  if (sectionIds.length > 0) {
    const { data: fieldRows } = await admin
      .from("page_layout_fields" as never)
      .select("id, field_key, display_order, column_position, column_span, is_visible, section_id, field_config_id, source_object_key" as never)
      .in("section_id" as never, sectionIds as never)
      .order("display_order" as never, { ascending: true });

    // Collect field_config_ids to fetch labels/types
    const fcIds = ((fieldRows ?? []) as Record<string, unknown>[])
      .map((r) => r.field_config_id as string)
      .filter(Boolean);

    let fcLookup: Record<string, { field_label: string; field_type: string; dropdown_options: unknown; conditional_rules: unknown; permissions: unknown; is_required: boolean; formula_expression: string | null; formula_output_format: string | null; formula_decimal_places: number | null }> = {};
    if (fcIds.length > 0) {
      const { data: fcRows } = await admin
        .from("field_configurations" as never)
        .select("id, field_label, field_type, dropdown_options, conditional_rules, permissions, is_required, formula_expression, formula_output_format, formula_decimal_places" as never)
        .in("id" as never, fcIds as never);

      for (const fc of (fcRows ?? []) as Record<string, unknown>[]) {
        fcLookup[fc.id as string] = {
          field_label: fc.field_label as string,
          field_type: fc.field_type as string,
          dropdown_options: fc.dropdown_options,
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

      if (!sectionFields[sectionKey]) sectionFields[sectionKey] = [];
      sectionFields[sectionKey].push({
        id: row.id as string,
        field_config_id: row.field_config_id as string | null,
        field_key: row.field_key as string,
        field_label: fc.field_label,
        field_type: fc.field_type,
        column_position: row.column_position as string,
        column_span: (row.column_span as string) ?? undefined,
        display_order: row.display_order as number,
        is_visible: row.is_visible as boolean,
        is_required: fc.is_required,
        dropdown_options: dropdownOptions,
        source_object_key: (row.source_object_key as string | null) ?? "company",
        conditional_rules: fc.conditional_rules as FieldLayout["conditional_rules"],
        permissions: fc.permissions as FieldLayout["permissions"],
        formula_expression: fc.formula_expression,
        formula_output_format: fc.formula_output_format,
        formula_decimal_places: fc.formula_decimal_places,
      });
    }
  }

  // Compute tab badge counts
  const openTasks = tasks.filter((t) => t.status !== "completed").length;
  const counts: TabBadgeCounts = {
    contacts: contacts.length,
    activities: activities.length,
    deals: 0, // Will be computed client-side or via a separate query
    files: files.length,
    openTasks,
    notes: notes.length,
  };

  // Map company data
  const companyData: CompanyDetailData = {
    id: company.id,
    name: company.name,
    company_type: company.company_type,
    company_types: (company as any).company_types ?? [company.company_type],
    company_subtype: company.company_subtype,
    phone: company.phone,
    email: company.email,
    website: company.website,
    address_line1: company.address_line1,
    address_line2: company.address_line2,
    city: company.city,
    state: company.state,
    zip: company.zip,
    country: company.country,
    is_active: company.is_active,
    primary_contact_id: company.primary_contact_id,
    referral_contact_id: company.referral_contact_id,
    notes: company.notes,
    created_at: company.created_at,
    updated_at: company.updated_at,
    lender_programs: company.lender_programs,
    asset_types: company.asset_types,
    geographies: company.geographies,
    company_capabilities: company.company_capabilities,
    other_names: company.other_names,
    source: company.source,
    title_company_verified: company.title_company_verified,
  };

  const currentUserName = profileLookup[user.id] || user.email || "Unknown";

  return (
    <CompanyDetailClient
      company={companyData}
      contacts={contacts}
      primaryContact={primaryContact}
      activities={activities}
      files={files}
      tasks={tasks}
      notes={notes}
      wireInstructions={wireInstructions}
      followers={followers}
      counts={counts}
      currentUserId={user.id}
      currentUserName={currentUserName}
      teamMembers={teamMembers}
      sectionOrder={sectionOrder}
      sectionFields={sectionFields}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
