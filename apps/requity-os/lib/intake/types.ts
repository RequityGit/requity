// ═══════════════════════════════════════════════════════════
// Intake Items — Types for the email intake -> pipeline flow
// ═══════════════════════════════════════════════════════════

/** The 4 entity types in every intake item */
export type IntakeEntityKey = "contact" | "company" | "property" | "opportunity";

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
  // Contact
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Company
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
  units?: number;
  sqft?: number;
  arv?: number;
  yearBuilt?: number;
  zoning?: string;
  // Deal
  loanAmount?: number;
  loanType?: string;
  ltv?: number;
  rate?: number;
  term?: string;
  dscr?: number;
  rehabBudget?: number;
  closingDate?: string;
  // Notes
  notes?: string;
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

/** Decisions made at review time */
export interface IntakeDecisions {
  entityModes: Record<IntakeEntityKey, EntityMode>;
  fieldChoices: Partial<Record<IntakeEntityKey, Record<string, FieldChoice>>>;
}

// ─── Field definitions per entity (drives the merge UI) ───

export interface IntakeFieldDef {
  key: string;
  label: string;
  keepBoth?: boolean; // only for contact phone/email
  format?: "currency" | "percent" | "number";
}

export const CONTACT_FIELDS: IntakeFieldDef[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email", keepBoth: true },
  { key: "phone", label: "Phone", keepBoth: true },
  { key: "address_line1", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
];

export const COMPANY_FIELDS: IntakeFieldDef[] = [
  { key: "name", label: "Company Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "state", label: "State" },
];

export const PROPERTY_FIELDS: IntakeFieldDef[] = [
  { key: "address_line1", label: "Address" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "property_type", label: "Property Type" },
  { key: "number_of_units", label: "Units" },
  { key: "gross_building_area_sqft", label: "Sq Ft", format: "number" },
  { key: "year_built", label: "Year Built" },
  { key: "zoning", label: "Zoning" },
];

export const OPPORTUNITY_FIELDS: IntakeFieldDef[] = [
  { key: "amount", label: "Loan Amount", format: "currency" },
  { key: "loan_type", label: "Loan Type" },
  { key: "ltv", label: "LTV", format: "percent" },
  { key: "rate", label: "Rate", format: "percent" },
  { key: "term", label: "Term" },
  { key: "dscr", label: "DSCR", format: "number" },
  { key: "rehab_budget", label: "Rehab Budget", format: "currency" },
  { key: "arv", label: "ARV", format: "currency" },
  { key: "closing_date", label: "Closing Date" },
];

export const ENTITY_FIELD_MAP: Record<IntakeEntityKey, IntakeFieldDef[]> = {
  contact: CONTACT_FIELDS,
  company: COMPANY_FIELDS,
  property: PROPERTY_FIELDS,
  opportunity: OPPORTUNITY_FIELDS,
};

/** Entity display metadata */
export const ENTITY_META: Record<IntakeEntityKey, { label: string; color: string }> = {
  contact: { label: "Contact", color: "blue" },
  company: { label: "Company", color: "violet" },
  property: { label: "Property", color: "emerald" },
  opportunity: { label: "Deal", color: "amber" },
};

// ─── Utility: map parsed_data fields to entity-keyed objects for comparison ───

export function getIncomingContactData(p: IntakeParsedData): Record<string, unknown> {
  const nameParts = (p.contactName || "").split(" ");
  return {
    name: p.contactName || "",
    first_name: nameParts[0] || "",
    last_name: nameParts.slice(1).join(" ") || "",
    email: p.contactEmail || "",
    phone: p.contactPhone || "",
    address_line1: "",
    city: "",
    state: "",
  };
}

export function getIncomingCompanyData(p: IntakeParsedData): Record<string, unknown> {
  return {
    name: p.companyName || "",
    email: "",
    phone: "",
    state: p.stateOfFormation || "",
  };
}

export function getIncomingPropertyData(p: IntakeParsedData): Record<string, unknown> {
  return {
    address_line1: p.propertyAddress || "",
    city: p.propertyCity || "",
    state: p.propertyState || "",
    property_type: p.propertyType || "",
    number_of_units: p.units || 0,
    gross_building_area_sqft: p.sqft || 0,
    year_built: p.yearBuilt || 0,
    zoning: p.zoning || "",
  };
}

export function getIncomingOpportunityData(p: IntakeParsedData): Record<string, unknown> {
  return {
    amount: p.loanAmount || 0,
    loan_type: p.loanType || "",
    ltv: p.ltv || 0,
    rate: p.rate || 0,
    term: p.term || "",
    dscr: p.dscr || 0,
    rehab_budget: p.rehabBudget || 0,
    arv: p.arv || 0,
    closing_date: p.closingDate || "",
  };
}

export const INCOMING_DATA_MAP: Record<IntakeEntityKey, (p: IntakeParsedData) => Record<string, unknown>> = {
  contact: getIncomingContactData,
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
