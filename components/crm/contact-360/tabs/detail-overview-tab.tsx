"use client";

import { Landmark, TrendingUp, User, Shield, FileText } from "lucide-react";
import { SectionCard, MetricCard, FieldRow, DotPill, MonoValue } from "../contact-detail-shared";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import type {
  ContactData,
  BorrowerData,
  InvestorProfileData,
  LoanData,
  InvestorCommitmentData,
} from "../types";

interface DetailOverviewTabProps {
  contact: ContactData;
  borrower: BorrowerData | null;
  investor: InvestorProfileData | null;
  loans: LoanData[];
  commitments: InvestorCommitmentData[];
  isSuperAdmin: boolean;
}

export function DetailOverviewTab({
  contact,
  borrower,
  investor,
  loans,
  commitments,
  isSuperAdmin,
}: DetailOverviewTabProps) {
  const activeLoans = loans.filter(
    (l) => l.stage && !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
  );
  const totalVolume = loans.reduce((s, l) => s + (l.loan_amount || 0), 0);
  const rates = loans
    .map((l) => l.interest_rate)
    .filter((r): r is number => r != null);
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const firstLoan = loans.length > 0
    ? loans.reduce((oldest, l) =>
        new Date(l.created_at) < new Date(oldest.created_at) ? l : oldest
      )
    : null;

  const totalCommitted = commitments.reduce((s, c) => s + (c.commitment_amount || 0), 0);
  const totalFunded = commitments.reduce((s, c) => s + (c.funded_amount || 0), 0);
  const totalUnfunded = commitments.reduce((s, c) => s + (c.unfunded_amount || 0), 0);
  const activeFunds = commitments.filter((c) => c.status === "active").length;

  const hasBorrower = !!borrower;
  const hasInvestor = !!investor;

  return (
    <div className="flex flex-col gap-5">
      {/* Borrower Summary */}
      {hasBorrower && loans.length > 0 && (
        <SectionCard title="Borrower Summary" icon={Landmark}>
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Total Loans" value={loans.length} sub={`${activeLoans.length} active`} />
            <MetricCard label="Loan Volume" value={formatCurrency(totalVolume)} mono />
            <MetricCard label="Avg Rate" value={avgRate > 0 ? formatPercent(avgRate) : "—"} mono />
            <MetricCard label="Active Opps" value={activeLoans.length} />
            <MetricCard
              label="First Loan"
              value={firstLoan ? formatDate(firstLoan.created_at) : "—"}
            />
          </div>
        </SectionCard>
      )}

      {/* Investor Summary */}
      {hasInvestor && commitments.length > 0 && (
        <SectionCard title="Investor Summary" icon={TrendingUp}>
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Total Committed" value={formatCurrency(totalCommitted)} mono />
            <MetricCard label="Funded" value={formatCurrency(totalFunded)} mono />
            <MetricCard label="Unfunded" value={formatCurrency(totalUnfunded)} mono />
            <MetricCard label="Active Funds" value={activeFunds} />
          </div>
        </SectionCard>
      )}

      {/* Borrower Profile */}
      {hasBorrower && (
        <SectionCard title="Borrower Profile" icon={User}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <FieldRow
              label="Credit Score"
              value={
                borrower.credit_score != null ? (
                  <span
                    style={{
                      color:
                        borrower.credit_score >= 740
                          ? "#22A861"
                          : borrower.credit_score >= 680
                          ? "#E5930E"
                          : "#E5453D",
                    }}
                  >
                    {borrower.credit_score}
                  </span>
                ) : (
                  "—"
                )
              }
              mono
            />
            <FieldRow label="Credit Report Date" value={formatDate(borrower.credit_report_date)} />
            <FieldRow
              label="RE Experience"
              value={
                borrower.experience_count != null
                  ? `${borrower.experience_count} transactions`
                  : "—"
              }
            />
            <FieldRow label="Date of Birth" value={formatDate(borrower.date_of_birth)} />
            <FieldRow
              label="US Citizen"
              value={borrower.is_us_citizen != null ? (borrower.is_us_citizen ? "Yes" : "No") : "—"}
            />
            <FieldRow label="Marital Status" value={borrower.marital_status} />
            {isSuperAdmin && (
              <>
                <FieldRow
                  label="SSN (last 4)"
                  value={
                    borrower.ssn_last_four
                      ? <MonoValue>{`●●●-●●-${borrower.ssn_last_four}`}</MonoValue>
                      : "—"
                  }
                  mono
                />
                <div />
              </>
            )}
            <FieldRow label="Stated Liquidity" value={formatCurrency(borrower.stated_liquidity)} mono />
            <FieldRow label="Verified Liquidity" value={formatCurrency(borrower.verified_liquidity)} mono />
            <FieldRow label="Stated Net Worth" value={formatCurrency(borrower.stated_net_worth)} mono />
            <FieldRow label="Verified Net Worth" value={formatCurrency(borrower.verified_net_worth)} mono />
          </div>
        </SectionCard>
      )}

      {/* Investor Profile */}
      {hasInvestor && (
        <SectionCard title="Investor Profile" icon={Shield}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <FieldRow
              label="Accreditation"
              value={
                investor.accreditation_status ? (
                  <DotPill
                    color={investor.accreditation_status === "verified" ? "#22A861" : "#E5930E"}
                    label={investor.accreditation_status.charAt(0).toUpperCase() + investor.accreditation_status.slice(1)}
                    small
                  />
                ) : (
                  "—"
                )
              }
            />
            <FieldRow label="Verified At" value={formatDate(investor.accreditation_verified_at)} />
          </div>
        </SectionCard>
      )}

      {/* Internal Notes */}
      {contact.notes && (
        <SectionCard title="Internal Notes" icon={FileText}>
          <p className="text-[13px] text-[#6B6B6B] leading-relaxed whitespace-pre-wrap">
            {contact.notes}
          </p>
        </SectionCard>
      )}
    </div>
  );
}
