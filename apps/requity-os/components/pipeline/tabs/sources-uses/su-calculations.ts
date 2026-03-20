import type { DebtTranche, CapitalStackMetrics } from "./su-types";

export function n(v: unknown): number {
  if (v == null || v === "") return 0;
  const num = Number(v);
  return isNaN(num) ? 0 : num;
}

export function calcMonthlyPmt(principal: number, annualRatePct: number, amortYears: number): number {
  if (principal <= 0 || annualRatePct <= 0 || amortYears <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  const np = amortYears * 12;
  return principal * (r * Math.pow(1 + r, np)) / (Math.pow(1 + r, np) - 1);
}

export function calcAnnualDS(principal: number, annualRatePct: number, isIO: boolean, amortYears: number): number {
  if (principal <= 0 || annualRatePct <= 0) return 0;
  if (isIO) return principal * (annualRatePct / 100);
  return calcMonthlyPmt(principal, annualRatePct, amortYears) * 12;
}

export function calcDSCR(noi: number, annualDS: number): number {
  if (annualDS <= 0) return 0;
  return noi / annualDS;
}

export function calcDebtYield(noi: number, loanAmount: number): number {
  if (loanAmount <= 0) return 0;
  return (noi / loanAmount) * 100;
}

export function calcMaxLoanFromDSCR(noi: number, dscrFloor: number, annualRatePct: number, amortYears: number): number {
  if (dscrFloor <= 0 || annualRatePct <= 0) return 0;
  const maxAnnualDS = noi / dscrFloor;
  const r = annualRatePct / 100 / 12;
  const np = amortYears * 12;
  const maxMonthly = maxAnnualDS / 12;
  return Math.round(maxMonthly * (Math.pow(1 + r, np) - 1) / (r * Math.pow(1 + r, np)));
}

export function calcMaxLoanFromLTV(propertyValue: number, maxLTVPct: number): number {
  return Math.round(propertyValue * (maxLTVPct / 100));
}

export function fmtCurrency(v: number): string {
  if (v === 0) return "$0";
  if (v < 0) return `($${Math.abs(v).toLocaleString("en-US", { maximumFractionDigits: 0 })})`;
  return "$" + v.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

export function fmtCurrencyShort(v: number): string {
  const abs = Math.abs(v);
  const str = abs >= 1_000_000
    ? `$${(abs / 1_000_000).toFixed(2)}M`
    : abs >= 1_000
    ? `$${(abs / 1_000).toFixed(0)}K`
    : `$${abs.toFixed(0)}`;
  return v < 0 ? `(${str})` : str;
}

export function fmtPct(v: number, decimals = 2): string {
  return v.toFixed(decimals) + "%";
}

export function fmtX(v: number): string {
  return v.toFixed(2) + "x";
}

export function parseTranche(raw: Record<string, unknown>, type: "senior" | "mezz" | "takeout"): DebtTranche {
  return {
    id: raw.id as string | undefined,
    tranche_name: String(raw.tranche_name ?? (type === "senior" ? "Senior Debt" : type === "mezz" ? "Mezzanine" : "Takeout")),
    tranche_type: type,
    loan_amount: n(raw.loan_amount),
    interest_rate: n(raw.interest_rate),
    term_years: n(raw.term_years),
    amortization_years: n(raw.amortization_years),
    io_period_months: n(raw.io_period_months),
    is_io: Boolean(raw.is_io),
    origination_fee_pct: n(raw.origination_fee_pct),
    ltv_pct: n(raw.ltv_pct),
    prepay_type: String(raw.prepay_type ?? "none"),
    lender_name: String(raw.lender_name ?? ""),
    loan_type: String(raw.loan_type ?? "fixed"),
    max_ltv_constraint: n(raw.max_ltv_constraint),
    dscr_floor_constraint: n(raw.dscr_floor_constraint),
    takeout_year: n(raw.takeout_year),
    appraisal_cap_rate: n(raw.appraisal_cap_rate),
    sort_order: n(raw.sort_order),
  };
}

export function findTranche(debt: Record<string, unknown>[], type: string): Record<string, unknown> | undefined {
  return debt.find((d) => d.tranche_type === type);
}

export function computeCapitalStack(
  purchasePrice: number,
  seniorTranche: DebtTranche | null,
  mezzTranche: DebtTranche | null,
  noi: number,
  totalClosingCosts: number,
  totalBudget: number,
  totalReserves: number,
): CapitalStackMetrics {
  const seniorLoan = seniorTranche ? Math.round(purchasePrice * (seniorTranche.ltv_pct / 100)) : 0;
  const seniorTopLtv = seniorTranche?.ltv_pct ?? 0;
  const mezzLoan = mezzTranche ? Math.round(purchasePrice * (mezzTranche.ltv_pct / 100)) : 0;
  const totalDebt = seniorLoan + mezzLoan;
  const totalUses = purchasePrice + totalClosingCosts + totalBudget + totalReserves;
  const totalEquity = Math.max(0, totalUses - totalDebt);
  const totalCapitalization = totalDebt + totalEquity;

  const blendedLTV = purchasePrice > 0 ? (totalDebt / purchasePrice) * 100 : 0;

  const seniorAnnualDS = seniorTranche
    ? calcAnnualDS(seniorLoan, seniorTranche.interest_rate, seniorTranche.is_io, seniorTranche.amortization_years)
    : 0;
  const mezzAnnualDS = mezzTranche
    ? calcAnnualDS(mezzLoan, mezzTranche.interest_rate, mezzTranche.is_io, mezzTranche.amortization_years || 30)
    : 0;
  const totalAnnualDS = seniorAnnualDS + mezzAnnualDS;

  const combinedDSCR = totalAnnualDS > 0 ? noi / totalAnnualDS : 0;

  const seniorRate = seniorTranche?.interest_rate ?? 0;
  const mezzRate = mezzTranche?.interest_rate ?? 0;
  const blendedRate = totalDebt > 0
    ? (seniorLoan * seniorRate + mezzLoan * mezzRate) / totalDebt
    : seniorRate;

  return {
    seniorLoan,
    mezzLoan,
    totalDebt,
    totalEquity,
    totalCapitalization,
    blendedLTV,
    combinedDSCR,
    blendedRate,
    seniorAnnualDS,
    mezzAnnualDS,
    totalAnnualDS,
  };
}
