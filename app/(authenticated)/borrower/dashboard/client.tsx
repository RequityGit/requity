"use client";

import { MetricCard } from "@/components/dashboard/metric-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { EmptyState } from "@/components/shared/empty-state";
import { formatCurrency, formatCurrencyDetailed, formatDate, formatPercent } from "@/lib/format";
import { Home, DollarSign, CalendarClock, FileText } from "lucide-react";
import Link from "next/link";
import type { Loan, LoanPayment } from "@/lib/supabase/types";

interface BorrowerDashboardClientProps {
  loans: Loan[];
  nextPayment: LoanPayment | null;
}

export function BorrowerDashboardClient({
  loans,
  nextPayment,
}: BorrowerDashboardClientProps) {
  const activeLoans = loans.filter((l) =>
    ["funded", "servicing"].includes(l.stage)
  );
  const totalOutstanding = activeLoans.reduce(
    (sum, loan) => sum + (loan.loan_amount ?? 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Hero metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          label="Active Loans"
          value={activeLoans.length}
          subtext={`${loans.length} total loans`}
          icon={Home}
        />
        <MetricCard
          label="Total Outstanding"
          value={formatCurrency(totalOutstanding)}
          subtext="across all active loans"
          icon={DollarSign}
          isCurrency
        />
        <MetricCard
          label="Next Payment Due"
          value={
            nextPayment
              ? formatCurrencyDetailed(nextPayment.amount_due)
              : "None"
          }
          subtext={
            nextPayment
              ? `Due ${formatDate(nextPayment.due_date)}`
              : "No upcoming payments"
          }
          icon={CalendarClock}
          isCurrency={!!nextPayment}
        />
      </div>

      {/* My Loans */}
      <div>
        <h2 className="font-display text-xl font-medium text-surface-white mb-4">
          My Loans
        </h2>

        {activeLoans.length === 0 ? (
          <EmptyState
            icon={Home}
            title="No Active Loans"
            description="Your active loans will appear here once they are funded."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeLoans.map((loan) => (
              <Link
                key={loan.id}
                href={`/borrower/loans/${loan.id}`}
                className="group card-cinematic transition-all duration-200 hover:border-gold/40 hover:shadow-lg hover:shadow-gold/5"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="text-sm font-body font-semibold text-surface-white leading-snug">
                    {loan.property_address || "Property Address"}
                  </h3>
                  <StatusBadge status={loan.stage} />
                </div>
                {(loan.property_city || loan.property_state) && (
                  <p className="text-xs text-surface-muted font-body mb-4">
                    {[loan.property_city, loan.property_state, loan.property_zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-surface-muted font-body">
                      Amount
                    </p>
                    <CurrencyDisplay
                      amount={loan.loan_amount}
                      size="sm"
                      className="text-surface-white"
                    />
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-surface-muted font-body">
                      Rate
                    </p>
                    <span className="text-sm font-mono text-surface-white">
                      {formatPercent(loan.interest_rate)}
                    </span>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-surface-muted font-body">
                      Term
                    </p>
                    <span className="text-sm font-body text-surface-white">
                      {loan.term_months} mo
                    </span>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-navy-light flex items-center justify-between text-xs text-surface-muted font-body">
                  <span>Loan #{loan.loan_number}</span>
                  <span>{(loan.loan_type ?? "").replace(/_/g, " ")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
