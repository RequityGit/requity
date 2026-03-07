"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Calendar, Check, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PriorityDot } from "./priority-dot";
import { AnimatedTask } from "./animated-task";
import type { OpsTask } from "@/lib/tasks";
import { isDueOverdue, completeTask, completeRecurringTask } from "@/lib/tasks";
import { useToast } from "@/components/ui/use-toast";

interface DashboardTaskRowProps {
  task: OpsTask;
  onComplete: (taskId: string) => void;
}

function DashboardTaskRow({ task, onComplete }: DashboardTaskRowProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const overdue = isDueOverdue(task.due_date);

  const handleCheckbox = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCompleting) return;
      setIsCompleting(true);
    },
    [isCompleting]
  );

  const handleCollapseComplete = useCallback(() => {
    onComplete(task.id);
  }, [onComplete, task.id]);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const dueLabel = !task.due_date
    ? null
    : task.due_date === today
      ? "Today"
      : task.due_date === tomorrow
        ? "Tomorrow"
        : new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });

  return (
    <AnimatedTask
      isCompleting={isCompleting}
      onCollapseComplete={handleCollapseComplete}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors">
        <button
          type="button"
          onClick={handleCheckbox}
          className={cn(
            "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border-2 transition-all duration-150",
            isCompleting
              ? "border-green-600 bg-green-600"
              : "border-border hover:border-muted-foreground"
          )}
        >
          {isCompleting && (
            <Check className="h-3 w-3 text-white" strokeWidth={3} />
          )}
        </button>

        <PriorityDot priority={task.priority} />

        <span
          className={cn(
            "text-[13px] font-medium flex-1 truncate",
            isCompleting && "line-through opacity-60"
          )}
        >
          {task.title}
        </span>

        {dueLabel && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs shrink-0 num",
              overdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" strokeWidth={1.5} />
            {dueLabel}
          </span>
        )}
      </div>
    </AnimatedTask>
  );
}

interface DashboardTasksProps {
  tasks: OpsTask[];
  currentUserId: string;
}

export function DashboardTasks({ tasks: initialTasks, currentUserId }: DashboardTasksProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const { toast } = useToast();

  const openTasks = tasks
    .filter(
      (t) =>
        t.status !== "Complete" &&
        t.assigned_to === currentUserId
    )
    .sort((a, b) => {
      // Due date ascending (nulls last), then priority
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      if (a.due_date && b.due_date) {
        const cmp = a.due_date.localeCompare(b.due_date);
        if (cmp !== 0) return cmp;
      }
      const prio = { High: 0, Medium: 1, Low: 2 };
      return (prio[a.priority as keyof typeof prio] ?? 1) - (prio[b.priority as keyof typeof prio] ?? 1);
    });

  const today = new Date().toISOString().slice(0, 10);
  const pastDueCount = openTasks.filter(
    (t) => t.due_date && t.due_date < today
  ).length;

  const handleComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, status: "Complete", completed_at: new Date().toISOString() }
            : t
        )
      );

      const result = task.is_active_recurrence
        ? await completeRecurringTask(taskId)
        : await completeTask(taskId);

      const hasError = "error" in result && result.error;
      if (hasError) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
        toast({
          title: "Failed to complete task",
          description: String(hasError),
          variant: "destructive",
        });
      }
    },
    [tasks, toast]
  );

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Your Tasks
          </span>
          <span className="text-[11px] font-semibold text-muted-foreground/60 num">
            {openTasks.length}
          </span>
        </div>
      </div>

      {/* Past due banner */}
      <div
        className={cn(
          "flex items-center gap-2 rounded-md px-3 py-2 mb-3 text-[12px] font-semibold",
          pastDueCount > 0
            ? "bg-destructive/10 text-destructive"
            : "bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400"
        )}
      >
        <span className="num">{pastDueCount}</span>
        {pastDueCount === 0
          ? "past due \u2014 you're all caught up"
          : `past due task${pastDueCount > 1 ? "s" : ""}`}
      </div>

      {/* Task rows */}
      {openTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CheckCircle2
            className="h-10 w-10 text-green-500 mb-3"
            strokeWidth={1.5}
          />
          <p className="text-sm font-medium text-foreground">
            You&apos;re all caught up. Nice work.
          </p>
        </div>
      ) : (
        <div className="space-y-0.5">
          {openTasks.map((task) => (
            <DashboardTaskRow
              key={task.id}
              task={task}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
