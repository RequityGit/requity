"use client";

import { useState, useMemo, useCallback } from "react";
import { Building2, Landmark, Pencil, Plus, ChevronDown, Trash2, Loader2, Clock, Check } from "lucide-react";
import { T, SectionCard, FieldRow, fmt } from "../components";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import {
  updateCommercialUW,
  upsertIncomeRows,
  upsertExpenseRows,
  upsertRentRoll,
  upsertScopeOfWork,
  createNewVersion,
  activateVersion,
} from "../commercial-uw-actions";
import { computeAnnualDebtService, computeT12NetRevenue, computeT12TotalExpenses, computeT12NOI } from "@/lib/commercial-uw/deal-computations";
import type { DealIncomeRow, DealExpenseRow, DealUWRecord } from "@/lib/commercial-uw/deal-computations";

// ── Types ──

export interface CommercialUWData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scopeOfWork: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sourcesUses: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  debt: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  waterfall: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  allVersions: any[];
}

interface CommercialOverviewTabProps {
  data: CommercialUWData;
  dealId: string;
  currentUserId: string;
}

// ── Helpers ──

function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

function fmtCurrency(v: unknown): string {
  const num = n(v);
  if (num === 0) return "$0";
  return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(v: unknown): string {
  const num = n(v);
  return (num * 100).toFixed(1) + "%";
}

function fmtNeg(v: number): string {
  if (v < 0) return `($${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`;
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer border-0"
      style={{ color: T.text.muted, backgroundColor: "transparent" }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = T.bg.hover; e.currentTarget.style.color = T.text.primary; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = T.text.muted; }}
    >
      <Pencil size={12} strokeWidth={1.5} />
      Edit
    </button>
  );
}

// ── Main Component ──

export function CommercialOverviewTab({ data, dealId, currentUserId }: CommercialOverviewTabProps) {
  const { uw, income, expenses, rentRoll, scopeOfWork, allVersions } = data;
  const { toast } = useToast();
  const router = useRouter();

  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editLoanOpen, setEditLoanOpen] = useState(false);
  const [editRentRollOpen, setEditRentRollOpen] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [creatingVersion, setCreatingVersion] = useState(false);
  const [activatingId, setActivatingId] = useState<string | null>(null);

  // Computed values
  const incomeRows: DealIncomeRow[] = useMemo(() =>
    income.map((r: DealIncomeRow) => ({ ...r, t12_amount: n(r.t12_amount), year_1_amount: n(r.year_1_amount), growth_rate: n(r.growth_rate) })),
    [income]
  );
  const expenseRows: DealExpenseRow[] = useMemo(() =>
    expenses.map((r: DealExpenseRow) => ({ ...r, t12_amount: n(r.t12_amount), year_1_amount: n(r.year_1_amount), growth_rate: n(r.growth_rate) })),
    [expenses]
  );

  const t12NetRevenue = useMemo(() => computeT12NetRevenue(incomeRows), [incomeRows]);
  const t12TotalExpenses = useMemo(() => computeT12TotalExpenses(expenseRows), [expenseRows]);
  const t12NOI = useMemo(() => t12NetRevenue - t12TotalExpenses, [t12NetRevenue, t12TotalExpenses]);

  const uwRecord: DealUWRecord = useMemo(() => ({
    purchase_price: n(uw?.purchase_price),
    closing_costs: n(uw?.closing_costs),
    capex_reserve: n(uw?.capex_reserve),
    working_capital: n(uw?.working_capital),
    num_units: n(uw?.num_units),
    total_sf: n(uw?.total_sf),
    loan_amount: n(uw?.loan_amount),
    interest_rate: n(uw?.interest_rate),
    amortization_years: n(uw?.amortization_years),
    loan_term_years: n(uw?.loan_term_years),
    io_period_months: n(uw?.io_period_months),
    origination_fee_pct: n(uw?.origination_fee_pct),
    exit_cap_rate: n(uw?.exit_cap_rate),
    hold_period_years: n(uw?.hold_period_years) || 5,
    sale_costs_pct: n(uw?.sale_costs_pct),
    disposition_fee_pct: n(uw?.disposition_fee_pct),
  }), [uw]);

  const annualDS = useMemo(() => computeAnnualDebtService(uwRecord), [uwRecord]);

  const scopeTotal = useMemo(() =>
    scopeOfWork.reduce((sum: number, s: { estimated_cost: number }) => sum + n(s.estimated_cost), 0),
    [scopeOfWork]
  );

  const totalCurrentRent = useMemo(() => rentRoll.reduce((sum: number, r: { current_rent: number }) => sum + n(r.current_rent), 0), [rentRoll]);
  const totalMarketRent = useMemo(() => rentRoll.reduce((sum: number, r: { market_rent: number }) => sum + n(r.market_rent), 0), [rentRoll]);
  const occupiedCount = useMemo(() => rentRoll.filter((r: { status: string }) => r.status === "occupied").length, [rentRoll]);

  const handleNewVersion = useCallback(async () => {
    setCreatingVersion(true);
    try {
      const result = await createNewVersion(dealId, currentUserId);
      if (result.error) {
        toast({ title: "Failed to create version", description: result.error, variant: "destructive" });
      } else {
        toast({ title: `Version ${result.data?.version} created` });
        router.refresh();
      }
    } finally {
      setCreatingVersion(false);
    }
  }, [dealId, currentUserId, toast, router]);

  const handleActivate = useCallback(async (versionId: string) => {
    setActivatingId(versionId);
    try {
      const result = await activateVersion(versionId, dealId);
      if (result.error) {
        toast({ title: "Failed to activate", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Version activated" });
        router.refresh();
      }
    } finally {
      setActivatingId(null);
    }
  }, [dealId, toast, router]);

  const handleSaveUW = useCallback(async (fields: Record<string, unknown>) => {
    if (!uw?.id) return;
    const result = await updateCommercialUW(uw.id, fields);
    if (result.error) {
      toast({ title: "Failed to save", description: result.error, variant: "destructive" });
    } else {
      router.refresh();
    }
  }, [uw?.id, toast, router]);

  // Visible rent roll units
  const INITIAL_UNITS = 5;
  const visibleUnits = showAllUnits ? rentRoll : rentRoll.slice(0, INITIAL_UNITS);
  const hiddenCount = rentRoll.length - INITIAL_UNITS;

  return (
    <div className="flex flex-col gap-5">
      {/* ━━━ VERSION HISTORY CARD ━━━ */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${T.bg.border}`, backgroundColor: T.bg.surface }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
        >
          <div className="flex items-center gap-2">
            <Clock size={16} color={T.text.muted} strokeWidth={1.5} />
            <span className="text-sm font-semibold" style={{ color: T.text.primary }}>
              Version History
            </span>
            <span className="text-[11px] num ml-1" style={{ color: T.text.muted }}>
              {allVersions.length} version{allVersions.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button
            onClick={handleNewVersion}
            disabled={creatingVersion}
            className="inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors cursor-pointer border-0 disabled:opacity-50"
            style={{ backgroundColor: T.bg.elevated, color: T.text.secondary, border: `1px solid ${T.bg.border}` }}
          >
            {creatingVersion ? <Loader2 size={11} className="animate-spin" /> : <Plus size={11} />}
            New Version
          </button>
        </div>

        {allVersions.length === 0 ? (
          <div className="px-5 py-4 text-[13px]" style={{ color: T.text.muted }}>
            No versions yet. Initialize underwriting to get started.
          </div>
        ) : (
          <div>
            {allVersions.map((v: { id: string; version: number; status: string; created_at: string }) => {
              const isCurrent = v.id === uw?.id;
              const isActive = v.status === "active";
              const isActivating = activatingId === v.id;
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-5 py-3"
                  style={{
                    borderBottom: `1px solid ${T.bg.borderSubtle}`,
                    backgroundColor: isCurrent ? T.bg.hover : "transparent",
                  }}
                >
                  {/* Version badge */}
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold num"
                    style={{
                      backgroundColor: isActive ? "rgba(59,130,246,0.12)" : T.bg.elevated,
                      color: isActive ? T.accent.blue : T.text.muted,
                      border: `1px solid ${isActive ? "rgba(59,130,246,0.25)" : T.bg.border}`,
                    }}
                  >
                    v{v.version}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-medium" style={{ color: T.text.primary }}>
                        Version {v.version}
                      </span>
                      {v.status === "active" && (
                        <span
                          className="rounded px-1.5 py-px text-[10px] font-medium"
                          style={{ backgroundColor: "rgba(34,197,94,0.12)", color: "#22c55e" }}
                        >
                          Active
                        </span>
                      )}
                      {v.status === "draft" && (
                        <span
                          className="rounded px-1.5 py-px text-[10px] font-medium"
                          style={{ backgroundColor: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
                        >
                          Draft
                        </span>
                      )}
                      {v.status === "archived" && (
                        <span
                          className="rounded px-1.5 py-px text-[10px] font-medium"
                          style={{ backgroundColor: T.bg.elevated, color: T.text.muted }}
                        >
                          Archived
                        </span>
                      )}
                      {isCurrent && (
                        <span className="text-[10px]" style={{ color: T.text.muted }}>
                          · viewing
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] num" style={{ color: T.text.muted }}>
                      {new Date(v.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isActive && (
                      <Check size={14} strokeWidth={2} style={{ color: T.accent.blue }} />
                    )}
                    {v.status === "draft" && (
                      <button
                        onClick={() => handleActivate(v.id)}
                        disabled={isActivating}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer border-0 disabled:opacity-50"
                        style={{ backgroundColor: "rgba(59,130,246,0.12)", color: T.accent.blue }}
                      >
                        {isActivating ? <Loader2 size={10} className="animate-spin" /> : null}
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ━━━ PROPERTY SECTION ━━━ */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${T.bg.border}`, backgroundColor: T.bg.surface }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
        >
          <div className="flex items-center gap-2">
            <Building2 size={16} color={T.text.muted} strokeWidth={1.5} />
            <span className="text-sm font-semibold" style={{ color: T.text.primary }}>
              Property
            </span>
          </div>
          <EditButton onClick={() => setEditPropertyOpen(true)} />
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">
          {/* Property Details */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2.5" style={{ color: T.text.muted }}>
              Property Details
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <FieldRow label="Property Name" value={uw?.property_name} />
              <FieldRow label="Address" value={uw?.property_address} />
              <FieldRow label="City" value={uw?.property_city} />
              <FieldRow label="State" value={uw?.property_state} />
              <FieldRow label="Zip" value={uw?.property_zip} />
              <FieldRow label="Property Type" value={uw?.property_type} />
              <FieldRow label="Units" value={uw?.num_units} mono />
              <FieldRow label="Total SF" value={uw?.total_sf ? Number(uw.total_sf).toLocaleString() : null} mono />
              <FieldRow label="Year Built" value={uw?.year_built} mono />
              <FieldRow label="Lot Size (acres)" value={uw?.lot_size_acres} mono />
              <FieldRow label="Zoning" value={uw?.zoning} />
            </div>
          </div>

          {/* T12 Income */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
                T12 Income
              </div>
            </div>
            <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${T.bg.borderSubtle}` }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Line Item</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>T12 Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeRows.map((row, i) => (
                    <tr key={row.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                      <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>{row.line_item}</td>
                      <td
                        className="text-right text-[13px] num px-3 py-2"
                        style={{ color: row.is_deduction ? T.accent.red : T.text.primary }}
                      >
                        {row.is_deduction ? `(${fmtCurrency(Math.abs(row.t12_amount))})` : fmtCurrency(row.t12_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                    <td className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>Net Revenue</td>
                    <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(t12NetRevenue)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* T12 Expenses */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
                T12 Expenses
              </div>
            </div>
            <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${T.bg.borderSubtle}` }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Category</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>T12 Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.map((row, i) => (
                    <tr key={row.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                      <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>
                        {row.category}
                        {row.is_percentage && <span className="text-[11px] ml-1" style={{ color: T.text.muted }}>(% of EGI)</span>}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                        {fmtCurrency(row.t12_amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                    <td className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>Total Expenses</td>
                    <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(t12TotalExpenses)}</td>
                  </tr>
                  <tr style={{ backgroundColor: T.bg.elevated, borderTop: `2px solid ${T.bg.border}` }}>
                    <td className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>Current NOI</td>
                    <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(t12NOI)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Rent Roll */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
                Rent Roll {rentRoll.length > 0 && <span className="normal-case font-normal">— {rentRoll.length} units</span>}
              </div>
              <EditButton onClick={() => setEditRentRollOpen(true)} />
            </div>
            <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${T.bg.borderSubtle}` }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Unit</th>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>BD/BA</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>SF</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Current Rent</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Market Rent</th>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {visibleUnits.map((unit: any, i: number) => (
                    <tr key={unit.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                      <td className="text-[13px] px-3 py-2 font-medium" style={{ color: T.text.primary }}>{unit.unit_number}</td>
                      <td className="text-[13px] px-3 py-2" style={{ color: T.text.secondary }}>
                        {unit.bedrooms != null ? `${unit.bedrooms}/${unit.bathrooms ?? 1}` : "—"}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.secondary }}>
                        {unit.sq_ft ? Number(unit.sq_ft).toLocaleString() : "—"}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(unit.current_rent)}</td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(unit.market_rent)}</td>
                      <td className="text-[13px] px-3 py-2">
                        <StatusDot status={unit.status} />
                      </td>
                    </tr>
                  ))}
                  {!showAllUnits && hiddenCount > 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-2">
                        <button
                          onClick={() => setShowAllUnits(true)}
                          className="text-[13px] font-medium cursor-pointer border-0 bg-transparent flex items-center gap-1 mx-auto"
                          style={{ color: T.accent.blue }}
                        >
                          <ChevronDown size={14} strokeWidth={1.5} />
                          Show {hiddenCount} more units
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
                {rentRoll.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                      <td colSpan={3} className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>
                        Total ({occupiedCount}/{rentRoll.length} occupied · {rentRoll.length > 0 ? ((occupiedCount / rentRoll.length) * 100).toFixed(0) : 0}%)
                      </td>
                      <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(totalCurrentRent)}/mo</td>
                      <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(totalMarketRent)}/mo</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ LOAN SECTION ━━━ */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: `1px solid ${T.bg.border}`, backgroundColor: T.bg.surface }}
      >
        <div
          className="flex items-center justify-between px-5 py-3.5"
          style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
        >
          <div className="flex items-center gap-2">
            <Landmark size={16} color={T.text.muted} strokeWidth={1.5} />
            <span className="text-sm font-semibold" style={{ color: T.text.primary }}>
              Loan
            </span>
          </div>
          <EditButton onClick={() => setEditLoanOpen(true)} />
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">
          {/* Loan Details */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2.5" style={{ color: T.text.muted }}>
              Loan Details
            </div>
            <div className="grid grid-cols-2 gap-x-8">
              <FieldRow label="Loan Amount" value={fmt(uw?.loan_amount)} mono />
              <FieldRow label="LTV" value={uwRecord.purchase_price > 0 && uwRecord.loan_amount > 0 ? `${((uwRecord.loan_amount / uwRecord.purchase_price) * 100).toFixed(1)}%` : null} mono />
              <FieldRow label="Interest Rate" value={uwRecord.interest_rate > 0 ? `${(uwRecord.interest_rate * 100).toFixed(2)}%` : null} mono />
              <FieldRow label="Loan Type" value={uw?.loan_type} />
              <FieldRow label="Amortization" value={uw?.amortization_years ? `${uw.amortization_years} yr` : null} mono />
              <FieldRow label="Term" value={uw?.loan_term_years ? `${uw.loan_term_years} yr` : null} mono />
              <FieldRow label="IO Period" value={uwRecord.io_period_months > 0 ? `${uwRecord.io_period_months} mo` : "None"} mono />
              <FieldRow label="Lender" value={uw?.lender_name} />
              <FieldRow label="Origination Fee" value={uwRecord.origination_fee_pct > 0 ? `${(uwRecord.origination_fee_pct * 100).toFixed(2)}% (${fmtCurrency(uwRecord.loan_amount * uwRecord.origination_fee_pct)})` : null} mono />
              <FieldRow label="Prepay" value={uw?.prepay_type ?? uw?.prepay_schedule} />
            </div>
            <div
              className="mt-3 flex items-center justify-between rounded-lg px-3 py-2.5"
              style={{ backgroundColor: T.bg.elevated, border: `1px solid ${T.bg.borderSubtle}` }}
            >
              <span className="text-[13px] font-semibold" style={{ color: T.text.primary }}>Annual Debt Service</span>
              <span className="text-[13px] font-semibold num" style={{ color: T.text.primary }}>{fmtCurrency(annualDS)}</span>
            </div>
          </div>

          {/* Pro Forma Assumptions */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold mb-2.5" style={{ color: T.text.muted }}>
              Pro Forma Assumptions
            </div>
            <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${T.bg.borderSubtle}` }}>
              <table className="w-full border-collapse">
                {/* Income Section */}
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-bold px-3 py-2" style={{ color: T.text.muted }} colSpan={3}>Income</th>
                  </tr>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-1.5" style={{ color: T.text.muted }}>Line Item</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-1.5" style={{ color: T.text.muted }}>Year 1 Actual</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-1.5" style={{ color: T.text.muted }}>Lender Growth</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeRows.map((row, i) => (
                    <tr key={row.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                      <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>{row.line_item}</td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: row.is_deduction ? T.accent.red : T.text.primary }}>
                        {row.is_deduction ? `(${fmtCurrency(Math.abs(row.year_1_amount))})` : fmtCurrency(row.year_1_amount)}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.secondary }}>
                        {row.growth_rate > 0 ? fmtPct(row.growth_rate) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Expenses Section */}
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-bold px-3 py-2" style={{ color: T.text.muted }} colSpan={3}>Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.map((row, i) => (
                    <tr key={row.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                      <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>{row.category}</td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                        {row.is_percentage ? fmtPct(row.year_1_amount) : fmtCurrency(row.year_1_amount)}
                      </td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.secondary }}>
                        {row.growth_rate > 0 ? fmtPct(row.growth_rate) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>

                {/* Exit / Return Section */}
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-bold px-3 py-2" style={{ color: T.text.muted }} colSpan={3}>Exit / Return</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>Exit Cap Rate</td>
                    <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                      {uwRecord.exit_cap_rate > 0 ? `${(uwRecord.exit_cap_rate * 100).toFixed(2)}%` : "—"}
                    </td>
                    <td />
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>Hold Period</td>
                    <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>{uwRecord.hold_period_years} yr</td>
                    <td />
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>Sale Costs</td>
                    <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>{fmtPct(uwRecord.sale_costs_pct)}</td>
                    <td />
                  </tr>
                  <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>Disposition Fee</td>
                    <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>{fmtPct(uwRecord.disposition_fee_pct)}</td>
                    <td />
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Scope of Work */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
                Scope of Work
              </div>
            </div>
            <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${T.bg.borderSubtle}` }}>
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Item</th>
                    <th className="text-left text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Description</th>
                    <th className="text-right text-[11px] uppercase tracking-wider font-semibold px-3 py-2" style={{ color: T.text.muted }}>Est. Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {scopeOfWork.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center text-[13px] py-4" style={{ color: T.text.muted }}>
                        No scope of work items yet
                      </td>
                    </tr>
                  )}
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {scopeOfWork.map((item: any, i: number) => (
                    <tr key={item.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                      <td className="text-[13px] font-medium px-3 py-2" style={{ color: T.text.primary }}>{item.item_name}</td>
                      <td className="text-[13px] px-3 py-2" style={{ color: T.text.secondary }}>{item.description || "—"}</td>
                      <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(item.estimated_cost)}</td>
                    </tr>
                  ))}
                </tbody>
                {scopeOfWork.length > 0 && (
                  <tfoot>
                    <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                      <td colSpan={2} className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>Total Rehab Budget</td>
                      <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(scopeTotal)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ━━━ EDIT DIALOGS ━━━ */}
      <PropertyEditDialog
        open={editPropertyOpen}
        onOpenChange={setEditPropertyOpen}
        uw={uw}
        onSave={handleSaveUW}
      />
      <LoanEditDialog
        open={editLoanOpen}
        onOpenChange={setEditLoanOpen}
        uw={uw}
        onSave={handleSaveUW}
      />
      <RentRollEditDialog
        open={editRentRollOpen}
        onOpenChange={setEditRentRollOpen}
        rentRoll={rentRoll}
        uwId={uw?.id}
        dealId={dealId}
      />
    </div>
  );
}

// ── Status Dot ──

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    occupied: T.accent.green,
    vacant: T.accent.amber,
    down: T.accent.red,
    model: T.accent.blue,
  };
  const color = colors[status] ?? T.text.muted;
  return (
    <span className="inline-flex items-center gap-1.5 text-[12px] font-medium" style={{ color }}>
      <span className="inline-block h-[6px] w-[6px] rounded-full" style={{ backgroundColor: color }} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ── Property Edit Dialog ──

function PropertyEditDialog({
  open,
  onOpenChange,
  uw,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  onSave: (fields: Record<string, unknown>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fields = [
    { key: "property_name", label: "Property Name", type: "text" },
    { key: "property_address", label: "Address", type: "text" },
    { key: "property_city", label: "City", type: "text" },
    { key: "property_state", label: "State", type: "text" },
    { key: "property_zip", label: "Zip", type: "text" },
    { key: "property_type", label: "Property Type", type: "text" },
    { key: "num_units", label: "Units", type: "number" },
    { key: "total_sf", label: "Total SF", type: "number" },
    { key: "year_built", label: "Year Built", type: "number" },
    { key: "lot_size_acres", label: "Lot Size (acres)", type: "number" },
    { key: "zoning", label: "Zoning", type: "text" },
    { key: "purchase_price", label: "Purchase Price", type: "number" },
    { key: "closing_costs", label: "Closing Costs", type: "number" },
    { key: "capex_reserve", label: "CapEx Reserve", type: "number" },
    { key: "working_capital", label: "Working Capital", type: "number" },
  ];

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      const vals: Record<string, string> = {};
      for (const f of fields) {
        vals[f.key] = uw?.[f.key] != null ? String(uw[f.key]) : "";
      }
      setForm(vals);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      for (const f of fields) {
        const val = form[f.key] ?? "";
        if (f.type === "number") {
          updates[f.key] = val ? Number(val) : null;
        } else {
          updates[f.key] = val || null;
        }
      }
      await onSave(updates);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Property Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {fields.map((f) => (
            <div key={f.key} className="grid grid-cols-4 items-center gap-3">
              <label className="text-right text-sm text-muted-foreground">{f.label}</label>
              <Input
                className="col-span-3"
                type={f.type === "number" ? "number" : "text"}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Loan Edit Dialog ──

function LoanEditDialog({
  open,
  onOpenChange,
  uw,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  onSave: (fields: Record<string, unknown>) => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const fields = [
    { key: "lender_name", label: "Lender", type: "text" },
    { key: "loan_amount", label: "Loan Amount", type: "number" },
    { key: "interest_rate", label: "Interest Rate (decimal)", type: "number" },
    { key: "amortization_years", label: "Amortization (years)", type: "number" },
    { key: "loan_term_years", label: "Term (years)", type: "number" },
    { key: "io_period_months", label: "IO Period (months)", type: "number" },
    { key: "loan_type", label: "Loan Type", type: "text" },
    { key: "origination_fee_pct", label: "Origination Fee (decimal)", type: "number" },
    { key: "prepay_type", label: "Prepay Type", type: "text" },
    { key: "prepay_schedule", label: "Prepay Schedule", type: "text" },
    { key: "exit_cap_rate", label: "Exit Cap Rate (decimal)", type: "number" },
    { key: "hold_period_years", label: "Hold Period (years)", type: "number" },
    { key: "sale_costs_pct", label: "Sale Costs (decimal)", type: "number" },
    { key: "disposition_fee_pct", label: "Disposition Fee (decimal)", type: "number" },
  ];

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      const vals: Record<string, string> = {};
      for (const f of fields) {
        vals[f.key] = uw?.[f.key] != null ? String(uw[f.key]) : "";
      }
      setForm(vals);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const updates: Record<string, unknown> = {};
      for (const f of fields) {
        const val = form[f.key] ?? "";
        if (f.type === "number") {
          updates[f.key] = val ? Number(val) : null;
        } else {
          updates[f.key] = val || null;
        }
      }
      await onSave(updates);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Loan Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 py-4">
          {fields.map((f) => (
            <div key={f.key} className="grid grid-cols-4 items-center gap-3">
              <label className="text-right text-sm text-muted-foreground">{f.label}</label>
              <Input
                className="col-span-3"
                type={f.type === "number" ? "number" : "text"}
                step={f.type === "number" ? "any" : undefined}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Rent Roll Edit Dialog ──

function RentRollEditDialog({
  open,
  onOpenChange,
  rentRoll,
  uwId,
  dealId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll: any[];
  uwId: string | null;
  dealId: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(rentRoll.map((r, i) => ({ ...r, sort_order: i })));
    }
    onOpenChange(isOpen);
  };

  const addUnit = () => {
    setRows((prev) => [
      ...prev,
      {
        unit_number: `${prev.length + 1}`,
        bedrooms: null,
        bathrooms: null,
        sq_ft: null,
        current_rent: 0,
        market_rent: 0,
        status: "occupied",
        lease_start: null,
        lease_end: null,
        tenant_name: null,
        sort_order: prev.length,
      },
    ]);
  };

  const removeUnit = (idx: number) => {
    setRows((prev) => prev.filter((_, i) => i !== idx));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateRow = (idx: number, field: string, value: any) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertRentRoll(
        uwId,
        rows.map((r, i) => ({
          unit_number: r.unit_number || `${i + 1}`,
          bedrooms: r.bedrooms ? Number(r.bedrooms) : null,
          bathrooms: r.bathrooms ? Number(r.bathrooms) : null,
          sq_ft: r.sq_ft ? Number(r.sq_ft) : null,
          current_rent: Number(r.current_rent) || 0,
          market_rent: Number(r.market_rent) || 0,
          status: r.status || "occupied",
          lease_start: r.lease_start || null,
          lease_end: r.lease_end || null,
          tenant_name: r.tenant_name || null,
          sort_order: i,
        }))
      );
      if (result.error) {
        toast({ title: "Failed to save rent roll", description: result.error, variant: "destructive" });
      } else {
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Rent Roll</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Unit</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">BD</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">BA</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">SF</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Current Rent</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Market Rent</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Status</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">
                    <Input className="h-8 w-16" value={row.unit_number || ""} onChange={(e) => updateRow(i, "unit_number", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-14" type="number" value={row.bedrooms ?? ""} onChange={(e) => updateRow(i, "bedrooms", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-14" type="number" step="0.5" value={row.bathrooms ?? ""} onChange={(e) => updateRow(i, "bathrooms", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-20" type="number" value={row.sq_ft ?? ""} onChange={(e) => updateRow(i, "sq_ft", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-24" type="number" value={row.current_rent ?? ""} onChange={(e) => updateRow(i, "current_rent", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-24" type="number" value={row.market_rent ?? ""} onChange={(e) => updateRow(i, "market_rent", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <select
                      className="h-8 rounded border px-2 text-[13px] bg-background"
                      value={row.status || "occupied"}
                      onChange={(e) => updateRow(i, "status", e.target.value)}
                    >
                      <option value="occupied">Occupied</option>
                      <option value="vacant">Vacant</option>
                      <option value="down">Down</option>
                      <option value="model">Model</option>
                    </select>
                  </td>
                  <td className="px-2 py-1">
                    <button
                      onClick={() => removeUnit(i)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer border-0 bg-transparent p-1"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Button variant="outline" size="sm" onClick={addUnit} className="mt-2 w-fit">
          <Plus size={14} strokeWidth={1.5} className="mr-1" />
          Add Unit
        </Button>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
