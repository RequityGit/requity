"use client";

import { useRef, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { formatCurrencyInput } from "@repo/lib/src/pricing/engine";
import type { CustomFieldComponentProps } from "./index";

export function ThousandsCurrencyInput({
  field,
  value,
  onChange,
  onBlur,
  error,
}: CustomFieldComponentProps) {
  const thousandsRawRef = useRef<string>("");

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const raw = thousandsRawRef.current || "";
      if (e.key >= "0" && e.key <= "9") {
        e.preventDefault();
        const newRaw = raw + e.key;
        const cleaned = String(parseInt(newRaw));
        thousandsRawRef.current = cleaned;
        onChange(formatCurrencyInput(String(parseInt(cleaned) * 1000)));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        const newRaw = raw.slice(0, -1);
        thousandsRawRef.current = newRaw;
        onChange(newRaw ? formatCurrencyInput(String(parseInt(newRaw) * 1000)) : "");
      }
    },
    [onChange]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const digits = e.clipboardData.getData("text").replace(/\D/g, "");
      if (digits) {
        const cleaned = String(parseInt(digits));
        thousandsRawRef.current = cleaned;
        onChange(formatCurrencyInput(String(parseInt(cleaned) * 1000)));
      }
    },
    [onChange]
  );

  return (
    <div className="space-y-1.5">
      {field.label && (
        <Label className="text-sm font-medium text-foreground">
          {field.label}
          {field.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
      )}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          $
        </span>
        <Input
          type="text"
          value={String(value || "")}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onChange={() => {}} // Controlled by keyboard handler
          onBlur={onBlur}
          placeholder={field.placeholder || "$0"}
          className="num pl-7"
          required={field.required}
        />
      </div>
      <p className="text-xs text-muted-foreground">Enter in thousands (e.g. 500 = $500,000)</p>
      {error && <p className="text-xs text-destructive mt-1">{error}</p>}
    </div>
  );
}
