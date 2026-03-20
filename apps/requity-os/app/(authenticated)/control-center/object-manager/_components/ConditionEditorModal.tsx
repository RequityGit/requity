"use client";

import { useState, useEffect } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@repo/lib";
import {
  ASSET_CLASSES,
  WELL_KNOWN_CONDITIONS,
  type VisibilityCondition,
  type AssetClassValue,
} from "@/lib/visibility-engine";
import type { FieldConfig } from "../actions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  condition: VisibilityCondition | null;
  onSave: (condition: VisibilityCondition | null) => void;
  allFields?: FieldConfig[];
}

export function ConditionEditorModal({
  open,
  onOpenChange,
  condition,
  onSave,
  allFields,
}: Props) {
  const [ac, setAc] = useState<string[]>([]);
  const [conditions, setConditions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setAc(condition?.asset_class ?? []);
      setConditions(condition?.conditions ?? {});
    }
  }, [open, condition]);

  const toggle = (
    list: string[],
    setter: (v: string[]) => void,
    value: string
  ) => {
    setter(
      list.includes(value)
        ? list.filter((i) => i !== value)
        : [...list, value]
    );
  };

  const toggleConditionValue = (key: string, value: string) => {
    setConditions((prev) => {
      const current = prev[key] ?? [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      if (updated.length === 0) {
        const { [key]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [key]: updated };
    });
  };

  const removeCondition = (key: string) => {
    setConditions((prev) => {
      const { [key]: _, ...rest } = prev;
      return rest;
    });
  };

  const addCondition = (key: string) => {
    if (!conditions[key]) {
      setConditions((prev) => ({ ...prev, [key]: [] }));
    }
  };

  const handleSave = () => {
    const c: VisibilityCondition = {};
    if (ac.length) c.asset_class = ac as AssetClassValue[];
    const cleanConditions: Record<string, string[]> = {};
    for (const [k, v] of Object.entries(conditions)) {
      if (v.length > 0) cleanConditions[k] = v;
    }
    if (Object.keys(cleanConditions).length > 0) c.conditions = cleanConditions;
    onSave(Object.keys(c).length ? c : null);
    onOpenChange(false);
  };

  const handleClear = () => {
    setAc([]);
    setConditions({});
  };

  const hasAny = ac.length > 0 || Object.keys(conditions).length > 0;

  const availableConditions = WELL_KNOWN_CONDITIONS.filter(
    (wk) => !conditions[wk.field_key] && conditions[wk.field_key] === undefined
  );

  const getOptionsForCondition = (fieldKey: string): string[] => {
    if (!allFields) return [];
    const field = allFields.find((f) => f.field_key === fieldKey);
    if (field?.dropdown_options && Array.isArray(field.dropdown_options)) {
      return field.dropdown_options as string[];
    }
    const wk = WELL_KNOWN_CONDITIONS.find((w) => w.field_key === fieldKey);
    if (wk?.field_key === "loan_type") {
      return ["Bridge", "DSCR", "Perm", "Construction", "Equity"];
    }
    return [];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Visibility Conditions</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Asset class is the primary filter. Add conditions for finer control.
          </p>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Asset Classes */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 block mb-2">
              Asset Class
            </label>
            <div className="flex gap-2 flex-wrap">
              {ASSET_CLASSES.map(({ value, label }) => {
                const sel = ac.includes(value);
                return (
                  <button
                    key={value}
                    onClick={() => toggle(ac, setAc, value)}
                    className={cn(
                      "px-3 py-1.5 rounded-md text-xs font-medium transition-colors border",
                      sel
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-500"
                        : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {sel && "✓ "}
                    {label}
                  </button>
                );
              })}
            </div>
            {ac.length === 0 && (
              <p className="text-[10px] text-muted-foreground mt-1.5">
                None selected = visible for all asset classes
              </p>
            )}
          </div>

          {/* Additional Conditions */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 block mb-2">
              Additional Conditions
            </label>

            {Object.entries(conditions).length === 0 && (
              <p className="text-[10px] text-muted-foreground mb-2">
                No additional conditions. Field shows for all deal types within the selected asset classes.
              </p>
            )}

            <div className="space-y-3">
              {Object.entries(conditions).map(([key, values]) => {
                const wk = WELL_KNOWN_CONDITIONS.find((w) => w.field_key === key);
                const label = wk?.label ?? key;
                const options = getOptionsForCondition(key);

                return (
                  <div key={key} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-indigo-400">
                        {label}
                      </span>
                      <button
                        onClick={() => removeCondition(key)}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                      {options.map((opt) => {
                        const sel = values.includes(opt);
                        return (
                          <button
                            key={opt}
                            onClick={() => toggleConditionValue(key, opt)}
                            className={cn(
                              "px-2.5 py-1 rounded text-[11px] font-medium transition-colors border",
                              sel
                                ? "border-indigo-400/40 bg-indigo-400/10 text-indigo-400"
                                : "border-border bg-muted/50 text-muted-foreground hover:text-foreground"
                            )}
                          >
                            {sel && "✓ "}
                            {opt}
                          </button>
                        );
                      })}
                      {options.length === 0 && (
                        <p className="text-[10px] text-muted-foreground italic">
                          No dropdown options defined for this field
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {availableConditions.length > 0 && (
              <div className="mt-3">
                <Select onValueChange={addCondition}>
                  <SelectTrigger className="h-8 text-xs w-[200px]">
                    <Plus className="h-3 w-3 mr-1.5" />
                    <SelectValue placeholder="Add condition..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableConditions.map((wk) => (
                      <SelectItem key={wk.field_key} value={wk.field_key} className="text-xs">
                        {wk.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* No conditions helper */}
          {!hasAny && (
            <div className="p-3 rounded-lg border border-dashed border-border text-center">
              <p className="text-xs text-muted-foreground">
                No conditions = always visible
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {hasAny && (
            <Button variant="outline" size="sm" onClick={handleClear}>
              Clear All
            </Button>
          )}
          <Button size="sm" onClick={handleSave}>
            Save Conditions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
