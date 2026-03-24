"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { LayoutSection, LayoutField, DealLayoutTab, DealLayoutResult } from "./useDealLayout";

/**
 * Generic page layout hook – parameterized version of useDealLayout.
 *
 * Fetches page_layout_sections + page_layout_fields for any page_type.
 * Returns tabs, sections, fields grouped for rendering.
 *
 * Rendering model:
 * - section_type = "fields" -> render from layout data (inline editor controls)
 * - section_type = "system" -> render with hardcoded components (page controls)
 */
export function usePageLayout(pageType: string): DealLayoutResult {
  const [sections, setSections] = useState<LayoutSection[]>([]);
  const [fields, setFields] = useState<LayoutField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const refetch = useCallback(() => {
    setFetchKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const supabase = createClient();

      const { data: sectionData, error: secErr } = await supabase
        .from("page_layout_sections")
        .select("*")
        .eq("page_type", pageType)
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
  }, [pageType, fetchKey]);

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
          order: section.tab_order ?? 0,
          locked: section.tab_locked ?? false,
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
    refetch,
  };
}
