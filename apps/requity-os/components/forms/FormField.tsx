"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { CardSelect } from "./CardSelect";
import type { FormFieldDefinition } from "@/lib/form-engine/types";

interface FormFieldProps {
  field: FormFieldDefinition;
  value: unknown;
  onChange: (fieldId: string, value: unknown) => void;
  onBlur?: (fieldId: string) => void;
  error?: string;
}

export function FormField({ field, value, onChange, onBlur, error }: FormFieldProps) {
  const handleChange = useCallback(
    (val: unknown) => onChange(field.id, val),
    [field.id, onChange]
  );

  const handleBlur = useCallback(() => {
    onBlur?.(field.id);
  }, [field.id, onBlur]);

  const stringValue = (value as string) || "";

  const renderField = () => {
    switch (field.type) {
      case "text":
      case "email":
      case "phone":
      case "address":
        return (
          <Input
            type={field.type === "phone" ? "tel" : field.type === "address" ? "text" : field.type}
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || undefined}
            required={field.required}
          />
        );

      case "number":
        return (
          <Input
            type="number"
            className="num"
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || undefined}
            required={field.required}
          />
        );

      case "currency":
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              $
            </span>
            <Input
              type="number"
              className="num pl-7"
              value={stringValue}
              onChange={(e) => handleChange(e.target.value)}
              onBlur={handleBlur}
              placeholder={field.placeholder || "0"}
              required={field.required}
            />
          </div>
        );

      case "date":
        return (
          <Input
            type="date"
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            required={field.required}
          />
        );

      case "select":
        return (
          <Select
            value={stringValue || undefined}
            onValueChange={(val) => handleChange(val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Select..."} />
            </SelectTrigger>
            <SelectContent>
              {(field.options || []).map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multi_select":
        return (
          <div className="space-y-2">
            {(field.options || []).map((opt) => {
              const selectedValues = Array.isArray(value) ? value : [];
              const isChecked = selectedValues.includes(opt.value);
              return (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={(checked) => {
                      const newValues = checked
                        ? [...selectedValues, opt.value]
                        : selectedValues.filter((v: string) => v !== opt.value);
                      handleChange(newValues);
                    }}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              );
            })}
          </div>
        );

      case "textarea":
        return (
          <Textarea
            rows={3}
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || undefined}
            required={field.required}
          />
        );

      case "checkbox":
        return (
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={!!value}
              onCheckedChange={(checked) => handleChange(!!checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground">{field.label}</span>
          </label>
        );

      case "card-select":
        return (
          <CardSelect
            options={field.options || []}
            value={stringValue || null}
            onChange={(val) => handleChange(val)}
          />
        );

      default:
        return (
          <Input
            value={stringValue}
            onChange={(e) => handleChange(e.target.value)}
            onBlur={handleBlur}
            placeholder={field.placeholder || undefined}
          />
        );
    }
  };

  // Checkbox renders its own label inline
  if (field.type === "checkbox") {
    return (
      <div className={cn(field.width === "half" ? "w-full" : "w-full")}>
        {renderField()}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  }

  // Card-select doesn't need a label wrapper
  if (field.type === "card-select") {
    return (
      <div className="w-full">
        {renderField()}
        {error && <p className="text-xs text-destructive mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className={cn(field.width === "half" ? "w-full" : "w-full", "space-y-1.5")}>
      {field.label && (
        <Label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      {renderField()}
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
