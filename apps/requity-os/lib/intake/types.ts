// ═══════════════════════════════════════════════════════════
// Intake Items — Types for the email intake -> pipeline flow
// ═══════════════════════════════════════════════════════════

/** Entity types in every intake item (borrower_contact is conditional) */
export type IntakeEntityKey = "contact" | "borrower_contact" | "company" | "property" | "opportunity";

/** Match result from the matching engine (stored in auto_matches JSONB) */
export interface EntityMatchResult {
  match_id: string;
  confidence: number; // 0-1
  matched_on: string[]; // e.g. ["email", "name"]
  snapshot: Record<string, unknown>; // cached fields from the matched record
}

/** Shape of auto_matches column */
export type AutoMatches = Partial<Record<IntakeEntityKey, EntityMatchResult | null>>;

/** Structured parsed data from AI extraction */
export interface IntakeParsedData {
  // Primary contact (resolved: broker for forwards, sender for direct)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;

  // Broker / correspondent
  brokerName?: string;
  brokerEmail?: string;
  brokerPhone?: string;
  brokerCompany?: string;
  brokerLicense?: string;

  // Borrower
  borrowerName?: string;
  borrowerEmail?: string;
  borrowerPhone?: string;
  borrowerEntityName?: string;

  // Company / entity
  companyName?: string;
  ein?: string;
  entityType?: string;
  stateOfFormation?: string;

  // Property
  propertyAddress?: string;
  propertyCity?: string;
  propertyState?: string;
  propertyZip?: string;
  propertyType?: string;
  propertyCount?: number;
  units?: number;
  sqft?: number;
  arv?: number;
  yearBuilt?: number;
  zoning?: string;

  // Deal / loan
  purchasePrice?: number;
  loanAmount?: number;
  loanType?: string;
  ltv?: number;
  rate?: number;
  term?: string;
  dscr?: number;
  rehabBudget?: number;
  closingDate?: string;

  // Financial metrics
  noi?: number;
  cashFlow?: number;
  cocReturn?: number;
  debtService?: number;
  capRate?: number;

  // Other
  sellerFinancing?: string;
  existingDebt?: string;
  notes?: string;

  // Forwarding metadata
  isForwarded?: boolean;
  forwarderName?: string;
  forwarderEmail?: string;
}

/** Full intake item row */
export interface IntakeItem {
  id: string;
  email_intake_queue_id: string | null;
  received_at: string;
  from_email: string;
  from_name: string | null;
  subject: string | null;
  raw_body: string | null;
  parsed_data: IntakeParsedData;
  auto_matches: AutoMatches;
  status: "pending" | "processed" | "dismissed";
  processed_at: string | null;
  processed_by: string | null;
  decisions: IntakeDecisions | null;
  created_deal_id: string | null;
  created_contact_id: string | null;
  created_company_id: string | null;
  created_property_id: string | null;
  created_at: string;
  updated_at: string;
}

/** Entity merge mode */
export type EntityMode = "new" | "merge";

/** Field-level choice */
export type FieldChoice = "existing" | "incoming" | "both";

/** Decisions made at review time (entityModes is Partial because borrower_contact is conditional) */
export interface IntakeDecisions {
  entityModes: Partial<Record<IntakeEntityKey, EntityMode>>;
  fieldChoices: Partial<Record<IntakeEntityKey, Record<string, FieldChoice>>>;
  manualMatches?: Partial<Record<IntakeEntityKey, EntityMatchResult>>;
}

// ─── Field definitions per entity (drives the merge UI) ───

export interface IntakeFieldDef {
  key: string;
  label: string;
  keepBoth?: boolean;
  format?: "currency" | "percent" | "number";
}

export const CONTACT_FIELDS: IntakeFieldDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", keepBoth: true },
  { key: "phone", label: "Phone", keepBoth: true },
  { key: "company_name", label: "Company" },
  { key: "address_line1", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip" },
];

export const BORROWER_CONTACT_FIELDS: IntakeFieldDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", keepBoth: true },
  { key: "phone", label: "Phone", keepBoth: true },
  { key: "company_name", label: "Entity / Company" },
];

export const COMPANY_FIELDS: IntakeFieldDef[] = [
  { key: "name", label: "Company Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "website", label: "Website" },
  { key: "address_line1", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
];

export const PROPERTY_FIELDS: IntakeFieldDef[] = [
  { key: "address_line1", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "zip", label: "Zip" },
  { key: "county", label: "County" },
  { key: "property_type", label: "Property Type" },
  { key: "number_of_units", label: "Units" },
  { key: "number_of_buildings", label: "Buildings" },
  { key: "gross_building_area_sqft", label: "Sq Ft", format: "number" },
  { key: "lot_size_acres", label: "Lot Size (ac)", format: "number" },
  { key: "year_built", label: "Year Built" },
  { key: "zoning", label: "Zoning" },
];

export const OPPORTUNITY_FIELDS: IntakeFieldDef[] = [
  { key: "purchase_price", label: "Purchase Price", format: "currency" },
  { key: "amount", label: "Loan Amount", format: "currency" },
  { key: "loan_type", label: "Loan Type" },
  { key: "ltv", label: "LTV", format: "percent" },
  { key: "rate", label: "Rate", format: "percent" },
  { key: "term", label: "Term" },
  { key: "noi", label: "NOI", format: "currency" },
  { key: "cap_rate", label: "Cap Rate", format: "percent" },
  { key: "dscr", label: "DSCR", format: "number" },
  { key: "debt_service", label: "Debt Service", format: "currency" },
  { key: "cash_flow", label: "Cash Flow", format: "currency" },
  { key: "coc_return", label: "COC Return", format: "percent" },
  { key: "rehab_budget", label: "Rehab Budget", format: "currency" },
  { key: "arv", label: "ARV", format: "currency" },
  { key: "closing_date", label: "Closing Date" },
  { key: "seller_financing", label: "Seller Financing" },
  { key: "existing_debt", label: "Existing Debt" },
  { key: "units", label: "Units", format: "number" },
  { key: "property_count", label: "Property Count", format: "number" },
];

export const ENTITY_FIELD_MAP: Record<IntakeEntityKey, IntakeFieldDef[]> = {
  contact: CONTACT_FIELDS,
  borrower_contact: BORROWER_CONTACT_FIELDS,
  company: COMPANY_FIELDS,
  property: PROPERTY_FIELDS,
  opportunity: OPPORTUNITY_FIELDS,
};

/** Entity display metadata */
export const ENTITY_META: Record<IntakeEntityKey, { label: string; color: string }> = {
  contact: { label: "Contact", color: "blue" },
  borrower_contact: { label: "Borrower", color: "cyan" },
  company: { label: "Company", color: "violet" },
  property: { label: "Property", color: "emerald" },
  opportunity: { label: "Deal", color: "amber" },
};

// ─── Utility: map parsed_data fields to entity-keyed objects for comparison ───

export function getIncomingContactData(p: IntakeParsedData): Record<string, unknown> {
  const name = p.brokerName || p.contactName || "";
  const nameParts = name.split(" ");
  return {
    name,
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    email: p.brokerEmail || p.contactEmail || "",
    phone: p.brokerPhone || p.contactPhone || "",
    company_name: p.brokerCompany || p.companyName || "",
    address_line1: "",
    city: "",
    state: "",
    zip: "",
  };
}

export function getIncomingBorrowerContactData(p: IntakeParsedData): Record<string, unknown> {
  const name = p.borrowerName || "";
  const nameParts = name.split(" ");
  return {
    name,
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    email: p.borrowerEmail || "",
    phone: p.borrowerPhone || "",
    company_name: p.borrowerEntityName || "",
  };
}

export function getIncomingCompanyData(p: IntakeParsedData): Record<string, unknown> {
  return {
    name: p.borrowerEntityName || p.companyName || p.brokerCompany || "",
    email: "",
    phone: "",
    website: "",
    address_line1: "",
    city: "",
    state: p.stateOfFormation || "",
  };
}

export function getIncomingPropertyData(p: IntakeParsedData): Record<string, unknown> {
  return {
    address_line1: p.propertyAddress || "",
    city: p.propertyCity || "",
    state: p.propertyState || "",
    zip: p.propertyZip || "",
    county: "",
    property_type: p.propertyType || "",
    number_of_units: p.units || 0,
    number_of_buildings: 0,
    gross_building_area_sqft: p.sqft || 0,
    lot_size_acres: 0,
    year_built: p.yearBuilt || 0,
    zoning: p.zoning || "",
  };
}

export function getIncomingOpportunityData(p: IntakeParsedData): Record<string, unknown> {
  return {
    purchase_price: p.purchasePrice || 0,
    amount: p.loanAmount || 0,
    loan_type: p.loanType || "",
    ltv: p.ltv || 0,
    rate: p.rate || 0,
    term: p.term || "",
    noi: p.noi || 0,
    cap_rate: p.capRate || 0,
    dscr: p.dscr || 0,
    debt_service: p.debtService || 0,
    cash_flow: p.cashFlow || 0,
    coc_return: p.cocReturn || 0,
    rehab_budget: p.rehabBudget || 0,
    arv: p.arv || 0,
    closing_date: p.closingDate || "",
    seller_financing: p.sellerFinancing || "",
    existing_debt: p.existingDebt || "",
    units: p.units || 0,
    property_count: p.propertyCount || 0,
  };
}

/** Whether parsed data has borrower info distinct from the broker/primary contact */
export function hasBorrowerData(p: IntakeParsedData): boolean {
  if (!p.borrowerName && !p.borrowerEmail) return false;
  const sameAsBroker =
    (p.borrowerName === p.brokerName || p.borrowerName === p.contactName) &&
    (p.borrowerEmail === p.brokerEmail || p.borrowerEmail === p.contactEmail);
  return !sameAsBroker;
}

export const INCOMING_DATA_MAP: Record<IntakeEntityKey, (p: IntakeParsedData) => Record<string, unknown>> = {
  contact: getIncomingContactData,
  borrower_contact: getIncomingBorrowerContactData,
  company: getIncomingCompanyData,
  property: getIncomingPropertyData,
  opportunity: getIncomingOpportunityData,
};

// ─── Value comparison helpers ───

export function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === "" || v === 0 || v === false;
}

export function valsMatch(a: unknown, b: unknown): boolean {
  if (isEmpty(a) && isEmpty(b)) return true;
  if (typeof a === "string" && typeof b === "string") {
    return a.toLowerCase().replace(/[^a-z0-9]/g, "") === b.toLowerCase().replace(/[^a-z0-9]/g, "");
  }
  return a === b;
}
