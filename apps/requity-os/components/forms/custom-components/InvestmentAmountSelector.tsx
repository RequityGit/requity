"use client";

import { useState, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatCurrency } from "@/lib/format";
import type { CustomFieldComponentProps } from "./index";

const MIN_AMOUNT = 25000;
const INCREMENT = 5000;

function snapToIncrement(raw: number): number {
  if (raw < MIN_AMOUNT) return MIN_AMOUNT;
  return Math.round(raw / INCREMENT) * INCREMENT;
}

function formatDisplayValue(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  const num = parseInt(digits, 10);
  if (isNaN(num) || num === 0) return "";
  return formatCurrency(num);
}

export function InvestmentAmountSelector({
  field,
  value,
  onChange,
  formData,
  error,
}: CustomFieldComponentProps) {
  const [isOther, setIsOther] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [displayValue, setDisplayValue] = useState("");
  const [validationError, setValidationError] = useState("");

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
      setDisplayValue("");
      setValidationError("");
      onChange(parseFloat(val));
    }
  };

  const handleCustomAmountChange = useCallback(
    (val: string) => {
      const digits = val.replace(/\D/g, "");
      setCustomAmount(digits);
      setDisplayValue(formatDisplayValue(digits));

      const num = parseInt(digits, 10);
      if (!digits || isNaN(num) || num === 0) {
        setValidationError("");
        onChange("");
        return;
      }

      if (num < MIN_AMOUNT) {
        setValidationError(`Minimum investment is ${formatCurrency(MIN_AMOUNT)}`);
      } else if (num % INCREMENT !== 0) {
        setValidationError(`Amount must be in ${formatCurrency(INCREMENT)} increments`);
      } else {
        setValidationError("");
      }

      onChange(num);
    },
    [onChange],
  );

  const handleCustomAmountBlur = useCallback(() => {
    const num = parseInt(customAmount, 10);
    if (!customAmount || isNaN(num) || num === 0) return;

    const snapped = snapToIncrement(num);
    const snappedStr = String(snapped);
    setCustomAmount(snappedStr);
    setDisplayValue(formatCurrency(snapped));
    setValidationError("");
    onChange(snapped);
  }, [customAmount, onChange]);

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
    setDisplayValue(formatDisplayValue(stringValue));
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
            type="text"
            inputMode="numeric"
            placeholder="$25,000 minimum, in $5,000 increments"
            value={displayValue}
            onChange={(e) => handleCustomAmountChange(e.target.value)}
            onBlur={handleCustomAmountBlur}
          />
          {validationError && (
            <p className="text-xs text-destructive mt-1">{validationError}</p>
          )}
        </div>
      )}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
