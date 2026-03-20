"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import { TaskSheet } from "@/components/tasks/task-sheet";
import type { OpsTask, Profile } from "@/lib/tasks";
import { completeTask, completeRecurringTask } from "@/lib/tasks";
import { useToast } from "@/components/ui/use-toast";

interface DetailTasksTabProps {
  tasks: OpsTask[];
  contactId: string;
  contactName: string;
  profiles: Profile[];
  currentUserId: string;
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  "To Do": { bg: "#F7F7F8", text: "#6B6B6B", label: "To Do" },
  "In Progress": { bg: "#EFF6FF", text: "#3B82F6", label: "In Progress" },
  Complete: { bg: "#F0FDF4", text: "#22A861", label: "Complete" },
};

const PRIORITY_DOT: Record<string, string> = {
  High: "#E5453D",
  Medium: "#E5930E",
  Low: "#8B8B8B",
};

export function DetailTasksTab({
  tasks,
  contactId,
  contactName,
  profiles,
  currentUserId,
}: DetailTasksTabProps) {
  const openCount = tasks.filter((t) => t.status !== "Complete").length;
  const router = useRouter();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<OpsTask | null>(null);

  function handleNewTask() {
    setEditingTask(null);
    setSheetOpen(true);
  }

  function handleEditTask(task: OpsTask) {
    setEditingTask(task);
    setSheetOpen(true);
  }

  function handleSaved(_task: OpsTask) {
    router.refresh();
  }

  function handleDeleted(_taskId: string) {
    router.refresh();
  }

  async function handleQuickComplete(task: OpsTask) {
    if (task.is_recurring) {
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
          type: "contact",
          id: contactId,
          label: contactName,
        }}
      />

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No tasks</h3>
          <p className="text-sm text-muted-foreground mb-3">
            Create a task to track to-dos for this contact.
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
          const sc = STATUS_CONFIG[t.status] || STATUS_CONFIG["To Do"];
          const isCompleted = t.status === "Complete";
          const isOverdue =
            !isCompleted && t.due_date && new Date(t.due_date) < new Date();
          const dotColor = PRIORITY_DOT[t.priority] || "#8B8B8B";

          return (
            <div
              key={t.id}
              className="bg-card border border-border rounded-xl p-5 flex items-center gap-3.5 cursor-pointer hover:bg-muted/30 transition-colors"
              style={{ opacity: isCompleted ? 0.6 : 1 }}
              onClick={() => handleEditTask(t)}
            >
              {/* Quick complete button */}
              {!isCompleted && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickComplete(t);
                  }}
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors hover:bg-green-500/10"
                  style={{ border: `2px solid ${dotColor}` }}
                  title="Mark complete"
                />
              )}
              {isCompleted && (
                <div
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: "#22A861" }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
              )}

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[13px] font-medium text-foreground"
                  style={{ textDecoration: isCompleted ? "line-through" : "none" }}
                >
                  {t.title}
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
                  <span className="text-[11px] text-muted-foreground/50">&middot;</span>
                  <span className="text-[11px] text-muted-foreground">
                    {t.assigned_to_name || "Unassigned"}
                  </span>
                  {t.is_recurring && (
                    <>
                      <span className="text-[11px] text-muted-foreground/50">&middot;</span>
                      <span className="text-[11px] text-muted-foreground">Recurring</span>
                    </>
                  )}
                </div>
              </div>

              {/* Priority */}
              <Badge
                variant="outline"
                className="text-[11px] gap-1 px-1.5 py-0 h-5 shrink-0"
                style={{
                  color: dotColor,
                  borderColor: `${dotColor}30`,
                  backgroundColor: `${dotColor}08`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: dotColor }}
                />
                {t.priority}
              </Badge>
            </div>
          );
        })
      )}
    </div>
  );
}
