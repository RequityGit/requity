// ═══════════════════════════════════════════════════════════
// Excel-like Helper Functions for Formula Engine
// IF, IFERROR, AND, OR, NOT, ROUND variants, coalesce, etc.
// ═══════════════════════════════════════════════════════════

import type { MathJsInstance } from "mathjs";

/**
 * IF(condition, value_if_true, value_if_false)
 * Excel-style conditional.
 */
function ifFunc(condition: boolean | number, trueVal: number, falseVal: number): number {
  return condition ? trueVal : falseVal;
}

/**
 * IFERROR(value, fallback)
 * Returns fallback if value is NaN/Infinity, otherwise returns value.
 * Note: actual formula errors are caught at the engine level; this handles NaN/Infinity.
 */
function iferror(value: number, fallback: number): number {
  return typeof value === "number" && isFinite(value) ? value : fallback;
}

/**
 * AND(a, b, ...) - all must be truthy
 */
function andFunc(...args: (boolean | number)[]): boolean {
  return args.every(Boolean);
}

/**
 * OR(a, b, ...) - any must be truthy
 */
function orFunc(...args: (boolean | number)[]): boolean {
  return args.some(Boolean);
}

/**
 * NOT(value) - logical negation
 */
function notFunc(value: boolean | number): boolean {
  return !value;
}

/**
 * ROUNDUP(value, decimals) - round away from zero
 */
function roundUp(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return value >= 0
    ? Math.ceil(value * factor) / factor
    : Math.floor(value * factor) / factor;
}

/**
 * ROUNDDOWN(value, decimals) - round toward zero
 */
function roundDown(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return value >= 0
    ? Math.floor(value * factor) / factor
    : Math.ceil(value * factor) / factor;
}

/**
 * COALESCE(a, b, c, ...) - returns first non-null/non-NaN value
 */
function coalesce(...args: (number | undefined | null)[]): number {
  for (const v of args) {
    if (typeof v === "number" && isFinite(v)) return v;
  }
  return NaN;
}

/**
 * CLAMP(value, min, max) - constrain value to range
 */
function clamp(value: number, minVal: number, maxVal: number): number {
  return Math.min(Math.max(value, minVal), maxVal);
}

/**
 * ANNUAL(monthly) - multiply by 12
 */
function annual(monthly: number): number {
  return monthly * 12;
}

/**
 * MONTHLY(annual) - divide by 12
 */
function monthly(annualVal: number): number {
  return annualVal / 12;
}

export function registerExcelFunctions(math: MathJsInstance): void {
  math.import(
    {
      IF: ifFunc,
      IFERROR: iferror,
      AND: andFunc,
      OR: orFunc,
      NOT: notFunc,
      ROUNDUP: roundUp,
      ROUNDDOWN: roundDown,
      COALESCE: coalesce,
      CLAMP: clamp,
      ANNUAL: annual,
      MONTHLY: monthly,
      // Lowercase aliases
      iferror,
      coalesce,
      clamp,
      annual,
      monthly,
    },
    { override: false }
  );
}
