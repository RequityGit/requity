import { FIELD_MAPPINGS } from "./uw-field-mappings";

type Row = Record<string, unknown>;

/**
 * Merges real property/borrower data into UW data for a single deal.
 * Call after fetching property and borrower records from Supabase.
 */
export function mergeUwData(
  uwData: Row,
  property: Row | null,
  borrower: Row | null
): Row {
  const merged: Row = { ...uwData };

  if (property) {
    for (const mapping of FIELD_MAPPINGS) {
      if (mapping.source !== "property") continue;
      const val = property[mapping.column];
      if (val != null) merged[mapping.fieldKey] = val;
    }
  }

  if (borrower) {
    for (const mapping of FIELD_MAPPINGS) {
      if (mapping.source !== "borrower") continue;
      const val = borrower[mapping.column];
      if (val != null) merged[mapping.fieldKey] = val;
    }
  }

  return merged;
}

/** Columns needed from the properties table for UW field resolution */
export function getPropertySelectColumns(): string {
  const cols = new Set<string>(["id"]);
  for (const m of FIELD_MAPPINGS) {
    if (m.source === "property") cols.add(m.column);
  }
  return Array.from(cols).join(",");
}

/** Columns needed from the borrowers table for UW field resolution */
export function getBorrowerSelectColumns(): string {
  const cols = new Set<string>(["id", "crm_contact_id"]);
  for (const m of FIELD_MAPPINGS) {
    if (m.source === "borrower") cols.add(m.column);
  }
  return Array.from(cols).join(",");
}
