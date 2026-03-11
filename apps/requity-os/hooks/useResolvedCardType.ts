"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UnifiedCardType } from "@/components/pipeline-v2/pipeline-types";
import {
  resolveCardTypeFields,
  buildFieldConfigMap,
  type FieldConfigRecord,
} from "@/lib/pipeline/resolve-card-type-fields";
import type { VisibilityContext } from "@/lib/visibility-engine";

const UW_MODULES = ["uw_deal", "uw_property", "uw_borrower"] as const;

const SELECT_COLS = [
  "id",
  "module",
  "field_key",
  "field_label",
  "field_type",
  "is_visible",
  "is_archived",
  "dropdown_options",
  "visibility_condition",
  "formula_expression",
  "formula_output_format",
  "formula_decimal_places",
].join(", ");

// Shared cache for UW field configs (all three modules together)
let uwFieldConfigCache: {
  data: FieldConfigRecord[];
  timestamp: number;
} | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetches UW field configurations and resolves a card type's field refs
 * into concrete UwFieldDef arrays.
 *
 * Falls back to inline uw_fields if uw_field_refs is empty (backwards compat).
 *
 * When visibilityContext is provided, fields whose visibility_condition
 * doesn't match the deal's asset_class/loan_type are excluded.
 */
export function useResolvedCardType(
  cardType: UnifiedCardType,
  visibilityContext?: VisibilityContext | null
): UnifiedCardType {
  const [fieldConfigs, setFieldConfigs] = useState<FieldConfigRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const hasRefs =
    (cardType.uw_field_refs && cardType.uw_field_refs.length > 0) ||
    (cardType.property_field_refs && cardType.property_field_refs.length > 0) ||
    (cardType.contact_field_refs && cardType.contact_field_refs.length > 0);

  const fetchConfigs = useCallback(async () => {
    // If no refs, skip fetch entirely -- we'll use inline fields
    if (!hasRefs) {
      setIsLoading(false);
      return;
    }

    // Check cache
    if (uwFieldConfigCache && Date.now() - uwFieldConfigCache.timestamp < CACHE_TTL) {
      setFieldConfigs(uwFieldConfigCache.data);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("field_configurations")
        .select(SELECT_COLS)
        .in("module", [...UW_MODULES])
        .order("field_label", { ascending: true });

      if (error || !data) {
        setIsLoading(false);
        return;
      }

      const records = data as unknown as FieldConfigRecord[];
      uwFieldConfigCache = { data: records, timestamp: Date.now() };
      setFieldConfigs(records);
    } catch {
      // On error, fall back to inline fields
    } finally {
      setIsLoading(false);
    }
  }, [hasRefs]);

  useEffect(() => {
    fetchConfigs();
  }, [fetchConfigs]);

  // Stable reference for context to avoid unnecessary re-resolution
  const ctxKey = visibilityContext
    ? `${visibilityContext.asset_class}:${visibilityContext.loan_type}`
    : "";

  // Build resolved card type
  const resolved = useMemo(() => {
    // If still loading or no refs, return original card type unchanged
    if (isLoading || !hasRefs || fieldConfigs.length === 0) {
      return cardType;
    }

    const configMap = buildFieldConfigMap(fieldConfigs);

    return {
      ...cardType,
      uw_fields: resolveCardTypeFields(
        cardType.uw_field_refs,
        configMap,
        cardType.uw_fields,
        visibilityContext
      ),
      property_fields: resolveCardTypeFields(
        cardType.property_field_refs,
        configMap,
        cardType.property_fields,
        visibilityContext
      ),
      contact_fields: resolveCardTypeFields(
        cardType.contact_field_refs,
        configMap,
        cardType.contact_fields,
        visibilityContext
      ),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardType, fieldConfigs, isLoading, hasRefs, ctxKey]);

  return resolved;
}

/**
 * Invalidate the UW field config cache (call after Field Manager changes).
 */
export function invalidateUwFieldConfigCache() {
  uwFieldConfigCache = null;
}
