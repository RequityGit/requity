// ============================================================================
// Commercial Deal Underwriting — Computation Engine
// Pure functions operating on deal_commercial_* data.
// Reuses calcMonthlyPayment, calcIRR, calcRemainingBalance from calculator.ts
// ============================================================================

import { calcMonthlyPayment, calcIRR, calcRemainingBalance } from "./calculator";

// ── Types ──

export interface DealIncomeRow {
  id: string;
  line_item: string;
  t12_amount: number;
  year_1_amount: number;
  growth_rate: number; // decimal, e.g. 0.03
  is_deduction: boolean;
  sort_order: number;
}

export interface DealExpenseRow {
  id: string;
  category: string;
  t12_amount: number;
  year_1_amount: number;
  growth_rate: number; // decimal
  is_percentage: boolean;
  sort_order: number;
}

export interface DealUWRecord {
  purchase_price: number;
  closing_costs: number;
  capex_reserve: number;
  working_capital: number;
  num_units: number;
  total_sf: number;
  loan_amount: number;
  interest_rate: number; // decimal, e.g. 0.06
  amortization_years: number;
  loan_term_years: number;
  io_period_months: number;
  origination_fee_pct: number; // decimal
  exit_cap_rate: number; // decimal
  hold_period_years: number;
  sale_costs_pct: number; // decimal
  disposition_fee_pct: number; // decimal
}

export interface DealSourceUseRow {
  type: "source" | "use";
  line_item: string;
  amount: number;
}

export interface DealWaterfallTier {
  tier_order: number;
  tier_name: string;
  hurdle_rate: number | null;
  sponsor_split: number | null;
  investor_split: number | null;
  is_catch_up: boolean;
}

export interface ProFormaYearResult {
  year: number; // 0 = T12, 1-5
  incomeRows: { label: string; amount: number; isDeduction: boolean }[];
  netRevenue: number;
  expenseRows: { label: string; amount: number }[];
  totalExpenses: number;
  noi: number;
  debtService: number;
  cashFlowBeforeTax: number;
  dscr: number;
}

export interface DealAnalysisKPIs {
  currentNOI: number | null;
  goingInCap: number | null;
  year1DSCR: number | null;
  cashOnCash: number | null;
  debtYield: number | null;
  pricePerUnit: number | null;
  pricePerSF: number | null;
  noiPerUnit: number | null;
  yieldOnCost: number | null;
  equityMultiple: number | null;
}

export interface ExitResult {
  exitCapRate: number;
  exitPrice: number;
  saleCosts: number;
  netProceeds: number;
  loanPayoff: number;
  equityReturned: number;
  totalProfit: number;
}

export interface SensitivityRow {
  exitCap: number;
  exitPrice: number;
  equityMultiple: number;
  leveredIRR: number;
  isBase: boolean;
}

export interface ReturnSummary {
  leveredIRR: number | null;
  equityMultiple: number | null;
  avgCashOnCash: number | null;
  totalProfit: number | null;
  totalEquityIn: number | null;
  totalDistributions: number | null;
}

export interface WaterfallResult {
  investorTotal: number;
  sponsorTotal: number;
  investorIRR: number | null;
  sponsorIRR: number | null;
  investorEquity: number;
}

// ── Helpers ──

function n(v: number | null | undefined): number {
  return v ?? 0;
}

// ── Income / Expense Computations ──

export function computeT12NetRevenue(income: DealIncomeRow[]): number {
  return income.reduce((sum, row) => {
    return sum + (row.is_deduction ? -Math.abs(row.t12_amount) : row.t12_amount);
  }, 0);
}

export function computeT12TotalExpenses(expenses: DealExpenseRow[]): number {
  return expenses.reduce((sum, row) => sum + row.t12_amount, 0);
}

export function computeT12NOI(income: DealIncomeRow[], expenses: DealExpenseRow[]): number {
  return computeT12NetRevenue(income) - computeT12TotalExpenses(expenses);
}

// ── Annual Debt Service ──

export function computeAnnualDebtService(uw: DealUWRecord): number {
  const loanAmt = n(uw.loan_amount);
  const rate = n(uw.interest_rate); // decimal
  const amortYears = n(uw.amortization_years);
  const ioMonths = n(uw.io_period_months);

  if (loanAmt <= 0 || rate <= 0) return 0;

  // For simplicity, compute Year 1 debt service
  let annual = 0;
  for (let m = 1; m <= 12; m++) {
    if (m <= ioMonths) {
      // Interest-only
      annual += loanAmt * (rate / 12);
    } else {
      // Amortizing — calcMonthlyPayment expects rate as percentage
      annual += calcMonthlyPayment(loanAmt, rate * 100, amortYears * 12);
    }
  }
  return annual;
}

// ── 5-Year Pro Forma ──

export function computeProForma(
  income: DealIncomeRow[],
  expenses: DealExpenseRow[],
  uw: DealUWRecord
): ProFormaYearResult[] {
  const holdYears = n(uw.hold_period_years) || 5;
  const annualDS = computeAnnualDebtService(uw);
  const results: ProFormaYearResult[] = [];

  for (let yr = 0; yr <= Math.min(holdYears, 5); yr++) {
    const incomeRows = income
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => {
        let amount: number;
        if (yr === 0) {
          amount = row.t12_amount;
        } else if (yr === 1) {
          amount = row.year_1_amount;
        } else {
          amount = row.year_1_amount * Math.pow(1 + row.growth_rate, yr - 1);
        }
        return {
          label: row.line_item,
          amount: row.is_deduction ? -Math.abs(amount) : amount,
          isDeduction: row.is_deduction,
        };
      });

    const netRevenue = incomeRows.reduce((sum, r) => sum + r.amount, 0);

    const expenseRows = expenses
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((row) => {
        let amount: number;
        if (yr === 0) {
          amount = row.t12_amount;
        } else if (yr === 1) {
          if (row.is_percentage) {
            amount = netRevenue * row.year_1_amount;
          } else {
            amount = row.year_1_amount;
          }
        } else {
          if (row.is_percentage) {
            amount = netRevenue * row.year_1_amount;
          } else {
            amount = row.year_1_amount * Math.pow(1 + row.growth_rate, yr - 1);
          }
        }
        return { label: row.category, amount };
      });

    const totalExpenses = expenseRows.reduce((sum, r) => sum + r.amount, 0);
    const noi = netRevenue - totalExpenses;
    const ds = yr === 0 ? 0 : annualDS;
    const cfbt = noi - ds;
    const dscr = ds > 0 ? noi / ds : 0;

    results.push({
      year: yr,
      incomeRows,
      netRevenue,
      expenseRows,
      totalExpenses,
      noi,
      debtService: ds,
      cashFlowBeforeTax: cfbt,
      dscr,
    });
  }

  return results;
}

// ── Deal Analysis KPIs ──

export function computeDealAnalysis(
  uw: DealUWRecord,
  proForma: ProFormaYearResult[],
  sourcesUses: DealSourceUseRow[]
): DealAnalysisKPIs {
  const t12 = proForma.find((p) => p.year === 0);
  const yr1 = proForma.find((p) => p.year === 1);
  const currentNOI = t12?.noi ?? null;
  const purchasePrice = n(uw.purchase_price);
  const loanAmount = n(uw.loan_amount);
  const units = n(uw.num_units);
  const sf = n(uw.total_sf);

  const totalEquity = sourcesUses
    .filter((s) => s.type === "source" && s.line_item.toLowerCase().includes("equity"))
    .reduce((sum, s) => sum + s.amount, 0) || (purchasePrice - loanAmount);

  const totalCost = purchasePrice + n(uw.closing_costs) + n(uw.capex_reserve);
  const rehabTotal = sourcesUses
    .filter((s) => s.type === "use" && s.line_item.toLowerCase().includes("rehab"))
    .reduce((sum, s) => sum + s.amount, 0);

  const annualDS = computeAnnualDebtService(uw);
  const yr1NOI = yr1?.noi ?? null;
  const yr1CFBT = yr1?.cashFlowBeforeTax ?? null;

  return {
    currentNOI,
    goingInCap: currentNOI != null && purchasePrice > 0 ? currentNOI / purchasePrice : null,
    year1DSCR: yr1NOI != null && annualDS > 0 ? yr1NOI / annualDS : null,
    cashOnCash: yr1CFBT != null && totalEquity > 0 ? yr1CFBT / totalEquity : null,
    debtYield: currentNOI != null && loanAmount > 0 ? currentNOI / loanAmount : null,
    pricePerUnit: purchasePrice > 0 && units > 0 ? purchasePrice / units : null,
    pricePerSF: purchasePrice > 0 && sf > 0 ? purchasePrice / sf : null,
    noiPerUnit: currentNOI != null && units > 0 ? currentNOI / units : null,
    yieldOnCost: currentNOI != null && (totalCost + rehabTotal) > 0
      ? currentNOI / (totalCost + rehabTotal) : null,
    equityMultiple: null, // computed after waterfall
  };
}

// ── Exit Analysis ──

export function computeExitAnalysis(
  uw: DealUWRecord,
  proForma: ProFormaYearResult[],
  totalEquity: number
): ExitResult {
  const holdYears = n(uw.hold_period_years) || 5;
  const exitCapRate = n(uw.exit_cap_rate);
  const saleCostsPct = n(uw.sale_costs_pct);
  const dispFeePct = n(uw.disposition_fee_pct);

  const exitYearPF = proForma.find((p) => p.year === holdYears);
  const exitNOI = exitYearPF?.noi ?? 0;

  const exitPrice = exitCapRate > 0 ? exitNOI / exitCapRate : 0;
  const saleCosts = exitPrice * (saleCostsPct + dispFeePct);
  const netProceeds = exitPrice - saleCosts;

  // Loan payoff: remaining balance at exit
  const loanAmt = n(uw.loan_amount);
  const rate = n(uw.interest_rate);
  const amortYears = n(uw.amortization_years);
  const ioMonths = n(uw.io_period_months);

  let loanPayoff = loanAmt;
  if (loanAmt > 0 && rate > 0 && amortYears > 0) {
    const amortMonths = amortYears * 12;
    const monthsPaid = Math.max(0, holdYears * 12 - ioMonths);
    loanPayoff = calcRemainingBalance(loanAmt, rate * 100, amortMonths, monthsPaid);
  }

  const equityReturned = netProceeds - loanPayoff;
  const totalCashFlows = proForma
    .filter((p) => p.year >= 1 && p.year <= holdYears)
    .reduce((sum, p) => sum + p.cashFlowBeforeTax, 0);
  const totalProfit = totalCashFlows + equityReturned - totalEquity;

  return {
    exitCapRate,
    exitPrice,
    saleCosts,
    netProceeds,
    loanPayoff,
    equityReturned,
    totalProfit,
  };
}

// ── Return Summary ──

export function computeReturnSummary(
  uw: DealUWRecord,
  proForma: ProFormaYearResult[],
  totalEquity: number,
  exitResult: ExitResult
): ReturnSummary {
  if (totalEquity <= 0) {
    return {
      leveredIRR: null, equityMultiple: null, avgCashOnCash: null,
      totalProfit: null, totalEquityIn: null, totalDistributions: null,
    };
  }

  const holdYears = n(uw.hold_period_years) || 5;
  const cashFlows: number[] = [-totalEquity];
  let totalCashFlow = 0;

  for (let yr = 1; yr <= holdYears; yr++) {
    const pf = proForma.find((p) => p.year === yr);
    const cf = pf?.cashFlowBeforeTax ?? 0;
    totalCashFlow += cf;
    if (yr === holdYears) {
      cashFlows.push(cf + exitResult.equityReturned);
    } else {
      cashFlows.push(cf);
    }
  }

  const totalDistributions = totalCashFlow + exitResult.equityReturned;

  let leveredIRR: number | null = null;
  try {
    const irr = calcIRR(cashFlows);
    leveredIRR = isFinite(irr) ? irr : null;
  } catch {
    leveredIRR = null;
  }

  const cocValues = proForma
    .filter((p) => p.year >= 1 && p.year <= holdYears)
    .map((p) => p.cashFlowBeforeTax / totalEquity);
  const avgCashOnCash = cocValues.length > 0
    ? cocValues.reduce((a, b) => a + b, 0) / cocValues.length
    : null;

  return {
    leveredIRR,
    equityMultiple: totalDistributions / totalEquity,
    avgCashOnCash,
    totalProfit: exitResult.totalProfit,
    totalEquityIn: totalEquity,
    totalDistributions,
  };
}

// ── Sensitivity Matrix ──

export function computeSensitivity(
  uw: DealUWRecord,
  proForma: ProFormaYearResult[],
  totalEquity: number
): SensitivityRow[] {
  const baseExitCap = n(uw.exit_cap_rate);
  if (baseExitCap <= 0 || totalEquity <= 0) return [];

  const holdYears = n(uw.hold_period_years) || 5;
  const steps = [-0.005, -0.0025, 0, 0.0025, 0.005]; // ±50bp, ±25bp

  return steps.map((offset) => {
    const exitCap = baseExitCap + offset;
    const modifiedUW = { ...uw, exit_cap_rate: exitCap };
    const exitResult = computeExitAnalysis(modifiedUW, proForma, totalEquity);
    const returns = computeReturnSummary(modifiedUW, proForma, totalEquity, exitResult);

    return {
      exitCap,
      exitPrice: exitResult.exitPrice,
      equityMultiple: returns.equityMultiple ?? 0,
      leveredIRR: returns.leveredIRR ?? 0,
      isBase: offset === 0,
    };
  });
}

// ── Waterfall Distribution ──

export function computeWaterfallDistributions(
  tiers: DealWaterfallTier[],
  cashFlows: number[], // Year 0 = -equity, Years 1-N
  exitProceeds: number,
  totalEquity: number
): WaterfallResult {
  if (tiers.length === 0 || totalEquity <= 0) {
    return { investorTotal: 0, sponsorTotal: 0, investorIRR: null, sponsorIRR: null, investorEquity: totalEquity };
  }

  // Simple waterfall: distribute total available cash through tiers
  const totalCash = cashFlows.slice(1).reduce((a, b) => a + b, 0) + exitProceeds;
  let remaining = totalCash;
  let investorTotal = 0;
  let sponsorTotal = 0;

  const sortedTiers = [...tiers].sort((a, b) => a.tier_order - b.tier_order);

  for (const tier of sortedTiers) {
    if (remaining <= 0) break;

    if (tier.hurdle_rate != null && tier.hurdle_rate > 0) {
      // Pref return tier: investor gets pref on equity first
      const prefAmount = totalEquity * tier.hurdle_rate;
      const allocated = Math.min(remaining, prefAmount);
      const invSplit = n(tier.investor_split);
      const spSplit = n(tier.sponsor_split);

      if (tier.is_catch_up) {
        sponsorTotal += allocated;
      } else {
        investorTotal += allocated * invSplit;
        sponsorTotal += allocated * spSplit;
      }
      remaining -= allocated;
    } else {
      // Remaining split
      const invSplit = n(tier.investor_split);
      const spSplit = n(tier.sponsor_split);
      investorTotal += remaining * invSplit;
      sponsorTotal += remaining * spSplit;
      remaining = 0;
    }
  }

  // If there's remaining after all tiers, default 50/50
  if (remaining > 0) {
    investorTotal += remaining * 0.5;
    sponsorTotal += remaining * 0.5;
  }

  return {
    investorTotal,
    sponsorTotal,
    investorIRR: null, // Would need investor-specific cash flow allocation
    sponsorIRR: null,
    investorEquity: totalEquity,
  };
}
