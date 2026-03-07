"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Paperclip, X, FileText, Repeat, Link2, ExternalLink } from "lucide-react";
import Link from "next/link";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { RecurrencePanel } from "@/app/(authenticated)/admin/operations/tasks/recurrence-panel";
import { LinkedEntitySelect } from "@/app/(authenticated)/admin/operations/tasks/linked-entity-select";
import type { OpsTask, Profile } from "@/lib/tasks";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
} from "@/lib/tasks";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskSheetProps {
  open: boolean;
  task: OpsTask | null;
  profiles: Profile[];
  currentUserId: string;
  onClose: () => void;
  onSaved: (task: OpsTask) => void;
  onDeleted: (taskId: string) => void;
  defaultLinkedEntity?: {
    type: string;
    id: string;
    label: string;
  };
}

export function TaskSheet({
  open,
  task,
  profiles,
  currentUserId,
  onClose,
  onSaved,
  onDeleted,
  defaultLinkedEntity,
}: TaskSheetProps) {
  const isNew = !task;
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [status, setStatus] = useState("To Do");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("");
  const [linkedEntityType, setLinkedEntityType] = useState("");
  const [linkedEntityId, setLinkedEntityId] = useState("");
  const [linkedEntityLabel, setLinkedEntityLabel] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePattern, setRecurrencePattern] = useState("weekly");
  const [recurrenceDaysOfWeek, setRecurrenceDaysOfWeek] = useState<number[]>([]);
  const [recurrenceDayOfMonth, setRecurrenceDayOfMonth] = useState(1);
  const [recurrenceRepeatInterval, setRecurrenceRepeatInterval] = useState(1);
  const [recurrenceMonthlyWhen, setRecurrenceMonthlyWhen] = useState("specific_day");
  const [recurrenceStartDate, setRecurrenceStartDate] = useState("");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState<
    { id: string; file_name: string; file_type: string | null; storage_path: string }[]
  >([]);
  const [uploading, setUploading] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? "");
      setAssignedTo(task.assigned_to ?? "");
      setDueDate(task.due_date ?? "");
      setStatus(task.status);
      setPriority(task.priority);
      setCategory(task.category ?? "");
      setLinkedEntityType(task.linked_entity_type ?? "");
      setLinkedEntityId(task.linked_entity_id ?? "");
      setLinkedEntityLabel(task.linked_entity_label ?? "");
      setIsRecurring(task.is_recurring ?? false);
      setRecurrencePattern(task.recurrence_pattern ?? "weekly");
      setRecurrenceDaysOfWeek(task.recurrence_days_of_week ?? []);
      setRecurrenceDayOfMonth(task.recurrence_day_of_month ?? 1);
      setRecurrenceRepeatInterval(task.recurrence_repeat_interval ?? 1);
      setRecurrenceMonthlyWhen(task.recurrence_monthly_when ?? "specific_day");
      setRecurrenceStartDate(task.recurrence_start_date ?? "");
      setRecurrenceEndDate(task.recurrence_end_date ?? "");
    } else {
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setDueDate("");
      setStatus("To Do");
      setPriority("Medium");
      setCategory("");
      setLinkedEntityType(defaultLinkedEntity?.type ?? "");
      setLinkedEntityId(defaultLinkedEntity?.id ?? "");
      setLinkedEntityLabel(defaultLinkedEntity?.label ?? "");
      setIsRecurring(false);
      setRecurrencePattern("weekly");
      setRecurrenceDaysOfWeek([]);
      setRecurrenceDayOfMonth(1);
      setRecurrenceRepeatInterval(1);
      setRecurrenceMonthlyWhen("specific_day");
      setRecurrenceStartDate("");
      setRecurrenceEndDate("");
    }
    setAttachments([]);
  }, [task, defaultLinkedEntity]);

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
    )
      .then(({ data }) => {
        if (data) setAttachments(data as never);
      })
      .catch((err) => {
        console.error("task-sheet: failed to load attachments", err);
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
      priority,
      category: category || null,
      linked_entity_type: linkedEntityType || null,
      linked_entity_id: linkedEntityId || null,
      linked_entity_label: linkedEntityLabel || null,
      is_recurring: isRecurring,
      recurrence_pattern: isRecurring ? recurrencePattern : null,
      recurrence_days_of_week: isRecurring ? recurrenceDaysOfWeek : [],
      recurrence_day_of_month: isRecurring ? recurrenceDayOfMonth : null,
      recurrence_repeat_interval: isRecurring ? recurrenceRepeatInterval : null,
      recurrence_monthly_when: isRecurring ? recurrenceMonthlyWhen : null,
      recurrence_start_date:
        isRecurring && recurrenceStartDate ? recurrenceStartDate : null,
      recurrence_end_date:
        isRecurring && recurrenceEndDate ? recurrenceEndDate : null,
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
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[520px] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-0">
          <DialogTitle className="text-sm font-bold tracking-tight">
            {isNew ? "New Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isNew ? "Create a new task" : "Edit task details"}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 px-6">
          <div className="space-y-4 pb-6 pt-4">
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

            {/* Approval link */}
            {!isNew && task.linked_entity_type === "approval" && task.linked_entity_id && (
              <Link
                href={`/admin/operations/approvals/${task.linked_entity_id}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-400 text-[13px] font-medium hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                View Approval Details
              </Link>
            )}

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
                  Status
                </Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Priority
                </Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <DatePicker value={dueDate} onChange={setDueDate} />
              </div>
            </div>

            {/* Category + Linked */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Category
                </Label>
                <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="None" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {TASK_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
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
                {uploading
                  ? "Uploading..."
                  : isNew
                    ? "Save first to attach files"
                    : "Add files"}
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

            {/* Comments */}
            {task && (
              <div className="border-t border-border pt-4">
                <UnifiedNotes
                  entityType="task"
                  entityId={task.id}
                  compact
                />
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          {!isNew ? (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete task</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete &ldquo;{task.title}&rdquo;.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
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
