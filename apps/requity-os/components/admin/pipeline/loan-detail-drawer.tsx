"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { StagePill } from "@/components/admin/pipeline/stage-pill";
import { formatCurrency, formatDate, formatPercent } from "@/lib/format";
import { LOAN_TYPES } from "@/lib/constants";
import type { LucideIcon } from "lucide-react";
import {
  MapPin,
  User,
  DollarSign,
  Calendar,
  FileText,
  ArrowUpRight,
  Clock,
  Building2,
  Percent,
  Hash,
} from "lucide-react";
import Link from "next/link";
import type { LendingPipelineRow } from "./lending-pipeline-table";

interface LoanDetailDrawerProps {
  loan: LendingPipelineRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getDaysInStage(stageUpdatedAt: string): number {
  const updated = new Date(stageUpdatedAt);
  const now = new Date();
  return Math.floor(
    (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24)
  );
}

function formatLoanType(type: string | null): string {
  if (!type) return "--";
  const found = LOAN_TYPES.find((t) => t.value === type);
  return found ? found.label : type.replace(/_/g, " ");
}

function DetailRow({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: LucideIcon;
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between py-2.5 border-b border-[rgba(0,0,0,0.04)] dark:border-[rgba(255,255,255,0.04)] last:border-0">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
        <span className="text-[12px] font-medium">{label}</span>
      </div>
      <span
        className={`text-[13px] font-medium text-foreground text-right max-w-[55%] truncate ${mono ? "num" : ""}`}
      >
        {value ?? "--"}
      </span>
    </div>
  );
}

export function LoanDetailDrawer({
  loan,
  open,
  onOpenChange,
}: LoanDetailDrawerProps) {
  if (!loan) return null;

  const days = getDaysInStage(loan.stage_updated_at);
  const fullAddress = [
    loan.property_address,
    loan.property_city,
    loan.property_state,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-0"
      >
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-[16px] font-bold text-foreground leading-tight truncate">
                {loan.property_address ?? "Untitled Loan"}
              </SheetTitle>
              <SheetDescription className="text-[12px] text-muted-foreground mt-1">
                {loan.loan_number ? `#${loan.loan_number}` : "No loan number"}{" "}
                {loan.property_city || loan.property_state
                  ? ` \u00B7 ${[loan.property_city, loan.property_state].filter(Boolean).join(", ")}`
                  : ""}
              </SheetDescription>
            </div>
          </div>

          {/* Stage + Days */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <StagePill stage={loan.stage} />
            <span className="inline-flex items-center gap-1 text-[11px] num font-medium text-muted-foreground">
              <Clock className="h-3 w-3" strokeWidth={1.5} />
              {days}d in stage
            </span>
          </div>
        </SheetHeader>

        {/* Body */}
        <div className="px-6 py-4 space-y-6">
          {/* Loan Amount Hero */}
          <div className="rounded-xl border bg-muted/30 p-4 text-center">
            <p className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground mb-1">
              Loan Amount
            </p>
            <p className="text-[28px] num font-bold text-foreground tracking-[-0.04em]">
              {formatCurrency(loan.loan_amount)}
            </p>
          </div>

          {/* Property Details */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground mb-2">
              Property
            </h3>
            <div className="rounded-lg border bg-card p-3">
              <DetailRow
                icon={MapPin}
                label="Address"
                value={fullAddress || "--"}
              />
              <DetailRow
                icon={Building2}
                label="Property Type"
                value={
                  loan.property_type
                    ? loan.property_type.replace(/_/g, " ").toUpperCase()
                    : "--"
                }
              />
              {loan.appraised_value != null && (
                <DetailRow
                  icon={DollarSign}
                  label="Appraised Value"
                  value={formatCurrency(loan.appraised_value)}
                  mono
                />
              )}
            </div>
          </div>

          {/* Loan Details */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground mb-2">
              Loan Details
            </h3>
            <div className="rounded-lg border bg-card p-3">
              <DetailRow
                icon={FileText}
                label="Loan Type"
                value={formatLoanType(loan.loan_type)}
              />
              <DetailRow
                icon={DollarSign}
                label="Amount"
                value={formatCurrency(loan.loan_amount)}
                mono
              />
              {loan.interest_rate != null && (
                <DetailRow
                  icon={Percent}
                  label="Interest Rate"
                  value={formatPercent(loan.interest_rate)}
                  mono
                />
              )}
              {loan.loan_term_months != null && (
                <DetailRow
                  icon={Calendar}
                  label="Term"
                  value={`${loan.loan_term_months} months`}
                  mono
                />
              )}
              {loan.ltv != null && (
                <DetailRow
                  icon={Hash}
                  label="LTV"
                  value={formatPercent(loan.ltv)}
                  mono
                />
              )}
            </div>
          </div>

          {/* People */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground mb-2">
              People
            </h3>
            <div className="rounded-lg border bg-card p-3">
              <DetailRow
                icon={User}
                label="Borrower"
                value={loan.borrower_name}
              />
              <DetailRow
                icon={User}
                label="Originator"
                value={loan.originator_name}
              />
              <DetailRow
                icon={User}
                label="Processor"
                value={loan.processor_name}
              />
            </div>
          </div>

          {/* Activity */}
          <div>
            <h3 className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground mb-2">
              Activity
            </h3>
            <div className="rounded-lg border bg-card p-3">
              <DetailRow
                icon={Calendar}
                label="Created"
                value={formatDate(loan.created_at)}
              />
              <DetailRow
                icon={Clock}
                label="Stage Updated"
                value={formatDate(loan.stage_updated_at)}
              />
              <DetailRow
                icon={FileText}
                label="Documents"
                value={`${loan.document_count} uploaded`}
              />
              <DetailRow
                icon={FileText}
                label="Conditions"
                value={`${loan.total_conditions} total`}
              />
              {loan.next_action && (
                <DetailRow
                  icon={Calendar}
                  label="Next Action"
                  value={
                    <span className="text-[#CC7A00] dark:text-[#F0A030]">
                      {loan.next_action}
                    </span>
                  }
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t mt-auto">
          <Link href={`/pipeline/${loan.loan_number || loan.id}`}>
            <Button className="w-full gap-2">
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.5} />
              View Full Details
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
