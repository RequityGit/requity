// ---------------------------------------------------------------------------
// Term Sheet Field Definitions
// ---------------------------------------------------------------------------
// Maps each term sheet section to the loan/borrower/entity fields it contains.
// Used by the template editor to show admins exactly what data each section
// displays, and to let them toggle individual fields on/off.
// ---------------------------------------------------------------------------

export interface TermSheetFieldDef {
  /** Unique key used for storage in field_visibility / field_labels JSON */
  key: string;
  /** Human-readable label shown in the editor and on the term sheet */
  label: string;
  /** Short description so admins know what this field is */
  description: string;
  /** Whether the field is shown by default when no overrides exist */
  defaultVisible: boolean;
  /** Display format hint — for future PDF rendering */
  format?: "text" | "currency" | "percent" | "date" | "number" | "boolean";
}

export interface TermSheetSectionDef {
  key: string;
  label: string;
  description: string;
  fields: TermSheetFieldDef[];
  /** Whether this section supports a custom text block */
  hasCustomText: boolean;
  /** The DB column name for the custom text, if any */
  customTextColumn?: string;
}

// ---------------------------------------------------------------------------
// Section definitions with fields
// ---------------------------------------------------------------------------

export const TERM_SHEET_SECTIONS: TermSheetSectionDef[] = [
  {
    key: "borrower",
    label: "Borrower Information",
    description:
      "Contact details and identity of the borrower and their entity.",
    hasCustomText: false,
    fields: [
      {
        key: "borrower_name",
        label: "Borrower Name",
        description: "Full legal name of the borrower (first + last)",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "borrower_email",
        label: "Email Address",
        description: "Borrower's email on file",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "borrower_phone",
        label: "Phone Number",
        description: "Borrower's phone number",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "entity_name",
        label: "Borrowing Entity",
        description: "LLC, trust, or corporation name",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "entity_type",
        label: "Entity Type",
        description: "Type of entity (LLC, Corporation, Trust, etc.)",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "co_borrower_name",
        label: "Co-Borrower Name",
        description: "Name of the co-borrower, if any",
        defaultVisible: false,
        format: "text",
      },
      {
        key: "credit_score",
        label: "Credit Score",
        description: "Borrower's credit score from latest report",
        defaultVisible: false,
        format: "number",
      },
      {
        key: "is_us_citizen",
        label: "US Citizenship Status",
        description: "Whether the borrower is a US citizen",
        defaultVisible: false,
        format: "boolean",
      },
      {
        key: "experience_count",
        label: "Experience (# of Deals)",
        description: "Number of prior real estate transactions",
        defaultVisible: false,
        format: "number",
      },
    ],
  },
  {
    key: "property",
    label: "Property Information",
    description: "Address, type, and details of the subject property.",
    hasCustomText: false,
    fields: [
      {
        key: "property_address",
        label: "Property Address",
        description: "Full street address of the property",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "property_city",
        label: "City",
        description: "City where the property is located",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "property_state",
        label: "State",
        description: "State where the property is located",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "property_zip",
        label: "ZIP Code",
        description: "Postal code of the property",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "property_county",
        label: "County",
        description: "County where the property is located",
        defaultVisible: false,
        format: "text",
      },
      {
        key: "property_type",
        label: "Property Type",
        description: "SFR, Condo, Multifamily, etc.",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "number_of_units",
        label: "Number of Units",
        description: "Total units (for multi-unit properties)",
        defaultVisible: false,
        format: "number",
      },
      {
        key: "is_short_term_rental",
        label: "Short-Term Rental",
        description: "Whether the property is used as a short-term rental",
        defaultVisible: false,
        format: "boolean",
      },
      {
        key: "is_in_flood_zone",
        label: "Flood Zone",
        description: "Whether the property is in a FEMA flood zone",
        defaultVisible: false,
        format: "boolean",
      },
      {
        key: "parcel_id",
        label: "Parcel / APN",
        description: "Tax assessor parcel identification number",
        defaultVisible: false,
        format: "text",
      },
    ],
  },
  {
    key: "loan_terms",
    label: "Loan Terms",
    description:
      "Core financial terms of the loan — amount, rate, LTV, and term.",
    hasCustomText: false,
    fields: [
      {
        key: "loan_amount",
        label: "Loan Amount",
        description: "Total loan amount requested or approved",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "total_loan_amount",
        label: "Total Loan Amount",
        description: "Total including rehab holdback (if applicable)",
        defaultVisible: false,
        format: "currency",
      },
      {
        key: "purchase_price",
        label: "Purchase Price",
        description: "Purchase price of the property",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "appraised_value",
        label: "Appraised Value",
        description: "As-is appraised value of the property",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "as_is_value",
        label: "As-Is Value",
        description: "Current market value before renovations",
        defaultVisible: false,
        format: "currency",
      },
      {
        key: "after_repair_value",
        label: "After Repair Value (ARV)",
        description: "Estimated value after rehab is complete",
        defaultVisible: false,
        format: "currency",
      },
      {
        key: "interest_rate",
        label: "Interest Rate",
        description: "Annual interest rate on the loan",
        defaultVisible: true,
        format: "percent",
      },
      {
        key: "note_rate",
        label: "Note Rate",
        description: "Rate on the promissory note (if different)",
        defaultVisible: false,
        format: "percent",
      },
      {
        key: "default_rate",
        label: "Default Rate",
        description: "Interest rate applied if borrower defaults",
        defaultVisible: false,
        format: "percent",
      },
      {
        key: "loan_term_months",
        label: "Loan Term",
        description: "Duration of the loan in months",
        defaultVisible: true,
        format: "number",
      },
      {
        key: "ltv",
        label: "LTV",
        description: "Loan-to-value ratio",
        defaultVisible: true,
        format: "percent",
      },
      {
        key: "ltarv",
        label: "LT-ARV",
        description: "Loan-to-after-repair-value ratio",
        defaultVisible: false,
        format: "percent",
      },
      {
        key: "dscr_ratio",
        label: "DSCR Ratio",
        description: "Debt service coverage ratio",
        defaultVisible: false,
        format: "number",
      },
      {
        key: "monthly_payment",
        label: "Monthly Payment",
        description: "Estimated monthly payment amount",
        defaultVisible: false,
        format: "currency",
      },
      {
        key: "type",
        label: "Loan Type",
        description: "Commercial, DSCR, GUC, RTL, or Transactional",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "purpose",
        label: "Loan Purpose",
        description: "Purchase, Refinance, or Cash-Out Refinance",
        defaultVisible: true,
        format: "text",
      },
    ],
  },
  {
    key: "fees",
    label: "Fees & Costs",
    description:
      "Origination, broker, processing, and other fees charged on the loan.",
    hasCustomText: false,
    fields: [
      {
        key: "origination_fee_pct",
        label: "Origination Fee (%)",
        description: "Origination fee as a percentage of loan amount",
        defaultVisible: true,
        format: "percent",
      },
      {
        key: "origination_fee_amount",
        label: "Origination Fee ($)",
        description: "Origination fee as a flat dollar amount",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "broker_fee_pct",
        label: "Broker Fee (%)",
        description: "Broker fee as a percentage",
        defaultVisible: true,
        format: "percent",
      },
      {
        key: "broker_fee_amount",
        label: "Broker Fee ($)",
        description: "Broker fee as a flat dollar amount",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "processing_fee",
        label: "Processing Fee",
        description: "Fee for loan processing",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "legal_fee",
        label: "Legal / Doc Prep Fee",
        description: "Attorney or document preparation fee",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "points",
        label: "Points",
        description: "Discount points charged on the loan",
        defaultVisible: false,
        format: "number",
      },
    ],
  },
  {
    key: "reserves",
    label: "Reserves & Holdbacks",
    description:
      "Escrow holdbacks, rehab budgets, and reserve accounts set aside at closing.",
    hasCustomText: true,
    customTextColumn: "reserves_custom_text",
    fields: [
      {
        key: "rehab_budget",
        label: "Rehab Budget",
        description: "Total renovation budget for the project",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "rehab_holdback",
        label: "Rehab Holdback",
        description: "Amount held back for construction draws",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "interest_reserve",
        label: "Interest Reserve",
        description: "Months of interest held in reserve",
        defaultVisible: true,
        format: "currency",
      },
      {
        key: "escrow_holdback",
        label: "Escrow Holdback",
        description: "General escrow holdback amount",
        defaultVisible: false,
        format: "currency",
      },
    ],
  },
  {
    key: "guarantor",
    label: "Guarantor / Recourse",
    description:
      "Guarantee and recourse terms. Custom text is often used for legal language.",
    hasCustomText: true,
    customTextColumn: "guarantor_custom_text",
    fields: [
      {
        key: "guarantor_name",
        label: "Guarantor Name",
        description: "Individual or entity providing the guarantee",
        defaultVisible: true,
        format: "text",
      },
    ],
  },
  {
    key: "closing_costs",
    label: "Closing Cost Breakdown",
    description:
      "Third-party costs at closing — title, insurance, recording, etc.",
    hasCustomText: true,
    customTextColumn: "closing_costs_custom_text",
    fields: [
      {
        key: "title_company_name",
        label: "Title Company",
        description: "Name of the title company handling closing",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "closing_attorney_name",
        label: "Closing Attorney",
        description: "Attorney handling the closing",
        defaultVisible: false,
        format: "text",
      },
      {
        key: "insurance_company_name",
        label: "Insurance Company",
        description: "Property insurance provider",
        defaultVisible: false,
        format: "text",
      },
    ],
  },
  {
    key: "dates",
    label: "Key Dates",
    description: "Important milestones and deadlines for the loan.",
    hasCustomText: false,
    fields: [
      {
        key: "application_date",
        label: "Application Date",
        description: "When the loan application was submitted",
        defaultVisible: true,
        format: "date",
      },
      {
        key: "approval_date",
        label: "Approval Date",
        description: "When the loan was approved",
        defaultVisible: true,
        format: "date",
      },
      {
        key: "expected_close_date",
        label: "Expected Close Date",
        description: "Target closing date",
        defaultVisible: true,
        format: "date",
      },
      {
        key: "closing_date",
        label: "Closing Date",
        description: "Actual closing date",
        defaultVisible: true,
        format: "date",
      },
      {
        key: "first_payment_date",
        label: "First Payment Date",
        description: "Date of the first monthly payment",
        defaultVisible: true,
        format: "date",
      },
      {
        key: "maturity_date",
        label: "Maturity Date",
        description: "When the loan matures / is due in full",
        defaultVisible: true,
        format: "date",
      },
    ],
  },
  {
    key: "prepayment",
    label: "Prepayment Terms",
    description: "Penalties and lockout periods for early payoff.",
    hasCustomText: false,
    fields: [
      {
        key: "prepayment_terms",
        label: "Prepayment Terms",
        description: "Description of prepayment penalty structure",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "prepayment_penalty_months",
        label: "Penalty Period (Months)",
        description: "Number of months the penalty applies",
        defaultVisible: true,
        format: "number",
      },
    ],
  },
  {
    key: "extension",
    label: "Extension Options",
    description: "Terms for extending the loan beyond the original maturity.",
    hasCustomText: false,
    fields: [
      {
        key: "extension_options",
        label: "Extension Options",
        description: "Description of available extension options",
        defaultVisible: true,
        format: "text",
      },
      {
        key: "extension_term_months",
        label: "Extension Term (Months)",
        description: "Duration of each extension period",
        defaultVisible: true,
        format: "number",
      },
      {
        key: "extension_fee_pct",
        label: "Extension Fee (%)",
        description: "Fee charged for each extension",
        defaultVisible: true,
        format: "percent",
      },
      {
        key: "extension_maturity_date",
        label: "Extended Maturity Date",
        description: "New maturity date if extension is exercised",
        defaultVisible: false,
        format: "date",
      },
    ],
  },
  {
    key: "conditions",
    label: "Conditions & Requirements",
    description:
      "Loan conditions pulled from the conditions checklist. Custom text adds standard language.",
    hasCustomText: true,
    customTextColumn: "conditions_custom_text",
    fields: [
      {
        key: "conditions_list",
        label: "Conditions Checklist",
        description:
          "Automatically pulled from the loan's condition tracker — not individually toggleable",
        defaultVisible: true,
        format: "text",
      },
    ],
  },
  {
    key: "disclaimer",
    label: "Disclaimer",
    description:
      "Legal disclaimer and footer text. This section is typically custom text only.",
    hasCustomText: true,
    customTextColumn: "disclaimer_rich_text",
    fields: [],
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Look up a section definition by key */
export function getSectionDef(
  sectionKey: string
): TermSheetSectionDef | undefined {
  return TERM_SHEET_SECTIONS.find((s) => s.key === sectionKey);
}

/** Get the default field_visibility object (all sections, all fields) */
export function getDefaultFieldVisibility(): Record<
  string,
  Record<string, boolean>
> {
  const result: Record<string, Record<string, boolean>> = {};
  for (const section of TERM_SHEET_SECTIONS) {
    result[section.key] = {};
    for (const field of section.fields) {
      result[section.key][field.key] = field.defaultVisible;
    }
  }
  return result;
}

/** Merge saved visibility with defaults (handles new fields added later) */
export function mergeFieldVisibility(
  saved: Record<string, Record<string, boolean>> | null | undefined
): Record<string, Record<string, boolean>> {
  const defaults = getDefaultFieldVisibility();
  if (!saved) return defaults;

  const merged: Record<string, Record<string, boolean>> = {};
  for (const section of TERM_SHEET_SECTIONS) {
    merged[section.key] = {};
    for (const field of section.fields) {
      merged[section.key][field.key] =
        saved[section.key]?.[field.key] ?? defaults[section.key][field.key];
    }
  }
  return merged;
}

/** Sample data for the preview panel */
export const SAMPLE_DATA: Record<string, string> = {
  borrower_name: "John Smith",
  borrower_email: "john@example.com",
  borrower_phone: "(555) 123-4567",
  entity_name: "Smith Capital LLC",
  entity_type: "LLC",
  co_borrower_name: "Jane Smith",
  credit_score: "720",
  is_us_citizen: "Yes",
  experience_count: "5",
  property_address: "123 Main Street",
  property_city: "Austin",
  property_state: "TX",
  property_zip: "78701",
  property_county: "Travis",
  property_type: "SFR",
  number_of_units: "1",
  is_short_term_rental: "No",
  is_in_flood_zone: "No",
  parcel_id: "12-3456-789",
  loan_amount: "$500,000",
  total_loan_amount: "$575,000",
  purchase_price: "$450,000",
  appraised_value: "$475,000",
  as_is_value: "$475,000",
  after_repair_value: "$650,000",
  interest_rate: "11.0%",
  note_rate: "11.0%",
  default_rate: "18.0%",
  loan_term_months: "12 months",
  ltv: "72.5%",
  ltarv: "65.0%",
  dscr_ratio: "1.25",
  monthly_payment: "$4,583",
  type: "RTL",
  purpose: "Purchase",
  origination_fee_pct: "2.0%",
  origination_fee_amount: "$10,000",
  broker_fee_pct: "1.0%",
  broker_fee_amount: "$5,000",
  processing_fee: "$1,500",
  legal_fee: "$1,250",
  points: "2.0",
  rehab_budget: "$75,000",
  rehab_holdback: "$75,000",
  interest_reserve: "$16,500",
  escrow_holdback: "$5,000",
  guarantor_name: "John Smith (Personal Guarantee)",
  title_company_name: "First American Title",
  closing_attorney_name: "Law Offices of J. Doe",
  insurance_company_name: "State Farm",
  application_date: "Jan 15, 2026",
  approval_date: "Feb 1, 2026",
  expected_close_date: "Mar 1, 2026",
  closing_date: "Mar 1, 2026",
  first_payment_date: "Apr 1, 2026",
  maturity_date: "Mar 1, 2027",
  prepayment_terms: "3-month minimum interest guarantee",
  prepayment_penalty_months: "3",
  extension_options: "Two 3-month extensions available",
  extension_term_months: "3",
  extension_fee_pct: "0.50%",
  extension_maturity_date: "Sep 1, 2027",
  conditions_list: "(Pulled from conditions checklist)",
};
