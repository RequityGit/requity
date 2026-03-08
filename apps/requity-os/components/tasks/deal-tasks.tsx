"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Check,
  Calendar,
  ChevronRight,
  CheckCircle2,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriorityDot } from "./priority-dot";
import { AnimatedTask } from "./animated-task";
import { TaskSheet } from "./task-sheet";
import { relativeTime } from "@/lib/comment-utils";
import type { OpsTask, Profile } from "@/lib/tasks";
import {
  getInitials,
  isDueOverdue,
  completeTask,
  completeRecurringTask,
} from "@/lib/tasks";
import { useToast } from "@/components/ui/use-toast";

interface DealTaskRowProps {
  task: OpsTask;
  profiles: Profile[];
  onComplete: (taskId: string) => void;
  onClick: (task: OpsTask) => void;
}

function DealTaskRow({ task, profiles, onComplete, onClick }: DealTaskRowProps) {
  const [isCompleting, setIsCompleting] = useState(false);
  const overdue = isDueOverdue(task.due_date);
  const assignee = task.assigned_to
    ? profiles.find((p) => p.id === task.assigned_to)
    : null;
  const assigneeName = assignee?.full_name || task.assigned_to_name || null;

  const handleCheckbox = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isCompleting) return;
      setIsCompleting(true);
    },
    [isCompleting]
  );

  return (
    <AnimatedTask
      isCompleting={isCompleting}
      onCollapseComplete={() => onComplete(task.id)}
    >
      <div
        onClick={() => !isCompleting && onClick(task)}
        className="flex items-center gap-2.5 px-3 py-2.5 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
      >
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
            "text-sm font-medium flex-1 line-clamp-2",
            isCompleting && "line-through opacity-60"
          )}
        >
          {task.title}
        </span>

        {assigneeName && (
          <div className="w-5 h-5 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-semibold flex-shrink-0">
            {getInitials(assigneeName)}
          </div>
        )}

        {task.due_date && (
          <span
            className={cn(
              "flex items-center gap-1 text-xs shrink-0 num",
              overdue ? "text-destructive font-medium" : "text-muted-foreground"
            )}
          >
            <Calendar className="h-3 w-3" strokeWidth={1.5} />
            {new Date(task.due_date + "T00:00:00").toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>
    </AnimatedTask>
  );
}

interface DealTasksProps {
  dealId: string;
  dealLabel: string;
  dealEntityType?: string;
  tasks: OpsTask[];
  profiles: Profile[];
  currentUserId: string;
}

export function DealTasks({
  dealId,
  dealLabel,
  dealEntityType = "loan",
  tasks: initialTasks,
  profiles,
  currentUserId,
}: DealTasksProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showCompleted, setShowCompleted] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null);
  const { toast } = useToast();

  const openTasks = tasks
    .filter((t) => t.status !== "Complete")
    .sort((a, b) => {
      const prio = { High: 0, Medium: 1, Low: 2 };
      const prioCmp =
        (prio[a.priority as keyof typeof prio] ?? 1) -
        (prio[b.priority as keyof typeof prio] ?? 1);
      if (prioCmp !== 0) return prioCmp;
      if (a.due_date && !b.due_date) return -1;
      if (!a.due_date && b.due_date) return 1;
      if (a.due_date && b.due_date) return a.due_date.localeCompare(b.due_date);
      return 0;
    });

  const completedTasks = tasks
    .filter((t) => t.status === "Complete")
    .sort((a, b) => {
      const aTime = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bTime = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bTime - aTime;
    });

  const handleComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

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

  const handleTaskClick = useCallback((task: OpsTask) => {
    setEditingTask(task);
    setSheetOpen(true);
  }, []);

  const handleNewTask = useCallback(() => {
    setEditingTask(null);
    setSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setEditingTask(null);
  }, []);

  const handleTaskSaved = useCallback((savedTask: OpsTask) => {
    setTasks((prev) => {
      const existing = prev.find((t) => t.id === savedTask.id);
      if (existing) {
        return prev.map((t) => (t.id === savedTask.id ? savedTask : t));
      }
      return [...prev, savedTask];
    });
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">Tasks</span>
          <span className="text-[11px] font-semibold text-muted-foreground/60 num">
            {openTasks.length}
          </span>
        </div>
        <Button onClick={handleNewTask} size="sm" variant="outline">
          <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
          Add task
        </Button>
      </div>

      {/* Open tasks */}
      {openTasks.length === 0 && completedTasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <ListChecks
            className="h-8 w-8 text-muted-foreground/30 mb-2"
            strokeWidth={1.5}
          />
          <p className="text-sm text-muted-foreground">No tasks for this deal</p>
          <Button
            onClick={handleNewTask}
            size="sm"
            variant="outline"
            className="mt-3"
          >
            <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
            Add first task
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-0.5">
            {openTasks.map((task) => (
              <DealTaskRow
                key={task.id}
                task={task}
                profiles={profiles}
                onComplete={handleComplete}
                onClick={handleTaskClick}
              />
            ))}
          </div>

          {/* Completed section */}
          {completedTasks.length > 0 && (
            <div className="mt-4">
              <div className="h-px bg-border mb-3" />
              <button
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex items-center gap-2 text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    showCompleted && "rotate-90"
                  )}
                  strokeWidth={1.5}
                />
                <span className="num">{completedTasks.length}</span>
                completed
                <CheckCircle2
                  className="h-3.5 w-3.5 text-green-500"
                  strokeWidth={1.5}
                />
              </button>
              {showCompleted && (
                <div className="mt-2 space-y-0.5">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] bg-green-600">
                        <Check
                          className="h-3 w-3 text-white"
                          strokeWidth={3}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground line-through flex-1 line-clamp-2">
                        {task.title}
                      </span>
                      {task.completed_at && (
                        <span className="text-[11px] text-muted-foreground/60 num">
                          {relativeTime(task.completed_at)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}

      <TaskSheet
        open={sheetOpen}
        task={editingTask}
        profiles={profiles}
        currentUserId={currentUserId}
        onClose={handleSheetClose}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
        defaultLinkedEntity={{
          type: dealEntityType,
          id: dealId,
          label: dealLabel,
        }}
      />
    </div>
  );
}
