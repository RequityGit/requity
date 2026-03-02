/**
 * Database Constraint Constants — Single Source of Truth
 *
 * This file mirrors every CHECK constraint and custom enum in the Supabase
 * public schema. When a constraint is changed in the database, update the
 * corresponding constant here and all consuming code will stay in sync.
 *
 * Naming convention:
 *   TABLE_COLUMN  →  e.g. OPS_PROJECT_STATUSES for ops_projects.status
 *
 * Each section references the constraint name so you can trace it back to
 * the migration that created it.
 */

// ============================================
// profiles
// ============================================

/** Constraint: profiles_role_check */
export const PROFILE_ROLES = ["investor", "borrower", "admin"] as const;
export type ProfileRole = (typeof PROFILE_ROLES)[number];

/** Constraint: profiles_activation_status_check */
export const PROFILE_ACTIVATION_STATUSES = [
  "pending",
  "link_sent",
  "activated",
] as const;
export type ProfileActivationStatus =
  (typeof PROFILE_ACTIVATION_STATUSES)[number];

// ============================================
// funds
// ============================================

/** Constraint: funds_fund_type_check */
export const FUND_TYPES = [
  { value: "debt", label: "Debt Investment" },
  { value: "equity", label: "Equity Investment" },
  { value: "hybrid", label: "Hybrid Investment" },
] as const;
export const FUND_TYPE_VALUES = ["debt", "equity", "hybrid"] as const;
export type FundType = (typeof FUND_TYPE_VALUES)[number];

/** Constraint: funds_status_check */
export const FUND_STATUSES = ["open", "closed", "fully_deployed"] as const;
export type FundStatus = (typeof FUND_STATUSES)[number];

// ============================================
// investor_commitments
// ============================================

/** Constraint: investor_commitments_status_check */
export const INVESTOR_COMMITMENT_STATUSES = [
  "active",
  "partially_called",
  "fully_called",
  "redeemed",
] as const;
export type InvestorCommitmentStatus =
  (typeof INVESTOR_COMMITMENT_STATUSES)[number];

// ============================================
// capital_calls
// ============================================

/** Constraint: capital_calls_status_check */
export const CAPITAL_CALL_STATUSES = [
  "pending",
  "paid",
  "overdue",
] as const;
export type CapitalCallStatus = (typeof CAPITAL_CALL_STATUSES)[number];

// ============================================
// distributions
// ============================================

/** Constraint: distributions_distribution_type_check */
export const DISTRIBUTION_TYPES = [
  { value: "income", label: "Income" },
  { value: "return_of_capital", label: "Return of Capital" },
  { value: "gain", label: "Capital Gain" },
] as const;
export const DISTRIBUTION_TYPE_VALUES = [
  "income",
  "return_of_capital",
  "gain",
] as const;
export type DistributionType = (typeof DISTRIBUTION_TYPE_VALUES)[number];

/** Constraint: distributions_status_check */
export const DISTRIBUTION_STATUSES = [
  "pending",
  "paid",
  "cancelled",
] as const;
export type DistributionStatus = (typeof DISTRIBUTION_STATUSES)[number];

// ============================================
// loans — stage (pipeline tracking)
// ============================================

/**
 * Constraint: loans_stage_check
 * Includes both active pipeline stages and terminal/underwriting stages.
 */
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
  // Underwriting-specific stages (added by rtl_underwriting_engine migration)
  "draft",
  "submitted",
  "in_review",
  "denied",
  "withdrawn",
  "note_sold",
] as const;
export type LoanStage = (typeof LOAN_STAGES)[number];

export const LOAN_STAGE_LABELS: Record<string, string> = {
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
  draft: "Draft",
  submitted: "Submitted",
  in_review: "In Review",
  denied: "Denied",
  withdrawn: "Withdrawn",
  note_sold: "Note Sold",
};

/** Active pipeline stages shown on Kanban board */
export const PIPELINE_STAGES: LoanStage[] = [
  "lead",
  "application",
  "processing",
  "underwriting",
  "approved",
  "clear_to_close",
  "funded",
];

/** Terminal stages not shown on Kanban */
export const TERMINAL_STAGES: LoanStage[] = [
  "servicing",
  "payoff",
  "default",
  "reo",
  "paid_off",
];

// ============================================
// loans — type (DB enum: loan_type)
// ============================================

/** DB enum: loan_type */
export const LOAN_DB_TYPES = [
  { value: "commercial", label: "Commercial" },
  { value: "dscr", label: "DSCR" },
  { value: "guc", label: "Ground Up Construction" },
  { value: "rtl", label: "RTL (Fix & Flip)" },
  { value: "transactional", label: "Transactional" },
] as const;
export const LOAN_DB_TYPE_VALUES = [
  "commercial",
  "dscr",
  "guc",
  "rtl",
  "transactional",
] as const;
export type LoanDbType = (typeof LOAN_DB_TYPE_VALUES)[number];

/**
 * Constraint: loans_loan_type_check (TEXT column, legacy)
 * Note: The `type` column uses the DB enum loan_type (above).
 * The `loan_type` TEXT column uses this separate check constraint.
 */
export const LOAN_TYPE_CHECK_VALUES = [
  "bridge_residential",
  "bridge_commercial",
  "fix_and_flip",
  "ground_up",
  "stabilized",
  "dscr",
  "rtl",
  "other",
] as const;

// ============================================
// loans — purpose (DB enum: loan_purpose)
// ============================================

/** DB enum: loan_purpose */
export const LOAN_PURPOSES = [
  { value: "purchase", label: "Purchase" },
  { value: "refinance", label: "Refinance" },
  { value: "cash_out_refinance", label: "Cash-Out Refinance" },
] as const;
export const LOAN_PURPOSE_VALUES = [
  "purchase",
  "refinance",
  "cash_out_refinance",
] as const;
export type LoanPurpose = (typeof LOAN_PURPOSE_VALUES)[number];

// ============================================
// loans — priority
// ============================================

/** Constraint: loans_priority_check */
export const LOAN_PRIORITIES = [
  { value: "hot", label: "Hot" },
  { value: "normal", label: "Normal" },
  { value: "on_hold", label: "On Hold" },
] as const;
export const LOAN_PRIORITY_VALUES = ["hot", "normal", "on_hold"] as const;
export type LoanPriority = (typeof LOAN_PRIORITY_VALUES)[number];

// ============================================
// loans — property_type (DB enum: property_type)
// ============================================

/** DB enum: property_type */
export const PROPERTY_TYPES = [
  "sfr",
  "condo",
  "townhouse",
  "duplex",
  "triplex",
  "fourplex",
  "multifamily_5_plus",
  "mixed_use",
  "retail",
  "office",
  "industrial",
  "mobile_home_park",
  "land",
  "other",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

// ============================================
// draw_requests
// ============================================

/** Constraint: draw_requests_status_check (updated to use 'denied' instead of 'rejected') */
export const DRAW_REQUEST_STATUSES = [
  "submitted",
  "under_review",
  "approved",
  "funded",
  "denied",
] as const;
export type DrawRequestStatus = (typeof DRAW_REQUEST_STATUSES)[number];

// ============================================
// loan_draws
// ============================================

/** Constraint: inline check on loan_draws.status */
export const LOAN_DRAW_STATUSES = [
  "pending",
  "requested",
  "inspected",
  "approved",
  "funded",
  "denied",
] as const;
export type LoanDrawStatus = (typeof LOAN_DRAW_STATUSES)[number];

// ============================================
// loan_payments
// ============================================

/** Constraint: loan_payments_status_check */
export const LOAN_PAYMENT_STATUSES = [
  "pending",
  "paid",
  "overdue",
  "partial",
] as const;
export type LoanPaymentStatus = (typeof LOAN_PAYMENT_STATUSES)[number];

// ============================================
// documents
// ============================================

/** Constraint: documents_status_check */
export const DOCUMENT_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

// ============================================
// investors
// ============================================

/** Constraint: inline check on investors.accreditation_status */
export const ACCREDITATION_STATUSES = [
  "pending",
  "verified",
  "expired",
  "not_accredited",
] as const;
export type AccreditationStatus = (typeof ACCREDITATION_STATUSES)[number];

// ============================================
// loan_conditions — status (DB enum: condition_status)
// ============================================

/**
 * DB enum: condition_status
 * Note: The DB enum includes 'not_requested', 'requested', 'received'
 * which were added later and are not shown in all frontends.
 */
export const CONDITION_STATUSES = [
  { value: "pending", label: "Pending" },
  { value: "submitted", label: "Submitted" },
  { value: "under_review", label: "Under Review" },
  { value: "approved", label: "Approved" },
  { value: "waived", label: "Waived" },
  { value: "not_applicable", label: "Not Applicable" },
  { value: "rejected", label: "Rejected" },
] as const;
export const CONDITION_STATUS_VALUES = [
  "pending",
  "submitted",
  "under_review",
  "approved",
  "waived",
  "not_applicable",
  "rejected",
  // DB enum has these extra values — not shown in standard condition forms
  // but may exist in data. Keep in DB enum for backward compat.
  "not_requested",
  "requested",
  "received",
] as const;
export type ConditionStatus = (typeof CONDITION_STATUS_VALUES)[number];

// ============================================
// loan_conditions — category (DB enum: condition_category)
// ============================================

/** DB enum: condition_category */
export const CONDITION_CATEGORIES = [
  { value: "borrower_documents", label: "Borrower Documents" },
  { value: "non_us_citizen", label: "Non-US Citizen" },
  { value: "entity_documents", label: "Entity Documents" },
  { value: "deal_level_items", label: "Deal Level Items" },
  { value: "appraisal_request", label: "Appraisal Request" },
  { value: "title_fraud_protection", label: "Title / Fraud Protection" },
  { value: "lender_package", label: "Lender Package" },
  { value: "insurance_request", label: "Insurance Request" },
  { value: "title_request", label: "Title Request" },
  { value: "fundraising", label: "Fundraising" },
  { value: "closing_prep", label: "Closing Prep" },
  { value: "post_closing_items", label: "Post-Closing Items" },
  { value: "note_sell_process", label: "Note Sell Process" },
  { value: "post_loan_payoff", label: "Post Loan Payoff" },
  { value: "prior_to_approval", label: "Prior to Approval" },
  { value: "prior_to_funding", label: "Prior to Funding" },
] as const;
export const CONDITION_CATEGORY_VALUES = [
  "borrower_documents",
  "non_us_citizen",
  "entity_documents",
  "deal_level_items",
  "appraisal_request",
  "title_fraud_protection",
  "lender_package",
  "insurance_request",
  "title_request",
  "fundraising",
  "closing_prep",
  "post_closing_items",
  "note_sell_process",
  "post_loan_payoff",
  "prior_to_approval",
  "prior_to_funding",
] as const;
export type ConditionCategory = (typeof CONDITION_CATEGORY_VALUES)[number];

// ============================================
// loan_conditions — stage (DB enum: condition_stage)
// ============================================

/** DB enum: condition_stage */
export const CONDITION_STAGES = [
  { value: "processing", label: "Processing" },
  { value: "closed_onboarding", label: "Closed / Onboarding" },
  { value: "note_sell_process", label: "Note Sell Process" },
  { value: "post_loan_payoff", label: "Post Loan Payoff" },
] as const;
export const CONDITION_STAGE_VALUES = [
  "processing",
  "closed_onboarding",
  "note_sell_process",
  "post_loan_payoff",
] as const;
export type ConditionStage = (typeof CONDITION_STAGE_VALUES)[number];

// ============================================
// loan_condition_templates — responsible_party
// ============================================

export const RESPONSIBLE_PARTIES = [
  { value: "borrower", label: "Borrower" },
  { value: "broker", label: "Broker" },
  { value: "title_company", label: "Title Company" },
  { value: "insurance_agent", label: "Insurance Agent" },
  { value: "internal", label: "Internal" },
  { value: "attorney", label: "Attorney" },
  { value: "other", label: "Other" },
] as const;

// ============================================
// loan_activity_log
// ============================================

/** Constraint: inline check on loan_activity_log.activity_type */
export const LOAN_ACTIVITY_TYPES = [
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

// ============================================
// loan_comps
// ============================================

/** Constraint: inline check on loan_comps.comp_type */
export const LOAN_COMP_TYPES = [
  "subject",
  "sold_1",
  "sold_2",
  "sold_3",
  "active_1",
  "active_2",
  "active_3",
] as const;
export type LoanCompType = (typeof LOAN_COMP_TYPES)[number];

// ============================================
// loan_eligibility_checks
// ============================================

/** Constraint: inline checks on eligibility columns */
export const ELIGIBILITY_CHECK_VALUES = ["PASS", "FAIL", "N/A"] as const;
export type EligibilityCheckResult =
  (typeof ELIGIBILITY_CHECK_VALUES)[number];

export const ELIGIBILITY_OVERALL_VALUES = [
  "ELIGIBLE",
  "NOT ELIGIBLE",
] as const;
export type EligibilityOverallResult =
  (typeof ELIGIBILITY_OVERALL_VALUES)[number];

// ============================================
// loan_comments
// ============================================

/** Constraint: inline check on loan_comments.comment_type */
export const LOAN_COMMENT_TYPES = ["loan", "condition"] as const;
export type LoanCommentType = (typeof LOAN_COMMENT_TYPES)[number];

// ============================================
// commercial_underwriting
// ============================================

/** Constraint: inline check on commercial_underwriting.status */
export const COMMERCIAL_UW_STATUSES = [
  "draft",
  "in_review",
  "approved",
  "rejected",
] as const;
export type CommercialUWStatus = (typeof COMMERCIAL_UW_STATUSES)[number];

// ============================================
// commercial_expense_defaults
// ============================================

/** Constraint: inline check on commercial_expense_defaults.basis */
export const COMMERCIAL_EXPENSE_BASES = [
  "per_unit",
  "per_sf",
  "per_room",
  "per_pad",
  "per_site",
  "per_slip",
] as const;
export type CommercialExpenseBasis =
  (typeof COMMERCIAL_EXPENSE_BASES)[number];

// ============================================
// commercial_upload_mappings
// ============================================

/** Constraint: inline check on commercial_upload_mappings.upload_type */
export const COMMERCIAL_UPLOAD_TYPES = ["rent_roll", "t12"] as const;
export type CommercialUploadType = (typeof COMMERCIAL_UPLOAD_TYPES)[number];

// ============================================
// crm_contacts (CHECK constraints on TEXT columns)
// ============================================

/**
 * Constraint: crm_contacts_contact_type_check
 * Note: The DB also has a crm_contact_type enum with additional values
 * (partner, referral) used by the new CRM data model.
 */
export const CRM_CONTACT_TYPES = [
  { value: "lead", label: "Lead" },
  { value: "prospect", label: "Prospect" },
  { value: "borrower", label: "Borrower" },
  { value: "investor", label: "Investor" },
  { value: "broker", label: "Broker" },
  { value: "vendor", label: "Vendor" },
  { value: "other", label: "Other" },
] as const;

/**
 * Constraint: crm_contacts_source_check / crm_contact_source enum
 * Only values shown in UI are listed here. Hidden DB values:
 * email_campaign, paid_ad, organic, repeat_client, social_media
 */
export const CRM_CONTACT_SOURCES = [
  { value: "cold_call", label: "Cold Call" },
  { value: "inbound_call", label: "Inbound Call" },
  { value: "broker", label: "Broker" },
  { value: "referral", label: "Referral" },
  { value: "website", label: "Website" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "facebook", label: "Facebook" },
  { value: "event", label: "Event" },
  { value: "cix", label: "CIX" },
  { value: "lendersa", label: "LenderSA" },
  { value: "bl2425apn", label: "BL2425APN" },
  { value: "capitalize", label: "Capitalize" },
  { value: "data_migration", label: "Data Migration" },
  { value: "other", label: "Other" },
] as const;

/**
 * Constraint: crm_contacts_status_check
 * Note: The DB also has a crm_contact_status enum with different values
 * (active, inactive, converted, lost, do_not_contact) used by the new model.
 */
export const CRM_CONTACT_STATUSES = [
  { value: "active", label: "Active" },
  { value: "nurturing", label: "Nurturing" },
  { value: "qualified", label: "Qualified" },
  { value: "converted", label: "Converted" },
  { value: "inactive", label: "Inactive" },
  { value: "do_not_contact", label: "Do Not Contact" },
] as const;

// ============================================
// crm_activities
// ============================================

/** Constraint: inline check on crm_activities.activity_type */
export const CRM_ACTIVITY_TYPES = [
  { value: "call", label: "Call" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "note", label: "Note" },
  { value: "text_message", label: "Text Message" },
  { value: "follow_up", label: "Follow-Up" },
  { value: "deal_update", label: "Deal Update" },
] as const;

// ============================================
// CRM — New Data Model (DB enums)
// ============================================

/** DB enum: relationship_type_enum */
export const CRM_RELATIONSHIP_TYPES = [
  { value: "borrower", label: "Borrower" },
  { value: "investor", label: "Investor" },
  { value: "broker", label: "Broker" },
  { value: "lender", label: "Lender" },
  { value: "vendor", label: "Vendor" },
  { value: "referral_partner", label: "Referral Partner" },
] as const;

/** DB enum: lifecycle_stage_enum — "lead" exists in DB but is hidden from UI */
export const CRM_LIFECYCLE_STAGES = [
  { value: "uncontacted", label: "Uncontacted" },
  { value: "prospect", label: "Prospect" },
  { value: "active", label: "Active" },
  { value: "past", label: "Past" },
] as const;

/** DB enum: lender_direction_enum */
export const CRM_LENDER_DIRECTIONS = [
  { value: "broker_to", label: "Broker To" },
  { value: "note_buyer", label: "Note Buyer" },
  { value: "capital_partner", label: "Capital Partner" },
  { value: "co_lender", label: "Co-Lender" },
  { value: "referral_from", label: "Referral From" },
] as const;

/** DB enum: vendor_type_enum */
export const CRM_VENDOR_TYPES = [
  { value: "title_company", label: "Title Company" },
  { value: "law_firm", label: "Law Firm" },
  { value: "insurance", label: "Insurance" },
  { value: "appraisal", label: "Appraisal" },
  { value: "engineer", label: "Engineer" },
  { value: "inspector", label: "Inspector" },
  { value: "software", label: "Software" },
  { value: "accounting_firm", label: "Accounting Firm" },
  { value: "other", label: "Other" },
] as const;

/** DB enum: company_type_enum */
export const CRM_COMPANY_TYPES = [
  { value: "brokerage", label: "Brokerage" },
  { value: "lender", label: "Lender" },
  { value: "title_company", label: "Title Company" },
  { value: "law_firm", label: "Law Firm" },
  { value: "insurance", label: "Insurance" },
  { value: "appraisal", label: "Appraisal" },
  { value: "other", label: "Other" },
] as const;

// ============================================
// ops_projects
// ============================================

/** Constraint: project_tracker_status_check */
export const OPS_PROJECT_STATUSES = [
  "Not Started",
  "Planning",
  "In Progress",
  "Blocked",
  "On Hold",
  "Complete",
] as const;
export type OpsProjectStatus = (typeof OPS_PROJECT_STATUSES)[number];

/** Constraint: ops_projects_priority_check */
export const OPS_PROJECT_PRIORITIES = [
  "Critical",
  "High",
  "Medium",
  "Low",
] as const;
export type OpsProjectPriority = (typeof OPS_PROJECT_PRIORITIES)[number];

/** Constraint: ops_projects_category_check */
export const OPS_PROJECT_CATEGORIES = [
  "Engineering",
  "Marketing",
  "Finance",
  "Operations",
  "Compliance",
  "Legal",
  "Sales",
  "HR",
  "Underwriting",
  "Servicing",
  "Capital Markets",
  "IT",
  "General",
] as const;
export type OpsProjectCategory = (typeof OPS_PROJECT_CATEGORIES)[number];

// ============================================
// ops_tasks
// ============================================

/** Constraint: ops_tasks_status_check */
export const OPS_TASK_STATUSES = [
  "To Do",
  "In Progress",
  "In Review",
  "Blocked",
  "Complete",
] as const;
export type OpsTaskStatus = (typeof OPS_TASK_STATUSES)[number];

/** Constraint: ops_tasks_priority_check */
export const OPS_TASK_PRIORITIES = [
  "Critical",
  "High",
  "Medium",
  "Low",
] as const;
export type OpsTaskPriority = (typeof OPS_TASK_PRIORITIES)[number];

// ============================================
// Entity types (borrower_entities / investing_entities)
// ============================================

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

// ============================================
// Document types
// ============================================

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

// ============================================
// Loan types (display classification, not a DB constraint)
// ============================================

export const LOAN_TYPES = [
  { value: "bridge_residential", label: "Residential Bridge" },
  { value: "bridge_commercial", label: "Commercial Bridge" },
  { value: "fix_and_flip", label: "Fix & Flip" },
  { value: "ground_up", label: "Ground-Up Construction" },
  { value: "dscr", label: "DSCR" },
  { value: "stabilized", label: "Stabilized" },
  { value: "other", label: "Other" },
] as const;

// ============================================
// Marketing / Campaigns (DB enums)
// ============================================

/** DB enum: campaign_status_enum */
export const CAMPAIGN_STATUSES = [
  "draft",
  "active",
  "paused",
  "completed",
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/** DB enum: campaign_type_enum */
export const CAMPAIGN_TYPES = [
  "investor_update",
  "lead_nurture",
  "borrower_reengagement",
  "broker_reengagement",
] as const;
export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

/** DB enum: send_status_enum */
export const SEND_STATUSES = [
  "pending",
  "sent",
  "delivered",
  "bounced",
  "failed",
] as const;
export type SendStatus = (typeof SEND_STATUSES)[number];

// ============================================
// Dialer / Calls (DB enums)
// ============================================

/** DB enum: call_status_enum */
export const CALL_STATUSES = [
  "initiated",
  "ringing",
  "in_progress",
  "completed",
  "failed",
  "no_answer",
  "busy",
  "voicemail",
] as const;
export type CallStatus = (typeof CALL_STATUSES)[number];

/** DB enum: call_direction_enum */
export const CALL_DIRECTIONS = ["inbound", "outbound"] as const;
export type CallDirection = (typeof CALL_DIRECTIONS)[number];

// ============================================
// Audit (DB enums)
// ============================================

/** DB enum: audit_action_enum */
export const AUDIT_ACTIONS = ["insert", "update", "delete"] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

/** DB enum: activity_direction_enum */
export const ACTIVITY_DIRECTIONS = ["inbound", "outbound"] as const;
export type ActivityDirection = (typeof ACTIVITY_DIRECTIONS)[number];

/** DB enum: linked_entity_type_enum */
export const LINKED_ENTITY_TYPES = [
  "loan",
  "borrower",
  "investor",
  "fund",
] as const;
export type LinkedEntityType = (typeof LINKED_ENTITY_TYPES)[number];

// ============================================
// App roles (DB enum: app_role)
// ============================================

/** DB enum: app_role */
export const APP_ROLES = [
  "super_admin",
  "admin",
  "investor",
  "borrower",
] as const;
export type AppRole = (typeof APP_ROLES)[number];

// ============================================
// Opportunities — Pipeline Stages
// ============================================

/** Opportunity pipeline stages (on opportunities table) */
export const OPPORTUNITY_STAGES = [
  "awaiting_info",
  "uw",
  "quoting",
  "offer_placed",
  "processing",
  "closed",
  "onboarding",
  "closed_lost",
] as const;
export type OpportunityStage = (typeof OPPORTUNITY_STAGES)[number];

/** Active pipeline stages shown on board */
export const OPPORTUNITY_PIPELINE_STAGES: OpportunityStage[] = [
  "awaiting_info",
  "uw",
  "quoting",
  "offer_placed",
  "processing",
  "closed",
  "onboarding",
];

export const OPPORTUNITY_STAGE_LABELS: Record<string, string> = {
  awaiting_info: "Awaiting Info",
  uw: "UW",
  quoting: "Quoting",
  offer_placed: "Offer(s) Placed",
  processing: "Processing",
  closed: "Closed",
  onboarding: "Onboarding",
  closed_lost: "Closed Lost",
};

export const OPPORTUNITY_STAGE_COLORS: Record<string, string> = {
  awaiting_info: "bg-slate-100 text-slate-800",
  uw: "bg-purple-100 text-purple-800",
  quoting: "bg-blue-100 text-blue-800",
  offer_placed: "bg-indigo-100 text-indigo-800",
  processing: "bg-amber-100 text-amber-800",
  closed: "bg-green-100 text-green-800",
  onboarding: "bg-teal-100 text-teal-800",
  closed_lost: "bg-red-100 text-red-800",
};

/** Loss reasons when stage = closed_lost */
export const LOSS_REASONS = [
  { value: "unqualified", label: "Unqualified" },
  { value: "pricing_lost_to_competitor", label: "Pricing / Lost to Competitor" },
  { value: "non_responsive_borrower", label: "Non-Responsive Borrower" },
  { value: "business_plan_change", label: "Business Plan Change" },
  { value: "ice", label: "ICE (On Hold)" },
] as const;

// ============================================
// Opportunities — Funding Channel
// ============================================

export const FUNDING_CHANNELS = [
  { value: "balance_sheet", label: "Balance Sheet" },
  { value: "brokered", label: "Brokered" },
  { value: "correspondent", label: "Correspondent" },
] as const;

// ============================================
// Opportunities — Approval Status
// ============================================

export const APPROVAL_STATUSES = [
  { value: "not_required", label: "Not Required" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "auto_approved", label: "Auto-Approved" },
  { value: "auto_flagged", label: "Auto-Flagged" },
] as const;

export const APPROVAL_STATUS_COLORS: Record<string, string> = {
  not_required: "bg-slate-100 text-slate-600",
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  denied: "bg-red-100 text-red-800",
  auto_approved: "bg-green-100 text-green-800",
  auto_flagged: "bg-red-100 text-red-800",
};

// ============================================
// Opportunities — Deal Classification
// ============================================

export const DEBT_TRANCHES = [
  { value: "mezzanine", label: "Mezzanine" },
  { value: "senior_financing", label: "Senior Financing" },
  { value: "preferred_equity", label: "Preferred Equity" },
] as const;

export const INVESTMENT_STRATEGIES = [
  { value: "core", label: "Core" },
  { value: "core_plus", label: "Core Plus" },
  { value: "value_add", label: "Value Add" },
  { value: "opportunistic", label: "Opportunistic" },
  { value: "distressed", label: "Distressed" },
  { value: "debt", label: "Debt" },
  { value: "fund_of_funds", label: "Fund of Funds" },
  { value: "secondaries", label: "Secondaries" },
] as const;

export const DEAL_FINANCING_OPTIONS = [
  { value: "all_cash", label: "All Cash" },
  { value: "financed_by_buyer", label: "Financed by Buyer" },
  { value: "financed_by_competitor", label: "Financed by Competitor" },
  { value: "debt_assumed", label: "Debt Assumed" },
  { value: "financed_by_requity", label: "Financed by Requity" },
] as const;

export const VALUE_METHODS = [
  { value: "underwritten_arv", label: "Underwritten ARV" },
  { value: "borrower_arv", label: "Borrower ARV" },
  { value: "appraisal_1_arv", label: "Appraisal 1 ARV" },
  { value: "appraisal_2_arv", label: "Appraisal 2 ARV" },
] as const;

export const PREPAYMENT_PENALTY_TYPES = [
  { value: "none", label: "None" },
  { value: "flat", label: "Flat" },
  { value: "step_down", label: "Step Down" },
  { value: "yield_maintenance", label: "Yield Maintenance" },
  { value: "defeasance", label: "Defeasance" },
] as const;

export const RENTAL_STATUSES = [
  { value: "owner_occupied", label: "Owner Occupied" },
  { value: "non_owner_occupied", label: "Non-Owner Occupied" },
  { value: "partially_owner_occupied", label: "Partially Owner Occupied" },
  { value: "vacant", label: "Vacant" },
  { value: "partially_vacant", label: "Partially Vacant" },
] as const;

export const LEASE_TYPES = [
  { value: "nnn", label: "NNN" },
  { value: "nn", label: "NN" },
  { value: "gross", label: "Gross" },
] as const;

// ============================================
// Opportunities — Borrower Roles
// ============================================

export const BORROWER_ROLES = [
  { value: "primary", label: "Primary (B1)" },
  { value: "co_borrower", label: "Co-Borrower" },
  { value: "guarantor", label: "Guarantor" },
  { value: "key_principal", label: "Key Principal" },
] as const;

// ============================================
// Property Financial Snapshots
// ============================================

export const SNAPSHOT_TYPES = [
  { value: "rent_roll", label: "Rent Roll" },
  { value: "t12", label: "T12" },
  { value: "pro_forma", label: "Pro Forma" },
  { value: "appraisal", label: "Appraisal" },
  { value: "broker_opinion", label: "Broker Opinion" },
] as const;

export const SNAPSHOT_SOURCES = [
  { value: "borrower_provided", label: "Borrower Provided" },
  { value: "appraiser", label: "Appraiser" },
  { value: "property_manager", label: "Property Manager" },
  { value: "broker", label: "Broker" },
  { value: "internal_uw", label: "Internal UW" },
  { value: "other", label: "Other" },
] as const;

// ============================================
// Property — Asset Types & Classification
// ============================================

export const ASSET_TYPES = [
  { value: "Residential", label: "Residential" },
  { value: "Multifamily", label: "Multifamily" },
  { value: "MHC", label: "MHC" },
  { value: "RV Campground", label: "RV Campground" },
  { value: "Industrial", label: "Industrial" },
  { value: "Land", label: "Land" },
  { value: "Retail", label: "Retail" },
  { value: "Self-storage", label: "Self-storage" },
  { value: "Hotels & Hospitality", label: "Hotels & Hospitality" },
  { value: "Healthcare", label: "Healthcare" },
  { value: "Mixed Use", label: "Mixed Use" },
  { value: "Office", label: "Office" },
  { value: "Other", label: "Other" },
] as const;

export const BUILDING_CLASSES = [
  { value: "trophy", label: "Trophy" },
  { value: "class_a", label: "Class A" },
  { value: "class_b", label: "Class B" },
  { value: "class_c", label: "Class C" },
  { value: "class_sub_c", label: "Sub-C" },
  { value: "not_applicable", label: "N/A" },
] as const;

export const BUILDING_STATUSES = [
  { value: "existing", label: "Existing" },
  { value: "under_construction", label: "Under Construction" },
  { value: "proposed_no_permission", label: "Proposed (No Permission)" },
  { value: "proposed", label: "Proposed" },
  { value: "under_renovation", label: "Under Renovation" },
] as const;

export const SEWER_SYSTEMS = [
  { value: "city_sewer_direct", label: "City Sewer (Direct)" },
  { value: "city_sewer_billed_back", label: "City Sewer (Billed Back)" },
  { value: "septic_1_1", label: "Septic 1:1" },
  { value: "septic_2_1", label: "Septic 2:1" },
  { value: "septic_other", label: "Septic Other" },
  { value: "wwtp", label: "WWTP" },
  { value: "other", label: "Other" },
] as const;

export const WATER_SYSTEMS = [
  { value: "city_water_direct", label: "City Water (Direct)" },
  { value: "city_water_master_billed", label: "City Water (Master Billed)" },
  { value: "city_water_master_not_billed", label: "City Water (Master Not Billed)" },
  { value: "well_water", label: "Well Water" },
] as const;

export const PERMITTING_STATUSES = [
  { value: "no_permits_required", label: "No Permits Required" },
  { value: "fully_permitted", label: "Fully Permitted" },
  { value: "permits_pending", label: "Permits Pending" },
  { value: "permits_required_not_submitted", label: "Permits Required (Not Submitted)" },
  { value: "unknown", label: "Unknown" },
] as const;

export const FLOOD_ZONES = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "partial", label: "Partial" },
] as const;

export const LISTING_STATUSES = [
  { value: "listed", label: "Listed" },
  { value: "recent_listed", label: "Recently Listed" },
  { value: "not_listed", label: "Not Listed" },
] as const;

export const CONDO_STATUSES = [
  { value: "not_a_condo", label: "Not a Condo" },
  { value: "warrantable", label: "Warrantable" },
  { value: "non_warrantable", label: "Non-Warrantable" },
] as const;

// ============================================
// Entity Owner Titles
// ============================================

export const ENTITY_OWNER_TITLES = [
  { value: "member", label: "Member" },
  { value: "manager", label: "Manager" },
  { value: "managing_member", label: "Managing Member" },
  { value: "authorized_signer", label: "Authorized Signer" },
  { value: "officer", label: "Officer" },
] as const;
