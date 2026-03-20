"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import {
  Shield,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  User,
  Tag,
  Calendar,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { CategoryPill } from "./category-pill";
import type { OpsTask, Profile } from "@/lib/tasks";
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
  isDueOverdue,
  submitApprovalDecision,
} from "@/lib/tasks";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";

interface ApprovalDrawerProps {
  task: OpsTask | null;
  currentUserId: string;
  profiles: Profile[];
  onClose: () => void;
  onUpdated: (task: OpsTask) => void;
}

export function ApprovalDrawer({
  task,
  currentUserId,
  profiles,
  onClose,
  onUpdated,
}: ApprovalDrawerProps) {
  const { toast } = useToast();
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const open = !!task;
  const statusKey = task?.approval_status ?? "pending";
  const statusColor =
    APPROVAL_STATUS_COLORS[statusKey] ?? APPROVAL_STATUS_COLORS.pending;
  const isAwaitingRevision = statusKey === "awaiting_revision";
  const isRequestor = task?.requestor_user_id === currentUserId;
  const isAssignee = task?.assigned_to === currentUserId;
  const isCompleted = statusKey === "approved" || task?.status === "Complete";

  const handleDecision = useCallback(
    async (decision: "approve" | "reject" | "resubmit") => {
      if (!task) return;
      if (decision === "reject" && !note.trim()) {
        toast({
          title: "Note required",
          description: "Please provide a reason when rejecting.",
          variant: "destructive",
        });
        return;
      }

      setSubmitting(true);
      const result = await submitApprovalDecision(
        task.id,
        decision,
        currentUserId,
        note.trim() || undefined
      );

      if (!result.success) {
        toast({
          title: "Decision failed",
          description: result.error ?? "Unknown error",
          variant: "destructive",
        });
      } else {
        const decisionLabel =
          decision === "approve"
            ? "Approved"
            : decision === "reject"
              ? "Rejected"
              : "Resubmitted";
        toast({ title: `${decisionLabel} successfully` });

        const newStatus =
          decision === "approve"
            ? "approved"
            : decision === "reject"
              ? "awaiting_revision"
              : "resubmitted";
        onUpdated({
          ...task,
          approval_status: newStatus,
          status: decision === "approve" ? "Complete" : task.status,
          decision_note: note.trim() || task.decision_note,
          updated_at: new Date().toISOString(),
        });
        setNote("");
      }
      setSubmitting(false);
    },
    [task, note, currentUserId, toast, onUpdated]
  );

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        setNote("");
        onClose();
      }
    },
    [onClose]
  );

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-[460px] p-0 flex flex-col">
        {/* Header */}
        <SheetHeader className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <div
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center",
                isAwaitingRevision
                  ? "bg-red-100 dark:bg-red-950/30"
                  : "bg-violet-100 dark:bg-violet-950/30"
              )}
            >
              <Shield
                className={cn(
                  "h-3.5 w-3.5",
                  isAwaitingRevision
                    ? "text-red-600 dark:text-red-400"
                    : "text-violet-600 dark:text-violet-400"
                )}
                strokeWidth={1.5}
              />
            </div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400">
              <Check className="h-2.5 w-2.5" strokeWidth={3} />
              Approval
            </span>
            <span
              className={cn(
                "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold",
                statusColor.bg,
                statusColor.text
              )}
            >
              {APPROVAL_STATUS_LABELS[statusKey] ?? statusKey}
            </span>
          </div>
          <SheetTitle className="text-[15px] font-semibold leading-snug">
            {task.title}
          </SheetTitle>
          <SheetDescription className="sr-only">
            Approval detail and actions
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-0">
            {/* Rejected notice */}
            {isAwaitingRevision && (
              <div className="mx-5 mt-4 p-3 rounded-lg bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 flex items-start gap-2">
                <AlertTriangle
                  className="h-3.5 w-3.5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  strokeWidth={2}
                />
                <div>
                  <p className="text-[12px] font-semibold text-red-600 dark:text-red-400">
                    Approval rejected
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">
                    This item has been returned. The requestor must revise and
                    resubmit before it can be actioned again.
                  </p>
                </div>
              </div>
            )}

            {/* Metadata grid */}
            <div className="px-5 py-4 border-b border-border">
              {task.description && (
                <p className="text-sm text-muted-foreground mb-3">
                  {task.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                {task.requestor_name && (
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                      <User className="h-[11px] w-[11px]" strokeWidth={1.5} />
                      Requested by
                    </div>
                    <p className="text-[13px] font-medium">
                      {task.requestor_name}
                    </p>
                  </div>
                )}
                {task.category && (
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                      <Tag className="h-[11px] w-[11px]" strokeWidth={1.5} />
                      Category
                    </div>
                    <CategoryPill category={task.category} />
                  </div>
                )}
                {task.due_date && (
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                      <Calendar
                        className="h-[11px] w-[11px]"
                        strokeWidth={1.5}
                      />
                      Due
                    </div>
                    <p
                      className={cn(
                        "text-[13px] font-medium num",
                        isDueOverdue(task.due_date) && "text-destructive"
                      )}
                    >
                      {new Date(
                        task.due_date + "T00:00:00"
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                )}
                {task.amount != null && (
                  <div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mb-1">
                      <FileText
                        className="h-[11px] w-[11px]"
                        strokeWidth={1.5}
                      />
                      Amount
                    </div>
                    <p
                      className={cn(
                        "text-[13px] font-bold num",
                        isAwaitingRevision
                          ? "text-muted-foreground line-through"
                          : "text-violet-600 dark:text-violet-400"
                      )}
                    >
                      ${Number(task.amount).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Previous decision note */}
            {task.decision_note && (
              <div className="px-5 py-4 border-b border-border">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Decision Note
                </Label>
                <p className="text-sm mt-1.5">{task.decision_note}</p>
              </div>
            )}

            {/* Note input */}
            {!isCompleted && !isAwaitingRevision && (
              <div className="px-5 py-4 border-b border-border">
                <Label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 block">
                  Note (optional)
                </Label>
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add a note to your decision..."
                  rows={3}
                  className="resize-y"
                />
              </div>
            )}

            {/* Comments */}
            <div className="px-5 py-4">
              <UnifiedNotes entityType="task" entityId={task.id} compact />
            </div>
          </div>
        </ScrollArea>

        {/* Action buttons */}
        <div className="border-t border-border px-5 py-4">
          {isCompleted ? (
            <div className="flex items-center justify-center gap-2 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[13px] font-semibold">
              <Check className="h-4 w-4" strokeWidth={2} />
              Approved
            </div>
          ) : isAwaitingRevision ? (
            isRequestor ? (
              <Button
                className="w-full gap-1.5"
                onClick={() => handleDecision("resubmit")}
                disabled={submitting}
              >
                <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
                {submitting ? "Resubmitting..." : "Resubmit for Approval"}
              </Button>
            ) : (
              <div className="py-2.5 px-3 rounded-lg bg-red-100 dark:bg-red-950/30 border border-red-200 dark:border-red-900/30 text-[12px] text-muted-foreground text-center leading-relaxed">
                Awaiting revised submission from requestor
              </div>
            )
          ) : (
            <div className="flex gap-2.5">
              <Button
                className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => handleDecision("approve")}
                disabled={submitting || !isAssignee}
              >
                <ThumbsUp className="h-3.5 w-3.5" strokeWidth={2} />
                {submitting ? "Approving..." : "Approve"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex-1 gap-1.5 border-destructive text-destructive hover:bg-destructive/10"
                    disabled={submitting || !isAssignee}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" strokeWidth={2} />
                    Reject
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject approval</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send the approval back to the requestor for
                      revision. A note is required.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDecision("reject")}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Reject
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
