"use client";

import { useMemo } from "react";
import type { FieldConfiguration, ConditionalRule } from "@/hooks/useFieldConfigurations";

/** The evaluated state of a field after applying conditional_rules. */
export interface ConditionalFieldState {
  visible: boolean;
  required: boolean;
  setValue?: unknown;
}

/**
 * Evaluate a single conditional rule against current form values.
 */
function evaluateRule(
  rule: ConditionalRule,
  formValues: Record<string, unknown>
): boolean {
  const sourceValue = formValues[rule.source_field];

  switch (rule.operator) {
    case "equals":
      return String(sourceValue ?? "") === String(rule.value ?? "");
    case "not_equals":
      return String(sourceValue ?? "") !== String(rule.value ?? "");
    case "contains": {
      const str = String(sourceValue ?? "");
      const search = String(rule.value ?? "");
      return str.toLowerCase().includes(search.toLowerCase());
    }
    case "is_empty":
      return sourceValue === null || sourceValue === undefined || sourceValue === "";
    case "is_not_empty":
      return sourceValue !== null && sourceValue !== undefined && sourceValue !== "";
    case "greater_than":
      return Number(sourceValue) > Number(rule.value);
    case "less_than":
      return Number(sourceValue) < Number(rule.value);
    default:
      return true;
  }
}

/**
 * Evaluate all conditional_rules for a single field.
 * Multiple rules use AND logic (all must be true for the action to apply).
 * Returns the computed state for the field.
 */
function evaluateFieldRules(
  field: FieldConfiguration,
  formValues: Record<string, unknown>
): ConditionalFieldState {
  const rules = field.conditional_rules;

  // No rules: default to visible + base required
  if (!rules || rules.length === 0) {
    return { visible: true, required: field.is_required };
  }

  let visible = true;
  let required = field.is_required;
  let setValue: unknown = undefined;

  // Group rules by action
  const showRules = rules.filter((r) => r.action === "show");
  const hideRules = rules.filter((r) => r.action === "hide");
  const requireRules = rules.filter((r) => r.action === "require");
  const setValueRules = rules.filter((r) => r.action === "set_value");

  // "show" rules: field is hidden unless ALL show-rules pass
  if (showRules.length > 0) {
    visible = showRules.every((r) => evaluateRule(r, formValues));
  }

  // "hide" rules: if ALL hide-rules pass, hide the field
  if (hideRules.length > 0) {
    const allHideRulesPass = hideRules.every((r) => evaluateRule(r, formValues));
    if (allHideRulesPass) {
      visible = false;
    }
  }

  // "require" rules: if ALL require-rules pass, field becomes required
  if (requireRules.length > 0) {
    const allRequireRulesPass = requireRules.every((r) => evaluateRule(r, formValues));
    if (allRequireRulesPass) {
      required = true;
    }
  }

  // "set_value" rules: if ALL set_value-rules pass, take the last set_value
  if (setValueRules.length > 0) {
    const allSetValueRulesPass = setValueRules.every((r) => evaluateRule(r, formValues));
    if (allSetValueRulesPass) {
      const lastRule = setValueRules[setValueRules.length - 1];
      setValue = lastRule.set_value;
    }
  }

  // If field is hidden, it should not be required
  if (!visible) {
    required = false;
  }

  return { visible, required, setValue };
}

/**
 * Evaluates conditional_rules for all provided field configurations against
 * the current form values. Returns a map of field_key to ConditionalFieldState.
 *
 * This hook is reactive: when formValues change, all conditional states are
 * re-evaluated automatically via useMemo.
 *
 * Usage:
 *   const states = useConditionalLogic(fields, formValues);
 *   const isVisible = states.get("loan_purpose")?.visible ?? true;
 */
export function useConditionalLogic(
  fields: FieldConfiguration[],
  formValues: Record<string, unknown>
): Map<string, ConditionalFieldState> {
  return useMemo(() => {
    const map = new Map<string, ConditionalFieldState>();
    for (const field of fields) {
      map.set(field.field_key, evaluateFieldRules(field, formValues));
    }
    return map;
  }, [fields, formValues]);
}

/**
 * Pure function version (non-hook) for use in server-side or non-React contexts.
 */
export function evaluateConditionalLogic(
  fields: FieldConfiguration[],
  formValues: Record<string, unknown>
): Map<string, ConditionalFieldState> {
  const map = new Map<string, ConditionalFieldState>();
  for (const field of fields) {
    map.set(field.field_key, evaluateFieldRules(field, formValues));
  }
  return map;
}
