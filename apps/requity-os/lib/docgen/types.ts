// ─── Document Generation Types ───

/** Brand color/font constants for generated documents (NOT portal UI) */
export interface BrandConfig {
  navy: string;
  gold: string;
  cream: string;
  white: string;
  darkText: string;
  gray: string;
  lightGray: string;
  headingFont: string;
  bodyFont: string;
}

/** Resolved logo data ready for embedding in PPTX/DOCX */
export interface LogoData {
  data: string; // base64 PNG data URL
  aspect: number; // width / height ratio
}

// ─── Credit Memo Types ───

export interface LoanTerms {
  loan_amount?: number;
  loan_type?: string;
  term_months?: number;
  extension_options?: string;
  interest_rate?: number;
  rate_type?: string;
  index_spread?: string;
  rate_floor?: number;
  amortization?: string;
  lien_position?: string;
  recourse?: string;
  origination_fee_pct?: number;
  origination_fee_amt?: number;
  exit_fee_pct?: number;
  exit_fee_amt?: number;
  prepayment?: string;
  interest_reserve?: string;
  capex_reserve?: string;
  tax_insurance_escrow?: string;
  guaranty?: string;
  funding_source?: string;
}

export interface OperatingStatementLine {
  label: string;
  t12?: number;
  current?: number;
  pro_forma?: number;
}

export interface OperatingStatement {
  revenue_lines?: OperatingStatementLine[];
  expense_lines?: OperatingStatementLine[];
  noi_t12?: number;
  noi_current?: number;
  noi_pro_forma?: number;
  dscr?: number;
  debt_yield?: number;
  expense_ratio?: number;
}

export interface SourcesAndUses {
  sources?: Array<{ label: string; amount: number }>;
  uses?: Array<{ label: string; amount: number }>;
}

export interface StressScenario {
  scenario: string;
  assumption: string;
  dscr: number;
  ltv?: number;
  result: "pass" | "marginal" | "fail";
}

export interface RiskFactor {
  risk: string;
  mitigant: string;
}

export interface GuarantorDetail {
  name: string;
  ownership_pct?: number;
  net_worth?: number;
  liquidity?: number;
  credit_score?: number;
  bankruptcies?: string;
  litigation?: string;
  background_check?: string;
}

export interface SponsorProfile {
  name?: string;
  entity_type?: string;
  years_experience?: number;
  total_deals?: number;
  total_units?: number;
  aum?: number;
}

export interface ThirdPartyReport {
  report: string;
  provider?: string;
  date?: string;
  key_finding?: string;
}

export interface ApprovalRole {
  role: string;
  name?: string;
  decision?: "pending" | "approved" | "declined";
  date?: string;
}

export interface FeeIncome {
  label: string;
  amount: number;
}

export interface CapitalImprovementItem {
  item: string;
  budget?: number;
  timeline?: string;
  status?: string;
}

export interface ComparableTransaction {
  property_name?: string;
  sale_price?: number;
  price_per_unit?: number;
  cap_rate?: number;
  date?: string;
  notes?: string;
}

export interface RequityGuidelines {
  max_ltv?: number;
  max_ltc?: number;
  min_dscr?: number;
  min_debt_yield?: number;
  min_net_worth_multiple?: number;
  min_liquidity_months?: number;
  min_sponsor_deals?: number;
}

/** Full credit memo data matching deal_credit_memos table */
export interface CreditMemoData {
  id: string;
  deal_id: string;
  version: number;
  status: "draft" | "in_review" | "approved" | "superseded";
  recommendation?: "approve" | "approve_with_conditions" | "decline";
  recommendation_conditions?: string;
  recommendation_narrative?: string;
  risk_rating?: "green" | "yellow" | "red";
  credit_committee_date?: string;
  prepared_by?: string;
  loan_terms?: LoanTerms;
  requity_guidelines?: RequityGuidelines;
  metrics_exceptions_narrative?: string;
  property_condition_narrative?: string;
  comparable_transactions?: ComparableTransaction[];
  operating_statement?: OperatingStatement;
  sources_and_uses?: SourcesAndUses;
  sponsor_profile?: SponsorProfile;
  guarantor_details?: GuarantorDetail[];
  sponsor_track_record_narrative?: string;
  business_plan_narrative?: string;
  capital_improvement_budget?: CapitalImprovementItem[];
  exit_strategy_narrative?: string;
  stress_scenarios?: StressScenario[];
  stress_narrative?: string;
  third_party_reports?: ThirdPartyReport[];
  risk_factors?: RiskFactor[];
  portfolio_impact_narrative?: string;
  conditions_precedent?: string[];
  ongoing_covenants?: string[];
  approval_roles?: ApprovalRole[];
  committee_notes?: string;
  fee_income?: FeeIncome[];
  generated_file_url?: string;
  gdrive_file_id?: string;
  storage_path?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ─── Investor Deck Types ───

/** Full investor deck data matching deal_investor_decks table */
export interface InvestorDeckData {
  id: string;
  deal_id: string;
  version: number;
  status: "draft" | "in_review" | "approved" | "superseded";
  executive_summary?: string;
  property_overview_narrative?: string;
  market_analysis_narrative?: string;
  value_add_narrative?: string;
  investment_terms_narrative?: string;
  minimum_investment?: number;
  target_return?: string;
  fund_name?: string;
  investment_structure?: string;
  property_photos?: string[];
  generated_file_url?: string;
  gdrive_file_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

// ─── Deal Data for Document Generation ───

export interface PropertyData {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  county?: string;
  property_type?: string;
  acreage?: number;
  total_units?: number;
  utilities?: string;
  year_built?: number;
  lot_size?: string;
  zoning?: string;
  [key: string]: unknown;
}

export interface UwData {
  ltv_bpo?: number;
  ltc?: number;
  dscr?: number;
  debt_yield?: number;
  noi_t12?: number;
  purchase_price?: number;
  bpo_value?: number;
  interest_rate?: number;
  loan_term_months?: number;
  guarantor_combined_net_worth?: number;
  total_assets?: number;
  bridge_rationale?: string;
  market_overview?: string;
  [key: string]: unknown;
}

/** Unified deal data shape for document generators */
export interface DealDocData {
  id: string;
  name: string;
  amount?: number;
  asset_class?: string;
  capital_side?: string;
  stage?: string;
  property_data?: PropertyData;
  uw_data?: UwData;
  primary_contact?: {
    first_name?: string;
    last_name?: string;
    email?: string;
  };
}
