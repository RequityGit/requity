/**
 * Residential Underwriting Computation Engine
 *
 * Pure functions for calculating loan sizing, holding costs, exit P&L, and DSCR.
 * All calculations match the RTL UW Google Sheet logic.
 */

import type {
  LoanProgram,
  ResidentialDealInputs,
  LoanSizingResult,
  HoldingCosts,
  ExitAnalysis,
  DSCRAnalysis,
  ResidentialUWOutput,
  AdjusterDefinition,
} from "./types";

// ── Utilities ──

function safe(v: number | null | undefined): number {
  return v ?? 0;
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}

// ── Adjuster Logic ──

/**
 * Apply leverage adjusters to program limits based on active adjusters.
 * Returns adjusted program limits (LTV, LTC, LTP).
 */
export function computeAdjustedLimits(
  program: LoanProgram,
  activeAdjusterKeys: string[]
): {
  adjusted_ltv: number;
  adjusted_ltc: number;
  adjusted_ltp: number;
} {
  let ltv_adj = 0;
  let ltc_adj = 0;
  let ltp_adj = 0;

  if (program.adjusters) {
    program.adjusters.forEach((adj) => {
      if (activeAdjusterKeys.includes(adj.key)) {
        ltv_adj += safe(adj.ltv_impact);
        ltc_adj += safe(adj.ltc_impact);
        ltp_adj += safe(adj.ltp_impact);
      }
    });
  }

  return {
    adjusted_ltv: Math.min(program.max_ltv + ltv_adj, 95), // cap at 95%
    adjusted_ltc: Math.min(program.max_ltc + ltc_adj, 95),
    adjusted_ltp: Math.min(program.max_ltp + ltp_adj, 95),
  };
}

// ── Loan Sizing ──

/**
 * Compute maximum loan and binding constraint across LTV, LTC, LTP.
 * Returns the binding constraint (most restrictive) and effective ratios.
 */
export function computeLoanSizing(
  inputs: ResidentialDealInputs,
  program: LoanProgram,
  activeAdjusterKeys: string[] = []
): LoanSizingResult {
  const purchasePrice = safe(inputs.purchase_price);
  const arv = safe(inputs.after_repair_value);
  const appraisedValue = safe(inputs.appraised_value) || arv; // use ARV as appraised if not provided
  const rehabBudget = safe(inputs.rehab_budget);
  const loanAmount = safe(inputs.loan_amount);

  // Get adjusted limits (if program has leverage adjusters)
  const { adjusted_ltv, adjusted_ltc, adjusted_ltp } = computeAdjustedLimits(
    program,
    activeAdjusterKeys
  );

  // Total project cost (purchase + rehab)
  const totalProjectCost = purchasePrice + rehabBudget;

  // Max loan by each constraint
  const max_by_ltv = (appraisedValue * adjusted_ltv) / 100;
  const max_by_ltc = (totalProjectCost * adjusted_ltc) / 100;
  const max_by_ltp = (arv * adjusted_ltp) / 100;

  // Binding constraint (most restrictive, i.e., minimum max loan)
  const max_loan = Math.min(max_by_ltv, max_by_ltc, max_by_ltp);

  let binding_constraint: "ltv" | "ltc" | "ltp" | "none" = "none";
  const tolerance = 100; // within $100 is binding
  if (Math.abs(max_loan - max_by_ltv) < tolerance) binding_constraint = "ltv";
  else if (Math.abs(max_loan - max_by_ltc) < tolerance) binding_constraint = "ltc";
  else if (Math.abs(max_loan - max_by_ltp) < tolerance) binding_constraint = "ltp";

  // Effective ratios at max loan
  const effective_ltv = appraisedValue > 0 ? (max_loan / appraisedValue) * 100 : 0;
  const effective_ltc = totalProjectCost > 0 ? (max_loan / totalProjectCost) * 100 : 0;
  const effective_ltp = arv > 0 ? (max_loan / arv) * 100 : 0;

  // Effective program terms (may override with deal-level inputs)
  const effective_rate = safe(inputs.interest_rate) || program.interest_rate;
  const effective_pts = safe(inputs.origination_pts) || program.origination_pts;
  const effective_origination_fee = (max_loan * effective_pts) / 100;

  return {
    max_by_ltv: round2(max_by_ltv),
    max_by_ltc: round2(max_by_ltc),
    max_by_ltp: round2(max_by_ltp),
    max_loan: round2(max_loan),
    binding_constraint,
    effective_ltv: round2(effective_ltv),
    effective_ltc: round2(effective_ltc),
    effective_ltp: round2(effective_ltp),
    effective_rate,
    effective_pts,
    effective_origination_fee: round2(effective_origination_fee),
  };
}

// ── RTL: Holding Costs ──

/**
 * Compute monthly and total holding costs for fix & flip.
 * Includes interest, taxes, insurance, HOA, utilities during construction/hold period.
 */
export function computeHoldingCosts(
  inputs: ResidentialDealInputs,
  loanAmount: number,
  program: LoanProgram,
  activeAdjusterKeys: string[] = []
): HoldingCosts {
  const interestRate = safe(inputs.interest_rate) || program.interest_rate;
  const holdingMonths = safe(inputs.holding_period_months) || 6;
  const annualTax = safe(inputs.annual_property_tax);
  const annualInsurance = safe(inputs.annual_insurance);
  const monthlyHoa = safe(inputs.monthly_hoa);
  const monthlyUtilities = safe(inputs.monthly_utilities);

  // Monthly interest payment (interest-only financing)
  const monthlyRate = interestRate / 100 / 12;
  const monthly_interest = loanAmount * monthlyRate;

  // Monthly taxes & insurance
  const monthly_taxes_insurance = (annualTax + annualInsurance) / 12;

  // Total monthly holding
  const monthly_hoa_val = monthlyHoa;
  const monthly_utilities_val = monthlyUtilities;
  const monthly_total =
    monthly_interest + monthly_taxes_insurance + monthly_hoa_val + monthly_utilities_val;

  // Total holding cost over period
  const total_holding_cost = monthly_total * holdingMonths;

  return {
    monthly_interest: round2(monthly_interest),
    monthly_taxes_insurance: round2(monthly_taxes_insurance),
    monthly_hoa: round2(monthly_hoa_val),
    monthly_utilities: round2(monthly_utilities_val),
    monthly_total: round2(monthly_total),
    total_holding_period: holdingMonths,
    total_holding_cost: round2(total_holding_cost),
  };
}

// ── RTL: Exit Analysis ──

/**
 * Compute exit P&L for fix & flip sale.
 * Returns sale proceeds, costs, profit, and ROI metrics.
 */
export function computeExitAnalysis(
  inputs: ResidentialDealInputs,
  loanAmount: number,
  holdingCosts: HoldingCosts,
  program: LoanProgram
): ExitAnalysis {
  const purchasePrice = safe(inputs.purchase_price);
  const rehabBudget = safe(inputs.rehab_budget);
  const projectedSalePrice = safe(inputs.projected_sale_price) || safe(inputs.after_repair_value);
  const salesDispositionPct = safe(inputs.sales_disposition_pct) || 5; // default 5% closing/selling costs
  const holdingMonths = holdingCosts.total_holding_period;

  // Sale proceeds and costs
  const gross_sale_proceeds = projectedSalePrice;
  const sales_disposition_cost = (projectedSalePrice * salesDispositionPct) / 100;
  const net_proceeds = gross_sale_proceeds - sales_disposition_cost;

  // Cost basis
  const originationFee = loanAmount * (program.origination_pts / 100);
  const lenderFeeEstimate = loanAmount * 0.01; // estimate 1% lender fees
  const closingCosts = originationFee + lenderFeeEstimate + 500; // +$500 est. title/escrow
  const total_cost_basis =
    purchasePrice + rehabBudget + holdingCosts.total_holding_cost + closingCosts + sales_disposition_cost;

  // Profit
  const net_profit = net_proceeds - total_cost_basis;

  // ROI (based on cash to close)
  const cashToClose = purchasePrice - loanAmount + closingCosts;
  const borrower_roi =
    cashToClose > 0 ? ((net_profit / cashToClose) * 100) : 0;

  // Annualized ROI
  const annualized_roi = holdingMonths > 0 ? (borrower_roi / holdingMonths) * 12 : 0;

  return {
    gross_sale_proceeds: round2(gross_sale_proceeds),
    sales_disposition_cost: round2(sales_disposition_cost),
    net_proceeds: round2(net_proceeds),
    total_cost_basis: round2(total_cost_basis),
    net_profit: round2(net_profit),
    borrower_roi: round2(borrower_roi),
    annualized_roi: round2(annualized_roi),
    hold_period_months: holdingMonths,
  };
}

// ── DSCR: Analysis ──

/**
 * Compute DSCR analysis for rental property.
 * Returns monthly and annual cash flow, DSCR ratio.
 */
export function computeDSCRAnalysis(
  inputs: ResidentialDealInputs,
  loanAmount: number,
  program: LoanProgram
): DSCRAnalysis {
  const monthlyRent = safe(inputs.monthly_rent);
  const annualTax = safe(inputs.annual_property_tax);
  const annualInsurance = safe(inputs.annual_insurance);
  const monthlyHoa = safe(inputs.monthly_hoa);
  const monthlyUtilities = safe(inputs.monthly_utilities);
  const monthlyOpEx = safe(inputs.operating_expenses);
  const interestRate = safe(inputs.interest_rate) || program.interest_rate;
  const loanTermMonths = safe(inputs.loan_term_months) || 360; // 30-year default

  // Monthly P&I payment (amortizing loan)
  const monthlyRate = interestRate / 100 / 12;
  const monthly_pi = monthlyRate > 0
    ? loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, loanTermMonths)) /
      (Math.pow(1 + monthlyRate, loanTermMonths) - 1)
    : loanAmount / loanTermMonths;

  // Monthly expenses
  const monthly_taxes_insurance = (annualTax + annualInsurance) / 12;
  const monthly_hoa_val = monthlyHoa;
  const monthly_utilities_val = monthlyUtilities;
  const monthly_opex_val = monthlyOpEx;
  const monthly_expenses_total =
    monthly_taxes_insurance + monthly_hoa_val + monthly_utilities_val + monthly_opex_val;

  // NOI and DSCR
  const monthly_noi = monthlyRent - monthly_expenses_total;
  const dscr = monthly_pi > 0 ? monthly_noi / monthly_pi : 0;
  const monthly_cash_flow = monthly_noi - monthly_pi;
  const cash_flow_annual = monthly_cash_flow * 12;

  return {
    monthly_rent: round2(monthlyRent),
    monthly_taxes_insurance: round2(monthly_taxes_insurance),
    monthly_hoa: round2(monthly_hoa_val),
    monthly_utilities: round2(monthly_utilities_val),
    monthly_operating_expenses: round2(monthly_opex_val),
    monthly_expenses_total: round2(monthly_expenses_total),
    monthly_noi: round2(monthly_noi),
    monthly_pi: round2(monthly_pi),
    monthly_cash_flow: round2(monthly_cash_flow),
    dscr: round2(dscr),
    cash_flow_annual: round2(cash_flow_annual),
  };
}

// ── KPI Strip Values ──

/**
 * Compute all KPI values for display on the KPI strip.
 * Returns appropriate metrics based on deal type.
 */
export function computeKPIs(
  inputs: ResidentialDealInputs,
  program: LoanProgram,
  activeAdjusterKeys: string[] = []
): Record<string, number> {
  const loanSizing = computeLoanSizing(inputs, program, activeAdjusterKeys);
  const holdingCosts = computeHoldingCosts(inputs, loanSizing.max_loan, program, activeAdjusterKeys);
  const exitAnalysis = computeExitAnalysis(inputs, loanSizing.max_loan, holdingCosts, program);
  const dscrAnalysis = computeDSCRAnalysis(inputs, loanSizing.max_loan, program);

  return {
    // Common
    ltv: loanSizing.effective_ltv,
    ltc: loanSizing.effective_ltc,
    max_loan: loanSizing.max_loan,
    rate: loanSizing.effective_rate,

    // RTL specific
    net_profit: exitAnalysis.net_profit,
    annualized_roi: exitAnalysis.annualized_roi,

    // DSCR specific
    dscr: dscrAnalysis.dscr,
    monthly_rent: dscrAnalysis.monthly_rent,
    monthly_cash_flow: dscrAnalysis.monthly_cash_flow,
  };
}

// ── Complete Underwriting Output ──

/**
 * Compute complete residential underwriting output for RTL or DSCR.
 * Orchestrates all sub-calculations and returns comprehensive result.
 */
export function computeResidentialUW(
  inputs: ResidentialDealInputs,
  dealType: "rtl" | "dscr",
  program: LoanProgram,
  activeAdjusterKeys: string[] = []
): ResidentialUWOutput {
  const loanSizing = computeLoanSizing(inputs, program, activeAdjusterKeys);
  const holdingCosts = computeHoldingCosts(
    inputs,
    loanSizing.max_loan,
    program,
    activeAdjusterKeys
  );

  // Closing costs estimate
  const originationFee = loanSizing.effective_origination_fee;
  const lenderFeeEstimate = loanSizing.max_loan * 0.01;
  const titleEscrow = 500;
  const closingCosts = originationFee + lenderFeeEstimate + titleEscrow;

  const cashToClose =
    safe(inputs.purchase_price) - loanSizing.max_loan + closingCosts;

  let output: ResidentialUWOutput = {
    deal_type: dealType,
    loan_sizing: loanSizing,
    closing_costs: round2(closingCosts),
    total_cash_to_close: round2(Math.max(cashToClose, 0)),
  };

  // Add deal-type-specific outputs
  if (dealType === "rtl") {
    const exitAnalysis = computeExitAnalysis(
      inputs,
      loanSizing.max_loan,
      holdingCosts,
      program
    );
    output.holding_costs = holdingCosts;
    output.exit_analysis = exitAnalysis;
  } else if (dealType === "dscr") {
    const dscrAnalysis = computeDSCRAnalysis(inputs, loanSizing.max_loan, program);
    output.dscr_analysis = dscrAnalysis;
  }

  return output;
}
