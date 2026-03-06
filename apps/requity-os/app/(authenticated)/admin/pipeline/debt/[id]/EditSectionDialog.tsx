"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SelectOption } from "./EditableFieldRow";

export type SectionFieldType =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "select"
  | "readonly";

export interface SectionField {
  label: string;
  fieldName: string;
  fieldType?: SectionFieldType;
  options?: SelectOption[];
  value: string | number | null | undefined;
  /** For related-table fields */
  relatedTable?: string;
  relatedId?: string | null;
}

interface EditSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: SectionField[];
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
  onSaveRelated?: (
    table: string,
    id: string,
    field: string,
    value: string | number | null
  ) => Promise<boolean>;
}

export function EditSectionDialog({
  open,
  onOpenChange,
  title,
  fields,
  onSave,
  onSaveRelated,
}: EditSectionDialogProps) {
  const editableFields = fields.filter(
    (f) => f.fieldType !== "readonly" && !(f.relatedTable && !f.relatedId)
  );
  const initialValues: Record<string, string> = {};
  for (const f of editableFields) {
    initialValues[f.fieldName] = f.value != null ? String(f.value) : "";
  }

  const [values, setValues] = useState<Record<string, string>>(initialValues);
  const [saving, setSaving] = useState(false);

  // Reset form values when dialog opens
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        const resetValues: Record<string, string> = {};
        for (const f of editableFields) {
          resetValues[f.fieldName] = f.value != null ? String(f.value) : "";
        }
        setValues(resetValues);
      }
      onOpenChange(isOpen);
    },
    [editableFields, onOpenChange]
  );

  const handleChange = useCallback((fieldName: string, val: string) => {
    setValues((prev) => ({ ...prev, [fieldName]: val }));
  }, []);

  const handleSubmit = useCallback(async () => {
    setSaving(true);
    try {
      for (const f of editableFields) {
        const rawVal = values[f.fieldName] ?? "";
        const currentVal = f.value != null ? String(f.value) : "";

        // Skip unchanged fields
        if (rawVal === currentVal) continue;

        let parsedValue: string | number | null = rawVal || null;

        if (
          parsedValue !== null &&
          (f.fieldType === "number" ||
            f.fieldType === "currency" ||
            f.fieldType === "percent")
        ) {
          const cleaned = String(parsedValue).replace(/[,$%\s]/g, "");
          const num = Number(cleaned);
          if (!isNaN(num)) {
            parsedValue = num;
          }
        }

        if (f.relatedTable && f.relatedId && onSaveRelated) {
          const ok = await onSaveRelated(
            f.relatedTable,
            f.relatedId,
            f.fieldName,
            parsedValue
          );
          if (!ok) {
            setSaving(false);
            return;
          }
        } else if (onSave) {
          const ok = await onSave(f.fieldName, parsedValue);
          if (!ok) {
            setSaving(false);
            return;
          }
        }
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }, [editableFields, values, onSave, onSaveRelated, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fields.map((f) => {
            const isReadonly = f.fieldType === "readonly" || (f.relatedTable && !f.relatedId);
            if (isReadonly) {
              return (
                <div key={f.fieldName} className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-muted-foreground">
                    {f.label}
                  </Label>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {f.value != null && f.value !== "" ? String(f.value) : "—"}
                    {f.relatedTable && !f.relatedId && (
                      <span className="ml-2 text-xs text-muted-foreground/60">Not linked</span>
                    )}
                  </div>
                </div>
              );
            }

            if (f.fieldType === "select" && f.options) {
              return (
                <div key={f.fieldName} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={f.fieldName} className="text-right">
                    {f.label}
                  </Label>
                  <div className="col-span-3">
                    <Select
                      value={values[f.fieldName] || undefined}
                      onValueChange={(val) => handleChange(f.fieldName, val)}
                    >
                      <SelectTrigger id={f.fieldName}>
                        <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {f.options.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              );
            }

            return (
              <div key={f.fieldName} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={f.fieldName} className="text-right">
                  {f.label}
                </Label>
                <div className="col-span-3 flex items-center gap-1">
                  {f.fieldType === "currency" && (
                    <span className="text-sm text-muted-foreground">$</span>
                  )}
                  <Input
                    id={f.fieldName}
                    type={
                      f.fieldType === "number" ||
                      f.fieldType === "currency" ||
                      f.fieldType === "percent"
                        ? "number"
                        : "text"
                    }
                    step={
                      f.fieldType === "percent"
                        ? "0.1"
                        : f.fieldType === "currency"
                          ? "0.01"
                          : undefined
                    }
                    value={values[f.fieldName] || ""}
                    onChange={(e) => handleChange(f.fieldName, e.target.value)}
                    placeholder={f.label}
                  />
                  {f.fieldType === "percent" && (
                    <span className="text-sm text-muted-foreground">%</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
