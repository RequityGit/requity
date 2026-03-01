import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OperationsView } from "@/components/operations/OperationsView";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [projectsRes, tasksRes, membersRes, rolesRes, taskCommentCountsRes, projectCommentCountsRes] = await Promise.all([
    supabase
      .from("ops_projects")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("ops_tasks")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .order("full_name"),
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id),
    supabase
      .from("ops_task_comments")
      .select("task_id"),
    supabase
      .from("ops_project_comments")
      .select("project_id"),
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

  // Build comment count maps
  const taskCommentCounts: Record<string, number> = {};
  for (const row of taskCommentCountsRes.data ?? []) {
    taskCommentCounts[row.task_id] = (taskCommentCounts[row.task_id] ?? 0) + 1;
  }

  const projectCommentCounts: Record<string, number> = {};
  for (const row of projectCommentCountsRes.data ?? []) {
    projectCommentCounts[row.project_id] = (projectCommentCounts[row.project_id] ?? 0) + 1;
  }

  return (
    <OperationsView
      projects={projects}
      tasks={tasks}
      teamMembers={teamMembers}
      currentUserId={user.id}
      isSuperAdmin={isSuperAdmin}
      taskCommentCounts={taskCommentCounts}
      projectCommentCounts={projectCommentCounts}
    />
  );
}
