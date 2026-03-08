/**
 * UW Field → Real DB Table Mappings
 *
 * Maps UW field keys used in unified_deals.uw_data to their canonical
 * source tables and columns. When a mapping exists, reads come from the
 * real table and writes are routed there (with uw_data used as fallback).
 */

export type FieldSource = "property" | "borrower" | "deal";

export interface FieldMapping {
  /** The UW field key used in card type definitions */
  fieldKey: string;
  /** Which object this field belongs to */
  source: FieldSource;
  /** The real DB table to read/write from */
  table: string;
  /** The column name in that table */
  column: string;
}

/**
 * Property fields: mapped from unified_deals.property_id → properties table
 */
const PROPERTY_FIELD_MAPPINGS: FieldMapping[] = [
  { fieldKey: "property_address", source: "property", table: "properties", column: "address_line1" },
  { fieldKey: "property_city", source: "property", table: "properties", column: "city" },
  { fieldKey: "property_state", source: "property", table: "properties", column: "state" },
  { fieldKey: "property_zip", source: "property", table: "properties", column: "zip" },
  { fieldKey: "property_county", source: "property", table: "properties", column: "county" },
  { fieldKey: "parcel_id", source: "property", table: "properties", column: "parcel_id" },
  { fieldKey: "property_type", source: "property", table: "properties", column: "property_type" },
  { fieldKey: "number_of_units", source: "property", table: "properties", column: "number_of_units" },
  { fieldKey: "units_lots_sites", source: "property", table: "properties", column: "number_of_units" },
  { fieldKey: "year_built", source: "property", table: "properties", column: "year_built" },
  { fieldKey: "total_sf", source: "property", table: "properties", column: "gross_building_area_sqft" },
  { fieldKey: "flood_zone_type", source: "property", table: "properties", column: "flood_zone" },
];

/**
 * Borrower fields: resolved via unified_deals.primary_contact_id →
 * crm_contacts.id → borrowers.crm_contact_id
 */
const BORROWER_FIELD_MAPPINGS: FieldMapping[] = [
  { fieldKey: "borrower_fico", source: "borrower", table: "borrowers", column: "credit_score" },
  { fieldKey: "borrower_experience", source: "borrower", table: "borrowers", column: "experience_count" },
  { fieldKey: "flips_completed", source: "borrower", table: "borrowers", column: "experience_count" },
];

/** All field mappings combined */
export const FIELD_MAPPINGS: FieldMapping[] = [
  ...PROPERTY_FIELD_MAPPINGS,
  ...BORROWER_FIELD_MAPPINGS,
];

/** Lookup by field key for O(1) access */
export const FIELD_MAPPING_MAP = new Map<string, FieldMapping>(
  FIELD_MAPPINGS.map((m) => [m.fieldKey, m])
);

/** Get the source type for a field (defaults to "deal" if no mapping) */
export function getFieldSource(fieldKey: string): FieldSource {
  return FIELD_MAPPING_MAP.get(fieldKey)?.source ?? "deal";
}

/** Get all property-mapped field keys */
export function getPropertyFieldKeys(): string[] {
  return PROPERTY_FIELD_MAPPINGS.map((m) => m.fieldKey);
}

/** Get all borrower-mapped field keys */
export function getBorrowerFieldKeys(): string[] {
  return BORROWER_FIELD_MAPPINGS.map((m) => m.fieldKey);
}
