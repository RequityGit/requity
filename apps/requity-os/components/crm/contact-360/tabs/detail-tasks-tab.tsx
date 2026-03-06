"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, CheckCircle2, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/format";
import type { TaskData } from "../types";
import { PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "../types";

interface DetailTasksTabProps {
  tasks: TaskData[];
  contactId: string;
  contactName: string;
  currentUserId: string;
}

const INITIAL_FORM = {
  subject: "",
  description: "",
  task_type: "to_do",
  priority: "normal",
  due_date: "",
};

export function DetailTasksTab({
  tasks,
  contactId,
  contactName,
  currentUserId,
}: DetailTasksTabProps) {
  const openCount = tasks.filter((t) => t.status !== "completed").length;
  const router = useRouter();
  const { toast } = useToast();
  const [completing, setCompleting] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [creating, setCreating] = useState(false);

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

  async function handleCreateTask() {
    if (!form.subject.trim()) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }
    setCreating(true);
    try {
      const supabase = createClient();

      // Map priority for ops_tasks (capitalize first letter)
      const opsPriority = form.priority.charAt(0).toUpperCase() + form.priority.slice(1);
      // Map task_type for crm_tasks
      const crmTaskType = form.task_type as never;

      // Create in crm_tasks
      const { error: crmError } = await supabase.from("crm_tasks").insert({
        subject: form.subject.trim(),
        description: form.description.trim() || null,
        task_type: crmTaskType,
        priority: form.priority as never,
        status: "not_started" as never,
        contact_id: contactId,
        assigned_to: currentUserId,
        assigned_by: currentUserId,
        due_date: form.due_date || null,
      });
      if (crmError) throw crmError;

      // Create in ops_tasks with linked entity
      const { error: opsError } = await supabase.from("ops_tasks").insert({
        title: form.subject.trim(),
        description: form.description.trim() || null,
        status: "To Do",
        priority: opsPriority,
        created_by: currentUserId,
        due_date: form.due_date || null,
        linked_entity_id: contactId,
        linked_entity_type: "contact",
        linked_entity_label: contactName,
      });
      if (opsError) {
        console.error("ops_tasks insert error (non-blocking):", opsError);
      }

      toast({ title: "Task created" });
      setForm(INITIAL_FORM);
      setDialogOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Task creation error:", err);
      toast({ title: "Error creating task", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[13px] text-muted-foreground">{openCount} open task{openCount !== 1 ? "s" : ""}</span>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 rounded-lg border-border text-xs"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          New Task
        </Button>
      </div>

      {/* New Task Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">New Task</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">
                Subject <span className="text-[#E5453D]">*</span>
              </label>
              <Input
                placeholder="Task subject"
                value={form.subject}
                onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                className="rounded-lg border-border"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type</label>
                <Select value={form.task_type} onValueChange={(v) => setForm((f) => ({ ...f, task_type: v }))}>
                  <SelectTrigger className="rounded-lg border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="to_do">To Do</SelectItem>
                    <SelectItem value="call">Call</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Priority</label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v }))}>
                  <SelectTrigger className="rounded-lg border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Due Date</label>
              <DatePicker
                value={form.due_date}
                onChange={(v) => setForm((f) => ({ ...f, due_date: v }))}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
              <Textarea
                placeholder="Optional description"
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="rounded-lg border-border resize-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="rounded-lg border-border"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateTask}
              disabled={creating}
              className="rounded-lg bg-foreground hover:bg-foreground/90 text-background gap-1.5"
            >
              {creating && <Loader2 size={14} className="animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
            <CheckCircle2 className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No tasks</h3>
          <p className="text-sm text-muted-foreground">Create a task to track to-dos for this contact.</p>
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
              className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5"
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
                  className="text-[13px] font-medium text-foreground"
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
                    className={`text-[11px] ${isOverdue ? "text-[#E5453D]" : "text-muted-foreground"}`}
                  >
                    Due {formatDate(t.due_date)}
                  </span>
                  <span className="text-[11px] text-muted-foreground/50">&middot;</span>
                  <span className="text-[11px] text-muted-foreground">
                    {t.assigned_to_name || "Unassigned"}
                  </span>
                </div>
              </div>

              {/* Priority */}
              <Badge
                variant="outline"
                className="text-[11px] gap-1 px-1.5 py-0 h-5 shrink-0"
                style={{
                  color: priorityColor,
                  borderColor: `${priorityColor}30`,
                  backgroundColor: `${priorityColor}08`,
                }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: priorityColor }}
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
