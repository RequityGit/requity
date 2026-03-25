"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import {
  requestDealApproval,
  approveDealAction,
  declineDealAction,
  requestDealChangesAction,
} from "@/app/(authenticated)/(admin)/pipeline/approval-actions";

type ApprovalStatus = "pending" | "approved" | "changes_requested" | "declined" | null;

interface ApprovalBannerProps {
  dealId: string;
  dealName: string;
  stage: string;
  approvalStatus: ApprovalStatus;
  isSuperAdmin: boolean;
  /** Notes from the reviewer (for changes_requested / declined) */
  decisionNotes?: string | null;
  /** Who submitted the approval */
  submitterName?: string | null;
}

export function ApprovalBanner({
  dealId,
  dealName,
  stage,
  approvalStatus,
  isSuperAdmin,
  decisionNotes,
  submitterName,
}: ApprovalBannerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showNotesInput, setShowNotesInput] = useState(false);
  const [notes, setNotes] = useState("");
  const [actionType, setActionType] = useState<"approve" | "decline" | "changes" | "request" | null>(null);

  // Only show on analysis stage
  if (stage !== "analysis") return null;

  async function handleRequestApproval() {
    setActionType("request");
    startTransition(async () => {
      const result = await requestDealApproval(dealId, notes || undefined);
      if (result.error) {
        showError("Could not request approval", result.error);
      } else {
        showSuccess("Approval requested");
        setNotes("");
        setShowNotesInput(false);
      }
      setActionType(null);
      router.refresh();
    });
  }

  async function handleApprove() {
    setActionType("approve");
    startTransition(async () => {
      const result = await approveDealAction(dealId, notes || undefined);
      if (result.error) {
        showError("Could not approve deal", result.error);
      } else {
        showSuccess("Deal approved and advanced to Negotiation");
      }
      setActionType(null);
      router.refresh();
    });
  }

  async function handleDecline() {
    setActionType("decline");
    startTransition(async () => {
      const result = await declineDealAction(dealId, notes || undefined);
      if (result.error) {
        showError("Could not decline deal", result.error);
      } else {
        showSuccess("Deal approval declined");
      }
      setActionType(null);
      setShowNotesInput(false);
      setNotes("");
      router.refresh();
    });
  }

  async function handleRequestChanges() {
    if (!notes.trim()) {
      showError("Could not request changes", "Please provide notes describing the required changes");
      return;
    }
    setActionType("changes");
    startTransition(async () => {
      const result = await requestDealChangesAction(dealId, notes);
      if (result.error) {
        showError("Could not request changes", result.error);
      } else {
        showSuccess("Changes requested");
      }
      setActionType(null);
      setShowNotesInput(false);
      setNotes("");
      router.refresh();
    });
  }

  async function handleResubmit() {
    setActionType("request");
    startTransition(async () => {
      const result = await requestDealApproval(dealId, notes || "Resubmitted after changes");
      if (result.error) {
        showError("Could not resubmit for approval", result.error);
      } else {
        showSuccess("Resubmitted for approval");
        setNotes("");
        setShowNotesInput(false);
      }
      setActionType(null);
      router.refresh();
    });
  }

  // ─── No approval requested yet ───
  if (!approvalStatus || approvalStatus === "declined") {
    return (
      <div className="mx-6 mb-4 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" />
            <span>
              {approvalStatus === "declined"
                ? "Approval was declined. You can resubmit after making changes."
                : "Analysis complete? Submit for approval to advance to Negotiation."}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {showNotesInput ? (
              <div className="flex items-center gap-2">
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes for reviewer..."
                  className="h-8 min-h-[32px] w-64 resize-none text-xs"
                  rows={1}
                />
                <Button
                  size="sm"
                  onClick={handleRequestApproval}
                  disabled={isPending}
                  className="h-8"
                >
                  {isPending && actionType === "request" ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Submit
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => setShowNotesInput(true)}
                className="h-8"
              >
                <ShieldCheck className="mr-1.5 h-3.5 w-3.5" />
                Request Approval
              </Button>
            )}
          </div>
        </div>
        {approvalStatus === "declined" && decisionNotes && (
          <div className="mt-2 rounded-md bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 px-3 py-2 text-xs text-red-700 dark:text-red-300">
            <span className="font-medium">Reason:</span> {decisionNotes}
          </div>
        )}
      </div>
    );
  }

  // ─── Pending approval ───
  if (approvalStatus === "pending") {
    // Super admin sees approve/decline actions
    if (isSuperAdmin) {
      return (
        <div className="mx-6 mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
              <Clock className="h-4 w-4" />
              <span>
                Awaiting your approval
                {submitterName ? ` (submitted by ${submitterName})` : ""}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {showNotesInput ? (
                <div className="flex items-center gap-2">
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Decision notes..."
                    className="h-8 min-h-[32px] w-64 resize-none text-xs"
                    rows={1}
                  />
                  <Button
                    size="sm"
                    variant="default"
                    onClick={handleApprove}
                    disabled={isPending}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {isPending && actionType === "approve" ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleRequestChanges}
                    disabled={isPending}
                    className="h-8"
                  >
                    {isPending && actionType === "changes" ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Request Changes
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleDecline}
                    disabled={isPending}
                    className="h-8"
                  >
                    {isPending && actionType === "decline" ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Decline
                  </Button>
                </div>
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setShowNotesInput(true);
                    }}
                    className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                    Review & Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowNotesInput(true);
                    }}
                    className="h-8"
                  >
                    <XCircle className="mr-1.5 h-3.5 w-3.5" />
                    Decline
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Non-super-admin sees waiting state
    return (
      <div className="mx-6 mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
          <Clock className="h-4 w-4" />
          <span>Approval requested -- awaiting review from admin</span>
        </div>
      </div>
    );
  }

  // ─── Changes requested ───
  if (approvalStatus === "changes_requested") {
    return (
      <div className="mx-6 mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span>Changes requested -- please review and resubmit</span>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={handleResubmit}
            disabled={isPending}
            className="h-8"
          >
            {isPending && actionType === "request" ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 h-3.5 w-3.5" />
            )}
            Resubmit for Approval
          </Button>
        </div>
        {decisionNotes && (
          <div className="mt-2 rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
            <span className="font-medium">Reviewer notes:</span> {decisionNotes}
          </div>
        )}
      </div>
    );
  }

  return null;
}
