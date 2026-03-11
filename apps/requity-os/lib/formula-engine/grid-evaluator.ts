// ═══════════════════════════════════════════════════════════
// Grid Evaluator — evaluates a grid pro forma template
// Handles row dependencies via topological sort, per-cell overrides,
// and year-indexed formula evaluation.
// ═══════════════════════════════════════════════════════════

import { evaluateFormula, getFormulaVariables } from "./engine";
import type {
  GridTemplateDef,
  GridOverrides,
  GridResult,
  GridPeriod,
  GridRowDef,
} from "@/components/pipeline-v2/pipeline-types";
import { GRID_PERIODS, GRID_PERIOD_INDEX } from "@/components/pipeline-v2/pipeline-types";

/**
 * Topologically sort grid rows so that dependencies are evaluated first.
 * If row "dscr" references "noi" in its formula, "noi" will come first.
 * Falls back to sort_order if no dependencies exist.
 */
function topoSortRows(rows: GridRowDef[]): GridRowDef[] {
  const rowKeys = new Set(rows.map((r) => r.key));
  const deps = new Map<string, Set<string>>();

  for (const row of rows) {
    const vars = getFormulaVariables(row.formula);
    // Only include variables that are other row keys (not UW field variables)
    const rowDeps = new Set(vars.filter((v) => rowKeys.has(v) && v !== row.key));
    deps.set(row.key, rowDeps);
  }

  const sorted: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function visit(key: string) {
    if (visited.has(key)) return;
    if (visiting.has(key)) {
      // Circular dependency; break the cycle by just adding it
      sorted.push(key);
      visited.add(key);
      return;
    }
    visiting.add(key);
    const rowDeps = deps.get(key);
    for (const dep of rowDeps ? Array.from(rowDeps) : []) {
      visit(dep);
    }
    visiting.delete(key);
    visited.add(key);
    sorted.push(key);
  }

  // Visit in sort_order so deterministic for equal-priority rows
  const byOrder = [...rows].sort((a, b) => a.sort_order - b.sort_order);
  for (const row of byOrder) {
    visit(row.key);
  }

  const keyToRow = new Map(rows.map((r) => [r.key, r]));
  return sorted.map((k) => keyToRow.get(k)!).filter(Boolean);
}

/**
 * Build the override key for a cell: `{rowKey}:{period}`
 */
export function gridCellKey(rowKey: string, period: GridPeriod): string {
  return `${rowKey}:${period}`;
}

/**
 * Evaluate a full grid pro forma.
 *
 * @param template - The grid template (rows + formulas) from the card type
 * @param uwData - The deal's uw_data (field values)
 * @param overrides - Per-cell overrides from the deal
 * @returns GridResult: { [rowKey]: { [period]: number | null } }
 */
export function evaluateGrid(
  template: GridTemplateDef,
  uwData: Record<string, unknown>,
  overrides: GridOverrides = {}
): GridResult {
  if (!template?.rows?.length) return {};

  const sortedRows = topoSortRows(template.rows);
  const result: GridResult = {};

  // Initialize result structure
  for (const row of sortedRows) {
    result[row.key] = {} as Record<GridPeriod, number | null>;
  }

  // Evaluate each period column
  for (const period of GRID_PERIODS) {
    const t = GRID_PERIOD_INDEX[period];

    // Build scope for this period: starts with UW field data + period vars
    const periodScope: Record<string, unknown> = {
      ...uwData,
      t,
      period,
      year: t,
    };

    // Evaluate rows in dependency order
    for (const row of sortedRows) {
      const cellKey = gridCellKey(row.key, period);
      const override = overrides[cellKey];

      let value: number | null = null;

      if (override?.value != null) {
        // Hard value override
        value = override.value;
      } else {
        // Use override formula or base formula
        const formula = override?.formula ?? row.formula;
        if (formula) {
          value = evaluateFormula(formula, periodScope);
        }
      }

      result[row.key][period] = value;

      // Add this row's value to the period scope so downstream rows can reference it
      if (value != null) {
        periodScope[row.key] = value;
      }
    }
  }

  return result;
}

/**
 * Get the effective formula for a specific cell (considering overrides).
 */
export function getEffectiveFormula(
  template: GridTemplateDef,
  overrides: GridOverrides,
  rowKey: string,
  period: GridPeriod
): { formula: string; isOverride: boolean } | null {
  const row = template.rows.find((r) => r.key === rowKey);
  if (!row) return null;

  const cellKey = gridCellKey(rowKey, period);
  const override = overrides[cellKey];

  if (override?.value != null) {
    return { formula: String(override.value), isOverride: true };
  }
  if (override?.formula) {
    return { formula: override.formula, isOverride: true };
  }
  return { formula: row.formula, isOverride: false };
}
