import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/shared/page-header";
import { DialerListsPage } from "@/components/dialer/DialerListsPage";
import type { DialerList } from "@/lib/dialer/types";

export const dynamic = "force-dynamic";

export default async function DialerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [listsResult, teamResult] = await Promise.all([
    supabase
      .from("dialer_lists")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("role", "admin")
      .order("full_name"),
  ]);

  const lists = (listsResult.data ?? []) as unknown as DialerList[];
  const teamMembers = (teamResult.data ?? []).map(
    (t: { id: string; full_name: string | null }) => ({
      id: t.id,
      full_name: t.full_name || "Unknown",
    })
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Power Dialer"
        description="Manage dialer lists and run triple-line dialing sessions."
      />
      <DialerListsPage lists={lists} teamMembers={teamMembers} />
    </div>
  );
}
