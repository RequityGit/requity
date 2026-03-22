"use client";

import { usePageLayout } from "./usePageLayout";

// ── Re-export types (they are consumed throughout the codebase) ──

export interface LayoutSection {
  id: string;
  page_type: string;
  section_key: string;
  section_label: string;
  section_icon: string;
  display_order: number;
  is_visible: boolean;
  is_locked: boolean;
  sidebar: boolean;
  section_type: string; // "fields" | "system"
  tab_key: string | null;
  tab_label: string | null;
  tab_icon: string | null;
  tab_order: number;
  tab_locked: boolean;
  card_type_id: string | null;
  visibility_rule: string | null;
  default_collapsed: boolean;
}

export interface LayoutField {
  id: string;
  section_id: string;
  field_config_id: string | null;
  field_key: string;
  display_order: number;
  column_position: string;
  is_visible: boolean;
  source: string;
  source_object_key: string | null;
  column_span: string;
}

export interface DealLayoutTab {
  key: string;
  label: string;
  icon: string | null;
  order: number;
  locked: boolean;
  sections: LayoutSection[];
}

export interface DealLayoutResult {
  tabs: DealLayoutTab[];
  sections: LayoutSection[];
  fields: LayoutField[];
  fieldsBySectionId: Record<string, LayoutField[]>;
  fieldSections: LayoutSection[];
  systemSections: LayoutSection[];
  loading: boolean;
  error: string | null;
  /** Re-fetch layout data from the database */
  refetch: () => void;
}

/**
 * Convenience wrapper for deal_detail page type.
 * All logic now lives in the generic usePageLayout hook.
 */
export function useDealLayout(): DealLayoutResult {
  return usePageLayout("deal_detail");
}
