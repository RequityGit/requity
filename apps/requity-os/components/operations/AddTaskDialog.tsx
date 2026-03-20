"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Loader2, Shield, AlertCircle } from "lucide-react";
import { createTaskApproval } from "@/app/(authenticated)/(admin)/tasks/actions";
import type { OpsProject } from "./ProjectCard";
import type { TeamMember } from "./OperationsView";
import {
  OPS_TASK_STATUSES,
  OPS_TASK_PRIORITIES,
  OPS_TASK_CATEGORIES,
} from "@/lib/constants/db-enums";
import { RecurrencePanel } from "@/app/(authenticated)/(admin)/tasks/recurrence-panel";
import { composeRecurrencePattern } from "@/lib/recurrence-utils";

const STATUSES = OPS_TASK_STATUSES;
const PRIORITIES = OPS_TASK_PRIORITIES;
const CATEGORIES = OPS_TASK_CATEGORIES;

const INITIAL_FORM = {
  title: "",
  description: "",
  status: "To Do",
  priority: "Medium",
  project_id: "",
  assigned_to_name: "",
  due_date: "",
  category: "",
  is_recurring: false,
};

interface AddTaskDialogProps {
  projects: OpsProject[];
  teamMembers: TeamMember[];
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
  defaultProjectId?: string;
}

export function AddTaskDialog({ projects, teamMembers, externalOpen, onExternalOpenChange, defaultProjectId }: AddTaskDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (v: boolean) => onExternalOpenChange?.(v) : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const router = useRouter();
  const { toast } = useToast();

  // Approval state
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [approverId, setApproverId] = useState("");
  const [approvalInstructions, setApprovalInstructions] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");

  // Recurrence state
  const [recurrencePattern, setRecurrencePattern] = useState("weekly");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);
  const [recurrenceRepeatInterval, setRecurrenceRepeatInterval] = useState(1);
  const [recurrenceMonthlyWhen, setRecurrenceMonthlyWhen] = useState("specific_day");
  const [recurrenceStartDate, setRecurrenceStartDate] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  function resetForm() {
    setForm(INITIAL_FORM);
    setRequiresApproval(false);
    setApproverId("");
    setApprovalInstructions("");
    setSelectedAssigneeId("");
    setRecurrencePattern("weekly");
    setRecurrenceDaysOfWeek([]);
    setRecurrenceDayOfMonth(1);
    setRecurrenceRepeatInterval(1);
    setRecurrenceMonthlyWhen("specific_day");
    setRecurrenceStartDate("");
    setRecurrenceEndDate("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast({ title: "Task title is required", variant: "destructive" });
      return;
    }

    if (requiresApproval && !approverId) {
      toast({ title: "Approver is required when approval is enabled", variant: "destructive" });
      return;
    }

    if (requiresApproval && approverId && selectedAssigneeId && approverId === selectedAssigneeId) {
      toast({ title: "Approver cannot be the same as assignee", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        toast({ title: "You must be logged in", variant: "destructive" });
        return;
      }

      const composedPattern = composeRecurrencePattern(
        recurrencePattern,
        recurrenceMonthlyWhen,
        recurrenceDayOfMonth,
        recurrenceDaysOfWeek
      );

      const { data: insertedTask, error } = await supabase.from("ops_tasks").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        project_id: form.project_id || null,
        assigned_to_name: form.assigned_to_name.trim() || null,
        assigned_to: selectedAssigneeId || null,
        due_date: form.due_date || null,
        category: form.category.trim() || null,
        is_recurring: form.is_recurring,
        recurrence_pattern: form.is_recurring ? composedPattern : null,
        recurrence_days_of_week: form.is_recurring ? recurrenceDaysOfWeek : [],
        recurrence_day_of_month: form.is_recurring ? recurrenceDayOfMonth : null,
        recurrence_repeat_interval: form.is_recurring ? recurrenceRepeatInterval : null,
        recurrence_monthly_when: form.is_recurring ? recurrenceMonthlyWhen : null,
        recurrence_start_date: form.is_recurring && recurrenceStartDate ? recurrenceStartDate : null,
        recurrence_end_date: form.is_recurring && recurrenceEndDate ? recurrenceEndDate : null,
        created_by: user.id,
        requires_approval: requiresApproval,
        approver_id: requiresApproval ? approverId : null,
        approval_instructions: requiresApproval ? (approvalInstructions.trim() || null) : null,
      }).select("id").single();

      if (error) {
        toast({
          title: "Error creating task",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Create the approval record if approval is required
      if (requiresApproval && insertedTask?.id) {
        const approvalResult = await createTaskApproval({
          taskId: insertedTask.id,
          approverId,
          approvalInstructions: approvalInstructions.trim() || undefined,
        });
        if (!approvalResult.success) {
          console.error("Failed to create approval record:", approvalResult.error);
        }
      }

      toast({ title: "Task created successfully" });
      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast({ title: "An unexpected error occurred", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (v && defaultProjectId) {
          setForm((f) => ({ ...f, project_id: defaultProjectId }));
        }
        if (!v) resetForm();
      }}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="gap-2">
            <PlusCircle className="h-4 w-4" />
            New Task
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[500px] p-0 md:p-0 gap-0 flex flex-col max-h-[90vh] md:max-h-[85vh] overflow-hidden">
        <DialogHeader className="px-4 md:px-6 pt-4 md:pt-6 shrink-0">
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
        <div className="flex-1 min-h-0 overflow-y-auto px-4 md:px-6">
          <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="task_status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.filter((s) => s !== "Pending Approval").map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task_priority">Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(v) => setForm({ ...form, priority: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="project">Project</Label>
            <Select
              value={form.project_id}
              onValueChange={(v) =>
                setForm({ ...form, project_id: v === "none" ? "" : v })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No project</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.project_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="assigned_to_name">Assignee</Label>
              <Select
                value={selectedAssigneeId || "none"}
                onValueChange={(v) => {
                  if (v === "none") {
                    setSelectedAssigneeId("");
                    setForm({ ...form, assigned_to_name: "" });
                  } else {
                    const member = teamMembers.find((m) => m.id === v);
                    setSelectedAssigneeId(v);
                    setForm({ ...form, assigned_to_name: member?.full_name || "" });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="task_category">Category</Label>
              <Select
                value={form.category || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, category: v === "none" ? "" : v })
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

          <div className="space-y-1.5">
            <Label htmlFor="task_due_date">Due Date</Label>
            <DatePicker
              value={form.due_date}
              onChange={(v) => setForm({ ...form, due_date: v })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="task_description">Description</Label>
            <Textarea
              id="task_description"
              placeholder="Task description..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
            />
          </div>

          {/* Approval toggle */}
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className={`h-4 w-4 transition-colors ${requiresApproval ? "text-emerald-500" : "text-muted-foreground"}`} />
                <Label htmlFor="requires_approval" className="cursor-pointer text-sm font-medium">
                  Requires Approval
                </Label>
              </div>
              <Switch
                id="requires_approval"
                checked={requiresApproval}
                onCheckedChange={setRequiresApproval}
              />
            </div>

            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{
                maxHeight: requiresApproval ? 300 : 0,
                opacity: requiresApproval ? 1 : 0,
              }}
            >
              <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3 space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="approver">Approver *</Label>
                  <Select
                    value={approverId || "none"}
                    onValueChange={(v) => setApproverId(v === "none" ? "" : v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select approver" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Select approver</SelectItem>
                      {teamMembers
                        .filter((m) => m.id !== selectedAssigneeId)
                        .map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.full_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="approval_instructions">Approval Instructions</Label>
                  <Textarea
                    id="approval_instructions"
                    placeholder="What should the approver check for?"
                    value={approvalInstructions}
                    onChange={(e) => setApprovalInstructions(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="flex items-center gap-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 px-2.5 py-2">
                  <AlertCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                  <span className="text-[11px] text-muted-foreground">
                    Assignee must submit for approval before task can be completed
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recurring toggle */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <Checkbox
                id="is_recurring"
                checked={form.is_recurring}
                onCheckedChange={(v) =>
                  setForm({
                    ...form,
                    is_recurring: !!v,
                  })
                }
              />
              <Label htmlFor="is_recurring" className="cursor-pointer">
                Recurring task
              </Label>
            </div>

            {form.is_recurring && (
              <RecurrencePanel
                pattern={recurrencePattern}
                onPatternChange={setRecurrencePattern}
                daysOfWeek={recurrenceDaysOfWeek}
                onDaysOfWeekChange={setRecurrenceDaysOfWeek}
                dayOfMonth={recurrenceDayOfMonth}
                onDayOfMonthChange={setRecurrenceDayOfMonth}
                repeatInterval={recurrenceRepeatInterval}
                onRepeatIntervalChange={setRecurrenceRepeatInterval}
                monthlyWhen={recurrenceMonthlyWhen}
                onMonthlyWhenChange={setRecurrenceMonthlyWhen}
                startDate={recurrenceStartDate}
                onStartDateChange={setRecurrenceStartDate}
                endDate={recurrenceEndDate}
                onEndDateChange={setRecurrenceEndDate}
                dueDate={form.due_date}
              />
            )}
          </div>
          </div>
          </div>
          <DialogFooter className="px-4 md:px-6 pb-4 md:pb-6 pt-3 border-t shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-2">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
