// ═══════════════════════════════════════════════════════════
// Deal Display Config — replaces unified_card_types for
// display metadata (labels, icons, kanban metrics, roles).
//
// Derives a "flavor" from deal.asset_class + deal.capital_side
// + deal.uw_data.loan_type. No DB lookup needed.
// ═══════════════════════════════════════════════════════════

import type { AssetClass, CapitalSide, CardMetricDef } from "@/components/pipeline/pipeline-types";

// ─── Flavor type ─────────────────────────────────────────

export type DealFlavor = "res_dscr" | "res_rtl" | "comm_debt" | "comm_equity";

// ─── Display config per flavor ───────────────────────────

export interface DealDisplayConfig {
  flavor: DealFlavor;
  label: string;
  shortLabel: string;
  icon: string;
  cardMetrics: CardMetricDef[];
  contactRoles: string[];
}

const CONFIGS: Record<DealFlavor, DealDisplayConfig> = {
  res_dscr: {
    flavor: "res_dscr",
    label: "Residential DSCR",
    shortLabel: "DSCR",
    icon: "home",
    cardMetrics: [
      { key: "interest_rate", suffix: "%" },
      { key: "ltv", label: "LTV", suffix: "%", computed: true },
      { key: "dscr", label: "DSCR", suffix: "x", computed: true },
    ],
    contactRoles: ["borrower"],
  },
  res_rtl: {
    flavor: "res_rtl",
    label: "Fix & Flip / RTL",
    shortLabel: "RTL",
    icon: "home",
    cardMetrics: [
      { key: "interest_rate", suffix: "%" },
      { key: "ltc", label: "LTC", suffix: "%", computed: true },
      { key: "arv", label: "ARV", format: "compact", prefix: "$" },
    ],
    contactRoles: ["borrower"],
  },
  comm_debt: {
    flavor: "comm_debt",
    label: "Commercial Bridge",
    shortLabel: "Comm Debt",
    icon: "building-2",
    cardMetrics: [
      { key: "interest_rate", suffix: "%" },
      { key: "ltv", label: "LTV", suffix: "%", computed: true },
      { key: "dscr", label: "DSCR", suffix: "x", computed: true },
    ],
    contactRoles: ["borrower"],
  },
  comm_equity: {
    flavor: "comm_equity",
    label: "Commercial Equity",
    shortLabel: "Comm Equity",
    icon: "building-2",
    cardMetrics: [
      { key: "cap_rate_in", label: "cap", suffix: "%", computed: true },
      { key: "units_lots_sites", suffix: " units" },
      { key: "occupancy_current", label: "occ", suffix: "%" },
    ],
    contactRoles: ["borrower", "investor"],
  },
};

// ─── Commercial asset classes ────────────────────────────
// These asset classes route to comm_debt or comm_equity.
// Everything else is residential.

const COMMERCIAL_ASSET_CLASSES: Set<string> = new Set([
  "mhc",
  "rv_park",
  "campground",
  "multifamily",
  "commercial",
  "mixed_use",
]);

// ─── RTL loan type values ────────────────────────────────
// Values that indicate fix-and-flip / RTL product type
// (matched case-insensitively).

const RTL_LOAN_TYPES: Set<string> = new Set([
  "rtl",
  "fix_flip",
  "fix & flip",
  "fix_and_flip",
  "fix and flip",
]);

// ─── Public helpers ──────────────────────────────────────

/**
 * Returns true if the asset class is considered "commercial"
 * for routing/display purposes.
 */
export function isCommercialAssetClass(assetClass: AssetClass | string | null): boolean {
  if (!assetClass) return false;
  return COMMERCIAL_ASSET_CLASSES.has(assetClass);
}

/**
 * Derive the deal "flavor" from deal fields. No DB lookup.
 *
 * Logic:
 *  - equity -> comm_equity (all equity deals are commercial)
 *  - debt + commercial asset class -> comm_debt
 *  - debt + RTL loan type -> res_rtl
 *  - everything else -> res_dscr (default)
 */
export function getDealFlavor(deal: {
  asset_class: AssetClass | string | null;
  capital_side: CapitalSide;
  uw_data?: Record<string, unknown>;
}): DealFlavor {
  // All equity deals are commercial equity
  if (deal.capital_side === "equity") return "comm_equity";

  // Debt: check asset class for commercial
  if (isCommercialAssetClass(deal.asset_class)) return "comm_debt";

  // Debt + residential: check loan type for RTL
  const loanType = String(deal.uw_data?.loan_type ?? "").toLowerCase().trim();
  if (loanType && RTL_LOAN_TYPES.has(loanType)) return "res_rtl";

  // Default: residential DSCR
  return "res_dscr";
}

/**
 * Get the full display config for a deal.
 */
export function getDealDisplayConfig(deal: Parameters<typeof getDealFlavor>[0]): DealDisplayConfig {
  return CONFIGS[getDealFlavor(deal)];
}

/**
 * Get just the display label for a deal (e.g. breadcrumbs).
 */
export function getDealLabel(deal: Parameters<typeof getDealFlavor>[0]): string {
  return CONFIGS[getDealFlavor(deal)].label;
}

/**
 * Get the short label for a deal (e.g. kanban badges, filters).
 */
export function getDealShortLabel(deal: Parameters<typeof getDealFlavor>[0]): string {
  return CONFIGS[getDealFlavor(deal)].shortLabel;
}

/**
 * Map from old card type slug to DealFlavor.
 * Used during the transition period to verify parity.
 */
export const CARD_TYPE_SLUG_TO_FLAVOR: Record<string, DealFlavor> = {
  res_debt_dscr: "res_dscr",
  res_debt_rtl: "res_rtl",
  comm_debt: "comm_debt",
  comm_equity: "comm_equity",
};

/**
 * All available configs, for use in selectors/filters.
 */
export function getAllDealConfigs(): DealDisplayConfig[] {
  return Object.values(CONFIGS);
}
