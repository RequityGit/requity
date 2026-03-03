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
  city: string | null;
  state: string | null;
  zip: string | null;
  user_id: string | null;
  borrower_id: string | null;
  linked_investor_id: string | null;
  notes: string | null;
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
