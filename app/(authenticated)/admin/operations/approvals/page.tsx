import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApprovalsListView } from "@/components/approvals/approvals-list-view";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all approvals
  const { data: approvals } = await admin
    .from("approval_requests" as any)
    .select("*")
    .order("created_at", { ascending: false });

  // Gather profile info for submitters and approvers
  const userIds = new Set<string>();
  (approvals ?? []).forEach((a: any) => {
    userIds.add(a.submitted_by);
    userIds.add(a.assigned_to);
  });

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email")
    .in("id", Array.from(userIds));

  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
  (profiles ?? []).forEach((p: { id: string; full_name: string | null; email: string | null }) => {
    profileMap[p.id] = { full_name: p.full_name, email: p.email };
  });

  const enrichedApprovals = (approvals ?? []).map((a: any) => ({
    ...a,
    submitter_name: profileMap[a.submitted_by]?.full_name || profileMap[a.submitted_by]?.email || "Unknown",
    approver_name: profileMap[a.assigned_to]?.full_name || profileMap[a.assigned_to]?.email || "Unknown",
  }));

  // Check user roles
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isSuperAdmin = (roles ?? []).some((r: { role: string }) => r.role === "super_admin");

  return (
    <ApprovalsListView
      approvals={enrichedApprovals}
      currentUserId={user.id}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
