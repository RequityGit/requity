/**
 * Underwriting Calculator — TypeScript types for JSONB schemas
 */

export interface UnderwritingInputs {
  // Loan Terms
  loan_amount: number | null;
  purchase_price: number | null;
  appraised_value: number | null;
  interest_rate: number | null;
  points: number | null;
  loan_term_months: number | null;
  loan_type: string | null;
  loan_purpose: string | null;

  // Property Details
  property_type: string | null;
  property_address: string | null;
  after_repair_value: number | null;
  rehab_budget: number | null;
  heated_sqft: number | null;

  // Income / Expenses (for DSCR / rental)
  monthly_rent: number | null;
  annual_property_tax: number | null;
  annual_insurance: number | null;
  monthly_hoa: number | null;
  monthly_utilities: number | null;
  operating_expenses: number | null;

  // Exit Strategy
  exit_strategy: string | null;
  holding_period_months: number | null;
  projected_sale_price: number | null;
  sales_disposition_pct: number | null;

  // Additional
  credit_score: number | null;
  experience_count: number | null;
  mobilization_draw: number | null;
  lender_fees_flat: number | null;
  title_closing_escrow: number | null;
  num_partners: number | null;
}

export interface UnderwritingOutputs {
  // Key Ratios
  ltv: number | null;
  ltarv: number | null;
  ltc: number | null;
  debt_service_coverage: number | null;

  // Payment Info
  monthly_payment: number | null;
  total_interest: number | null;

  // Fees
  origination_fee: number | null;
  total_fees: number | null;
  total_closing_costs: number | null;
  total_cash_to_close: number | null;

  // Holding Costs
  monthly_holding_costs: number | null;
  total_holding_costs: number | null;

  // Returns
  net_yield: number | null;
  investor_return: number | null;
  net_profit: number | null;
  borrower_roi: number | null;
  annualized_roi: number | null;

  // Sizing
  total_project_cost: number | null;
  max_loan_ltv: number | null;
  max_loan_ltarv: number | null;

  // P&L
  gross_sale_proceeds: number | null;
  sales_costs: number | null;
  net_sale_proceeds: number | null;

  // Per Partner
  cash_per_partner: number | null;
  profit_per_partner: number | null;
}

/** The default/empty inputs object */
export const DEFAULT_INPUTS: UnderwritingInputs = {
  loan_amount: null,
  purchase_price: null,
  appraised_value: null,
  interest_rate: null,
  points: null,
  loan_term_months: null,
  loan_type: null,
  loan_purpose: null,
  property_type: null,
  property_address: null,
  after_repair_value: null,
  rehab_budget: null,
  heated_sqft: null,
  monthly_rent: null,
  annual_property_tax: null,
  annual_insurance: null,
  monthly_hoa: null,
  monthly_utilities: null,
  operating_expenses: null,
  exit_strategy: null,
  holding_period_months: null,
  projected_sale_price: null,
  sales_disposition_pct: null,
  credit_score: null,
  experience_count: null,
  mobilization_draw: null,
  lender_fees_flat: null,
  title_closing_escrow: null,
  num_partners: null,
};

export type UnderwritingVersionStatus = "draft" | "submitted" | "approved" | "rejected";

/** Pre-populated inputs for sandbox mode with realistic sample values */
export const SANDBOX_DEFAULT_INPUTS: UnderwritingInputs = {
  loan_amount: 350000,
  purchase_price: 400000,
  appraised_value: 425000,
  interest_rate: 12,
  points: 2,
  loan_term_months: 12,
  loan_type: "rtl",
  loan_purpose: "purchase",
  property_type: "sfr",
  property_address: null,
  after_repair_value: 550000,
  rehab_budget: 75000,
  heated_sqft: 1800,
  monthly_rent: 2500,
  annual_property_tax: 4800,
  annual_insurance: 1800,
  monthly_hoa: 0,
  monthly_utilities: 0,
  operating_expenses: 0,
  exit_strategy: "sale",
  holding_period_months: 9,
  projected_sale_price: 550000,
  sales_disposition_pct: 6,
  credit_score: 720,
  experience_count: 3,
  mobilization_draw: 0,
  lender_fees_flat: 1500,
  title_closing_escrow: 3500,
  num_partners: 1,
};
