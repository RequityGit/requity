import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

/**
 * POST /api/cron/task-due-reminders
 *
 * Runs once daily. Creates notifications for:
 * - task_due_soon: tasks due tomorrow
 * - task_overdue: tasks past due that are not complete
 *
 * Idempotent: checks if a notification was already created today
 * for the same task+slug to avoid duplicates.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split("T")[0]; // YYYY-MM-DD

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  // Start of today for dedup check
  const todayStart = today.toISOString();

  try {
    // 1. Find tasks due tomorrow (not complete, has assignee)
    const { data: dueSoonTasks } = await supabase
      .from("ops_tasks" as never)
      .select("id, title, assigned_to, created_by, priority" as never)
      .eq("due_date" as never, tomorrowStr as never)
      .neq("status" as never, "Complete" as never)
      .not("assigned_to" as never, "is" as never, null as never);

    // 2. Find overdue tasks (due_date < today, not complete)
    const { data: overdueTasks } = await supabase
      .from("ops_tasks" as never)
      .select("id, title, assigned_to, created_by, priority, due_date" as never)
      .lt("due_date" as never, todayStr as never)
      .neq("status" as never, "Complete" as never)
      .not("assigned_to" as never, "is" as never, null as never);

    // Get notification type IDs
    const { data: typeRows } = await supabase
      .from("notification_types" as never)
      .select("id, slug" as never)
      .in("slug" as never, ["task_due_soon", "task_overdue"] as never);

    const typeMap = new Map<string, string>();
    ((typeRows ?? []) as unknown as { id: string; slug: string }[]).forEach((t) => {
      typeMap.set(t.slug, t.id);
    });

    // Get existing notifications created today to avoid duplicates
    const { data: existingRows } = await supabase
      .from("notifications" as never)
      .select("entity_id, notification_slug" as never)
      .in("notification_slug" as never, ["task_due_soon", "task_overdue"] as never)
      .gte("created_at" as never, todayStart as never);

    const existing = new Set<string>();
    ((existingRows ?? []) as unknown as { entity_id: string; notification_slug: string }[]).forEach((e) => {
      existing.add(`${e.notification_slug}:${e.entity_id}`);
    });

    type DueSoonTask = { id: string; title: string; assigned_to: string; created_by: string | null; priority: string };
    type OverdueTask = DueSoonTask & { due_date: string };

    const inserts: Record<string, unknown>[] = [];

    // Due soon notifications
    const dueSoonList: DueSoonTask[] = (dueSoonTasks ?? []) as unknown as DueSoonTask[];
    for (let i = 0; i < dueSoonList.length; i++) {
      const task = dueSoonList[i];
      if (existing.has(`task_due_soon:${task.id}`)) continue;

      inserts.push({
        user_id: task.assigned_to,
        notification_type_id: typeMap.get("task_due_soon") || null,
        notification_slug: "task_due_soon",
        title: `"${task.title.slice(0, 60)}" is due tomorrow`,
        body: "This task is due tomorrow. Make sure it is on track.",
        priority: task.priority === "High" ? "high" : "normal",
        entity_type: "task",
        entity_id: task.id,
        entity_label: task.title,
        action_url: `/tasks?task=${task.id}`,
        email_sent: false,
      });
    }

    // Overdue notifications
    const overdueList: OverdueTask[] = (overdueTasks ?? []) as unknown as OverdueTask[];
    for (let i = 0; i < overdueList.length; i++) {
      const task = overdueList[i];
      if (existing.has(`task_overdue:${task.id}`)) continue;

      // Notify assignee
      inserts.push({
        user_id: task.assigned_to,
        notification_type_id: typeMap.get("task_overdue") || null,
        notification_slug: "task_overdue",
        title: `"${task.title.slice(0, 60)}" is overdue`,
        body: `This task was due on ${task.due_date} and is now overdue.`,
        priority: "high",
        entity_type: "task",
        entity_id: task.id,
        entity_label: task.title,
        action_url: `/tasks?task=${task.id}`,
        email_sent: false,
      });

      // Also notify creator if different from assignee
      if (task.created_by && task.created_by !== task.assigned_to) {
        inserts.push({
          user_id: task.created_by,
          notification_type_id: typeMap.get("task_overdue") || null,
          notification_slug: "task_overdue",
          title: `"${task.title.slice(0, 60)}" is overdue`,
          body: `This task was due on ${task.due_date} and is now overdue.`,
          priority: "high",
          entity_type: "task",
          entity_id: task.id,
          entity_label: task.title,
          action_url: `/tasks?task=${task.id}`,
          email_sent: false,
        });
      }
    }

    if (inserts.length > 0) {
      const { error: insertErr } = await supabase
        .from("notifications" as never)
        .insert(inserts as never);

      if (insertErr) {
        console.error("[task-due-reminders] Insert error:", insertErr);
        return NextResponse.json({ error: insertErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: true,
      dueSoon: (dueSoonTasks ?? []).length,
      overdue: (overdueTasks ?? []).length,
      notificationsCreated: inserts.length,
    });
  } catch (err) {
    console.error("[task-due-reminders] Unexpected error:", err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
