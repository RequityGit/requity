// ---------------------------------------------------------------------------
// US States
// ---------------------------------------------------------------------------

export const US_STATES = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" },
  { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" },
  { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" },
  { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" },
  { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" },
  { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" },
  { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" },
  { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" },
  { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" },
  { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" },
  { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" },
  { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" },
  { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" },
  { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" },
  { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" },
  { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" },
  { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" },
  { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" },
  { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" },
  { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" },
  { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" },
  { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" },
  { value: "WY", label: "Wyoming" },
  { value: "DC", label: "District of Columbia" },
] as const;

// ---------------------------------------------------------------------------
// Entity Types
// ---------------------------------------------------------------------------

export const ENTITY_TYPES = [
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "s_corp", label: "S-Corp" },
  { value: "partnership", label: "Partnership" },
  { value: "limited_partnership", label: "Limited Partnership" },
  { value: "sole_proprietorship", label: "Sole Proprietorship" },
  { value: "trust", label: "Trust" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Loan Pipeline Stages
// ---------------------------------------------------------------------------

export const LOAN_STAGES = [
  "lead",
  "application",
  "processing",
  "underwriting",
  "approved",
  "clear_to_close",
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
  application: "Application",
  processing: "Processing",
  underwriting: "Underwriting",
  approved: "Approved",
  clear_to_close: "Clear to Close",
  funded: "Funded",
  servicing: "Servicing",
  payoff: "Payoff",
  default: "Default",
  reo: "REO",
  paid_off: "Paid Off",
};

// Pipeline stages shown on the Kanban board (active pipeline only)
export const PIPELINE_STAGES: LoanStage[] = [
  "lead",
  "application",
  "processing",
  "underwriting",
  "approved",
  "clear_to_close",
  "funded",
];

// Terminal stages not shown on Kanban
export const TERMINAL_STAGES: LoanStage[] = [
  "servicing",
  "payoff",
  "default",
  "reo",
  "paid_off",
];

// ---------------------------------------------------------------------------
// Loan Priority
// ---------------------------------------------------------------------------

export const LOAN_PRIORITIES = [
  { value: "hot", label: "Hot" },
  { value: "normal", label: "Normal" },
  { value: "on_hold", label: "On Hold" },
] as const;

export type LoanPriority = "hot" | "normal" | "on_hold";

export const PRIORITY_COLORS: Record<LoanPriority, string> = {
  hot: "bg-red-100 text-red-800 border-red-200",
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  on_hold: "bg-amber-100 text-amber-800 border-amber-200",
};

// ---------------------------------------------------------------------------
// Document Types
// ---------------------------------------------------------------------------

export const DOCUMENT_TYPES = [
  { value: "k1", label: "K-1" },
  { value: "distribution_statement", label: "Distribution Statement" },
  { value: "capital_call_notice", label: "Contribution Notice" },
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
  { value: "bridge_residential", label: "Residential Bridge" },
  { value: "bridge_commercial", label: "Commercial Bridge" },
  { value: "fix_and_flip", label: "Fix & Flip" },
  { value: "ground_up", label: "Ground-Up Construction" },
  { value: "dscr", label: "DSCR" },
  { value: "stabilized", label: "Stabilized" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// Fund Types
// ---------------------------------------------------------------------------

export const FUND_TYPES = [
  { value: "debt", label: "Debt Investment" },
  { value: "equity", label: "Equity Investment" },
  { value: "hybrid", label: "Hybrid Investment" },
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
// Condition Statuses
// ---------------------------------------------------------------------------

export const CONDITION_STATUSES = [
  { value: "not_requested", label: "Not Requested" },
  { value: "requested", label: "Requested" },
  { value: "received", label: "Received" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "waived", label: "Waived" },
  { value: "rejected", label: "Rejected" },
] as const;

export type ConditionStatus =
  | "not_requested"
  | "requested"
  | "received"
  | "under_review"
  | "approved"
  | "waived"
  | "rejected";

export const CONDITION_CATEGORIES = [
  { value: "pta", label: "Prior to Approval (PTA)" },
  { value: "ptf", label: "Prior to Funding (PTF)" },
] as const;

export const RESPONSIBLE_PARTIES = [
  { value: "borrower", label: "Borrower" },
  { value: "broker", label: "Broker" },
  { value: "title_company", label: "Title Company" },
  { value: "insurance_agent", label: "Insurance Agent" },
  { value: "internal", label: "Internal" },
  { value: "attorney", label: "Attorney" },
  { value: "other", label: "Other" },
] as const;

// ---------------------------------------------------------------------------
// CRM Contact Types
// ---------------------------------------------------------------------------

export const CRM_CONTACT_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospect" },
  { value: "borrower", label: "Borrower" },
  { value: "investor", label: "Investor" },
  { value: "broker", label: "Broker" },
  { value: "vendor", label: "Vendor" },
  { value: "other", label: "Other" },
] as const;

export const CRM_CONTACT_SOURCES = [
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "cold_call", label: "Cold Call" },
  { value: "social_media", label: "Social Media" },
  { value: "conference", label: "Conference" },
  { value: "existing_relationship", label: "Existing Relationship" },
  { value: "other", label: "Other" },
] as const;

export const CRM_CONTACT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "nurturing", label: "Nurturing" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "inactive", label: "Inactive" },
  { value: "do_not_contact", label: "Do Not Contact" },
] as const;

export const CRM_ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
  { value: "text_message", label: "Text Message" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "deal_update", label: "Deal Update" },
] as const;

// ---------------------------------------------------------------------------
// Activity Log Types
// ---------------------------------------------------------------------------

export const ACTIVITY_TYPES = [
  { value: "stage_change", label: "Stage Change" },
  { value: "note_added", label: "Note Added" },
  { value: "document_uploaded", label: "Document Uploaded" },
  { value: "condition_status_change", label: "Condition Updated" },
  { value: "assignment_change", label: "Assignment Changed" },
  { value: "terms_modified", label: "Terms Modified" },
  { value: "loan_created", label: "Loan Created" },
  { value: "message_sent", label: "Message Sent" },
  { value: "priority_change", label: "Priority Changed" },
  { value: "field_updated", label: "Field Updated" },
] as const;

// ---------------------------------------------------------------------------
// Status Colors
// ---------------------------------------------------------------------------

export const STATUS_COLORS: Record<string, string> = {
  // Loan pipeline stages
  lead: "bg-slate-100 text-slate-800",
  application: "bg-blue-100 text-blue-800",
  processing: "bg-indigo-100 text-indigo-800",
  underwriting: "bg-purple-100 text-purple-800",
  approved: "bg-green-100 text-green-800",
  clear_to_close: "bg-teal-100 text-teal-800",
  funded: "bg-emerald-100 text-emerald-800",
  servicing: "bg-cyan-100 text-cyan-800",
  payoff: "bg-gray-100 text-gray-800",
  default: "bg-red-100 text-red-800",
  reo: "bg-orange-100 text-orange-800",
  paid_off: "bg-gray-100 text-gray-600",

  // Generic statuses
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-gray-100 text-gray-800",
  overdue: "bg-red-100 text-red-800",
  paid: "bg-green-100 text-green-800",
  draft: "bg-slate-100 text-slate-800",

  // Draw request statuses
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-amber-100 text-amber-800",

  // Priority
  hot: "bg-red-100 text-red-800",
  normal: "bg-slate-100 text-slate-700",
  on_hold: "bg-amber-100 text-amber-800",

  // Condition statuses
  not_requested: "bg-gray-100 text-gray-600",
  requested: "bg-blue-100 text-blue-800",
  received: "bg-indigo-100 text-indigo-800",
  waived: "bg-slate-100 text-slate-600",

  // CRM statuses
  nurturing: "bg-purple-100 text-purple-800",
  qualified: "bg-teal-100 text-teal-800",
  converted: "bg-emerald-100 text-emerald-800",
  do_not_contact: "bg-red-100 text-red-800",

  // CRM contact types
  prospect: "bg-indigo-100 text-indigo-800",
  broker: "bg-orange-100 text-orange-800",
  vendor: "bg-cyan-100 text-cyan-800",
};

// Days-in-stage color thresholds
export function getDaysInStageColor(days: number): string {
  if (days <= 3) return "text-green-600";
  if (days <= 7) return "text-amber-600";
  return "text-red-600";
}

export function getDaysInStageBg(days: number): string {
  if (days <= 3) return "bg-green-50 text-green-700";
  if (days <= 7) return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}
