export interface UserEmailTemplateVariable {
  key: string;
  label: string;
  source: "contact" | "loan" | "computed" | "static" | "user";
  sample: string;
}

export interface UserEmailTemplate {
  id: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  subject_template: string;
  body_template: string;
  available_variables: UserEmailTemplateVariable[];
  is_active: boolean;
  is_default: boolean;
  context: "deal" | "contact" | "any";
  sort_order: number;
  version: number;
}

export interface UserEmailTemplateVersion {
  id: string;
  created_at: string;
  template_id: string;
  version: number;
  subject_template: string;
  body_template: string;
  available_variables: UserEmailTemplateVariable[];
  changed_by: string | null;
  change_notes: string | null;
}

export interface UserEmailSend {
  id: string;
  created_at: string;
  template_id: string | null;
  sent_by: string | null;
  crm_email_id: string | null;
  linked_loan_id: string | null;
  linked_contact_id: string | null;
  merge_data_snapshot: Record<string, string> | null;
  template_version: number | null;
}

export interface CreateUserEmailTemplateInput {
  name: string;
  slug: string;
  description?: string;
  category: string;
  subject_template: string;
  body_template: string;
  available_variables: UserEmailTemplateVariable[];
  context?: "deal" | "contact" | "any";
  is_default?: boolean;
  sort_order?: number;
}

export interface UpdateUserEmailTemplateInput {
  name?: string;
  slug?: string;
  description?: string;
  category?: string;
  subject_template?: string;
  body_template?: string;
  available_variables?: UserEmailTemplateVariable[];
  is_active?: boolean;
  is_default?: boolean;
  context?: "deal" | "contact" | "any";
  sort_order?: number;
}

export interface ResolveTemplateRequest {
  template_slug: string;
  loan_id?: string;
  contact_id?: string;
  override_variables?: Record<string, string>;
}

export interface ResolveTemplateResponse {
  subject: string;
  body_html: string;
  merge_data: Record<string, string>;
  outstanding_conditions: OutstandingCondition[];
}

export interface OutstandingCondition {
  id: string;
  condition_name: string;
  category: string;
  status: string;
  borrower_description: string | null;
  due_date: string | null;
  is_required: boolean;
  critical_path_item: boolean;
  sort_order: number | null;
}

export const USER_TEMPLATE_CATEGORIES = [
  "lending",
  "investor",
  "servicing",
  "closing",
  "general",
] as const;

export type UserTemplateCategory = (typeof USER_TEMPLATE_CATEGORIES)[number];

export const USER_TEMPLATE_CONTEXTS = ["deal", "contact", "any"] as const;

export type UserTemplateContext = (typeof USER_TEMPLATE_CONTEXTS)[number];

export const ALL_MERGE_VARIABLES: UserEmailTemplateVariable[] = [
  // Contact source
  { key: "borrower_first_name", label: "Borrower First Name", source: "contact", sample: "John" },
  { key: "borrower_last_name", label: "Borrower Last Name", source: "contact", sample: "Smith" },
  { key: "borrower_full_name", label: "Borrower Full Name", source: "contact", sample: "John Smith" },
  { key: "borrower_email", label: "Borrower Email", source: "contact", sample: "john@example.com" },
  { key: "borrower_phone", label: "Borrower Phone", source: "contact", sample: "(555) 123-4567" },
  { key: "borrower_company", label: "Borrower Company", source: "contact", sample: "Smith Properties LLC" },
  // Loan source
  { key: "loan_number", label: "Loan Number", source: "loan", sample: "RL-2025-042" },
  { key: "property_address", label: "Full Property Address", source: "loan", sample: "123 Main St, Tampa, FL 33602" },
  { key: "property_address_short", label: "Short Property Address", source: "loan", sample: "123 Main St" },
  { key: "property_city", label: "Property City", source: "loan", sample: "Tampa" },
  { key: "property_state", label: "Property State", source: "loan", sample: "FL" },
  { key: "loan_amount", label: "Loan Amount", source: "loan", sample: "$750,000" },
  { key: "total_loan_amount", label: "Total Loan Amount", source: "loan", sample: "$825,000" },
  { key: "interest_rate", label: "Interest Rate", source: "loan", sample: "11.50%" },
  { key: "loan_term_months", label: "Loan Term (Months)", source: "loan", sample: "12" },
  { key: "loan_type", label: "Loan Type", source: "loan", sample: "Bridge" },
  { key: "loan_purpose", label: "Loan Purpose", source: "loan", sample: "Purchase" },
  { key: "loan_status", label: "Loan Status", source: "loan", sample: "Underwriting" },
  { key: "ltv", label: "LTV", source: "loan", sample: "65%" },
  { key: "purchase_price", label: "Purchase Price", source: "loan", sample: "$1,150,000" },
  { key: "as_is_value", label: "As-Is Value", source: "loan", sample: "$1,000,000" },
  { key: "after_repair_value", label: "After Repair Value", source: "loan", sample: "$1,400,000" },
  // Computed source
  { key: "outstanding_conditions_html", label: "Outstanding Conditions Table", source: "computed", sample: "<table>...</table>" },
  { key: "outstanding_conditions_count", label: "Outstanding Conditions Count", source: "computed", sample: "5" },
  { key: "outstanding_conditions_list", label: "Outstanding Conditions List (plain text)", source: "computed", sample: "- Bank Statements\n- Proof of Insurance" },
  // Static source
  { key: "portal_login_url", label: "Portal Login URL", source: "static", sample: "https://portal.requitygroup.com" },
  { key: "company_name", label: "Company Name", source: "static", sample: "Requity Lending" },
  { key: "company_phone", label: "Company Phone", source: "static", sample: "(813) 535-9925" },
  { key: "company_website", label: "Company Website", source: "static", sample: "https://www.requitylending.com" },
  { key: "today_date", label: "Today's Date", source: "static", sample: "March 2, 2026" },
  // User source
  { key: "sender_name", label: "Sender Name", source: "user", sample: "Luis Rodriguez" },
  { key: "sender_first_name", label: "Sender First Name", source: "user", sample: "Luis" },
  { key: "sender_email", label: "Sender Email", source: "user", sample: "luis@requitygroup.com" },
  { key: "sender_title", label: "Sender Title", source: "user", sample: "Originations Manager" },
  { key: "sender_phone", label: "Sender Phone", source: "user", sample: "(555) 987-6543" },
];
