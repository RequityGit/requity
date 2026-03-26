"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDateInline } from "@/lib/format";

// ─── Types ───────────────────────────────────────────────────────────────────

interface InlineFieldBaseProps {
  /** Label shown above the value */
  label?: string;
  /** Extra classes on the label element */
  labelClassName?: string;
  /** Fires when the user commits a new value (blur / Enter / select change) */
  onSave: (value: string) => void;
  /** Disable editing */
  disabled?: boolean;
  /** Extra classes on the outermost wrapper */
  className?: string;
  /** Text alignment within the field */
  align?: "left" | "right" | "center";
}

interface InlineTextFieldProps extends InlineFieldBaseProps {
  type: "text" | "number" | "currency" | "percent";
  value: string | number | null | undefined;
  placeholder?: string;
  /** For number types: min clamp */
  min?: number;
  /** For number types: max clamp */
  max?: number;
  /** Custom display formatter for rest state (overrides default formatting) */
  formatValue?: (value: string | number | null | undefined) => string;
}

interface InlineDateFieldProps extends InlineFieldBaseProps {
  type: "date";
  /** ISO date string YYYY-MM-DD or null */
  value: string | null | undefined;
  placeholder?: string;
  /** Custom display formatter for rest state (overrides default formatting) */
  formatValue?: (value: string | null | undefined) => string;
}

interface InlineSelectFieldProps extends InlineFieldBaseProps {
  type: "select";
  value: string | null | undefined;
  placeholder?: string;
  options: readonly string[];
}

export type InlineFieldProps = InlineTextFieldProps | InlineSelectFieldProps | InlineDateFieldProps;

// ─── Formatters ──────────────────────────────────────────────────────────────

const CURRENCY_FMT = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function formatDisplay(
  value: string | number | null | undefined,
  type: InlineFieldProps["type"]
): string {
  if (value === null || value === undefined || value === "") return "";
  const num = typeof value === "number" ? value : parseFloat(String(value));
  if (type === "currency" && Number.isFinite(num) && num !== 0)
    return CURRENCY_FMT.format(num);
  if (type === "percent" && Number.isFinite(num)) return `${num}%`;
  return String(value);
}

function parseNum(s: string): number {
  const n = parseFloat(s.replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function InlineField(props: InlineFieldProps) {
  if (props.type === "select") {
    return <InlineSelectField {...props} />;
  }
  if (props.type === "date") {
    return <InlineDateField {...props} />;
  }
  return <InlineTextField {...props} />;
}

// ─── Text / Number / Currency / Percent ──────────────────────────────────────

function InlineTextField({
  label,
  labelClassName,
  type,
  value,
  placeholder = "Add...",
  onSave,
  disabled,
  className,
  align,
  min,
  max,
  formatValue,
}: InlineTextFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatValue ? formatValue(value) : formatDisplay(value, type);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select?.();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    if (disabled) return;
    // For editing, show raw number value (not formatted)
    const raw =
      value === null || value === undefined ? "" : String(value);
    setDraft(raw);
    setEditing(true);
  }, [value, disabled]);

  const commit = useCallback(() => {
    setEditing(false);
    let finalValue = draft.trim();

    // For numeric types, clamp and clean
    if (type === "number" || type === "currency" || type === "percent") {
      let num = parseNum(finalValue);
      if (min !== undefined) num = Math.max(min, num);
      if (max !== undefined) num = Math.min(max, num);
      finalValue = String(num);
    }

    const currentStr = value === null || value === undefined ? "" : String(value);
    if (finalValue === currentStr) return;

    onSave(finalValue);

    // Flash confirm check
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  }, [draft, value, type, min, max, onSave]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  return (
    <div className={cn("group/field min-w-0", className)}>
      {label && (
        <label className={cn("text-[11px] font-medium text-muted-foreground mb-0.5 block leading-tight", labelClassName)}>
          {label}
        </label>
      )}
      {editing ? (
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          placeholder={placeholder}
          className={cn("h-8 text-sm bg-transparent", align === "right" && "text-right")}
          type={type === "number" || type === "currency" || type === "percent" ? "text" : "text"}
          inputMode={type === "number" || type === "currency" || type === "percent" ? "numeric" : "text"}
          disabled={disabled}
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={disabled}
          className={cn(
            "relative w-full text-sm min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 transition-colors",
            "border border-transparent",
            align === "right" ? "justify-end text-right" : "text-left",
            !disabled && "group-hover/field:border-border group-hover/field:bg-muted/40 cursor-pointer",
            disabled && "cursor-default opacity-60",
            (type === "currency" || type === "number" || type === "percent") && "num tabular-nums"
          )}
        >
          {displayValue ? (
            <span className="truncate">{displayValue}</span>
          ) : (
            <span className="text-muted-foreground/40 truncate">{placeholder}</span>
          )}
          {justSaved && (
            <Check className="absolute right-1.5 h-3.5 w-3.5 text-green-500 animate-in fade-in duration-200" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Date ─────────────────────────────────────────────────────────────────


function InlineDateField({
  label,
  labelClassName,
  value,
  placeholder = "MM/DD/YYYY",
  onSave,
  disabled,
  className,
  formatValue,
}: InlineDateFieldProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [justSaved, setJustSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = formatValue ? formatValue(value) : formatDateInline(value);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      // Open the date picker on some browsers
      inputRef.current.showPicker?.();
    }
  }, [editing]);

  const startEdit = useCallback(() => {
    if (disabled) return;
    // Native date input expects YYYY-MM-DD
    setDraft(value ?? "");
    setEditing(true);
  }, [value, disabled]);

  const commit = useCallback(() => {
    setEditing(false);
    const finalValue = draft.trim();
    const currentStr = value ?? "";
    if (finalValue === currentStr) return;

    onSave(finalValue);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1200);
  }, [draft, value, onSave]);

  const cancel = useCallback(() => {
    setEditing(false);
  }, []);

  return (
    <div className={cn("group/field min-w-0", className)}>
      {label && (
        <label className={cn("text-[11px] font-medium text-muted-foreground mb-0.5 block leading-tight", labelClassName)}>
          {label}
        </label>
      )}
      {editing ? (
        <Input
          ref={inputRef}
          type="date"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commit();
            if (e.key === "Escape") cancel();
          }}
          className="h-8 text-sm bg-transparent"
          disabled={disabled}
        />
      ) : (
        <button
          type="button"
          onClick={startEdit}
          disabled={disabled}
          className={cn(
            "relative w-full text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 transition-colors",
            "border border-transparent",
            !disabled && "group-hover/field:border-border group-hover/field:bg-muted/40 cursor-pointer",
            disabled && "cursor-default opacity-60"
          )}
        >
          {displayValue ? (
            <span className="truncate">{displayValue}</span>
          ) : (
            <span className="text-muted-foreground/40 truncate">{placeholder}</span>
          )}
          {justSaved && (
            <Check className="absolute right-1.5 h-3.5 w-3.5 text-green-500 animate-in fade-in duration-200" />
          )}
        </button>
      )}
    </div>
  );
}

// ─── Select ──────────────────────────────────────────────────────────────────

function InlineSelectField({
  label,
  labelClassName,
  value,
  placeholder = "Select...",
  options,
  onSave,
  disabled,
  className,
}: InlineSelectFieldProps) {
  const [editing, setEditing] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const handleChange = useCallback(
    (v: string) => {
      setEditing(false);
      if (v !== value) {
        onSave(v);
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 1200);
      }
    },
    [value, onSave]
  );

  return (
    <div className={cn("group/field min-w-0", className)}>
      {label && (
        <label className={cn("text-[11px] font-medium text-muted-foreground mb-0.5 block leading-tight", labelClassName)}>
          {label}
        </label>
      )}
      {editing ? (
        <Select
          value={value || undefined}
          onValueChange={handleChange}
          onOpenChange={(open) => {
            if (!open) setEditing(false);
          }}
          defaultOpen
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <button
          type="button"
          onClick={() => !disabled && setEditing(true)}
          disabled={disabled}
          className={cn(
            "relative w-full text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 transition-colors",
            "border border-transparent",
            !disabled && "group-hover/field:border-border group-hover/field:bg-muted/40 cursor-pointer",
            disabled && "cursor-default opacity-60"
          )}
        >
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="text-muted-foreground/40 truncate">{placeholder}</span>
          )}
          {justSaved && (
            <Check className="absolute right-1.5 h-3.5 w-3.5 text-green-500 animate-in fade-in duration-200" />
          )}
        </button>
      )}
    </div>
  );
}
