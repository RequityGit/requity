// ── Company 360 Type Definitions ──

export interface CompanyDetailData {
  id: string;
  name: string;
  company_type: string;
  company_types: string[] | null;
  company_subtype: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  is_active: boolean | null;
  primary_contact_id: string | null;
  referral_contact_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  lender_programs: string[] | null;
  asset_types: string[] | null;
  geographies: string[] | null;
  company_capabilities: string[] | null;
  other_names: string | null;
  source: string | null;
  title_company_verified: boolean | null;
}

export interface CompanyContactData {
  id: string;
  contact_number: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_function: string | null;
  last_contacted_at: string | null;
  is_primary: boolean;
}

export interface CompanyActivityData {
  id: string;
  activity_type: string;
  subject: string | null;
  description: string | null;
  direction: string | null;
  call_duration_seconds: number | null;
  performed_by_name: string | null;
  created_at: string;
}

export interface CompanyFileData {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number | null;
  mime_type: string | null;
  storage_path: string;
  uploaded_by_name: string | null;
  uploaded_at: string | null;
  notes: string | null;
}

export interface CompanyTaskData {
  id: string;
  subject: string;
  description: string | null;
  task_type: string;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to: string | null;
  assigned_to_name: string | null;
  completed_at: string | null;
}

export interface CompanyNoteData {
  id: string;
  body: string;
  author_name: string | null;
  author_id: string | null;
  is_pinned: boolean;
  created_at: string;
}

export interface CompanyWireData {
  id: string;
  bank_name: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  wire_type: string;
  updated_at: string;
  updated_by: string | null;
}

export interface CompanyFollowerData {
  id: string;
  user_id: string;
  user_name: string | null;
}

export interface CompanyDealData {
  id: string;
  name: string;
  stage: string | null;
  amount: number | null;
  rate: number | null;
  ltv: number | null;
  type: string | null;
  borrower_name: string | null;
}

export interface CompanyQuoteData {
  id: string;
  deal_name: string | null;
  product_name: string | null;
  amount: number | null;
  rate: number | null;
  origination: number | null;
  ltv: number | null;
  term: string | null;
  status: string | null;
  submitted_at: string | null;
  responded_at: string | null;
}

export interface TabBadgeCounts {
  contacts: number;
  activities: number;
  deals: number;
  files: number;
  openTasks: number;
  notes: number;
}

// ── Config Maps ──

export const COMPANY_TYPE_CONFIG: Record<
  string,
  { label: string; color: string }
> = {
  borrower: { label: "Borrower", color: "#22A861" },
  brokerage: { label: "Capital Markets Broker", color: "#8B5CF6" },
  bank: { label: "Bank", color: "#3B82F6" },
  agency_lender: { label: "Agency Lender", color: "#3B82F6" },
  lender: { label: "Private / Non-bank Lender", color: "#3B82F6" },
  correspondent: { label: "Correspondent", color: "#3B82F6" },
  equity_investor: { label: "Equity Investor", color: "#22A861" },
  title_company: { label: "Title Company", color: "#E5930E" },
  insurance: { label: "Insurance", color: "#22A861" },
  law_firm: { label: "Attorney", color: "#6B6B6B" },
  amc: { label: "AMC", color: "#E5930E" },
  appraisal: { label: "Appraisal", color: "#E5930E" },
  software: { label: "Software", color: "#3B82F6" },
  accounting_firm: { label: "Accounting Firm", color: "#6B6B6B" },
  other: { label: "Other", color: "#8B8B8B" },
};

export const SUBTYPE_LABELS: Record<string, string> = {
  bank: "Bank",
  agency_lender: "Agency Lender",
  private_lender: "Private Lender",
  correspondent: "Correspondent",
  credit_union: "Credit Union",
};

export const PROGRAM_LABELS: Record<string, string> = {
  bridge: "Bridge",
  rtl: "RTL (Fix & Flip)",
  dscr: "DSCR",
  ground_up_construction: "Ground-Up Construction",
  commercial_bridge: "Commercial Bridge",
  multifamily: "Multifamily",
  sba: "SBA",
};

export const ASSET_LABELS: Record<string, string> = {
  sfr: "SFR",
  condo: "Condo",
  townhouse: "Townhouse",
  duplex: "Duplex",
  triplex: "Triplex",
  fourplex: "Fourplex",
  multifamily_5_plus: "Multifamily (5+)",
  mixed_use: "Mixed-Use",
  retail: "Retail",
  office: "Office",
  industrial: "Industrial",
  mobile_home_park: "MHC",
  land: "Land",
  rv_campground: "RV Park",
  self_storage: "Self-Storage",
  hotel_hospitality: "Hospitality",
  healthcare: "Healthcare",
  other: "Other",
};

export const CAPABILITY_LABELS: Record<string, string> = {
  agency_debt_placement: "Agency Debt Placement",
  bank_financing: "Bank Financing",
  dscr: "DSCR",
  equity_placement: "Equity Placement",
  guc: "GUC",
  hard_money_bridge: "Hard Money / Bridge Lending",
  cmbs: "CMBS",
  jv_equity: "JV Equity Investment",
  loan_servicing: "Loan Servicing",
  mortgage_brokerage: "Mortgage Brokerage",
  pref_equity: "Pref Equity Investment",
  rtl: "RTL",
  audit: "Audit",
  lender_finance: "Lender Finance",
  sba: "SBA",
  table_funding: "Table Funding",
  co_lending: "Co-Lending",
  warehouse: "Warehouse",
  note_buyer: "Note Buyer",
  direct: "Direct Lender",
  correspondent_lending: "Correspondent Lending",
};

export const FILE_TYPE_LABELS: Record<string, string> = {
  nda: "NDA",
  fee_agreement: "Fee Agreement",
  tear_sheet: "Tear Sheet",
  broker_agreement: "Broker Agreement",
  guidelines: "Guidelines",
  other: "Other",
};

export const FILE_TYPE_COLORS: Record<string, string> = {
  nda: "#E5930E",
  fee_agreement: "#22A861",
  tear_sheet: "#3B82F6",
  broker_agreement: "#E5930E",
  guidelines: "#6B6B6B",
  other: "#8B8B8B",
};

export const QUOTE_STATUS_CONFIG: Record<
  string,
  { color: string; label: string }
> = {
  accepted: { color: "#22A861", label: "Accepted" },
  declined: { color: "#E5453D", label: "Declined" },
  countered: { color: "#E5930E", label: "Countered" },
  pending: { color: "#8B8B8B", label: "Pending" },
  expired: { color: "#8B8B8B", label: "Expired" },
};
