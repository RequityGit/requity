// ---------------------------------------------------------------------------
// Merge Field Registry
// ---------------------------------------------------------------------------
// Comprehensive registry of all known merge fields across loan, contact,
// company, and system sources. Used by the template field search to
// auto-populate Key, Label, Source, Column, and Format when adding fields.
// ---------------------------------------------------------------------------

export interface MergeFieldOption {
  key: string;
  label: string;
  source: string;
  column: string;
  format: string | null;
  /** Which section/category this field belongs to, for grouping in search */
  category: string;
}

// -- Loan fields (from term sheet + additional loan columns) ----------------
const LOAN_FIELDS: MergeFieldOption[] = [
  // Borrower Info
  { key: "borrower_name", label: "Borrower Name", source: "loans", column: "borrower_name", format: null, category: "Borrower" },
  { key: "borrower_email", label: "Borrower Email", source: "loans", column: "borrower_email", format: null, category: "Borrower" },
  { key: "borrower_phone", label: "Borrower Phone", source: "loans", column: "borrower_phone", format: null, category: "Borrower" },
  { key: "entity_name", label: "Borrowing Entity", source: "loans", column: "entity_name", format: null, category: "Borrower" },
  { key: "entity_type", label: "Entity Type", source: "loans", column: "entity_type", format: null, category: "Borrower" },
  { key: "co_borrower_name", label: "Co-Borrower Name", source: "loans", column: "co_borrower_name", format: null, category: "Borrower" },
  { key: "credit_score", label: "Credit Score", source: "loans", column: "credit_score", format: null, category: "Borrower" },
  { key: "is_us_citizen", label: "US Citizenship Status", source: "loans", column: "is_us_citizen", format: null, category: "Borrower" },
  { key: "experience_count", label: "Experience (# of Deals)", source: "loans", column: "experience_count", format: null, category: "Borrower" },
  { key: "guarantor_name", label: "Guarantor Name", source: "loans", column: "guarantor_name", format: null, category: "Borrower" },

  // Property
  { key: "property_address", label: "Property Address", source: "loans", column: "property_address", format: null, category: "Property" },
  { key: "property_city", label: "City", source: "loans", column: "property_city", format: null, category: "Property" },
  { key: "property_state", label: "State", source: "loans", column: "property_state", format: null, category: "Property" },
  { key: "property_zip", label: "ZIP Code", source: "loans", column: "property_zip", format: null, category: "Property" },
  { key: "property_county", label: "County", source: "loans", column: "property_county", format: null, category: "Property" },
  { key: "property_type", label: "Property Type", source: "loans", column: "property_type", format: null, category: "Property" },
  { key: "number_of_units", label: "Number of Units", source: "loans", column: "number_of_units", format: null, category: "Property" },
  { key: "is_short_term_rental", label: "Short-Term Rental", source: "loans", column: "is_short_term_rental", format: null, category: "Property" },
  { key: "is_in_flood_zone", label: "Flood Zone", source: "loans", column: "is_in_flood_zone", format: null, category: "Property" },
  { key: "parcel_id", label: "Parcel / APN", source: "loans", column: "parcel_id", format: null, category: "Property" },

  // Loan Terms
  { key: "loan_amount", label: "Loan Amount", source: "loans", column: "loan_amount", format: "currency", category: "Loan Terms" },
  { key: "total_loan_amount", label: "Total Loan Amount", source: "loans", column: "total_loan_amount", format: "currency", category: "Loan Terms" },
  { key: "purchase_price", label: "Purchase Price", source: "loans", column: "purchase_price", format: "currency", category: "Loan Terms" },
  { key: "appraised_value", label: "Appraised Value", source: "loans", column: "appraised_value", format: "currency", category: "Loan Terms" },
  { key: "as_is_value", label: "As-Is Value", source: "loans", column: "as_is_value", format: "currency", category: "Loan Terms" },
  { key: "after_repair_value", label: "After Repair Value (ARV)", source: "loans", column: "after_repair_value", format: "currency", category: "Loan Terms" },
  { key: "interest_rate", label: "Interest Rate", source: "loans", column: "interest_rate", format: "percentage", category: "Loan Terms" },
  { key: "note_rate", label: "Note Rate", source: "loans", column: "note_rate", format: "percentage", category: "Loan Terms" },
  { key: "default_rate", label: "Default Rate", source: "loans", column: "default_rate", format: "percentage", category: "Loan Terms" },
  { key: "loan_term_months", label: "Loan Term (Months)", source: "loans", column: "loan_term_months", format: null, category: "Loan Terms" },
  { key: "ltv", label: "LTV", source: "loans", column: "ltv", format: "percentage", category: "Loan Terms" },
  { key: "ltarv", label: "LT-ARV", source: "loans", column: "ltarv", format: "percentage", category: "Loan Terms" },
  { key: "dscr_ratio", label: "DSCR Ratio", source: "loans", column: "dscr_ratio", format: null, category: "Loan Terms" },
  { key: "monthly_payment", label: "Monthly Payment", source: "loans", column: "monthly_payment", format: "currency", category: "Loan Terms" },
  { key: "type", label: "Loan Type", source: "loans", column: "type", format: null, category: "Loan Terms" },
  { key: "loan_number", label: "Loan Number", source: "loans", column: "loan_number", format: null, category: "Loan Terms" },
  { key: "purpose", label: "Loan Purpose", source: "loans", column: "purpose", format: null, category: "Loan Terms" },
  { key: "status", label: "Loan Status", source: "loans", column: "status", format: null, category: "Loan Terms" },
  { key: "stage", label: "Loan Stage", source: "loans", column: "stage", format: null, category: "Loan Terms" },

  // Fees
  { key: "origination_fee_pct", label: "Origination Fee (%)", source: "loans", column: "origination_fee_pct", format: "percentage", category: "Fees" },
  { key: "origination_fee_amount", label: "Origination Fee ($)", source: "loans", column: "origination_fee_amount", format: "currency", category: "Fees" },
  { key: "broker_fee_pct", label: "Broker Fee (%)", source: "loans", column: "broker_fee_pct", format: "percentage", category: "Fees" },
  { key: "broker_fee_amount", label: "Broker Fee ($)", source: "loans", column: "broker_fee_amount", format: "currency", category: "Fees" },
  { key: "processing_fee", label: "Processing Fee", source: "loans", column: "processing_fee", format: "currency", category: "Fees" },
  { key: "legal_fee", label: "Legal / Doc Prep Fee", source: "loans", column: "legal_fee", format: "currency", category: "Fees" },
  { key: "points", label: "Points", source: "loans", column: "points", format: null, category: "Fees" },

  // Reserves
  { key: "rehab_budget", label: "Rehab Budget", source: "loans", column: "rehab_budget", format: "currency", category: "Reserves" },
  { key: "rehab_holdback", label: "Rehab Holdback", source: "loans", column: "rehab_holdback", format: "currency", category: "Reserves" },
  { key: "interest_reserve", label: "Interest Reserve", source: "loans", column: "interest_reserve", format: "currency", category: "Reserves" },
  { key: "escrow_holdback", label: "Escrow Holdback", source: "loans", column: "escrow_holdback", format: "currency", category: "Reserves" },

  // Dates
  { key: "application_date", label: "Application Date", source: "loans", column: "application_date", format: "date", category: "Dates" },
  { key: "approval_date", label: "Approval Date", source: "loans", column: "approval_date", format: "date", category: "Dates" },
  { key: "expected_close_date", label: "Expected Close Date", source: "loans", column: "expected_close_date", format: "date", category: "Dates" },
  { key: "closing_date", label: "Closing Date", source: "loans", column: "closing_date", format: "date", category: "Dates" },
  { key: "first_payment_date", label: "First Payment Date", source: "loans", column: "first_payment_date", format: "date", category: "Dates" },
  { key: "maturity_date", label: "Maturity Date", source: "loans", column: "maturity_date", format: "date", category: "Dates" },

  // Prepayment / Extension
  { key: "prepayment_terms", label: "Prepayment Terms", source: "loans", column: "prepayment_terms", format: null, category: "Prepayment" },
  { key: "prepayment_penalty_months", label: "Penalty Period (Months)", source: "loans", column: "prepayment_penalty_months", format: null, category: "Prepayment" },
  { key: "extension_options", label: "Extension Options", source: "loans", column: "extension_options", format: null, category: "Extension" },
  { key: "extension_term_months", label: "Extension Term (Months)", source: "loans", column: "extension_term_months", format: null, category: "Extension" },
  { key: "extension_fee_pct", label: "Extension Fee (%)", source: "loans", column: "extension_fee_pct", format: "percentage", category: "Extension" },
  { key: "extension_maturity_date", label: "Extended Maturity Date", source: "loans", column: "extension_maturity_date", format: "date", category: "Extension" },

  // Closing
  { key: "title_company_name", label: "Title Company", source: "loans", column: "title_company_name", format: null, category: "Closing" },
  { key: "closing_attorney_name", label: "Closing Attorney", source: "loans", column: "closing_attorney_name", format: null, category: "Closing" },
  { key: "insurance_company_name", label: "Insurance Company", source: "loans", column: "insurance_company_name", format: null, category: "Closing" },
];

// -- CRM Contact fields ----------------------------------------------------
const CONTACT_FIELDS: MergeFieldOption[] = [
  { key: "contact_first_name", label: "First Name", source: "crm_contacts", column: "first_name", format: null, category: "Contact" },
  { key: "contact_last_name", label: "Last Name", source: "crm_contacts", column: "last_name", format: null, category: "Contact" },
  { key: "contact_full_name", label: "Full Name", source: "crm_contacts", column: "full_name", format: null, category: "Contact" },
  { key: "contact_email", label: "Email", source: "crm_contacts", column: "email", format: null, category: "Contact" },
  { key: "contact_phone", label: "Phone", source: "crm_contacts", column: "phone", format: null, category: "Contact" },
  { key: "contact_title", label: "Title", source: "crm_contacts", column: "title", format: null, category: "Contact" },
  { key: "contact_type", label: "Contact Type", source: "crm_contacts", column: "type", format: null, category: "Contact" },
  { key: "contact_status", label: "Contact Status", source: "crm_contacts", column: "status", format: null, category: "Contact" },
  { key: "contact_address", label: "Mailing Address", source: "crm_contacts", column: "mailing_address", format: null, category: "Contact" },
  { key: "contact_city", label: "City", source: "crm_contacts", column: "city", format: null, category: "Contact" },
  { key: "contact_state", label: "State", source: "crm_contacts", column: "state", format: null, category: "Contact" },
  { key: "contact_zip", label: "ZIP Code", source: "crm_contacts", column: "zip", format: null, category: "Contact" },
];

// -- Company fields --------------------------------------------------------
const COMPANY_FIELDS: MergeFieldOption[] = [
  { key: "company_name", label: "Company Name", source: "companies", column: "name", format: null, category: "Company" },
  { key: "broker_company", label: "Broker Company", source: "companies", column: "name", format: null, category: "Company" },
  { key: "company_phone", label: "Company Phone", source: "companies", column: "phone", format: null, category: "Company" },
  { key: "company_email", label: "Company Email", source: "companies", column: "email", format: null, category: "Company" },
  { key: "company_address", label: "Company Address", source: "companies", column: "address", format: null, category: "Company" },
  { key: "company_city", label: "Company City", source: "companies", column: "city", format: null, category: "Company" },
  { key: "company_state", label: "Company State", source: "companies", column: "state", format: null, category: "Company" },
  { key: "company_website", label: "Company Website", source: "companies", column: "website", format: null, category: "Company" },
  { key: "company_type", label: "Company Type", source: "companies", column: "type", format: null, category: "Company" },
];

// -- Equity Deal fields ----------------------------------------------------
const EQUITY_FIELDS: MergeFieldOption[] = [
  { key: "deal_name", label: "Deal Name", source: "equity_deals", column: "name", format: null, category: "Equity Deal" },
  { key: "deal_stage", label: "Deal Stage", source: "equity_deals", column: "stage", format: null, category: "Equity Deal" },
  { key: "deal_amount", label: "Deal Amount", source: "equity_deals", column: "amount", format: "currency", category: "Equity Deal" },
  { key: "target_return", label: "Target Return", source: "equity_deals", column: "target_return", format: "percentage", category: "Equity Deal" },
  { key: "investment_type", label: "Investment Type", source: "equity_deals", column: "investment_type", format: null, category: "Equity Deal" },
];

// -- System fields ---------------------------------------------------------
const SYSTEM_FIELDS: MergeFieldOption[] = [
  { key: "current_date", label: "Current Date", source: "_system", column: "current_date", format: "date", category: "System" },
  { key: "portal_url", label: "Portal URL", source: "_system", column: "portal_url", format: null, category: "System" },
  { key: "action_url", label: "Action URL", source: "_system", column: "action_url", format: null, category: "System" },
  { key: "preferences_url", label: "Preferences URL", source: "_system", column: "preferences_url", format: null, category: "System" },
  { key: "recipient_name", label: "Recipient Name", source: "_system", column: "recipient_name", format: null, category: "System" },
  { key: "sender_name", label: "Sender Name", source: "_system", column: "sender_name", format: null, category: "System" },
];

// -- Combined registry -----------------------------------------------------
export const MERGE_FIELD_REGISTRY: MergeFieldOption[] = [
  ...LOAN_FIELDS,
  ...CONTACT_FIELDS,
  ...COMPANY_FIELDS,
  ...EQUITY_FIELDS,
  ...SYSTEM_FIELDS,
];

/** Group fields by category for display */
export function getFieldsByCategory(): Record<string, MergeFieldOption[]> {
  const groups: Record<string, MergeFieldOption[]> = {};
  for (const field of MERGE_FIELD_REGISTRY) {
    if (!groups[field.category]) groups[field.category] = [];
    groups[field.category].push(field);
  }
  return groups;
}

/** Search fields by query string (matches key, label, or category) */
export function searchFields(query: string): MergeFieldOption[] {
  if (!query) return MERGE_FIELD_REGISTRY;
  const q = query.toLowerCase();
  return MERGE_FIELD_REGISTRY.filter(
    (f) =>
      f.key.toLowerCase().includes(q) ||
      f.label.toLowerCase().includes(q) ||
      f.category.toLowerCase().includes(q) ||
      f.column.toLowerCase().includes(q)
  );
}
