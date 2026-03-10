"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Check, CheckCircle2 } from "lucide-react";
import { DotPill } from "@/components/crm/contact-360/contact-detail-shared";
import { formatDate } from "@/lib/format";
import { TaskSheet } from "@/components/tasks/task-sheet";
import { completeTask, completeRecurringTask } from "@/lib/tasks";
import type { OpsTask, Profile } from "@/lib/tasks";
import type { CompanyTaskData } from "../types";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/components/crm/contact-360/types";

interface TasksTabProps {
  tasks: CompanyTaskData[];
  companyId: string;
  companyName: string;
  currentUserId: string;
  profiles: Profile[];
}

export function CompanyTasksTab({
  tasks,
  companyId,
  companyName,
  currentUserId,
  profiles,
}: TasksTabProps) {
  const openCount = tasks.filter((t) => t.status !== "completed").length;
  const router = useRouter();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null);

  function handleNewTask() {
    setEditingTask(null);
    setSheetOpen(true);
  }

  function handleEditTask(task: CompanyTaskData) {
    // Map CompanyTaskData back to OpsTask shape for TaskSheet
    const opsTask: OpsTask = {
      id: task.id,
      title: task.subject,
      description: task.description,
      status: task.status === "completed" ? "Complete" : task.status === "in_progress" ? "In Progress" : "To Do",
      priority: task.priority,
      assigned_to: task.assigned_to,
      assigned_to_name: task.assigned_to_name,
      project_id: null,
      due_date: task.due_date,
      completed_at: task.completed_at,
      category: task.task_type,
      linked_entity_type: "company",
      linked_entity_id: companyId,
      linked_entity_label: companyName,
      is_recurring: null,
      is_active_recurrence: null,
      recurrence_pattern: null,
      recurrence_repeat_interval: null,
      recurrence_days_of_week: null,
      recurrence_day_of_month: null,
      recurrence_monthly_when: null,
      recurrence_start_date: null,
      recurrence_end_date: null,
      next_recurrence_date: null,
      recurring_template_id: null,
      recurrence_period: null,
      previous_incomplete: null,
      recurring_series_id: null,
      source_task_id: null,
      parent_task_id: null,
      created_by: null,
      sort_order: 0,
      created_at: null,
      updated_at: null,
      type: "task",
      approval_status: null,
      active_party: null,
      requestor_user_id: null,
      requestor_name: null,
      amount: null,
      decision_note: null,
      approved_at: null,
      rejected_at: null,
      resubmitted_at: null,
      revision_count: null,
    };
    setEditingTask(opsTask);
    setSheetOpen(true);
  }

  function handleSaved() {
    router.refresh();
  }

  function handleDeleted() {
    router.refresh();
  }

  async function handleQuickComplete(task: CompanyTaskData) {
    // Map status back to OpsTask format
    const isRecurring = false; // CompanyTaskData doesn't track recurring; treat as non-recurring
    const isCompleted = task.status === "completed";

    if (isCompleted) {
      // Reopen: update directly
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase
        .from("ops_tasks")
        .update({
          status: "To Do",
          completed_at: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", task.id);
      if (error) {
        toast({ title: "Error reopening task", variant: "destructive" });
      } else {
        toast({ title: "Task reopened" });
      }
    } else if (isRecurring) {
      const result = await completeRecurringTask(task.id);
      if (result.error) {
        toast({ title: `Failed to complete task: ${result.error}`, variant: "destructive" });
      } else {
        toast({
          title: result.next_created
            ? "Task completed — next occurrence created"
            : "Recurring task completed",
        });
      }
    } else {
      const result = await completeTask(task.id);
      if (result.error) {
        toast({ title: `Failed to complete task: ${result.error}`, variant: "destructive" });
      } else {
        toast({ title: "Task completed" });
      }
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] text-muted-foreground">
          {openCount} open task{openCount !== 1 ? "s" : ""}
        </span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-border text-xs"
          onClick={handleNewTask}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          New Task
        </Button>
      </div>

      <TaskSheet
        open={sheetOpen}
        task={editingTask}
        profiles={profiles}
        currentUserId={currentUserId}
        onClose={() => setSheetOpen(false)}
        onSaved={handleSaved}
        onDeleted={handleDeleted}
        defaultLinkedEntity={{
          type: "company",
          id: companyId,
          label: companyName,
        }}
      />

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
            <CheckCircle2
              className="h-6 w-6 text-muted-foreground"
              strokeWidth={1.5}
            />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            No tasks
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            Create a task to track to-dos for this company.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 rounded-lg border-border text-xs"
            onClick={handleNewTask}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            New Task
          </Button>
        </div>
      ) : (
        tasks.map((t) => {
          const sc =
            TASK_STATUS_CONFIG[t.status] || TASK_STATUS_CONFIG.not_started;
          const isCompleted = t.status === "completed";
          const isOverdue =
            !isCompleted &&
            t.due_date &&
            new Date(t.due_date) < new Date();
          const priorityColor =
            PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.normal;

          return (
            <div
              key={t.id}
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
              style={{ opacity: isCompleted ? 0.6 : 1 }}
              onClick={() => handleEditTask(t)}
            >
              {/* Checkbox */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleQuickComplete(t);
                }}
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{
                  border: isCompleted
                    ? "none"
                    : `2px solid ${priorityColor}`,
                  background: isCompleted ? "#22A861" : "transparent",
                }}
              >
                {isCompleted && (
                  <Check size={12} className="text-white" />
                )}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[13px] font-medium text-foreground"
                  style={{
                    textDecoration: isCompleted ? "line-through" : "none",
                  }}
                >
                  {t.subject}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className="rounded-full px-2 py-px text-[11px] font-medium"
                    style={{ background: sc.bg, color: sc.text }}
                  >
                    {sc.label}
                  </span>
                  {t.due_date && (
                    <span
                      className={`text-[11px] ${isOverdue ? "text-[#E5453D]" : "text-muted-foreground"}`}
                    >
                      Due {formatDate(t.due_date)}
                    </span>
                  )}
                  <span className="text-[11px] text-muted-foreground/50">
                    &middot;
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {t.assigned_to_name || "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <DotPill color={priorityColor} label={t.priority} small />
            </div>
          );
        })
      )}
    </div>
  );
}
