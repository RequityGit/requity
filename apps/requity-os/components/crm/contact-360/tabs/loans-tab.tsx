"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { StagePill, EmptyState, MonoValue } from "../shared";
import { formatCurrency } from "@/lib/format";
import type { LoanData } from "../types";

function getDaysInStage(stageUpdatedAt: string | null): number {
  if (!stageUpdatedAt) return 0;
  const diff = Date.now() - new Date(stageUpdatedAt).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function DaysInStageBadge({ days }: { days: number }) {
  let color = "text-muted-foreground";
  if (days >= 10) color = "text-[#E5453D]";
  else if (days >= 5) color = "text-[#E5930E]";

  return (
    <MonoValue className={`text-xs ${color}`}>
      {days}d in stage
    </MonoValue>
  );
}

interface LoansTabProps {
  loans: LoanData[];
  contactId: string;
  borrowerId?: string | null;
}

export function LoansTab({ loans, contactId, borrowerId }: LoansTabProps) {
  const router = useRouter();
  const [showPast, setShowPast] = useState(false);

  const { activeLoans, pastLoans } = useMemo(() => {
    const active: LoanData[] = [];
    const past: LoanData[] = [];
    loans.forEach((loan) => {
      if (
        loan.stage &&
        ["paid_off", "payoff", "denied", "withdrawn", "note_sold"].includes(
          loan.stage
        )
      ) {
        past.push(loan);
      } else {
        active.push(loan);
      }
    });
    return { activeLoans: active, pastLoans: past };
  }, [loans]);

  if (loans.length === 0) {
    return (
      <EmptyState
        title="No loans yet"
        description="Start a new loan application for this borrower."
        icon={DollarSign}
        action={
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 rounded-lg bg-foreground text-white hover:bg-foreground/90"
            onClick={() => {
              const params = new URLSearchParams({ new_loan: "true" });
              if (borrowerId) params.set("borrower_id", borrowerId);
              router.push(`/loans?${params.toString()}`);
            }}
          >
            <DollarSign className="h-3.5 w-3.5" strokeWidth={1.5} />
            Start New Loan
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Active Loans */}
      <div className="space-y-3">
        {activeLoans.length > 0 && (
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Active ({activeLoans.length})
          </p>
        )}
        {activeLoans.map((loan) => {
          const days = getDaysInStage(loan.stage_updated_at);
          return (
            <Link
              key={loan.id}
              href={`/pipeline/${loan.loan_number || loan.id}`}
              className="block rounded-xl border border-border bg-card p-4 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {loan.property_address || "No address"}
                  </p>
                  {loan.loan_number && (
                    <p className="text-xs text-muted-foreground">
                      #{loan.loan_number}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {loan.stage && <StagePill stage={loan.stage} />}
                  {days > 0 && <DaysInStageBadge days={days} />}
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground">Amount</span>
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
                {loan.ltv != null && (
                  <div>
                    <span className="text-xs text-muted-foreground">LTV</span>
                    <p>
                      <MonoValue className="font-medium text-foreground">
                        {loan.ltv}%
                      </MonoValue>
                    </p>
                  </div>
                )}
                {loan.loan_term_months != null && (
                  <div>
                    <span className="text-xs text-muted-foreground">Term</span>
                    <p>
                      <MonoValue className="font-medium text-foreground">
                        {loan.loan_term_months}mo
                      </MonoValue>
                    </p>
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Past Loans (collapsible) */}
      {pastLoans.length > 0 && (
        <div>
          <button
            onClick={() => setShowPast(!showPast)}
            className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground transition-colors"
          >
            Past Loans ({pastLoans.length})
            {showPast ? (
              <ChevronUp className="h-3.5 w-3.5" strokeWidth={1.5} />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
          </button>

          {showPast && (
            <div className="mt-3 space-y-2">
              {pastLoans.map((loan) => (
                <Link
                  key={loan.id}
                  href={`/pipeline/${loan.loan_number || loan.id}`}
                  className="flex items-center justify-between rounded-lg border border-border bg-card p-3 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm text-foreground">
                        {loan.property_address || "No address"}
                      </p>
                      {loan.loan_number && (
                        <p className="text-xs text-muted-foreground">
                          #{loan.loan_number}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MonoValue className="text-sm text-muted-foreground">
                      {formatCurrency(loan.loan_amount)}
                    </MonoValue>
                    {loan.stage && <StagePill stage={loan.stage} />}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
