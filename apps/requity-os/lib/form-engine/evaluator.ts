// Evaluates show_when conditions against current form state

import type { ShowWhenCondition, FormStep } from "./types";

export function evaluateCondition(
  condition: ShowWhenCondition,
  data: Record<string, unknown>
): boolean {
  const fieldValue = data[condition.field];

  switch (condition.op) {
    case "eq":
      return fieldValue === condition.value;

    case "neq":
      return fieldValue !== condition.value;

    case "in": {
      if (!Array.isArray(condition.value)) return false;
      return condition.value.includes(fieldValue as string);
    }

    case "not_in": {
      if (!Array.isArray(condition.value)) return false;
      return !condition.value.includes(fieldValue as string);
    }

    case "exists":
      return fieldValue !== null && fieldValue !== undefined && fieldValue !== "";

    case "empty":
      return fieldValue === null || fieldValue === undefined || fieldValue === "";

    default:
      return false;
  }
}

export function evaluateShowWhen(
  conditions: ShowWhenCondition[] | null,
  data: Record<string, unknown>
): boolean {
  if (!conditions || conditions.length === 0) return true;
  // All conditions must be true (AND logic)
  return conditions.every((condition) => evaluateCondition(condition, data));
}

export function getVisibleSteps(
  steps: FormStep[],
  data: Record<string, unknown>
): FormStep[] {
  return steps.filter((step) => evaluateShowWhen(step.show_when, data));
}
