"use client";

import { useState, useTransition, useMemo } from "react";
import { updateUwDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedCardType,
  type UwFieldDef,
  computeUwOutput,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
import { UwField } from "./UwField";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const OBJECT_LABELS: Record<string, { label: string; color: string }> = {
  deal: { label: "Deal", color: "bg-blue-500/10 text-blue-600" },
  property: { label: "Property", color: "bg-amber-500/10 text-amber-600" },
  borrower: { label: "Borrower", color: "bg-emerald-500/10 text-emerald-600" },
};

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

  // Group fields by object binding
  const fieldGroups = useMemo(() => {
    const groups: Record<string, UwFieldDef[]> = { deal: [], property: [], borrower: [] };
    for (const field of cardType.uw_fields) {
      const obj = field.object ?? "deal";
      if (!groups[obj]) groups[obj] = [];
      groups[obj].push(field);
    }
    return Object.entries(groups).filter(([, fields]) => fields.length > 0);
  }, [cardType.uw_fields]);

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

      {/* UW Fields grouped by object binding */}
      {fieldGroups.map(([objectKey, fields]) => {
        const meta = OBJECT_LABELS[objectKey] ?? OBJECT_LABELS.deal;
        return (
          <div key={objectKey} className="space-y-3">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {meta.label} Fields
              </h4>
              <Badge variant="outline" className={`text-[10px] ${meta.color}`}>
                {objectKey === "property"
                  ? "Synced to Property"
                  : objectKey === "borrower"
                    ? "Synced to Borrower"
                    : "Deal UW Data"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {fields.map((field) => (
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
      })}
    </div>
  );
}
