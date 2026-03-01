import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { CrmTabs, type CrmContactRow } from "@/components/crm/crm-tabs";

export const dynamic = "force-dynamic";

export default async function CrmPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all data in parallel
  const [contactsResult, teamResult, activitiesResult, investorsResult, borrowersResult] =
    await Promise.all([
      supabase
        .from("crm_contacts")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("role", "admin")
        .order("full_name"),
      supabase.from("crm_activities").select("contact_id"),
      admin
        .from("investors")
        .select("id, accreditation_status"),
      admin
        .from("borrowers")
        .select("id, credit_score, experience_count"),
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

  // Build investor lookup: investor_id → accreditation_status
  const investorLookup: Record<string, string | null> = {};
  (investorsResult.data ?? []).forEach(
    (inv: { id: string; accreditation_status: string | null }) => {
      investorLookup[inv.id] = inv.accreditation_status;
    }
  );

  // Build borrower lookup: borrower_id → { credit_score, experience_count }
  const borrowerLookup: Record<
    string,
    { credit_score: number | null; experience_count: number | null }
  > = {};
  (borrowersResult.data ?? []).forEach(
    (b: {
      id: string;
      credit_score: number | null;
      experience_count: number | null;
    }) => {
      borrowerLookup[b.id] = {
        credit_score: b.credit_score,
        experience_count: b.experience_count,
      };
    }
  );

  // Build enriched contact rows
  const contactRows: CrmContactRow[] = contacts.map((c: any) => {
    const borrowerData = c.borrower_id
      ? borrowerLookup[c.borrower_id]
      : null;
    return {
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone,
      company_name: c.company_name,
      contact_type: c.contact_type,
      source: c.source,
      status: c.status,
      assigned_to_name: c.assigned_to
        ? profileLookup[c.assigned_to] || null
        : null,
      next_follow_up_date: c.next_follow_up_date,
      last_contacted_at: c.last_contacted_at,
      created_at: c.created_at,
      activity_count: activityCounts[c.id] ?? 0,
      // Enriched FK fields
      linked_investor_id: c.linked_investor_id,
      borrower_id: c.borrower_id,
      accreditation_status: c.linked_investor_id
        ? investorLookup[c.linked_investor_id] ?? null
        : null,
      credit_score: borrowerData?.credit_score ?? null,
      experience_count: borrowerData?.experience_count ?? null,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM"
        description="Manage contacts, investors, borrowers, and leads."
      />

      <CrmTabs
        contacts={contactRows}
        teamMembers={teamMembers}
        currentUserId={user.id}
      />
    </div>
  );
}
