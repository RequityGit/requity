export interface SOPCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  department: string | null;
  icon: string | null;
  sort_order: number;
  parent_id: string | null;
  created_at: string;
}

export interface SOP {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  department: string | null;
  category: string | null;
  tags: string[] | null;
  status: "draft" | "published" | "stale";
  visibility: "public" | "internal" | "role" | null;
  visible_to_roles: string[] | null;
  visible_to_departments: string[] | null;
  version: number;
  source_type: "manual" | "ai_generated" | "ai_revised" | null;
  ai_confidence: number | null;
  generated_from: Record<string, unknown> | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  last_reviewed_at: string | null;
  review_required_by: string | null;
  category_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface SOPVersion {
  id: string;
  sop_id: string;
  version_number: number;
  content: string;
  summary: string | null;
  changed_by: string | null;
  change_notes: string | null;
  diff_summary: string | null;
  created_at: string;
}

export interface SOPQuestionLog {
  id: string;
  user_id: string | null;
  profile_id: string | null;
  question: string;
  answer: string | null;
  matched_sop_ids: string[] | null;
  confidence_score: number | null;
  was_helpful: boolean | null;
  feedback: string | null;
  session_id: string | null;
  page_context: string | null;
  created_at: string;
}

export interface SOPStalenessFlag {
  id: string;
  sop_id: string;
  flag_type: "usage_divergence" | "time_based" | "question_gap" | "manual";
  description: string | null;
  detected_pattern: Record<string, unknown> | null;
  status: "open" | "reviewing" | "resolved" | "dismissed";
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

export interface SOPSearchResult {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  department: string | null;
  category: string | null;
  status: string;
  rank: number;
}
