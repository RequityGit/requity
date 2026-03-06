"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { T } from "./components";

export interface SelectOption {
  value: string;
  label: string;
}

export type EditFieldType =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "select"
  | "multiselect";

interface EditableFieldRowProps {
  label: string;
  value?: string | number | null;
  displayValue?: string | null;
  mono?: boolean;
  fieldName: string;
  fieldType?: EditFieldType;
  options?: SelectOption[];
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
  /** For fields on related objects (borrower_entity, borrower) */
  relatedTable?: string;
  relatedId?: string | null;
  onSaveRelated?: (
    table: string,
    id: string,
    field: string,
    value: string | number | null
  ) => Promise<boolean>;
}

export function EditableFieldRow({
  label,
  value,
  displayValue,
  mono,
  fieldName,
  fieldType = "text",
  options,
  onSave,
  relatedTable,
  relatedId,
  onSaveRelated,
}: EditableFieldRowProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isEditable =
    (onSave && !relatedTable) ||
    (onSaveRelated && relatedTable && relatedId) ||
    (onSave && relatedTable && !relatedId);

  const shown =
    displayValue ??
    (value != null && value !== "" ? String(value) : "\u2014");

  const startEditing = useCallback(() => {
    if (!isEditable) return;
    if (fieldType === "currency") {
      setEditValue(value != null ? String(value) : "");
    } else if (fieldType === "percent") {
      setEditValue(value != null ? String(value) : "");
    } else if (fieldType === "select") {
      setEditValue(value != null ? String(value) : "");
    } else {
      setEditValue(value != null ? String(value) : "");
    }
    setIsOpen(true);
  }, [isEditable, value, fieldType]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setEditValue("");
  }, []);

  const save = useCallback(
    async (overrideValue?: string) => {
      const rawVal = overrideValue ?? editValue;
      setIsSaving(true);
      try {
        let parsedValue: string | number | null = rawVal || null;

        if (
          parsedValue !== null &&
          (fieldType === "number" ||
            fieldType === "currency" ||
            fieldType === "percent")
        ) {
          const cleaned = String(parsedValue).replace(/[,$%\s]/g, "");
          const num = Number(cleaned);
          if (!isNaN(num)) {
            parsedValue = num;
          }
        }

        let ok = false;
        if (relatedTable && relatedId && onSaveRelated) {
          ok = await onSaveRelated(
            relatedTable,
            relatedId,
            fieldName,
            parsedValue
          );
        } else if (onSave) {
          ok = await onSave(fieldName, parsedValue);
        }

        if (ok) {
          setIsOpen(false);
        }
      } finally {
        setIsSaving(false);
      }
    },
    [editValue, fieldName, fieldType, onSave, onSaveRelated, relatedTable, relatedId]
  );

  // Select field type - use shadcn Select in a Popover
  if (fieldType === "select" && isEditable) {
    return (
      <div
        className={cn(
          "flex items-baseline justify-between py-[7px] w-full"
        )}
        style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
      >
        <span className="text-[13px]" style={{ color: T.text.muted }}>
          {label}
        </span>
        <Select
          value={value != null && value !== "" ? String(value) : undefined}
          onValueChange={async (newVal) => {
            setIsSaving(true);
            try {
              if (relatedTable && relatedId && onSaveRelated) {
                await onSaveRelated(relatedTable, relatedId, fieldName, newVal || null);
              } else if (onSave) {
                await onSave(fieldName, newVal || null);
              }
            } finally {
              setIsSaving(false);
            }
          }}
        >
          <SelectTrigger
            className={cn(
              "h-7 max-w-[60%] border-0 bg-transparent text-right text-[13px] font-medium shadow-none px-1.5",
              "hover:bg-[#1e1e22] transition-colors rounded",
              mono && "num"
            )}
            style={{ color: T.text.primary }}
          >
            <div className="flex items-center gap-1 w-full justify-end">
              {isSaving ? (
                <Loader2 size={12} className="animate-spin" color={T.accent.blue} />
              ) : (
                <SelectValue placeholder="—" />
              )}
            </div>
          </SelectTrigger>
          <SelectContent>
            {options?.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  // Text/number/currency/percent - inline edit via Popover
  if (isEditable) {
    return (
      <div
        className={cn(
          "flex items-baseline justify-between py-[7px] w-full"
        )}
        style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
      >
        <span className="text-[13px]" style={{ color: T.text.muted }}>
          {label}
        </span>
        <Popover open={isOpen} onOpenChange={(open) => {
          if (!open) cancel();
        }}>
          <PopoverTrigger asChild>
            <button
              onClick={startEditing}
              className={cn(
                "group inline-flex items-center gap-1 max-w-[60%] text-right text-[13px] font-medium cursor-pointer rounded px-1.5 py-0.5 -mr-1.5 transition-colors border-0 bg-transparent",
                "hover:bg-[#1e1e22]",
                mono && "num"
              )}
              style={{ color: T.text.primary }}
            >
              <span>{shown}</span>
              <Pencil
                size={10}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                color={T.text.muted}
                strokeWidth={1.5}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent
            className="w-56 p-2"
            align="end"
            side="bottom"
          >
            <div className="flex items-center gap-1.5">
              {fieldType === "currency" && (
                <span className="text-xs text-muted-foreground">$</span>
              )}
              <Input
                ref={inputRef}
                type={fieldType === "number" || fieldType === "currency" || fieldType === "percent" ? "number" : "text"}
                step={fieldType === "percent" ? "0.1" : fieldType === "currency" ? "0.01" : undefined}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") save();
                  if (e.key === "Escape") cancel();
                }}
                className="h-8 text-sm"
                placeholder={label}
              />
              {fieldType === "percent" && (
                <span className="text-xs text-muted-foreground">%</span>
              )}
              {isSaving ? (
                <Loader2 size={14} className="animate-spin shrink-0" color={T.accent.blue} />
              ) : (
                <>
                  <button
                    onClick={() => save()}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 transition-colors"
                    style={{ backgroundColor: T.accent.green, color: "#fff" }}
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancel}
                    className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md border-0 transition-colors"
                    style={{ backgroundColor: T.bg.border, color: T.text.muted }}
                  >
                    <X size={14} />
                  </button>
                </>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Non-editable fallback (readonly display)
  return (
    <div
      className="flex items-baseline justify-between py-[7px] w-full"
      style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
    >
      <span className="text-[13px]" style={{ color: T.text.muted }}>
        {label}
      </span>
      <span
        className={cn(
          "max-w-[60%] text-right text-[13px] font-medium",
          mono && "num"
        )}
        style={{ color: T.text.primary }}
      >
        {shown}
      </span>
    </div>
  );
}
