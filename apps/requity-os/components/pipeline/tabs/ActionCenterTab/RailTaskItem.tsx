"use client";

import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { showError } from "@/lib/toast";
import type { DealTask } from "./useActionCenterData";

interface RailTaskItemProps {
  task: DealTask;
  onToggle: (taskId: string, currentStatus: string) => Promise<{ error?: string; success?: boolean }>;
}

export function RailTaskItem({ task, onToggle }: RailTaskItemProps) {
  const isDone = task.status === "completed";
  const isOverdue =
    !isDone &&
    task.due_date &&
    new Date(task.due_date) < new Date();

  const handleToggle = async () => {
    const result = await onToggle(task.id, task.status);
    if (result.error) {
      showError("Could not update task", result.error);
    }
  };

  const priorityColors: Record<string, string> = {
    urgent: "text-red-600 dark:text-red-400",
    high: "text-amber-600 dark:text-amber-400",
    medium: "text-muted-foreground",
    low: "text-muted-foreground/60",
  };

  return (
    <div className="flex items-start gap-2.5 px-4 py-2 hover:bg-muted/30 rq-transition">
      {/* Checkbox */}
      <button
        onClick={handleToggle}
        className="mt-0.5 shrink-0 cursor-pointer bg-transparent border-0 p-0"
      >
        {isDone ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <Circle className="h-4 w-4 text-muted-foreground hover:text-foreground rq-transition" />
        )}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-[13px] leading-tight",
            isDone && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </span>
        <div className="flex items-center gap-2 mt-0.5">
          {task.due_date && (
            <span
              className={cn(
                "text-[11px] num",
                isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
              )}
            >
              {isOverdue && <AlertTriangle className="inline h-2.5 w-2.5 mr-0.5" />}
              {formatDate(task.due_date)}
            </span>
          )}
          {task.priority && task.priority !== "medium" && (
            <span className={cn("text-[10px] font-medium uppercase", priorityColors[task.priority])}>
              {task.priority}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
