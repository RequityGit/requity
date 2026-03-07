"use client";

import { useState, useTransition } from "react";
import { updateUwDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedCardType,
  computeUwOutput,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
import { UwField } from "./UwField";
import { toast } from "sonner";

interface UnderwritingPanelProps {
  cardType: UnifiedCardType;
  dealId: string;
  uwData: Record<string, unknown>;
  readOnly?: boolean;
}

export function UnderwritingPanel({
  cardType,
  dealId,
  uwData,
  readOnly,
}: UnderwritingPanelProps) {
  const [localData, setLocalData] = useState<Record<string, unknown>>(uwData);
  const [pending, startTransition] = useTransition();

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

  // Compute outputs
  const computedOutputs = cardType.uw_outputs.map((output) => ({
    ...output,
    value: computeUwOutput(output.key, localData, cardType.uw_outputs),
  }));

  const activeOutputs = computedOutputs.filter((o) => o.value != null);

  return (
    <div className="space-y-6">
      {/* Computed outputs summary */}
      {activeOutputs.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activeOutputs.map((output) => (
              <div key={output.key}>
                <p className="text-xs text-muted-foreground">{output.label}</p>
                <p className="text-sm font-semibold num mt-0.5">
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
      )}

      {/* UW Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cardType.uw_fields.map((field) => (
          <UwField
            key={field.key}
            field={field}
            value={localData[field.key]}
            onChange={(val) => handleFieldChange(field.key, val)}
            onBlur={() => handleFieldBlur(field.key)}
            disabled={readOnly || pending}
          />
        ))}
      </div>
    </div>
  );
}
