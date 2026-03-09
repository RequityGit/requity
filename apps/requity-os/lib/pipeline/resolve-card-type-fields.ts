import type {
  CardTypeFieldRef,
  UwFieldDef,
  UwFieldObject,
} from "@/components/pipeline-v2/pipeline-types";

/**
 * A field_configurations row (subset of columns needed for resolution).
 */
export interface FieldConfigRecord {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  is_visible: boolean;
  is_archived: boolean;
  dropdown_options: string[] | null;
}

/**
 * Map field_configurations field_type to UwFieldDef type.
 * field_configurations uses "percentage" and "dropdown";
 * UwFieldDef uses "percent" and "select".
 */
function mapFieldType(
  fcType: string
): UwFieldDef["type"] {
  switch (fcType) {
    case "percentage":
      return "percent";
    case "dropdown":
      return "select";
    case "currency":
    case "number":
    case "text":
    case "boolean":
    case "date":
      return fcType as UwFieldDef["type"];
    // email, phone, formula collapse to text in UW context
    default:
      return "text";
  }
}

/**
 * Build a composite key for looking up field configs.
 */
function configKey(module: string, fieldKey: string): string {
  return `${module}:${fieldKey}`;
}

/**
 * Build a lookup map from an array of field config records.
 */
export function buildFieldConfigMap(
  records: FieldConfigRecord[]
): Map<string, FieldConfigRecord> {
  const map = new Map<string, FieldConfigRecord>();
  for (const r of records) {
    map.set(configKey(r.module, r.field_key), r);
  }
  return map;
}

/**
 * Resolve CardTypeFieldRef[] to UwFieldDef[] using the field_configurations map.
 *
 * If refs is empty/missing, returns fallbackFields for backwards compatibility.
 * Fields that are archived or invisible in field_configurations are excluded.
 */
export function resolveCardTypeFields(
  refs: CardTypeFieldRef[] | undefined | null,
  fieldConfigMap: Map<string, FieldConfigRecord>,
  fallbackFields?: UwFieldDef[]
): UwFieldDef[] {
  if (!refs || refs.length === 0) {
    return fallbackFields ?? [];
  }

  const sorted = [...refs].sort((a, b) => a.sort_order - b.sort_order);
  const resolved: UwFieldDef[] = [];

  for (const ref of sorted) {
    const fc = fieldConfigMap.get(configKey(ref.module, ref.field_key));
    if (!fc) {
      // Field config not found -- skip silently (may have been deleted)
      continue;
    }
    if (fc.is_archived || !fc.is_visible) {
      continue;
    }

    resolved.push({
      key: ref.field_key,
      label: fc.field_label,
      type: mapFieldType(fc.field_type),
      required: ref.required,
      object: ref.object as UwFieldObject | undefined,
      options: fc.dropdown_options ?? undefined,
    });
  }

  return resolved;
}
