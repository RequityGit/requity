"use client";

import { useState, useMemo } from "react";
import { DollarSign, Home, Settings2 } from "lucide-react";
import { T, SectionCard, FieldRow, fmt, fP } from "../components";
import type { CommercialUWData } from "./CommercialOverviewTab";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface FinancialsTabProps {
  commercialUW?: CommercialUWData | null;
  propertyFinancials?: any;
  deal: {
    loan_amount?: number | null;
    interest_rate?: number | null;
    ltv?: number | null;
    loan_term_months?: number | null;
    // exit assumptions
    exit_cap_rate?: number | null;
    hold_period_months?: number | null;
    sale_costs_pct?: number | null;
    disposition_fee_pct?: number | null;
  };
}

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

function fmtNeg(v: number): string {
  if (v < 0) return `($${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`;
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function dscrColor(v: number | null): string | null {
  if (v == null || v === 0) return null;
  if (v >= 1.25) return "#1B7A44";
  if (v >= 1.1) return "#B8822A";
  return "#E54D42";
}

const STATUS_COLORS: Record<string, string> = {
  occupied: "#1B7A44",
  vacant: "#E54D42",
  month_to_month: "#B8822A",
  "month-to-month": "#B8822A",
  notice_to_vacate: "#B8822A",
  "notice-to-vacate": "#B8822A",
};

export function FinancialsTab({ commercialUW, propertyFinancials, deal }: FinancialsTabProps) {
  const [showAllUnits, setShowAllUnits] = useState(false);
  const uw = commercialUW?.uw;
  const income = commercialUW?.income ?? [];
  const expenses = commercialUW?.expenses ?? [];
  const rentRoll = commercialUW?.rentRoll ?? [];

  // Property-level financial data
  const propRRUnits = propertyFinancials?.currentRentRollUnits ?? [];
  const propT12LineItems = propertyFinancials?.currentT12LineItems ?? [];

  const propT12Income = useMemo(
    () => propT12LineItems.filter((item: any) => item.is_income && !item.is_excluded),
    [propT12LineItems]
  );
  const propT12Expenses = useMemo(
    () => propT12LineItems.filter((item: any) => !item.is_income && !item.is_excluded),
    [propT12LineItems]
  );

  // Use property-level or deal-level rent roll
  const activeRentRoll = propRRUnits.length > 0 ? propRRUnits : rentRoll;
  const INITIAL_UNITS = 20;
  const visibleUnits = showAllUnits ? activeRentRoll : activeRentRoll.slice(0, INITIAL_UNITS);

  // Compute T12 totals
  const t12Revenue = useMemo(() => {
    if (propT12Income.length > 0) {
      return propT12Income.reduce((sum: number, item: any) => sum + (Number(item.annual_total) || 0), 0);
    }
    return income
      .filter((r: any) => !r.is_deduction)
      .reduce((sum: number, r: any) => sum + n(r.t12_amount), 0);
  }, [propT12Income, income]);

  const t12Expenses = useMemo(() => {
    if (propT12Expenses.length > 0) {
      return propT12Expenses.reduce((sum: number, item: any) => sum + (Number(item.annual_total) || 0), 0);
    }
    return expenses.reduce((sum: number, r: any) => sum + n(r.t12_amount), 0);
  }, [propT12Expenses, expenses]);

  const t12VacancyLoss = useMemo(
    () => income.filter((r: any) => r.is_deduction).reduce((sum: number, r: any) => sum + n(r.t12_amount), 0),
    [income]
  );

  const t12NetRevenue = t12Revenue - t12VacancyLoss;
  const t12NOI = t12NetRevenue - t12Expenses;

  // Borrower PF totals
  const bpfRevenue = useMemo(() =>
    income.filter((r: any) => !r.is_deduction).reduce((sum: number, r: any) => sum + n(r.year_1_amount), 0),
    [income]
  );
  const bpfExpenses = useMemo(() =>
    expenses.reduce((sum: number, r: any) => sum + n(r.year_1_amount), 0),
    [expenses]
  );
  const bpfVacancy = useMemo(() =>
    income.filter((r: any) => r.is_deduction).reduce((sum: number, r: any) => sum + n(r.year_1_amount), 0),
    [income]
  );
  const bpfNetRevenue = bpfRevenue - bpfVacancy;
  const bpfNOI = bpfNetRevenue - bpfExpenses;

  // Debt service computation
  const loanAmt = n(uw?.loan_amount ?? deal.loan_amount);
  const rate = n(uw?.interest_rate ?? deal.interest_rate);
  const annualDS = loanAmt > 0 && rate > 0
    ? loanAmt * (rate > 1 ? rate / 100 : rate)
    : 0;

  const t12DSCR = annualDS > 0 ? t12NOI / annualDS : null;
  const bpfDSCR = annualDS > 0 ? bpfNOI / annualDS : null;

  // Rent roll totals
  const rrTotalCurrent = useMemo(() =>
    activeRentRoll.reduce((sum: number, u: any) => sum + n(u.current_rent ?? u.current_monthly_rent), 0),
    [activeRentRoll]
  );
  const rrTotalMarket = useMemo(() =>
    activeRentRoll.reduce((sum: number, u: any) => sum + n(u.market_rent), 0),
    [activeRentRoll]
  );
  const rrOccupied = useMemo(() =>
    activeRentRoll.filter((u: any) => u.status === "occupied" || !u.is_vacant).length,
    [activeRentRoll]
  );
  const rrVacant = activeRentRoll.length - rrOccupied;
  const occRate = activeRentRoll.length > 0 ? (rrOccupied / activeRentRoll.length * 100).toFixed(0) : "0";

  // Income line items for the table
  interface LineItem { label: string; t12: number; pf?: number; isDeduction?: boolean }

  const incomeLineItems: LineItem[] = useMemo(() => {
    if (propT12Income.length > 0) {
      return propT12Income.map((item: any): LineItem => ({
        label: item.mapped_category
          ? (item.mapped_category as string).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
          : item.original_row_label || "Income",
        t12: Number(item.annual_total) || 0,
        isDeduction: false,
      }));
    }
    return income.map((r: any): LineItem => ({
      label: r.line_item || "Income",
      t12: n(r.t12_amount),
      pf: n(r.year_1_amount),
      isDeduction: r.is_deduction || false,
    }));
  }, [propT12Income, income]);

  const expenseLineItems: LineItem[] = useMemo(() => {
    if (propT12Expenses.length > 0) {
      return propT12Expenses.map((item: any): LineItem => ({
        label: item.mapped_category
          ? (item.mapped_category as string).replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
          : item.original_row_label || "Expense",
        t12: Number(item.annual_total) || 0,
      }));
    }
    return expenses.map((r: any): LineItem => ({
      label: r.line_item || "Expense",
      t12: n(r.t12_amount),
      pf: n(r.year_1_amount),
    }));
  }, [propT12Expenses, expenses]);

  const hasFinancialData = incomeLineItems.length > 0 || expenseLineItems.length > 0;
  const hasRentRoll = activeRentRoll.length > 0;

  return (
    <div className="flex flex-col gap-5">
      {/* ━━━ T12 vs Pro Forma Table ━━━ */}
      <SectionCard title="Income & Expenses" icon={DollarSign}>
        {!hasFinancialData ? (
          <div className="py-8 text-center text-sm" style={{ color: T.text.muted }}>
            No financial data yet. Upload a T12 or enter income/expense data.
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${T.bg.borderSubtle}` }}>
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr style={{ backgroundColor: T.bg.elevated }}>
                  <th className="text-left px-3 py-2.5 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
                    Line Item
                  </th>
                  <th className="text-right px-3 py-2.5 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#B8822A" }}>
                    T12 Actual
                  </th>
                  <th className="text-right px-3 py-2.5 text-[11px] uppercase tracking-wider font-semibold" style={{ color: "#2E6EA6" }}>
                    Borrower PF
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* ── INCOME ── */}
                <tr style={{ backgroundColor: T.bg.elevated + "80" }}>
                  <td colSpan={3} className="px-3 py-1.5 text-[10px] uppercase tracking-[0.06em] font-bold" style={{ color: T.text.muted }}>
                    Income
                  </td>
                </tr>
                {incomeLineItems.map((item, i) => (
                  <tr key={`inc-${i}`} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="px-3 py-2" style={{ color: T.text.primary }}>{item.label}</td>
                    <td className="text-right px-3 py-2 num" style={{ color: item.isDeduction ? T.accent.red : T.text.primary }}>
                      {item.isDeduction ? `(${fmtCurrency(Math.abs(item.t12))})` : fmtCurrency(item.t12)}
                    </td>
                    <td className="text-right px-3 py-2 num" style={{ color: item.isDeduction ? T.accent.red : T.text.primary }}>
                      {item.pf != null
                        ? (item.isDeduction ? `(${fmtCurrency(Math.abs(item.pf))})` : fmtCurrency(item.pf))
                        : "\u2014"}
                    </td>
                  </tr>
                ))}
                {/* Net Revenue row */}
                <tr style={{ borderBottom: `2px solid ${T.bg.border}` }}>
                  <td className="px-3 py-2 font-semibold" style={{ color: T.text.primary }}>Net Revenue</td>
                  <td className="text-right px-3 py-2 num font-semibold" style={{ color: T.text.primary }}>{fmtCurrency(t12NetRevenue)}</td>
                  <td className="text-right px-3 py-2 num font-semibold" style={{ color: T.text.primary }}>{fmtCurrency(bpfNetRevenue)}</td>
                </tr>

                {/* ── EXPENSES ── */}
                <tr style={{ backgroundColor: T.bg.elevated + "80" }}>
                  <td colSpan={3} className="px-3 py-1.5 text-[10px] uppercase tracking-[0.06em] font-bold" style={{ color: T.text.muted }}>
                    Expenses
                  </td>
                </tr>
                {expenseLineItems.map((item, i) => (
                  <tr key={`exp-${i}`} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="px-3 py-2" style={{ color: T.text.primary }}>{item.label}</td>
                    <td className="text-right px-3 py-2 num" style={{ color: T.text.primary }}>{fmtCurrency(item.t12)}</td>
                    <td className="text-right px-3 py-2 num" style={{ color: T.text.primary }}>
                      {item.pf != null ? fmtCurrency(item.pf) : "\u2014"}
                    </td>
                  </tr>
                ))}
                {/* Total Expenses row */}
                <tr style={{ borderBottom: `2px solid ${T.bg.border}` }}>
                  <td className="px-3 py-2 font-semibold" style={{ color: T.text.primary }}>Total Expenses</td>
                  <td className="text-right px-3 py-2 num font-semibold" style={{ color: T.text.primary }}>{fmtCurrency(t12Expenses)}</td>
                  <td className="text-right px-3 py-2 num font-semibold" style={{ color: T.text.primary }}>{fmtCurrency(bpfExpenses)}</td>
                </tr>

                {/* ── RETURNS ── */}
                <tr style={{ backgroundColor: T.bg.elevated + "80" }}>
                  <td colSpan={3} className="px-3 py-1.5 text-[10px] uppercase tracking-[0.06em] font-bold" style={{ color: T.text.muted }}>
                    Returns
                  </td>
                </tr>
                <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}`, backgroundColor: "rgba(27,122,68,0.06)" }}>
                  <td className="px-3 py-2 font-bold" style={{ color: T.text.primary }}>NOI</td>
                  <td className="text-right px-3 py-2 num font-bold" style={{ color: "#1B7A44" }}>{fmtCurrency(t12NOI)}</td>
                  <td className="text-right px-3 py-2 num font-bold" style={{ color: "#1B7A44" }}>{fmtCurrency(bpfNOI)}</td>
                </tr>
                {annualDS > 0 && (
                  <tr style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                    <td className="px-3 py-2" style={{ color: T.text.primary }}>Annual Debt Service</td>
                    <td className="text-right px-3 py-2 num" style={{ color: T.accent.red }}>{fmtNeg(-annualDS)}</td>
                    <td className="text-right px-3 py-2 num" style={{ color: T.accent.red }}>{fmtNeg(-annualDS)}</td>
                  </tr>
                )}
                <tr>
                  <td className="px-3 py-2 font-bold" style={{ color: T.text.primary }}>DSCR</td>
                  <td className="text-right px-3 py-2 num font-bold" style={{ color: dscrColor(t12DSCR) ?? T.text.primary }}>
                    {t12DSCR != null ? `${t12DSCR.toFixed(2)}x` : "\u2014"}
                  </td>
                  <td className="text-right px-3 py-2 num font-bold" style={{ color: dscrColor(bpfDSCR) ?? T.text.primary }}>
                    {bpfDSCR != null ? `${bpfDSCR.toFixed(2)}x` : "\u2014"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* ━━━ Rent Roll ━━━ */}
      <SectionCard title={`Rent Roll (${activeRentRoll.length} units)`} icon={Home}>
        {!hasRentRoll ? (
          <div className="py-8 text-center text-sm" style={{ color: T.text.muted }}>
            No rent roll data yet.
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${T.bg.borderSubtle}` }}>
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr style={{ backgroundColor: T.bg.elevated }}>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Unit</th>
                    <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Bd/Ba</th>
                    <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>SF</th>
                    <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Current Rent</th>
                    <th className="text-right px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Market Rent</th>
                    <th className="text-center px-3 py-2 text-[11px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUnits.map((u: any, i: number) => {
                    const status = u.status || (u.is_vacant ? "vacant" : "occupied");
                    const statusColor = STATUS_COLORS[status] ?? T.text.muted;
                    const currentRent = n(u.current_rent ?? u.current_monthly_rent);
                    const marketRent = n(u.market_rent);
                    return (
                      <tr key={u.id || i} style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
                        <td className="px-3 py-2 font-medium" style={{ color: T.text.primary }}>
                          {u.unit_number ?? u.unit ?? `Unit ${i + 1}`}
                        </td>
                        <td className="px-3 py-2" style={{ color: T.text.secondary }}>
                          {u.bedrooms != null || u.bathrooms != null
                            ? `${u.bedrooms ?? "—"}/${u.bathrooms ?? "—"}`
                            : u.bdba ?? "\u2014"}
                        </td>
                        <td className="text-right px-3 py-2 num" style={{ color: T.text.primary }}>
                          {u.square_feet ?? u.sf ? Number(u.square_feet ?? u.sf).toLocaleString() : "\u2014"}
                        </td>
                        <td className="text-right px-3 py-2 num" style={{ color: T.text.primary }}>
                          {currentRent > 0 ? fmtCurrency(currentRent) : "\u2014"}
                        </td>
                        <td className="text-right px-3 py-2 num" style={{ color: T.text.primary }}>
                          {marketRent > 0 ? fmtCurrency(marketRent) : "\u2014"}
                        </td>
                        <td className="text-center px-3 py-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase"
                            style={{ backgroundColor: statusColor + "14", color: statusColor }}
                          >
                            <span className="inline-block h-[5px] w-[5px] rounded-full" style={{ backgroundColor: statusColor }} />
                            {status.replace(/_/g, " ")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Show more / summary bar */}
            {activeRentRoll.length > INITIAL_UNITS && !showAllUnits && (
              <button
                onClick={() => setShowAllUnits(true)}
                className="mt-2 text-[12px] font-medium cursor-pointer bg-transparent border-0"
                style={{ color: T.accent.blue }}
              >
                View all {activeRentRoll.length} units &rarr;
              </button>
            )}

            {/* Summary bar */}
            <div
              className="mt-3 flex flex-wrap gap-4 rounded-lg px-4 py-3"
              style={{ backgroundColor: T.bg.elevated, border: `1px solid ${T.bg.borderSubtle}` }}
            >
              <SummaryItem label="Total Units" value={`${activeRentRoll.length}`} />
              <SummaryItem label="Occupied" value={`${rrOccupied}`} />
              <SummaryItem label="Vacant" value={`${rrVacant}`} />
              <SummaryItem label="Occ. Rate" value={`${occRate}%`} />
              <SummaryItem label="Current GPR" value={fmtCurrency(rrTotalCurrent * 12)} />
              <SummaryItem label="Market GPR" value={fmtCurrency(rrTotalMarket * 12)} />
              <SummaryItem
                label="Upside"
                value={fmtCurrency((rrTotalMarket - rrTotalCurrent) * 12)}
                highlight={rrTotalMarket > rrTotalCurrent}
              />
            </div>
          </>
        )}
      </SectionCard>

      {/* ━━━ Exit / Return Assumptions ━━━ */}
      <SectionCard title="Exit / Return Assumptions" icon={Settings2}>
        <div className="grid grid-cols-2 gap-x-8">
          <FieldRow label="Exit Cap Rate" value={fP(uw?.exit_cap_rate ?? deal.exit_cap_rate)} mono />
          <FieldRow
            label="Hold Period"
            value={
              (uw?.hold_period_years ?? deal.hold_period_months)
                ? `${uw?.hold_period_years ? uw.hold_period_years + " yr" : deal.hold_period_months + " mo"}`
                : null
            }
            mono
          />
          <FieldRow label="Sale Costs %" value={fP(uw?.sale_costs_pct ?? deal.sale_costs_pct)} mono />
          <FieldRow label="Disposition Fee %" value={fP(uw?.disposition_fee_pct ?? deal.disposition_fee_pct)} mono />
        </div>
      </SectionCard>
    </div>
  );
}

function SummaryItem({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: T.text.muted }}>
        {label}
      </div>
      <div className="text-sm font-semibold num" style={{ color: highlight ? "#1B7A44" : T.text.primary }}>
        {value}
      </div>
    </div>
  );
}
