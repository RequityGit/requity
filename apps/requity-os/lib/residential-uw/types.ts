/**
 * Residential Underwriting Types
 *
 * Defines interfaces for RTL (Fix & Flip), DSCR (Rental), and future GUC programs.
 * Programs are data-driven and can be customized per deal.
 */

export type DealType = "rtl" | "dscr" | "guc";
export type ProgramType = "rtl_premier" | "rtl_balance_sheet" | "dscr_standard" | "dscr_no_ratio" | "guc";

/**
 * Leverage Adjuster: modifies LTC/LTV limits based on risk factors.
 * Each adjuster has a condition (e.g., "experienced_borrower": true) that when met,
 * applies adjustments to program limits.
 */
export interface AdjusterDefinition {
  key: string;
  label: string;
  description?: string;
  ltc_impact?: number; // e.g., +2 for +2% LTC increase
  ltv_impact?: number; // e.g., -1 for -1% LTV decrease
  ltp_impact?: number;
}

/**
 * Loan Program: defines terms, limits, and constraints for a specific loan product.
 * Programs are selected per-deal and can be compared side-by-side.
 */
export interface LoanProgram {
  id: string;
  name: string;
  type: ProgramType;
  description?: string;

  // Interest & Fees
  interest_rate: number; // annual % (e.g., 9.5 for 9.5%)
  origination_pts: number; // points as % (e.g., 2 for 2%)

  // Lending Limits
  max_ltv: number; // max LTV % (e.g., 70)
  max_ltc: number; // max LTC % (e.g., 75)
  max_ltp: number; // max LTP % (e.g., 80)

  // Borrower Requirements
  min_fico: number; // minimum FICO score
  min_experience_years?: number;
  citizenship_required?: "us_citizen" | "permanent_resident" | "any";
  entity_type?: "llc" | "corp" | "both";

  // Property Requirements
  appraisal_required?: boolean;
  max_property_age_years?: number;
  property_types?: string[]; // ["sfr", "mfr_2_4", "condo"]

  // Program-Specific
  adjusters?: AdjusterDefinition[]; // leverage adjusters (balance sheet programs)
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Residential deal inputs, populated from uw_data JSONB column.
 * Fields gracefully default to 0 if missing.
 */
export interface ResidentialDealInputs {
  // Property & Purchase
  purchase_price: number;
  after_repair_value: number;
  appraised_value?: number;
  rehab_budget: number;

  // Financing
  loan_amount: number;
  loan_term_months: number;
  interest_rate?: number; // override program rate
  origination_pts?: number; // override program pts

  // Holding (RTL specific)
  holding_period_months?: number; // construction + buffer

  // Exit (RTL specific)
  projected_sale_price?: number; // defaults to ARV
  sales_disposition_pct?: number; // closing costs %

  // Operating (DSCR specific)
  monthly_rent: number;
  annual_property_tax: number;
  annual_insurance: number;
  monthly_hoa?: number;
  monthly_utilities?: number;
  operating_expenses?: number;

  // Borrower profile (for eligibility)
  fico_score?: number;
  net_worth?: number;
  liquid_reserves?: number;
  real_estate_experience_years?: number;
  is_us_citizen?: boolean;
}

/**
 * Loan sizing result: computes max loan across LTV, LTC, LTP constraints.
 * Highlights which constraint is binding (most restrictive).
 */
export interface LoanSizingResult {
  // Max loan by constraint
  max_by_ltv: number;
  max_by_ltc: number;
  max_by_ltp: number;

  // Binding constraint
  max_loan: number; // min of above
  binding_constraint: "ltv" | "ltc" | "ltp" | "none";

  // Effective ratios at max loan
  effective_ltv: number;
  effective_ltc: number;
  effective_ltp: number;

  // Program terms
  effective_rate: number;
  effective_pts: number;
  effective_origination_fee: number;
}

/**
 * Holding costs for fix & flip (rental holding on DSCR if applicable).
 */
export interface HoldingCosts {
  monthly_interest: number;
  monthly_taxes_insurance: number;
  monthly_hoa: number;
  monthly_utilities: number;
  monthly_total: number;
  total_holding_period: number; // months
  total_holding_cost: number;
}

/**
 * Exit P&L for fix & flip (sale scenario).
 */
export interface ExitAnalysis {
  gross_sale_proceeds: number;
  sales_disposition_cost: number;
  net_proceeds: number;
  total_cost_basis: number; // purchase + rehab + holding + closing + sales costs
  net_profit: number;
  borrower_roi: number; // % based on cash invested
  annualized_roi: number; // % annual return
  hold_period_months: number;
}

/**
 * DSCR analysis: debt service coverage ratio and cash flow on rental.
 */
export interface DSCRAnalysis {
  monthly_rent: number;
  monthly_taxes_insurance: number;
  monthly_hoa: number;
  monthly_utilities: number;
  monthly_operating_expenses: number;
  monthly_expenses_total: number;
  monthly_noi: number; // NOI = rent - expenses
  monthly_pi: number; // principal + interest payment
  monthly_cash_flow: number; // NOI - P&I
  dscr: number; // NOI / P&I
  cash_flow_annual: number;
}

/**
 * Complete residential underwriting result.
 * Includes all computed values for display.
 */
export interface ResidentialUWOutput {
  deal_type: DealType;

  // Loan Sizing
  loan_sizing: LoanSizingResult;

  // RTL specific
  holding_costs?: HoldingCosts;
  exit_analysis?: ExitAnalysis;

  // DSCR specific
  dscr_analysis?: DSCRAnalysis;

  // Common
  closing_costs: number;
  total_cash_to_close: number;
}

/**
 * Mock program data for Sprint 1 (client-side).
 * Sprint 2 will replace with database lookup.
 */
export const MOCK_PROGRAMS: LoanProgram[] = [
  {
    id: "rtl_premier",
    name: "RTL Premier",
    type: "rtl_premier",
    description: "Best rates for experienced borrowers with strong financials",
    interest_rate: 9.5,
    origination_pts: 2,
    max_ltv: 70,
    max_ltc: 75,
    max_ltp: 80,
    min_fico: 680,
    min_experience_years: 2,
    citizenship_required: "us_citizen",
    appraisal_required: true,
    property_types: ["sfr", "mfr_2_4"],
    is_active: true,
  },
  {
    id: "rtl_balance_sheet",
    name: "RTL Balance Sheet",
    type: "rtl_balance_sheet",
    description: "Higher limits with balance sheet flexibility and leverage adjusters",
    interest_rate: 10.25,
    origination_pts: 2.5,
    max_ltv: 65,
    max_ltc: 70,
    max_ltp: 75,
    min_fico: 660,
    min_experience_years: 1,
    citizenship_required: "us_citizen",
    appraisal_required: true,
    property_types: ["sfr", "mfr_2_4"],
    adjusters: [
      {
        key: "strong_reserves",
        label: "Strong Liquid Reserves",
        description: "$500k+ liquid reserves",
        ltc_impact: 2,
        ltv_impact: 1,
      },
      {
        key: "high_net_worth",
        label: "High Net Worth",
        description: "$5M+ net worth",
        ltc_impact: 3,
        ltv_impact: 2,
      },
      {
        key: "experienced_developer",
        label: "Experienced Developer",
        description: "5+ year portfolio with $50M+ volume",
        ltc_impact: 2,
        ltp_impact: 2,
      },
    ],
    is_active: true,
  },
  {
    id: "dscr_standard",
    name: "DSCR Standard",
    type: "dscr_standard",
    description: "Rental property financing with 1.25x DSCR minimum",
    interest_rate: 8.75,
    origination_pts: 1.5,
    max_ltv: 75,
    max_ltc: 85,
    max_ltp: 90,
    min_fico: 700,
    citizenship_required: "us_citizen",
    appraisal_required: true,
    property_types: ["sfr", "mfr_2_4", "condo"],
    is_active: true,
  },
];
