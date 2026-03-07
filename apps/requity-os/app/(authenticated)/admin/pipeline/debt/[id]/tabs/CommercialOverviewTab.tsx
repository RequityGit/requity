"use client";

import { useState, useMemo, useCallback } from "react";
import { Building2, Landmark, Pencil, Plus, ChevronDown, Trash2, Clock, Loader2 } from "lucide-react";
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
} from "../commercial-uw-actions";
import { computeAnnualDebtService, computeT12NetRevenue, computeT12TotalExpenses, computeT12NOI } from "@/lib/commercial-uw/deal-computations";
import type { DealIncomeRow, DealExpenseRow, DealUWRecord } from "@/lib/commercial-uw/deal-computations";
import { UploadPropertyRentRollDialog } from "@/components/admin/property-financials/upload-property-rent-roll-dialog";
import { UploadPropertyT12Dialog } from "@/components/admin/property-financials/upload-property-t12-dialog";
import {
  PropertyFinancialVersions,
  type RentRollVersion,
  type T12Version,
} from "@/components/admin/property-financials/property-financial-versions";
import {
  setCurrentRentRoll,
  setCurrentT12,
  deletePropertyRentRoll,
  deletePropertyT12,
} from "../property-financial-actions";

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
}

interface PropertyFinancialsData {
  rentRolls: RentRollVersion[];
  currentRentRoll: RentRollVersion | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentRentRollUnits: any[];
  t12s: T12Version[];
  currentT12: T12Version | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  currentT12LineItems: any[];
}

interface CommercialOverviewTabProps {
  data: CommercialUWData;
  dealId: string;
  currentUserId: string;
  propertyFinancials?: PropertyFinancialsData | null;
  propertyId?: string | null;
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

export function CommercialOverviewTab({ data, dealId, currentUserId, propertyFinancials, propertyId }: CommercialOverviewTabProps) {
  const { uw, income, expenses, rentRoll, scopeOfWork } = data;
  const { toast } = useToast();
  const router = useRouter();

  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editLoanOpen, setEditLoanOpen] = useState(false);
  const [editRentRollOpen, setEditRentRollOpen] = useState(false);
  const [editT12Open, setEditT12Open] = useState(false);
  const [editProFormaOpen, setEditProFormaOpen] = useState(false);
  const [editScopeOpen, setEditScopeOpen] = useState(false);
  const [showAllUnits, setShowAllUnits] = useState(false);
  const [uploadRROpen, setUploadRROpen] = useState(false);
  const [uploadT12Open, setUploadT12Open] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  // Property-level financial data
  const pf = propertyFinancials;
  const currentPropRR = pf?.currentRentRoll ?? null;
  const propRRUnits = pf?.currentRentRollUnits ?? [];
  const currentPropT12 = pf?.currentT12 ?? null;
  const propT12LineItems = pf?.currentT12LineItems ?? [];

  // Compute property T12 income/expense aggregates
  const propT12Income = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propT12LineItems.filter((item: any) => item.is_income && !item.is_excluded),
    [propT12LineItems]
  );
  const propT12Expenses = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propT12LineItems.filter((item: any) => !item.is_income && !item.is_excluded),
    [propT12LineItems]
  );
  const propT12NetRevenue = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propT12Income.reduce((sum: number, item: any) => sum + (Number(item.annual_total) || 0), 0),
    [propT12Income]
  );
  const propT12TotalExpenses = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propT12Expenses.reduce((sum: number, item: any) => sum + (Number(item.annual_total) || 0), 0),
    [propT12Expenses]
  );
  const propT12NOI = useMemo(() => propT12NetRevenue - propT12TotalExpenses, [propT12NetRevenue, propT12TotalExpenses]);

  // Property rent roll totals
  const propRRTotalCurrentRent = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propRRUnits.reduce((sum: number, u: any) => sum + (Number(u.current_monthly_rent) || 0), 0),
    [propRRUnits]
  );
  const propRRTotalMarketRent = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propRRUnits.reduce((sum: number, u: any) => sum + (Number(u.market_rent) || 0), 0),
    [propRRUnits]
  );
  const propRROccupied = useMemo(() =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    propRRUnits.filter((u: any) => !u.is_vacant).length,
    [propRRUnits]
  );

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

  const handleSaveUW = useCallback(async (fields: Record<string, unknown>) => {
    if (!uw?.id) return;
    const result = await updateCommercialUW(uw.id, fields);
    if (result.error) {
      toast({ title: "Failed to save", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Changes saved" });
      router.refresh();
    }
  }, [uw?.id, toast, router]);

  // Visible rent roll units
  const INITIAL_UNITS = 5;
  const visibleUnits = showAllUnits ? rentRoll : rentRoll.slice(0, INITIAL_UNITS);
  const hiddenCount = rentRoll.length - INITIAL_UNITS;

  return (
    <div className="flex flex-col gap-5">
      {/* ━━━ LAST SAVED INDICATOR ━━━ */}
      <div className="flex items-center gap-2 px-1 py-1">
        <Clock size={13} color={T.text.muted} strokeWidth={1.5} />
        <span className="text-[12px]" style={{ color: T.text.muted }}>
          {uw?.updated_at
            ? `Last saved: ${new Date(uw.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at ${new Date(uw.updated_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`
            : "Not yet saved"}
        </span>
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
              <div className="flex items-center gap-2">
                <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
                  T12 Income
                </div>
                {currentPropT12 && (
                  <span className="rounded px-1.5 py-px text-[10px] font-medium num" style={{ backgroundColor: "rgba(59,130,246,0.12)", color: T.accent.blue }}>
                    {new Date(currentPropT12.period_start + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    {" – "}
                    {new Date(currentPropT12.period_end + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {propertyId && (
                  <button
                    onClick={() => setUploadT12Open(true)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer border-0"
                    style={{ backgroundColor: T.bg.elevated, color: T.text.secondary, border: `1px solid ${T.bg.border}` }}
                  >
                    Upload T12
                  </button>
                )}
                <EditButton onClick={() => setEditT12Open(true)} />
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
                  {/* Property-level T12 income rows (if available) */}
                  {propT12Income.length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    propT12Income.map((item: any, i: number) => (
                      <tr key={item.id || `prop-inc-${i}`} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                        <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>
                          {item.mapped_category ? (item.mapped_category as string).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : item.original_row_label}
                        </td>
                        <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                          {fmtCurrency(item.annual_total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    /* Deal-level UW income rows (fallback) */
                    incomeRows.map((row, i) => (
                      <tr key={row.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                        <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>{row.line_item}</td>
                        <td
                          className="text-right text-[13px] num px-3 py-2"
                          style={{ color: row.is_deduction ? T.accent.red : T.text.primary }}
                        >
                          {row.is_deduction ? `(${fmtCurrency(Math.abs(row.t12_amount))})` : fmtCurrency(row.t12_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                    <td className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>Net Revenue</td>
                    <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>
                      {fmtCurrency(propT12Income.length > 0 ? propT12NetRevenue : t12NetRevenue)}
                    </td>
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
                  {/* Property-level T12 expense rows (if available) */}
                  {propT12Expenses.length > 0 ? (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    propT12Expenses.map((item: any, i: number) => (
                      <tr key={item.id || `prop-exp-${i}`} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                        <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>
                          {item.mapped_category ? (item.mapped_category as string).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : item.original_row_label}
                        </td>
                        <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                          {fmtCurrency(item.annual_total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    expenseRows.map((row, i) => (
                      <tr key={row.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                        <td className="text-[13px] px-3 py-2" style={{ color: T.text.primary }}>
                          {row.category}
                          {row.is_percentage && <span className="text-[11px] ml-1" style={{ color: T.text.muted }}>(% of EGI)</span>}
                        </td>
                        <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>
                          {fmtCurrency(row.t12_amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                    <td className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>Total Expenses</td>
                    <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>
                      {fmtCurrency(propT12Expenses.length > 0 ? propT12TotalExpenses : t12TotalExpenses)}
                    </td>
                  </tr>
                  <tr style={{ backgroundColor: T.bg.elevated, borderTop: `2px solid ${T.bg.border}` }}>
                    <td className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>Current NOI</td>
                    <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>
                      {fmtCurrency(propT12LineItems.length > 0 ? propT12NOI : t12NOI)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Rent Roll */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
                  Rent Roll
                  {(propRRUnits.length > 0 ? propRRUnits : rentRoll).length > 0 && (
                    <span className="normal-case font-normal">
                      {" "}— {(propRRUnits.length > 0 ? propRRUnits : rentRoll).length} units
                    </span>
                  )}
                </div>
                {currentPropRR && (
                  <span className="rounded px-1.5 py-px text-[10px] font-medium num" style={{ backgroundColor: "rgba(59,130,246,0.12)", color: T.accent.blue }}>
                    As of {new Date(currentPropRR.as_of_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {propertyId && (
                  <button
                    onClick={() => setUploadRROpen(true)}
                    className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer border-0"
                    style={{ backgroundColor: T.bg.elevated, color: T.text.secondary, border: `1px solid ${T.bg.border}` }}
                  >
                    Upload
                  </button>
                )}
                <EditButton onClick={() => setEditRentRollOpen(true)} />
              </div>
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
                  {/* Property-level rent roll units (if available) */}
                  {propRRUnits.length > 0 ? (
                    <>
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {(showAllUnits ? propRRUnits : propRRUnits.slice(0, INITIAL_UNITS)).map((unit: any, i: number) => (
                        <tr key={unit.id || `prop-rr-${i}`} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                          <td className="text-[13px] px-3 py-2 font-medium" style={{ color: T.text.primary }}>{unit.unit_number}</td>
                          <td className="text-[13px] px-3 py-2" style={{ color: T.text.secondary }}>
                            {unit.beds_type || "—"}
                          </td>
                          <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.secondary }}>
                            {unit.sf ? Number(unit.sf).toLocaleString() : "—"}
                          </td>
                          <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(unit.current_monthly_rent)}</td>
                          <td className="text-right text-[13px] num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(unit.market_rent)}</td>
                          <td className="text-[13px] px-3 py-2">
                            <StatusDot status={unit.is_vacant ? "vacant" : "occupied"} />
                          </td>
                        </tr>
                      ))}
                      {!showAllUnits && propRRUnits.length > INITIAL_UNITS && (
                        <tr>
                          <td colSpan={6} className="text-center py-2">
                            <button
                              onClick={() => setShowAllUnits(true)}
                              className="text-[13px] font-medium cursor-pointer border-0 bg-transparent flex items-center gap-1 mx-auto"
                              style={{ color: T.accent.blue }}
                            >
                              <ChevronDown size={14} strokeWidth={1.5} />
                              Show {propRRUnits.length - INITIAL_UNITS} more units
                            </button>
                          </td>
                        </tr>
                      )}
                    </>
                  ) : (
                    <>
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
                    </>
                  )}
                </tbody>
                {(propRRUnits.length > 0 || rentRoll.length > 0) && (
                  <tfoot>
                    <tr style={{ backgroundColor: T.bg.elevated, borderTop: `1px solid ${T.bg.border}` }}>
                      {propRRUnits.length > 0 ? (
                        <>
                          <td colSpan={3} className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>
                            Total ({propRROccupied}/{propRRUnits.length} occupied · {propRRUnits.length > 0 ? ((propRROccupied / propRRUnits.length) * 100).toFixed(0) : 0}%)
                          </td>
                          <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(propRRTotalCurrentRent)}/mo</td>
                          <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(propRRTotalMarketRent)}/mo</td>
                        </>
                      ) : (
                        <>
                          <td colSpan={3} className="text-[13px] font-semibold px-3 py-2" style={{ color: T.text.primary }}>
                            Total ({occupiedCount}/{rentRoll.length} occupied · {rentRoll.length > 0 ? ((occupiedCount / rentRoll.length) * 100).toFixed(0) : 0}%)
                          </td>
                          <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(totalCurrentRent)}/mo</td>
                          <td className="text-right text-[13px] font-semibold num px-3 py-2" style={{ color: T.text.primary }}>{fmtCurrency(totalMarketRent)}/mo</td>
                        </>
                      )}
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
            <div className="flex items-center justify-between mb-2.5">
              <div className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
                Pro Forma Assumptions
              </div>
              <EditButton onClick={() => setEditProFormaOpen(true)} />
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
              <EditButton onClick={() => setEditScopeOpen(true)} />
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

      {/* ━━━ PROPERTY FINANCIAL VERSIONS ━━━ */}
      {propertyId && pf && (pf.rentRolls.length > 0 || pf.t12s.length > 0) && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: `1px solid ${T.bg.border}`, backgroundColor: T.bg.surface }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 cursor-pointer"
            style={{ borderBottom: showVersions ? `1px solid ${T.bg.borderSubtle}` : "none" }}
            onClick={() => setShowVersions(!showVersions)}
          >
            <div className="flex items-center gap-2">
              <Clock size={16} color={T.text.muted} strokeWidth={1.5} />
              <span className="text-sm font-semibold" style={{ color: T.text.primary }}>
                Property Financial History
              </span>
              <span className="text-[11px] num ml-1" style={{ color: T.text.muted }}>
                {pf.rentRolls.length} rent roll{pf.rentRolls.length !== 1 ? "s" : ""} · {pf.t12s.length} T12{pf.t12s.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ChevronDown
              size={16}
              color={T.text.muted}
              strokeWidth={1.5}
              style={{ transform: showVersions ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            />
          </div>
          {showVersions && (
            <div className="px-5 py-4">
              <PropertyFinancialVersions
                rentRolls={pf.rentRolls}
                t12s={pf.t12s}
                onSetCurrentRR={setCurrentRentRoll}
                onSetCurrentT12={setCurrentT12}
                onDeleteRR={deletePropertyRentRoll}
                onDeleteT12={deletePropertyT12}
                onUploadRR={() => setUploadRROpen(true)}
                onUploadT12={() => setUploadT12Open(true)}
              />
            </div>
          )}
        </div>
      )}

      {/* ━━━ UPLOAD DIALOGS ━━━ */}
      {propertyId && (
        <>
          <UploadPropertyRentRollDialog
            open={uploadRROpen}
            onOpenChange={setUploadRROpen}
            propertyId={propertyId}
            userId={currentUserId}
          />
          <UploadPropertyT12Dialog
            open={uploadT12Open}
            onOpenChange={setUploadT12Open}
            propertyId={propertyId}
            userId={currentUserId}
          />
        </>
      )}

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
      <T12EditDialog
        open={editT12Open}
        onOpenChange={setEditT12Open}
        incomeRows={incomeRows}
        expenseRows={expenseRows}
        uwId={uw?.id}
      />
      <ProFormaEditDialog
        open={editProFormaOpen}
        onOpenChange={setEditProFormaOpen}
        incomeRows={incomeRows}
        expenseRows={expenseRows}
        uw={uw}
        uwId={uw?.id}
        onSaveUW={handleSaveUW}
      />
      <ScopeOfWorkEditDialog
        open={editScopeOpen}
        onOpenChange={setEditScopeOpen}
        scopeOfWork={scopeOfWork}
        uwId={uw?.id}
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

// ── T12 Edit Dialog ──

interface T12IncomeEditRow {
  id?: string;
  line_item: string;
  t12_amount: number;
  year_1_amount: number;
  growth_rate: number;
  is_deduction: boolean;
  sort_order: number;
}

interface T12ExpenseEditRow {
  id?: string;
  category: string;
  t12_amount: number;
  year_1_amount: number;
  growth_rate: number;
  is_percentage: boolean;
  sort_order: number;
}

function T12EditDialog({
  open,
  onOpenChange,
  incomeRows: initialIncome,
  expenseRows: initialExpenses,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeRows: DealIncomeRow[];
  expenseRows: DealExpenseRow[];
  uwId: string | null;
}) {
  const [incRows, setIncRows] = useState<T12IncomeEditRow[]>([]);
  const [expRows, setExpRows] = useState<T12ExpenseEditRow[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setIncRows(
        initialIncome.map((r, i) => ({
          id: r.id,
          line_item: r.line_item,
          t12_amount: r.t12_amount,
          year_1_amount: r.year_1_amount,
          growth_rate: r.growth_rate,
          is_deduction: r.is_deduction,
          sort_order: i,
        }))
      );
      setExpRows(
        initialExpenses.map((r, i) => ({
          id: r.id,
          category: r.category,
          t12_amount: r.t12_amount,
          year_1_amount: r.year_1_amount,
          growth_rate: r.growth_rate,
          is_percentage: r.is_percentage,
          sort_order: i,
        }))
      );
    }
    onOpenChange(isOpen);
  };

  const addIncomeRow = () => {
    setIncRows((prev) => [
      ...prev,
      {
        line_item: "",
        t12_amount: 0,
        year_1_amount: 0,
        growth_rate: 0,
        is_deduction: false,
        sort_order: prev.length,
      },
    ]);
  };

  const addExpenseRow = () => {
    setExpRows((prev) => [
      ...prev,
      {
        category: "",
        t12_amount: 0,
        year_1_amount: 0,
        growth_rate: 0,
        is_percentage: false,
        sort_order: prev.length,
      },
    ]);
  };

  const updateIncome = (idx: number, field: string, value: unknown) => {
    setIncRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const updateExpense = (idx: number, field: string, value: unknown) => {
    setExpRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r))
    );
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const incResult = await upsertIncomeRows(
        uwId,
        incRows.map((r, i) => ({
          line_item: r.line_item,
          t12_amount: Number(r.t12_amount) || 0,
          year_1_amount: Number(r.year_1_amount) || 0,
          growth_rate: Number(r.growth_rate) || 0,
          is_deduction: r.is_deduction,
          sort_order: i,
        }))
      );
      if (incResult.error) {
        toast({ title: "Failed to save T12 income", description: incResult.error, variant: "destructive" });
        return;
      }

      const expResult = await upsertExpenseRows(
        uwId,
        expRows.map((r, i) => ({
          category: r.category,
          t12_amount: Number(r.t12_amount) || 0,
          year_1_amount: Number(r.year_1_amount) || 0,
          growth_rate: Number(r.growth_rate) || 0,
          is_percentage: r.is_percentage,
          sort_order: i,
        }))
      );
      if (expResult.error) {
        toast({ title: "Failed to save T12 expenses", description: expResult.error, variant: "destructive" });
        return;
      }

      toast({ title: "T12 data saved" });
      router.refresh();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit T12 Income & Expenses</DialogTitle>
        </DialogHeader>

        {/* Income Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Income</h3>
            <Button variant="outline" size="sm" onClick={addIncomeRow}>
              <Plus size={14} strokeWidth={1.5} className="mr-1" />
              Add Row
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Line Item</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">T12 Amount</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Year 1</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Growth %</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Deduction</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {incRows.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-2 py-1">
                      <Input className="h-8 w-40" value={row.line_item} onChange={(e) => updateIncome(i, "line_item", e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-28" type="number" value={row.t12_amount || ""} onChange={(e) => updateIncome(i, "t12_amount", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-28" type="number" value={row.year_1_amount || ""} onChange={(e) => updateIncome(i, "year_1_amount", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-20" type="number" step="any" value={row.growth_rate || ""} onChange={(e) => updateIncome(i, "growth_rate", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input type="checkbox" checked={row.is_deduction} onChange={(e) => updateIncome(i, "is_deduction", e.target.checked)} />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => setIncRows((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive cursor-pointer border-0 bg-transparent p-1"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
                {incRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      No income rows. Click &quot;Add Row&quot; to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Expenses</h3>
            <Button variant="outline" size="sm" onClick={addExpenseRow}>
              <Plus size={14} strokeWidth={1.5} className="mr-1" />
              Add Row
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">T12 Amount</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Year 1</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Growth %</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">% of EGI</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {expRows.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-2 py-1">
                      <Input className="h-8 w-40" value={row.category} onChange={(e) => updateExpense(i, "category", e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-28" type="number" value={row.t12_amount || ""} onChange={(e) => updateExpense(i, "t12_amount", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-28" type="number" value={row.year_1_amount || ""} onChange={(e) => updateExpense(i, "year_1_amount", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-20" type="number" step="any" value={row.growth_rate || ""} onChange={(e) => updateExpense(i, "growth_rate", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input type="checkbox" checked={row.is_percentage} onChange={(e) => updateExpense(i, "is_percentage", e.target.checked)} />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => setExpRows((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive cursor-pointer border-0 bg-transparent p-1"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
                {expRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted-foreground">
                      No expense rows. Click &quot;Add Row&quot; to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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

// ── Pro Forma Edit Dialog ──

function ProFormaEditDialog({
  open,
  onOpenChange,
  incomeRows: initialIncome,
  expenseRows: initialExpenses,
  uw,
  uwId,
  onSaveUW,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incomeRows: DealIncomeRow[];
  expenseRows: DealExpenseRow[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  uwId: string | null;
  onSaveUW: (fields: Record<string, unknown>) => Promise<void>;
}) {
  const [income, setIncome] = useState<{ line_item: string; year_1_amount: number; growth_rate: number; is_deduction: boolean; t12_amount: number; sort_order: number }[]>([]);
  const [expenses, setExpenses] = useState<{ category: string; year_1_amount: number; growth_rate: number; is_percentage: boolean; t12_amount: number; sort_order: number }[]>([]);
  const [exitFields, setExitFields] = useState({ exit_cap_rate: "", hold_period_years: "", sale_costs_pct: "", disposition_fee_pct: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setIncome(initialIncome.map((r, i) => ({ line_item: r.line_item, year_1_amount: r.year_1_amount, growth_rate: r.growth_rate, is_deduction: r.is_deduction, t12_amount: r.t12_amount, sort_order: i })));
      setExpenses(initialExpenses.map((r, i) => ({ category: r.category, year_1_amount: r.year_1_amount, growth_rate: r.growth_rate, is_percentage: r.is_percentage, t12_amount: r.t12_amount, sort_order: i })));
      setExitFields({
        exit_cap_rate: uw?.exit_cap_rate != null ? String(Number(uw.exit_cap_rate) * 100) : "",
        hold_period_years: uw?.hold_period_years != null ? String(uw.hold_period_years) : "5",
        sale_costs_pct: uw?.sale_costs_pct != null ? String(Number(uw.sale_costs_pct) * 100) : "",
        disposition_fee_pct: uw?.disposition_fee_pct != null ? String(Number(uw.disposition_fee_pct) * 100) : "",
      });
    }
    onOpenChange(isOpen);
  };

  const addIncomeRow = () => {
    setIncome((prev) => [...prev, { line_item: "", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_deduction: false, sort_order: prev.length }]);
  };

  const addExpenseRow = () => {
    setExpenses((prev) => [...prev, { category: "", t12_amount: 0, year_1_amount: 0, growth_rate: 0, is_percentage: false, sort_order: prev.length }]);
  };

  const updateIncome = (idx: number, field: string, value: unknown) => {
    setIncome((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const updateExpense = (idx: number, field: string, value: unknown) => {
    setExpenses((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const incResult = await upsertIncomeRows(
        uwId,
        income.map((r, i) => ({
          line_item: r.line_item || "Untitled",
          t12_amount: Number(r.t12_amount) || 0,
          year_1_amount: Number(r.year_1_amount) || 0,
          growth_rate: Number(r.growth_rate) || 0,
          is_deduction: r.is_deduction,
          sort_order: i,
        }))
      );
      if (incResult.error) {
        toast({ title: "Failed to save income rows", description: incResult.error, variant: "destructive" });
        return;
      }

      const expResult = await upsertExpenseRows(
        uwId,
        expenses.map((r, i) => ({
          category: r.category || "Untitled",
          t12_amount: Number(r.t12_amount) || 0,
          year_1_amount: Number(r.year_1_amount) || 0,
          growth_rate: Number(r.growth_rate) || 0,
          is_percentage: r.is_percentage,
          sort_order: i,
        }))
      );
      if (expResult.error) {
        toast({ title: "Failed to save expense rows", description: expResult.error, variant: "destructive" });
        return;
      }

      await onSaveUW({
        exit_cap_rate: exitFields.exit_cap_rate ? Number(exitFields.exit_cap_rate) / 100 : null,
        hold_period_years: exitFields.hold_period_years ? Number(exitFields.hold_period_years) : null,
        sale_costs_pct: exitFields.sale_costs_pct ? Number(exitFields.sale_costs_pct) / 100 : null,
        disposition_fee_pct: exitFields.disposition_fee_pct ? Number(exitFields.disposition_fee_pct) / 100 : null,
      });

      toast({ title: "Pro forma assumptions saved" });
      router.refresh();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pro Forma Assumptions</DialogTitle>
        </DialogHeader>

        {/* Income */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Income</h3>
            <Button variant="outline" size="sm" onClick={addIncomeRow}>
              <Plus size={14} strokeWidth={1.5} className="mr-1" />
              Add Row
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Line Item</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Year 1 Amount</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Growth %</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Deduction</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {income.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-2 py-1">
                      <Input className="h-8 w-40" value={row.line_item} onChange={(e) => updateIncome(i, "line_item", e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-28" type="number" value={row.year_1_amount || ""} onChange={(e) => updateIncome(i, "year_1_amount", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-20" type="number" step="any" value={row.growth_rate || ""} onChange={(e) => updateIncome(i, "growth_rate", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input type="checkbox" checked={row.is_deduction} onChange={(e) => updateIncome(i, "is_deduction", e.target.checked)} />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => setIncome((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive cursor-pointer border-0 bg-transparent p-1"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
                {income.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted-foreground">
                      No income rows. Click &quot;Add Row&quot; to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Expenses</h3>
            <Button variant="outline" size="sm" onClick={addExpenseRow}>
              <Plus size={14} strokeWidth={1.5} className="mr-1" />
              Add Row
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Year 1 Amount</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Growth %</th>
                  <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">% of EGI</th>
                  <th className="px-2 py-1.5" />
                </tr>
              </thead>
              <tbody>
                {expenses.map((row, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-2 py-1">
                      <Input className="h-8 w-40" value={row.category} onChange={(e) => updateExpense(i, "category", e.target.value)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-28" type="number" value={row.year_1_amount || ""} onChange={(e) => updateExpense(i, "year_1_amount", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1">
                      <Input className="h-8 w-20" type="number" step="any" value={row.growth_rate || ""} onChange={(e) => updateExpense(i, "growth_rate", Number(e.target.value) || 0)} />
                    </td>
                    <td className="px-2 py-1 text-center">
                      <input type="checkbox" checked={row.is_percentage} onChange={(e) => updateExpense(i, "is_percentage", e.target.checked)} />
                    </td>
                    <td className="px-2 py-1">
                      <button
                        onClick={() => setExpenses((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive cursor-pointer border-0 bg-transparent p-1"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-4 text-muted-foreground">
                      No expense rows. Click &quot;Add Row&quot; to start.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Exit / Return */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-2">Exit / Return</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-right text-sm text-muted-foreground col-span-2">Exit Cap Rate (%)</label>
              <Input className="h-8 col-span-2" type="number" step="0.01" value={exitFields.exit_cap_rate} onChange={(e) => setExitFields((f) => ({ ...f, exit_cap_rate: e.target.value }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-right text-sm text-muted-foreground col-span-2">Hold Period (yr)</label>
              <Input className="h-8 col-span-2" type="number" value={exitFields.hold_period_years} onChange={(e) => setExitFields((f) => ({ ...f, hold_period_years: e.target.value }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-right text-sm text-muted-foreground col-span-2">Sale Costs (%)</label>
              <Input className="h-8 col-span-2" type="number" step="0.01" value={exitFields.sale_costs_pct} onChange={(e) => setExitFields((f) => ({ ...f, sale_costs_pct: e.target.value }))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-right text-sm text-muted-foreground col-span-2">Disposition Fee (%)</label>
              <Input className="h-8 col-span-2" type="number" step="0.01" value={exitFields.disposition_fee_pct} onChange={(e) => setExitFields((f) => ({ ...f, disposition_fee_pct: e.target.value }))} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Pro Forma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Scope of Work Edit Dialog ──

function ScopeOfWorkEditDialog({
  open,
  onOpenChange,
  scopeOfWork: initialScope,
  uwId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  scopeOfWork: any[];
  uwId: string | null;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [rows, setRows] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setRows(initialScope.map((r, i) => ({ ...r, sort_order: i })));
    }
    onOpenChange(isOpen);
  };

  const addRow = () => {
    setRows((prev) => [...prev, { item_name: "", description: "", estimated_cost: 0, sort_order: prev.length }]);
  };

  const updateRow = (idx: number, field: string, value: unknown) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  };

  const handleSubmit = async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await upsertScopeOfWork(
        uwId,
        rows.map((r, i) => ({
          item_name: r.item_name || "Untitled",
          description: r.description || null,
          estimated_cost: Number(r.estimated_cost) || 0,
          sort_order: i,
        }))
      );
      if (result.error) {
        toast({ title: "Failed to save scope of work", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Scope of work saved" });
        router.refresh();
        onOpenChange(false);
      }
    } finally {
      setSaving(false);
    }
  };

  const total = rows.reduce((sum: number, r: { estimated_cost: number }) => sum + (Number(r.estimated_cost) || 0), 0);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Scope of Work</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="border-b">
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Item</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Description</th>
                <th className="text-left px-2 py-1.5 font-medium text-muted-foreground">Est. Cost</th>
                <th className="px-2 py-1.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row: { item_name: string; description: string; estimated_cost: number }, i: number) => (
                <tr key={i} className="border-b">
                  <td className="px-2 py-1">
                    <Input className="h-8" value={row.item_name || ""} onChange={(e) => updateRow(i, "item_name", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8" value={row.description || ""} onChange={(e) => updateRow(i, "description", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <Input className="h-8 w-28" type="number" value={row.estimated_cost ?? ""} onChange={(e) => updateRow(i, "estimated_cost", e.target.value)} />
                  </td>
                  <td className="px-2 py-1">
                    <button
                      onClick={() => setRows((prev) => prev.filter((_, j) => j !== i))}
                      className="text-muted-foreground hover:text-destructive cursor-pointer border-0 bg-transparent p-1"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-4 text-muted-foreground">
                    No scope of work items yet. Click &quot;Add Item&quot; to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-2">
          <Button variant="outline" size="sm" onClick={addRow} className="w-fit">
            <Plus size={14} strokeWidth={1.5} className="mr-1" />
            Add Item
          </Button>
          {rows.length > 0 && (
            <span className="text-sm text-muted-foreground">
              Total: <span className="font-semibold num">${total.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
            </span>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Scope of Work
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
