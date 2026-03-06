// ============================================================================
// Commercial Underwriting — Calculation Engine
// Pure TypeScript — no DB dependency. Runs in browser for real-time reactivity.
// ============================================================================

import type {
  RentRollRow,
  OccupancyRow,
  AncillaryRow,
  ExpenseDefault,
  ExpenseOverrides,
  YearAssumptions,
  FinancingTerms,
  ProFormaYear,
  ExitAnalysis,
  POHAnalysis,
  T12Data,
} from "./types";

// ---- Income Calculations ----

export function calcLeaseIncome(rows: RentRollRow[]) {
  const current = rows.reduce(
    (sum, r) =>
      sum + (r.current_monthly_rent + r.cam_nnn + r.other_income + r.poh_income) * 12,
    0
  );
  const stabilized = rows.reduce(
    (sum, r) =>
      sum + (r.market_rent + r.market_cam_nnn + r.market_other) * 12,
    0
  );
  return { current, stabilized };
}

export function calcOccupancyRevenue(rows: OccupancyRow[], defaultDays: number) {
  const current = rows.reduce(
    (sum, r) =>
      sum +
      r.count *
        r.rate_per_night *
        (r.occupancy_pct / 100) *
        (r.operating_days || defaultDays),
    0
  );
  const stabilized = rows.reduce(
    (sum, r) =>
      sum +
      r.count *
        r.target_rate *
        (r.target_occupancy_pct / 100) *
        (r.operating_days || defaultDays),
    0
  );
  return { current, stabilized };
}

export function calcAncillaryIncome(rows: AncillaryRow[]) {
  const current = rows.reduce((sum, r) => sum + r.current_annual_amount, 0);
  const stabilized = rows.reduce((sum, r) => sum + r.stabilized_annual_amount, 0);
  return { current, stabilized };
}

export function calcGPI(
  lease: { current: number; stabilized: number },
  occ: { current: number; stabilized: number },
  ancillary: { current: number; stabilized: number }
) {
  return {
    current: Math.max(lease.current, occ.current) + ancillary.current,
    stabilized: Math.max(lease.stabilized, occ.stabilized) + ancillary.stabilized,
  };
}

// ---- Expense Calculations ----

export function calcExpenseDefaults(
  defaults: ExpenseDefault[],
  unitsOrSf: number
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const d of defaults) {
    if (d.expense_category === "mgmt_fee") continue; // mgmt_fee applied as % of EGI
    result[d.expense_category] = d.per_unit_amount * unitsOrSf;
  }
  return result;
}

export function calcYr1Expenses(
  defaults: Record<string, number>,
  overrides: ExpenseOverrides,
  egi: number
): Record<string, number> {
  const mgmt_fee = (overrides.mgmt_fee_pct / 100) * egi;

  const categories = [
    "taxes",
    "insurance",
    "utilities",
    "repairs",
    "contract_services",
    "payroll",
    "marketing",
    "ga",
    "reserve",
  ] as const;

  const result: Record<string, number> = { mgmt_fee };

  for (const cat of categories) {
    const overrideKey = cat === "reserve" ? "reserve" : cat;
    const override = overrides[overrideKey as keyof ExpenseOverrides];
    result[cat] =
      override != null && typeof override === "number"
        ? override
        : defaults[cat] ?? 0;
  }

  result.total_opex = Object.values(result).reduce((a, b) => a + b, 0);
  return result;
}

// ---- Debt Service ----

export function calcMonthlyPayment(
  principal: number,
  annualRate: number,
  amortMonths: number
): number {
  if (amortMonths === 0 || annualRate === 0 || principal === 0) return 0;
  const r = annualRate / 100 / 12;
  return (
    principal * (r * Math.pow(1 + r, amortMonths)) / (Math.pow(1 + r, amortMonths) - 1)
  );
}

export function calcAnnualDebtService(terms: FinancingTerms, year: number): number {
  const monthStart = (year - 1) * 12 + 1;
  const monthEnd = year * 12;
  let annualDS = 0;

  for (let m = monthStart; m <= monthEnd; m++) {
    if (m <= terms.bridge_term_months) {
      if (m <= terms.bridge_io_months) {
        annualDS += terms.bridge_loan_amount * (terms.bridge_rate / 100 / 12);
      } else {
        annualDS += calcMonthlyPayment(
          terms.bridge_loan_amount,
          terms.bridge_rate,
          terms.bridge_amortization_months
        );
      }
    } else if (terms.exit_loan_amount > 0) {
      const exitMonth = m - terms.bridge_term_months;
      if (exitMonth <= terms.exit_io_months) {
        annualDS += terms.exit_loan_amount * (terms.exit_rate / 100 / 12);
      } else {
        annualDS += calcMonthlyPayment(
          terms.exit_loan_amount,
          terms.exit_rate,
          terms.exit_amortization_years * 12
        );
      }
    }
  }
  return annualDS;
}

// ---- Five-Year Pro Forma ----

export function buildProForma(
  currentGPI: number,
  stabilizedGPI: number,
  t12: T12Data | null,
  yr1Expenses: Record<string, number>,
  assumptions: YearAssumptions,
  financing: FinancingTerms,
  purchasePrice: number
): ProFormaYear[] {
  const years: ProFormaYear[] = [];
  let cumulativeCF = 0;

  // Year 0 = T12 (if provided)
  if (t12 && t12.gpi > 0) {
    const t12_vacancy = t12.gpi * (t12.vacancy_pct ?? 0) / 100;
    const t12_bad_debt = t12.gpi * (t12.bad_debt_pct ?? 0) / 100;
    const t12_egi = t12.gpi - t12_vacancy - t12_bad_debt;
    const t12_total =
      t12.mgmt_fee +
      t12.taxes +
      t12.insurance +
      t12.utilities +
      t12.repairs +
      t12.contract_services +
      t12.payroll +
      t12.marketing +
      t12.ga +
      t12.replacement_reserve;
    const t12_noi = t12_egi - t12_total;

    years.push({
      year: 0,
      gpi: t12.gpi,
      vacancy: t12_vacancy,
      bad_debt: t12_bad_debt,
      egi: t12_egi,
      mgmt_fee: t12.mgmt_fee,
      taxes: t12.taxes,
      insurance: t12.insurance,
      utilities: t12.utilities,
      repairs: t12.repairs,
      contract_services: t12.contract_services,
      payroll: t12.payroll,
      marketing: t12.marketing,
      ga: t12.ga,
      replacement_reserve: t12.replacement_reserve,
      total_opex: t12_total,
      noi: t12_noi,
      debt_service: 0,
      net_cash_flow: t12_noi,
      dscr: 0,
      cap_rate: purchasePrice > 0 ? (t12_noi / purchasePrice) * 100 : 0,
      expense_ratio: t12_egi > 0 ? (t12_total / t12_egi) * 100 : 0,
      cumulative_cash_flow: 0,
    });
  }

  // Years 1-5
  let prevGPI = currentGPI;
  let prevExpenses = { ...yr1Expenses };
  delete prevExpenses.total_opex;

  for (let yr = 1; yr <= 5; yr++) {
    const rentGrowth = (assumptions.rent_growth[yr - 1] ?? 0) / 100;
    const expGrowth = (assumptions.expense_growth[yr - 1] ?? 0) / 100;
    const vacancyPct = (assumptions.vacancy_pct[yr - 1] ?? 5) / 100;
    const badDebtPct = assumptions.bad_debt_pct / 100;

    const gpi = yr === 1 ? currentGPI : prevGPI * (1 + rentGrowth);
    const vacancy = gpi * vacancyPct;
    const bad_debt = gpi * badDebtPct;
    const egi = gpi - vacancy - bad_debt;

    const expenses: Record<string, number> = {};
    if (yr === 1) {
      const { total_opex: _, ...rest } = yr1Expenses;
      Object.assign(expenses, rest);
      expenses.mgmt_fee = (assumptions.mgmt_fee_pct / 100) * egi;
    } else {
      for (const [key, val] of Object.entries(prevExpenses)) {
        if (key === "mgmt_fee") {
          expenses[key] = (assumptions.mgmt_fee_pct / 100) * egi;
        } else {
          expenses[key] = val * (1 + expGrowth);
        }
      }
    }

    const total_opex = Object.values(expenses).reduce((a, b) => a + b, 0);
    const noi = egi - total_opex;
    const ds = calcAnnualDebtService(financing, yr);
    const ncf = noi - ds;
    cumulativeCF += ncf;

    years.push({
      year: yr,
      gpi,
      vacancy,
      bad_debt,
      egi,
      mgmt_fee: expenses.mgmt_fee ?? 0,
      taxes: expenses.taxes ?? 0,
      insurance: expenses.insurance ?? 0,
      utilities: expenses.utilities ?? 0,
      repairs: expenses.repairs ?? 0,
      contract_services: expenses.contract_services ?? 0,
      payroll: expenses.payroll ?? 0,
      marketing: expenses.marketing ?? 0,
      ga: expenses.ga ?? 0,
      replacement_reserve: expenses.reserve ?? 0,
      total_opex,
      noi,
      debt_service: ds,
      net_cash_flow: ncf,
      dscr: ds > 0 ? noi / ds : 0,
      cap_rate: purchasePrice > 0 ? (noi / purchasePrice) * 100 : 0,
      expense_ratio: egi > 0 ? (total_opex / egi) * 100 : 0,
      cumulative_cash_flow: cumulativeCF,
    });

    prevGPI = gpi;
    prevExpenses = { ...expenses };
  }

  // Year 6 = Stabilized
  const stabVacancy = stabilizedGPI * (assumptions.stabilized_vacancy_pct / 100);
  const stabBadDebt = stabilizedGPI * (assumptions.bad_debt_pct / 100);
  const stabEGI = stabilizedGPI - stabVacancy - stabBadDebt;
  const stabExpenses = { ...prevExpenses };
  stabExpenses.mgmt_fee = (assumptions.mgmt_fee_pct / 100) * stabEGI;
  const stabTotal = Object.values(stabExpenses).reduce((a, b) => a + b, 0);
  const stabNOI = stabEGI - stabTotal;

  years.push({
    year: 6,
    gpi: stabilizedGPI,
    vacancy: stabVacancy,
    bad_debt: stabBadDebt,
    egi: stabEGI,
    mgmt_fee: stabExpenses.mgmt_fee ?? 0,
    taxes: stabExpenses.taxes ?? 0,
    insurance: stabExpenses.insurance ?? 0,
    utilities: stabExpenses.utilities ?? 0,
    repairs: stabExpenses.repairs ?? 0,
    contract_services: stabExpenses.contract_services ?? 0,
    payroll: stabExpenses.payroll ?? 0,
    marketing: stabExpenses.marketing ?? 0,
    ga: stabExpenses.ga ?? 0,
    replacement_reserve: stabExpenses.reserve ?? 0,
    total_opex: stabTotal,
    noi: stabNOI,
    debt_service: 0,
    net_cash_flow: stabNOI,
    dscr: 0,
    cap_rate: purchasePrice > 0 ? (stabNOI / purchasePrice) * 100 : 0,
    expense_ratio: stabEGI > 0 ? (stabTotal / stabEGI) * 100 : 0,
    cumulative_cash_flow: cumulativeCF + stabNOI,
  });

  return years;
}

// ---- Remaining Balance ----

export function calcRemainingBalance(
  principal: number,
  annualRate: number,
  totalMonths: number,
  monthsPaid: number
): number {
  if (totalMonths === 0 || annualRate === 0 || principal === 0) return principal;
  const r = annualRate / 100 / 12;
  const balance =
    principal *
    (Math.pow(1 + r, totalMonths) - Math.pow(1 + r, monthsPaid)) /
    (Math.pow(1 + r, totalMonths) - 1);
  return Math.max(0, balance);
}

// ---- IRR ----

export function calcIRR(cashFlows: number[], guess = 0.1): number {
  let rate = guess;
  for (let i = 0; i < 100; i++) {
    let npv = 0;
    let dnpv = 0;
    for (let t = 0; t < cashFlows.length; t++) {
      npv += cashFlows[t] / Math.pow(1 + rate, t);
      dnpv -= (t * cashFlows[t]) / Math.pow(1 + rate, t + 1);
    }
    if (Math.abs(dnpv) < 1e-12) break;
    const newRate = rate - npv / dnpv;
    if (Math.abs(newRate - rate) < 1e-8) return newRate;
    rate = newRate;
  }
  return rate;
}

// ---- Exit Analysis ----

export function calcExitAnalysis(
  proforma: ProFormaYear[],
  exitCapRate: number,
  dispositionPct: number,
  equityInvested: number,
  exitLoanAmount: number,
  exitRate: number,
  exitAmortYears: number,
  bridgeTermMonths: number
): ExitAnalysis {
  const yr5 = proforma.find((p) => p.year === 5);
  if (!yr5) {
    return {
      exit_noi: 0,
      exit_value: 0,
      disposition_costs: 0,
      exit_loan_balance: 0,
      net_proceeds: 0,
      equity_invested: equityInvested,
      levered_irr: 0,
    };
  }

  const exitNOI = yr5.noi;
  const exitValue = exitCapRate > 0 ? exitNOI / (exitCapRate / 100) : 0;
  const dispCosts = exitValue * (dispositionPct / 100);

  const monthsOnExitLoan = 60 - bridgeTermMonths;
  const exitBalance =
    exitLoanAmount > 0
      ? calcRemainingBalance(exitLoanAmount, exitRate, exitAmortYears * 12, monthsOnExitLoan)
      : 0;

  const netProceeds = exitValue - dispCosts - exitBalance;

  // IRR cash flows: [-equity, NCF_yr1, ..., NCF_yr5 + netProceeds]
  const cashFlows = [-equityInvested];
  for (let yr = 1; yr <= 5; yr++) {
    const yrData = proforma.find((p) => p.year === yr);
    if (!yrData) continue;
    cashFlows.push(yr === 5 ? yrData.net_cash_flow + netProceeds : yrData.net_cash_flow);
  }

  let leveredIRR = 0;
  if (equityInvested > 0) {
    try {
      leveredIRR = calcIRR(cashFlows) * 100;
    } catch {
      leveredIRR = 0;
    }
  }

  return {
    exit_noi: exitNOI,
    exit_value: exitValue,
    disposition_costs: dispCosts,
    exit_loan_balance: exitBalance,
    net_proceeds: netProceeds,
    equity_invested: equityInvested,
    levered_irr: isFinite(leveredIRR) ? leveredIRR : 0,
  };
}

// ---- Valuation Table ----

export function calcValuationTable(noi: number): { capRate: number; value: number }[] {
  const caps = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11];
  return caps.map((cap) => ({
    capRate: cap,
    value: cap > 0 ? noi / (cap / 100) : 0,
  }));
}

// ---- Sensitivity Matrix (DSCR) ----

export function calcSensitivityMatrix(
  baseNOI: number,
  baseRate: number,
  loanAmount: number,
  amortMonths: number
): { rate: number; noiAdj: number; dscr: number }[] {
  const rateOffsets = [-1, -0.5, 0, 0.5, 1];
  const noiOffsets = [-10, -5, 0, 5, 10];
  const results: { rate: number; noiAdj: number; dscr: number }[] = [];

  for (const rOff of rateOffsets) {
    for (const nOff of noiOffsets) {
      const adjRate = baseRate + rOff;
      const adjNOI = baseNOI * (1 + nOff / 100);
      const monthly = calcMonthlyPayment(loanAmount, adjRate, amortMonths);
      const annualDS = monthly * 12;
      results.push({
        rate: adjRate,
        noiAdj: nOff,
        dscr: annualDS > 0 ? adjNOI / annualDS : 0,
      });
    }
  }
  return results;
}

// ---- MHP POH Analysis ----

export function calcPOHAnalysis(
  pohRentalIncome: number,
  pohExpenseRatio: number,
  lotRentNOI: number,
  debtService: number
): POHAnalysis {
  const pohExpenses = pohRentalIncome * (pohExpenseRatio / 100);
  const pohNOI = pohRentalIncome - pohExpenses;
  const totalNOI = lotRentNOI + pohNOI;

  return {
    poh_rental_income: pohRentalIncome,
    poh_expenses: pohExpenses,
    poh_noi: pohNOI,
    lot_rent_noi: lotRentNOI,
    total_noi: totalNOI,
    lot_only_dscr: debtService > 0 ? lotRentNOI / debtService : 0,
    total_dscr: debtService > 0 ? totalNOI / debtService : 0,
  };
}

// ---- Helper: Get basis unit count ----

export function getBasisCount(
  propertyType: string,
  totalUnits: number,
  totalSf: number
): number {
  const sfBased = ["office", "retail", "industrial", "self_storage", "healthcare", "mixed_use", "warehouse"];
  if (sfBased.includes(propertyType)) return totalSf || 0;
  return totalUnits || 0;
}
