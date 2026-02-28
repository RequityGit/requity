import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OperationsView } from "@/components/operations/OperationsView";
import type { OpsProject, OpsTask } from "@/components/operations/ProjectCard";

export const dynamic = "force-dynamic";

export default async function OperationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const [projectsRes, tasksRes, membersRes] = await Promise.all([
    supabase
      .from("ops_projects" as never)
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("ops_tasks" as never)
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "admin")
      .order("full_name"),
  ]);

  const projects = (projectsRes.data ?? []) as unknown as OpsProject[];
  const tasks = (tasksRes.data ?? []) as unknown as OpsTask[];
  const teamMembers = (membersRes.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string }) => ({
      id: t.id,
      full_name: t.full_name || t.email,
    })
  );

  return <OperationsView projects={projects} tasks={tasks} teamMembers={teamMembers} />;
}
