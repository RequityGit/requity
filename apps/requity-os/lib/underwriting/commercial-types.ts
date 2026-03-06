/**
 * Commercial Underwriting Sandbox — TypeScript types
 *
 * These types define the JSONB schema stored in loan_underwriting_versions
 * for the commercial model sandbox. Production loan-attached UW uses the
 * relational tables (commercial_underwriting, commercial_rent_roll, etc.).
 */

export interface RentRollUnit {
  unit_number: string;
  tenant_name: string;
  sf: number | null;
  current_monthly_rent: number | null;
  market_rent: number | null;
  cam_nnn: number | null;
  other_income: number | null;
  is_vacant: boolean;
}

export interface AncillaryItem {
  income_source: string;
  current_annual: number | null;
  stabilized_annual: number | null;
}

export interface CommercialInputs {
  // Property Information
  property_type: string | null;
  total_units: number | null;
  total_sf: number | null;
  year_built: number | null;

  // Rent Roll
  rent_roll: RentRollUnit[];

  // Ancillary Income
  ancillary_income: AncillaryItem[];

  // T12 Historical Expenses
  t12_gpi: number | null;
  t12_vacancy_pct: number | null;
  t12_bad_debt_pct: number | null;
  t12_mgmt_fee: number | null;
  t12_taxes: number | null;
  t12_insurance: number | null;
  t12_utilities: number | null;
  t12_repairs: number | null;
  t12_contract_services: number | null;
  t12_payroll: number | null;
  t12_marketing: number | null;
  t12_ga: number | null;
  t12_replacement_reserve: number | null;

  // Year 1 Expense Overrides (null = use T12 value)
  yr1_mgmt_fee_pct: number | null;
  yr1_taxes: number | null;
  yr1_insurance: number | null;
  yr1_utilities: number | null;
  yr1_repairs: number | null;
  yr1_contract: number | null;
  yr1_payroll: number | null;
  yr1_marketing: number | null;
  yr1_ga: number | null;
  yr1_reserve: number | null;

  // Growth Assumptions (%)
  rent_growth_yr1: number | null;
  rent_growth_yr2: number | null;
  rent_growth_yr3: number | null;
  rent_growth_yr4: number | null;
  rent_growth_yr5: number | null;
  expense_growth_yr1: number | null;
  expense_growth_yr2: number | null;
  expense_growth_yr3: number | null;
  expense_growth_yr4: number | null;
  expense_growth_yr5: number | null;

  // Vacancy Assumptions (%)
  vacancy_pct_yr1: number | null;
  vacancy_pct_yr2: number | null;
  vacancy_pct_yr3: number | null;
  vacancy_pct_yr4: number | null;
  vacancy_pct_yr5: number | null;
  stabilized_vacancy_pct: number | null;
  bad_debt_pct: number | null;

  // Bridge Loan Terms
  bridge_loan_amount: number | null;
  bridge_rate: number | null;
  bridge_term_months: number | null;
  bridge_io_months: number | null;
  bridge_origination_pts: number | null;

  // Exit Loan Terms
  exit_loan_amount: number | null;
  exit_rate: number | null;
  exit_amortization_years: number | null;
  exit_io_months: number | null;

  // Acquisition Details
  purchase_price: number | null;
  going_in_cap_rate: number | null;
  exit_cap_rate: number | null;
  disposition_cost_pct: number | null;
  equity_invested: number | null;
}

export interface ProFormaYear {
  year: number;
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
  ncf: number;
  dscr: number | null;
  cap_rate: number | null;
}

export interface CommercialOutputs {
  // Income Summary
  total_rent_roll_annual: number;
  total_market_annual: number;
  total_ancillary_current: number;
  total_ancillary_stabilized: number;
  current_gpi: number;
  stabilized_gpi: number;

  // Current Year Metrics
  current_vacancy: number;
  current_bad_debt: number;
  current_egi: number;
  current_total_opex: number;
  current_noi: number;

  // Key Ratios
  going_in_cap_rate: number | null;
  dscr: number | null;
  cash_on_cash: number | null;
  debt_yield: number | null;

  // Per-Unit / Per-SF
  price_per_unit: number | null;
  price_per_sf: number | null;
  noi_per_unit: number | null;

  // Debt Service
  annual_debt_service: number;
  monthly_debt_service: number;

  // Bridge Loan
  bridge_origination_fee: number;

  // 5-Year Pro Forma
  proforma: ProFormaYear[];
}

/** Property type options matching commercial_uw_assumptions seed data */
export const PROPERTY_TYPES = [
  { value: "multifamily", label: "Multifamily" },
  { value: "office", label: "Office" },
  { value: "retail", label: "Retail" },
  { value: "industrial", label: "Industrial" },
  { value: "self_storage", label: "Self Storage" },
  { value: "hospitality", label: "Hospitality" },
  { value: "healthcare", label: "Healthcare" },
  { value: "mobile_home_park", label: "Mobile Home Park" },
  { value: "rv_campground", label: "RV / Campground" },
  { value: "marina", label: "Marina" },
  { value: "vacation_rental", label: "Vacation Rental" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "warehouse", label: "Warehouse" },
  { value: "specialty", label: "Specialty" },
  { value: "other", label: "Other" },
] as const;

/** Default assumptions by property type (mirrors commercial_uw_assumptions seed) */
export const PROPERTY_TYPE_DEFAULTS: Record<string, {
  vacancy_pct: number;
  stabilized_vacancy_pct: number;
  bad_debt_pct: number;
  mgmt_fee_pct: number;
  rent_growth: [number, number, number, number, number];
  expense_growth: [number, number, number, number, number];
  going_in_cap_rate: number;
  exit_cap_rate: number;
  disposition_cost_pct: number;
}> = {
  multifamily: { vacancy_pct: 5, stabilized_vacancy_pct: 5, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [3, 3, 3, 3, 3], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 5.5, exit_cap_rate: 6.0, disposition_cost_pct: 2 },
  office: { vacancy_pct: 10, stabilized_vacancy_pct: 8, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [2, 2, 2.5, 2.5, 2.5], expense_growth: [2.5, 2.5, 2.5, 2.5, 2.5], going_in_cap_rate: 7.0, exit_cap_rate: 7.5, disposition_cost_pct: 2 },
  retail: { vacancy_pct: 8, stabilized_vacancy_pct: 6, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [2, 2, 2.5, 2.5, 2.5], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 6.5, exit_cap_rate: 7.0, disposition_cost_pct: 2 },
  industrial: { vacancy_pct: 5, stabilized_vacancy_pct: 5, bad_debt_pct: 0.5, mgmt_fee_pct: 6, rent_growth: [3, 3, 3, 3, 3], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 5.5, exit_cap_rate: 6.0, disposition_cost_pct: 1.5 },
  self_storage: { vacancy_pct: 10, stabilized_vacancy_pct: 8, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [3, 3, 3, 3, 3], expense_growth: [2.5, 2.5, 2.5, 2.5, 2.5], going_in_cap_rate: 6.0, exit_cap_rate: 6.5, disposition_cost_pct: 2 },
  hospitality: { vacancy_pct: 30, stabilized_vacancy_pct: 25, bad_debt_pct: 2, mgmt_fee_pct: 10, rent_growth: [3, 3, 3, 3, 3], expense_growth: [3, 3, 3, 3, 3], going_in_cap_rate: 8.0, exit_cap_rate: 8.5, disposition_cost_pct: 2.5 },
  healthcare: { vacancy_pct: 5, stabilized_vacancy_pct: 5, bad_debt_pct: 0.5, mgmt_fee_pct: 6, rent_growth: [2, 2, 2, 2, 2], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 7.0, exit_cap_rate: 7.5, disposition_cost_pct: 2 },
  mobile_home_park: { vacancy_pct: 5, stabilized_vacancy_pct: 5, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [3, 3, 3, 3, 3], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 6.0, exit_cap_rate: 6.5, disposition_cost_pct: 2 },
  rv_campground: { vacancy_pct: 25, stabilized_vacancy_pct: 20, bad_debt_pct: 1.5, mgmt_fee_pct: 10, rent_growth: [3, 3, 3, 3, 3], expense_growth: [2.5, 2.5, 2.5, 2.5, 2.5], going_in_cap_rate: 7.5, exit_cap_rate: 8.0, disposition_cost_pct: 2 },
  marina: { vacancy_pct: 10, stabilized_vacancy_pct: 8, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [2.5, 2.5, 2.5, 2.5, 2.5], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 7.0, exit_cap_rate: 7.5, disposition_cost_pct: 2 },
  vacation_rental: { vacancy_pct: 30, stabilized_vacancy_pct: 25, bad_debt_pct: 2, mgmt_fee_pct: 10, rent_growth: [3, 3, 3, 3, 3], expense_growth: [3, 3, 3, 3, 3], going_in_cap_rate: 8.0, exit_cap_rate: 8.5, disposition_cost_pct: 2.5 },
  mixed_use: { vacancy_pct: 8, stabilized_vacancy_pct: 6, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [2.5, 2.5, 2.5, 2.5, 2.5], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 6.5, exit_cap_rate: 7.0, disposition_cost_pct: 2 },
  warehouse: { vacancy_pct: 5, stabilized_vacancy_pct: 5, bad_debt_pct: 0.5, mgmt_fee_pct: 6, rent_growth: [2.5, 2.5, 2.5, 2.5, 2.5], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 6.0, exit_cap_rate: 6.5, disposition_cost_pct: 1.5 },
  specialty: { vacancy_pct: 10, stabilized_vacancy_pct: 8, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [2, 2, 2, 2, 2], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 8.0, exit_cap_rate: 8.5, disposition_cost_pct: 2 },
  other: { vacancy_pct: 10, stabilized_vacancy_pct: 8, bad_debt_pct: 1, mgmt_fee_pct: 8, rent_growth: [2, 2, 2, 2, 2], expense_growth: [2, 2, 2, 2, 2], going_in_cap_rate: 7.5, exit_cap_rate: 8.0, disposition_cost_pct: 2 },
};

/** Pre-populated inputs for sandbox mode — 6-unit multifamily */
export const COMMERCIAL_SANDBOX_DEFAULTS: CommercialInputs = {
  property_type: "multifamily",
  total_units: 6,
  total_sf: 5400,
  year_built: 1985,

  rent_roll: [
    { unit_number: "101", tenant_name: "Smith, J.", sf: 900, current_monthly_rent: 1250, market_rent: 1350, cam_nnn: 0, other_income: 50, is_vacant: false },
    { unit_number: "102", tenant_name: "Garcia, M.", sf: 900, current_monthly_rent: 1200, market_rent: 1350, cam_nnn: 0, other_income: 50, is_vacant: false },
    { unit_number: "201", tenant_name: "Johnson, T.", sf: 900, current_monthly_rent: 1300, market_rent: 1350, cam_nnn: 0, other_income: 50, is_vacant: false },
    { unit_number: "202", tenant_name: "", sf: 900, current_monthly_rent: 0, market_rent: 1350, cam_nnn: 0, other_income: 0, is_vacant: true },
    { unit_number: "301", tenant_name: "Williams, A.", sf: 900, current_monthly_rent: 1350, market_rent: 1400, cam_nnn: 0, other_income: 50, is_vacant: false },
    { unit_number: "302", tenant_name: "Lee, K.", sf: 900, current_monthly_rent: 1275, market_rent: 1400, cam_nnn: 0, other_income: 50, is_vacant: false },
  ],

  ancillary_income: [
    { income_source: "Laundry", current_annual: 3600, stabilized_annual: 4200 },
    { income_source: "Parking", current_annual: 7200, stabilized_annual: 7200 },
  ],

  // T12 Historical Expenses
  t12_gpi: 93000,
  t12_vacancy_pct: 8,
  t12_bad_debt_pct: 1,
  t12_mgmt_fee: 6850,
  t12_taxes: 9600,
  t12_insurance: 4800,
  t12_utilities: 7200,
  t12_repairs: 5400,
  t12_contract_services: 2400,
  t12_payroll: 0,
  t12_marketing: 1200,
  t12_ga: 1800,
  t12_replacement_reserve: 3000,

  // Year 1 Overrides
  yr1_mgmt_fee_pct: 8,
  yr1_taxes: 10000,
  yr1_insurance: 5100,
  yr1_utilities: null,
  yr1_repairs: null,
  yr1_contract: null,
  yr1_payroll: null,
  yr1_marketing: null,
  yr1_ga: null,
  yr1_reserve: 3600,

  // Growth Assumptions
  rent_growth_yr1: 3, rent_growth_yr2: 3, rent_growth_yr3: 3, rent_growth_yr4: 3, rent_growth_yr5: 3,
  expense_growth_yr1: 2, expense_growth_yr2: 2, expense_growth_yr3: 2, expense_growth_yr4: 2, expense_growth_yr5: 2,

  // Vacancy
  vacancy_pct_yr1: 8, vacancy_pct_yr2: 6, vacancy_pct_yr3: 5, vacancy_pct_yr4: 5, vacancy_pct_yr5: 5,
  stabilized_vacancy_pct: 5,
  bad_debt_pct: 1,

  // Bridge Loan
  bridge_loan_amount: 750000,
  bridge_rate: 8.5,
  bridge_term_months: 36,
  bridge_io_months: 24,
  bridge_origination_pts: 1.5,

  // Exit Loan
  exit_loan_amount: 700000,
  exit_rate: 6.5,
  exit_amortization_years: 30,
  exit_io_months: 0,

  // Acquisition
  purchase_price: 950000,
  going_in_cap_rate: null,
  exit_cap_rate: 6.0,
  disposition_cost_pct: 2,
  equity_invested: 275000,
};
