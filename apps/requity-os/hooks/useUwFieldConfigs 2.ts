"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UwFieldDef, UwFieldObject } from "@/components/pipeline/pipeline-types";
import {
  isVisible,
  type VisibilityCondition,
  type VisibilityContext,
} from "@/lib/visibility-engine";

const UW_MODULES = ["uw_deal", "property", "borrower_entity"] as const;

const MODULE_TO_OBJECT: Record<string, UwFieldObject> = {
  uw_deal: "deal",
  property: "property",
  borrower_entity: "borrower",
};

const SELECT_COLS = [
  "id",
  "module",
  "field_key",
  "field_label",
  "field_type",
  "is_visible",
  "is_archived",
  "dropdown_options",
  "display_order",
  "section_group",
  "visibility_condition",
  "formula_expression",
  "formula_output_format",
  "formula_decimal_places",
  "conditional_rules",
  "permissions",
  "required_at_stage",
  "blocks_stage_progression",
].join(", ");

interface RawFieldConfig {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_visible: boolean;
  is_archived: boolean;
  dropdown_options: string[] | null;
  display_order: number;
  section_group: string | null;
  visibility_condition: VisibilityCondition | null;
  formula_expression: string | null;
  formula_output_format: string | null;
  formula_decimal_places: number | null;
}

function mapFieldType(
  fcType: string
): UwFieldDef["type"] {
  switch (fcType) {
    case "percentage":
      return "percent";
    case "dropdown":
      return "select";
    case "currency":
    case "number":
    case "text":
    case "boolean":
    case "date":
    case "flood_risk":
      return fcType as UwFieldDef["type"];
    default:
      return "text";
  }
}

function toUwFieldDef(fc: RawFieldConfig): UwFieldDef {
  const isFormula = fc.field_type === "formula" && fc.formula_expression;

  return {
    key: fc.field_key,
    label: fc.field_label,
    type: isFormula
      ? mapFieldType(fc.formula_output_format ?? "number")
      : mapFieldType(fc.field_type),
    object: MODULE_TO_OBJECT[fc.module],
    options: fc.dropdown_options ?? undefined,
    sectionGroup: fc.section_group ?? undefined,
    ...(isFormula && {
      formulaExpression: fc.formula_expression!,
      formulaOutputFormat: (fc.formula_output_format ?? "number") as UwFieldDef["formulaOutputFormat"],
      formulaDecimalPlaces: fc.formula_decimal_places ?? 2,
    }),
  };
}

// Shared cache for all UW field configs
let uwCache: { data: RawFieldConfig[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000;

export interface UwFieldConfigsResult {
  /** All visibility-filtered fields as UwFieldDef, keyed by field_key */
  fieldMap: Map<string, UwFieldDef>;
  /** Fields grouped by object (deal, property, borrower) */
  byObject: Record<UwFieldObject, UwFieldDef[]>;
  /** Flat array of all fields sorted by display_order */
  allFields: UwFieldDef[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetches ALL field_configurations for uw_deal, uw_property, uw_borrower modules
 * and filters by the Condition Matrix (visibility_condition) against the current
 * deal's asset_class and loan_type.
 *
 * This replaces useResolvedCardType for field definitions. Card types are no
 * longer the source of truth for which fields appear on a deal; the Condition
 * Matrix in the Object Manager is.
 */
export function useUwFieldConfigs(
  visibilityContext?: VisibilityContext | null
): UwFieldConfigsResult {
  const [rawConfigs, setRawConfigs] = useState<RawFieldConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const ctxKey = visibilityContext
    ? `${visibilityContext.asset_class}:${JSON.stringify(visibilityContext.dealValues ?? {})}`
    : "";

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      if (uwCache && Date.now() - uwCache.timestamp < CACHE_TTL) {
        if (!cancelled) {
          setRawConfigs(uwCache.data);
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: err } = await supabase
          .from("field_configurations" as never)
          .select(SELECT_COLS as never)
          .in("module" as never, [...UW_MODULES] as never)
          .eq("is_archived" as never, false as never)
          .eq("is_visible" as never, true as never)
          .order("display_order" as never, { ascending: true });

        if (!cancelled) {
          if (err) {
            setError(err.message);
          } else {
            const records = (data ?? []) as unknown as RawFieldConfig[];
            uwCache = { data: records, timestamp: Date.now() };
            setRawConfigs(records);
          }
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load field configurations");
          setLoading(false);
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, [ctxKey]);

  const result = useMemo(() => {
    const filtered = visibilityContext
      ? rawConfigs.filter((fc) => isVisible(fc.visibility_condition, visibilityContext))
      : rawConfigs;

    const fieldMap = new Map<string, UwFieldDef>();
    const byObject: Record<UwFieldObject, UwFieldDef[]> = {
      deal: [],
      property: [],
      borrower: [],
    };
    const allFields: UwFieldDef[] = [];

    for (const fc of filtered) {
      const def = toUwFieldDef(fc);
      fieldMap.set(def.key, def);
      const obj = MODULE_TO_OBJECT[fc.module] ?? "deal";
      byObject[obj].push(def);
      allFields.push(def);
    }

    return { fieldMap, byObject, allFields };
  }, [rawConfigs, visibilityContext]);

  return {
    ...result,
    loading,
    error,
  };
}

export function invalidateUwFieldConfigsCache() {
  uwCache = null;
}
