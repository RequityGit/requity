"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
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
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Trash2,
  Paperclip,
  X,
  FileText,
  Repeat,
  Link2,
} from "lucide-react";
import { OpsCommentThread } from "@/components/operations/OpsCommentThread";
import { RecurrencePanel } from "./recurrence-panel";
import { LinkedEntitySelect } from "./linked-entity-select";
import type { OpsTask, Profile } from "./tasks-board";

const STATUSES = ["To Do", "In Progress", "Complete"] as const;

interface TaskFormModalProps {
  task: OpsTask | null;
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
  onSaved: (task: OpsTask) => void;
  onDeleted: (taskId: string) => void;
  onCommentCountChange: (taskId: string, delta: number) => void;
}

export function TaskFormModal({
  task,
  profiles,
  currentUserId,
  onClose,
  onSaved,
  onDeleted,
  onCommentCountChange,
}: TaskFormModalProps) {
  const isNew = !task;
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [status, setStatus] = useState(task?.status ?? "To Do");
  const [linkedEntityType, setLinkedEntityType] = useState(
    task?.linked_entity_type ?? ""
  );
  const [linkedEntityId, setLinkedEntityId] = useState(
    task?.linked_entity_id ?? ""
  );
  const [linkedEntityLabel, setLinkedEntityLabel] = useState(
    task?.linked_entity_label ?? ""
  );
  const [isRecurring, setIsRecurring] = useState(task?.is_recurring ?? false);
  const [recurrencePattern, setRecurrencePattern] = useState(
    task?.recurrence_pattern ?? "weekly"
  );
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>(
    task?.recurrence_days_of_week ?? []
  );
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(
    task?.recurrence_day_of_month ?? 1
  );
  const [recurrenceRepeatInterval, setRecurrenceRepeatInterval] = useState(
    task?.recurrence_repeat_interval ?? 1
  );
  const [recurrenceMonthlyWhen, setRecurrenceMonthlyWhen] = useState(
    task?.recurrence_monthly_when ?? "specific_day"
  );
  const [recurrenceStartDate, setRecurrenceStartDate] = useState(
    task?.recurrence_start_date ?? ""
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    task?.recurrence_end_date ?? ""
  );

  // Attachments
  const [attachments, setAttachments] = useState<
    { id: string; file_name: string; file_type: string | null; storage_path: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  // Load existing attachments
  useEffect(() => {
    if (!task) return;
    const supabase = createClient();
    Promise.resolve(
      supabase
        .from("ops_task_attachments" as never)
        .select("*" as never)
        .eq("task_id" as never, task.id as never)
        .order("created_at" as never)
    ).then(({ data }) => {
      if (data) setAttachments(data as never);
    }).catch((err) => {
      console.error("task-form-modal: failed to load attachments", err);
    });
  }, [task]);

  const handleLinkedEntityChange = useCallback(
    (type: string, id: string, label: string) => {
      setLinkedEntityType(type);
      setLinkedEntityId(id);
      setLinkedEntityLabel(label);
    },
    []
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!task || !e.target.files?.length) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(e.target.files)) {
      const path = `tasks/${task.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("loan-documents")
        .upload(path, file);

      if (uploadError) {
        toast({
          title: "Upload failed",
          description: uploadError.message,
          variant: "destructive",
        });
        continue;
      }

      const { data: inserted, error: insertError } = await supabase
        .from("ops_task_attachments" as never)
        .insert({
          task_id: task.id,
          file_name: file.name,
          file_type: file.type || null,
          storage_path: path,
          file_size_bytes: file.size,
          uploaded_by: currentUserId,
        } as never)
        .select()
        .single();

      if (insertError) {
        toast({
          title: "Failed to save attachment",
          description: insertError.message,
          variant: "destructive",
        });
      } else if (inserted) {
        setAttachments((prev) => [...prev, inserted as never]);
      }
    }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleRemoveAttachment = async (attachmentId: string) => {
    const supabase = createClient();
    await supabase
      .from("ops_task_attachments" as never)
      .delete()
      .eq("id" as never, attachmentId as never);
    setAttachments((prev) => prev.filter((a) => a.id !== attachmentId));
  };

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);

    const supabase = createClient();
    const assigneeProfile = profiles.find((p) => p.id === assignedTo);

    const payload: Record<string, unknown> = {
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo || null,
      assigned_to_name: assigneeProfile?.full_name || null,
      due_date: dueDate || null,
      status,
      linked_entity_type: linkedEntityType || null,
      linked_entity_id: linkedEntityId || null,
      linked_entity_label: linkedEntityLabel || null,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : null,
      recurrence_days_of_week: isRecurring ? recurrenceDaysOfWeek : [],
      recurrence_day_of_month: isRecurring ? recurrenceDayOfMonth : null,
      recurrence_repeat_interval: isRecurring ? recurrenceRepeatInterval : null,
      recurrence_monthly_when: isRecurring ? recurrenceMonthlyWhen : null,
      recurrence_start_date: isRecurring && recurrenceStartDate ? recurrenceStartDate : null,
      recurrence_end_date: isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
      updated_at: new Date().toISOString(),
    };

    if (status === "Complete" && task?.status !== "Complete") {
      payload.completed_at = new Date().toISOString();
    } else if (status !== "Complete") {
      payload.completed_at = null;
    }

    try {
      if (isNew) {
        payload.created_by = currentUserId;
        payload.sort_order = 0;
        const { data, error } = await supabase
          .from("ops_tasks")
          .insert(payload as never)
          .select()
          .single();

        if (error) throw error;
        if (data) onSaved(data as unknown as OpsTask);
      } else {
        const { data, error } = await supabase
          .from("ops_tasks")
          .update(payload as never)
          .eq("id", task.id)
          .select()
          .single();

        if (error) throw error;
        if (data) onSaved(data as unknown as OpsTask);
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
    const supabase = createClient();
    const { error } = await supabase
      .from("ops_tasks")
      .delete()
      .eq("id", task.id);

    if (error) {
      toast({
        title: "Failed to delete task",
        description: error.message,
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
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What needs to be done?"
              className="font-semibold"
            />
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

          {/* 2x2 grid: Assignee, Due Date, Status, Linked */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Assignee
              </Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
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
              <DatePicker
                value={dueDate}
                onChange={setDueDate}
              />
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
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                <Link2 className="h-[11px] w-[11px]" strokeWidth={1.5} />
                Linked
              </Label>
              <LinkedEntitySelect
                entityType={linkedEntityType}
                entityId={linkedEntityId}
                entityLabel={linkedEntityLabel}
                onChange={handleLinkedEntityChange}
              />
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-[13px] font-medium">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="h-4 w-4 rounded accent-primary"
              />
              <Repeat
                className="h-3.5 w-3.5 text-muted-foreground"
                strokeWidth={1.5}
              />
              Create Recurring Series
            </label>
            {isRecurring && (
              <div className="mt-3">
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
                />
              </div>
            )}
          </div>

          {/* Attachments */}
          <div className="space-y-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Attachments
            </Label>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              multiple
              onChange={handleFileUpload}
              className="hidden"
              disabled={isNew}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={isNew}
              className="flex items-center gap-1.5 justify-center w-full py-2 rounded-md border border-dashed border-border text-[12px] font-medium text-muted-foreground hover:border-ring/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip className="h-[13px] w-[13px]" strokeWidth={1.5} />
              {uploading ? "Uploading..." : isNew ? "Save first to attach files" : "Add files"}
            </button>
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center gap-2.5 px-2.5 py-2 bg-secondary rounded-md border border-border"
                  >
                    <div className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0">
                      <FileText
                        className="h-4 w-4 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="text-[12px] font-medium flex-1 truncate">
                      {att.file_name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(att.id)}
                      className="text-muted-foreground hover:text-foreground p-0.5"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments (only for existing tasks) */}
          {task && (
            <div className="border-t border-border pt-4">
              <OpsCommentThread
                entityType="task"
                entityId={task.id}
                currentUserId={currentUserId}
                isSuperAdmin={false}
              />
            </div>
          )}
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
              disabled={!title.trim() || saving}
            >
              {saving ? "Saving..." : isNew ? "Create" : "Save"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
