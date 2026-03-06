/**
 * Underwriting Calculator — client-side computation engine
 *
 * All calculations are pure functions operating on UnderwritingInputs.
 * Results are returned as UnderwritingOutputs.
 */

import type { UnderwritingInputs, UnderwritingOutputs } from "./types";

function safe(v: number | null | undefined): number {
  return v ?? 0;
}

export function computeOutputs(inputs: UnderwritingInputs): UnderwritingOutputs {
  const loanAmount = safe(inputs.loan_amount);
  const purchasePrice = safe(inputs.purchase_price);
  const appraisedValue = safe(inputs.appraised_value);
  const arv = safe(inputs.after_repair_value);
  const rehabBudget = safe(inputs.rehab_budget);
  const interestRate = safe(inputs.interest_rate); // annual %
  const points = safe(inputs.points);
  const termMonths = safe(inputs.loan_term_months);
  const monthlyRent = safe(inputs.monthly_rent);
  const annualTax = safe(inputs.annual_property_tax);
  const annualInsurance = safe(inputs.annual_insurance);
  const monthlyHoa = safe(inputs.monthly_hoa);
  const monthlyUtilities = safe(inputs.monthly_utilities);
  const operatingExpenses = safe(inputs.operating_expenses);
  const holdingPeriod = safe(inputs.holding_period_months) || termMonths;
  const projectedSalePrice = safe(inputs.projected_sale_price) || arv;
  const salesDispositionPct = safe(inputs.sales_disposition_pct);
  const mobilizationDraw = safe(inputs.mobilization_draw);
  const lenderFeesFlat = safe(inputs.lender_fees_flat);
  const titleClosingEscrow = safe(inputs.title_closing_escrow);
  const numPartners = safe(inputs.num_partners) || 1;

  // --- Key Ratios ---
  const ltv = appraisedValue > 0 ? (loanAmount / appraisedValue) * 100 : null;
  const ltarv = arv > 0 ? (loanAmount / arv) * 100 : null;
  const totalProjectCost = purchasePrice + rehabBudget;
  const ltc = totalProjectCost > 0 ? (loanAmount / totalProjectCost) * 100 : null;

  // --- Monthly Interest Payment (interest-only) ---
  const monthlyRate = interestRate / 100 / 12;
  const monthlyPayment = loanAmount * monthlyRate;
  const totalInterest = monthlyPayment * termMonths;

  // --- Fees ---
  const originationFee = loanAmount * (points / 100);
  const totalFees = originationFee + lenderFeesFlat;

  // --- DSCR ---
  const monthlyTaxInsurance = (annualTax + annualInsurance) / 12;
  const totalMonthlyExpenses = monthlyTaxInsurance + monthlyHoa + monthlyUtilities + operatingExpenses;
  const noi = monthlyRent - totalMonthlyExpenses;
  const dscr = monthlyPayment > 0 ? noi / monthlyPayment : null;

  // --- Holding Costs ---
  const monthlyHoldingCosts =
    monthlyPayment + monthlyTaxInsurance + monthlyHoa + monthlyUtilities;
  const totalHoldingCosts = monthlyHoldingCosts * holdingPeriod;

  // --- Closing Costs ---
  const prepaidInterest = monthlyPayment; // ~1 month estimate
  const totalClosingCosts = originationFee + lenderFeesFlat + titleClosingEscrow + prepaidInterest;
  const totalCashToClose =
    purchasePrice - loanAmount + mobilizationDraw + totalClosingCosts;

  // --- P&L / Exit ---
  const grossSaleProceeds = projectedSalePrice;
  const salesCosts = projectedSalePrice * (salesDispositionPct / 100);
  const netSaleProceeds = grossSaleProceeds - salesCosts;
  const totalCostBasis =
    purchasePrice + rehabBudget + totalHoldingCosts + totalClosingCosts + salesCosts;
  const netProfit = netSaleProceeds - totalCostBasis;

  // --- Returns ---
  const totalCashInvested = Math.max(totalCashToClose + rehabBudget - (loanAmount - purchasePrice + mobilizationDraw), 1);
  const borrowerRoi = totalCashInvested > 0 ? (netProfit / totalCashInvested) * 100 : null;
  const annualizedRoi =
    borrowerRoi !== null && holdingPeriod > 0
      ? (borrowerRoi / holdingPeriod) * 12
      : null;

  // --- Investor / Net Yield ---
  const annualInterestIncome = monthlyPayment * 12;
  const netYield = loanAmount > 0 ? (annualInterestIncome / loanAmount) * 100 : null;
  const investorReturn =
    loanAmount > 0
      ? ((annualInterestIncome + originationFee) / loanAmount) * 100
      : null;

  // --- Max Loan Sizing ---
  const maxLoanLtv = appraisedValue > 0 ? appraisedValue * 0.75 : null; // 75% LTV cap
  const maxLoanLtarv = arv > 0 ? arv * 0.7 : null; // 70% LTARV cap

  // --- Per Partner ---
  const cashPerPartner = numPartners > 0 ? totalCashToClose / numPartners : null;
  const profitPerPartner = numPartners > 0 ? netProfit / numPartners : null;

  return {
    ltv: ltv !== null ? round2(ltv) : null,
    ltarv: ltarv !== null ? round2(ltarv) : null,
    ltc: ltc !== null ? round2(ltc) : null,
    debt_service_coverage: dscr !== null ? round2(dscr) : null,
    monthly_payment: round2(monthlyPayment),
    total_interest: round2(totalInterest),
    origination_fee: round2(originationFee),
    total_fees: round2(totalFees),
    total_closing_costs: round2(totalClosingCosts),
    total_cash_to_close: round2(totalCashToClose),
    monthly_holding_costs: round2(monthlyHoldingCosts),
    total_holding_costs: round2(totalHoldingCosts),
    net_yield: netYield !== null ? round2(netYield) : null,
    investor_return: investorReturn !== null ? round2(investorReturn) : null,
    net_profit: round2(netProfit),
    borrower_roi: borrowerRoi !== null ? round2(borrowerRoi) : null,
    annualized_roi: annualizedRoi !== null ? round2(annualizedRoi) : null,
    total_project_cost: round2(totalProjectCost),
    max_loan_ltv: maxLoanLtv !== null ? round2(maxLoanLtv) : null,
    max_loan_ltarv: maxLoanLtarv !== null ? round2(maxLoanLtarv) : null,
    gross_sale_proceeds: round2(grossSaleProceeds),
    sales_costs: round2(salesCosts),
    net_sale_proceeds: round2(netSaleProceeds),
    cash_per_partner: cashPerPartner !== null ? round2(cashPerPartner) : null,
    profit_per_partner: profitPerPartner !== null ? round2(profitPerPartner) : null,
  };
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
