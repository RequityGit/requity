import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WorkflowTaskBoard } from "@/components/tasks/workflow-task-board";
import type { WorkflowTask, TaskProfile } from "@/lib/workflow-tasks";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [tasksRes, profilesRes] = await Promise.all([
    admin
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .not("full_name", "is", null)
      .order("full_name"),
  ]);

  const tasks = (tasksRes.data ?? []) as unknown as WorkflowTask[];
  const profiles: TaskProfile[] = (profilesRes.data ?? []).map(
    (p: {
      id: string;
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    }) => ({
      id: p.id,
      full_name: p.full_name || p.email || "Unknown",
      avatar_url: p.avatar_url,
    })
  );

  return (
    <WorkflowTaskBoard
      initialTasks={tasks}
      profiles={profiles}
      currentUserId={user.id}
    />
  );
}
