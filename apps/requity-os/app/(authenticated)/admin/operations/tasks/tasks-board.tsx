"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TaskCard } from "./task-card";
import { TaskFormModal } from "./task-form-modal";
import { AssigneeFilter } from "./assignee-filter";

export interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

export interface OpsTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  project_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  category: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  linked_entity_label: string | null;
  is_recurring: boolean | null;
  recurrence_pattern: string | null;
  recurrence_day_of_week: number | null;
  recurrence_day_of_month: number | null;
  recurrence_days_of_week: number[] | null;
  recurrence_end_date: string | null;
  recurrence_start_date: string | null;
  recurrence_repeat_interval: number | null;
  recurrence_monthly_when: string | null;
  recurring_series_id: string | null;
  source_task_id: string | null;
  is_active_recurrence: boolean | null;
  next_recurrence_date: string | null;
  parent_task_id: string | null;
  created_by: string | null;
  sort_order: number;
  updated_at: string | null;
  created_at: string | null;
}

const COLUMNS = [
  { id: "To Do", label: "To Do" },
  { id: "In Progress", label: "In Progress" },
  { id: "Complete", label: "Complete" },
] as const;

interface TasksBoardProps {
  initialTasks: OpsTask[];
  profiles: Profile[];
  currentUserId: string;
  commentCounts: Record<string, number>;
  attachmentCounts: Record<string, number>;
}

export function TasksBoard({
  initialTasks,
  profiles,
  currentUserId,
  commentCounts: initialCommentCounts,
  attachmentCounts: initialAttachmentCounts,
}: TasksBoardProps) {
  const [tasks, setTasks] = useState<OpsTask[]>(initialTasks);
  const [commentCounts, setCommentCounts] = useState(initialCommentCounts);
  const [attachmentCounts] = useState(initialAttachmentCounts);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const { toast } = useToast();

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("tasks-board-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ops_tasks" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setTasks((prev) => {
              if (prev.some((t) => t.id === (payload.new as OpsTask).id))
                return prev;
              return [...prev, payload.new as OpsTask];
            });
          } else if (payload.eventType === "UPDATE") {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === (payload.new as OpsTask).id
                  ? (payload.new as OpsTask)
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
  }, []);

  // Assignee options
  const assigneeOptions = useMemo(() => {
    const seen = new Set<string>();
    return tasks
      .filter((t) => t.assigned_to)
      .reduce<{ value: string; label: string }[]>((acc, t) => {
        if (t.assigned_to && !seen.has(t.assigned_to)) {
          seen.add(t.assigned_to);
          const profile = profiles.find((p) => p.id === t.assigned_to);
          acc.push({
            value: t.assigned_to,
            label: profile?.full_name || t.assigned_to_name || "Unknown",
          });
        }
        return acc;
      }, [])
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [tasks, profiles]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (assigneeFilter.length === 0) return tasks;
    return tasks.filter(
      (t) => t.assigned_to && assigneeFilter.includes(t.assigned_to)
    );
  }, [tasks, assigneeFilter]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent, taskId: string) => {
      e.dataTransfer.setData("taskId", taskId);
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      setDragOverColumn(null);
      const taskId = e.dataTransfer.getData("taskId");
      if (!taskId) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === columnId) return;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: columnId,
                updated_at: new Date().toISOString(),
                completed_at:
                  columnId === "Complete"
                    ? new Date().toISOString()
                    : null,
              }
            : t
        )
      );

      const supabase = createClient();
      const updateData: Record<string, unknown> = {
        status: columnId,
        updated_at: new Date().toISOString(),
      };
      if (columnId === "Complete") {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }

      const { error } = await supabase
        .from("ops_tasks")
        .update(updateData)
        .eq("id", taskId);

      if (error) {
        // Rollback
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? task : t))
        );
        toast({
          title: "Failed to update task",
          description: error.message,
          variant: "destructive",
        });
      }
    },
    [tasks, toast]
  );

  const handleTaskSaved = useCallback(
    (savedTask: OpsTask) => {
      setTasks((prev) => {
        const existing = prev.find((t) => t.id === savedTask.id);
        if (existing) {
          return prev.map((t) =>
            t.id === savedTask.id ? savedTask : t
          );
        }
        return [...prev, savedTask];
      });
    },
    []
  );

  const handleTaskDeleted = useCallback((taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }, []);

  const handleCommentCountChange = useCallback(
    (taskId: string, delta: number) => {
      setCommentCounts((prev) => ({
        ...prev,
        [taskId]: (prev[taskId] ?? 0) + delta,
      }));
    },
    []
  );

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Tasks"
        description="Track work across deals, draws, and operations."
        action={
          <Button onClick={() => setShowNewModal(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
            New task
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="flex gap-3 mb-5">
        <AssigneeFilter
          options={assigneeOptions}
          selected={assigneeFilter}
          onChange={setAssigneeFilter}
          profiles={profiles}
        />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter(
            (t) => t.status === col.id
          );
          const isOver = dragOverColumn === col.id;
          return (
            <div
              key={col.id}
              className="flex-1 min-w-[280px] max-w-[440px] flex flex-col"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverColumn(col.id);
              }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  {col.label}
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground/60 num">
                  {colTasks.length}
                </span>
              </div>

              {/* Cards area */}
              <div
                className={cn(
                  "flex-1 flex flex-col gap-1.5 rounded-lg p-1 min-h-[60px] transition-colors",
                  isOver && "bg-accent border border-dashed border-border"
                )}
              >
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    profiles={profiles}
                    commentCount={commentCounts[task.id] ?? 0}
                    attachmentCount={attachmentCounts[task.id] ?? 0}
                    onDragStart={handleDragStart}
                    onClick={() => setEditingTask(task)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Task Modal */}
      {showNewModal && (
        <TaskFormModal
          task={null}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setShowNewModal(false)}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
          onCommentCountChange={handleCommentCountChange}
        />
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <TaskFormModal
          task={editingTask}
          profiles={profiles}
          currentUserId={currentUserId}
          onClose={() => setEditingTask(null)}
          onSaved={handleTaskSaved}
          onDeleted={handleTaskDeleted}
          onCommentCountChange={handleCommentCountChange}
        />
      )}
    </div>
  );
}
