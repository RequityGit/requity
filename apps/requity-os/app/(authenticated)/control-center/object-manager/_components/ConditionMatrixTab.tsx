"use client";

import { useMemo } from "react";
import { cn } from "@repo/lib";
import type { FieldConfig } from "../actions";
import {
  AXIS_COMBINATIONS,
  isVisible,
  hasCondition,
} from "@/lib/visibility-engine";
import type { VisibilityCondition } from "@/lib/visibility-engine";

interface Props {
  fields: FieldConfig[];
}

export function ConditionMatrixTab({ fields }: Props) {
  const conditionalFields = useMemo(
    () =>
      fields.filter(
        (f) =>
          !f.is_archived &&
          hasCondition(f.visibility_condition as VisibilityCondition | null)
      ),
    [fields]
  );

  if (conditionalFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <div className="text-3xl text-muted-foreground">&#9673;</div>
        <span className="text-sm font-medium text-muted-foreground">
          No conditional fields
        </span>
        <span className="text-xs text-muted-foreground max-w-sm text-center leading-relaxed">
          Add visibility conditions to fields on the Fields tab. Conditional
          fields will appear here in a matrix showing which axis combinations
          make them visible.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">
          Two-Axis Visibility Matrix
        </h3>
        <p className="text-xs text-muted-foreground">
          <span className="text-green-500">&#9679;</span> visible &nbsp;{" "}
          <span className="text-muted-foreground/20">&#9675;</span> hidden
          &mdash; AND across axes, OR within each axis
        </p>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2.5 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/50 min-w-[140px] sticky left-0 z-10">
                  Field
                </th>
                {AXIS_COMBINATIONS.map((combo) => (
                  <th
                    key={combo.label}
                    className="p-2 text-center text-[8px] font-semibold text-muted-foreground uppercase border-b border-border bg-muted/50 min-w-[52px] whitespace-pre-line leading-tight"
                  >
                    {combo.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conditionalFields.map((field) => (
                <tr
                  key={field.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="p-2.5 text-xs text-muted-foreground bg-card sticky left-0 z-10">
                    {field.field_label}
                  </td>
                  {AXIS_COMBINATIONS.map((combo) => {
                    const visible = isVisible(
                      field.visibility_condition as VisibilityCondition | null,
                      {
                        asset_class: combo.asset_class,
                        loan_type: combo.loan_type,
                      }
                    );
                    return (
                      <td
                        key={combo.label}
                        className="p-2 text-center"
                      >
                        <span
                          className={cn(
                            "text-sm",
                            visible
                              ? "text-green-500"
                              : "text-muted-foreground/10"
                          )}
                        >
                          {visible ? "●" : "○"}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
