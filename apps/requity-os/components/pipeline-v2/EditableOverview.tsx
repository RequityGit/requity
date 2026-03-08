"use client";

import { useState, useTransition, useMemo } from "react";
import { updateUwDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedCardType,
  type ChecklistItem,
  computeUwOutput,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
import { UwField } from "./UwField";
import { StageChecklist } from "./StageChecklist";
import { toast } from "sonner";

interface EditableOverviewProps {
  dealId: string;
  uwData: Record<string, unknown>;
  cardType: UnifiedCardType;
  checklist: ChecklistItem[];
}

export function EditableOverview({
  dealId,
  uwData,
  cardType,
  checklist,
}: EditableOverviewProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>(uwData);
  const [pending, startTransition] = useTransition();

  // Build a combined field map including property and contact fields
  const uwFieldMap = useMemo(() => {
    const map = new Map(cardType.uw_fields.map((f) => [f.key, f]));
    for (const f of cardType.property_fields ?? []) map.set(f.key, f);
    for (const f of cardType.contact_fields ?? []) map.set(f.key, f);
    return map;
  }, [cardType.uw_fields, cardType.property_fields, cardType.contact_fields]);

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

  // Compute outputs for metrics banner
  const computedOutputs = cardType.uw_outputs.map((output) => ({
    ...output,
    value: computeUwOutput(output.key, localData, cardType.uw_outputs),
  }));
  const activeOutputs = computedOutputs.filter((o) => o.value != null);

  return (
    <div className="space-y-6">
      {/* Computed Metrics Banner */}
      {activeOutputs.length > 0 && (
        <MetricsBanner outputs={activeOutputs} />
      )}

      {/* Editable Field Groups */}
      {cardType.detail_field_groups.map((group) => (
        <div key={group.label} className="rounded-xl border bg-card p-5">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
            {group.label}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {group.fields.map((fieldKey) => {
              const fieldDef = uwFieldMap.get(fieldKey);
              if (!fieldDef) return null;
              return (
                <UwField
                  key={fieldKey}
                  field={fieldDef}
                  value={localData[fieldKey]}
                  onChange={(val) => handleFieldChange(fieldKey, val)}
                  onBlur={() => handleFieldBlur(fieldKey)}
                  disabled={pending}
                />
              );
            })}
          </div>
        </div>
      ))}

      {/* Stage Checklist */}
      <div className="rounded-xl border bg-card p-5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Stage Checklist
        </h4>
        <StageChecklist items={checklist} />
      </div>
    </div>
  );
}

function MetricsBanner({
  outputs,
}: {
  outputs: { key: string; label: string; type: string; value: number | null }[];
}) {
  return (
    <div className="rounded-xl border bg-primary/5 p-5">
      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
        Key Metrics
      </h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {outputs.map((output) => (
          <div key={output.key}>
            <p className="text-[11px] text-muted-foreground">{output.label}</p>
            <p className="text-base font-semibold num mt-0.5">
              {output.type === "currency"
                ? formatCurrency(output.value)
                : output.type === "percent"
                  ? formatPercent(output.value)
                  : formatRatio(output.value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
