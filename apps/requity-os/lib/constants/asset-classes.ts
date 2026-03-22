// ═══════════════════════════════════════════════════════════
// Unified Asset Classes — Single Source of Truth
// ═══════════════════════════════════════════════════════════
//
// This file defines the canonical asset class list used across
// the entire platform: pipeline deals, lender profiles, CRM
// company records, property types, and intake processing.
//
// When you need asset class options anywhere, import from here.
// Do NOT define asset class lists in other files.
//
// Note: "Residential (1-4)" is a single asset class. The sub-type
// (SFR, Condo, Townhouse, Duplex, etc.) and unit count are
// property-level fields, not asset class distinctions.

export type AssetClassKey =
  | "residential_1_4"
  | "multifamily"
  | "mixed_use"
  | "retail"
  | "office"
  | "industrial"
  | "mhc"
  | "land"
  | "rv_park"
  | "self_storage"
  | "hospitality"
  | "marina"
  | "other";

/** Legacy keys that may exist in DB records. Map to canonical keys for display. */
export type LegacyAssetClassKey =
  | "sfr"
  | "condo"
  | "townhouse"
  | "duplex"
  | "triplex"
  | "fourplex"
  | "duplex_fourplex"
  | "campground"
  | "commercial"
  | "multifamily_5_plus"
  | "mobile_home_park"
  | "rv_campground"
  | "hotel_hospitality"
  | "healthcare"
  | "warehouse";

export type AnyAssetClassKey = AssetClassKey | LegacyAssetClassKey;

/** The canonical ordered list of asset classes (13 options) */
export const ASSET_CLASS_OPTIONS: readonly { key: AssetClassKey; label: string }[] = [
  { key: "residential_1_4", label: "Residential (1-4)" },
  { key: "multifamily", label: "Multifamily (5+)" },
  { key: "mixed_use", label: "Mixed Use" },
  { key: "retail", label: "Retail" },
  { key: "office", label: "Office" },
  { key: "industrial", label: "Industrial" },
  { key: "mhc", label: "MHC" },
  { key: "land", label: "Land" },
  { key: "rv_park", label: "RV Park" },
  { key: "self_storage", label: "Self-Storage" },
  { key: "hospitality", label: "Hospitality" },
  { key: "marina", label: "Marina" },
  { key: "other", label: "Other" },
] as const;

/**
 * Labels for ALL keys (canonical + legacy).
 * Use this for display anywhere you have an asset class key.
 */
export const ASSET_CLASS_LABELS: Record<string, string> = {
  // Canonical
  residential_1_4: "Residential (1-4)",
  multifamily: "Multifamily (5+)",
  mixed_use: "Mixed Use",
  retail: "Retail",
  office: "Office",
  industrial: "Industrial",
  mhc: "MHC",
  land: "Land",
  rv_park: "RV Park",
  self_storage: "Self-Storage",
  hospitality: "Hospitality",
  marina: "Marina",
  other: "Other",
  // Legacy aliases (map to canonical labels)
  sfr: "Residential (1-4)",
  condo: "Residential (1-4)",
  townhouse: "Residential (1-4)",
  duplex: "Residential (1-4)",
  triplex: "Residential (1-4)",
  fourplex: "Residential (1-4)",
  duplex_fourplex: "Residential (1-4)",
  campground: "RV Park",
  commercial: "Commercial",
  multifamily_5_plus: "Multifamily (5+)",
  mobile_home_park: "MHC",
  rv_campground: "RV Park",
  hotel_hospitality: "Hospitality",
  healthcare: "Other",
  warehouse: "Industrial",
};

/** Map legacy keys to canonical keys for normalization */
export const LEGACY_KEY_MAP: Record<LegacyAssetClassKey, AssetClassKey> = {
  sfr: "residential_1_4",
  condo: "residential_1_4",
  townhouse: "residential_1_4",
  duplex: "residential_1_4",
  triplex: "residential_1_4",
  fourplex: "residential_1_4",
  duplex_fourplex: "residential_1_4",
  campground: "rv_park",
  commercial: "other",
  multifamily_5_plus: "multifamily",
  mobile_home_park: "mhc",
  rv_campground: "rv_park",
  hotel_hospitality: "hospitality",
  healthcare: "other",
  warehouse: "industrial",
};

/** Canonical options as a Record (for chip groups, multi-selects) */
export const ASSET_CLASS_RECORD: Record<string, string> = Object.fromEntries(
  ASSET_CLASS_OPTIONS.map((o) => [o.key, o.label])
);

/** Resolve any asset class key (including legacy) to its display label */
export function getAssetClassLabel(key: string | null | undefined): string {
  if (!key) return "--";
  return ASSET_CLASS_LABELS[key] ?? key;
}

/** Normalize a legacy key to its canonical key */
export function normalizeAssetClassKey(key: string): AssetClassKey {
  if (key in LEGACY_KEY_MAP) {
    return LEGACY_KEY_MAP[key as LegacyAssetClassKey];
  }
  return key as AssetClassKey;
}
