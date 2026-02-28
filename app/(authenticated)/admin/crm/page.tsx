import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CrmContactList, type CrmContactRow } from "@/components/crm/crm-contact-list";
import { CrmStats } from "@/components/crm/crm-stats";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch contacts and team members in parallel
  const [contactsResult, teamResult, activitiesResult] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .order("full_name"),
    supabase
      .from("crm_activities")
      .select("contact_id"),
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
  (activitiesResult.data ?? []).forEach(
    (a: { contact_id: string }) => {
      activityCounts[a.contact_id] = (activityCounts[a.contact_id] ?? 0) + 1;
    }
  );

  // Build contact rows
  const contactRows: CrmContactRow[] = contacts.map((c: any) => ({
    id: c.id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: c.email,
    phone: c.phone,
    company_name: c.company_name,
    contact_type: c.contact_type,
    source: c.source,
    status: c.status,
    assigned_to_name: c.assigned_to ? profileLookup[c.assigned_to] || null : null,
    next_follow_up_date: c.next_follow_up_date,
    last_contacted_at: c.last_contacted_at,
    created_at: c.created_at,
    activity_count: activityCounts[c.id] ?? 0,
  }));

  // Compute stats
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalContacts = contacts.length;
  const activeLeads = contacts.filter(
    (c: any) =>
      ["lead", "prospect"].includes(c.contact_type) &&
      ["active", "nurturing", "qualified"].includes(c.status)
  ).length;
  const followUpsDue = contacts.filter((c: any) => {
    if (!c.next_follow_up_date) return false;
    const due = new Date(c.next_follow_up_date);
    due.setHours(0, 0, 0, 0);
    return due <= now && c.status !== "converted" && c.status !== "inactive";
  }).length;
  const convertedThisMonth = contacts.filter((c: any) => {
    if (c.status !== "converted") return false;
    const updated = new Date(c.updated_at);
    return updated >= monthStart;
  }).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Manage leads, contacts, and interactions."
        action={
          <AddContactDialog
            teamMembers={teamMembers}
            currentUserId={user.id}
          />
        }
      />

      <CrmStats
        totalContacts={totalContacts}
        activeLeads={activeLeads}
        followUpsDue={followUpsDue}
        convertedThisMonth={convertedThisMonth}
      />

      <CrmContactList contacts={contactRows} />
    </div>
  );
}
