"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Calendar,
  ChevronDown,
  ChevronRight,
  Trash2,
} from "lucide-react";
import {
  createDealTask,
  updateDealTask,
  deleteDealTask,
} from "../task-actions";
import type { TeamProfile } from "../DealDetail";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface DealTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  due_date: string | null;
  completed_at: string | null;
  category: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  linked_entity_label: string | null;
  sort_order: number;
  updated_at: string | null;
  created_at: string | null;
  created_by: string | null;
}

interface TasksTabProps {
  tasks: DealTask[];
  dealId: string;
  currentUserId: string;
  adminProfiles?: TeamProfile[];
}

const STATUS_CYCLE = ["To Do", "In Progress", "Complete"] as const;

const STATUS_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  "To Do": { color: "border-slate-300", label: "To Do" },
  "In Progress": { color: "border-blue-500", label: "In Progress" },
  Complete: { color: "border-green-500 bg-green-500", label: "Complete" },
  Blocked: { color: "border-red-500", label: "Blocked" },
};

const CATEGORIES = [
  "Borrower Documents",
  "Entity Documents",
  "Appraisal",
  "Title",
  "Insurance",
  "Underwriting",
  "Closing",
  "Post-Closing",
  "General",
] as const;

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

export function TasksTab({
  tasks: initialTasks,
  dealId,
  currentUserId,
  adminProfiles,
}: TasksTabProps) {
  const [tasks, setTasks] = useState<DealTask[]>(initialTasks);
  const [editingTask, setEditingTask] = useState<DealTask | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const { toast } = useToast();

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`deal-tasks-${dealId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newTask = payload.new as DealTask;
            if (
              newTask.linked_entity_type === "loan" &&
              newTask.linked_entity_id === dealId
            ) {
              setTasks((prev) => {
                if (prev.some((t) => t.id === newTask.id)) return prev;
                return [...prev, newTask];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as DealTask).id
                  ? (payload.new as DealTask)
                  : t
              )
            );
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

  const handleStatusCycle = useCallback(
    async (task: DealTask, e: React.MouseEvent) => {
      e.stopPropagation();
      const currentIdx = STATUS_CYCLE.indexOf(
        task.status as (typeof STATUS_CYCLE)[number]
      );
      if (currentIdx === -1) return;

      const nextStatus = STATUS_CYCLE[(currentIdx + 1) % STATUS_CYCLE.length];

      // Optimistic
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: nextStatus,
                updated_at: new Date().toISOString(),
                completed_at:
                  nextStatus === "Complete"
                    ? new Date().toISOString()
                    : null,
              }
            : t
        )
      );

      const updatePayload: Record<string, unknown> = { status: nextStatus };
      if (nextStatus === "Complete") {
        updatePayload.completed_at = new Date().toISOString();
      } else {
        updatePayload.completed_at = null;
      }

      const result = await updateDealTask(task.id, updatePayload);
      if (result.error) {
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
    [toast]
  );

  const handleTaskSaved = useCallback((savedTask: DealTask) => {
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

  const openTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== "Complete")
        .sort((a, b) => a.sort_order - b.sort_order),
    [tasks]
  );

  const completedTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status === "Complete")
        .sort((a, b) => a.sort_order - b.sort_order),
    [tasks]
  );

  // Group open tasks by category
  const groupedOpenTasks = useMemo(() => {
    const groups: Record<string, DealTask[]> = {};
    for (const t of openTasks) {
      const cat = t.category || "General";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(t);
    }
    return groups;
  }, [openTasks]);

  const sortedCategories = Object.keys(groupedOpenTasks).sort();

  const doneCount = tasks.filter((t) => t.status === "Complete").length;
  const totalCount = tasks.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          <span className="num">
            {doneCount}/{totalCount}
          </span>{" "}
          complete
        </span>
        <Button size="sm" onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
          Add task
        </Button>
      </div>

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">
            No tasks linked to this deal.
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

      {/* Open tasks by category */}
      {sortedCategories.map((cat) => {
        const catTasks = groupedOpenTasks[cat];
        return (
          <div key={cat}>
            <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {cat}
              <span className="num text-muted-foreground/60">
                {catTasks.length}
              </span>
            </div>
            <div className="space-y-1">
              {catTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  profiles={adminProfiles}
                  onStatusCycle={handleStatusCycle}
                  onClick={() => setEditingTask(task)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Completed section */}
      {completedTasks.length > 0 && (
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
              {completedTasks.length}
            </span>
          </button>
          {showCompleted && (
            <div className="space-y-1">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  profiles={adminProfiles}
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
        <DealTaskFormModal
          task={null}
          dealId={dealId}
          currentUserId={currentUserId}
          profiles={adminProfiles}
          onClose={() => setShowNewModal(false)}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
        />
      )}
      {editingTask && (
        <DealTaskFormModal
          task={editingTask}
          dealId={dealId}
          currentUserId={currentUserId}
          profiles={adminProfiles}
          onClose={() => setEditingTask(null)}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}

// --- TaskRow ---

function TaskRow({
  task,
  profiles,
  onStatusCycle,
  onClick,
}: {
  task: DealTask;
  profiles?: TeamProfile[];
  onStatusCycle: (task: DealTask, e: React.MouseEvent) => void;
  onClick: () => void;
}) {
  const isComplete = task.status === "Complete";
  const isBlocked = task.status === "Blocked";

  const assigneeName =
    task.assigned_to_name ??
    (task.assigned_to
      ? profiles?.find((p) => p.id === task.assigned_to)?.full_name ?? null
      : null);

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 cursor-pointer transition-colors hover:bg-accent/50",
        isBlocked && "border-red-500/30 bg-red-500/5",
        isComplete && "opacity-60"
      )}
    >
      {/* Status circle */}
      <button
        onClick={(e) => onStatusCycle(task, e)}
        className={cn(
          "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
          isComplete
            ? "border-green-500 bg-green-500"
            : isBlocked
              ? "border-red-500"
              : task.status === "In Progress"
                ? "border-blue-500"
                : "border-slate-300"
        )}
        title={`Status: ${task.status}. Click to advance.`}
      >
        {isComplete && (
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
        {task.status === "In Progress" && (
          <div className="h-2 w-2 rounded-full bg-blue-500" />
        )}
      </button>

      {/* Title + category */}
      <div className="flex-1 min-w-0">
        <span
          className={cn(
            "text-[13px] font-medium leading-snug truncate block",
            isComplete && "line-through"
          )}
        >
          {task.title}
        </span>
        {task.category && (
          <span className="text-[10px] text-muted-foreground/70 bg-secondary rounded px-1.5 py-0.5 mt-0.5 inline-block">
            {task.category}
          </span>
        )}
      </div>

      {/* Right side */}
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
        {task.priority && task.priority !== "Medium" && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px] px-1.5 py-0",
              task.priority === "High" || task.priority === "Urgent"
                ? "border-red-500/50 text-red-500"
                : "border-slate-400/50 text-slate-400"
            )}
          >
            {task.priority}
          </Badge>
        )}
      </div>
    </div>
  );
}

// --- DealTaskFormModal ---

function DealTaskFormModal({
  task,
  dealId,
  currentUserId,
  profiles,
  onClose,
  onSaved,
  onDeleted,
}: {
  task: DealTask | null;
  dealId: string;
  currentUserId: string;
  profiles?: TeamProfile[];
  onClose: () => void;
  onSaved: (task: DealTask) => void;
  onDeleted: (taskId: string) => void;
}) {
  const isNew = !task;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [status, setStatus] = useState(task?.status ?? "To Do");
  const [priority, setPriority] = useState(task?.priority ?? "Medium");
  const [category, setCategory] = useState(task?.category ?? "");

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const assigneeName =
      profiles?.find((p) => p.id === assignedTo)?.full_name ?? null;

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo || null,
      assigned_to_name: assigneeName,
      due_date: dueDate || null,
      status,
      priority,
      category: category || null,
    };

    if (status === "Complete" && task?.status !== "Complete") {
      payload.completed_at = new Date().toISOString();
    } else if (status !== "Complete") {
      payload.completed_at = null;
    }

    try {
      if (isNew) {
        payload.created_by = currentUserId;
        payload.sort_order = 0;
        const result = await createDealTask(dealId, payload);
        if (result.error) throw new Error(result.error);
        if (result.data) onSaved(result.data as DealTask);
      } else {
        const result = await updateDealTask(task.id, payload);
        if (result.error) throw new Error(result.error);
        if (result.data) onSaved(result.data as DealTask);
      }
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Failed to save task",
        description: (err as Error).message,
        variant: "destructive",
      });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!task) return;
    const result = await deleteDealTask(task.id);
    if (result.error) {
      toast({
        title: "Failed to delete task",
        description: result.error,
        variant: "destructive",
      });
    } else {
      onDeleted(task.id);
      onClose();
    }
  };

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[620px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm font-bold tracking-tight">
            {isNew ? "New Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="font-semibold"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description
            </Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details..."
              rows={3}
              className="resize-y"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_CYCLE.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                  <SelectItem value="Blocked">Blocked</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Priority
              </Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assignee
              </Label>
              <Select
                value={assignedTo || "unassigned"}
                onValueChange={(v) =>
                  setAssignedTo(v === "unassigned" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {(profiles ?? []).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Due Date
              </Label>
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              <Select
                value={category || "none"}
                onValueChange={(v) =>
                  setCategory(v === "none" ? "" : v)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-4 mt-4">
          {!isNew ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
              Delete
            </Button>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!title.trim() || saving}
            >
              {saving ? "Saving..." : isNew ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
