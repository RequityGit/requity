"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { InlineField } from "@/components/ui/inline-field";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import { showError, showSuccess } from "@/lib/toast";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Plus, Trash2, Landmark, ChevronDown, ChevronRight } from "lucide-react";
import {
  fetchCostBasis,
  updateCostBasisField,
  createExistingLoan,
  updateExistingLoanField,
  deleteExistingLoan,
  type CostBasisRow,
  type ExistingLoanRow,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/cost-basis-actions";

// ─── Types ───

interface CostBasisSectionProps {
  dealId: string;
  loanPurpose: string | null;
}

// ─── Loan type options ───

const LOAN_TYPE_OPTIONS = [
  "Bridge",
  "Construction",
  "Permanent",
  "Seller Carry",
  "Mezzanine",
  "HELOC",
  "Other",
] as const;

const SOURCE_OPTIONS = [
  "Broker Submission",
  "Closing Statement",
  "Borrower Provided",
  "Internal Estimate",
] as const;

// ─── Main Component ───

export function CostBasisSection({ dealId, loanPurpose }: CostBasisSectionProps) {
  const [costBasis, setCostBasis] = useState<CostBasisRow | null>(null);
  const [existingLoans, setExistingLoans] = useState<ExistingLoanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loansExpanded, setLoansExpanded] = useState(true);
  const [, startTransition] = useTransition();
  const confirm = useConfirm();
  const cbRef = useRef(costBasis);
  cbRef.current = costBasis;

  // Determine deal context
  const isRefi = ["refinance", "cash_out", "cash_out_refinance"].includes(loanPurpose ?? "") ||
    (loanPurpose?.toLowerCase().includes("refi") ?? false) ||
    (loanPurpose?.toLowerCase().includes("cash") ?? false);
  const isPurchase = ["acquisition", "purchase"].includes(loanPurpose ?? "") ||
    (loanPurpose?.toLowerCase().includes("purchase") ?? false);

  const sectionTitle = isRefi ? "Refinance Overview" : "Borrower's Basis";

  // ── Fetch on mount ──

  useEffect(() => {
    let cancelled = false;
    fetchCostBasis(dealId).then((res) => {
      if (cancelled) return;
      if ("error" in res) {
        showError("Could not load cost basis");
        setLoading(false);
        return;
      }
      setCostBasis(res.costBasis ?? null);
      setExistingLoans(res.existingLoans ?? []);
      // Auto-collapse existing loans section on purchase deals if no loans exist
      if (isPurchase && (!res.existingLoans || res.existingLoans.length === 0)) {
        setLoansExpanded(false);
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [dealId, isPurchase]);

  // ── Cost basis field save ──

  const saveCbField = useCallback((field: string, value: string) => {
    // Optimistic update
    const numericFields = [
      "original_purchase_price", "original_closing_costs", "capital_improvements",
      "as_is_value", "after_repair_value",
    ];
    const parsed = numericFields.includes(field) && value !== ""
      ? parseFloat(value)
      : value === "" ? null : value;

    setCostBasis((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: parsed };
      // Recompute total_basis locally
      next.total_basis =
        (next.original_purchase_price ?? 0) +
        (next.original_closing_costs ?? 0) +
        (next.capital_improvements ?? 0);
      cbRef.current = next;
      return next;
    });

    startTransition(async () => {
      const result = await updateCostBasisField(dealId, field, parsed);
      if (result.error) {
        showError("Could not save field", result.error);
      }
    });
  }, [dealId, startTransition]);

  // ── Existing loan field save ──

  const saveLoanField = useCallback((loanId: string, field: string, value: string | boolean) => {
    const numericFields = [
      "lien_position", "original_loan_amount", "current_balance",
      "interest_rate", "monthly_payment",
    ];

    let parsed: string | number | boolean | null;
    if (typeof value === "boolean") {
      parsed = value;
    } else if (numericFields.includes(field) && value !== "") {
      parsed = parseFloat(value);
    } else {
      parsed = value === "" ? null : value;
    }

    // Optimistic update
    setExistingLoans((prev) =>
      prev.map((l) => (l.id === loanId ? { ...l, [field]: parsed } : l))
    );

    startTransition(async () => {
      const result = await updateExistingLoanField(loanId, field, parsed);
      if (result.error) {
        showError("Could not save field", result.error);
      }
    });
  }, [startTransition]);

  // ── Add loan ──

  const handleAddLoan = useCallback(async () => {
    const result = await createExistingLoan(dealId);
    if (result.error) {
      showError("Could not add loan", result.error);
      return;
    }
    if (result.loan) {
      setExistingLoans((prev) => [...prev, result.loan!]);
      setLoansExpanded(true);
    }
  }, [dealId]);

  // ── Delete loan ──

  const handleDeleteLoan = useCallback(async (loanId: string) => {
    const ok = await confirm({
      title: "Remove existing loan",
      description: "This will permanently remove this loan record from the deal.",
      confirmLabel: "Remove",
      destructive: true,
    });
    if (!ok) return;

    // Optimistic remove
    setExistingLoans((prev) => prev.filter((l) => l.id !== loanId));

    const result = await deleteExistingLoan(loanId);
    if (result.error) {
      showError("Could not delete loan", result.error);
      // Refetch to restore
      const fresh = await fetchCostBasis(dealId);
      if (!("error" in fresh)) {
        setExistingLoans(fresh.existingLoans ?? []);
      }
    }
  }, [confirm, dealId]);

  // ── Computed values ──

  const totalBasis = costBasis?.total_basis ?? 0;
  const totalExistingDebt = existingLoans.reduce(
    (sum, l) => sum + (l.current_balance ?? 0),
    0
  );
  const borrowerEquity = totalBasis - totalExistingDebt;

  if (loading) {
    return (
      <div className="py-4">
        <div className="h-4 w-32 bg-muted/60 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-20 bg-muted/40 rounded animate-pulse" />
              <div className="h-8 w-full bg-muted/30 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="pt-1">
      <Separator className="mb-4" />

      {/* Section header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
          {sectionTitle}
        </span>
        {totalBasis > 0 && (
          <span className="text-xs font-semibold num">
            Total Basis: {formatCurrency(totalBasis)}
          </span>
        )}
      </div>

      {/* Cost basis fields */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 mb-1">
        <InlineField
          label="Original purchase price"
          type="currency"
          value={costBasis?.original_purchase_price}
          onSave={(v) => saveCbField("original_purchase_price", v)}
        />
        <InlineField
          label="Original purchase date"
          type="date"
          value={costBasis?.original_purchase_date}
          onSave={(v) => saveCbField("original_purchase_date", v)}
        />
        <InlineField
          label="Closing costs"
          type="currency"
          value={costBasis?.original_closing_costs}
          onSave={(v) => saveCbField("original_closing_costs", v)}
        />
        <InlineField
          label="Capital improvements"
          type="currency"
          value={costBasis?.capital_improvements}
          onSave={(v) => saveCbField("capital_improvements", v)}
        />
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1 mb-1">
        <div className="min-w-0">
          <span className="inline-field-label">Total basis</span>
          <div className="w-full text-left text-sm font-semibold min-h-[32px] flex items-center rounded-md px-2 py-1 num">
            {totalBasis > 0 ? formatCurrency(totalBasis) : <span className="text-muted-foreground/40">--</span>}
          </div>
        </div>
        <InlineField
          label="As-is value"
          type="currency"
          value={costBasis?.as_is_value}
          onSave={(v) => saveCbField("as_is_value", v)}
        />
        <InlineField
          label="After repair value"
          type="currency"
          value={costBasis?.after_repair_value}
          onSave={(v) => saveCbField("after_repair_value", v)}
        />
        <InlineField
          label="Source"
          type="select"
          value={costBasis?.source ?? ""}
          options={SOURCE_OPTIONS}
          onSave={(v) => saveCbField("source", v)}
        />
      </div>

      {/* Existing Loans section */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <button
            type="button"
            onClick={() => setLoansExpanded(!loansExpanded)}
            className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground uppercase tracking-wider hover:text-foreground rq-transition"
          >
            {loansExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
            Existing Loans
            {existingLoans.length > 0 && (
              <span className="ml-1 text-[10px] text-muted-foreground/70">
                ({existingLoans.length})
              </span>
            )}
          </button>
          <div className="flex items-center gap-3">
            {totalExistingDebt > 0 && (
              <span className="text-xs font-semibold num">
                Total Debt: {formatCurrency(totalExistingDebt)}
              </span>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={handleAddLoan}
            >
              <Plus className="h-3 w-3" />
              Add Loan
            </Button>
          </div>
        </div>

        {loansExpanded && (
          <>
            {existingLoans.length === 0 ? (
              <EmptyState
                compact
                title="No existing loans"
                description="Add existing debt on this property to track the borrower's current obligations."
                action={{ label: "Add Existing Loan", onClick: handleAddLoan, icon: Plus }}
              />
            ) : (
              <div className="space-y-3">
                {existingLoans.map((loan) => (
                  <ExistingLoanCard
                    key={loan.id}
                    loan={loan}
                    onSaveField={saveLoanField}
                    onDelete={handleDeleteLoan}
                  />
                ))}

                {/* Summary footer */}
                {existingLoans.length > 0 && totalBasis > 0 && (
                  <div className="flex items-center justify-end gap-6 pt-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">Total Existing Debt:</span>{" "}
                      <span className="font-semibold num">{formatCurrency(totalExistingDebt)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Borrower Equity:</span>{" "}
                      <span className={cn("font-semibold num", borrowerEquity >= 0 ? "rq-value-positive" : "rq-value-negative")}>
                        {formatCurrency(borrowerEquity)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Existing Loan Card ───

function ExistingLoanCard({
  loan,
  onSaveField,
  onDelete,
}: {
  loan: ExistingLoanRow;
  onSaveField: (loanId: string, field: string, value: string | boolean) => void;
  onDelete: (loanId: string) => void;
}) {
  const save = useCallback(
    (field: string, value: string | boolean) => onSaveField(loan.id, field, value),
    [loan.id, onSaveField]
  );

  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3 relative group/loan">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Landmark className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">
            {loan.lien_position ? `${ordinal(loan.lien_position)} Lien` : "Existing Loan"}
          </span>
          {loan.lender_name && (
            <span className="text-xs text-foreground">{loan.lender_name}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDelete(loan.id)}
          className="opacity-0 group-hover/loan:opacity-100 text-muted-foreground hover:text-destructive rq-transition p-1 rounded"
          title="Remove loan"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1">
        <InlineField
          label="Lender"
          type="text"
          value={loan.lender_name ?? ""}
          onSave={(v) => save("lender_name", v)}
        />
        <InlineField
          label="Loan type"
          type="select"
          value={loan.loan_type ?? ""}
          options={LOAN_TYPE_OPTIONS}
          onSave={(v) => save("loan_type", v)}
        />
        <InlineField
          label="Original amount"
          type="currency"
          value={loan.original_loan_amount}
          onSave={(v) => save("original_loan_amount", v)}
        />
        <InlineField
          label="Current balance"
          type="currency"
          value={loan.current_balance}
          onSave={(v) => save("current_balance", v)}
        />
        <InlineField
          label="Interest rate"
          type="percent"
          value={loan.interest_rate}
          onSave={(v) => save("interest_rate", v)}
        />
        <InlineField
          label="Monthly payment"
          type="currency"
          value={loan.monthly_payment}
          onSave={(v) => save("monthly_payment", v)}
        />
        <InlineField
          label="Origination date"
          type="date"
          value={loan.origination_date}
          onSave={(v) => save("origination_date", v)}
        />
        <InlineField
          label="Maturity date"
          type="date"
          value={loan.maturity_date}
          onSave={(v) => save("maturity_date", v)}
        />
        <InlineField
          label="Prepay penalty"
          type="text"
          value={loan.prepayment_penalty ?? ""}
          onSave={(v) => save("prepayment_penalty", v)}
        />
        <div className="flex items-center gap-4 min-h-[32px] px-2 py-1">
          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox
              checked={loan.is_interest_only}
              onCheckedChange={(v) => save("is_interest_only", !!v)}
              className="h-3.5 w-3.5"
            />
            <span className="text-muted-foreground">I/O</span>
          </label>
          <label className="flex items-center gap-1.5 text-xs">
            <Checkbox
              checked={loan.is_current}
              onCheckedChange={(v) => save("is_current", !!v)}
              className="h-3.5 w-3.5"
            />
            <span className="text-muted-foreground">Current</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// ─── Helpers ───

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
