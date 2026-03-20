import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DialerListBuilder } from "@/components/dialer/DialerListBuilder";

export const dynamic = "force-dynamic";

export default async function NewDialerListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [contactsResult, teamResult] = await Promise.all([
    supabase
      .from("crm_contacts")
      .select(
        "id, first_name, last_name, phone, email, company_name, source, dnc, lifecycle_stage, last_contacted_at"
      )
      .is("deleted_at", null)
      .order("last_name"),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
  ]);

  const contacts = (contactsResult.data ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    first_name: c.first_name as string | null,
    last_name: c.last_name as string | null,
    phone: c.phone as string | null,
    email: c.email as string | null,
    company_name: c.company_name as string | null,
    source: c.source as string | null,
    dnc: c.dnc as boolean | null,
    lifecycle_stage: c.lifecycle_stage as string | null,
    last_contacted_at: c.last_contacted_at as string | null,
  }));

  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name || "Unknown",
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Create Dialer List"
        description="Select contacts and configure dialer settings for a new calling session."
      />
      <DialerListBuilder
        contacts={contacts}
        teamMembers={teamMembers}
        currentUserId={user.id}
      />
    </div>
  );
}
