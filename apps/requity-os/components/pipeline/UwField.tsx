"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UwFieldDef } from "./pipeline-types";
import { ReadValue } from "./ReadValue";

function formatCurrencyDisplay(val: unknown): string {
  if (val == null || val === "") return "";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function parseCurrencyInput(raw: string): number | null {
  const stripped = raw.replace(/[^0-9.\-]/g, "");
  if (stripped === "" || stripped === "-") return null;
  const n = Number(stripped);
  return isNaN(n) ? null : n;
}

const FLOOD_RISK_OPTIONS = [
  { value: "none", label: "None", className: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  { value: "minimal", label: "Zone X", className: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  { value: "high", label: "SFHA", className: "bg-red-500/15 text-red-500 border-red-500/30" },
] as const;

function FloodRiskControl({
  value,
  onChange,
  disabled,
}: {
  value: string | null;
  onChange: (val: string) => void;
  disabled?: boolean;
}) {
  const current = value ?? "none";

  return (
    <div className="flex rounded-lg border overflow-hidden h-9">
      {FLOOD_RISK_OPTIONS.map((opt) => {
        const active = current === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={`flex-1 text-xs font-medium transition-colors border-r last:border-r-0 ${
              active
                ? opt.className
                : "text-muted-foreground hover:bg-muted/50"
            } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Save success flash ──

function SaveFlash({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center ml-1.5 text-emerald-500 animate-in fade-in duration-150">
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
    </span>
  );
}

// ── Currency edit sub-component ──

function CurrencyEditInput({
  field,
  value,
  onChange,
  onBlur,
  onKeyDown,
  disabled,
}: {
  field: UwFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [rawText, setRawText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleFocus = useCallback(() => {
    setEditing(true);
    setRawText(value != null && value !== "" ? formatCurrencyDisplay(value) : "");
  }, [value]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    onBlur();
  }, [onBlur]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      const parsed = parseCurrencyInput(text);
      const display = parsed != null ? formatCurrencyDisplay(parsed) : text.replace(/[^0-9.\-]/g, "");
      setRawText(display);
      onChange(parsed);
    },
    [onChange]
  );

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
        $
      </span>
      <Input
        ref={inputRef}
        type="text"
        inputMode="decimal"
        value={editing ? rawText : formatCurrencyDisplay(value)}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        disabled={disabled}
        className="pl-7 text-right num"
        placeholder="0"
      />
    </div>
  );
}

// ── Main UwField ──

interface UwFieldProps {
  field: UwFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  disabled?: boolean;
  mode?: "read" | "edit";
  onStartEdit?: () => void;
  onEndEdit?: () => void;
}

export function UwField({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  mode = "edit",
  onStartEdit,
  onEndEdit,
}: UwFieldProps) {
  const [showSaved, setShowSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const flashSaved = useCallback(() => {
    setShowSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setShowSaved(false), 800);
  }, []);

  const handleEditBlur = useCallback(() => {
    onBlur();
    flashSaved();
    onEndEdit?.();
  }, [onBlur, onEndEdit, flashSaved]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        onEndEdit?.();
      }
    },
    [onEndEdit]
  );

  // Boolean and flood_risk are always interactive -- no read mode needed
  if (field.type === "boolean") {
    return (
      <div className="flex items-center justify-between py-2">
        <Label className="text-xs">{field.label}</Label>
        <Switch
          checked={!!value}
          onCheckedChange={(checked) => {
            onChange(checked);
            setTimeout(onBlur, 0);
          }}
          disabled={disabled}
        />
      </div>
    );
  }

  if (field.type === "flood_risk") {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs">{field.label}</Label>
        <FloodRiskControl
          value={value as string | null}
          onChange={(val) => {
            onChange(val);
            setTimeout(onBlur, 0);
          }}
          disabled={disabled}
        />
      </div>
    );
  }

  // ── Read mode ──
  if (mode === "read") {
    return (
      <div className="space-y-0.5">
        <Label className="text-xs text-muted-foreground">{field.label}</Label>
        <div className="flex items-center">
          <ReadValue
            value={value}
            fieldType={field.type}
            onClick={onStartEdit}
          />
          <SaveFlash show={showSaved} />
        </div>
      </div>
    );
  }

  // ── Edit mode ──
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{field.label}</Label>
      <EditInput
        field={field}
        value={value}
        onChange={onChange}
        onBlur={handleEditBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />
    </div>
  );
}

// Renders the appropriate edit input based on field type
function EditInput({
  field,
  value,
  onChange,
  onBlur,
  onKeyDown,
  disabled,
}: {
  field: UwFieldDef;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus text-like inputs on edit mode entry
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  switch (field.type) {
    case "currency":
      return (
        <CurrencyEditInput
          field={field}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          disabled={disabled}
        />
      );
    case "percent":
      return (
        <div className="relative">
          <Input
            ref={inputRef}
            type="number"
            step="0.01"
            value={value != null ? String(value) : ""}
            onChange={(e) =>
              onChange(e.target.value ? Number(e.target.value) : null)
            }
            onBlur={onBlur}
            onKeyDown={onKeyDown}
            disabled={disabled}
            className="pr-7 text-right num"
            placeholder="0.00"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
            %
          </span>
        </div>
      );
    case "number":
      return (
        <Input
          ref={inputRef}
          type="number"
          value={value != null ? String(value) : ""}
          onChange={(e) =>
            onChange(e.target.value ? Number(e.target.value) : null)
          }
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          disabled={disabled}
          className="num"
          placeholder="0"
        />
      );
    case "select":
      return (
        <Select
          value={value != null ? String(value) : ""}
          onValueChange={(val) => {
            onChange(val);
            setTimeout(onBlur, 0);
          }}
          disabled={disabled}
        >
          <SelectTrigger onKeyDown={onKeyDown}>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "date":
      return (
        <DatePicker
          value={value != null ? String(value) : ""}
          onChange={(val) => {
            onChange(val || null);
            setTimeout(onBlur, 0);
          }}
          disabled={disabled}
        />
      );
    default:
      return (
        <Input
          ref={inputRef}
          type="text"
          value={value != null ? String(value) : ""}
          onChange={(e) => onChange(e.target.value || null)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          disabled={disabled}
          placeholder={field.label}
        />
      );
  }
}
