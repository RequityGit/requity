"use client";

import { FormField } from "./FormField";
import type { FormStep, VisibilityMode, VisibilityFormMode } from "@/lib/form-engine/types";

interface StepRendererProps {
  step: FormStep;
  data: Record<string, unknown>;
  onChange: (fieldId: string, value: unknown) => void;
  onBlur?: (fieldId: string) => void;
  visibilityContext: "external" | "internal";
  formMode: "create" | "edit";
  errors?: Record<string, string>;
}

function shouldShowField(
  fieldVisibility: VisibilityMode,
  fieldFormMode: VisibilityFormMode,
  visibilityContext: "external" | "internal",
  formMode: "create" | "edit"
): boolean {
  // Check context visibility
  if (fieldVisibility === "external_only" && visibilityContext !== "external") return false;
  if (fieldVisibility === "internal_only" && visibilityContext !== "internal") return false;

  // Check form mode visibility
  if (fieldFormMode === "create_only" && formMode !== "create") return false;
  if (fieldFormMode === "edit_only" && formMode !== "edit") return false;

  return true;
}

export function StepRenderer({
  step,
  data,
  onChange,
  onBlur,
  visibilityContext,
  formMode,
  errors,
}: StepRendererProps) {
  const visibleFields = step.fields.filter((field) =>
    shouldShowField(
      field.visibility_mode,
      field.visibility_form_mode,
      visibilityContext,
      formMode
    )
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{step.title}</h2>
        {step.subtitle && (
          <p className="text-sm text-muted-foreground mt-1">{step.subtitle}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-4">
        {visibleFields.map((field) => (
          <div
            key={field.id}
            className={field.width === "half" ? "w-full sm:w-[calc(50%-0.5rem)]" : "w-full"}
          >
            <FormField
              field={field}
              value={data[field.id]}
              onChange={onChange}
              onBlur={onBlur}
              error={errors?.[field.id]}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
