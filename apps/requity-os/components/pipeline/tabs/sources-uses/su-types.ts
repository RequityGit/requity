export interface DebtTranche {
  id?: string;
  tranche_name: string;
  tranche_type: "senior" | "mezz" | "takeout";
  loan_amount: number;
  interest_rate: number;
  term_years: number;
  amortization_years: number;
  io_period_months: number;
  is_io: boolean;
  origination_fee_pct: number;
  ltv_pct: number;
  prepay_type: string;
  lender_name: string;
  loan_type: string;
  // takeout-specific
  max_ltv_constraint: number;
  dscr_floor_constraint: number;
  takeout_year: number;
  appraisal_cap_rate: number;
  sort_order: number;
}

export interface ClosingCostRow {
  id?: string;
  line_item: string;
  amount: number;
  notes: string | null;
  sort_order: number;
}

export interface ReserveRow {
  id?: string;
  line_item: string;
  amount: number;
  notes: string | null;
  sort_order: number;
}

export interface ScopeOfWorkRow {
  id?: string;
  item_name: string;
  description: string | null;
  estimated_cost: number;
  category: string | null;
  qty: number;
  unit_cost: number;
  timeline: string | null;
  budget_type: "value_add" | "ground_up";
  sort_order: number;
}

export interface SUConfig {
  budget_mode: "value_add" | "ground_up";
  takeout_enabled: boolean;
  value_add_contingency_pct: number;
  ground_up_gc_fee_pct: number;
  ground_up_dev_fee_pct: number;
  ground_up_contingency_pct: number;
}

export interface CapitalStackMetrics {
  seniorLoan: number;
  mezzLoan: number;
  totalDebt: number;
  totalEquity: number;
  totalCapitalization: number;
  blendedLTV: number;
  combinedDSCR: number;
  blendedRate: number;
  seniorAnnualDS: number;
  mezzAnnualDS: number;
  totalAnnualDS: number;
}

export const DEFAULT_CLOSING_COST_LABELS = [
  "Title & Escrow",
  "Appraisal",
  "Environmental (Phase I)",
  "Survey",
  "Legal (Borrower Counsel)",
  "Lender Legal",
  "Insurance (1st Year Premium)",
  "Transfer / Recording Taxes",
  "Recording Fees",
  "Other / Misc",
] as const;

export const DEFAULT_RESERVE_LABELS = [
  "Operating Reserve",
  "Interest Reserve",
  "Tax & Insurance Escrow",
  "Replacement Reserve",
] as const;
