"use client";

import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { updateUwDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedCardType,
  type UwFieldDef,
  computeUwOutput,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
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

function UwField({
  field,
  value,
  onChange,
  onBlur,
  disabled,
}: {
  field: UwFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  disabled?: boolean;
}) {
  switch (field.type) {
    case "currency":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              value={value != null ? String(value) : ""}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
              onBlur={onBlur}
              disabled={disabled}
              className="pl-7 text-right num"
              placeholder="0"
            />
          </div>
        </div>
      );
    case "percent":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={value != null ? String(value) : ""}
              onChange={(e) =>
                onChange(e.target.value ? Number(e.target.value) : null)
              }
              onBlur={onBlur}
              disabled={disabled}
              className="pr-7 text-right num"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          </div>
        </div>
      );
    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type="number"
            value={value != null ? String(value) : ""}
            onChange={(e) =>
              onChange(e.target.value ? Number(e.target.value) : null)
            }
            onBlur={onBlur}
            disabled={disabled}
            className="num"
            placeholder="0"
          />
        </div>
      );
    case "boolean":
      return (
        <div className="flex items-center justify-between py-2">
          <Label className="text-xs">{field.label}</Label>
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => {
              onChange(checked);
              // Immediately save boolean changes
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          />
        </div>
      );
    case "select":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Select
            value={value != null ? String(value) : ""}
            onValueChange={(val) => {
              onChange(val);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt} value={opt}>
                  {opt.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    case "date":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <DatePicker
            value={value != null ? String(value) : ""}
            onChange={(val) => {
              onChange(val || null);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          />
        </div>
      );
    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.label}</Label>
          <Input
            type="text"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value || null)}
            onBlur={onBlur}
            disabled={disabled}
            placeholder={field.label}
          />
        </div>
      );
  }
}
