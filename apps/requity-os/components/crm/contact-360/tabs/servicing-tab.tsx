"use client";

import { Briefcase } from "lucide-react";
import { StagePill, EmptyState, MonoValue } from "../shared";
import { formatCurrency } from "@/lib/format";
import type { LoanData } from "../types";
import Link from "next/link";

interface ServicingTabProps {
  loans: LoanData[];
}

export function ServicingTab({ loans }: ServicingTabProps) {
  const servicingLoans = loans.filter(
    (l) => l.stage === "funded" || l.stage === "servicing"
  );

  if (servicingLoans.length === 0) {
    return (
      <EmptyState
        title="No serviced loans"
        description="No loans are currently being serviced by this lender."
        icon={Briefcase}
      />
    );
  }

  const totalBalance = servicingLoans.reduce(
    (s, l) => s + (l.loan_amount || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Total Serviced</p>
          <MonoValue className="text-lg font-semibold text-foreground">
            {servicingLoans.length}
          </MonoValue>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Current Balance</p>
          <MonoValue className="text-lg font-semibold text-foreground">
            {formatCurrency(totalBalance)}
          </MonoValue>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground mb-1">Delinquency</p>
          <MonoValue className="text-lg font-semibold text-foreground">
            0
          </MonoValue>
        </div>
      </div>

      {/* Loan list */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Active Loans ({servicingLoans.length})
        </p>
        {servicingLoans.map((loan) => (
          <Link
            key={loan.id}
            href={`/admin/pipeline/${loan.id}`}
            className="block rounded-xl border border-border bg-card p-4 hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm font-semibold text-foreground">
                {loan.property_address || "No address"}
              </p>
              {loan.stage && <StagePill stage={loan.stage} />}
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-xs text-muted-foreground">Balance</span>
                <p>
                  <MonoValue className="font-medium text-foreground">
                    {formatCurrency(loan.loan_amount)}
                  </MonoValue>
                </p>
              </div>
              {loan.interest_rate != null && (
                <div>
                  <span className="text-xs text-muted-foreground">Rate</span>
                  <p>
                    <MonoValue className="font-medium text-foreground">
                      {loan.interest_rate}%
                    </MonoValue>
                  </p>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
