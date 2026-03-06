import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApprovalsCardView } from "./approvals-card-view";

export const dynamic = "force-dynamic";

export default async function ApprovalsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Fetch all approvals and all profiles in parallel
  const [approvalsRes, allProfilesRes, rolesRes] = await Promise.all([
    admin
      .from("approval_requests" as never)
      .select("*" as never)
      .order("created_at" as never, { ascending: false }),
    admin
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .not("full_name", "is", null)
      .order("full_name"),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id),
  ]);

  const rawApprovals = ((approvalsRes as { data: Record<string, unknown>[] | null }).data ?? []);

  // Build profile map
  const profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
  const profiles = (allProfilesRes.data ?? []).map(
    (p: { id: string; full_name: string | null; email: string | null; avatar_url: string | null }) => {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
      return {
        id: p.id,
        full_name: p.full_name || p.email || "Unknown",
        avatar_url: p.avatar_url,
      };
    }
  );

  const enrichedApprovals = rawApprovals.map((a) => ({
    id: a.id as string,
    entity_type: a.entity_type as string,
    entity_id: a.entity_id as string,
    status: a.status as string,
    priority: (a.priority as string) || "normal",
    submitted_by: a.submitted_by as string,
    assigned_to: a.assigned_to as string,
    submission_notes: (a.submission_notes as string) ?? null,
    decision_notes: (a.decision_notes as string) ?? null,
    deal_snapshot: (a.deal_snapshot as Record<string, unknown>) ?? {},
    sla_deadline: (a.sla_deadline as string) ?? null,
    sla_breached: (a.sla_breached as boolean) ?? false,
    decision_at: (a.decision_at as string) ?? null,
    created_at: a.created_at as string,
    updated_at: a.updated_at as string,
    submitter_name:
      profileMap[a.submitted_by as string]?.full_name ||
      profileMap[a.submitted_by as string]?.email ||
      "Unknown",
    approver_name:
      profileMap[a.assigned_to as string]?.full_name ||
      profileMap[a.assigned_to as string]?.email ||
      "Unknown",
  }));

  const isSuperAdmin = (rolesRes.data ?? []).some(
    (r: { role: string }) => r.role === "super_admin"
  );

  return (
    <ApprovalsCardView
      approvals={enrichedApprovals}
      profiles={profiles}
      currentUserId={user.id}
      isSuperAdmin={isSuperAdmin}
    />
  );
}
