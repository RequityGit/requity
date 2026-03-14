"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  n,
  calcMaxLoanFromDSCR,
  parseTranche,
  findTranche,
  fmtCurrency,
  fmtPct,
  fmtX,
} from "../tabs/sources-uses/su-calculations";
import type { DebtTranche } from "../tabs/sources-uses/su-types";
import { calcIRR, calcRemainingBalance } from "@/lib/commercial-uw/calculator";

// ── Formatting ──

function fmtDollar(v: number): string {
  return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtDollarSigned(v: number): string {
  if (v >= 0) return `$${v.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  return `($${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`;
}

// ── Types ──

type ExpenseMetric = "none" | "per_unit" | "per_sf";

type CellNoteData = { text: string; by?: string; date?: string };

interface IncomeRow {
  label: string;
  t12: number;
  year1: number;
  growthRate: number;
  isDeduction: boolean;
}

interface ExpenseRow {
  label: string;
  t12: number;
  year1: number;
  growthRate: number;
  isPctOfEgi: boolean;
  pctOfEgi?: number;
  defaultBasis?: string;
  defaultRate?: string;
  overridden?: boolean;
  cellNotes?: Record<number, CellNoteData>;
}

interface FinFlows {
  proceeds: number[];
  intPmts: number[];
  prinPmts: number[];
  prinAtSale: number[];
  net: number[];
}

export interface ProFormaSectionProps {
  uw: Record<string, unknown>;
  income: Record<string, unknown>[];
  expenses: Record<string, unknown>[];
  debt: Record<string, unknown>[];
  sourcesUses: Record<string, unknown>[];
  scopeOfWork: Record<string, unknown>[];
  purchasePrice: number;
  numUnits: number;
  holdYears?: number;
  exitCapRate?: number;
}

// ── Data Parsing ──

function parseIncome(raw: Record<string, unknown>[]): IncomeRow[] {
  return raw.map((r) => ({
    label: String(r.line_item ?? r.label ?? "Income"),
    t12: n(r.t12_amount ?? r.t12),
    year1: n(r.year_1_amount ?? r.year1),
    growthRate: n(r.growth_rate ?? r.growthRate),
    isDeduction: Boolean(r.is_deduction ?? r.isDeduction),
  }));
}

function parseExpenses(raw: Record<string, unknown>[]): ExpenseRow[] {
  return raw.map((r) => ({
    label: String(r.category ?? r.label ?? "Expense"),
    t12: n(r.t12_amount ?? r.t12),
    year1: n(r.year_1_amount ?? r.year1),
    growthRate: n(r.growth_rate ?? r.growthRate),
    isPctOfEgi: Boolean(r.is_percentage ?? r.isPctOfEgi),
    pctOfEgi: r.is_percentage ? n(r.year_1_amount ?? r.pctOfEgi) * 100 : undefined,
    defaultBasis: r.default_basis as string | undefined,
    defaultRate: r.default_rate as string | undefined,
    overridden: Boolean(r.overridden),
    cellNotes: r.cellNotes as Record<number, CellNoteData> | undefined,
  }));
}

// ── Growth Assumptions defaults ──

const DEFAULT_INCOME_GROWTH = 0.03;
const DEFAULT_EXPENSE_GROWTH = 0.03;
const DEFAULT_VACANCY = [0.05, 0.04, 0.04, 0.04, 0.04];
const DEFAULT_CREDIT_LOSS = [0.02, 0.015, 0.01, 0.01, 0.01];
const DISPOSITION_COST_PCT = 0.03;

// ── Main Component ──

export function ProFormaSection({
  uw,
  income: rawIncome,
  expenses: rawExpenses,
  debt: rawDebt,
  sourcesUses,
  scopeOfWork,
  purchasePrice,
  numUnits,
  holdYears: holdYearsProp,
  exitCapRate: exitCapRateProp,
}: ProFormaSectionProps) {
  const holdYears = holdYearsProp ?? 5;
  const colCount = holdYears + 2; // T-12, Year 0, Year 1..N
  const cols = useMemo(() => {
    const c = ["T-12", "Year 0"];
    for (let i = 1; i <= holdYears; i++) c.push(`Year ${i}`);
    return c;
  }, [holdYears]);
  const YR0 = 1;

  const [expMetric, setExpMetric] = useState<ExpenseMetric>("none");
  const [mgmtFeePct, setMgmtFeePct] = useState(6.0);

  // Parse structured data
  const incomeRows = useMemo(() => parseIncome(rawIncome), [rawIncome]);
  const expenseRows = useMemo(() => parseExpenses(rawExpenses), [rawExpenses]);

  // Parse debt tranches
  const seniorRaw = findTranche(rawDebt, "senior");
  const mezzRaw = findTranche(rawDebt, "mezz");
  const takeoutRaw = findTranche(rawDebt, "takeout");

  const senior: DebtTranche | null = seniorRaw ? parseTranche(seniorRaw, "senior") : null;
  const mezz: DebtTranche | null = mezzRaw ? parseTranche(mezzRaw, "mezz") : null;
  const takeout: DebtTranche | null = takeoutRaw ? parseTranche(takeoutRaw, "takeout") : null;

  // Closing costs, reserves, budget from uw/sourcesUses
  const totalClosingCosts = useMemo(
    () => sourcesUses.filter((s) => String(s.type) === "closing_cost").reduce((sum, s) => sum + n(s.amount), 0)
      || n(uw.closing_costs),
    [sourcesUses, uw]
  );
  const totalReserves = useMemo(
    () => sourcesUses.filter((s) => String(s.type) === "reserve").reduce((sum, s) => sum + n(s.amount), 0)
      || n(uw.reserves),
    [sourcesUses, uw]
  );
  const totalBudget = useMemo(
    () => scopeOfWork.reduce((sum, s) => sum + n(s.estimated_cost ?? (n(s.qty) * n(s.unit_cost))), 0),
    [scopeOfWork]
  );

  const exitCapRate = exitCapRateProp ?? (n(uw.exit_cap_rate) || 5.5);
  const totalSf = n(uw.total_sf) || numUnits * 800;

  // ── Revenue Projections ──
  const revenueProjection = useMemo(() => {
    const positiveIncome = incomeRows.filter((r) => !r.isDeduction);
    const deductions = incomeRows.filter((r) => r.isDeduction);

    const gprRow = positiveIncome.find((r) => /rent|gpr/i.test(r.label));
    const otherIncome = positiveIncome.filter((r) => r !== gprRow);
    const vacancyRow = deductions.find((r) => /vacancy/i.test(r.label));
    const creditLossRow = deductions.find((r) => /credit|loss|bad debt/i.test(r.label));

    const gprT12 = gprRow?.t12 ?? 0;
    const gprYr1 = gprRow?.year1 ?? gprT12;
    const gprGrowth = gprRow?.growthRate ?? DEFAULT_INCOME_GROWTH;

    const otherT12 = otherIncome.reduce((s, r) => s + r.t12, 0);
    const otherYr1 = otherIncome.reduce((s, r) => s + (r.year1 || r.t12), 0);
    const otherGrowth = otherIncome[0]?.growthRate ?? DEFAULT_INCOME_GROWTH;

    const vacT12 = vacancyRow ? Math.abs(vacancyRow.t12) : 0;
    const creditT12 = creditLossRow ? Math.abs(creditLossRow.t12) : 0;

    const gpr: number[] = [gprT12, 0];
    const other: number[] = [otherT12, 0];
    const vacancy: number[] = [vacT12, 0];
    const creditLoss: number[] = [creditT12, 0];
    const egi: number[] = [];

    for (let yr = 1; yr <= holdYears; yr++) {
      const g = yr === 1 ? gprYr1 : gpr[yr] * (1 + gprGrowth);
      gpr.push(Math.round(g));
      const o = yr === 1 ? otherYr1 : other[yr] * (1 + otherGrowth);
      other.push(Math.round(o));
      const totalGross = gpr[yr + 1] + other[yr + 1];
      const vacPct = DEFAULT_VACANCY[yr - 1] ?? 0.04;
      const creditPct = DEFAULT_CREDIT_LOSS[yr - 1] ?? 0.01;
      vacancy.push(Math.round(totalGross * vacPct));
      creditLoss.push(Math.round(totalGross * creditPct));
    }

    for (let i = 0; i < colCount; i++) {
      if (i === YR0) {
        egi.push(0);
      } else {
        egi.push(gpr[i] + other[i] - vacancy[i] - creditLoss[i]);
      }
    }

    return { gpr, other, vacancy, creditLoss, egi };
  }, [incomeRows, holdYears, colCount]);

  // ── Expense Projections ──
  const expenseProjection = useMemo(() => {
    const mgmtRow = expenseRows.find((r) => r.isPctOfEgi || /management|mgmt/i.test(r.label));
    const nonMgmt = expenseRows.filter((r) => r !== mgmtRow);

    const rowProjections = nonMgmt.map((exp) => {
      const vals: number[] = [exp.t12, 0];
      for (let yr = 1; yr <= holdYears; yr++) {
        const growth = exp.growthRate || DEFAULT_EXPENSE_GROWTH;
        const base = yr === 1 ? (exp.year1 || exp.t12) : vals[yr] * (1 + growth);
        vals.push(Math.round(base));
      }
      return { label: exp.label, vals, exp };
    });

    const mgmtFeeValues = cols.map((_, i) => {
      if (i === 0) return mgmtRow?.t12 ?? 0;
      if (i === YR0) return 0;
      return Math.round(revenueProjection.egi[i] * mgmtFeePct / 100);
    });

    const totalExpByCol = cols.map((_, i) => {
      if (i === YR0) return 0;
      return mgmtFeeValues[i] + rowProjections.reduce((s, r) => s + r.vals[i], 0);
    });

    return { mgmtRow, nonMgmt: rowProjections, mgmtFeeValues, totalExpByCol };
  }, [expenseRows, holdYears, cols, revenueProjection.egi, mgmtFeePct]);

  // ── NOI ──
  const noiValues = useMemo(
    () => revenueProjection.egi.map((egi, i) => (i === YR0 ? 0 : egi - expenseProjection.totalExpByCol[i])),
    [revenueProjection.egi, expenseProjection.totalExpByCol]
  );

  // ── Acquisition ──
  const seniorLoan = senior ? Math.round(purchasePrice * senior.ltv_pct / 100) : 0;
  const seniorOrigFee = senior ? Math.round(seniorLoan * senior.origination_fee_pct / 100) : 0;
  const mezzLoan = mezz ? Math.round(purchasePrice * mezz.ltv_pct / 100) : 0;
  const totalAcquisition = purchasePrice + totalClosingCosts + totalReserves + totalBudget + seniorOrigFee;

  // ── Financing ──
  const seniorRate = senior?.interest_rate ?? 0;
  const seniorIO = senior?.is_io ?? true;
  const seniorTerm = senior?.term_years ?? 5;
  const seniorAmort = senior?.amortization_years ?? 30;
  const seniorInterest = Math.round(seniorLoan * seniorRate / 100);
  const seniorMonthlyRate = seniorRate / 100 / 12;
  const seniorMonthlyPmt = seniorIO || seniorMonthlyRate === 0
    ? 0
    : seniorLoan * (seniorMonthlyRate * Math.pow(1 + seniorMonthlyRate, seniorAmort * 12)) / (Math.pow(1 + seniorMonthlyRate, seniorAmort * 12) - 1);
  const seniorAnnualPrincipal = seniorIO ? 0 : Math.round(seniorMonthlyPmt * 12 - seniorInterest);
  const seniorBalanceAtSale = seniorIO ? seniorLoan : Math.max(0, seniorLoan - seniorAnnualPrincipal * seniorTerm);

  const mezzRate = mezz?.interest_rate ?? 0;
  const mezzIO = mezz?.is_io ?? true;
  const mezzInterest = Math.round(mezzLoan * mezzRate / 100);
  const mezzAnnualPrincipal = mezzIO ? 0 : Math.round(mezzLoan / seniorTerm);
  const mezzBalanceAtSale = mezzIO ? mezzLoan : Math.max(0, mezzLoan - mezzAnnualPrincipal * seniorTerm);

  const totalLoanProceeds = seniorLoan + mezzLoan;
  const equityInvested = Math.max(0, totalAcquisition - totalLoanProceeds);

  // ── Exit ──
  const stabilizedNOI = noiValues[colCount - 1] ?? 0;
  const grossSalePrice = exitCapRate > 0 ? Math.round(stabilizedNOI / (exitCapRate / 100)) : 0;
  const dispositionCosts = Math.round(grossSalePrice * DISPOSITION_COST_PCT);
  const netSaleProceeds = grossSalePrice - dispositionCosts;

  // ── Takeout ──
  const takeoutEnabled = takeout !== null;
  const takeoutYear = takeout?.takeout_year ?? 2;
  const takeoutColIdx = takeoutYear + 1;
  const takeoutNOI = noiValues[Math.min(takeoutYear + 1, noiValues.length - 1)] ?? noiValues[noiValues.length - 1] ?? 0;
  const takeoutAppraised = exitCapRate > 0 ? Math.round(takeoutNOI / (exitCapRate / 100)) : 0;
  const takeoutMaxLTV = takeout ? Math.round(takeoutAppraised * takeout.max_ltv_constraint / 100) : 0;
  const takeoutDSCRMax = takeout
    ? calcMaxLoanFromDSCR(takeoutNOI, takeout.dscr_floor_constraint, takeout.interest_rate, takeout.amortization_years)
    : 0;
  const takeoutLoanAmt = takeoutEnabled ? Math.min(takeoutMaxLTV, takeoutDSCRMax) : 0;
  const takeoutCostPct = 1.25;
  const takeoutCost = Math.round(takeoutLoanAmt * takeoutCostPct / 100);
  const takeoutInterest = takeout ? Math.round(takeoutLoanAmt * takeout.interest_rate / 100) : 0;

  // ── Build financing flows ──
  function buildFinancingRow(
    loanAmt: number, interest: number, principal: number, balanceAtSale: number,
  ): FinFlows {
    const exitIdx = colCount - 1;
    const proceeds = cols.map((_, i) => i === YR0 ? loanAmt : 0);
    const intPmts = cols.map((_, i) => (i <= YR0 || i === 0) ? 0 : -interest);
    const prinPmts = cols.map((_, i) => (i <= YR0 || i === 0) ? 0 : -principal);
    const prinAtSale = cols.map((_, i) => i === exitIdx ? -balanceAtSale : 0);
    const net = cols.map((_, i) => proceeds[i] + intPmts[i] + prinPmts[i] + prinAtSale[i]);
    return { proceeds, intPmts, prinPmts, prinAtSale, net };
  }

  const seniorFlows = buildFinancingRow(seniorLoan, seniorInterest, seniorAnnualPrincipal, seniorBalanceAtSale);
  const mezzFlows = buildFinancingRow(mezzLoan, mezzInterest, mezzAnnualPrincipal, mezzBalanceAtSale);

  const takeoutFlows = cols.map((_, i) => {
    if (!takeoutEnabled) return 0;
    if (i === takeoutColIdx) return takeoutLoanAmt - takeoutCost - seniorBalanceAtSale - mezzBalanceAtSale;
    if (i > takeoutColIdx && i <= colCount - 1) return -takeoutInterest;
    return 0;
  });

  const seniorFlowsAdj = takeoutEnabled
    ? { ...seniorFlows, net: seniorFlows.net.map((v, i) => i > takeoutColIdx ? 0 : v) }
    : seniorFlows;
  const mezzFlowsAdj = takeoutEnabled
    ? { ...mezzFlows, net: mezzFlows.net.map((v, i) => i > takeoutColIdx ? 0 : v) }
    : mezzFlows;

  const totalFinancing = cols.map((_, i) => seniorFlowsAdj.net[i] + mezzFlowsAdj.net[i] + takeoutFlows[i]);

  // ── Cash Flows ──
  const exitIdx = colCount - 1;
  const unleveredCF = noiValues.map((noi, i) => {
    if (i === YR0) return -totalAcquisition;
    if (i === exitIdx) return noi + netSaleProceeds;
    return noi;
  });
  const leveredCF = unleveredCF.map((ucf, i) => ucf + totalFinancing[i]);

  // ── Returns ──
  const returns = useMemo(() => {
    if (equityInvested <= 0) return { irr: null, equityMultiple: null, cashOnCash: [] as number[] };

    const cashFlows = leveredCF.filter((_, i) => i >= YR0);
    let irr: number | null = null;
    try {
      const computed = calcIRR(cashFlows);
      irr = isFinite(computed) ? computed : null;
    } catch {
      irr = null;
    }

    const totalDist = cashFlows.slice(1).reduce((s, v) => s + v, 0);
    const equityMultiple = totalDist / equityInvested;

    const cashOnCash = cashFlows.slice(1).map((cf) => (cf / equityInvested) * 100);

    return { irr, equityMultiple, cashOnCash };
  }, [leveredCF, equityInvested]);

  const goingInCap = purchasePrice > 0 && noiValues[0] > 0
    ? ((noiValues[0] / purchasePrice) * 100).toFixed(2) + "%"
    : "";

  // ── Metric helpers for expense comparison ──
  function fmtMetric(val: number, metric: ExpenseMetric): string {
    if (metric === "per_unit") return `$${Math.round(val / (numUnits || 1)).toLocaleString()}`;
    if (metric === "per_sf") return `$${(val / (totalSf || 1)).toFixed(2)}`;
    return "";
  }

  const fmtFlow = (arr: number[]) => arr.slice(1).map((v) => (v === 0 ? "" : fmtDollarSigned(v)));

  return (
    <div className="px-1 pb-2">
      {/* Column headers */}
      <div className="flex items-center py-2.5 px-4 border-b border-border/50">
        <div className="w-[240px] shrink-0">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Cash Flow Projections
          </div>
        </div>
        {cols.map((c, i) => (
          <div
            key={c}
            className={cn(
              "flex-1 text-right text-[10px] font-semibold uppercase tracking-wider px-3",
              i === 0
                ? "text-muted-foreground"
                : i === YR0
                  ? "text-muted-foreground/80"
                  : "text-foreground/70"
            )}
          >
            {c}
          </div>
        ))}
      </div>

      {/* Growth rate assumptions */}
      <div className="bg-muted/20 border-b border-border/30">
        {[
          {
            label: "Income Growth",
            vals: cols.map((_, i) =>
              i <= YR0 ? "" : `${((incomeRows[0]?.growthRate || DEFAULT_INCOME_GROWTH) * 100).toFixed(1)}%`
            ),
          },
          {
            label: "Expense Growth",
            vals: cols.map((_, i) =>
              i <= YR0 ? "" : `${((expenseRows[0]?.growthRate || DEFAULT_EXPENSE_GROWTH) * 100).toFixed(1)}%`
            ),
          },
          {
            label: "Vacancy",
            vals: cols.map((_, i) =>
              i <= YR0 ? "" : `${((DEFAULT_VACANCY[i - 2] ?? 0.04) * 100).toFixed(1)}%`
            ),
          },
          {
            label: "Credit Loss",
            vals: cols.map((_, i) =>
              i <= YR0 ? "" : `${((DEFAULT_CREDIT_LOSS[i - 2] ?? 0.01) * 100).toFixed(1)}%`
            ),
          },
        ].map((row) => (
          <div key={row.label} className="flex items-center py-[3px] px-4">
            <div className="w-[240px] shrink-0 text-[10px] text-muted-foreground font-medium">
              {row.label}
            </div>
            {row.vals.map((v, i) => (
              <div key={i} className="flex-1 text-right px-3">
                {v ? (
                  <span className="text-[10px] num font-semibold text-foreground/70 border-b border-dashed border-primary/25 cursor-text">
                    {v}
                  </span>
                ) : (
                  <span className="text-transparent text-[10px]">-</span>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Revenue */}
      <PFSectionHeader title="Revenue" />
      <div className="flex flex-col">
        <PFRow
          label="Gross Potential Rent"
          t12={fmtDollar(revenueProjection.gpr[0])}
          vals={revenueProjection.gpr.slice(1).map((v, i) => (i === 0 ? "-" : fmtDollar(v)))}
          yr0={YR0}
        />
        <PFRow
          label="Other Income"
          t12={fmtDollar(revenueProjection.other[0])}
          vals={revenueProjection.other.slice(1).map((v, i) => (i === 0 ? "-" : fmtDollar(v)))}
          yr0={YR0}
        />
        <PFRow
          label="Less: Vacancy"
          t12={fmtDollarSigned(-revenueProjection.vacancy[0])}
          vals={revenueProjection.vacancy.slice(1).map((v, i) => (i === 0 ? "-" : fmtDollarSigned(-v)))}
          yr0={YR0}
          negative
        />
        <PFRow
          label="Less: Credit Loss"
          t12={fmtDollarSigned(-revenueProjection.creditLoss[0])}
          vals={revenueProjection.creditLoss.slice(1).map((v, i) => (i === 0 ? "-" : fmtDollarSigned(-v)))}
          yr0={YR0}
          negative
        />
        <PFTotalRow
          label="Effective Gross Income"
          vals={revenueProjection.egi.map((v, i) => (i === YR0 ? "-" : fmtDollar(v)))}
          yr0={YR0}
        />
      </div>

      {/* Operating Expenses */}
      <div className="mt-1">
        <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
            Operating Expenses
          </span>
          <div className="flex-1 h-px bg-border/40" />
          <div className="inline-flex gap-0.5 rounded-md p-[2px] bg-muted">
            {([
              { key: "none" as const, label: "$" },
              { key: "per_unit" as const, label: "$/Unit" },
              { key: "per_sf" as const, label: "$/SF" },
            ]).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setExpMetric(expMetric === opt.key ? "none" : opt.key)}
                className={cn(
                  "rounded px-2 py-0.5 text-[9px] font-semibold cursor-pointer transition-all",
                  expMetric === opt.key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col">
          {/* Management fee row */}
          {expenseProjection.mgmtRow && (
            <div className="flex items-center py-[6px] px-4 rounded-md hover:bg-muted/40 transition-colors group">
              <div className="w-[240px] shrink-0 flex items-center gap-1.5">
                <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                  {expenseProjection.mgmtRow.label}
                </span>
                <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-[1px] border border-border/40">
                  <input
                    type="text"
                    value={mgmtFeePct.toFixed(1)}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      if (!isNaN(v) && v >= 0 && v <= 100) setMgmtFeePct(v);
                    }}
                    className="w-[28px] bg-transparent text-[10px] num font-semibold text-foreground text-right outline-none border-b border-dashed border-primary/30 focus:border-primary"
                  />
                  <span className="text-[9px] text-muted-foreground">% EGI</span>
                </span>
              </div>
              {expenseProjection.mgmtFeeValues.map((v, i) => (
                <div key={i} className="flex-1 text-right px-3">
                  {i === YR0 ? (
                    <div className="text-[12px] num text-muted-foreground/30">-</div>
                  ) : (
                    <>
                      <div className={cn(
                        "text-[12px] num font-medium",
                        i === 0 ? "text-foreground/60" : "text-foreground/80"
                      )}>
                        {fmtDollar(v)}
                      </div>
                      {expMetric !== "none" && (
                        <div className="text-[9px] num mt-px text-muted-foreground/50">
                          {fmtMetric(v, expMetric)}{expMetric === "per_unit" ? "/u" : "/sf"}
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Non-mgmt expense rows */}
          {expenseProjection.nonMgmt.map(({ label, vals, exp }) => (
            <div key={label} className="flex items-center py-[6px] px-4 rounded-md hover:bg-muted/40 transition-colors group">
              <div className="w-[240px] shrink-0 flex items-center gap-1.5">
                <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
                  {label}
                </span>
              </div>
              <div className="flex-1 text-right px-3 relative">
                {exp.cellNotes?.[0] && <CellNote note={exp.cellNotes[0].text} by={exp.cellNotes[0].by} date={exp.cellNotes[0].date} />}
                <div className="text-[12px] num text-foreground/60">{fmtDollar(vals[0])}</div>
                {expMetric !== "none" && (
                  <div className="text-[9px] num mt-px text-muted-foreground/50">
                    {fmtMetric(vals[0], expMetric)}{expMetric === "per_unit" ? "/u" : "/sf"}
                  </div>
                )}
              </div>
              {vals.slice(1).map((v, i) => {
                const colIdx = i + 1;
                const isYr0Col = i === 0;
                const cellNote = exp.cellNotes?.[colIdx];
                if (isYr0Col) {
                  return (
                    <div key={i} className="flex-1 text-right px-3 text-muted-foreground/30 text-[12px] num">
                      -
                    </div>
                  );
                }
                return (
                  <div key={i} className="flex-1 text-right px-3 group/cell relative">
                    {cellNote && <CellNote note={cellNote.text} by={cellNote.by} date={cellNote.date} />}
                    <div className={cn(
                      "text-[12px] num font-medium inline-block",
                      i === 1 && !exp.overridden
                        ? "text-foreground border-b border-dashed border-primary/30 cursor-text"
                        : i === 1 && exp.overridden
                          ? "text-foreground border-b border-dashed border-amber-400/60 cursor-text"
                          : "text-foreground/80"
                    )}>
                      {fmtDollar(v)}
                    </div>
                    {expMetric !== "none" && (
                      <div className="text-[9px] num mt-px text-muted-foreground">
                        {fmtMetric(v, expMetric)}{expMetric === "per_unit" ? "/u" : "/sf"}
                      </div>
                    )}
                    {i === 1 && exp.overridden && (
                      <div className="text-[8px] text-amber-500/70 mt-px">override</div>
                    )}
                    {i === 1 && !exp.overridden && exp.defaultRate && (
                      <div className="text-[8px] text-muted-foreground/40 mt-px hidden group-hover/cell:block">
                        {exp.defaultRate} {exp.defaultBasis}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Total expenses */}
          <div className="flex items-center py-[7px] px-4 mt-0.5 border-t border-border/40">
            <div className="w-[240px] shrink-0 text-[12px] font-semibold text-foreground">Total Expenses</div>
            {expenseProjection.totalExpByCol.map((v, i) => (
              <div key={i} className="flex-1 text-right px-3">
                {i === YR0 ? (
                  <div className="text-[12px] num text-muted-foreground/30">-</div>
                ) : (
                  <>
                    <div className={cn(
                      "text-[12px] font-semibold num",
                      i === 0 ? "text-foreground/60" : "text-foreground"
                    )}>
                      {fmtDollar(v)}
                    </div>
                    {expMetric !== "none" && (
                      <div className="text-[9px] font-semibold num text-muted-foreground mt-px">
                        {fmtMetric(v, expMetric)}{expMetric === "per_unit" ? "/u" : "/sf"}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* NOI highlight */}
      <CashFlowHighlight label="Net Operating Income" values={noiValues} color="emerald" />

      {/* Acquisition Costs */}
      <PFSectionHeader title="Acquisition Costs" />
      <div className="flex flex-col">
        <PFRow label="Purchase Price" t12="" vals={[fmtDollarSigned(-purchasePrice), ...Array(holdYears).fill("")]} yr0={YR0} negative />
        <PFRow label="Closing Costs" t12="" vals={[fmtDollarSigned(-totalClosingCosts), ...Array(holdYears).fill("")]} yr0={YR0} negative />
        {seniorOrigFee > 0 && (
          <PFRow label="Origination Fee" t12="" vals={[fmtDollarSigned(-seniorOrigFee), ...Array(holdYears).fill("")]} yr0={YR0} negative />
        )}
        {totalReserves > 0 && (
          <PFRow label="Total Reserves" t12="" vals={[fmtDollarSigned(-totalReserves), ...Array(holdYears).fill("")]} yr0={YR0} negative />
        )}
        {totalBudget > 0 && (
          <PFRow label="Improvement Budget" t12="" vals={[fmtDollarSigned(-totalBudget), ...Array(holdYears).fill("")]} yr0={YR0} negative />
        )}
        <PFTotalRow
          label="Total Acquisition Costs"
          vals={["-", fmtDollarSigned(-totalAcquisition), ...Array(holdYears).fill("")]}
          yr0={YR0}
        />
      </div>

      {/* Final Sale */}
      <PFSectionHeader title="Final Sale" />
      <div className="flex flex-col">
        <PFRow
          label="Gross Sale Proceeds"
          t12=""
          vals={[...Array(holdYears).fill(""), fmtDollar(grossSalePrice)]}
          yr0={YR0}
          labelExtra={
            <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-[1px] border border-border/40 ml-1.5">
              <span className="text-[9px] text-muted-foreground">@</span>
              <span className="w-[34px] text-[10px] num font-semibold text-foreground text-right">
                {exitCapRate.toFixed(2)}
              </span>
              <span className="text-[9px] text-muted-foreground">% cap</span>
            </span>
          }
        />
        <PFRow
          label={`Less: Transaction Costs (${(DISPOSITION_COST_PCT * 100).toFixed(1)}%)`}
          t12=""
          vals={[...Array(holdYears).fill(""), fmtDollarSigned(-dispositionCosts)]}
          yr0={YR0}
          negative
        />
        <PFTotalRow
          label="Net Sale Proceeds"
          vals={["-", ...Array(holdYears).fill(""), fmtDollar(netSaleProceeds)]}
          yr0={YR0}
        />
      </div>

      {/* Unlevered Cash Flow */}
      <CashFlowHighlight label="Unlevered Net Cash Flow" values={unleveredCF} color="blue" />

      {/* Senior Financing */}
      {seniorLoan > 0 && (
        <FinancingSection
          title="Acquisition Financing"
          loanLabel={fmtDollar(seniorLoan)}
          ltvDisplay={`${(senior?.ltv_pct ?? 0).toFixed(1)}% LTV`}
          rateDisplay={`${seniorRate.toFixed(2)}%`}
          isIO={seniorIO}
          flows={seniorFlowsAdj}
          cols={cols}
          yr0={YR0}
        />
      )}

      {/* Mezz Financing */}
      {mezzLoan > 0 && (
        <FinancingSection
          title="Mezz. Financing"
          loanLabel={fmtDollar(mezzLoan)}
          ltvDisplay={`${(mezz?.ltv_pct ?? 0).toFixed(1)}% LTV`}
          rateDisplay={`${mezzRate.toFixed(2)}%`}
          isIO={mezzIO}
          flows={mezzFlowsAdj}
          cols={cols}
          yr0={YR0}
        />
      )}

      {/* Takeout Financing */}
      {takeoutEnabled && takeoutLoanAmt > 0 && (
        <div className="mt-1">
          <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Takeout Financing (Year {takeoutYear})
            </span>
            <div className="flex-1 h-px bg-border/40" />
            <span className="text-[9px] font-semibold text-primary bg-primary/10 border border-primary/30 rounded px-2 py-0.5">
              {fmtDollar(takeoutLoanAmt)}
            </span>
          </div>
          <div className="flex flex-col">
            <PFRow
              label="Takeout Proceeds"
              t12=""
              vals={takeoutFlows.slice(1).map((v) => (v > 0 ? fmtDollar(v) : ""))}
              yr0={YR0}
            />
            <PFRow
              label="Senior Payoff"
              t12=""
              vals={cols.slice(1).map((_, i) => (i + 1 === takeoutColIdx ? fmtDollarSigned(-seniorBalanceAtSale) : ""))}
              yr0={YR0}
              negative
            />
            {mezzLoan > 0 && (
              <PFRow
                label="Mezz Payoff"
                t12=""
                vals={cols.slice(1).map((_, i) => (i + 1 === takeoutColIdx ? fmtDollarSigned(-mezzBalanceAtSale) : ""))}
                yr0={YR0}
                negative
              />
            )}
            <PFRow
              label={`Takeout Interest (${(takeout?.interest_rate ?? 0).toFixed(2)}%)`}
              t12=""
              vals={takeoutFlows.slice(1).map((v) => (v < 0 ? fmtDollarSigned(v) : ""))}
              yr0={YR0}
              negative
            />
            <PFTotalRow
              label="Net Takeout"
              vals={["-", ...takeoutFlows.slice(1).map((v) => (v === 0 ? "" : fmtDollarSigned(v)))]}
              yr0={YR0}
            />
          </div>
        </div>
      )}

      {/* Levered Cash Flow */}
      <CashFlowHighlight label="Levered Net Cash Flow" values={leveredCF} color="emerald" />

      {/* Returns */}
      <PFSectionHeader title="Returns" />
      <div className="flex flex-col">
        {goingInCap && <PFRow label="Cap Rate (Going-In)" t12={goingInCap} vals={Array(holdYears + 1).fill("")} yr0={YR0} />}
        <PFRow
          label="Cash-on-Cash"
          t12=""
          vals={["", ...returns.cashOnCash.map((c) => `${c.toFixed(1)}%`)]}
          yr0={YR0}
        />
        <ProFormaHighlightRow
          label="Equity Multiple"
          values={[...Array(colCount - 1).fill(""), returns.equityMultiple != null ? fmtX(returns.equityMultiple) : "--"]}
        />
        <ProFormaHighlightRow
          label="Levered IRR"
          values={[...Array(colCount - 1).fill(""), returns.irr != null ? fmtPct(returns.irr * 100) : "--"]}
        />
      </div>
    </div>
  );
}

// ── Sub-components ──

function PFSectionHeader({ title }: { title: string }) {
  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </span>
        <div className="flex-1 h-px bg-border/40" />
      </div>
    </div>
  );
}

function PFRow({
  label,
  t12,
  vals,
  negative,
  cellNotes,
  yr0,
  labelExtra,
}: {
  label: string;
  t12: string;
  vals: string[];
  negative?: boolean;
  cellNotes?: Record<number, CellNoteData>;
  yr0?: number;
  labelExtra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center py-[6px] px-4 rounded-md hover:bg-muted/40 transition-colors group">
      <div className="w-[240px] shrink-0 flex items-center gap-1.5">
        <span className="text-[12px] text-muted-foreground group-hover:text-foreground transition-colors">
          {label}
        </span>
        {labelExtra}
      </div>
      <div
        className={cn(
          "flex-1 text-right text-[12px] num px-3 relative",
          !t12 ? "text-transparent" : "text-foreground/60"
        )}
      >
        {cellNotes?.[0] && (
          <CellNote note={cellNotes[0].text} by={cellNotes[0].by} date={cellNotes[0].date} />
        )}
        {t12 || "-"}
      </div>
      {vals.map((v, i) => {
        const colIdx = i + 1;
        const cn_ = cellNotes?.[colIdx];
        const isYr0 = yr0 !== undefined && i === 0;
        const isDash = v === "-" || !v;
        return (
          <div
            key={i}
            className={cn(
              "flex-1 text-right text-[12px] num px-3 relative",
              isDash && "text-muted-foreground/30",
              !isDash && negative && v.startsWith("(")
                ? "text-red-500 dark:text-red-400"
                : !isDash
                  ? "text-foreground/80"
                  : "",
              isYr0 && !isDash && "font-medium"
            )}
          >
            {cn_ && <CellNote note={cn_.text} by={cn_.by} date={cn_.date} />}
            {isDash ? "-" : v}
          </div>
        );
      })}
    </div>
  );
}

function PFTotalRow({ label, vals, yr0 }: { label: string; vals: string[]; yr0?: number }) {
  return (
    <div className="flex items-center py-[7px] px-4 mt-0.5 border-t border-border/40">
      <div className="w-[240px] shrink-0 text-[12px] font-semibold text-foreground">{label}</div>
      {vals.map((v, i) => {
        const isDash = v === "-" || !v;
        const isNeg = v.startsWith("(");
        return (
          <div
            key={i}
            className={cn(
              "flex-1 text-right text-[12px] font-semibold num px-3",
              isDash
                ? "text-muted-foreground/30"
                : isNeg
                  ? "text-red-500 dark:text-red-400"
                  : i === 0
                    ? "text-foreground/60"
                    : "text-foreground"
            )}
          >
            {isDash ? "-" : v}
          </div>
        );
      })}
    </div>
  );
}

function ProFormaHighlightRow({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="flex items-center py-[7px] px-4 rounded-md bg-primary/[0.04] dark:bg-primary/[0.08]">
      <div className="w-[240px] shrink-0 text-[12px] font-semibold text-foreground">
        {label}
      </div>
      {values.map((v, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 text-right text-[12px] font-bold num px-3",
            v ? "text-primary" : "text-transparent"
          )}
        >
          {v || "-"}
        </div>
      ))}
    </div>
  );
}

function CashFlowHighlight({
  label,
  values,
  color,
}: {
  label: string;
  values: number[];
  color: "blue" | "emerald";
}) {
  const bg =
    color === "blue"
      ? "bg-blue-500/[0.04] dark:bg-blue-500/[0.08]"
      : "bg-emerald-500/[0.06] dark:bg-emerald-500/10";
  const text =
    color === "blue"
      ? "text-blue-700 dark:text-blue-400"
      : "text-emerald-700 dark:text-emerald-400";
  return (
    <div className={cn("mx-3 my-2 rounded-lg px-4 py-3 flex items-center", bg)}>
      <div className={cn("w-[240px] shrink-0 text-[12px] font-semibold", text)}>{label}</div>
      {values.map((v, i) => (
        <div
          key={i}
          className={cn(
            "flex-1 text-right text-[12px] font-bold num px-3",
            i === 0
              ? "text-muted-foreground/40"
              : v >= 0
                ? text
                : "text-red-500 dark:text-red-400"
          )}
        >
          {i === 0 ? "-" : v >= 0 ? fmtDollar(v) : `(${fmtDollar(Math.abs(v))})`}
        </div>
      ))}
    </div>
  );
}

function FinancingSection({
  title,
  loanLabel,
  ltvDisplay,
  rateDisplay,
  isIO,
  flows,
  cols,
  yr0,
}: {
  title: string;
  loanLabel: string;
  ltvDisplay: string;
  rateDisplay: string;
  isIO: boolean;
  flows: FinFlows;
  cols: string[];
  yr0: number;
}) {
  const fmtFlow = (arr: number[]) =>
    arr.slice(1).map((v) => (v === 0 ? "" : fmtDollarSigned(v)));
  return (
    <div className="mt-1">
      <div className="flex items-center gap-2 px-4 pt-4 pb-1.5">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {title}
        </span>
        <div className="flex-1 h-px bg-border/40" />
        <span className="text-[9px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5 border border-border/40">
          {isIO ? "IO" : "Amort"}
        </span>
      </div>
      <div className="flex flex-col">
        <PFRow
          label="Loan Proceeds"
          t12=""
          vals={fmtFlow(flows.proceeds)}
          yr0={yr0}
          labelExtra={
            <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-[1px] border border-border/40">
              <span className="text-[10px] num font-semibold text-foreground">{ltvDisplay}</span>
            </span>
          }
        />
        <PFRow
          label="Interest Payments"
          t12=""
          vals={fmtFlow(flows.intPmts)}
          yr0={yr0}
          negative
          labelExtra={
            <span className="inline-flex items-center gap-0.5 rounded bg-muted px-1.5 py-[1px] border border-border/40">
              <span className="text-[10px] num font-semibold text-foreground">{rateDisplay}</span>
            </span>
          }
        />
        <PFRow label="Principal Payments" t12="" vals={fmtFlow(flows.prinPmts)} yr0={yr0} negative />
        <PFRow label="Principal at Sale" t12="" vals={fmtFlow(flows.prinAtSale)} yr0={yr0} negative />
        <PFTotalRow label={`Net ${title}`} vals={["", ...fmtFlow(flows.net)]} yr0={yr0} />
      </div>
    </div>
  );
}

function CellNote({ note, by, date }: { note: string; by?: string; date?: string }) {
  return (
    <div className="absolute top-0 right-0 z-10 group/note">
      <div className="w-0 h-0 border-t-[6px] border-t-blue-400 dark:border-t-blue-500 border-l-[6px] border-l-transparent cursor-pointer" />
      <div className="hidden group-hover/note:block absolute top-0 right-0 pt-3 z-50">
        <div className="w-[240px] rounded-lg border border-border/60 bg-popover shadow-lg shadow-black/10 dark:shadow-black/30 overflow-hidden">
          <div className="px-3 py-2.5">
            <p className="text-[11px] leading-relaxed text-foreground/90">{note}</p>
          </div>
          {(by || date) && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/40 border-t border-border/30">
              {by && (
                <span className="text-[9px] font-medium text-muted-foreground">{by}</span>
              )}
              {by && date && <span className="text-[9px] text-muted-foreground/40">-</span>}
              {date && (
                <span className="text-[9px] text-muted-foreground/50">{date}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
