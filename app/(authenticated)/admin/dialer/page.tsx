import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DialerListsPage } from "@/components/dialer/DialerListsPage";
import { createDialerListAction } from "./actions";
import type { DialerList } from "@/lib/dialer/types";

export const dynamic = "force-dynamic";

export default async function DialerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch lists and team members in parallel
  const [listsResult, teamResult] = await Promise.all([
    admin
      .from("dialer_lists")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .order("full_name"),
  ]);

  const rawLists = listsResult.data ?? [];
  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
    })
  );

  // Build lookup for assigned_to names
  const profileLookup: Record<string, string> = {};
  (teamResult.data ?? []).forEach(
    (t: { id: string; full_name: string | null; email: string | null }) => {
      profileLookup[t.id] = t.full_name || t.email || "Unknown";
    }
  );

  const lists: DialerList[] = rawLists.map((l: Record<string, unknown>) => ({
    ...l,
    assigned_to_name: l.assigned_to
      ? profileLookup[l.assigned_to as string] || null
      : null,
    created_by_name: l.created_by
      ? profileLookup[l.created_by as string] || null
      : null,
  })) as DialerList[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Power Dialer"
        description="Manage dialer lists and run outbound calling sessions."
      />
      <DialerListsPage
        lists={lists}
        teamMembers={teamMembers}
        currentUserId={user.id}
        onCreateList={createDialerListAction}
      />
    </div>
  );
}
