"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Check, CheckCircle2 } from "lucide-react";
import { DotPill } from "../contact-detail-shared";
import { formatDate } from "@/lib/format";
import type { TaskData } from "../types";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "../types";

interface DetailTasksTabProps {
  tasks: TaskData[];
  contactId: string;
  currentUserId: string;
}

export function DetailTasksTab({
  tasks,
  contactId,
  currentUserId,
}: DetailTasksTabProps) {
  const openCount = tasks.filter((t) => t.status !== "completed").length;
  const router = useRouter();
  const { toast } = useToast();
  const [completing, setCompleting] = useState<string | null>(null);

  async function toggleComplete(task: TaskData) {
    setCompleting(task.id);
    try {
      const supabase = createClient();
      const newStatus = task.status === "completed" ? "not_started" : "completed";
      const updates: Record<string, unknown> = {
        status: newStatus,
      };
      if (newStatus === "completed") {
        updates.completed_at = new Date().toISOString();
        updates.completed_by = currentUserId;
      } else {
        updates.completed_at = null;
        updates.completed_by = null;
      }
      const { error } = await supabase
        .from("crm_tasks")
        .update(updates)
        .eq("id", task.id);
      if (error) throw error;
      toast({ title: newStatus === "completed" ? "Task completed" : "Task reopened" });
      router.refresh();
    } catch {
      toast({ title: "Error updating task", variant: "destructive" });
    } finally {
      setCompleting(null);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] text-[#8B8B8B]">{openCount} open task{openCount !== 1 ? "s" : ""}</span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-[#E5E5E7] text-xs"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          New Task
        </Button>
      </div>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#F7F7F8] mb-4">
            <CheckCircle2 className="h-6 w-6 text-[#9A9A9A]" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-[#1A1A1A] mb-1">No tasks</h3>
          <p className="text-sm text-[#6B6B6B]">Create a task to track to-dos for this contact.</p>
        </div>
      ) : (
        tasks.map((t) => {
          const sc = TASK_STATUS_CONFIG[t.status] || TASK_STATUS_CONFIG.not_started;
          const isCompleted = t.status === "completed";
          const isOverdue =
            !isCompleted && t.due_date && new Date(t.due_date) < new Date();
          const priorityColor = PRIORITY_CONFIG[t.priority] || PRIORITY_CONFIG.normal;

          return (
            <div
              key={t.id}
              className="bg-white border border-[#E5E5E7] rounded-xl p-4 flex items-center gap-3.5"
              style={{ opacity: isCompleted ? 0.6 : 1 }}
            >
              {/* Checkbox */}
              <button
                onClick={() => toggleComplete(t)}
                disabled={completing === t.id}
                className="w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors"
                style={{
                  border: isCompleted ? "none" : `2px solid ${priorityColor}`,
                  background: isCompleted ? "#22A861" : "transparent",
                }}
              >
                {isCompleted && <Check size={12} className="text-white" />}
              </button>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[13px] font-medium text-[#1A1A1A]"
                  style={{ textDecoration: isCompleted ? "line-through" : "none" }}
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
                  <span
                    className="text-[11px]"
                    style={{ color: isOverdue ? "#E5453D" : "#8B8B8B" }}
                  >
                    Due {formatDate(t.due_date)}
                  </span>
                  <span className="text-[11px] text-[#C5C5C5]">&middot;</span>
                  <span className="text-[11px] text-[#8B8B8B]">
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
