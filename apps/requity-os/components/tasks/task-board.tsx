"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Plus, Repeat2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { TaskColumn } from "./task-column";
import { TaskFilters } from "./task-filters";
import { TaskSheet } from "./task-sheet";
import { ApprovalDrawer } from "./approval-drawer";
import { RecurringTemplatesTable } from "./recurring-templates-table";
import { TemplateSheet } from "./template-sheet";
import type { OpsTask, Profile, TaskTypeFilter } from "@/lib/tasks";
import {
  completeTask,
  completeRecurringTask,
  updateTaskStatus,
} from "@/lib/tasks";
import type { RecurringTaskTemplate } from "@/lib/recurring-templates";

const COLUMNS = [
  { id: "To Do", label: "To Do" },
  { id: "In Progress", label: "In Progress" },
  { id: "Pending Approval", label: "Pending Approval" },
  { id: "Complete", label: "Complete" },
] as const;

type ViewTab = "kanban" | "recurring";

interface TaskBoardProps {
  initialTasks: OpsTask[];
  initialTemplates: RecurringTaskTemplate[];
  profiles: Profile[];
  currentUserId: string;
  isSuperAdmin?: boolean;
}

export function TaskBoard({
  initialTasks,
  initialTemplates,
  profiles,
  currentUserId,
  isSuperAdmin = false,
}: TaskBoardProps) {
  const [tasks, setTasks] = useState<OpsTask[]>(initialTasks);
  const [templates, setTemplates] = useState<RecurringTaskTemplate[]>(initialTemplates);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null);
  const [approvalDrawerTask, setApprovalDrawerTask] = useState<OpsTask | null>(null);
  const [activeView, setActiveView] = useState<ViewTab>("kanban");
  const [mobileColumn, setMobileColumn] = useState<string>("To Do");
  const isMobile = useIsMobile();

  // Template sheet state
  const [templateSheetOpen, setTemplateSheetOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTaskTemplate | null>(null);

  // Filters
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<TaskTypeFilter>("all");
  const [myApprovalsFilter, setMyApprovalsFilter] = useState(false);

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

  // My Approvals count
  const myApprovalsCount = useMemo(() => {
    return tasks.filter(
      (t) => t.requires_approval && t.approver_id === currentUserId && t.status === "Pending Approval"
    ).length;
  }, [tasks, currentUserId]);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (myApprovalsFilter) {
        if (!t.requires_approval || t.approver_id !== currentUserId) return false;
      }
      if (typeFilter === "approval" && t.type !== "approval" && !t.requires_approval) return false;
      if (typeFilter === "task" && (t.type !== "task" || t.requires_approval)) return false;
      if (assigneeFilter !== "all" && t.assigned_to !== assigneeFilter) return false;
      if (categoryFilter !== "all" && t.category !== categoryFilter) return false;
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, typeFilter, assigneeFilter, categoryFilter, priorityFilter, myApprovalsFilter, currentUserId]);

  // Complete handler
  const handleComplete = useCallback(
    async (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

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

      if (task.is_active_recurrence) {
        const result = await completeRecurringTask(taskId);
        if (result.error) {
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

      // Prevent non-approval tasks from being dragged to Pending Approval
      if (columnId === "Pending Approval" && !task.requires_approval) return;

      // Prevent approval tasks from being dragged directly to Complete (must go through approval)
      if (columnId === "Complete" && task.requires_approval) return;

      if (columnId === "Complete") return;

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

  // Template handlers
  const handleNewTemplate = useCallback(() => {
    setEditingTemplate(null);
    setTemplateSheetOpen(true);
  }, []);

  const handleEditTemplate = useCallback((t: RecurringTaskTemplate) => {
    setEditingTemplate(t);
    setTemplateSheetOpen(true);
  }, []);

  const handleTemplateSheetClose = useCallback(() => {
    setTemplateSheetOpen(false);
    setEditingTemplate(null);
  }, []);

  const handleTemplateSaved = useCallback((saved: RecurringTaskTemplate) => {
    setTemplates((prev) => {
      const existing = prev.find((t) => t.id === saved.id);
      if (existing) {
        return prev.map((t) => (t.id === saved.id ? saved : t));
      }
      return [...prev, saved];
    });
  }, []);

  const activeTemplateCount = templates.filter((t) => t.is_active).length;

  return (
    <div>
      <PageHeader
        title="Operations"
        description="Tasks & approvals to keep the business running."
        action={
          <Button
            onClick={activeView === "recurring" ? handleNewTemplate : handleNewTask}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-1" strokeWidth={1.5} />
            {activeView === "recurring" ? "New template" : "New task"}
          </Button>
        }
      />

      {/* Tab bar + Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4 mb-5">
        <div className="flex items-center gap-2 flex-wrap">
          {/* View tabs: Kanban vs Recurring */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveView("kanban")}
              className={cn(
                "px-3.5 py-2 md:py-1.5 rounded-md text-[13px] font-medium transition-colors min-h-[36px]",
                activeView === "kanban"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              Tasks
            </button>
            <button
              type="button"
              onClick={() => setActiveView("recurring")}
              className={cn(
                "px-3.5 py-2 md:py-1.5 rounded-md text-[13px] font-medium transition-colors flex items-center gap-1.5 min-h-[36px]",
                activeView === "recurring"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              )}
            >
              <Repeat2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Recurring
              <span
                className={cn(
                  "text-[10px] font-semibold px-1.5 py-0.5 rounded-full num",
                  activeView === "recurring"
                    ? "bg-primary-foreground/10 text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {activeTemplateCount}
              </span>
            </button>
          </div>

          {activeView === "kanban" && myApprovalsCount > 0 && (
            <button
              type="button"
              onClick={() => setMyApprovalsFilter(!myApprovalsFilter)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 md:py-1.5 rounded-md text-[12px] font-medium transition-colors border min-h-[36px]",
                myApprovalsFilter
                  ? "bg-blue-500/10 border-blue-500/20 text-blue-500"
                  : "bg-transparent border-border text-muted-foreground hover:bg-accent"
              )}
            >
              <Shield className="h-3.5 w-3.5" strokeWidth={1.5} />
              My Approvals
              <span className={cn(
                "text-[10px] font-semibold px-1.5 py-0.5 rounded-full num",
                myApprovalsFilter
                  ? "bg-blue-500/20 text-blue-500"
                  : "bg-muted text-muted-foreground"
              )}>
                {myApprovalsCount}
              </span>
            </button>
          )}
        </div>

        {activeView === "kanban" && (
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
        )}
      </div>

      {/* Content */}
      {activeView === "recurring" ? (
        <RecurringTemplatesTable
          templates={templates}
          profiles={profiles}
          onEdit={handleEditTemplate}
          onTemplatesChange={setTemplates}
        />
      ) : isMobile ? (
        /* Mobile: tabbed column view -- one column at a time */
        <div>
          <div className="flex rounded-lg bg-muted p-1 mb-4 mobile-scroll">
            {COLUMNS.map((col) => {
              const count = filteredTasks.filter((t) => t.status === col.id).length;
              return (
                <button
                  key={col.id}
                  type="button"
                  onClick={() => setMobileColumn(col.id)}
                  className={cn(
                    "flex-1 min-w-0 px-2 py-2 rounded-md text-xs font-medium transition-colors whitespace-nowrap min-h-[40px]",
                    mobileColumn === col.id
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {col.label.replace("Pending Approval", "Approval")}
                  <span className="ml-1 text-[10px] opacity-60 num">{count}</span>
                </button>
              );
            })}
          </div>
          <TaskColumn
            status={mobileColumn}
            label={COLUMNS.find((c) => c.id === mobileColumn)?.label ?? mobileColumn}
            tasks={filteredTasks.filter((t) => t.status === mobileColumn)}
            profiles={profiles}
            onComplete={handleComplete}
            onTaskClick={handleTaskClick}
            onDragStart={handleDragStart}
            onDrop={handleDrop}
          />
        </div>
      ) : (
        /* Desktop: side-by-side columns */
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
      )}

      {/* Task Sheet */}
      <TaskSheet
        open={sheetOpen}
        task={editingTask}
        profiles={profiles}
        currentUserId={currentUserId}
        isSuperAdmin={isSuperAdmin}
        onClose={handleSheetClose}
        onSaved={handleTaskSaved}
        onDeleted={handleTaskDeleted}
      />

      {/* Template Sheet */}
      <TemplateSheet
        open={templateSheetOpen}
        template={editingTemplate}
        profiles={profiles}
        currentUserId={currentUserId}
        onClose={handleTemplateSheetClose}
        onSaved={handleTemplateSaved}
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
