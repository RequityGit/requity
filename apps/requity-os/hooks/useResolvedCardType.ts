"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UnifiedCardType } from "@/components/pipeline-v2/pipeline-types";
import {
  resolveCardTypeFields,
  buildFieldConfigMap,
  type FieldConfigRecord,
} from "@/lib/pipeline/resolve-card-type-fields";

const UW_MODULES = ["uw_deal", "uw_property", "uw_borrower"] as const;

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
 */
export function useResolvedCardType(cardType: UnifiedCardType): UnifiedCardType {
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
        .select("id, module, field_key, field_label, field_type, is_visible, is_archived, dropdown_options")
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
        cardType.uw_fields
      ),
      property_fields: resolveCardTypeFields(
        cardType.property_field_refs,
        configMap,
        cardType.property_fields
      ),
      contact_fields: resolveCardTypeFields(
        cardType.contact_field_refs,
        configMap,
        cardType.contact_fields
      ),
    };
  }, [cardType, fieldConfigs, isLoading, hasRefs]);

  return resolved;
}

/**
 * Invalidate the UW field config cache (call after Field Manager changes).
 */
export function invalidateUwFieldConfigCache() {
  uwFieldConfigCache = null;
}
