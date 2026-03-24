"use client";

import { useMemo } from "react";
import { cn } from "@repo/lib";
import type { FieldConfig } from "../actions";
import {
  ASSET_CLASSES,
  hasCondition,
  type VisibilityCondition,
} from "@/lib/visibility-engine";

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
          fields will appear here in a matrix showing which asset classes
          make them visible.
        </span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-4">
        <h3 className="text-sm font-semibold mb-1">
          Asset Class Visibility Matrix
        </h3>
        <p className="text-xs text-muted-foreground">
          <span className="text-green-500">&#9679;</span> visible &nbsp;{" "}
          <span className="text-muted-foreground/20">&#9675;</span> hidden
          &nbsp;&nbsp; Fields with additional conditions show a badge.
        </p>
      </div>
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="p-2.5 text-left text-[9px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/50 min-w-[180px] sticky left-0 z-10">
                  Field
                </th>
                {ASSET_CLASSES.map((ac) => (
                  <th
                    key={ac.value}
                    className="p-2 text-center text-[9px] font-semibold text-muted-foreground uppercase border-b border-border bg-muted/50 min-w-[80px] whitespace-nowrap leading-tight"
                  >
                    {ac.label}
                  </th>
                ))}
                <th className="p-2 text-left text-[9px] font-semibold text-muted-foreground uppercase border-b border-border bg-muted/50 min-w-[140px]">
                  Conditions
                </th>
              </tr>
            </thead>
            <tbody>
              {conditionalFields.map((field) => {
                const vc = field.visibility_condition as VisibilityCondition | null;
                const hasExtraConditions = vc?.conditions && Object.keys(vc.conditions).length > 0;

                return (
                  <tr
                    key={field.id}
                    className="border-b border-border last:border-b-0"
                  >
                    <td className="p-2.5 text-xs text-muted-foreground bg-card sticky left-0 z-10">
                      {field.field_label}
                    </td>
                    {ASSET_CLASSES.map((ac) => {
                      const acOnly = vc?.asset_class && vc.asset_class.length > 0
                        ? vc.asset_class.includes(ac.value as never)
                        : true;
                      return (
                        <td
                          key={ac.value}
                          className="p-2 text-center"
                        >
                        <span
                          className={cn(
                            "text-sm",
                            acOnly
                              ? "text-green-500"
                              : "text-muted-foreground/10"
                          )}
                        >
                          {acOnly ? "●" : "○"}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-2 text-[10px] text-muted-foreground">
                      {hasExtraConditions ? (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-400/10 text-indigo-400 font-medium">
                          {Object.entries(vc!.conditions!).map(([k, v]) =>
                            `${k}: ${(v ?? []).join("|")}`
                          ).join(", ")}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">--</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
