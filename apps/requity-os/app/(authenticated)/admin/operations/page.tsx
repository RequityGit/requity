import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { OperationsView } from "@/components/operations/OperationsView";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [projectsRes, tasksRes, membersRes, rolesRes, taskNoteCountsRes, projectNoteCountsRes, approvalsRes] = await Promise.all([
    supabase
      .from("ops_projects")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("ops_tasks")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .order("full_name"),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id),
    admin
      .from("notes" as never)
      .select("task_id" as never)
      .not("task_id" as never, "is", null)
      .is("deleted_at" as never, null),
    admin
      .from("notes" as never)
      .select("project_id" as never)
      .not("project_id" as never, "is", null)
      .is("deleted_at" as never, null),
    admin
      .from("approval_requests" as never)
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const projects = projectsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const teamMembers = (membersRes.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string | null }) => ({
      id: t.id,
      full_name: t.full_name || t.email || "Unknown",
    })
  );

  const roles = (rolesRes.data ?? []).map((r: { role: string }) => r.role);
  const isSuperAdmin = roles.includes("super_admin");

  // Build note count maps from unified notes table
  const taskCommentCounts: Record<string, number> = {};
  for (const row of (taskNoteCountsRes.data ?? []) as Array<{ task_id: string }>) {
    taskCommentCounts[row.task_id] = (taskCommentCounts[row.task_id] ?? 0) + 1;
  }

  const projectCommentCounts: Record<string, number> = {};
  for (const row of (projectNoteCountsRes.data ?? []) as Array<{ project_id: string }>) {
    projectCommentCounts[row.project_id] = (projectCommentCounts[row.project_id] ?? 0) + 1;
  }

  // Enrich approvals with submitter names
  const rawApprovals = (approvalsRes.data ?? []) as Array<Record<string, unknown>>;
  const approvalUserIds = new Set<string>();
  rawApprovals.forEach((a) => {
    if (a.submitted_by) approvalUserIds.add(a.submitted_by as string);
    if (a.assigned_to) approvalUserIds.add(a.assigned_to as string);
  });

  let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};
  if (approvalUserIds.size > 0) {
    const { data: profiles } = await admin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", Array.from(approvalUserIds));
    (profiles ?? []).forEach((p: { id: string; full_name: string | null; email: string | null }) => {
      profileMap[p.id] = { full_name: p.full_name, email: p.email };
    });
  }

  const approvals = rawApprovals.map((a) => ({
    id: a.id as string,
    entity_type: a.entity_type as string,
    entity_id: a.entity_id as string,
    status: a.status as string,
    priority: a.priority as string,
    submitted_by: a.submitted_by as string,
    assigned_to: a.assigned_to as string,
    submission_notes: (a.submission_notes as string) ?? null,
    decision_notes: (a.decision_notes as string) ?? null,
    deal_snapshot: (a.deal_snapshot as Record<string, unknown>) ?? {},
    sla_deadline: (a.sla_deadline as string) ?? null,
    sla_breached: (a.sla_breached as boolean) ?? false,
    created_at: a.created_at as string,
    submitter_name: profileMap[a.submitted_by as string]?.full_name || profileMap[a.submitted_by as string]?.email || null,
    approver_name: profileMap[a.assigned_to as string]?.full_name || profileMap[a.assigned_to as string]?.email || null,
  }));

  return (
    <OperationsView
      projects={projects}
      tasks={tasks}
      teamMembers={teamMembers}
      currentUserId={user.id}
      isSuperAdmin={isSuperAdmin}
      taskCommentCounts={taskCommentCounts}
      projectCommentCounts={projectCommentCounts}
      approvals={approvals}
    />
  );
}
