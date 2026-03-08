"use client";

import { useState, useTransition } from "react";
import { updateUwDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import type { UnifiedCardType, UwFieldDef } from "../pipeline-types";
import { UwField } from "../UwField";
import { toast } from "sonner";

// Property-related field keys, grouped by section
const PROPERTY_DETAIL_KEYS = [
  "property_type",
  "property_address",
  "property_city",
  "property_state",
  "property_zip",
  "property_county",
  "parcel_id",
];

const BUILDING_INFO_KEYS = [
  "number_of_units",
  "total_sf",
  "year_built",
  "is_short_term_rental",
];

const FLOOD_ENV_KEYS = [
  "is_in_flood_zone",
  "flood_zone_type",
];

interface PropertyTabProps {
  dealId: string;
  uwData: Record<string, unknown>;
  cardType: UnifiedCardType;
}

export function PropertyTab({ dealId, uwData, cardType }: PropertyTabProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>(uwData);
  const [pending, startTransition] = useTransition();

  const uwFieldMap = new Map(cardType.uw_fields.map((f) => [f.key, f]));

  function handleFieldChange(key: string, value: unknown) {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  }

  function handleFieldBlur(key: string) {
    const currentVal = localData[key];
    const prevVal = uwData[key];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const result = await updateUwDataAction(dealId, key, currentVal);
      if (result.error) {
        toast.error(`Failed to save ${key}: ${result.error}`);
        setLocalData((prev) => ({ ...prev, [key]: prevVal }));
      }
    });
  }

  function renderSection(title: string, fieldKeys: string[]) {
    const fields = fieldKeys
      .map((key) => uwFieldMap.get(key))
      .filter((f): f is UwFieldDef => f != null);

    if (fields.length === 0) return null;

    return (
      <div className="rounded-xl border bg-card p-5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {title}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {fields.map((field) => (
            <UwField
              key={field.key}
              field={field}
              value={localData[field.key] ?? null}
              onChange={(val) => handleFieldChange(field.key, val)}
              onBlur={() => handleFieldBlur(field.key)}
              disabled={pending}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {renderSection("Property Details", PROPERTY_DETAIL_KEYS)}
      {renderSection("Building Info", BUILDING_INFO_KEYS)}
      {renderSection("Flood & Environmental", FLOOD_ENV_KEYS)}
    </div>
  );
}
