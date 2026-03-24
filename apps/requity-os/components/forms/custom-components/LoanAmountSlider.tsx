"use client";

import { useState, useEffect, useMemo } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { parseCurrency } from "@repo/lib/src/pricing/engine";
import type { CustomFieldComponentProps } from "./index";

const DEFAULT_SLIDER = { min: 50, max: 90, default: 75 };

export function LoanAmountSlider({
  field,
  value,
  onChange,
  formData,
  error,
}: CustomFieldComponentProps) {
  const config = (field.component_config || {}) as {
    min?: number;
    max?: number;
    default?: number;
    purchase_price_field?: string;
    rehab_budget_field?: string;
    arv_field?: string;
  };

  const min = config.min ?? DEFAULT_SLIDER.min;
  const max = config.max ?? DEFAULT_SLIDER.max;
  const defaultPercent = config.default ?? DEFAULT_SLIDER.default;
  const purchasePriceField = config.purchase_price_field || "purchase_price";
  const rehabBudgetField = config.rehab_budget_field || "rehab_budget";
  const arvField = config.arv_field || "after_repair_value";

  const purchasePrice = parseCurrency(String(formData[purchasePriceField] || "0"));
  const rehabBudget = parseCurrency(String(formData[rehabBudgetField] || "0"));
  const arv = parseCurrency(String(formData[arvField] || "0"));
  const totalCost = purchasePrice + rehabBudget;

  // Initialize slider percent from value or default
  const [sliderPercent, setSliderPercent] = useState(() => {
    if (value && typeof value === "string") {
      const loanAmount = parseCurrency(value);
      if (totalCost > 0) {
        return Math.round((loanAmount / totalCost) * 100);
      }
    }
    return defaultPercent;
  });

  // Calculate derived values
  const sliderLoanAmount = totalCost > 0 ? Math.round((totalCost * sliderPercent) / 100) : 0;
  const ltc = totalCost > 0 ? (sliderLoanAmount / totalCost) * 100 : 0;
  const ltv = arv > 0 ? (sliderLoanAmount / arv) * 100 : null;
  const equityIn = totalCost - sliderLoanAmount;

  // Sync slider to form value
  useEffect(() => {
    if (totalCost > 0) {
      const amount = Math.round((totalCost * sliderPercent) / 100);
      onChange(String(amount));
    } else {
      onChange("");
    }
  }, [sliderPercent, totalCost, onChange]);

  // Update slider when purchase price or rehab changes
  useEffect(() => {
    if (totalCost > 0 && value) {
      const loanAmount = parseCurrency(String(value));
      const newPercent = Math.round((loanAmount / totalCost) * 100);
      if (newPercent >= min && newPercent <= max) {
        setSliderPercent(newPercent);
      }
    }
  }, [purchasePrice, rehabBudget, totalCost, min, max, value]);

  if (totalCost < 100000) {
    return (
      <div className="space-y-1.5">
        {field.label && (
          <Label className="text-sm font-medium text-foreground">
            {field.label}
            {field.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
        )}
        <Input
          type="text"
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || "$0"}
          className="num"
        />
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {field.label && (
        <Label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}

      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-4">
        <div>
          <div className="text-2xl font-semibold text-foreground mb-1">
            {formatCurrency(sliderLoanAmount)}
          </div>
          <div className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
            {sliderPercent}% of Total Cost
          </div>
        </div>

        <div className="space-y-2">
          <input
            type="range"
            min={min}
            max={max}
            step={1}
            value={sliderPercent}
            onChange={(e) => setSliderPercent(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
            style={{
              background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${((sliderPercent - min) / (max - min)) * 100}%, hsl(var(--muted)) ${((sliderPercent - min) / (max - min)) * 100}%, hsl(var(--muted)) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{min}%</span>
            <span>{max}%</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border">
          <div className="text-center">
            <div
              className={`text-sm font-semibold ${
                ltc <= 75 ? "text-green-600" : ltc <= 85 ? "text-amber-600" : "text-red-600"
              }`}
            >
              {ltc.toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">LTC</div>
          </div>
          <div className="text-center">
            <div
              className={`text-sm font-semibold ${
                ltv === null
                  ? "text-muted-foreground"
                  : ltv <= 65
                    ? "text-green-600"
                    : ltv <= 75
                      ? "text-amber-600"
                      : "text-red-600"
              }`}
            >
              {ltv !== null ? `${ltv.toFixed(1)}%` : "—"}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">LTV</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold text-foreground">
              {formatCurrency(equityIn)}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Equity In</div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Total project cost: {formatCurrency(totalCost)}
        </div>
      </div>

      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
