import { type DealCondition } from "@/components/pipeline/pipeline-types";
import type { ConditionReviewData, ConditionCriterionResult } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";

// Re-export for convenience
export type { DealCondition, ConditionReviewData, ConditionCriterionResult };

export interface DealDocument {
  id: string;
  deal_id: string;
  document_name: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
  review_status: string | null;
  storage_path: string | null;
  visibility?: string | null;
  google_drive_file_id?: string | null;
  submission_status?: string | null;
  deleted_at?: string | null;
  _uploaded_by_name?: string | null;
  condition_id?: string | null;
  condition_approval_status?: string | null;
  archived_at?: string | null;
  contact_id?: string | null;
  company_id?: string | null;
  document_type?: string | null;
  document_date?: string | null;
  contact?: { id: string; first_name: string | null; last_name: string | null } | null;
  company?: { id: string; name: string } | null;
}

export interface DocumentsTabProps {
  documents: DealDocument[];
  conditions: DealCondition[];
  dealId: string;
  dealName?: string;
  dealStage?: string;
  googleDriveFolderUrl?: string | null;
  currentUserId?: string;
  currentUserName?: string;
  /** Deal data for document generation (amount, uw_data, property_data) */
  dealDocData?: {
    id: string;
    name: string;
    amount?: number;
    asset_class?: string;
    capital_side?: string;
    stage?: string;
    property_data?: Record<string, unknown>;
    uw_data?: Record<string, unknown>;
  };
}
