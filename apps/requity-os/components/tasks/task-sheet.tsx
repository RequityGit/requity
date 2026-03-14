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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Trash2, Paperclip, X, FileText, Repeat, Link2, ExternalLink, MessageSquare, ChevronDown, ChevronUp, Shield, Check, RotateCcw, AlertCircle } from "lucide-react";
import Link from "next/link";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { RecurrencePanel } from "@/app/(authenticated)/(admin)/tasks/recurrence-panel";
import { LinkedEntitySelect } from "@/app/(authenticated)/(admin)/tasks/linked-entity-select";
import type { OpsTask, Profile, TaskApproval } from "@/lib/tasks";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
} from "@/lib/tasks";
import {
  approveTask,
  requestTaskRevision,
  rejectTask,
  submitTaskForApproval,
  getTaskApproval,
  createTaskApproval,
} from "@/app/(authenticated)/(admin)/tasks/actions";
import {
  composeRecurrencePattern,
  parseRecurrencePattern,
} from "@/lib/recurrence-utils";

interface TaskSheetProps {
  open: boolean;
  task: OpsTask | null;
  profiles: Profile[];
  currentUserId: string;
  isSuperAdmin?: boolean;
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
  isSuperAdmin: isSuperAdminProp = false,
  onClose,
  onSaved,
  onDeleted,
  defaultLinkedEntity,
}: TaskSheetProps) {
  const isNew = !task;
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

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

  // Approval state
  const [taskApproval, setTaskApproval] = useState<TaskApproval | null>(null);
  const [approvalActionLoading, setApprovalActionLoading] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRevisionInput, setShowRevisionInput] = useState(false);
  const [showRejectionInput, setShowRejectionInput] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  // New task approval form state
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [newApproverId, setNewApproverId] = useState("");
  const [newApprovalInstructions, setNewApprovalInstructions] = useState("");

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
      setRecurrenceRepeatInterval(task.recurrence_repeat_interval ?? 1);
      setRecurrenceStartDate(task.recurrence_start_date ?? "");
      setRecurrenceEndDate(task.recurrence_end_date ?? "");

      // Parse composed pattern back into structured fields
      const parsed = parseRecurrencePattern(task.recurrence_pattern ?? "");
      setRecurrencePattern(parsed.base);
      setRecurrenceMonthlyWhen(parsed.monthlyWhen);
      setRecurrenceDayOfMonth(parsed.dayOfMonth);
      setRecurrenceDaysOfWeek(
        parsed.daysOfWeek.length > 0
          ? parsed.daysOfWeek
          : task.recurrence_days_of_week ?? []
      );
      if (parsed.base !== "monthly" && parsed.base !== "annually") {
        setRecurrenceDayOfMonth(task.recurrence_day_of_month ?? parsed.dayOfMonth);
        setRecurrenceMonthlyWhen(task.recurrence_monthly_when ?? parsed.monthlyWhen);
      }
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
      setRequiresApproval(false);
      setNewApproverId("");
      setNewApprovalInstructions("");
    }
    setAttachments([]);
    setCommentsOpen(false);
  }, [task, defaultLinkedEntity]);

  // Load task approval data
  useEffect(() => {
    if (!task || !task.requires_approval) {
      setTaskApproval(null);
      return;
    }
    getTaskApproval(task.id).then(({ data }) => {
      setTaskApproval(data as TaskApproval | null);
    });
    setShowRevisionInput(false);
    setShowRejectionInput(false);
    setRevisionNote("");
    setRejectionReason("");
  }, [task]);

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

    if (isNew && requiresApproval && !newApproverId) {
      toast({ title: "Approver is required when approval is enabled", variant: "destructive" });
      return;
    }

    if (isNew && requiresApproval && newApproverId && assignedTo && newApproverId === assignedTo) {
      toast({ title: "Approver cannot be the same as assignee", variant: "destructive" });
      return;
    }

    setSaving(true);

    const supabase = createClient();
    const assigneeProfile = profiles.find((p) => p.id === assignedTo);

    const composedPattern = composeRecurrencePattern(
      recurrencePattern,
      recurrenceMonthlyWhen,
      recurrenceDayOfMonth,
      recurrenceDaysOfWeek
    );

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
      recurrence_pattern: isRecurring ? composedPattern : null,
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
        payload.requires_approval = requiresApproval;
        payload.approver_id = requiresApproval ? newApproverId : null;
        payload.approval_instructions = requiresApproval ? (newApprovalInstructions.trim() || null) : null;
        const { data, error } = await supabase
          .from("ops_tasks")
          .insert(payload as never)
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const newTask = data as unknown as OpsTask;
          // Create the approval record if approval is required
          if (requiresApproval && newApproverId) {
            await createTaskApproval({
              taskId: newTask.id,
              approverId: newApproverId,
              approvalInstructions: newApprovalInstructions.trim() || undefined,
            });
          }
          onSaved(newTask);
        }
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

  // Approval helpers
  const isApprover = task?.approver_id === currentUserId;
  const isAssignee = task?.assigned_to === currentUserId;
  const canActOnApproval = isApprover || isSuperAdminProp;
  const isPendingApproval = task?.status === "Pending Approval" && task?.requires_approval;
  const approverProfile = task?.approver_id ? profiles.find((p) => p.id === task.approver_id) : null;

  const handleApprove = async () => {
    if (!task) return;
    setApprovalActionLoading(true);
    const result = await approveTask(task.id);
    if (result.success) {
      toast({ title: "Task approved" });
      onSaved({ ...task, status: "Complete", completed_at: new Date().toISOString() });
      onClose();
    } else {
      toast({ title: "Failed to approve", description: result.error, variant: "destructive" });
    }
    setApprovalActionLoading(false);
  };

  const handleRequestRevision = async () => {
    if (!task || !revisionNote.trim()) return;
    setApprovalActionLoading(true);
    const result = await requestTaskRevision(task.id, revisionNote.trim());
    if (result.success) {
      toast({ title: "Revision requested" });
      onSaved({ ...task, status: "In Progress" });
      onClose();
    } else {
      toast({ title: "Failed to request revision", description: result.error, variant: "destructive" });
    }
    setApprovalActionLoading(false);
  };

  const handleReject = async () => {
    if (!task || !rejectionReason.trim()) return;
    setApprovalActionLoading(true);
    const result = await rejectTask(task.id, rejectionReason.trim());
    if (result.success) {
      toast({ title: "Task rejected" });
      onSaved({ ...task, status: "Complete", completed_at: new Date().toISOString() });
      onClose();
    } else {
      toast({ title: "Failed to reject", description: result.error, variant: "destructive" });
    }
    setApprovalActionLoading(false);
  };

  const handleSubmitForApproval = async () => {
    if (!task) return;
    setApprovalActionLoading(true);
    const result = await submitTaskForApproval(task.id);
    if (result.success) {
      toast({ title: "Submitted for approval" });
      onSaved({ ...task, status: "Pending Approval" });
      setStatus("Pending Approval");
    } else {
      toast({ title: "Failed to submit", description: result.error, variant: "destructive" });
    }
    setApprovalActionLoading(false);
    setShowSubmitConfirm(false);
  };

  // Status options: gate "Complete" for approval tasks where user is assignee
  const availableStatuses = (() => {
    if (!task?.requires_approval) {
      return TASK_STATUSES.filter((s) => s !== "Pending Approval");
    }
    if (isAssignee && !canActOnApproval) {
      // Assignee can go up to Pending Approval, but not Complete
      return TASK_STATUSES.filter((s) => s !== "Complete");
    }
    return TASK_STATUSES;
  })();

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[540px] p-0 md:p-0 gap-0 flex flex-col max-h-[85vh] md:max-h-[85vh] overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border shrink-0">
          <DialogTitle className="text-base font-bold tracking-tight">
            {isNew ? "New Task" : "Edit Task"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isNew ? "Create a new task" : "Edit task details"}
          </DialogDescription>
        </DialogHeader>

        {/* Approval Action Bar */}
        {!isNew && task.requires_approval && (
          <>
            {/* Pending Approval - approver/admin view */}
            {isPendingApproval && canActOnApproval && !showRevisionInput && !showRejectionInput && (
              <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3 shrink-0 flex-wrap">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Approval Required</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white h-7 text-xs" onClick={handleApprove} disabled={approvalActionLoading}>
                    <Check className="h-3.5 w-3.5 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 h-7 text-xs" onClick={() => setShowRevisionInput(true)} disabled={approvalActionLoading}>
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Revision
                  </Button>
                  <Button size="sm" variant="outline" className="border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 h-7 text-xs" onClick={() => setShowRejectionInput(true)} disabled={approvalActionLoading}>
                    <X className="h-3.5 w-3.5 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Revision note input */}
            {isPendingApproval && showRevisionInput && (
              <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 space-y-2 shrink-0">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Request Revision</span>
                </div>
                <Textarea
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="What needs to be changed?"
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowRevisionInput(false); setRevisionNote(""); }}>Cancel</Button>
                  <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs" onClick={handleRequestRevision} disabled={!revisionNote.trim() || approvalActionLoading}>
                    Send
                  </Button>
                </div>
              </div>
            )}

            {/* Rejection reason input */}
            {isPendingApproval && showRejectionInput && (
              <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 space-y-2 shrink-0">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Reject Task</span>
                </div>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Reason for rejection"
                  rows={2}
                  className="text-sm"
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowRejectionInput(false); setRejectionReason(""); }}>Cancel</Button>
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleReject} disabled={!rejectionReason.trim() || approvalActionLoading}>
                    Reject
                  </Button>
                </div>
              </div>
            )}

            {/* Pending Approval - assignee view (no action buttons) */}
            {isPendingApproval && !canActOnApproval && (
              <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 shrink-0">
                <Shield className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-muted-foreground">
                  Awaiting approval from {approverProfile?.full_name || "approver"}
                </span>
              </div>
            )}

            {/* Approved state bar */}
            {taskApproval?.approval_status === "approved" && task.status === "Complete" && (
              <div className="px-5 py-2.5 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 shrink-0">
                <Check className="h-4 w-4 text-emerald-500" />
                <span className="text-sm">Approved by {approverProfile?.full_name || "approver"}</span>
                {taskApproval.responded_at && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {new Date(taskApproval.responded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                )}
              </div>
            )}

            {/* Revision requested state bar */}
            {taskApproval?.approval_status === "revision_requested" && task.status === "In Progress" && (
              <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 space-y-2 shrink-0">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Revision Requested by {approverProfile?.full_name || "approver"}</span>
                </div>
                {taskApproval.approval_note && (
                  <div className="px-3 py-2 bg-background rounded-md border border-border text-xs text-muted-foreground italic">
                    &ldquo;{taskApproval.approval_note}&rdquo;
                  </div>
                )}
              </div>
            )}

            {/* Rejected state bar */}
            {taskApproval?.approval_status === "rejected" && (
              <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 space-y-2 shrink-0">
                <div className="flex items-center gap-2">
                  <X className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Rejected by {approverProfile?.full_name || "approver"}</span>
                </div>
                {taskApproval.rejection_reason && (
                  <div className="px-3 py-2 bg-background rounded-md border border-border text-xs text-muted-foreground italic">
                    &ldquo;{taskApproval.rejection_reason}&rdquo;
                  </div>
                )}
              </div>
            )}
          </>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          <div className="space-y-4 py-5">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
                Title
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
              />
            </div>

            {/* Approval link */}
            {!isNew && task.linked_entity_type === "approval" && task.linked_entity_id && (
              <Link
                href={`/tasks/approvals/${task.linked_entity_id}`}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/40 text-orange-700 dark:text-orange-400 text-[12px] font-medium hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                View Approval Details
              </Link>
            )}

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  Status
                  {!isNew && task.requires_approval && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                      <Shield className="h-2.5 w-2.5" />
                      Approval
                    </span>
                  )}
                </Label>
                <Select
                  value={status}
                  onValueChange={(v) => {
                    if (v === "Pending Approval" && task?.requires_approval) {
                      setShowSubmitConfirm(true);
                    } else {
                      setStatus(v);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
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

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
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

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Due Date
                </Label>
                <DatePicker value={dueDate} onChange={setDueDate} />
              </div>
            </div>

            {/* Category + Linked */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
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

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Link2 className="h-3 w-3" strokeWidth={1.5} />
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

            {/* Approval toggle for new tasks */}
            {isNew && (
              <div className="border-t border-border pt-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className={`h-4 w-4 transition-colors ${requiresApproval ? "text-emerald-500" : "text-muted-foreground"}`} />
                    <Label htmlFor="new_requires_approval" className="cursor-pointer text-sm font-medium">
                      Requires Approval
                    </Label>
                  </div>
                  <Switch
                    id="new_requires_approval"
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
                      <Label htmlFor="new_approver" className="text-xs font-semibold">Approver *</Label>
                      <Select
                        value={newApproverId || "none"}
                        onValueChange={(v) => setNewApproverId(v === "none" ? "" : v)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select approver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Select approver</SelectItem>
                          {profiles
                            .filter((p) => p.id !== assignedTo)
                            .map((p) => (
                              <SelectItem key={p.id} value={p.id}>
                                {p.full_name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new_approval_instructions" className="text-xs font-semibold">Approval Instructions</Label>
                      <Textarea
                        id="new_approval_instructions"
                        placeholder="What should the approver check for?"
                        value={newApprovalInstructions}
                        onChange={(e) => setNewApprovalInstructions(e.target.value)}
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
            )}

            {/* Approver metadata + instructions (for existing tasks with approval) */}
            {!isNew && task.requires_approval && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Shield className="h-3 w-3" strokeWidth={1.5} />
                      Approver
                    </Label>
                    <div className="px-3 py-2 rounded-md border border-border bg-muted/50 text-sm">
                      {approverProfile?.full_name || "Not set"}
                    </div>
                  </div>
                </div>
                {task.approval_instructions && (
                  <div className="rounded-lg bg-blue-500/5 border border-blue-500/15 p-3">
                    <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-500 mb-1.5">
                      Approval Instructions
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {task.approval_instructions}
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Recurring */}
            <div className="pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <Checkbox
                  checked={isRecurring}
                  onCheckedChange={(checked) => setIsRecurring(checked === true)}
                />
                <Repeat
                  className="h-3.5 w-3.5 text-muted-foreground"
                  strokeWidth={1.5}
                />
                <span className="text-sm font-medium text-foreground">Create Recurring Series</span>
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
                    dueDate={dueDate}
                  />
                </div>
              )}
            </div>

            {/* Attachments — only for existing tasks */}
            {!isNew && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground">
                  Attachments
                </Label>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center gap-1.5 justify-center w-full py-1.5 rounded-md border border-dashed border-border text-[12px] font-medium text-muted-foreground hover:border-ring/50 transition-colors"
                >
                  <Paperclip className="h-[13px] w-[13px]" strokeWidth={1.5} />
                  {uploading ? "Uploading..." : "Add files"}
                </button>
                {attachments.length > 0 && (
                  <div className="space-y-1">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center gap-2 px-2 py-1.5 bg-secondary rounded-md border border-border"
                      >
                        <FileText
                          className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0"
                          strokeWidth={1.5}
                        />
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
            )}

            {/* Comments — collapsible, closed by default */}
            {task && (
              <div className="border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setCommentsOpen(!commentsOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors w-full"
                >
                  <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                  Comments
                  {commentsOpen ? (
                    <ChevronUp className="h-3.5 w-3.5 ml-auto" strokeWidth={1.5} />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 ml-auto" strokeWidth={1.5} />
                  )}
                </button>
                {commentsOpen && (
                  <div className="mt-3">
                    <UnifiedNotes
                      entityType="task"
                      entityId={task.id}
                      compact
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4 shrink-0">
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

      {/* Submit for Approval confirmation */}
      <AlertDialog open={showSubmitConfirm} onOpenChange={setShowSubmitConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit for Approval</AlertDialogTitle>
            <AlertDialogDescription>
              This will notify {approverProfile?.full_name || "the approver"} to review this task. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmitForApproval} disabled={approvalActionLoading}>
              Submit
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
