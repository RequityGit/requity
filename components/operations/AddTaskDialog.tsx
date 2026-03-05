"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PlusCircle, Loader2 } from "lucide-react";
import type { OpsProject } from "./ProjectCard";
import type { TeamMember } from "./OperationsView";
import {
  OPS_TASK_STATUSES,
  OPS_TASK_PRIORITIES,
  OPS_TASK_CATEGORIES,
} from "@/lib/constants/db-enums";

const STATUSES = OPS_TASK_STATUSES;
const PRIORITIES = OPS_TASK_PRIORITIES;
const CATEGORIES = OPS_TASK_CATEGORIES;
const RECURRENCE_PATTERNS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Biweekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annually", label: "Annually" },
];

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
  recurrence_pattern: "",
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

  function resetForm() {
    setForm(INITIAL_FORM);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      toast({ title: "Task title is required", variant: "destructive" });
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

      const { error } = await supabase.from("ops_tasks").insert({
        title: form.title.trim(),
        description: form.description.trim() || null,
        status: form.status,
        priority: form.priority,
        project_id: form.project_id || null,
        assigned_to_name: form.assigned_to_name.trim() || null,
        due_date: form.due_date || null,
        category: form.category.trim() || null,
        is_recurring: form.is_recurring,
        recurrence_pattern: form.is_recurring ? form.recurrence_pattern || null : null,
        created_by: user.id,
      });

      if (error) {
        toast({
          title: "Error creating task",
          description: error.message,
          variant: "destructive",
        });
        return;
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="task_status">Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm({ ...form, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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

          <div className="space-y-2">
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assigned_to_name">Assignee</Label>
              <Select
                value={form.assigned_to_name || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, assigned_to_name: v === "none" ? "" : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.full_name}>
                      {m.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
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

          <div className="space-y-2">
            <Label htmlFor="task_due_date">Due Date</Label>
            <Input
              id="task_due_date"
              type="date"
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="task_description">Description</Label>
            <Textarea
              id="task_description"
              placeholder="Task description..."
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Recurring toggle */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                id="is_recurring"
                type="checkbox"
                checked={form.is_recurring}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_recurring: e.target.checked,
                    recurrence_pattern: e.target.checked
                      ? form.recurrence_pattern
                      : "",
                  })
                }
                className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
              />
              <Label htmlFor="is_recurring" className="cursor-pointer">
                Recurring task
              </Label>
            </div>

            {form.is_recurring && (
              <div className="space-y-2">
                <Label htmlFor="recurrence_pattern">Recurrence Pattern</Label>
                <Select
                  value={form.recurrence_pattern}
                  onValueChange={(v) =>
                    setForm({ ...form, recurrence_pattern: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_PATTERNS.map((rp) => (
                      <SelectItem key={rp.value} value={rp.value}>
                        {rp.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
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
