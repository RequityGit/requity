"use client";

import { useMemo } from "react";
import { Plus, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FieldConfig } from "../actions";
import { ConditionBadge } from "./ConditionBadge";
import type { VisibilityCondition } from "@/lib/visibility-engine";

interface Props {
  fields: FieldConfig[];
  onSelectField: (field: FieldConfig) => void;
}

export function FormulasTab({ fields, onSelectField }: Props) {
  const formulaFields = useMemo(
    () => fields.filter((f) => f.field_type === "formula" && !f.is_archived),
    [fields]
  );

  if (formulaFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Calculator size={32} className="text-muted-foreground" strokeWidth={1} />
        <span className="text-sm font-medium text-muted-foreground">
          No formula fields
        </span>
        <span className="text-xs text-muted-foreground max-w-sm text-center leading-relaxed">
          Create formula fields on the Fields tab to see them here. Formulas
          support cross-object dot notation and recalculate on save.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">Formula Fields</h3>
        <p className="text-xs text-muted-foreground">
          Cross-object dot notation. Recalculate on save. Cached in
          computed_fields JSONB.
        </p>
      </div>
      <div className="space-y-2.5">
        {formulaFields.map((field) => (
          <button
            key={field.id}
            onClick={() => onSelectField(field)}
            className="w-full text-left p-3.5 rounded-lg border border-pink-500/10 bg-pink-500/[0.02] hover:bg-pink-500/5 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{field.field_label}</span>
                <span className="text-[10px] font-mono text-muted-foreground">
                  {field.field_key}
                </span>
              </div>
              <ConditionBadge
                condition={field.visibility_condition as VisibilityCondition | null}
              />
            </div>
            {field.formula_expression && (
              <div className="p-2 rounded-md bg-background border border-border font-mono text-xs text-pink-400">
                {field.formula_expression}
              </div>
            )}
            {field.formula_output_format && (
              <div className="mt-2 flex gap-2 text-[10px] text-muted-foreground">
                <span>
                  Output: <span className="text-foreground">{field.formula_output_format}</span>
                </span>
                <span>
                  Decimals: <span className="text-foreground">{field.formula_decimal_places}</span>
                </span>
              </div>
            )}
          </button>
        ))}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="mt-3 gap-1.5 text-pink-400 hover:text-pink-300 border border-dashed border-pink-500/20"
      >
        <Plus size={13} />
        Add Formula Field
      </Button>
    </div>
  );
}
