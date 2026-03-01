export interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  category: string;
  html_body: string;
  variables: TemplateVariable[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  key: string;
  label: string;
  example?: string;
}

export interface EmailTemplateVersion {
  id: string;
  template_id: string;
  version_number: number;
  subject: string;
  html_body: string;
  changed_by: string | null;
  created_at: string;
}

export interface CreateTemplateInput {
  name: string;
  slug: string;
  subject: string;
  category: string;
  html_body: string;
  variables: TemplateVariable[];
}

export interface UpdateTemplateInput {
  name?: string;
  slug?: string;
  subject?: string;
  category?: string;
  html_body?: string;
  variables?: TemplateVariable[];
  is_active?: boolean;
}

export const TEMPLATE_CATEGORIES = [
  "general",
  "loan",
  "investor",
  "borrower",
  "notification",
  "onboarding",
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
];
