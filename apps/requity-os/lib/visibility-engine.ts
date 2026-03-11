// ═══════════════════════════════════════════════════════════
// Two-Axis Conditional Visibility Engine
// Used by Object Manager, pipeline views, intake forms
// ═══════════════════════════════════════════════════════════

export const ASSET_CLASSES = ["Residential", "Commercial"] as const;
export type AssetClassValue = (typeof ASSET_CLASSES)[number];

export const LOAN_TYPES = ["Bridge", "DSCR", "Perm", "Construction", "Equity"] as const;
export type LoanTypeValue = (typeof LOAN_TYPES)[number];

/**
 * Visibility condition stored on field_configurations.visibility_condition
 * - null/undefined = always visible
 * - AND across axes, OR within each axis
 */
export interface VisibilityCondition {
  asset_class?: AssetClassValue[];
  loan_type?: LoanTypeValue[];
}

export interface VisibilityContext {
  asset_class: string;
  loan_type: string;
}

/**
 * Evaluate whether a field/section/tab is visible given the current context.
 * - null condition = always visible
 * - AND across axes, OR within each axis
 */
export function isVisible(
  condition: VisibilityCondition | null | undefined,
  context: VisibilityContext
): boolean {
  if (!condition) return true;
  const acMatch =
    !condition.asset_class ||
    condition.asset_class.length === 0 ||
    condition.asset_class.includes(context.asset_class as AssetClassValue);
  const ltMatch =
    !condition.loan_type ||
    condition.loan_type.length === 0 ||
    condition.loan_type.includes(context.loan_type as LoanTypeValue);
  return acMatch && ltMatch;
}

/**
 * All possible axis combinations for the condition matrix.
 */
export const AXIS_COMBINATIONS: { asset_class: AssetClassValue; loan_type: LoanTypeValue; label: string }[] = [
  { asset_class: "Residential", loan_type: "Bridge", label: "Res\nBridge" },
  { asset_class: "Residential", loan_type: "DSCR", label: "Res\nDSCR" },
  { asset_class: "Residential", loan_type: "Perm", label: "Res\nPerm" },
  { asset_class: "Commercial", loan_type: "Bridge", label: "Com\nBridge" },
  { asset_class: "Commercial", loan_type: "DSCR", label: "Com\nDSCR" },
  { asset_class: "Commercial", loan_type: "Perm", label: "Com\nPerm" },
  { asset_class: "Commercial", loan_type: "Equity", label: "Com\nEquity" },
  { asset_class: "Commercial", loan_type: "Construction", label: "Com\nConstr" },
];

/**
 * Check if a visibility condition has any values set.
 */
export function hasCondition(condition: VisibilityCondition | null | undefined): boolean {
  if (!condition) return false;
  return (
    (Array.isArray(condition.asset_class) && condition.asset_class.length > 0) ||
    (Array.isArray(condition.loan_type) && condition.loan_type.length > 0)
  );
}

/**
 * Map a DB asset_class enum value to the visibility axis value.
 * sfr, duplex_fourplex, multifamily, mhc → "Residential"
 * commercial, mixed_use, land, rv_park, campground → "Commercial"
 */
const RESIDENTIAL_CLASSES = new Set(["sfr", "duplex_fourplex", "multifamily", "mhc"]);

export function mapAssetClassToVisibility(dbValue: string | null | undefined): AssetClassValue {
  return RESIDENTIAL_CLASSES.has(dbValue ?? "") ? "Residential" : "Commercial";
}

/**
 * Create a summary label for a visibility condition.
 */
export function conditionSummary(condition: VisibilityCondition | null | undefined): string {
  if (!condition || !hasCondition(condition)) return "Always visible";
  const parts: string[] = [];
  if (condition.asset_class?.length) parts.push(condition.asset_class.join(" | "));
  if (condition.loan_type?.length) parts.push(condition.loan_type.join(" | "));
  return parts.join(" + ");
}
