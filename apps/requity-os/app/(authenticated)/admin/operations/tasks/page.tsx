import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { TaskBoard } from "@/components/tasks/task-board";
import type { OpsTask, Profile } from "@/lib/tasks";
import type { RecurringTaskTemplate } from "@/lib/recurring-templates";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [tasksRes, profilesRes, templatesRes] = await Promise.all([
    admin
      .from("ops_tasks")
      .select("*")
      .order("created_at", { ascending: false }),
    admin
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .not("full_name", "is", null)
      .order("full_name"),
    admin
      .from("recurring_task_templates" as never)
      .select("*" as never)
      .order("title" as never),
  ]);

  const tasks = (tasksRes.data ?? []) as unknown as OpsTask[];
  const profiles: Profile[] = (profilesRes.data ?? []).map(
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
  const templates = (templatesRes.data ?? []) as unknown as RecurringTaskTemplate[];

  return (
    <TaskBoard
      initialTasks={tasks}
      initialTemplates={templates}
      profiles={profiles}
      currentUserId={user.id}
    />
  );
}
