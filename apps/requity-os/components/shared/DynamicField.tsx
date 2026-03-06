"use client";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

// Mirror the dark design tokens used on the deal detail page
const T = {
  bg: {
    borderSubtle: "#1e1e22",
  },
  text: {
    primary: "#fafafa",
    muted: "#71717a",
  },
};

export interface DynamicFieldProps {
  fieldKey: string;
  fieldType: string;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange: (value: any) => void;
  dropdownOptions?: string[] | null;
  disabled?: boolean;
}

/**
 * Renders an admin-created dynamic field that matches the style of
 * existing hardcoded fields on the deal detail page.
 */
export function DynamicField({
  fieldType,
  label,
  value,
  onChange,
  dropdownOptions,
  disabled = false,
}: DynamicFieldProps) {
  const rowStyle = {
    borderBottom: `1px solid ${T.bg.borderSubtle}`,
  };

  const labelEl = (
    <span className="text-[13px]" style={{ color: T.text.muted }}>
      {label}
    </span>
  );

  if (fieldType === "dropdown") {
    const options = dropdownOptions ?? [];
    return (
      <div
        className="flex items-baseline justify-between py-[7px] w-full"
        style={rowStyle}
      >
        {labelEl}
        <Select
          value={value != null && value !== "" ? String(value) : undefined}
          onValueChange={(v) => onChange(v || null)}
          disabled={disabled}
        >
          <SelectTrigger
            className={cn(
              "h-7 max-w-[60%] border-0 bg-transparent text-right text-[13px] font-medium shadow-none px-1.5",
              "hover:bg-[#1e1e22] transition-colors rounded"
            )}
            style={{ color: T.text.primary }}
          >
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (fieldType === "boolean") {
    const isChecked = value === true || value === "true" || value === 1;
    return (
      <div
        className="flex items-baseline justify-between py-[7px] w-full"
        style={rowStyle}
      >
        {labelEl}
        <button
          onClick={() => !disabled && onChange(!isChecked)}
          disabled={disabled}
          className={cn(
            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
            "focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
            isChecked ? "bg-primary" : "bg-input"
          )}
          role="switch"
          aria-checked={isChecked}
          type="button"
        >
          <span
            className={cn(
              "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
              isChecked ? "translate-x-4" : "translate-x-0"
            )}
          />
        </button>
      </div>
    );
  }

  if (fieldType === "date") {
    const dateVal = value != null && value !== "" ? String(value).substring(0, 10) : "";
    return (
      <div
        className="flex items-baseline justify-between py-[7px] w-full"
        style={rowStyle}
      >
        {labelEl}
        <div className="max-w-[60%]">
          <DatePicker
            value={dateVal}
            onChange={onChange}
            disabled={disabled}
            className="h-7 border-0 bg-transparent text-right text-[13px] font-medium shadow-none px-1.5 num"
          />
        </div>
      </div>
    );
  }

  // text, email, phone, number, currency, percentage
  const inputType =
    fieldType === "email"
      ? "email"
      : fieldType === "phone"
      ? "tel"
      : fieldType === "number" || fieldType === "currency" || fieldType === "percentage"
      ? "number"
      : "text";

  const isMono = fieldType === "number" || fieldType === "currency" || fieldType === "percentage";
  const prefix = fieldType === "currency" ? "$" : undefined;
  const suffix = fieldType === "percentage" ? "%" : undefined;

  return (
    <div
      className="flex items-baseline justify-between py-[7px] w-full"
      style={rowStyle}
    >
      {labelEl}
      <div className="flex items-center gap-1 max-w-[60%]">
        {prefix && (
          <span className="text-[13px]" style={{ color: T.text.muted }}>
            {prefix}
          </span>
        )}
        <Input
          type={inputType}
          value={value != null ? String(value) : ""}
          onChange={(e) => {
            const raw = e.target.value;
            if (inputType === "number") {
              onChange(raw === "" ? null : Number(raw));
            } else {
              onChange(raw || null);
            }
          }}
          disabled={disabled}
          className={cn(
            "h-7 border-0 bg-transparent text-right text-[13px] font-medium shadow-none px-1.5",
            "hover:bg-[#1e1e22] transition-colors focus-visible:ring-0 focus-visible:bg-[#1e1e22]",
            isMono && "num"
          )}
          style={{ color: T.text.primary }}
        />
        {suffix && (
          <span className="text-[13px]" style={{ color: T.text.muted }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
