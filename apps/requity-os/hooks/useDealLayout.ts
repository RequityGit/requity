"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

// ── Types mirroring the Object Manager's PageSection / PageField ──

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
}

const PAGE_TYPE = "deal_detail";

/**
 * Fetches the deal_detail page layout from page_layout_sections + page_layout_fields.
 * Returns tabs, sections, fields grouped for rendering.
 *
 * This enables the hybrid rendering model:
 * - section_type = "fields" → render from layout data (Object Manager controls)
 * - section_type = "system" → render with hardcoded components (DealDetailPage controls)
 */
export function useDealLayout(cardTypeId?: string | null): DealLayoutResult {
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [fields, setFields] = useState<LayoutField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      // Fetch sections for deal_detail.
      // When a cardTypeId is provided, return sections that either:
      //   1. Match this specific card type (card_type_id = cardTypeId), OR
      //   2. Are shared / system sections (card_type_id IS NULL)
      // When no cardTypeId is provided, return only shared sections.
      let query = supabase
        .from("page_layout_sections")
        .select("*")
        .eq("page_type", PAGE_TYPE);

      if (cardTypeId) {
        query = query.or(`card_type_id.eq.${cardTypeId},card_type_id.is.null`);
      } else {
        query = query.is("card_type_id", null);
      }

      const { data: sectionData, error: secErr } = await query
        .order("tab_order", { ascending: true })
        .order("display_order", { ascending: true });

      if (secErr) {
        if (!cancelled) {
          setError(secErr.message);
          setLoading(false);
        }
        return;
      }

      const sectionRows = (sectionData ?? []) as LayoutSection[];
      const sectionIds = sectionRows.map((s) => s.id);

      // Fetch fields for those sections
      let fieldRows: LayoutField[] = [];
      if (sectionIds.length > 0) {
        const { data: fieldData, error: fieldErr } = await supabase
          .from("page_layout_fields")
          .select("*")
          .in("section_id", sectionIds)
          .order("display_order", { ascending: true });

        if (fieldErr) {
          if (!cancelled) {
            setError(fieldErr.message);
            setLoading(false);
          }
          return;
        }
        fieldRows = (fieldData ?? []) as LayoutField[];
      }

      if (!cancelled) {
        setSections(sectionRows);
        setFields(fieldRows);
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [cardTypeId]);

  // Group fields by section_id
  const fieldsBySectionId = useMemo(() => {
    const map: Record<string, LayoutField[]> = {};
    for (const f of fields) {
      if (!map[f.section_id]) map[f.section_id] = [];
      map[f.section_id].push(f);
    }
    return map;
  }, [fields]);

  // Split sections by type
  const fieldSections = useMemo(
    () => sections.filter((s) => s.section_type === "fields" && s.is_visible),
    [sections]
  );

  const systemSections = useMemo(
    () => sections.filter((s) => s.section_type === "system" && s.is_visible),
    [sections]
  );

  // Group into tabs
  const tabs = useMemo(() => {
    const tabMap = new Map<string, DealLayoutTab>();
    for (const section of sections) {
      const key = section.tab_key || "overview";
      if (!tabMap.has(key)) {
        tabMap.set(key, {
          key,
          label: section.tab_label || "Overview",
          icon: section.tab_icon,
          order: section.tab_order,
          locked: section.tab_locked,
          sections: [],
        });
      }
      tabMap.get(key)!.sections.push(section);
    }
    return Array.from(tabMap.values()).sort((a, b) => a.order - b.order);
  }, [sections]);

  return {
    tabs,
    sections,
    fields,
    fieldsBySectionId,
    fieldSections,
    systemSections,
    loading,
    error,
  };
}
