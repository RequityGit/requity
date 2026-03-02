/**
 * Application constants.
 *
 * Constraint-backed values (enums, check constraints) are defined in
 * @/lib/constants/db-enums.ts — the single source of truth.
 * This file re-exports them for backward compatibility and adds
 * UI-only constants (colors, labels, helpers) that don't map to constraints.
 */

// Re-export everything from the single source of truth
export {
  // Entity types
  ENTITY_TYPES,
  // Loan stages
  LOAN_STAGES,
  LOAN_STAGE_LABELS,
  PIPELINE_STAGES,
  TERMINAL_STAGES,
  // Loan DB types
  LOAN_DB_TYPES,
  // Loan types (display)
  LOAN_TYPES,
  // Loan purposes
  LOAN_PURPOSES,
  // Loan priorities
  LOAN_PRIORITIES,
  // Fund types
  FUND_TYPES,
  // Distribution types
  DISTRIBUTION_TYPES,
  // Condition statuses / categories / stages
  CONDITION_STATUSES,
  CONDITION_CATEGORIES,
  CONDITION_STAGES,
  RESPONSIBLE_PARTIES,
  // CRM
  CRM_CONTACT_TYPES,
  CRM_CONTACT_SOURCES,
  CRM_CONTACT_STATUSES,
  CRM_RELATIONSHIP_TYPES,
  CRM_LIFECYCLE_STAGES,
  CRM_LENDER_DIRECTIONS,
  CRM_VENDOR_TYPES,
  CRM_COMPANY_TYPES,
  CRM_ACTIVITY_TYPES,
  // Document types
  DOCUMENT_TYPES,
  // Ops
  OPS_PROJECT_STATUSES,
  OPS_PROJECT_PRIORITIES,
  OPS_PROJECT_CATEGORIES,
  OPS_TASK_STATUSES,
  OPS_TASK_PRIORITIES,
  // Opportunity pipeline
  OPPORTUNITY_STAGES,
  OPPORTUNITY_PIPELINE_STAGES,
  OPPORTUNITY_STAGE_LABELS,
  OPPORTUNITY_STAGE_COLORS,
  LOSS_REASONS,
  FUNDING_CHANNELS,
  APPROVAL_STATUSES,
  APPROVAL_STATUS_COLORS,
  DEBT_TRANCHES,
  INVESTMENT_STRATEGIES,
  DEAL_FINANCING_OPTIONS,
  VALUE_METHODS,
  PREPAYMENT_PENALTY_TYPES,
  RENTAL_STATUSES,
  LEASE_TYPES,
  BORROWER_ROLES,
  SNAPSHOT_TYPES,
  SNAPSHOT_SOURCES,
  ASSET_TYPES,
  BUILDING_CLASSES,
  BUILDING_STATUSES,
  SEWER_SYSTEMS,
  WATER_SYSTEMS,
  PERMITTING_STATUSES,
  FLOOD_ZONES,
  LISTING_STATUSES,
  CONDO_STATUSES,
  ENTITY_OWNER_TITLES,
} from "@/lib/constants/db-enums";

// Re-export types
export type {
  LoanStage,
  LoanPriority,
  ConditionStatus,
  OpportunityStage,
} from "@/lib/constants/db-enums";

// Loan activity types re-exported with legacy name
export { LOAN_ACTIVITY_TYPES as ACTIVITY_TYPES } from "@/lib/constants/db-enums";

// ---------------------------------------------------------------------------
// US States (not a DB constraint, but widely used)
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
// UI Color Maps (not DB constraints, only used for styling)
// ---------------------------------------------------------------------------

export const PRIORITY_COLORS: Record<string, string> = {
  hot: "bg-red-100 text-red-800 border-red-200",
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  on_hold: "bg-amber-100 text-amber-800 border-amber-200",
};

export const RELATIONSHIP_COLORS: Record<string, string> = {
  borrower: "bg-blue-100 text-blue-800 border-blue-200",
  investor: "bg-green-100 text-green-800 border-green-200",
  broker: "bg-orange-100 text-orange-800 border-orange-200",
  lender: "bg-purple-100 text-purple-800 border-purple-200",
  vendor: "bg-gray-100 text-gray-800 border-gray-200",
  referral_partner: "bg-teal-100 text-teal-800 border-teal-200",
};

export const LIFECYCLE_STAGE_COLORS: Record<string, string> = {
  uncontacted: "bg-slate-100 text-slate-800",
  lead: "bg-slate-100 text-slate-800",
  prospect: "bg-amber-100 text-amber-800",
  active: "bg-green-100 text-green-800",
  past: "bg-gray-100 text-gray-500",
};

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
  denied: "bg-red-100 text-red-800",

  // Priority
  hot: "bg-red-100 text-red-800",
  normal: "bg-slate-100 text-slate-700",
  on_hold: "bg-amber-100 text-amber-800",

  // Condition statuses
  not_applicable: "bg-slate-100 text-slate-500",
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
