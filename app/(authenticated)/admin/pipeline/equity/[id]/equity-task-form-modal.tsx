"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  EQUITY_TASK_STATUSES,
  EQUITY_TASK_CATEGORIES,
  EQUITY_RESPONSIBLE_PARTIES,
  EQUITY_STAGE_LABELS,
  EQUITY_DEAL_STAGES,
} from "@/lib/constants";
import {
  createEquityDealTask,
  updateEquityDealTask,
  deleteEquityDealTask,
} from "./task-actions";
import type { EquityDealTask, TaskProfile } from "./equity-deal-tasks-tab";

interface EquityTaskFormModalProps {
  task: EquityDealTask | null;
  dealId: string;
  dealStage: string;
  profiles: TaskProfile[];
  currentUserId: string;
  onClose: () => void;
  onSaved: (task: EquityDealTask) => void;
  onDeleted: (taskId: string) => void;
}

export function EquityTaskFormModal({
  task,
  dealId,
  dealStage,
  profiles,
  currentUserId,
  onClose,
  onSaved,
  onDeleted,
}: EquityTaskFormModalProps) {
  const isNew = !task;
  const isFromTemplate = !!task?.template_item_id;
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);

  const [taskName, setTaskName] = useState(task?.task_name ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [category, setCategory] = useState(task?.category ?? "");
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [status, setStatus] = useState(task?.status ?? "not_started");
  const [responsibleParty, setResponsibleParty] = useState(
    task?.responsible_party ?? ""
  );
  const [requiredStage, setRequiredStage] = useState(
    task?.required_stage ?? dealStage
  );
  const [isCriticalPath, setIsCriticalPath] = useState(
    task?.is_critical_path ?? false
  );
  const [notes, setNotes] = useState(task?.notes ?? "");

  const handleSave = async () => {
    if (!taskName.trim()) return;
    setSaving(true);

    const payload: Record<string, unknown> = {
      task_name: taskName.trim(),
      description: description.trim() || null,
      category: category || null,
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
      status,
      responsible_party: responsibleParty || null,
      required_stage: requiredStage || null,
      is_critical_path: isCriticalPath,
      notes: notes.trim() || null,
    };

    // Handle completed_at/completed_by
    if (status === "completed" && task?.status !== "completed") {
      payload.completed_at = new Date().toISOString();
      payload.completed_by = currentUserId;
    } else if (status !== "completed") {
      payload.completed_at = null;
      payload.completed_by = null;
    }

    try {
      if (isNew) {
        const result = await createEquityDealTask(dealId, payload);
        if (result.error) throw new Error(result.error);
        if (result.data) onSaved(result.data as EquityDealTask);
      } else {
        const result = await updateEquityDealTask(task.id, payload);
        if (result.error) throw new Error(result.error);
        if (result.data) onSaved(result.data as EquityDealTask);
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
    const result = await deleteEquityDealTask(task.id);
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
          {/* Task Name */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Task Name
            </Label>
            <Input
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              placeholder="What needs to be done?"
              className="font-semibold"
              disabled={isFromTemplate}
            />
            {isFromTemplate && (
              <p className="text-[11px] text-muted-foreground">
                Name is locked — this task was generated from a template.
              </p>
            )}
          </div>

          {/* Description */}
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

          {/* 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </Label>
              <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {EQUITY_TASK_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EQUITY_TASK_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assignee
              </Label>
              <Select value={assignedTo || "unassigned"} onValueChange={(v) => setAssignedTo(v === "unassigned" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {profiles.map((p) => (
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
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Responsible Party
              </Label>
              <Select value={responsibleParty || "none"} onValueChange={(v) => setResponsibleParty(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select party" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {EQUITY_RESPONSIBLE_PARTIES.map((rp) => (
                    <SelectItem key={rp} value={rp}>
                      {rp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Required Stage
              </Label>
              <Select value={requiredStage || "none"} onValueChange={(v) => setRequiredStage(v === "none" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Any stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Any stage</SelectItem>
                  {EQUITY_DEAL_STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {EQUITY_STAGE_LABELS[s] ?? s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Critical path checkbox */}
          <label className="flex items-center gap-2 cursor-pointer text-[13px] font-medium">
            <input
              type="checkbox"
              checked={isCriticalPath}
              onChange={(e) => setIsCriticalPath(e.target.checked)}
              className="h-4 w-4 rounded accent-primary"
            />
            Mark as critical path
          </label>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Internal notes..."
              rows={2}
              className="resize-y"
            />
          </div>
        </div>

        {/* Footer */}
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
              disabled={!taskName.trim() || saving}
            >
              {saving ? "Saving..." : isNew ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
