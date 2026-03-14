// ═══════════════════════════════════════════════════════════
// Asset-Class-Driven Conditional Visibility Engine
// Used by Object Manager, pipeline views, intake forms
// ═══════════════════════════════════════════════════════════

export const ASSET_CLASSES = [
  { value: "residential_1_4", label: "Residential (1-4)" },
  { value: "multifamily", label: "Multifamily" },
  { value: "mhc", label: "MHC" },
  { value: "rv_campground", label: "RV / Campground" },
  { value: "commercial", label: "Commercial" },
] as const;

export type AssetClassValue = (typeof ASSET_CLASSES)[number]["value"];

export const ASSET_CLASS_VALUES = ASSET_CLASSES.map((a) => a.value) as readonly AssetClassValue[];

/**
 * Maps raw DB asset_class values (sfr, duplex_fourplex, etc.) to the canonical
 * visibility asset class. Values that don't match a specific class fall into
 * "commercial" as the general bucket.
 */
const DB_TO_ASSET_CLASS: Record<string, AssetClassValue> = {
  sfr: "residential_1_4",
  duplex_fourplex: "residential_1_4",
  multifamily: "multifamily",
  mhc: "mhc",
  rv_park: "rv_campground",
  rv_campground: "rv_campground",
  campground: "rv_campground",
  commercial: "commercial",
  mixed_use: "commercial",
  land: "commercial",
  industrial: "commercial",
  office: "commercial",
  retail: "commercial",
  hospitality: "commercial",
};

export function normalizeAssetClass(dbValue: string | null | undefined): AssetClassValue {
  return DB_TO_ASSET_CLASS[dbValue ?? ""] ?? "commercial";
}

export function assetClassLabel(value: string): string {
  return ASSET_CLASSES.find((a) => a.value === value)?.label ?? value;
}

/**
 * Visibility condition stored on field_configurations.visibility_condition
 *
 * - null/undefined = always visible
 * - asset_class: primary filter (OR within - match any)
 * - conditions: secondary filters keyed by deal field_key
 *   AND across keys, OR within each key's value list
 *
 * Example: { asset_class: ["commercial"], conditions: { loan_type: ["equity"] } }
 *  = show only for Commercial deals where loan_type is Equity
 */
export interface VisibilityCondition {
  asset_class?: AssetClassValue[];
  conditions?: Record<string, string[]>;
}

/**
 * Runtime context derived from the current deal.
 * asset_class is the normalized canonical value.
 * dealValues holds additional field values for condition matching.
 */
export interface VisibilityContext {
  asset_class: string;
  dealValues?: Record<string, string>;
}

/**
 * Evaluate whether a field/section/tab is visible given the current context.
 * - null condition = always visible
 * - AND across dimensions, OR within each dimension
 */
export function isVisible(
  condition: VisibilityCondition | null | undefined,
  context: VisibilityContext
): boolean {
  if (!condition) return true;

  // Asset class gate
  if (
    condition.asset_class &&
    condition.asset_class.length > 0 &&
    !condition.asset_class.includes(context.asset_class as AssetClassValue)
  ) {
    return false;
  }

  // Additional conditions (AND across keys, OR within values)
  if (condition.conditions) {
    for (const [fieldKey, acceptedValues] of Object.entries(condition.conditions)) {
      if (!acceptedValues || acceptedValues.length === 0) continue;
      const dealValue = context.dealValues?.[fieldKey] ?? "";
      if (!acceptedValues.includes(dealValue)) return false;
    }
  }

  return true;
}

/**
 * Whether this deal should show the Commercial Pro Forma / models tab (full commercial UW)
 * instead of the simple underwriting panel. Driven by asset class and optionally loan type.
 * Same layout for all; Pro Forma visibility by deal type.
 */
export function isCommercialDeal(deal: {
  asset_class?: string | null;
  uw_data?: Record<string, unknown> | null;
}): boolean {
  const normalized = normalizeAssetClass(deal.asset_class ?? undefined);
  // Commercial, multifamily, and MHC get the grid-based commercial UW (Pro Forma, rent roll, etc.)
  if (
    normalized === "commercial" ||
    normalized === "multifamily" ||
    normalized === "mhc"
  ) {
    return true;
  }
  const loanType = String(deal.uw_data?.loan_type ?? "").trim().toLowerCase();
  if (!loanType) return false;
  const commercialLoanKeywords = ["bridge", "perm", "construction", "equity"];
  return commercialLoanKeywords.some(
    (keyword) => loanType === keyword || loanType.includes(keyword)
  );
}

/**
 * Check if a visibility condition has any values set.
 */
export function hasCondition(condition: VisibilityCondition | null | undefined): boolean {
  if (!condition) return false;
  if (Array.isArray(condition.asset_class) && condition.asset_class.length > 0) return true;
  if (condition.conditions) {
    for (const vals of Object.values(condition.conditions)) {
      if (Array.isArray(vals) && vals.length > 0) return true;
    }
  }
  return false;
}

/**
 * Create a summary label for a visibility condition.
 */
export function conditionSummary(condition: VisibilityCondition | null | undefined): string {
  if (!condition || !hasCondition(condition)) return "Always visible";
  const parts: string[] = [];
  if (condition.asset_class?.length) {
    parts.push(condition.asset_class.map(assetClassLabel).join(" | "));
  }
  if (condition.conditions) {
    for (const [key, vals] of Object.entries(condition.conditions)) {
      if (vals && vals.length > 0) {
        parts.push(`${key}: ${vals.join(" | ")}`);
      }
    }
  }
  return parts.join(" + ");
}

/**
 * Well-known condition keys that appear in the Condition Editor UI.
 * Each references a field_key whose dropdown_options provide the value list.
 */
export const WELL_KNOWN_CONDITIONS = [
  { field_key: "loan_type", label: "Loan Type" },
  { field_key: "loan_purpose", label: "Loan Purpose" },
  { field_key: "acquisition_type", label: "Acquisition Type" },
  { field_key: "exit_strategy", label: "Exit Strategy" },
] as const;
