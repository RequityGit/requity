export const DSCR_PROPERTY_TYPES = [
  { value: "sfr", label: "Single Family (SFR)" },
  { value: "2_4_unit", label: "2-4 Unit" },
  { value: "condo", label: "Condo" },
  { value: "nw_condo", label: "Non-Warrantable Condo" },
  { value: "condotel", label: "Condotel" },
  { value: "pud", label: "PUD" },
  { value: "5_10_unit", label: "5-10 Unit" },
  { value: "rural", label: "Rural" },
] as const;

export const DSCR_LOAN_PURPOSES = [
  { value: "purchase", label: "Purchase" },
  { value: "rate_term", label: "Rate & Term Refinance" },
  { value: "cashout", label: "Cash-Out Refinance" },
] as const;

export const DSCR_BORROWER_TYPES = [
  { value: "us_citizen", label: "US Citizen" },
  { value: "permanent_resident", label: "Permanent Resident" },
  { value: "non_perm_resident", label: "Non-Perm Resident Alien" },
  { value: "foreign_national", label: "Foreign National" },
] as const;

export const DSCR_DOC_TYPES = [
  { value: "dscr_only", label: "DSCR Only (No Doc)" },
  { value: "full_doc", label: "Full Doc" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "asset_qualifier", label: "Asset Qualifier" },
  { value: "p_and_l", label: "P&L Only" },
] as const;

export const DSCR_PREPAY_OPTIONS = [
  { value: "fixed_5yr", label: "5yr Fixed" },
  { value: "declining_5yr", label: "5yr Declining" },
  { value: "fixed_4yr", label: "4yr Fixed" },
  { value: "declining_4yr", label: "4yr Declining" },
  { value: "fixed_3yr", label: "3yr Fixed" },
  { value: "declining_3yr", label: "3yr Declining" },
  { value: "fixed_2yr", label: "2yr Fixed" },
  { value: "declining_2yr", label: "2yr Declining" },
  { value: "fixed_1yr", label: "1yr Fixed" },
  { value: "no_prepay", label: "No Prepay Penalty" },
  { value: "flexible", label: "Show All Options" },
] as const;

export const DSCR_LOCK_PERIODS = [
  { value: 30, label: "30 Days" },
  { value: 45, label: "45 Days" },
  { value: 60, label: "60 Days" },
] as const;

export const DSCR_VESTING_TYPES = [
  { value: "individual", label: "Individual" },
  { value: "llc", label: "LLC" },
  { value: "trust", label: "Trust" },
  { value: "corporation", label: "Corporation" },
] as const;

export const DSCR_DEAL_STATUSES = [
  { value: "draft", label: "Draft" },
  { value: "quoted", label: "Quoted" },
  { value: "submitted", label: "Submitted" },
  { value: "locked", label: "Locked" },
  { value: "closed", label: "Closed" },
  { value: "dead", label: "Dead" },
] as const;

export const DSCR_LLPA_CATEGORIES = [
  { value: "property_type", label: "Property Type" },
  { value: "loan_amount", label: "Loan Amount" },
  { value: "loan_purpose", label: "Loan Purpose" },
  { value: "dscr_ratio", label: "DSCR Ratio" },
  { value: "prepay_penalty", label: "Prepayment Penalty" },
  { value: "interest_only", label: "Interest Only" },
  { value: "borrower_type", label: "Borrower Type" },
  { value: "income_doc", label: "Income Documentation" },
  { value: "escrow_waiver", label: "Escrow Waiver" },
  { value: "rental_type", label: "Rental Type" },
  { value: "credit_grade", label: "Credit Grade" },
  { value: "state_specific", label: "State Specific" },
  { value: "lock_extension", label: "Lock Extension" },
  { value: "other", label: "Other" },
] as const;

// LTV band definitions used by the fixed-column price adjustment table
export const LTV_BANDS = [
  { key: "adj_ltv_0_50", min: 0, max: 50, label: "0-50%" },
  { key: "adj_ltv_50_55", min: 50.01, max: 55, label: "50.01-55%" },
  { key: "adj_ltv_55_60", min: 55.01, max: 60, label: "55.01-60%" },
  { key: "adj_ltv_60_65", min: 60.01, max: 65, label: "60.01-65%" },
  { key: "adj_ltv_65_70", min: 65.01, max: 70, label: "65.01-70%" },
  { key: "adj_ltv_70_75", min: 70.01, max: 75, label: "70.01-75%" },
  { key: "adj_ltv_75_80", min: 75.01, max: 80, label: "75.01-80%" },
  { key: "adj_ltv_80_85", min: 80.01, max: 85, label: "80.01-85%" },
  { key: "adj_ltv_85_90", min: 85.01, max: 90, label: "85.01-90%" },
] as const;

// States where Requity does NOT lend
export const REQUITY_EXCLUDED_STATES = ["CA", "HI", "AK"];

export type LtvBandKey = (typeof LTV_BANDS)[number]["key"];
