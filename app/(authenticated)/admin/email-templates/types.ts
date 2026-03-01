export interface TemplateVariable {
  key: string;
  label?: string;
  description?: string;
  example?: string;
}

export interface EmailTemplate {
  id: string;
  display_name: string;
  slug: string;
  subject_template: string;
  html_body_template: string;
  text_body_template: string | null;
  available_variables: TemplateVariable[];
  preview_data: Record<string, string> | null;
  is_active: boolean;
  version: number;
  notification_type_id: string | null;
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
  /** Derived from notification_types join — not a real column */
  category?: string;
}

export interface EmailTemplateVersion {
  id: string;
  template_id: string;
  version: number;
  subject_template: string;
  html_body_template: string;
  text_body_template: string | null;
  edited_by: string | null;
  change_notes: string | null;
  created_at: string;
}

export interface CreateTemplateInput {
  display_name: string;
  slug: string;
  subject_template: string;
  html_body_template: string;
  available_variables: TemplateVariable[];
}

export interface UpdateTemplateInput {
  display_name?: string;
  slug?: string;
  subject_template?: string;
  html_body_template?: string;
  text_body_template?: string | null;
  available_variables?: TemplateVariable[];
  is_active?: boolean;
}

export const TEMPLATE_CATEGORIES = [
  "lending",
  "investments",
  "operations",
  "crm",
  "system",
] as const;

export const MERGE_VARIABLES: TemplateVariable[] = [
  { key: "borrower_name", label: "Borrower Name", example: "John Smith" },
  { key: "borrower_email", label: "Borrower Email", example: "john@example.com" },
  { key: "loan_number", label: "Loan Number", example: "LN-2026-001" },
  { key: "loan_amount", label: "Loan Amount", example: "$500,000" },
  { key: "loan_type", label: "Loan Type", example: "DSCR" },
  { key: "property_address", label: "Property Address", example: "123 Main St" },
  { key: "interest_rate", label: "Interest Rate", example: "7.5%" },
  { key: "loan_term", label: "Loan Term", example: "12 months" },
  { key: "investor_name", label: "Investor Name", example: "Jane Doe" },
  { key: "investor_email", label: "Investor Email", example: "jane@example.com" },
  { key: "fund_name", label: "Fund Name", example: "Fund I" },
  { key: "commitment_amount", label: "Commitment Amount", example: "$100,000" },
  { key: "distribution_amount", label: "Distribution Amount", example: "$5,000" },
  { key: "company_name", label: "Company Name", example: "Requity Group" },
  { key: "current_date", label: "Current Date", example: "March 1, 2026" },
  { key: "portal_url", label: "Portal URL", example: "https://portal.requitygroup.com" },
  { key: "recipient_name", label: "Recipient Name", example: "Dylan Marma" },
  { key: "action_url", label: "Action URL", example: "https://portal.requitygroup.com" },
  { key: "preferences_url", label: "Preferences URL", example: "https://portal.requitygroup.com/settings/notifications" },
];
