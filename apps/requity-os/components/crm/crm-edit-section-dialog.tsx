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
import { Textarea } from "@/components/ui/textarea";

export type CrmFieldType =
  | "text"
  | "number"
  | "currency"
  | "date"
  | "select"
  | "boolean"
  | "textarea"
  | "readonly";

export interface CrmSectionField {
  label: string;
  fieldName: string;
  fieldType?: CrmFieldType;
  options?: { label: string; value: string }[];
  value: string | number | boolean | null | undefined;
}

interface CrmEditSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: CrmSectionField[];
  onSave: (field: string, value: string | number | boolean | null) => Promise<void>;
}

export function CrmEditSectionDialog({
  open,
  onOpenChange,
  title,
  fields,
  onSave,
}: CrmEditSectionDialogProps) {
  const editableFields = fields.filter((f) => f.fieldType !== "readonly");
  const buildInitialValues = useCallback(() => {
    const vals: Record<string, string> = {};
    for (const f of editableFields) {
      if (f.fieldType === "boolean") {
        vals[f.fieldName] = f.value ? "true" : "false";
      } else {
        vals[f.fieldName] = f.value != null ? String(f.value) : "";
      }
    }
    return vals;
  }, [editableFields]);

  const [values, setValues] = useState<Record<string, string>>(buildInitialValues);
  const [saving, setSaving] = useState(false);

  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setValues(buildInitialValues());
      }
      onOpenChange(isOpen);
    },
    [buildInitialValues, onOpenChange]
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

        // For booleans, compare normalized
        if (f.fieldType === "boolean") {
          const currentBool = f.value ? "true" : "false";
          if (rawVal === currentBool) continue;
        } else if (rawVal === currentVal) {
          continue;
        }

        let parsed: string | number | boolean | null;
        if (rawVal === "" || rawVal === null) {
          parsed = null;
        } else if (f.fieldType === "number" || f.fieldType === "currency") {
          const num = Number(rawVal);
          parsed = isNaN(num) ? null : num;
        } else if (f.fieldType === "boolean") {
          parsed = rawVal === "true";
        } else {
          parsed = rawVal;
        }

        await onSave(f.fieldName, parsed);
      }
      onOpenChange(false);
    } catch {
      // toast handled by parent's onSave
    } finally {
      setSaving(false);
    }
  }, [editableFields, values, onSave, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {fields.map((f) => {
            if (f.fieldType === "readonly") {
              return (
                <div key={f.fieldName} className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-muted-foreground">
                    {f.label}
                  </Label>
                  <div className="col-span-3 text-sm text-muted-foreground">
                    {f.value != null && f.value !== "" ? String(f.value) : "—"}
                  </div>
                </div>
              );
            }

            if (f.fieldType === "textarea") {
              return (
                <div key={f.fieldName} className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor={f.fieldName} className="text-right pt-2">
                    {f.label}
                  </Label>
                  <Textarea
                    id={f.fieldName}
                    value={values[f.fieldName] || ""}
                    onChange={(e) => handleChange(f.fieldName, e.target.value)}
                    placeholder={f.label}
                    className="col-span-3 min-h-[80px]"
                  />
                </div>
              );
            }

            if ((f.fieldType === "select" || f.fieldType === "boolean") && (f.options || f.fieldType === "boolean")) {
              const opts = f.fieldType === "boolean"
                ? [{ label: "Yes", value: "true" }, { label: "No", value: "false" }]
                : f.options!;
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
                        {opts.map((opt) => (
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
                      f.fieldType === "number" || f.fieldType === "currency"
                        ? "number"
                        : f.fieldType === "date"
                          ? "date"
                          : "text"
                    }
                    step={f.fieldType === "currency" ? "0.01" : undefined}
                    value={values[f.fieldName] || ""}
                    onChange={(e) => handleChange(f.fieldName, e.target.value)}
                    placeholder={f.label}
                  />
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
