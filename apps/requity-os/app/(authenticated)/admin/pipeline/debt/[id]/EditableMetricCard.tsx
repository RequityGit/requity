"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { T } from "./components";

interface EditableMetricCardProps {
  label: string;
  value: string;
  fieldName: string;
  fieldType: "number" | "currency" | "percent";
  rawValue?: number | null;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

export function EditableMetricCard({
  label,
  value,
  fieldName,
  fieldType,
  rawValue,
  onSave,
}: EditableMetricCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isOpen]);

  const startEditing = useCallback(() => {
    if (!onSave) return;
    setEditValue(rawValue != null ? String(rawValue) : "");
    setIsOpen(true);
  }, [onSave, rawValue]);

  const cancel = useCallback(() => {
    setIsOpen(false);
    setEditValue("");
  }, []);

  const save = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const cleaned = editValue.replace(/[,$%\s]/g, "");
      const num = cleaned ? Number(cleaned) : null;
      if (cleaned && isNaN(num as number)) return;
      const ok = await onSave(fieldName, num);
      if (ok) setIsOpen(false);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editValue, fieldName]);

  return (
    <div
      className="group flex flex-1 flex-col gap-0.5 rounded-[10px] px-4 py-3.5 relative"
      style={{
        backgroundColor: T.bg.surface,
        border: `1px solid ${T.bg.border}`,
      }}
    >
      <span
        className="text-[11px] font-medium uppercase tracking-wider"
        style={{ color: T.text.muted }}
      >
        {label}
      </span>

      <Popover open={isOpen} onOpenChange={(open) => { if (!open) cancel(); }}>
        <PopoverTrigger asChild>
          <button
            onClick={startEditing}
            disabled={!onSave}
            className="flex items-center gap-1.5 text-xl font-semibold num cursor-pointer bg-transparent border-0 p-0 text-left"
            style={{ color: T.text.primary }}
          >
            <span>{value}</span>
            {onSave && (
              <Pencil
                size={12}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                color={T.text.muted}
                strokeWidth={1.5}
              />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-2" align="start" side="bottom">
          <div className="flex items-center gap-1.5">
            {fieldType === "currency" && (
              <span className="text-xs text-muted-foreground">$</span>
            )}
            <Input
              ref={inputRef}
              type="number"
              step={fieldType === "percent" ? "0.1" : fieldType === "currency" ? "1" : "1"}
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
                  onClick={save}
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
