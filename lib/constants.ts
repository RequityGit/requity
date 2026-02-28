// ---------------------------------------------------------------------------
// Loan Stages
// ---------------------------------------------------------------------------

export const LOAN_STAGES = [
  "lead",
  "underwriting",
  "approved",
  "docs_out",
  "closed",
  "funded",
  "servicing",
  "payoff",
  "default",
  "reo",
  "paid_off",
] as const;

export type LoanStage = (typeof LOAN_STAGES)[number];

export const LOAN_STAGE_LABELS: Record<LoanStage, string> = {
  lead: "Lead",
  underwriting: "Underwriting",
  approved: "Approved",
  docs_out: "Docs Out",
  closed: "Closed",
  funded: "Funded",
  servicing: "Servicing",
  payoff: "Payoff",
  default: "Default",
  reo: "REO",
  paid_off: "Paid Off",
};

// ---------------------------------------------------------------------------
// Document Types
// ---------------------------------------------------------------------------

export const DOCUMENT_TYPES = [
  { value: "k1", label: "K-1" },
  { value: "distribution_statement", label: "Distribution Statement" },
  { value: "capital_call_notice", label: "Capital Call Notice" },
  { value: "investor_report", label: "Investor Report" },
  { value: "loan_agreement", label: "Loan Agreement" },
  { value: "closing_docs", label: "Closing Documents" },
  { value: "payoff_letter", label: "Payoff Letter" },
  { value: "draw_approval", label: "Draw Approval" },
  { value: "appraisal", label: "Appraisal" },
  { value: "insurance", label: "Insurance" },
  { value: "title", label: "Title" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Loan Types
// ---------------------------------------------------------------------------

export const LOAN_TYPES = [
  { value: "bridge_residential", label: "Bridge - Residential" },
  { value: "bridge_commercial", label: "Bridge - Commercial" },
  { value: "fix_and_flip", label: "Fix & Flip" },
  { value: "ground_up", label: "Ground-Up Construction" },
  { value: "dscr", label: "DSCR Rental" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Fund Types
// ---------------------------------------------------------------------------

export const FUND_TYPES = [
  { value: "debt", label: "Debt Fund" },
  { value: "equity", label: "Equity Fund" },
  { value: "hybrid", label: "Hybrid Fund" },
] as const;

// ---------------------------------------------------------------------------
// Distribution Types
// ---------------------------------------------------------------------------

export const DISTRIBUTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "return_of_capital", label: "Return of Capital" },
  { value: "gain", label: "Capital Gain" },
] as const;

// ---------------------------------------------------------------------------
// Status Colors
// ---------------------------------------------------------------------------

export const STATUS_COLORS: Record<string, string> = {
  // Loan stages
  application: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  underwriting: "bg-purple-100 text-purple-800",
  conditional_approval: "bg-amber-100 text-amber-800",
  clear_to_close: "bg-teal-100 text-teal-800",
  closing: "bg-cyan-100 text-cyan-800",
  funded: "bg-green-100 text-green-800",
  servicing: "bg-emerald-100 text-emerald-800",
  payoff: "bg-gray-100 text-gray-800",
  default: "bg-red-100 text-red-800",

  // Generic statuses
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
  overdue: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  draft: "bg-slate-100 text-slate-800",
};
