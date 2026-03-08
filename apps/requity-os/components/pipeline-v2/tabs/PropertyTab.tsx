"use client";

import { useState, useTransition } from "react";
import { updatePropertyDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import type { UnifiedCardType, UwFieldDef } from "../pipeline-types";
import { UwField } from "../UwField";
import { toast } from "sonner";

interface PropertyTabProps {
  dealId: string;
  propertyData: Record<string, unknown>;
  cardType: UnifiedCardType;
}

export function PropertyTab({ dealId, propertyData, cardType }: PropertyTabProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>(propertyData);
  const [pending, startTransition] = useTransition();

  const fieldMap = new Map(cardType.property_fields.map((f) => [f.key, f]));

  function handleFieldChange(key: string, value: unknown) {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  }

  function handleFieldBlur(key: string) {
    const currentVal = localData[key];
    const prevVal = propertyData[key];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const result = await updatePropertyDataAction(dealId, key, currentVal);
      if (result.error) {
        toast.error(`Failed to save ${key}: ${result.error}`);
        setLocalData((prev) => ({ ...prev, [key]: prevVal }));
      }
    });
  }

  function renderSection(title: string, fieldKeys: string[]) {
    const fields = fieldKeys
      .map((key) => fieldMap.get(key))
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

  // If no field groups configured, show all fields in a single section
  if (cardType.property_field_groups.length === 0) {
    if (cardType.property_fields.length === 0) {
      return (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No property fields configured for this card type.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {renderSection(
          "Property Details",
          cardType.property_fields.map((f) => f.key)
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {cardType.property_field_groups.map((group) =>
        renderSection(group.label, group.fields)
      )}
    </div>
  );
}
