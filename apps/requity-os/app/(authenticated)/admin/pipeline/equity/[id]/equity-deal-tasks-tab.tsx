"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Calendar,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Ban,
  User,
} from "lucide-react";
import {
  EQUITY_TASK_STATUSES,
  EQUITY_STAGE_LABELS,
} from "@/lib/constants";
import { updateEquityDealTask } from "./task-actions";
import { EquityTaskFormModal } from "./equity-task-form-modal";

export interface TaskProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface EquityDealTask {
  id: string;
  deal_id: string;
  template_item_id: string | null;
  task_name: string;
  description: string | null;
  category: string | null;
  required_stage: string | null;
  status: string;
  responsible_party: string | null;
  assigned_to: string | null;
  due_date: string | null;
  completed_at: string | null;
  completed_by: string | null;
  is_critical_path: boolean;
  sort_order: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
  assigned_to_profile?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
  } | null;
}

interface EquityDealTasksTabProps {
  initialTasks: EquityDealTask[];
  dealId: string;
  dealStage: string;
  profiles: TaskProfile[];
  currentUserId: string;
}

const STATUS_CYCLE = ["not_started", "in_progress", "completed"] as const;

const STATUS_CONFIG: Record<
  string,
  { color: string; bgColor: string; label: string }
> = {
  not_started: {
    color: "text-slate-400",
    bgColor: "bg-slate-400",
    label: "Not Started",
  },
  in_progress: {
    color: "text-blue-500",
    bgColor: "bg-blue-500",
    label: "In Progress",
  },
  completed: {
    color: "text-green-500",
    bgColor: "bg-green-500",
    label: "Completed",
  },
  blocked: {
    color: "text-red-500",
    bgColor: "bg-red-500",
    label: "Blocked",
  },
  waived: {
    color: "text-slate-300",
    bgColor: "bg-slate-300",
    label: "Waived",
  },
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function DueTag({ date }: { date: string | null }) {
  if (!date) return null;
  const d = new Date(date + "T00:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - now.getTime()) / 86400000);
  const colorClass =
    diff < 0
      ? "text-red-400"
      : diff <= 2
        ? "text-amber-400"
        : "text-muted-foreground";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-medium num",
        colorClass
      )}
    >
      <Calendar className="h-[11px] w-[11px]" strokeWidth={1.5} />
      {d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      {diff < 0 && " — overdue"}
    </span>
  );
}

export function EquityDealTasksTab({
  initialTasks,
  dealId,
  dealStage,
  profiles,
  currentUserId,
}: EquityDealTasksTabProps) {
  const [tasks, setTasks] = useState<EquityDealTask[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<EquityDealTask | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set()
  );
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`equity-tasks-${dealId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "equity_deal_tasks",
          filter: `deal_id=eq.${dealId}`,
        },
        async (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            // Re-fetch with profile join
            const { data } = await supabase
              .from("equity_deal_tasks")
              .select(
                "*, assigned_to_profile:profiles!equity_deal_tasks_assigned_to_fkey(id, full_name, avatar_url)"
              )
              .eq("id", (payload.new as EquityDealTask).id)
              .single();

            if (data) {
              setTasks((prev) => {
                const existing = prev.find((t) => t.id === data.id);
                if (existing) {
                  return prev.map((t) =>
                    t.id === data.id ? (data as EquityDealTask) : t
                  );
                }
                return [...prev, data as EquityDealTask];
              });
            }
          } else if (payload.eventType === "DELETE") {
            setTasks((prev) =>
              prev.filter(
                (t) => t.id !== (payload.old as { id: string }).id
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [dealId]);

  // Status cycling: click to advance not_started -> in_progress -> completed
  const handleStatusCycle = useCallback(
    async (task: EquityDealTask, e: React.MouseEvent) => {
      e.stopPropagation();

      // Only cycle for main statuses, not blocked/waived
      const currentIdx = STATUS_CYCLE.indexOf(
        task.status as (typeof STATUS_CYCLE)[number]
      );
      if (currentIdx === -1) return;

      const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: nextStatus,
                updated_at: new Date().toISOString(),
                completed_at:
                  nextStatus === "completed"
                    ? new Date().toISOString()
                    : null,
                completed_by:
                  nextStatus === "completed" ? currentUserId : null,
              }
            : t
        )
      );

      const updatePayload: Record<string, unknown> = {
        status: nextStatus,
      };
      if (nextStatus === "completed") {
        updatePayload.completed_at = new Date().toISOString();
        updatePayload.completed_by = currentUserId;
      } else {
        updatePayload.completed_at = null;
        updatePayload.completed_by = null;
      }

      const result = await updateEquityDealTask(task.id, updatePayload);
      if (result.error) {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? task : t))
        );
        toast({
          title: "Failed to update task",
          description: result.error,
          variant: "destructive",
        });
      }
    },
    [currentUserId, toast]
  );

  const handleTaskSaved = useCallback((savedTask: EquityDealTask) => {
    setTasks((prev) => {
      const existing = prev.find((t) => t.id === savedTask.id);
      if (existing) {
        return prev.map((t) =>
          t.id === savedTask.id ? savedTask : t
        );
      }
      return [...prev, savedTask];
    });
  }, []);

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const toggleCategory = useCallback((cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }, []);

  // Separate open/terminal tasks
  const openTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.status !== "completed" && t.status !== "waived"
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    [tasks]
  );

  const terminalTasks = useMemo(
    () =>
      tasks
        .filter(
          (t) =>
            t.status === "completed" || t.status === "waived"
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    [tasks]
  );

  // Group open tasks by category
  const groupedOpenTasks = useMemo(() => {
    const groups: Record<string, EquityDealTask[]> = {};
    for (const t of openTasks) {
      const cat = t.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    return groups;
  }, [openTasks]);

  const categoryOrder = [
    "Due Diligence",
    "Legal",
    "Financing",
    "Operations",
    "Closing",
    "Uncategorized",
  ];
  const sortedCategories = Object.keys(groupedOpenTasks).sort(
    (a, b) =>
      (categoryOrder.indexOf(a) === -1 ? 99 : categoryOrder.indexOf(a)) -
      (categoryOrder.indexOf(b) === -1 ? 99 : categoryOrder.indexOf(b))
  );

  const completedCount = tasks.filter(
    (t) => t.status === "completed"
  ).length;
  const totalCount = tasks.length;

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">
            <span className="num">
              {completedCount}/{totalCount}
            </span>{" "}
            complete
          </span>
        </div>
        <Button size="sm" onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
          Add task
        </Button>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No tasks yet for this deal.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowNewModal(true)}
          >
            <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
            Add first task
          </Button>
        </div>
      )}

      {/* Open tasks grouped by category */}
      {sortedCategories.map((cat) => {
        const catTasks = groupedOpenTasks[cat];
        const isCollapsed = collapsedCategories.has(cat);
        return (
          <div key={cat}>
            <button
              onClick={() => toggleCategory(cat)}
              className="flex items-center gap-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0"
            >
              {isCollapsed ? (
                <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
              {cat}
              <span className="num text-muted-foreground/60">
                {catTasks.length}
              </span>
            </button>
            {!isCollapsed && (
              <div className="space-y-1">
                {catTasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    profiles={profiles}
                    onStatusCycle={handleStatusCycle}
                    onClick={() => setEditingTask(task)}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Completed/Waived section */}
      {terminalTasks.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted((p) => !p)}
            className="flex items-center gap-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0 p-0"
          >
            {showCompleted ? (
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
            Completed
            <span className="num text-muted-foreground/60">
              {terminalTasks.length}
            </span>
          </button>
          {showCompleted && (
            <div className="space-y-1">
              {terminalTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  profiles={profiles}
                  onStatusCycle={handleStatusCycle}
                  onClick={() => setEditingTask(task)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showNewModal && (
        <EquityTaskFormModal
          task={null}
          dealId={dealId}
          dealStage={dealStage}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setShowNewModal(false)}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
        />
      )}
      {editingTask && (
        <EquityTaskFormModal
          task={editingTask}
          dealId={dealId}
          dealStage={dealStage}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setEditingTask(null)}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}

// --- TaskRow component ---

function TaskRow({
  task,
  profiles,
  onStatusCycle,
  onClick,
}: {
  task: EquityDealTask;
  profiles: TaskProfile[];
  onStatusCycle: (task: EquityDealTask, e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const config = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.not_started;
  const isTerminal = task.status === "completed" || task.status === "waived";
  const isBlocked = task.status === "blocked";

  const assignee =
    task.assigned_to_profile ??
    (task.assigned_to
      ? profiles.find((p) => p.id === task.assigned_to) ?? null
      : null);
  const assigneeName = assignee?.full_name ?? null;

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-accent/50",
        isBlocked && "border-red-500/30 bg-red-500/5",
        isTerminal && "opacity-60"
      )}
    >
      {/* Status indicator — clickable to cycle */}
      <button
        onClick={(e) => onStatusCycle(task, e)}
        className={cn(
          "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
          task.status === "completed"
            ? "border-green-500 bg-green-500"
            : task.status === "blocked"
              ? "border-red-500"
              : task.status === "waived"
                ? "border-slate-300 bg-slate-300"
                : task.status === "in_progress"
                  ? "border-blue-500"
                  : "border-slate-300"
        )}
        title={`Status: ${config.label}. Click to advance.`}
      >
        {task.status === "completed" && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        )}
        {task.status === "in_progress" && (
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        )}
        {task.status === "blocked" && (
          <Ban className="h-3 w-3 text-red-500" strokeWidth={2} />
        )}
        {task.status === "waived" && (
          <span className="text-[8px] font-bold text-white">W</span>
        )}
      </button>

      {/* Task name + badges */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[13px] font-medium leading-snug truncate",
              isTerminal && "line-through"
            )}
          >
            {task.task_name}
          </span>
          {task.is_critical_path && (
            <AlertTriangle
              className="h-3.5 w-3.5 text-amber-500 flex-shrink-0"
              strokeWidth={1.5}
            />
          )}
          {isBlocked && (
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 border-red-500/50 text-red-500"
            >
              Blocked
            </Badge>
          )}
        </div>
        {/* Meta row */}
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          {task.required_stage && (
            <span className="text-[10px] text-muted-foreground/70 bg-secondary rounded px-1.5 py-0.5">
              {EQUITY_STAGE_LABELS[task.required_stage] ??
                task.required_stage}
            </span>
          )}
          {task.responsible_party && (
            <span className="text-[10px] text-muted-foreground/70 bg-secondary rounded px-1.5 py-0.5">
              {task.responsible_party}
            </span>
          )}
        </div>
      </div>

      {/* Right side: assignee, due date */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {assigneeName && (
          <div className="flex items-center gap-1.5">
            <div className="w-[20px] h-[20px] rounded-md bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-semibold flex-shrink-0">
              {getInitials(assigneeName)}
            </div>
            <span className="text-[11px] text-muted-foreground hidden sm:inline">
              {assigneeName}
            </span>
          </div>
        )}
        <DueTag date={task.due_date} />
      </div>
    </div>
  );
}
