"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency } from "@/lib/format";
import type { CustomFieldComponentProps } from "./index";

export function InvestmentAmountSelector({
  field,
  value,
  onChange,
  formData,
  error,
}: CustomFieldComponentProps) {
  const [isOther, setIsOther] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  // Dynamic options: prefer deal-specific options from formData, fall back to component_config defaults
  const dealOptions = formData._deal_amount_options as number[] | undefined;
  const configDefaults = (field.component_config?.default_options as number[]) ?? [];
  const amountOptions: number[] =
    dealOptions && dealOptions.length > 0 ? dealOptions : configDefaults.length > 0 ? configDefaults : [25000, 50000, 100000, 250000];

  const stringValue = String(value ?? "");
  const selectedPreset = !isOther ? stringValue : "";

  const handlePresetChange = (val: string) => {
    if (val === "other") {
      setIsOther(true);
      // Keep custom amount if already entered, otherwise clear
      onChange(customAmount ? parseFloat(customAmount) : "");
    } else {
      setIsOther(false);
      setCustomAmount("");
      onChange(parseFloat(val));
    }
  };

  const handleCustomAmountChange = (val: string) => {
    setCustomAmount(val);
    const num = parseFloat(val);
    onChange(num > 0 ? num : "");
  };

  // Determine radio value: if value matches a preset use it, otherwise "other"
  const radioValue = isOther
    ? "other"
    : amountOptions.some((opt) => String(opt) === stringValue)
      ? stringValue
      : stringValue
        ? "other"
        : "";

  // Sync isOther state if value was externally set to a non-preset
  if (
    !isOther &&
    stringValue &&
    !amountOptions.some((opt) => String(opt) === stringValue)
  ) {
    setIsOther(true);
    setCustomAmount(stringValue);
  }

  return (
    <div className="space-y-2">
      {field.label && (
        <Label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <p className="text-xs text-muted-foreground">Soft commitment only, non-binding</p>
      <RadioGroup value={radioValue} onValueChange={handlePresetChange}>
        <div className="grid grid-cols-2 gap-2">
          {amountOptions.map((amount) => (
            <label
              key={amount}
              className={`flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer rq-transition ${
                radioValue === String(amount)
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-border hover:border-muted-foreground/30"
              }`}
            >
              <RadioGroupItem value={String(amount)} className="sr-only" />
              {formatCurrency(amount)}
            </label>
          ))}
          <label
            className={`flex items-center justify-center rounded-lg border px-4 py-3 text-sm font-medium cursor-pointer rq-transition col-span-2 ${
              radioValue === "other"
                ? "border-primary bg-primary/5 text-primary"
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <RadioGroupItem value="other" className="sr-only" />
            Other Amount
          </label>
        </div>
      </RadioGroup>
      {isOther && (
        <div className="mt-2">
          <Input
            type="number"
            min={1}
            placeholder="Enter amount"
            value={customAmount}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
          />
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
