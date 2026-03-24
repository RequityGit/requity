// ============================================================================
// Commercial Underwriting — Asset Type Configuration
// Unit labels, ancillary income templates, section visibility by asset type.
// ============================================================================

import type { CommercialPropertyType } from "./types";

// ── Unit Label Helper ──

const UNIT_LABELS: Record<string, { singular: string; plural: string; perLabel: string }> = {
  multifamily:     { singular: "Unit",  plural: "Units",  perLabel: "$/Unit" },
  office:          { singular: "SF",    plural: "SF",     perLabel: "$/SF" },
  retail:          { singular: "SF",    plural: "SF",     perLabel: "$/SF" },
  industrial:      { singular: "SF",    plural: "SF",     perLabel: "$/SF" },
  self_storage:    { singular: "SF",    plural: "SF",     perLabel: "$/SF" },
  hospitality:     { singular: "Room",  plural: "Rooms",  perLabel: "$/Room" },
  healthcare:      { singular: "SF",    plural: "SF",     perLabel: "$/SF" },
  mobile_home_park:{ singular: "Pad",   plural: "Pads",   perLabel: "$/Pad" },
  rv_campground:   { singular: "Site",  plural: "Sites",  perLabel: "$/Site" },
  marina:          { singular: "Slip",  plural: "Slips",  perLabel: "$/Slip" },
  vacation_rental: { singular: "Room",  plural: "Rooms",  perLabel: "$/Room" },
  mixed_use:       { singular: "SF",    plural: "SF",     perLabel: "$/SF" },
  warehouse:       { singular: "SF",    plural: "SF",     perLabel: "$/SF" },
  specialty:       { singular: "Unit",  plural: "Units",  perLabel: "$/Unit" },
  other:           { singular: "Unit",  plural: "Units",  perLabel: "$/Unit" },
};

export function getUnitLabel(
  propertyType: string,
  variant: "singular" | "plural" | "perLabel" = "singular"
): string {
  return UNIT_LABELS[propertyType]?.[variant] ?? UNIT_LABELS.other[variant];
}

/** Whether this property type uses SF as its basis (vs unit count) */
export function isSfBased(propertyType: string): boolean {
  return ["office", "retail", "industrial", "self_storage", "healthcare", "mixed_use", "warehouse"].includes(propertyType);
}

/** Get the basis count for calculations (units or SF depending on type) */
export function getBasisCount(propertyType: string, unitCount: number, totalSf: number): number {
  return isSfBased(propertyType) ? (totalSf || 0) : (unitCount || 0);
}

// ── Ancillary Income Templates ──

export interface AncillaryTemplate {
  label: string;
  defaultAmount: number;
}

const ANCILLARY_TEMPLATES: Record<string, AncillaryTemplate[]> = {
  multifamily: [
    { label: "Laundry", defaultAmount: 0 },
    { label: "Pet Fees", defaultAmount: 0 },
    { label: "Storage", defaultAmount: 0 },
    { label: "Late Fees", defaultAmount: 0 },
    { label: "Parking", defaultAmount: 0 },
  ],
  mobile_home_park: [
    { label: "Laundry", defaultAmount: 0 },
    { label: "Storage", defaultAmount: 0 },
    { label: "Late Fees", defaultAmount: 0 },
    { label: "Utility Reimbursement", defaultAmount: 0 },
    { label: "Vending", defaultAmount: 0 },
  ],
  rv_campground: [
    { label: "Dump Station", defaultAmount: 0 },
    { label: "Storage", defaultAmount: 0 },
    { label: "Resort/Amenity Fees", defaultAmount: 0 },
    { label: "Equipment Rental", defaultAmount: 0 },
    { label: "Utility Reimbursement", defaultAmount: 0 },
    { label: "Vending", defaultAmount: 0 },
  ],
  hospitality: [
    { label: "F&B", defaultAmount: 0 },
    { label: "Event Space", defaultAmount: 0 },
    { label: "Resort/Amenity Fees", defaultAmount: 0 },
    { label: "Late/Cancel Fees", defaultAmount: 0 },
    { label: "Vending", defaultAmount: 0 },
  ],
  marina: [
    { label: "Storage/Dry Dock", defaultAmount: 0 },
    { label: "Equipment/Boat Rental", defaultAmount: 0 },
    { label: "Resort/Amenity Fees", defaultAmount: 0 },
    { label: "Utility Reimbursement", defaultAmount: 0 },
    { label: "Late/Cancel Fees", defaultAmount: 0 },
  ],
  vacation_rental: [
    { label: "Resort/Amenity Fees", defaultAmount: 0 },
    { label: "Late/Cancel Fees", defaultAmount: 0 },
    { label: "Pet Fees", defaultAmount: 0 },
    { label: "Vending", defaultAmount: 0 },
  ],
  office: [
    { label: "Parking", defaultAmount: 0 },
    { label: "Storage", defaultAmount: 0 },
    { label: "Late Fees", defaultAmount: 0 },
  ],
  retail: [
    { label: "Parking", defaultAmount: 0 },
    { label: "Late Fees", defaultAmount: 0 },
  ],
  industrial: [
    { label: "Storage", defaultAmount: 0 },
    { label: "Late Fees", defaultAmount: 0 },
  ],
  self_storage: [
    { label: "Late Fees", defaultAmount: 0 },
    { label: "Insurance Premiums", defaultAmount: 0 },
    { label: "Merchandise Sales", defaultAmount: 0 },
  ],
  healthcare: [
    { label: "Parking", defaultAmount: 0 },
    { label: "Late Fees", defaultAmount: 0 },
  ],
};

/** Get ancillary income template for a property type */
export function getAncillaryTemplate(propertyType: string): AncillaryTemplate[] {
  return ANCILLARY_TEMPLATES[propertyType] ?? ANCILLARY_TEMPLATES.multifamily;
}

// ── Section Visibility ──

/** Property types that show the Occupancy-Based Income section */
const OCCUPANCY_TYPES = new Set<string>([
  "hospitality",
  "rv_campground",
  "marina",
  "vacation_rental",
]);

/** Should the Occupancy Income section be shown (auto-expanded) for this type? */
export function showOccupancySection(propertyType: string): boolean {
  return OCCUPANCY_TYPES.has(propertyType) || propertyType === "mixed_use";
}

/** Should the Rent Roll section be shown for this type? */
export function showRentRollSection(propertyType: string): boolean {
  const leaseBased = new Set([
    "multifamily", "office", "retail", "industrial", "self_storage",
    "healthcare", "mixed_use", "warehouse",
  ]);
  return leaseBased.has(propertyType) || propertyType === "mixed_use";
}

// ── Occupancy Space Type Presets ──

export interface OccupancySpacePreset {
  label: string;
  defaultRate: number;
  defaultOccupancy: number;
  defaultDays: number;
}

const OCCUPANCY_PRESETS: Record<string, OccupancySpacePreset[]> = {
  hospitality: [
    { label: "Standard Room", defaultRate: 0, defaultOccupancy: 65, defaultDays: 365 },
    { label: "Suite", defaultRate: 0, defaultOccupancy: 55, defaultDays: 365 },
  ],
  rv_campground: [
    { label: "Full Hookup", defaultRate: 0, defaultOccupancy: 60, defaultDays: 365 },
    { label: "Partial Hookup", defaultRate: 0, defaultOccupancy: 50, defaultDays: 365 },
    { label: "Tent Site", defaultRate: 0, defaultOccupancy: 40, defaultDays: 270 },
    { label: "Cabin", defaultRate: 0, defaultOccupancy: 55, defaultDays: 365 },
  ],
  marina: [
    { label: "Wet Slip", defaultRate: 0, defaultOccupancy: 85, defaultDays: 365 },
    { label: "Dry Storage", defaultRate: 0, defaultOccupancy: 90, defaultDays: 365 },
    { label: "Transient Slip", defaultRate: 0, defaultOccupancy: 45, defaultDays: 180 },
  ],
  vacation_rental: [
    { label: "Standard Unit", defaultRate: 0, defaultOccupancy: 60, defaultDays: 365 },
    { label: "Premium Unit", defaultRate: 0, defaultOccupancy: 55, defaultDays: 365 },
  ],
};

/** Get default space types for occupancy-based income */
export function getOccupancyPresets(propertyType: string): OccupancySpacePreset[] {
  return OCCUPANCY_PRESETS[propertyType] ?? OCCUPANCY_PRESETS.hospitality;
}
