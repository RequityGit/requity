// ============================================================================
// Commercial Underwriting — TypeScript Types
// ============================================================================

export const COMMERCIAL_PROPERTY_TYPES = [
  { value: "multifamily", label: "Multifamily", basis: "per_unit" },
  { value: "office", label: "Office", basis: "per_sf" },
  { value: "retail", label: "Retail", basis: "per_sf" },
  { value: "industrial", label: "Industrial", basis: "per_sf" },
  { value: "self_storage", label: "Self Storage", basis: "per_sf" },
  { value: "hospitality", label: "Hospitality", basis: "per_room" },
  { value: "healthcare", label: "Healthcare", basis: "per_sf" },
  { value: "mobile_home_park", label: "Mobile Home Park", basis: "per_pad" },
  { value: "rv_campground", label: "RV / Campground", basis: "per_site" },
  { value: "marina", label: "Marina", basis: "per_slip" },
  { value: "vacation_rental", label: "Vacation Rental", basis: "per_room" },
  { value: "mixed_use", label: "Mixed Use", basis: "per_sf" },
  { value: "warehouse", label: "Warehouse", basis: "per_sf" },
  { value: "specialty", label: "Specialty", basis: "per_unit" },
  { value: "other", label: "Other", basis: "per_unit" },
] as const;

export type CommercialPropertyType = (typeof COMMERCIAL_PROPERTY_TYPES)[number]["value"];

export const LEASE_TYPES = [
  "Gross",
  "Modified Gross",
  "NNN",
  "NN",
  "N",
  "Percentage",
  "Ground",
] as const;

export type LeaseType = (typeof LEASE_TYPES)[number];

export const ANCILLARY_PRESETS = [
  "Laundry",
  "Vending",
  "Dump Station",
  "Storage",
  "Resort Fees",
  "F&B",
  "Event Space",
  "Equipment Rental",
  "Pet Fees",
  "Late/Cancel Fees",
  "Utility Reimbursement",
  "Other 1",
  "Other 2",
] as const;

export const UW_STATUSES = ["draft", "in_review", "approved", "rejected"] as const;
export type UWStatus = (typeof UW_STATUSES)[number];

export const EXPENSE_CATEGORIES = [
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

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  taxes: "Real Estate Taxes",
  insurance: "Insurance",
  utilities: "Utilities",
  repairs: "Repairs & Maintenance",
  contract_services: "Contract Services",
  payroll: "Payroll",
  marketing: "Marketing",
  ga: "General & Administrative",
  reserve: "Replacement Reserve",
};

// Property type alias mapping for expense defaults
export function getExpenseDefaultsKey(propertyType: string): string | null {
  const aliases: Record<string, string> = {
    vacation_rental: "hospitality",
    mixed_use: "industrial",
    warehouse: "industrial",
  };
  const mapped = aliases[propertyType] ?? propertyType;
  const validTypes = [
    "multifamily", "office", "retail", "industrial", "self_storage",
    "hospitality", "healthcare", "mobile_home_park", "rv_campground", "marina",
  ];
  return validTypes.includes(mapped) ? mapped : null;
}

// Lease-based property types show rent roll table
export const LEASE_BASED_TYPES: CommercialPropertyType[] = [
  "multifamily", "office", "retail", "industrial", "self_storage",
  "healthcare", "mixed_use", "warehouse",
];

// Occupancy-based property types show occupancy table
export const OCCUPANCY_BASED_TYPES: CommercialPropertyType[] = [
  "hospitality", "rv_campground", "marina", "vacation_rental",
];

export function isLeaseBased(type: string): boolean {
  return LEASE_BASED_TYPES.includes(type as CommercialPropertyType) || type === "mixed_use";
}

export function isOccupancyBased(type: string): boolean {
  return OCCUPANCY_BASED_TYPES.includes(type as CommercialPropertyType) || type === "mixed_use";
}

// ------------ Data Row Types ------------

export interface RentRollRow {
  id?: string;
  sort_order: number;
  unit_number: string;
  tenant_name: string;
  sf: number;
  beds_type: string;
  baths: number;
  lease_start: string;
  lease_end: string;
  lease_type: LeaseType;
  current_monthly_rent: number;
  cam_nnn: number;
  other_income: number;
  poh_income: number;
  is_vacant: boolean;
  market_rent: number;
  market_cam_nnn: number;
  market_other: number;
}

export interface OccupancyRow {
  id?: string;
  sort_order: number;
  space_type: string;
  count: number;
  rate_per_night: number;
  occupancy_pct: number;
  operating_days: number | null;
  target_rate: number;
  target_occupancy_pct: number;
  occupancy_pct_yr1: number | null;
  occupancy_pct_yr2: number | null;
  occupancy_pct_yr3: number | null;
  occupancy_pct_yr4: number | null;
  occupancy_pct_yr5: number | null;
}

export interface AncillaryRow {
  id?: string;
  sort_order: number;
  income_source: string;
  current_annual_amount: number;
  stabilized_annual_amount: number;
}

export interface ExpenseDefault {
  property_type: string;
  expense_category: string;
  per_unit_amount: number;
  basis: string;
  range_low: number | null;
  range_high: number | null;
}

export interface T12Data {
  gpi: number;
  vacancy_pct: number;
  bad_debt_pct: number;
  mgmt_fee: number;
  taxes: number;
  insurance: number;
  utilities: number;
  repairs: number;
  contract_services: number;
  payroll: number;
  marketing: number;
  ga: number;
  replacement_reserve: number;
}

export interface YearAssumptions {
  rent_growth: number[];
  expense_growth: number[];
  vacancy_pct: number[];
  bad_debt_pct: number;
  stabilized_vacancy_pct: number;
  mgmt_fee_pct: number;
}

export interface FinancingTerms {
  bridge_loan_amount: number;
  bridge_rate: number;
  bridge_term_months: number;
  bridge_amortization_months: number;
  bridge_io_months: number;
  bridge_origination_pts: number;
  exit_loan_amount: number;
  exit_rate: number;
  exit_amortization_years: number;
  exit_io_months: number;
}

export interface ProFormaYear {
  year: number; // 0=T12, 1-5=projected, 6=stabilized
  gpi: number;
  vacancy: number;
  bad_debt: number;
  egi: number;
  mgmt_fee: number;
  taxes: number;
  insurance: number;
  utilities: number;
  repairs: number;
  contract_services: number;
  payroll: number;
  marketing: number;
  ga: number;
  replacement_reserve: number;
  total_opex: number;
  noi: number;
  debt_service: number;
  net_cash_flow: number;
  dscr: number;
  cap_rate: number;
  expense_ratio: number;
  cumulative_cash_flow: number;
}

export interface ExitAnalysis {
  exit_noi: number;
  exit_value: number;
  disposition_costs: number;
  exit_loan_balance: number;
  net_proceeds: number;
  equity_invested: number;
  levered_irr: number;
}

export interface POHAnalysis {
  poh_rental_income: number;
  poh_expenses: number;
  poh_noi: number;
  lot_rent_noi: number;
  total_noi: number;
  lot_only_dscr: number;
  total_dscr: number;
}

export interface ExpenseOverrides {
  mgmt_fee_pct: number;
  taxes: number | null;
  insurance: number | null;
  utilities: number | null;
  repairs: number | null;
  contract_services: number | null;
  payroll: number | null;
  marketing: number | null;
  ga: number | null;
  reserve: number | null;
}

// ------------ T12 Historicals Types ------------

export const T12_STANDARDIZED_INCOME_CATEGORIES = [
  "gross_potential_rent",
  "vacancy_loss",
  "bad_debt",
  "concessions",
  "other_income",
] as const;

export const T12_STANDARDIZED_EXPENSE_CATEGORIES = [
  "management_fee",
  "real_estate_taxes",
  "insurance",
  "water_sewer",
  "electricity",
  "gas",
  "repairs_maintenance",
  "contract_services",
  "payroll",
  "marketing",
  "general_administrative",
  "replacement_reserve",
  "other_misc",
] as const;

export const T12_ALL_CATEGORIES = [
  ...T12_STANDARDIZED_INCOME_CATEGORIES,
  ...T12_STANDARDIZED_EXPENSE_CATEGORIES,
] as const;

export type T12Category = (typeof T12_ALL_CATEGORIES)[number];

export const T12_CATEGORY_LABELS: Record<T12Category, string> = {
  gross_potential_rent: "Gross Potential Rent",
  vacancy_loss: "Vacancy Loss",
  bad_debt: "Bad Debt / Write-Offs",
  concessions: "Concessions",
  other_income: "Other Income",
  management_fee: "Management Fee",
  real_estate_taxes: "Real Estate Taxes",
  insurance: "Insurance",
  water_sewer: "Water & Sewer",
  electricity: "Electricity",
  gas: "Gas",
  repairs_maintenance: "Repairs & Maintenance",
  contract_services: "Contract Services",
  payroll: "On-Site Management (Payroll)",
  marketing: "Marketing",
  general_administrative: "General & Administrative",
  replacement_reserve: "Replacement Reserve",
  other_misc: "Other / Miscellaneous",
};

export const T12_CATEGORY_IS_INCOME: Record<T12Category, boolean> = {
  gross_potential_rent: true,
  vacancy_loss: true,
  bad_debt: true,
  concessions: true,
  other_income: true,
  management_fee: false,
  real_estate_taxes: false,
  insurance: false,
  water_sewer: false,
  electricity: false,
  gas: false,
  repairs_maintenance: false,
  contract_services: false,
  payroll: false,
  marketing: false,
  general_administrative: false,
  replacement_reserve: false,
  other_misc: false,
};

// Auto-mapping rules: label patterns -> standardized category
export const T12_AUTO_MAP_RULES: { patterns: string[]; category: T12Category }[] = [
  { patterns: ["rent", "rental income", "gross potential", "gpr", "base rent"], category: "gross_potential_rent" },
  { patterns: ["vacancy", "vacant"], category: "vacancy_loss" },
  { patterns: ["bad debt", "write-off", "write off", "collections loss"], category: "bad_debt" },
  { patterns: ["concession"], category: "concessions" },
  { patterns: ["other income", "laundry", "parking", "pet fee", "late fee", "application fee", "misc income", "miscellaneous income"], category: "other_income" },
  { patterns: ["management fee", "mgmt fee", "property management"], category: "management_fee" },
  { patterns: ["tax", "property tax", "real estate tax", "re tax"], category: "real_estate_taxes" },
  { patterns: ["insurance", "ins ", "property insurance", "liability insurance", "flood insurance", "renters insurance"], category: "insurance" },
  { patterns: ["water", "sewer", "water & sewer", "water/sewer"], category: "water_sewer" },
  { patterns: ["electric", "electricity"], category: "electricity" },
  { patterns: ["gas", "propane", "natural gas"], category: "gas" },
  { patterns: ["repair", "maintenance", "r&m", "repairs & maintenance"], category: "repairs_maintenance" },
  { patterns: ["contract", "landscap", "pest", "security", "janitorial", "cleaning", "elevator", "professional fee"], category: "contract_services" },
  { patterns: ["payroll", "salary", "salaries", "wages", "personnel", "on-site", "onsite"], category: "payroll" },
  { patterns: ["marketing", "advertising", "promotion", "leasing"], category: "marketing" },
  { patterns: ["office", "admin", "g&a", "general & admin", "general and admin", "administrative"], category: "general_administrative" },
  { patterns: ["replacement", "reserve", "capex", "capital reserve"], category: "replacement_reserve" },
];

// Maps T12 standardized categories to the simpler ProForma expense keys
export const T12_TO_PROFORMA_MAP: Partial<Record<T12Category, keyof T12Data>> = {
  gross_potential_rent: "gpi",
  management_fee: "mgmt_fee",
  real_estate_taxes: "taxes",
  insurance: "insurance",
  water_sewer: "utilities",
  electricity: "utilities",
  gas: "utilities",
  repairs_maintenance: "repairs",
  contract_services: "contract_services",
  payroll: "payroll",
  marketing: "marketing",
  general_administrative: "ga",
  replacement_reserve: "replacement_reserve",
};

export interface T12LineItem {
  id: string;
  t12_upload_id: string;
  original_row_label: string;
  original_category: string | null;
  amount_month_1: number | null;
  amount_month_2: number | null;
  amount_month_3: number | null;
  amount_month_4: number | null;
  amount_month_5: number | null;
  amount_month_6: number | null;
  amount_month_7: number | null;
  amount_month_8: number | null;
  amount_month_9: number | null;
  amount_month_10: number | null;
  amount_month_11: number | null;
  amount_month_12: number | null;
  annual_total: number | null;
  is_income: boolean;
  sort_order: number | null;
}

export interface T12FieldMapping {
  id: string;
  t12_upload_id: string;
  t12_line_item_id: string;
  mapped_category: T12Category;
  mapped_subcategory: string | null;
  is_excluded: boolean;
  exclusion_reason: string | null;
}

export interface T12Upload {
  id: string;
  loan_id: string;
  file_name: string;
  file_url: string;
  upload_date: string | null;
  period_start: string;
  period_end: string;
  source_label: string | null;
  uploaded_by: string | null;
  status: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface T12Version {
  id: string;
  loan_id: string;
  t12_upload_id: string;
  version_number: number;
  version_label: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export interface T12Override {
  id: string;
  t12_upload_id: string;
  category: string;
  override_annual_total: number;
}

export interface T12HistoricalsState {
  upload: T12Upload | null;
  lineItems: T12LineItem[];
  mappings: T12FieldMapping[];
  versions: T12Version[];
  overrides: T12Override[];
}

// Full UW state for the form/context
export interface CommercialUWState {
  id?: string;
  loan_id: string;
  status: UWStatus;
  property_type: CommercialPropertyType;
  total_units_spaces: number;
  total_sf: number;
  year_built: number;
  operating_days_per_year: number;
  rent_roll: RentRollRow[];
  occupancy_rows: OccupancyRow[];
  ancillary_rows: AncillaryRow[];
  t12: T12Data | null;
  expense_overrides: ExpenseOverrides;
  assumptions: YearAssumptions;
  financing: FinancingTerms;
  purchase_price: number;
  going_in_cap_rate: number;
  exit_cap_rate: number;
  disposition_cost_pct: number;
  equity_invested: number;
  poh_rental_income: number;
  poh_expense_ratio: number;
}
