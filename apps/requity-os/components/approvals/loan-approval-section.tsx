"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  RotateCcw,
  ExternalLink,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/notifications";
import { createClient } from "@/lib/supabase/client";
import { SubmitForApprovalDialog } from "./submit-for-approval-dialog";
import type { ApprovalStatus } from "@/lib/approvals/types";
import { APPROVAL_STATUS_LABELS, APPROVAL_STATUS_COLORS } from "@/lib/approvals/types";

interface LoanApprovalSectionProps {
  loanId: string;
  loanData: Record<string, any>;
  borrowerName: string;
}

interface ApprovalInfo {
  id: string;
  status: ApprovalStatus;
  priority: string;
  sla_deadline: string | null;
  sla_breached: boolean;
  created_at: string;
  decision_at: string | null;
  decision_notes: string | null;
  submission_notes: string | null;
  assigned_to: string;
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  approved: CheckCircle2,
  changes_requested: RotateCcw,
  declined: XCircle,
  cancelled: XCircle,
};

export function LoanApprovalSection({
  loanId,
  loanData,
  borrowerName,
}: LoanApprovalSectionProps) {
  const router = useRouter();
  const [latestApproval, setLatestApproval] = useState<ApprovalInfo | null>(null);
  const [approverName, setApproverName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApproval() {
      const supabase = createClient();
      const { data } = await (supabase as any)
        .from("approval_requests")
        .select("id, status, priority, sla_deadline, sla_breached, created_at, decision_at, decision_notes, submission_notes, assigned_to")
        .eq("entity_type", "loan")
        .eq("entity_id", loanId)
        .order("created_at", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setLatestApproval(data[0]);
        // Fetch approver name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", data[0].assigned_to)
          .single();
        setApproverName(profile?.full_name || "Unknown");
      }
      setLoading(false);
    }

    fetchApproval();
  }, [loanId]);

  if (loading) return null;

  // Build deal snapshot for submission
  const dealSnapshot: Record<string, any> = {
    loan_amount: loanData.loan_amount,
    ltv: loanData.ltv,
    property_type: loanData.property_type,
    property_address: loanData.property_address,
    property_city: loanData.property_city,
    property_state: loanData.property_state,
    property_zip: loanData.property_zip,
    type: loanData.loan_type || loanData.type,
    interest_rate: loanData.interest_rate,
    loan_term_months: loanData.term_months || loanData.loan_term_months,
    borrower_name: borrowerName,
    borrower_id: loanData.borrower_id,
    purchase_price: loanData.purchase_price,
    appraised_value: loanData.appraised_value,
  };

  // Entity data for routing + validation (same fields but flat)
  const entityData = {
    ...dealSnapshot,
    loan_amount: loanData.loan_amount,
  };

  // No approval exists yet - show submit button
  if (!latestApproval) {
    return (
      <SubmitForApprovalDialog
        entityType="loan"
        entityId={loanId}
        entityData={entityData}
        dealSnapshot={dealSnapshot}
        trigger={
          <Button className="gap-2 bg-primary hover:bg-primary/90" size="sm">
            <Send className="h-4 w-4" />
            Submit for Approval
          </Button>
        }
      />
    );
  }

  const status = latestApproval.status as ApprovalStatus;
  const statusColors = APPROVAL_STATUS_COLORS[status];
  const StatusIcon = STATUS_ICONS[status] || Clock;

  return (
    <Card className={cn("border-l-4", {
      "border-l-yellow-400": status === "pending",
      "border-l-green-500": status === "approved",
      "border-l-amber-500": status === "changes_requested",
      "border-l-red-500": status === "declined",
      "border-l-gray-400": status === "cancelled",
    })}>
      <CardContent className="py-3 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon className={cn("h-5 w-5", {
              "text-yellow-600": status === "pending",
              "text-green-600": status === "approved",
              "text-amber-600": status === "changes_requested",
              "text-red-600": status === "declined",
              "text-gray-500": status === "cancelled",
            })} />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">
                  Approval: {APPROVAL_STATUS_LABELS[status]}
                </span>
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", statusColors?.badge)}>
                  {APPROVAL_STATUS_LABELS[status]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status === "pending" && `Assigned to ${approverName} · ${formatRelativeTime(latestApproval.created_at)}`}
                {status === "approved" && `Approved by ${approverName} · ${latestApproval.decision_at ? formatRelativeTime(latestApproval.decision_at) : ""}`}
                {status === "changes_requested" && `Changes requested by ${approverName}`}
                {status === "declined" && `Declined by ${approverName}`}
                {status === "cancelled" && "Cancelled"}
              </p>
              {latestApproval.decision_notes && status !== "pending" && (
                <p className="text-xs text-muted-foreground mt-1 italic">
                  &ldquo;{latestApproval.decision_notes}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {status === "changes_requested" && (
              <SubmitForApprovalDialog
                entityType="loan"
                entityId={loanId}
                entityData={entityData}
                dealSnapshot={dealSnapshot}
                existingApprovalId={latestApproval.id}
                trigger={
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <RotateCcw className="h-3.5 w-3.5" />
                    Resubmit
                  </Button>
                }
              />
            )}
            {(status === "declined" || status === "cancelled") && (
              <SubmitForApprovalDialog
                entityType="loan"
                entityId={loanId}
                entityData={entityData}
                dealSnapshot={dealSnapshot}
                trigger={
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    New Approval
                  </Button>
                }
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              className="gap-1.5 text-xs"
              onClick={() => router.push(`/tasks/approvals/${latestApproval.id}`)}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
