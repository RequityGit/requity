// E-Signature type definitions

export type EsignDocumentType =
  | "term_sheet"
  | "commitment_letter"
  | "loan_agreement"
  | "promissory_note"
  | "deed_of_trust"
  | "personal_guarantee"
  | "subscription_agreement"
  | "ppm"
  | "operating_agreement"
  | "side_letter"
  | "internal_approval"
  | "committee_memo"
  | "other";

export type EsignBusinessLine =
  | "lending"
  | "investments"
  | "internal"
  | "shared";

export type EsignSubmissionStatus =
  | "draft"
  | "pending"
  | "partially_signed"
  | "completed"
  | "declined"
  | "expired"
  | "voided";

export type EsignSignerStatus =
  | "pending"
  | "sent"
  | "opened"
  | "signed"
  | "declined";

export type EsignSignerRole =
  | "signer"
  | "co-signer"
  | "guarantor"
  | "approver"
  | "witness";

export interface EsignTemplate {
  id: number;
  docuseal_template_id: number;
  name: string;
  description: string | null;
  document_type: EsignDocumentType;
  business_line: EsignBusinessLine;
  field_mapping: Record<string, string>;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EsignSubmission {
  id: number;
  docuseal_submission_id: number | null;
  deal_id: number | null;
  template_id: number | null;
  requested_by: string | null;
  status: EsignSubmissionStatus;
  document_name: string;
  expiration_date: string | null;
  completed_at: string | null;
  voided_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  signers?: EsignSigner[];
  documents?: EsignDocument[];
}

export interface EsignSigner {
  id: number;
  submission_id: number;
  docuseal_submitter_id: number | null;
  contact_id: number | null;
  user_id: string | null;
  name: string;
  email: string;
  role: EsignSignerRole;
  status: EsignSignerStatus;
  signed_at: string | null;
  ip_address: string | null;
  sign_order: number;
  created_at: string;
  updated_at: string;
}

export interface EsignDocument {
  id: number;
  submission_id: number;
  docuseal_document_url: string | null;
  storage_path: string | null;
  file_name: string;
  file_size: number | null;
  content_type: string;
  audit_trail: Record<string, unknown>;
  certificate_url: string | null;
  created_at: string;
}

export interface SendForSignatureInput {
  dealId: number | null;
  documentName: string;
  signers: {
    name: string;
    email: string;
    role: EsignSignerRole;
    contactId?: number | null;
    userId?: string | null;
    signOrder?: number;
  }[];
  templateId?: number;
  pdfBase64?: string;
  message?: string;
  expirationDays?: number;
}

export interface DocuSealWebhookPayload {
  event_type: "form.completed" | "form.started" | "form.viewed" | "form.declined";
  timestamp: string;
  data: {
    id: number;
    submission_id: number;
    email: string;
    status: string;
    role: string;
    completed_at?: string;
    declined_at?: string;
    documents?: {
      name: string;
      url: string;
    }[];
    audit_log_url?: string;
    values?: Record<string, unknown>[];
  };
}
