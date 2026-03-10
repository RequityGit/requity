// Form Engine type definitions

export interface FormFieldOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
}

export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "multi_select"
  | "textarea"
  | "address"
  | "file"
  | "checkbox"
  | "card-select";

export type VisibilityMode = "both" | "external_only" | "internal_only";
export type VisibilityFormMode = "both" | "create_only" | "edit_only";

export interface FormFieldDefinition {
  id: string;
  type: FieldType;
  label: string | null;
  required?: boolean;
  mapped_column: string | null;
  width: "full" | "half";
  placeholder?: string | null;
  visibility_mode: VisibilityMode;
  visibility_form_mode: VisibilityFormMode;
  icon?: string;
  options?: FormFieldOption[];
}

export type ConditionOperator = "eq" | "neq" | "in" | "not_in" | "exists" | "empty";

export interface ShowWhenCondition {
  field: string;
  op: ConditionOperator;
  value?: string | string[];
}

export interface FormStep {
  id: string;
  title: string;
  subtitle?: string;
  type: "router" | "form";
  target_entity: string | null;
  match_on: string | null;
  show_when: ShowWhenCondition[] | null;
  fields: FormFieldDefinition[];
}

export interface FormSettings {
  success_message?: string;
  notify_emails?: string[];
  token_expiry_days?: number;
}

export type FormStatus = "draft" | "published" | "archived";
export type FormMode = "create_only" | "edit_only" | "both";
export type FormContext = "external" | "internal";

export interface FormDefinition {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: FormStatus;
  mode: FormMode;
  contexts: FormContext[];
  steps: FormStep[];
  settings: FormSettings;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type SubmissionStatus =
  | "partial"
  | "pending_borrower"
  | "submitted"
  | "reviewed"
  | "processed";

export type SubmissionType = "create" | "update" | "partial";

export interface FormSubmission {
  id: string;
  form_id: string;
  status: SubmissionStatus;
  type: SubmissionType;
  data: Record<string, unknown>;
  current_step_id: string | null;
  session_token: string;
  record_id: string | null;
  record_type: string | null;
  prefilled_by: string | null;
  submitted_by: string | null;
  submitted_by_email: string | null;
  entity_ids: Record<string, string>;
  changes: FieldChange[] | null;
  ip_address: string | null;
  user_agent: string | null;
  token_expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface FieldChange {
  field: string;
  old_value: string | null;
  new_value: string | null;
}

export interface FormEngineProps {
  formId?: string;
  formSlug?: string;
  context: "page" | "drawer" | "modal";
  mode?: "create" | "edit";
  recordId?: string;
  recordType?: string;
  prefillData?: Record<string, unknown>;
  sessionToken?: string;
  onComplete?: (submission: FormSubmission) => void;
  onClose?: () => void;
}

export interface FormState {
  data: Record<string, unknown>;
  currentStepIndex: number;
  submissionId: string | null;
  sessionToken: string | null;
  isSubmitting: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface ContactLookupResult {
  found: boolean;
  name?: string;
  phone?: string;
  entity_name?: string;
}
