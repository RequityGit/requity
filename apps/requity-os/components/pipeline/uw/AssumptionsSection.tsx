"use client";

import type { LucideIcon } from "lucide-react";
import { Target, Link as LinkIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { n, fmtCurrency } from "../tabs/financials/shared";

interface AssumptionsSectionProps {
  uw: Record<string, unknown>;
  debt: Record<string, unknown>[];
  purchasePrice: number;
  numUnits: number;
}

function InputSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-card/50">
      <div className="flex items-center gap-2 px-4 pt-3.5 pb-2">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </span>
      </div>
      <div className="flex flex-col px-2 pb-2">{children}</div>
    </div>
  );
}

function InputRow({
  label,
  value,
  computed,
  editable,
}: {
  label: string;
  value: string;
  computed?: boolean;
  editable?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-[5px] px-2 rounded-md hover:bg-muted/40 transition-colors group">
      <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {editable ? (
          <span className="text-[12px] num font-medium text-foreground border-b border-dashed border-border/60 group-hover:border-primary/40 cursor-text">
            {value}
          </span>
        ) : (
          <span
            className={cn(
              "text-[12px] num font-medium",
              computed ? "text-muted-foreground italic" : "text-foreground"
            )}
          >
            {value}
          </span>
        )}
        {computed && (
          <span className="text-[8px] uppercase tracking-wider text-muted-foreground/50 font-semibold">
            calc
          </span>
        )}
      </div>
    </div>
  );
}

function LinkedFieldRow({
  label,
  value,
  source,
}: {
  label: string;
  value: string;
  source: string;
}) {
  return (
    <div className="flex items-center justify-between py-[5px] px-2 rounded-md">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-[12px] num font-medium text-muted-foreground">
          {value}
        </span>
        <span className="text-[8px] uppercase tracking-wider text-muted-foreground/40 font-semibold">
          {source}
        </span>
      </div>
    </div>
  );
}

function findDebtByTranche(
  debt: Record<string, unknown>[],
  tranche: string
): Record<string, unknown> | undefined {
  return debt.find(
    (d) =>
      String(d.tranche_type ?? "").toLowerCase() === tranche.toLowerCase()
  );
}

function fmtPctValue(v: unknown): string {
  const num = n(v);
  if (num === 0) return "—";
  const pct = num > 1 ? num : num * 100;
  return pct.toFixed(2) + "%";
}

function fmtYears(v: unknown): string {
  const num = n(v);
  if (num === 0) return "—";
  return num === 1 ? "1 year" : `${num} years`;
}

function fmtAmortization(v: unknown): string {
  if (v == null || v === "") return "—";
  const str = String(v).toLowerCase();
  if (str === "io" || str === "i/o" || str === "interest_only") return "I/O";
  const num = n(v);
  if (num > 0) return `${num} years`;
  return String(v);
}

export function AssumptionsSection({
  uw,
  debt,
  purchasePrice,
  numUnits,
}: AssumptionsSectionProps) {
  const senior = findDebtByTranche(debt, "senior");
  const takeout = findDebtByTranche(debt, "takeout");

  const holdPeriod = n(uw.hold_period_years) || 5;
  const exitCapRate = n(uw.exit_cap_rate);
  const dispositionFee = n(uw.disposition_fee_pct) || 0.02;
  const saleCosts = n(uw.sale_costs_pct) || 0.015;

  const noi = n(uw.noi) || n(uw.year1_noi);
  const projectedSalePrice =
    exitCapRate > 0 ? noi / (exitCapRate > 1 ? exitCapRate / 100 : exitCapRate) : 0;

  const seniorLoanAmount = senior
    ? n(senior.loan_amount) ||
      (n(senior.ltv_pct) > 0 ? purchasePrice * n(senior.ltv_pct) : 0)
    : 0;

  const totalSf = n(uw.total_sf) || n(uw.gross_sf);

  return (
    <div className="grid grid-cols-2 gap-5">
      <div className="flex flex-col gap-5">
        <InputSection title="Exit Assumptions" icon={Target}>
          <InputRow
            label="Hold Period"
            value={`${holdPeriod} years`}
            editable
          />
          <InputRow
            label="Exit Cap Rate"
            value={fmtPctValue(exitCapRate)}
            editable
          />
          <InputRow
            label="Disposition Fee"
            value={
              dispositionFee > 1
                ? `${dispositionFee.toFixed(1)}%`
                : `${(dispositionFee * 100).toFixed(1)}%`
            }
            editable
          />
          <InputRow
            label="Sale Costs"
            value={
              saleCosts > 1
                ? `${saleCosts.toFixed(1)}%`
                : `${(saleCosts * 100).toFixed(1)}%`
            }
            editable
          />
          <InputRow
            label="Projected Sale Price"
            value={projectedSalePrice > 0 ? fmtCurrency(projectedSalePrice) : "—"}
            computed
          />
        </InputSection>

        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon
              className="h-3.5 w-3.5 text-muted-foreground"
              strokeWidth={1.5}
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              From Sources & Uses
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <LinkedFieldRow
              label="Senior Rate"
              value={senior ? fmtPctValue(senior.interest_rate) : "—"}
              source="Sources & Uses"
            />
            <LinkedFieldRow
              label="Loan Term"
              value={senior ? fmtYears(senior.term_years) : "—"}
              source="Sources & Uses"
            />
            <LinkedFieldRow
              label="Amortization"
              value={senior ? fmtAmortization(senior.amortization_years) : "—"}
              source="Sources & Uses"
            />
            <LinkedFieldRow
              label="Origination Fee"
              value={senior ? fmtPctValue(senior.origination_fee_pct) : "—"}
              source="Sources & Uses"
            />
            <LinkedFieldRow
              label="Takeout Rate"
              value={takeout ? fmtPctValue(takeout.interest_rate) : "—"}
              source="Sources & Uses"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-5">
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/20 p-4">
          <div className="flex items-center gap-2 mb-3">
            <LinkIcon
              className="h-3.5 w-3.5 text-muted-foreground"
              strokeWidth={1.5}
            />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Pulled from deal
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <LinkedFieldRow
              label="Purchase Price"
              value={purchasePrice > 0 ? fmtCurrency(purchasePrice) : "—"}
              source="Overview"
            />
            <LinkedFieldRow
              label="Loan Amount"
              value={seniorLoanAmount > 0 ? fmtCurrency(seniorLoanAmount) : "—"}
              source="Overview"
            />
            <LinkedFieldRow
              label="Units"
              value={numUnits > 0 ? String(numUnits) : "—"}
              source="Property"
            />
            <LinkedFieldRow
              label="Total SF"
              value={totalSf > 0 ? totalSf.toLocaleString("en-US") : "—"}
              source="Property"
            />
            <LinkedFieldRow
              label="Year Built"
              value={uw.year_built ? String(uw.year_built) : "—"}
              source="Property"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
