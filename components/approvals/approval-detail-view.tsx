"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
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
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock,
  AlertTriangle,
  User,
  FileText,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { formatRelativeTime } from "@/lib/notifications";
import {
  approveRequest,
  requestChanges,
  declineRequest,
  cancelApproval,
} from "@/app/(authenticated)/admin/operations/approvals/actions";
import type {
  ApprovalRequestWithProfiles,
  ApprovalAuditLogEntryWithProfile,
  ApprovalStatus,
  ApprovalPriority,
} from "@/lib/approvals/types";
import {
  APPROVAL_STATUS_LABELS,
  APPROVAL_STATUS_COLORS,
  APPROVAL_PRIORITY_COLORS,
  ENTITY_TYPE_LABELS,
} from "@/lib/approvals/types";

interface ApprovalDetailViewProps {
  approval: ApprovalRequestWithProfiles;
  auditLog: ApprovalAuditLogEntryWithProfile[];
  currentUserId: string;
  isApprover: boolean;
  isSubmitter: boolean;
}

function getSlaDisplay(slaDeadline: string | null, slaBreached: boolean) {
  if (slaBreached) return { label: "SLA Breached", color: "text-red-600" };
  if (!slaDeadline) return { label: "No SLA", color: "text-gray-500" };

  const now = new Date();
  const deadline = new Date(slaDeadline);
  const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursRemaining <= 0) return { label: "Overdue", color: "text-red-600" };
  if (hoursRemaining <= 4) return { label: `${Math.ceil(hoursRemaining)}h remaining`, color: "text-amber-600" };
  return { label: `${Math.ceil(hoursRemaining)}h remaining`, color: "text-green-600" };
}

const AUDIT_ACTION_ICONS: Record<string, { icon: typeof CheckCircle2; color: string }> = {
  submitted: { icon: FileText, color: "text-blue-500" },
  approved: { icon: CheckCircle2, color: "text-green-500" },
  declined: { icon: XCircle, color: "text-red-500" },
  changes_requested: { icon: RotateCcw, color: "text-amber-500" },
  resubmitted: { icon: FileText, color: "text-purple-500" },
  cancelled: { icon: XCircle, color: "text-gray-500" },
  sla_breached: { icon: AlertTriangle, color: "text-red-500" },
  reassigned: { icon: User, color: "text-blue-500" },
};

export function ApprovalDetailView({
  approval,
  auditLog,
  currentUserId,
  isApprover,
  isSubmitter,
}: ApprovalDetailViewProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [decisionNotes, setDecisionNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const snapshot = approval.deal_snapshot as Record<string, any>;
  const checklistResults = (approval.checklist_results as unknown as any[]) || [];
  const statusColors = APPROVAL_STATUS_COLORS[approval.status as ApprovalStatus];
  const priorityColors = APPROVAL_PRIORITY_COLORS[approval.priority as ApprovalPriority];
  const sla = getSlaDisplay(approval.sla_deadline, approval.sla_breached);
  const isPending = approval.status === "pending";

  async function handleApprove() {
    setLoading(true);
    setActiveAction("approve");
    const result = await approveRequest(approval.id, decisionNotes || undefined);
    setLoading(false);
    setActiveAction(null);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Approved", description: "The approval has been granted." });
      router.refresh();
    }
  }

  async function handleRequestChanges() {
    if (!decisionNotes.trim()) {
      toast({ title: "Notes required", description: "Please provide notes explaining what changes are needed.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setActiveAction("changes");
    const result = await requestChanges(approval.id, decisionNotes);
    setLoading(false);
    setActiveAction(null);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Changes Requested", description: "The submitter has been notified." });
      router.refresh();
    }
  }

  async function handleDecline() {
    if (!decisionNotes.trim()) {
      toast({ title: "Reason required", description: "Please provide a decline reason.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setActiveAction("decline");
    const result = await declineRequest(approval.id, decisionNotes);
    setLoading(false);
    setActiveAction(null);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Declined", description: "The approval has been declined." });
      router.refresh();
    }
  }

  async function handleCancel() {
    setLoading(true);
    setActiveAction("cancel");
    const result = await cancelApproval(approval.id);
    setLoading(false);
    setActiveAction(null);
    if (result.error) {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Cancelled", description: "The approval has been cancelled." });
      router.push("/admin/operations/approvals");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="mb-2 -ml-2"
            onClick={() => router.push("/admin/operations/approvals")}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Approvals
          </Button>
          <h1 className="text-2xl font-bold text-[#1a2b4a]">
            Approve: {snapshot?.borrower_name || "Unknown"} –{" "}
            {snapshot?.loan_amount ? formatCurrency(Number(snapshot.loan_amount)) : ""}{" "}
            {snapshot?.property_type || snapshot?.type || ""}
          </h1>
          <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
            <span>Submitted by {approval.submitter_name}</span>
            <span>·</span>
            <span>{formatRelativeTime(approval.created_at)}</span>
            <span>·</span>
            <span className={cn("font-medium", sla.color)}>
              <Clock className="h-3.5 w-3.5 inline mr-1" />
              {sla.label}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", priorityColors?.badge)}>
            {approval.priority}
          </span>
          <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold", statusColors?.badge)}>
            {APPROVAL_STATUS_LABELS[approval.status as ApprovalStatus]}
          </span>
        </div>
      </div>

      {/* Deal Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Deal Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Loan Amount</p>
              <p className="font-semibold text-[#1a2b4a]">
                {snapshot?.loan_amount ? formatCurrency(Number(snapshot.loan_amount)) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">LTV</p>
              <p className="font-semibold text-[#1a2b4a]">
                {snapshot?.ltv ? formatPercent(Number(snapshot.ltv)) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Property Type</p>
              <p className="font-semibold text-[#1a2b4a]">
                {(snapshot?.property_type || "—").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Interest Rate</p>
              <p className="font-semibold text-[#1a2b4a]">
                {snapshot?.interest_rate ? formatPercent(Number(snapshot.interest_rate)) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Term</p>
              <p className="font-semibold text-[#1a2b4a]">
                {snapshot?.loan_term_months ? `${snapshot.loan_term_months} months` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Loan Type</p>
              <p className="font-semibold text-[#1a2b4a]">
                {(snapshot?.type || "—").toUpperCase()}
              </p>
            </div>
          </div>

          {(snapshot?.property_address || snapshot?.property_city) && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-1">Property</p>
              <p className="text-sm">
                {snapshot.property_address || ""}{" "}
                {snapshot.property_city && `${snapshot.property_city}, `}
                {snapshot.property_state || ""}{" "}
                {snapshot.property_zip || ""}
              </p>
            </div>
          )}

          {snapshot?.borrower_name && (
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1">Borrower</p>
              <p className="text-sm font-medium">{snapshot.borrower_name}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Notes */}
      {approval.submission_notes && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Submission Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {approval.submission_notes}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Validation Checklist */}
      {Array.isArray(checklistResults) && checklistResults.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              Validation Checklist
              {checklistResults.every((r: any) => r.passed) ? (
                <Badge variant="success" className="text-xs">All passed</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  {checklistResults.filter((r: any) => !r.passed).length} failed
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {checklistResults.map((item: any, i: number) => (
                <span
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium",
                    item.passed ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}
                >
                  {item.passed ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {item.label}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Decision Notes (if already decided) */}
      {approval.decision_notes && approval.status !== "pending" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Decision Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{approval.decision_notes}</p>
            {approval.decision_at && (
              <p className="text-xs text-muted-foreground mt-2">
                Decided {formatRelativeTime(approval.decision_at)} by {approval.approver_name}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Panel */}
      {isPending && isApprover && (
        <Card className="border-2 border-[#1a2b4a]/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Decision</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">
                Decision Notes
                <span className="text-muted-foreground font-normal ml-1">(optional for approve, required for changes/decline)</span>
              </label>
              <Textarea
                placeholder="Add notes about your decision..."
                value={decisionNotes}
                onChange={(e) => setDecisionNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleApprove}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {loading && activeAction === "approve" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>

              <Button
                onClick={handleRequestChanges}
                disabled={loading}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                {loading && activeAction === "changes" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                <RotateCcw className="h-4 w-4 mr-2" />
                Request Changes
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={loading}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Decline this approval?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will decline the request and notify the submitter. A decline reason is required.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDecline}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {loading && activeAction === "decline" && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirm Decline
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancel button for submitter if still pending */}
      {(isPending || approval.status === "changes_requested") && isSubmitter && (
        <div className="flex justify-end">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-muted-foreground">
                Cancel this approval request
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Cancel approval request?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will cancel the approval request. You can submit a new one later.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep it</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel}>
                  Yes, cancel
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Audit Trail */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Audit Trail</CardTitle>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">No audit entries yet.</p>
          ) : (
            <div className="space-y-3">
              {auditLog.map((entry) => {
                const iconConfig = AUDIT_ACTION_ICONS[entry.action] || { icon: FileText, color: "text-gray-400" };
                const Icon = iconConfig.icon;

                return (
                  <div key={entry.id} className="flex items-start gap-3">
                    <div className={cn("mt-0.5", iconConfig.color)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{entry.performer_name}</span>
                        {" "}
                        <span className="text-muted-foreground">
                          {entry.action.replace(/_/g, " ")}
                        </span>
                      </p>
                      {entry.notes && (
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {entry.notes}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(entry.created_at)} · {new Date(entry.created_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
