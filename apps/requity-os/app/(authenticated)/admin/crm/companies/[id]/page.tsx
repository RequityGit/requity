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

  const { id } = await params;
  const admin = createAdminClient();

  // Fetch company
  const { data: company } = await admin
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) notFound();

  // Build profile lookup
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "admin")
    .order("full_name");

  const profileLookup: Record<string, string> = {};
  (profiles ?? []).forEach(
    (t: { id: string; full_name: string | null; email: string | null }) => {
      profileLookup[t.id] = t.full_name || t.email || "Unknown";
    }
  );

  // Fetch all related data in parallel
  const [
    contactsResult,
    primaryContactResult,
    activitiesResult,
    filesResult,
    tasksResult,
    notesResult,
    wireResult,
    followersResult,
  ] = await Promise.all([
    // Contacts
    admin
      .from("crm_contacts")
      .select(
        "id, first_name, last_name, email, phone, user_function, last_contacted_at"
      )
      .eq("company_id", id)
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
      .eq("company_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    // Files
    admin
      .from("company_files")
      .select("*")
      .eq("company_id", id)
      .order("uploaded_at", { ascending: false }),
    // Tasks
    admin
      .from("crm_tasks")
      .select("*")
      .eq("company_id", id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    // Notes (from unified notes table)
    admin
      .from("notes" as never)
      .select("*" as never)
      .eq("company_id" as never, id as never)
      .is("deleted_at" as never, null)
      .order("is_pinned" as never, { ascending: false })
      .order("created_at" as never, { ascending: false }),
    // Wire instructions
    admin
      .from("company_wire_instructions")
      .select("*")
      .eq("company_id", id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // Followers
    admin
      .from("crm_followers")
      .select("id, user_id")
      .eq("company_id", id),
  ]);

  // Map contacts
  const contacts: CompanyContactData[] = (contactsResult.data ?? []).map(
    (c: Record<string, unknown>) => ({
      id: c.id as string,
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
      subject: t.subject as string,
      description: t.description as string | null,
      task_type: (t.task_type as string) || "other",
      priority: (t.priority as string) || "normal",
      status: (t.status as string) || "not_started",
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
    fee_agreement_on_file: company.fee_agreement_on_file,
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
    nda_created_date: company.nda_created_date,
    nda_expiration_date: company.nda_expiration_date,
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
    />
  );
}
