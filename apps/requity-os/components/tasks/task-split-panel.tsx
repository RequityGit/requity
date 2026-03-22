"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Label } from "@/components/ui/label";
import {
  Trash2,
  X,
  FileText,
  Repeat,
  Link2,
  ExternalLink,
  Shield,
  Check,
  RotateCcw,
  AlertCircle,
  Upload,
  Eye,
  Image,
  Download,
  Copy,
  BarChart3,
  Clock,
  CircleDot,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { RecurrencePanel } from "@/app/(authenticated)/(admin)/tasks/recurrence-panel";
import { LinkedEntitySelect } from "@/app/(authenticated)/(admin)/tasks/linked-entity-select";
import type { OpsTask, Profile, TaskApproval } from "@/lib/tasks";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TASK_CATEGORIES,
  CATEGORY_COLORS,
  PRIORITY_COLORS,
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

interface TaskSplitPanelProps {
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

export function TaskSplitPanel({
  open,
  task,
  profiles,
  currentUserId,
  isSuperAdmin: isSuperAdminProp = false,
  onClose,
  onSaved,
  onDeleted,
  defaultLinkedEntity,
}: TaskSplitPanelProps) {
  const isNew = !task;
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingDescription, setEditingDescription] = useState(false);
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
  const [isDragging, setIsDragging] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");

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
    setStagedFiles([]);
    setEditingDescription(false);
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
        console.error("task-split-panel: failed to load attachments", err);
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

  // ── Drag & drop ──────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      if (!e.dataTransfer.files?.length) return;
      if (isNew) {
        setStagedFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
      } else {
        uploadFiles(Array.from(e.dataTransfer.files));
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isNew]
  );

  const uploadFiles = async (files: File[]) => {
    if (!task) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of files) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `tasks/${task.id}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("loan-documents")
        .upload(path, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
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
        toast({ title: "Failed to save attachment", description: insertError.message, variant: "destructive" });
      } else if (inserted) {
        setAttachments((prev) => [...prev, inserted as never]);
      }
    }
    setUploading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    if (isNew) {
      setStagedFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      e.target.value = "";
      return;
    }
    if (!task) return;
    setUploading(true);
    const supabase = createClient();

    for (const file of Array.from(e.target.files)) {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `tasks/${task.id}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("loan-documents")
        .upload(path, file);

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
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
        toast({ title: "Failed to save attachment", description: insertError.message, variant: "destructive" });
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

  // ── Save / Delete ────────────────────────────────────────────────────
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
          if (requiresApproval && newApproverId) {
            await createTaskApproval({
              taskId: newTask.id,
              approverId: newApproverId,
              approvalInstructions: newApprovalInstructions.trim() || undefined,
            });
          }
          if (stagedFiles.length > 0) {
            for (const file of stagedFiles) {
              const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
              const path = `tasks/${newTask.id}/${Date.now()}_${safeName}`;
              const { error: upErr } = await supabase.storage
                .from("loan-documents")
                .upload(path, file);
              if (upErr) continue;
              await supabase
                .from("ops_task_attachments" as never)
                .insert({
                  task_id: newTask.id,
                  file_name: file.name,
                  file_type: file.type || null,
                  storage_path: path,
                  file_size_bytes: file.size,
                  uploaded_by: currentUserId,
                } as never);
            }
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
      toast({ title: "Failed to delete task", description: error.message, variant: "destructive" });
    } else {
      onDeleted(task.id);
      onClose();
    }
  };

  const handlePreviewAttachment = async (att: { file_name: string; storage_path: string; file_type: string | null }) => {
    const supabase = createClient();
    const { data } = await supabase.storage
      .from("loan-documents")
      .createSignedUrl(att.storage_path, 3600);
    if (data?.signedUrl) {
      if (att.file_type?.startsWith("image/")) {
        setPreviewName(att.file_name);
        setPreviewUrl(data.signedUrl);
      } else {
        window.open(data.signedUrl, "_blank");
      }
    } else {
      toast({ title: "Could not load file", variant: "destructive" });
    }
  };

  const handleCopyLink = () => {
    if (!task) return;
    const url = `${window.location.origin}/tasks?task=${task.id}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Task URL copied to clipboard." });
  };

  // ── Approval helpers ─────────────────────────────────────────────────
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

  const availableStatuses = (() => {
    if (!task?.requires_approval) {
      return TASK_STATUSES.filter((s) => s !== "Pending Approval");
    }
    if (isAssignee && !canActOnApproval) {
      return TASK_STATUSES.filter((s) => s !== "Complete");
    }
    return TASK_STATUSES;
  })();

  // ── Due date helpers ─────────────────────────────────────────────────
  const getDueDateLabel = () => {
    if (!dueDate) return null;
    const d = new Date(dueDate + "T00:00:00");
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d overdue`, color: "text-red-500" };
    if (diff === 0) return { text: "Due today", color: "text-amber-500" };
    if (diff === 1) return { text: "Due tomorrow", color: "text-amber-500" };
    return { text: `${diff}d left`, color: "text-muted-foreground" };
  };

  const dueDateLabel = getDueDateLabel();
  const assigneeProfile = assignedTo ? profiles.find((p) => p.id === assignedTo) : null;
  const taskNumber = task?.id ? `TSK-${task.id.slice(0, 4).toUpperCase()}` : null;

  // ── Status icon ──────────────────────────────────────────────────────
  const statusIcon = () => {
    switch (status) {
      case "Complete":
        return <Check className="h-3 w-3" />;
      case "In Progress":
        return <Clock className="h-3 w-3" />;
      case "Pending Approval":
        return <Shield className="h-3 w-3" />;
      default:
        return <CircleDot className="h-3 w-3" />;
    }
  };

  const priorityIcon = () => {
    const color = priority === "High" ? "text-red-500" : priority === "Medium" ? "text-amber-500" : "text-muted-foreground";
    return <BarChart3 className={cn("h-3 w-3", color)} />;
  };

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={() => onClose()}>
        <DialogPrimitive.Portal>
          {/* Overlay */}
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

          {/* Panel */}
          <DialogPrimitive.Content
            className={cn(
              "fixed z-50 bg-card border border-border rounded-2xl shadow-2xl",
              "w-[980px] max-w-[calc(100vw-48px)]",
              "flex flex-col overflow-hidden",
              // Center
              "top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]",
              // Height
              "h-[min(720px,calc(100vh-64px))]",
              // Animation
              "data-[state=open]:animate-in data-[state=closed]:animate-out",
              "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
              "data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97]",
              "duration-200",
              // Mobile: full-screen
              "max-lg:w-full max-lg:max-w-full max-lg:h-full max-lg:max-h-full max-lg:rounded-none"
            )}
          >
            <DialogPrimitive.Title className="sr-only">
              {isNew ? "New Task" : `Edit Task: ${task?.title ?? ""}`}
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="sr-only">
              {isNew ? "Create a new task" : "Edit task details and view activity"}
            </DialogPrimitive.Description>

            {/* ── Top bar ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-border shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {taskNumber && (
                  <>
                    <span className="text-xs font-mono text-muted-foreground">{taskNumber}</span>
                    <span className="h-4 w-px bg-border" />
                  </>
                )}
                {category && (
                  <span className={cn(
                    "text-[11px] font-medium px-2 py-0.5 rounded-full",
                    CATEGORY_COLORS[category]?.bg ?? "bg-muted",
                    CATEGORY_COLORS[category]?.text ?? "text-muted-foreground"
                  )}>
                    {category}
                  </span>
                )}
                {!isNew && (
                  <span className="text-[11px] text-muted-foreground">
                    {isNew ? "New Task" : "Edit Task"}
                  </span>
                )}
                {isNew && (
                  <span className="text-sm font-semibold text-foreground">New Task</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Assignee avatar */}
                {assigneeProfile && (
                  <div className="flex items-center gap-1.5" title={`Assigned to ${assigneeProfile.full_name}`}>
                    <Avatar className="h-6 w-6 rounded-full">
                      <AvatarFallback className="rounded-full bg-foreground/[0.06] text-foreground text-[9px] font-semibold">
                        {assigneeProfile.full_name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="h-4 w-px bg-border" />
                  </div>
                )}
                {!isNew && (
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
                    title="Copy task link"
                  >
                    <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                    <span className="hidden sm:inline">Copy link</span>
                  </button>
                )}
                <DialogPrimitive.Close className="rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                  <X className="h-4 w-4" />
                </DialogPrimitive.Close>
              </div>
            </div>

            {/* ── Approval Action Bar ────────────────────────────────── */}
            {!isNew && task.requires_approval && (
              <>
                {isPendingApproval && canActOnApproval && !showRevisionInput && !showRejectionInput && (
                  <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3 shrink-0 flex-wrap">
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
                {isPendingApproval && showRevisionInput && (
                  <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 space-y-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Request Revision</span>
                    </div>
                    <Textarea value={revisionNote} onChange={(e) => setRevisionNote(e.target.value)} placeholder="What needs to be changed?" rows={2} className="text-sm" />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowRevisionInput(false); setRevisionNote(""); }}>Cancel</Button>
                      <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs" onClick={handleRequestRevision} disabled={!revisionNote.trim() || approvalActionLoading}>Send</Button>
                    </div>
                  </div>
                )}
                {isPendingApproval && showRejectionInput && (
                  <div className="px-5 py-3 bg-red-500/10 border-b border-red-500/20 space-y-2 shrink-0">
                    <div className="flex items-center gap-2">
                      <X className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Reject Task</span>
                    </div>
                    <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} placeholder="Reason for rejection" rows={2} className="text-sm" />
                    <div className="flex gap-2 justify-end">
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setShowRejectionInput(false); setRejectionReason(""); }}>Cancel</Button>
                      <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleReject} disabled={!rejectionReason.trim() || approvalActionLoading}>Reject</Button>
                    </div>
                  </div>
                )}
                {isPendingApproval && !canActOnApproval && (
                  <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 shrink-0">
                    <Shield className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-muted-foreground">
                      Awaiting approval from {approverProfile?.full_name || "approver"}
                    </span>
                  </div>
                )}
                {taskApproval?.approval_status === "approved" && task.status === "Complete" && (
                  <div className="px-5 py-2 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center gap-2 shrink-0">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span className="text-sm">Approved by {approverProfile?.full_name || "approver"}</span>
                    {taskApproval.responded_at && (
                      <span className="text-xs text-muted-foreground ml-auto">
                        {new Date(taskApproval.responded_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                )}
                {taskApproval?.approval_status === "revision_requested" && task.status === "In Progress" && (
                  <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 space-y-2 shrink-0">
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
                {taskApproval?.approval_status === "rejected" && (
                  <div className="px-5 py-2.5 bg-red-500/10 border-b border-red-500/20 space-y-2 shrink-0">
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

            {/* ── Two-column body — unified scroll ────────────────── */}
            <div className="flex-1 min-h-0 overflow-y-auto task-panel-feed">
              <div className="flex min-h-full max-lg:flex-col">
              {/* ── Left column: task fields ────────────────────────── */}
              <div className="lg:w-[56%] lg:border-r border-border">
                <div className="px-5 py-4 space-y-4">
                  {/* Status / Priority / Due chips */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Select value={status} onValueChange={(v) => {
                      if (v === "Pending Approval" && task?.requires_approval) {
                        setShowSubmitConfirm(true);
                      } else {
                        setStatus(v);
                      }
                    }}>
                      <SelectTrigger className="h-7 w-auto gap-1.5 px-2.5 text-xs font-medium rounded-full border-border bg-muted/50 hover:bg-muted transition-colors [&>svg]:h-3 [&>svg]:w-3">
                        {statusIcon()}
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="h-7 w-auto gap-1.5 px-2.5 text-xs font-medium rounded-full border-border bg-muted/50 hover:bg-muted transition-colors [&>svg]:h-3 [&>svg]:w-3">
                        {priorityIcon()}
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {dueDateLabel && (
                      <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full bg-muted/50 border border-border", dueDateLabel.color)}>
                        {dueDateLabel.text}
                      </span>
                    )}

                    {!isNew && task.requires_approval && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-500 border border-blue-500/20">
                        <Shield className="h-2.5 w-2.5" />
                        Approval
                      </span>
                    )}
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

                  {/* Title */}
                  <Textarea
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    rows={1}
                    className="text-lg font-semibold border-none bg-transparent px-0 py-0 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 min-h-0"
                    onInput={(e) => {
                      const el = e.target as HTMLTextAreaElement;
                      el.style.height = "auto";
                      el.style.height = el.scrollHeight + "px";
                    }}
                  />

                  {/* Description — click to edit */}
                  {editingDescription || isNew ? (
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={2}
                      className="text-sm resize-y"
                      autoFocus={editingDescription}
                      onBlur={() => {
                        if (!isNew) setEditingDescription(false);
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingDescription(true)}
                      className={cn(
                        "w-full text-left text-sm rounded-md px-2 py-1.5 -mx-0.5 transition-colors min-h-[32px]",
                        "border border-transparent hover:border-border hover:bg-muted/40",
                        description ? "text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {description || "Click to add description..."}
                    </button>
                  )}

                  {/* Metadata grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-0">
                      <span className="inline-field-label">Assignee</span>
                      <Select value={assignedTo} onValueChange={setAssignedTo}>
                        <SelectTrigger className="inline-field text-sm">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {profiles.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-0">
                      <span className="inline-field-label">Due Date</span>
                      <DatePicker value={dueDate} onChange={setDueDate} />
                    </div>

                    <div className="space-y-0">
                      <span className="inline-field-label">Category</span>
                      <Select value={category || "none"} onValueChange={(v) => setCategory(v === "none" ? "" : v)}>
                        <SelectTrigger className="inline-field text-sm">
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {TASK_CATEGORIES.map((c) => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-0">
                      <span className="inline-field-label flex items-center gap-1">
                        <Link2 className="h-3 w-3" strokeWidth={1.5} />
                        Linked
                      </span>
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
                        <Switch id="new_requires_approval" checked={requiresApproval} onCheckedChange={setRequiresApproval} />
                      </div>
                      <div
                        className="overflow-hidden transition-all duration-300 ease-in-out"
                        style={{ maxHeight: requiresApproval ? 300 : 0, opacity: requiresApproval ? 1 : 0 }}
                      >
                        <div className="mt-3 rounded-lg border border-border bg-muted/50 p-3 space-y-3">
                          <div className="space-y-1.5">
                            <Label htmlFor="new_approver" className="text-xs font-semibold">Approver *</Label>
                            <Select value={newApproverId || "none"} onValueChange={(v) => setNewApproverId(v === "none" ? "" : v)}>
                              <SelectTrigger><SelectValue placeholder="Select approver" /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Select approver</SelectItem>
                                {profiles.filter((p) => p.id !== assignedTo).map((p) => (
                                  <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
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

                  {/* Approver metadata (existing approval tasks) */}
                  {!isNew && task.requires_approval && (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0">
                          <span className="inline-field-label flex items-center gap-1">
                            <Shield className="h-3 w-3" strokeWidth={1.5} />
                            Approver
                          </span>
                          <div className="px-2 py-1 rounded-md border border-transparent text-sm text-foreground min-h-[32px] flex items-center">
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
                      <Repeat className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
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

                  {/* Attachments */}
                  <div className="space-y-2">
                    <span className="inline-field-label">Attachments</span>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileRef.current?.click()}
                      className={cn(
                        "flex flex-col items-center justify-center gap-1 py-2.5 rounded-md border border-dashed cursor-pointer transition-colors",
                        isDragging
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-ring/50"
                      )}
                    >
                      <Upload className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
                      <span className="text-[11px] text-muted-foreground">
                        {uploading ? "Uploading..." : "Drop files or click to browse"}
                      </span>
                    </div>
                    {/* Staged files (new tasks) */}
                    {isNew && stagedFiles.length > 0 && (
                      <div className="space-y-1">
                        {stagedFiles.map((file, i) => (
                          <div key={`${file.name}-${i}`} className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-md border border-border">
                            <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                            <span className="text-[11px] font-medium flex-1 truncate">{file.name}</span>
                            <span className="text-[10px] text-muted-foreground">{(file.size / 1024).toFixed(0)}KB</span>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setStagedFiles((prev) => prev.filter((_, idx) => idx !== i)); }} className="text-muted-foreground hover:text-foreground p-0.5">
                              <X className="h-3 w-3" strokeWidth={1.5} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Uploaded attachments (existing tasks) */}
                    {!isNew && attachments.length > 0 && (
                      <div className="space-y-1">
                        {attachments.map((att) => {
                          const isImage = att.file_type?.startsWith("image/");
                          return (
                            <div key={att.id} className="flex items-center gap-2 px-2 py-1 bg-secondary rounded-md border border-border group">
                              {isImage ? (
                                <Image className="h-3 w-3 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                              ) : (
                                <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />
                              )}
                              <button
                                type="button"
                                onClick={() => handlePreviewAttachment(att)}
                                className="text-[11px] font-medium flex-1 truncate text-left hover:text-primary transition-colors cursor-pointer"
                              >
                                {att.file_name}
                              </button>
                              <button type="button" onClick={() => handlePreviewAttachment(att)} className="text-muted-foreground hover:text-foreground p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" title="Preview">
                                <Eye className="h-3 w-3" strokeWidth={1.5} />
                              </button>
                              <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-muted-foreground hover:text-foreground p-0.5">
                                <X className="h-3 w-3" strokeWidth={1.5} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Footer ─────────────────────────────────────────── */}
                <div className="flex items-center justify-between border-t border-border px-5 py-3">
                  {!isNew ? (
                    <div className="flex items-center gap-2">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 text-xs">
                            <Trash2 className="h-3.5 w-3.5 mr-1" strokeWidth={1.5} />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete task</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete &ldquo;{task.title}&rdquo;. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ) : (
                    <div />
                  )}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onClose}>Cancel</Button>
                    <Button size="sm" className="h-7 text-xs" onClick={handleSave} disabled={!title.trim() || saving}>
                      {saving ? "Saving..." : isNew ? "Create" : "Save changes"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Right column: comments / activity ───────────────── */}
              <div className="lg:w-[44%] flex flex-col max-lg:border-t max-lg:border-border lg:min-h-full">
                <div className="px-5 py-3 border-b border-border shrink-0">
                  <span className="text-sm font-semibold text-foreground">Activity</span>
                </div>

                {task ? (
                  <div className="flex-1 px-5 py-4">
                    <UnifiedNotes
                      entityType="task"
                      entityId={task.id}
                      compact
                      chatMode
                    />
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center px-5">
                    <p className="text-sm text-muted-foreground text-center">
                      Activity will appear here after the task is created.
                    </p>
                  </div>
                )}
              </div>
              </div>
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {/* Image Preview Overlay */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center gap-3">
            <div className="flex items-center gap-3 text-white">
              <span className="text-sm font-medium">{previewName}</span>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                title="Open in new tab"
              >
                <Download className="h-4 w-4" strokeWidth={1.5} />
              </a>
              <button onClick={() => setPreviewUrl(null)} className="p-1.5 rounded-md hover:bg-white/10 transition-colors">
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={previewName}
              className="max-w-[85vw] max-h-[80vh] rounded-lg object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

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
    </>
  );
}
