"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface FieldConfiguration {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_visible: boolean;
  is_archived: boolean;
  is_required: boolean;
  dropdown_options: string[] | null;
  display_order: number;
  help_text: string | null;
  visibility_condition: unknown | null;
  formula_expression: string | null;
  formula_output_format: string | null;
  formula_decimal_places: number | null;
}

// Per-module cache (module -> { data, timestamp })
const moduleCache = new Map<
  string,
  { data: FieldConfiguration[]; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const SELECT_COLS = [
  "id",
  "module",
  "field_key",
  "field_label",
  "field_type",
  "is_visible",
  "is_archived",
  "is_required",
  "dropdown_options",
  "display_order",
  "help_text",
  "visibility_condition",
  "formula_expression",
  "formula_output_format",
  "formula_decimal_places",
].join(", ");

/**
 * Fetches field configurations for a given module from the field_configurations table.
 * Returns only visible, non-archived fields, ordered by display_order.
 * Results are cached per module for 5 minutes.
 *
 * Used by CRM, loan detail, servicing, and other non-pipeline pages.
 * Pipeline pages use useResolvedCardType() instead.
 */
export function useFieldConfigurations(module: string): {
  fields: FieldConfiguration[];
  isLoading: boolean;
  error: string | null;
} {
  const [fields, setFields] = useState<FieldConfiguration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      const cached = moduleCache.get(module);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (!cancelled) {
          setFields(cached.data);
          setIsLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from("field_configurations" as never)
          .select(SELECT_COLS as never)
          .eq("module" as never, module as never)
          .eq("is_archived" as never, false as never)
          .eq("is_visible" as never, true as never)
          .order("display_order" as never, { ascending: true });

        if (!cancelled) {
          if (err) {
            setError(err.message);
          } else {
            const records = (data ?? []) as unknown as FieldConfiguration[];
            moduleCache.set(module, { data: records, timestamp: Date.now() });
            setFields(records);
          }
          setIsLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : "Failed to load field configurations"
          );
          setIsLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [module]);

  return { fields, isLoading, error };
}

/**
 * Invalidate the field config cache for a specific module or all modules.
 * Call this after making changes to field_configurations via the Object Manager.
 */
export function invalidateFieldConfigCache(module?: string) {
  if (module) {
    moduleCache.delete(module);
  } else {
    moduleCache.clear();
  }
}
