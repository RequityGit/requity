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

  const [projectsRes, tasksRes, membersRes] = await Promise.all([
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
  ]);

  const projects = projectsRes.data ?? [];
  const tasks = tasksRes.data ?? [];
  const teamMembers = (membersRes.data ?? []).map(
    (t: { id: string; full_name: string | null; email: string }) => ({
      id: t.id,
      full_name: t.full_name || t.email,
    })
  );

  return <OperationsView projects={projects} tasks={tasks} teamMembers={teamMembers} />;
}
