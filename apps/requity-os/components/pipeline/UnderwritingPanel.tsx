"use client";

import { useState, useTransition, useMemo } from "react";
import { updateUwDataAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  type UwFieldDef,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
import { UwField } from "./UwField";
import { useUwFieldConfigs } from "@/hooks/useUwFieldConfigs";
import type { VisibilityContext } from "@/lib/visibility-engine";
import { evaluateFormula } from "@/lib/formula-engine";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const OBJECT_LABELS: Record<string, { label: string; color: string }> = {
  deal: { label: "Deal", color: "bg-blue-500/10 text-blue-600" },
  property: { label: "Property", color: "bg-amber-500/10 text-amber-600" },
  borrower: { label: "Borrower", color: "bg-emerald-500/10 text-emerald-600" },
};

interface UnderwritingPanelProps {
  dealId: string;
  uwData: Record<string, unknown>;
  readOnly?: boolean;
  visibilityContext?: VisibilityContext | null;
}

export function UnderwritingPanel({
  dealId,
  uwData,
  readOnly,
  visibilityContext,
}: UnderwritingPanelProps) {
  // Fetch ALL UW field configs filtered by Condition Matrix visibility
  const { byObject, allFields } = useUwFieldConfigs(visibilityContext);

  const [localData, setLocalData] = useState<Record<string, unknown>>(uwData);
  const [pending, startTransition] = useTransition();

  // Group fields by object binding (deal, property, borrower)
  const fieldGroups = useMemo(() => {
    return Object.entries(byObject).filter(([, fields]) => fields.length > 0);
  }, [byObject]);

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

  const formulaValues = useMemo(() => {
    const values: Record<string, number | null> = {};
    const vars: Record<string, number> = {};
    for (const [k, v] of Object.entries(localData)) {
      if (typeof v === "number") vars[k] = v;
      else if (typeof v === "string" && v !== "" && !isNaN(Number(v))) vars[k] = Number(v);
    }
    for (const field of allFields) {
      if (field.formulaExpression) {
        try {
          const result = evaluateFormula(field.formulaExpression, vars);
          values[field.key] = typeof result === "number" && isFinite(result) ? result : null;
        } catch {
          values[field.key] = null;
        }
      }
    }
    return values;
  }, [allFields, localData]);

  const activeOutputs = useMemo(() => {
    return allFields
      .filter((f) => f.formulaExpression)
      .map((f) => ({ key: f.key, label: f.label, format: f.formulaOutputFormat, value: formulaValues[f.key] ?? null }))
      .filter((o) => o.value != null);
  }, [allFields, formulaValues]);

  return (
    <div className="space-y-6">
      {activeOutputs.length > 0 && (
        <div className="bg-muted rounded-lg p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {activeOutputs.map((output) => (
              <div key={output.key}>
                <p className="text-xs text-muted-foreground">{output.label}</p>
                <p className="text-sm font-semibold num mt-0.5">
                  {output.format === "currency"
                    ? formatCurrency(output.value)
                    : output.format === "percent"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((field) => {
                // Formula fields render as read-only computed values
                if (field.formulaExpression) {
                  const computed = formulaValues[field.key];
                  const formatted =
                    computed == null
                      ? "---"
                      : field.formulaOutputFormat === "currency"
                        ? formatCurrency(computed)
                        : field.formulaOutputFormat === "percent"
                          ? formatPercent(computed)
                          : computed.toFixed(field.formulaDecimalPlaces ?? 2);
                  return (
                    <div key={field.key} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">
                        {field.label}
                      </label>
                      <div className="text-sm font-semibold num bg-muted/50 rounded px-3 py-2">
                        {formatted}
                      </div>
                    </div>
                  );
                }
                return (
                  <UwField
                    key={field.key}
                    field={field}
                    value={localData[field.key]}
                    onChange={(val) => handleFieldChange(field.key, val)}
                    onBlur={() => handleFieldBlur(field.key)}
                    disabled={readOnly || pending}
                  />
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
