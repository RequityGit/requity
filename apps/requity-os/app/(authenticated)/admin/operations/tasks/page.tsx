import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { TasksBoard, type OpsTask } from "./tasks-board";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  const [tasksRes, profilesRes, taskCommentCountsRes, attachmentCountsRes] =
    await Promise.all([
      supabase
        .from("ops_tasks")
        .select("*")
        .order("sort_order", { ascending: true }),
      admin
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .not("full_name", "is", null)
        .order("full_name"),
      supabase.from("ops_task_comments").select("task_id"),
      admin
        .from("ops_task_attachments" as never)
        .select("task_id" as never) as never,
    ]);

  const tasks = (tasksRes.data ?? []) as unknown as OpsTask[];
  const profiles = (profilesRes.data ?? []).map(
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

  // Build comment count map
  const commentCounts: Record<string, number> = {};
  for (const row of taskCommentCountsRes.data ?? []) {
    commentCounts[row.task_id] =
      (commentCounts[row.task_id] ?? 0) + 1;
  }

  // Build attachment count map
  const attachmentCounts: Record<string, number> = {};
  const attData = (attachmentCountsRes as { data: { task_id: string }[] | null }).data ?? [];
  for (const row of attData) {
    attachmentCounts[row.task_id] =
      (attachmentCounts[row.task_id] ?? 0) + 1;
  }

  return (
    <TasksBoard
      initialTasks={tasks}
      profiles={profiles}
      currentUserId={user.id}
      commentCounts={commentCounts}
      attachmentCounts={attachmentCounts}
    />
  );
}
