import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CrmContactList, type CrmContactRow } from "@/components/crm/crm-tabs";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
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

  const admin = createAdminClient();

  // Fetch all data in parallel
  const [
    contactsResult,
    teamResult,
    activitiesResult,
    relationshipsResult,
    companiesResult,
  ] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .order("full_name"),
    supabase.from("crm_activities").select("contact_id"),
    admin
      .from("contact_relationship_types")
      .select("contact_id, relationship_type, is_active, lender_direction, vendor_type")
      .eq("is_active", true),
    admin
      .from("companies")
      .select("id, name")
      .eq("is_active", true),
  ]);

  const contacts = contactsResult.data ?? [];
  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
    })
  );

  // Build profiles lookup for assigned_to names
  const profileLookup: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null; email: string | null }) => {
      profileLookup[t.id] = t.full_name || t.email || "Unknown";
    }
  );

  // Count activities per contact
  const activityCounts: Record<string, number> = {};
  (activitiesResult.data ?? []).forEach((a: { contact_id: string }) => {
    activityCounts[a.contact_id] = (activityCounts[a.contact_id] ?? 0) + 1;
  });

  // Build relationships lookup: contact_id → relationship_type[]
  const relationshipsLookup: Record<string, string[]> = {};
  (relationshipsResult.data ?? []).forEach(
    (r: { contact_id: string; relationship_type: string; is_active: boolean | null }) => {
      if (!relationshipsLookup[r.contact_id]) {
        relationshipsLookup[r.contact_id] = [];
      }
      relationshipsLookup[r.contact_id].push(r.relationship_type);
    }
  );

  // Build companies lookup: id → name
  const companyLookup: Record<string, string> = {};
  (companiesResult.data ?? []).forEach(
    (c: { id: string; name: string }) => {
      companyLookup[c.id] = c.name;
    }
  );

  // Build enriched contact rows
  const contactRows: CrmContactRow[] = contacts.map((c: any) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    phone: c.phone,
    company_name: c.company_id
      ? companyLookup[c.company_id] || c.company_name
      : c.company_name,
    company_id: c.company_id,
    lifecycle_stage: c.lifecycle_stage,
    dnc: c.dnc ?? false,
    source: c.source,
    assigned_to_name: c.assigned_to
      ? profileLookup[c.assigned_to] || null
      : null,
    next_follow_up_date: c.next_follow_up_date,
    last_contacted_at: c.last_contacted_at,
    created_at: c.created_at,
    activity_count: activityCounts[c.id] ?? 0,
    relationships: relationshipsLookup[c.id] ?? [],
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Manage contacts, relationships, and pipeline."
      />

      <CrmContactList
        contacts={contactRows}
        teamMembers={teamMembers}
        currentUserId={user.id}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
