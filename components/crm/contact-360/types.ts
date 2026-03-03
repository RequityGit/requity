import type { LucideIcon } from "lucide-react";

// Relationship types used for conditional rendering
export type RelationshipType = "borrower" | "investor" | "lender" | "broker";

export interface TabConfig {
  id: string;
  label: string;
  icon: LucideIcon;
  showWhen: "always" | RelationshipType[];
}

export interface ContactData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  company_id: string | null;
  source: string | null;
  assigned_to: string | null;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  marketing_consent: boolean | null;
  created_at: string;
  updated_at: string;
  lifecycle_stage: string | null;
  dnc: boolean | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  user_id: string | null;
  borrower_id: string | null;
  linked_investor_id: string | null;
  notes: string | null;
  contact_types: string[] | null;
  rating: string | null;
  status: string | null;
  user_function: string | null;
  language_preference: string | null;
}

export interface RelationshipData {
  id: string;
  contact_id: string;
  relationship_type: string;
  is_active: boolean | null;
  lender_direction: string | null;
  vendor_type: string | null;
  notes: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
}

export interface ActivityData {
  id: string;
  activity_type: string;
  subject: string | null;
  description: string | null;
  outcome: string | null;
  direction: string | null;
  call_duration_seconds: number | null;
  created_by_name: string | null;
  created_at: string;
}

export interface EmailData {
  id: string;
  created_at: string;
  from_email: string;
  to_email: string;
  to_name: string | null;
  subject: string;
  body_text: string | null;
  body_html: string | null;
  cc_emails: string[] | null;
  bcc_emails: string[] | null;
  sent_by_name: string | null;
  postmark_status: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  attachments: unknown;
}

export interface LoanData {
  id: string;
  loan_number: string | null;
  property_address: string | null;
  type: string | null;
  loan_amount: number | null;
  interest_rate: number | null;
  ltv: number | null;
  loan_term_months: number | null;
  stage: string | null;
  stage_updated_at: string | null;
  created_at: string;
}

export interface InvestorCommitmentData {
  id: string;
  fund_name: string | null;
  commitment_amount: number | null;
  funded_amount: number | null;
  unfunded_amount: number | null;
  status: string | null;
  commitment_date: string | null;
  entity_name: string | null;
}

export interface TeamMember {
  id: string;
  full_name: string;
}

export interface CompanyData {
  id: string;
  name: string;
  company_type: string | null;
}

export interface BorrowerData {
  id: string;
  credit_score: number | null;
  credit_report_date: string | null;
  experience_count: number | null;
  date_of_birth: string | null;
  is_us_citizen: boolean | null;
  marital_status: string | null;
  ssn_last_four: string | null;
  stated_liquidity: number | null;
  verified_liquidity: number | null;
  stated_net_worth: number | null;
  verified_net_worth: number | null;
}

export interface InvestorProfileData {
  id: string;
  accreditation_status: string | null;
  accreditation_verified_at: string | null;
}

export interface EntityData {
  id: string;
  entity_name: string;
  entity_type: string;
  ein: string | null;
  state_of_formation: string | null;
  formation_date: string | null;
  kind: "borrower" | "investing";
  operating_agreement_url: string | null;
  articles_of_org_url: string | null;
  certificate_good_standing_url: string | null;
  ein_letter_url: string | null;
  formation_doc_url: string | null;
}

export interface TaskData {
  id: string;
  subject: string;
  description: string | null;
  task_type: string;
  priority: string;
  status: string;
  due_date: string | null;
  assigned_to_name: string | null;
  completed_at: string | null;
}

// Relationship badge colors following Design System v2
export const RELATIONSHIP_BADGE_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  borrower: { bg: "#ECFDF3", text: "#16A34A", dot: "#22A861" },
  investor: { bg: "#F5F3FF", text: "#7C3AED", dot: "#8B5CF6" },
  lender: { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  broker: { bg: "#FFF7ED", text: "#C2410C", dot: "#E5930E" },
};

// Status config for stage pills
export const STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  lead: { bg: "#F7F7F8", text: "#6B6B6B", dot: "#9A9A9A" },
  application: { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  processing: { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  underwriting: { bg: "#FFF7ED", text: "#C2410C", dot: "#E5930E" },
  approved: { bg: "#ECFDF3", text: "#16A34A", dot: "#22A861" },
  clear_to_close: { bg: "#F5F3FF", text: "#7C3AED", dot: "#8B5CF6" },
  closing: { bg: "#F5F3FF", text: "#7C3AED", dot: "#8B5CF6" },
  funded: { bg: "#ECFDF3", text: "#16A34A", dot: "#22A861" },
  servicing: { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  payoff: { bg: "#F7F7F8", text: "#6B6B6B", dot: "#9A9A9A" },
  paid_off: { bg: "#F7F7F8", text: "#6B6B6B", dot: "#9A9A9A" },
  committed: { bg: "#EFF6FF", text: "#2563EB", dot: "#3B82F6" },
  active: { bg: "#ECFDF3", text: "#16A34A", dot: "#22A861" },
  distributing: { bg: "#ECFDF3", text: "#16A34A", dot: "#22A861" },
  exited: { bg: "#F7F7F8", text: "#6B6B6B", dot: "#9A9A9A" },
  overdue: { bg: "#FEF2F2", text: "#DC2626", dot: "#E5453D" },
  rejected: { bg: "#FEF2F2", text: "#DC2626", dot: "#E5453D" },
  default: { bg: "#FEF2F2", text: "#DC2626", dot: "#E5453D" },
  draft: { bg: "#F7F7F8", text: "#6B6B6B", dot: "#9A9A9A" },
};

// Rating config
export const RATING_CONFIG: Record<string, { color: string; label: string }> = {
  hot: { color: "#E5453D", label: "Hot" },
  warm: { color: "#E5930E", label: "Warm" },
  cold: { color: "#3B82F6", label: "Cold" },
};

// Contact status config
export const CONTACT_STATUS_CONFIG: Record<string, string> = {
  active: "#22A861",
  inactive: "#8B8B8B",
  converted: "#3B82F6",
  lost: "#E5453D",
  do_not_contact: "#E5453D",
};

// Lifecycle stage config
export const LIFECYCLE_CONFIG: Record<string, { color: string; label: string }> = {
  uncontacted: { color: "#8B8B8B", label: "Uncontacted" },
  prospect: { color: "#3B82F6", label: "Prospect" },
  active: { color: "#22A861", label: "Active" },
  past: { color: "#8B8B8B", label: "Past" },
};

// Priority config for tasks
export const PRIORITY_CONFIG: Record<string, string> = {
  low: "#8B8B8B",
  normal: "#3B82F6",
  high: "#E5930E",
  urgent: "#E5453D",
};

// Task status config
export const TASK_STATUS_CONFIG: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  not_started: { bg: "#F7F7F8", text: "#6B6B6B", label: "Not Started" },
  in_progress: { bg: "#EFF6FF", text: "#3B82F6", label: "In Progress" },
  waiting: { bg: "#FFF7ED", text: "#E5930E", label: "Waiting" },
  completed: { bg: "#F0FDF4", text: "#22A861", label: "Completed" },
  deferred: { bg: "#F7F7F8", text: "#8B8B8B", label: "Deferred" },
};

// Activity type colors for timeline
export const ACTIVITY_TYPE_CONFIG: Record<
  string,
  { bg: string; color: string }
> = {
  email: { bg: "#EFF6FF", color: "#3B82F6" },
  call: { bg: "#F0FDF4", color: "#22A861" },
  note: { bg: "#FFF7ED", color: "#E5930E" },
  task: { bg: "#F0FDF4", color: "#22A861" },
  meeting: { bg: "#EFF6FF", color: "#3B82F6" },
  event: { bg: "#EFF6FF", color: "#3B82F6" },
  system: { bg: "#F7F7F8", color: "#8B8B8B" },
  follow_up: { bg: "#FEF2F2", color: "#DC2626" },
  text_message: { bg: "#EFF6FF", color: "#3B82F6" },
  deal_update: { bg: "#ECFDF3", color: "#16A34A" },
};
