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

  const [projectsRes, tasksRes] = await Promise.all([
    supabase
      .from("ops_projects" as never)
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("ops_tasks" as never)
      .select("*")
      .order("created_at", { ascending: false }),
  ]);

  const projects = (projectsRes.data ?? []) as unknown as OpsProject[];
  const tasks = (tasksRes.data ?? []) as unknown as OpsTask[];

  return <OperationsView projects={projects} tasks={tasks} />;
}
