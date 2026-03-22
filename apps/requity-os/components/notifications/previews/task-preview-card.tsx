"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Circle, Clock, AlertTriangle, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import type { Notification } from "@/lib/notifications";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface TaskPreviewCardProps {
  notification: Notification;
  activeRole: string;
  onNavigate: () => void;
}

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string | null;
  due_date: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  project_id: string | null;
}

const STATUS_CONFIG: Record<
  string,
  { icon: typeof Circle; label: string; color: string }
> = {
  todo: { icon: Circle, label: "To Do", color: "text-muted-foreground" },
  in_progress: {
    icon: Clock,
    label: "In Progress",
    color: "text-blue-500",
  },
  done: {
    icon: CheckCircle2,
    label: "Done",
    color: "text-emerald-500",
  },
  blocked: {
    icon: AlertTriangle,
    label: "Blocked",
    color: "text-red-500",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function TaskPreviewCard({
  notification,
  activeRole,
  onNavigate,
}: TaskPreviewCardProps) {
  const [task, setTask] = useState<TaskData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!notification.entity_id) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    supabase
      .from("ops_tasks")
      .select("id, title, description, status, priority, due_date, assigned_to, assigned_to_name, project_id")
      .eq("id", notification.entity_id)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setTask(data as TaskData);
        }
        setLoading(false);
      });
  }, [notification.entity_id]);

  if (loading) {
    return (
      <div className="p-5 space-y-4">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-16 w-full rounded-md" />
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (!task) {
    // Fallback to notification body
    return (
      <div className="p-5 space-y-3">
        <h3 className="text-sm font-semibold">{notification.title}</h3>
        {notification.body && (
          <p className="text-sm text-muted-foreground">{notification.body}</p>
        )}
        <button
          onClick={onNavigate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground/[0.06] text-[11px] font-medium text-foreground hover:bg-foreground/10 rq-transition"
        >
          Go to Task
          <ExternalLink className="h-3 w-3" />
        </button>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.todo;
  const StatusIcon = statusConfig.icon;
  const isOverdue =
    task.due_date && task.status !== "done" && new Date(task.due_date) < new Date();

  return (
    <div className="p-5 space-y-4">
      {/* Task title */}
      <h3 className="text-sm font-semibold text-foreground">{task.title}</h3>

      {/* Status + assignee + due date */}
      <div className="flex flex-wrap items-center gap-3">
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-md bg-foreground/[0.04]",
            statusConfig.color
          )}
        >
          <StatusIcon className="h-3 w-3" />
          {statusConfig.label}
        </span>

        {task.assigned_to_name && (
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5 rounded-md">
              <AvatarFallback className="rounded-md text-[8px] font-semibold bg-foreground/[0.06]">
                {getInitials(task.assigned_to_name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-[11px] text-muted-foreground">
              {task.assigned_to_name}
            </span>
          </div>
        )}

        {task.due_date && (
          <span
            className={cn(
              "text-[11px] font-medium",
              isOverdue ? "text-red-500" : "text-muted-foreground"
            )}
          >
            Due {formatDate(task.due_date)}
            {isOverdue && " (overdue)"}
          </span>
        )}
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-[12px] text-muted-foreground leading-relaxed line-clamp-4">
          {task.description}
        </p>
      )}

      {/* CTA */}
      <button
        onClick={onNavigate}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-foreground/[0.06] text-[11px] font-medium text-foreground hover:bg-foreground/10 rq-transition"
      >
        Go to Task
        <ExternalLink className="h-3 w-3" />
      </button>
    </div>
  );
}
