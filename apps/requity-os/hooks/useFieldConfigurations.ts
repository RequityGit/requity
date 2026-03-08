"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type FieldConfig = Database["public"]["Tables"]["field_configurations"]["Row"];

export interface FieldConfigEntry {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  column_position: "left" | "right";
  display_order: number;
  is_visible: boolean;
  is_locked: boolean;
  is_admin_created: boolean;
  dropdown_options: string[] | null;
  is_archived: boolean;
  formula_expression: string | null;
  formula_source_fields: string[] | null;
}

// Hardcoded fallback field order matching the original OverviewTab layout
const FALLBACK_FIELDS: Record<string, FieldConfigEntry[]> = {
  loan_details: [
    { id: "f-ld-0", module: "loan_details", field_key: "loan_number", field_label: "Loan Number", field_type: "text", column_position: "left", display_order: 0, is_visible: true, is_locked: true, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-1", module: "loan_details", field_key: "type", field_label: "Type", field_type: "dropdown", column_position: "right", display_order: 1, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-2", module: "loan_details", field_key: "purpose", field_label: "Purpose", field_type: "dropdown", column_position: "left", display_order: 2, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-3", module: "loan_details", field_key: "funding_channel", field_label: "Channel", field_type: "dropdown", column_position: "right", display_order: 3, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-4", module: "loan_details", field_key: "strategy", field_label: "Strategy", field_type: "dropdown", column_position: "left", display_order: 4, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-5", module: "loan_details", field_key: "financing", field_label: "Financing", field_type: "dropdown", column_position: "right", display_order: 5, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-6", module: "loan_details", field_key: "debt_tranche", field_label: "Tranche", field_type: "dropdown", column_position: "left", display_order: 6, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-7", module: "loan_details", field_key: "deal_programs", field_label: "Programs", field_type: "text", column_position: "right", display_order: 7, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-8", module: "loan_details", field_key: "loan_amount", field_label: "Loan Amount", field_type: "currency", column_position: "left", display_order: 8, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-9", module: "loan_details", field_key: "interest_rate", field_label: "Rate", field_type: "percentage", column_position: "right", display_order: 9, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-10", module: "loan_details", field_key: "ltv", field_label: "LTV", field_type: "percentage", column_position: "left", display_order: 10, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-11", module: "loan_details", field_key: "dscr_ratio", field_label: "DSCR", field_type: "number", column_position: "right", display_order: 11, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-12", module: "loan_details", field_key: "loan_term_months", field_label: "Term", field_type: "number", column_position: "left", display_order: 12, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-ld-13", module: "loan_details", field_key: "points", field_label: "Points", field_type: "percentage", column_position: "right", display_order: 13, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
  ],
  property: [
    { id: "f-p-0", module: "property", field_key: "property_address_line1", field_label: "Address", field_type: "text", column_position: "left", display_order: 0, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-1", module: "property", field_key: "property_city", field_label: "City", field_type: "text", column_position: "right", display_order: 1, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-2", module: "property", field_key: "property_state", field_label: "State", field_type: "text", column_position: "left", display_order: 2, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-3", module: "property", field_key: "property_zip", field_label: "Zip", field_type: "text", column_position: "right", display_order: 3, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-4", module: "property", field_key: "property_type", field_label: "Property Type", field_type: "dropdown", column_position: "left", display_order: 4, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-5", module: "property", field_key: "property_units", field_label: "Units", field_type: "number", column_position: "right", display_order: 5, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-6", module: "property", field_key: "_property_year_built", field_label: "Year Built", field_type: "number", column_position: "left", display_order: 6, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-7", module: "property", field_key: "_property_sqft", field_label: "Sq Ft", field_type: "number", column_position: "right", display_order: 7, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-8", module: "property", field_key: "appraised_value", field_label: "Appraised Value", field_type: "currency", column_position: "left", display_order: 8, is_visible: true, is_locked: true, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-p-9", module: "property", field_key: "purchase_price", field_label: "Purchase Price", field_type: "currency", column_position: "right", display_order: 9, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
  ],
  borrower_entity: [
    { id: "f-be-0", module: "borrower_entity", field_key: "entity_name", field_label: "Entity Name", field_type: "text", column_position: "left", display_order: 0, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-be-1", module: "borrower_entity", field_key: "entity_type", field_label: "Entity Type", field_type: "dropdown", column_position: "right", display_order: 1, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-be-2", module: "borrower_entity", field_key: "first_name", field_label: "Guarantor", field_type: "text", column_position: "left", display_order: 2, is_visible: true, is_locked: true, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-be-3", module: "borrower_entity", field_key: "credit_score", field_label: "FICO", field_type: "number", column_position: "right", display_order: 3, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-be-4", module: "borrower_entity", field_key: "verified_liquidity", field_label: "Liquidity", field_type: "currency", column_position: "left", display_order: 4, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
    { id: "f-be-5", module: "borrower_entity", field_key: "experience_count", field_label: "Experience", field_type: "number", column_position: "right", display_order: 5, is_visible: true, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false, formula_expression: null, formula_source_fields: null },
  ],
};

// Simple in-memory cache
const cache: Record<string, { data: FieldConfigEntry[]; timestamp: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export function invalidateFieldConfigCache(module?: string) {
  if (module) {
    delete cache[module];
  } else {
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
}

function mapRow(row: FieldConfig): FieldConfigEntry {
  return {
    id: row.id,
    module: row.module,
    field_key: row.field_key,
    field_label: row.field_label,
    field_type: row.field_type,
    column_position: row.column_position as "left" | "right",
    display_order: row.display_order,
    is_visible: row.is_visible,
    is_locked: row.is_locked,
    is_admin_created: row.is_admin_created ?? false,
    dropdown_options: Array.isArray(row.dropdown_options) ? (row.dropdown_options as string[]) : null,
    is_archived: row.is_archived ?? false,
    formula_expression: (row as Record<string, unknown>).formula_expression as string | null ?? null,
    formula_source_fields: Array.isArray((row as Record<string, unknown>).formula_source_fields)
      ? ((row as Record<string, unknown>).formula_source_fields as string[])
      : null,
  };
}

export function useFieldConfigurations(module: string) {
  const [allFields, setAllFields] = useState<FieldConfigEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchConfig = useCallback(async () => {
    // Check cache first
    const cached = cache[module];
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setAllFields(cached.data);
      setIsLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("field_configurations")
        .select("*")
        .eq("module", module)
        .order("display_order", { ascending: true });

      if (error || !data || data.length === 0) {
        // Fall back to hardcoded layout
        const fallback = FALLBACK_FIELDS[module] ?? [];
        setAllFields(fallback);
        setIsLoading(false);
        return;
      }

      const mapped = data.map(mapRow);
      cache[module] = { data: mapped, timestamp: Date.now() };
      setAllFields(mapped);
    } catch {
      // On any error, fall back to hardcoded layout
      const fallback = FALLBACK_FIELDS[module] ?? [];
      setAllFields(fallback);
    } finally {
      setIsLoading(false);
    }
  }, [module]);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const visibleFields = allFields.filter((f) => f.is_visible && !f.is_archived);
  const leftFields = visibleFields
    .filter((f) => f.column_position === "left")
    .sort((a, b) => a.display_order - b.display_order);
  const rightFields = visibleFields
    .filter((f) => f.column_position === "right")
    .sort((a, b) => a.display_order - b.display_order);

  return { leftFields, rightFields, allFields, isLoading, refetch: fetchConfig };
}
