// ═══════════════════════════════════════════════════════════
// Formula Engine — mathjs-based expression evaluator
// Evaluates Excel-like formulas with deal data as variables
// ═══════════════════════════════════════════════════════════

import { create, all, type EvalFunction, type MathJsInstance } from "mathjs";
import { registerFinancialFunctions } from "./financial-functions";
import { registerExcelFunctions } from "./excel-functions";

// Singleton mathjs instance with custom functions
let _math: MathJsInstance | null = null;

function getMath(): MathJsInstance {
  if (_math) return _math;
  _math = create(all, {
    number: "number",
    precision: 14,
  });
  registerFinancialFunctions(_math);
  registerExcelFunctions(_math);
  return _math;
}

// Compiled expression cache (formulas rarely change, deals change often)
const compiledCache = new Map<string, EvalFunction>();

/**
 * Evaluate a formula string with the given variable scope.
 *
 * Variables come from the deal's uw_data object. Null/undefined values
 * are excluded from scope so mathjs will return undefined (caught as null).
 *
 * @returns The numeric result, or null if the formula is invalid, has missing
 *          variables, or produces a non-finite result.
 */
export function evaluateFormula(
  formula: string,
  scope: Record<string, unknown>
): number | null {
  if (!formula || !formula.trim()) return null;

  try {
    const math = getMath();

    // Build safe scope: only pass defined numeric/string/boolean values
    const safeScope: Record<string, number | string | boolean> = {};
    for (const [k, v] of Object.entries(scope)) {
      if (v == null) continue;
      if (typeof v === "number" || typeof v === "string" || typeof v === "boolean") {
        safeScope[k] = v;
      }
    }

    // Compile and cache
    let compiled = compiledCache.get(formula);
    if (!compiled) {
      compiled = math.compile(formula);
      compiledCache.set(formula, compiled);
    }

    const result = compiled.evaluate(safeScope);

    // Only return finite numbers
    if (typeof result === "number" && isFinite(result)) {
      return result;
    }

    // Handle mathjs BigNumber or Fraction results
    if (result && typeof result.toNumber === "function") {
      const num = result.toNumber();
      return typeof num === "number" && isFinite(num) ? num : null;
    }

    return null;
  } catch {
    // Parse errors, undefined variables, division by zero, etc.
    return null;
  }
}

/**
 * Validate a formula string without evaluating it.
 * Useful for the admin UI formula editor.
 */
export function validateFormula(formula: string): { valid: boolean; error?: string } {
  if (!formula || !formula.trim()) {
    return { valid: false, error: "Formula is empty" };
  }

  try {
    const math = getMath();
    math.parse(formula);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * Get the list of variable names referenced in a formula.
 * Useful for showing which uw_fields a formula depends on.
 */
export function getFormulaVariables(formula: string): string[] {
  if (!formula || !formula.trim()) return [];

  try {
    const math = getMath();
    const node = math.parse(formula);
    const symbols = new Set<string>();

    node.traverse((n) => {
      if (n.type === "SymbolNode" && "name" in n) {
        const name = (n as { name: string }).name;
        // Exclude built-in constants and registered functions
        const builtins = new Set([
          "e", "pi", "i", "Infinity", "NaN", "true", "false", "null",
          "LN2", "LN10", "LOG2E", "LOG10E", "PI", "SQRT1_2", "SQRT2",
        ]);
        if (!builtins.has(name)) {
          symbols.add(name);
        }
      }
    });

    return Array.from(symbols);
  } catch {
    return [];
  }
}

/**
 * List all available custom functions registered in the engine.
 * Useful for displaying in the formula editor's function reference.
 */
export function getAvailableFunctions(): { name: string; signature: string; description: string }[] {
  return [
    // Financial
    { name: "PMT", signature: "PMT(rate, nper, pv, [fv], [type])", description: "Payment for a loan (constant rate)" },
    { name: "IPMT", signature: "IPMT(rate, per, nper, pv, [fv], [type])", description: "Interest portion of a payment" },
    { name: "PPMT", signature: "PPMT(rate, per, nper, pv, [fv], [type])", description: "Principal portion of a payment" },
    { name: "FV", signature: "FV(rate, nper, pmt, pv, [type])", description: "Future value of an investment" },
    { name: "PV", signature: "PV(rate, nper, pmt, [fv], [type])", description: "Present value of an investment" },
    { name: "NPV", signature: "NPV(rate, cf1, cf2, ...)", description: "Net present value of cashflows" },
    { name: "IRR", signature: "IRR(cf0, cf1, cf2, ...)", description: "Internal rate of return" },
    { name: "NPER", signature: "NPER(rate, pmt, pv, [fv], [type])", description: "Number of periods" },
    { name: "RATE", signature: "RATE(nper, pmt, pv, [fv], [type])", description: "Interest rate per period" },
    // Logic
    { name: "IF", signature: "IF(condition, true_val, false_val)", description: "Conditional value" },
    { name: "IFERROR", signature: "IFERROR(value, fallback)", description: "Fallback if value is NaN/Infinity" },
    { name: "AND", signature: "AND(a, b, ...)", description: "Logical AND" },
    { name: "OR", signature: "OR(a, b, ...)", description: "Logical OR" },
    { name: "NOT", signature: "NOT(value)", description: "Logical NOT" },
    // Rounding
    { name: "ROUNDUP", signature: "ROUNDUP(value, decimals)", description: "Round away from zero" },
    { name: "ROUNDDOWN", signature: "ROUNDDOWN(value, decimals)", description: "Round toward zero" },
    // Utility
    { name: "COALESCE", signature: "COALESCE(a, b, c, ...)", description: "First non-null value" },
    { name: "CLAMP", signature: "CLAMP(value, min, max)", description: "Constrain to range" },
    { name: "ANNUAL", signature: "ANNUAL(monthly)", description: "Multiply by 12" },
    { name: "MONTHLY", signature: "MONTHLY(annual)", description: "Divide by 12" },
    // Built-in mathjs (subset)
    { name: "min", signature: "min(a, b, ...)", description: "Minimum value" },
    { name: "max", signature: "max(a, b, ...)", description: "Maximum value" },
    { name: "abs", signature: "abs(x)", description: "Absolute value" },
    { name: "round", signature: "round(x, [n])", description: "Round to n decimals" },
    { name: "ceil", signature: "ceil(x)", description: "Round up to integer" },
    { name: "floor", signature: "floor(x)", description: "Round down to integer" },
    { name: "sqrt", signature: "sqrt(x)", description: "Square root" },
    { name: "pow", signature: "pow(x, y)", description: "x to the power of y" },
    { name: "log", signature: "log(x, [base])", description: "Logarithm" },
  ];
}
