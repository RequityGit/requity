export type NoteEntityType =
  | "contact"
  | "company"
  | "deal"
  | "task"
  | "project"
  | "approval"
  | "condition"
  | "unified_condition";

export interface UnifiedNotesProps {
  entityType: NoteEntityType;
  entityId: string;
  dealId?: string;
  loanId?: string;
  opportunityId?: string;
  showInternalToggle?: boolean;
  showFilters?: boolean;
  showPinning?: boolean;
  compact?: boolean;
}

export interface NoteLike {
  user_id: string;
  profiles: { full_name: string | null };
}

export interface NoteData {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  author_name: string | null;
  body: string;
  parent_note_id: string | null;
  mentions: string[];
  is_internal: boolean;
  is_pinned: boolean;
  pinned_by: string | null;
  pinned_at: string | null;
  is_edited: boolean;
  edited_at: string | null;
  deleted_at: string | null;
  note_likes: NoteLike[];
  unified_condition_id?: string | null;
  condition_name?: string | null;
  deal_id?: string | null;
}

export type NoteFilter = "all" | "internal" | "external";

export function getEntityColumn(entityType: NoteEntityType): string {
  const map: Record<NoteEntityType, string> = {
    contact: "contact_id",
    company: "company_id",
    deal: "loan_id",
    task: "task_id",
    project: "project_id",
    approval: "approval_id",
    condition: "condition_id",
    unified_condition: "unified_condition_id",
  };
  return map[entityType];
}
