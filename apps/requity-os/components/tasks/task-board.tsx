"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TaskColumn } from "./task-column";
import { TaskFilters } from "./task-filters";
import { TaskSheet } from "./task-sheet";
import { ApprovalDrawer } from "./approval-drawer";
import type { OpsTask, Profile, TaskTypeFilter } from "@/lib/tasks";
import {
  completeTask,
  completeRecurringTask,
  updateTaskStatus,
} from "@/lib/tasks";

const COLUMNS = [
  { id: "To Do", label: "To Do" },
  { id: "In Progress", label: "In Progress" },
  { id: "Complete", label: "Complete" },
] as const;

interface TaskBoardProps {
  initialTasks: OpsTask[];
  profiles: Profile[];
  currentUserId: string;
}

export function TaskBoard({
  initialTasks,
  profiles,
  currentUserId,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<OpsTask[]>(initialTasks);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null);
  const [approvalDrawerTask, setApprovalDrawerTask] = useState<OpsTask | null>(null);

  // Filters
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>("all");

  const { toast } = useToast();

  // Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("ops_tasks_changes")
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
            const updated = payload.new as OpsTask;
            setTasks((prev) =>
              prev.map((t) => (t.id === updated.id ? updated : t))
            );
            // Update the approval drawer if it's viewing this task
            setApprovalDrawerTask((prev) =>
              prev?.id === updated.id ? updated : prev
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

  // Assignee options for filter
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
    return tasks.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (assigneeFilter !== "all" && t.assigned_to !== assigneeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, typeFilter, assigneeFilter, categoryFilter, priorityFilter]);

  // Complete handler
  const handleComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "Complete",
                completed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      // Server call
      if (task.is_active_recurrence) {
        const result = await completeRecurringTask(taskId);
        if (result.error) {
          // Rollback
          setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
          toast({
            title: "Failed to complete task",
            description: result.error,
            variant: "destructive",
          });
        }
      } else {
        const result = await completeTask(taskId);
        if (!result.success) {
          setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
          toast({
            title: "Failed to complete task",
            description: result.error ?? "Unknown error",
            variant: "destructive",
          });
        }
      }
    },
    [tasks, toast]
  );

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
      const taskId = e.dataTransfer.getData("taskId");
      if (!taskId) return;

      const task = tasks.find((t) => t.id === taskId);
      if (!task || task.status === columnId) return;

      // Don't allow drag into Complete — use checkbox instead
      if (columnId === "Complete") return;

      // Optimistic update
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: columnId,
                completed_at: null,
                updated_at: new Date().toISOString(),
              }
            : t
        )
      );

      const result = await updateTaskStatus(taskId, columnId);
      if (!result.success) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
        toast({
          title: "Failed to update task",
          description: result.error ?? "Unknown error",
          variant: "destructive",
        });
      }
    },
    [tasks, toast]
  );

  // Task saved/deleted handlers
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

  const handleTaskClick = useCallback((task: OpsTask) => {
    if (task.type === "approval") {
      setApprovalDrawerTask(task);
    } else {
      setEditingTask(task);
      setSheetOpen(true);
    }
  }, []);

  const handleNewTask = useCallback(() => {
    setEditingTask(null);
    setSheetOpen(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetOpen(false);
    setEditingTask(null);
  }, []);

  const handleApprovalDrawerClose = useCallback(() => {
    setApprovalDrawerTask(null);
  }, []);

  const handleApprovalUpdated = useCallback((updatedTask: OpsTask) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setApprovalDrawerTask(updatedTask);
  }, []);

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Tasks"
        description="Track work across deals, draws, and operations."
        action={
          <Button onClick={handleNewTask} size="sm">
            <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
            New task
          </Button>
        }
      />

      {/* Filter bar */}
      <div className="mb-5">
        <TaskFilters
          assigneeOptions={assigneeOptions}
          assigneeFilter={assigneeFilter}
          onAssigneeChange={setAssigneeFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />
      </div>

      {/* Kanban columns */}
      <div className="flex gap-4 overflow-x-auto pb-6">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          return (
            <TaskColumn
              key={col.id}
              status={col.id}
              label={col.label}
              tasks={colTasks}
              profiles={profiles}
              onComplete={handleComplete}
              onTaskClick={handleTaskClick}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          );
        })}
      </div>

      {/* Task Sheet */}
      <TaskSheet
        open={sheetOpen}
        task={editingTask}
        profiles={profiles}
        currentUserId={currentUserId}
        onClose={handleSheetClose}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
      />

      {/* Approval Drawer */}
      <ApprovalDrawer
        task={approvalDrawerTask}
        currentUserId={currentUserId}
        profiles={profiles}
        onClose={handleApprovalDrawerClose}
        onUpdated={handleApprovalUpdated}
      />
    </div>
  );
}
