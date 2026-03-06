"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Pencil, Loader2 } from "lucide-react";
import { T } from "./components";

/* ── Field type definitions ── */

export type FieldType =
  | "text"
  | "number"
  | "currency"
  | "percent"
  | "date"
  | "select"
  | "textarea";

export interface SelectOption {
  value: string;
  label: string;
}

/* ── Editable Date (for sidebar) ── */

interface EditableDateRowProps {
  label: string;
  field: string;
  value?: string | null;
  displayValue?: string;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

export function EditableDateRow({
  label,
  field,
  value,
  displayValue,
  onSave,
}: EditableDateRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(() => {
    if (!onSave) return;
    if (value) {
      const d = new Date(value);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      setEditValue(`${yyyy}-${mm}-${dd}`);
    } else {
      setEditValue("");
    }
    setIsEditing(true);
  }, [onSave, value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const cancel = useCallback(() => {
    setIsEditing(false);
    setEditValue("");
  }, []);

  const save = useCallback(async () => {
    if (!onSave) return;
    setIsSaving(true);
    try {
      const ok = await onSave(field, editValue || null);
      if (ok) setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editValue, field]);

  if (isEditing) {
    return (
      <div
        className="flex items-center justify-between py-1"
        style={{ borderBottom: `1px solid ${T.accent.blue}` }}
      >
        <span className="text-xs" style={{ color: T.text.muted }}>{label}</span>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="date"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
              if (e.key === "Escape") cancel();
            }}
            className="h-6 rounded border px-1.5 text-xs num outline-none"
            style={{
              backgroundColor: T.bg.input,
              borderColor: T.bg.border,
              color: T.text.primary,
            }}
          />
          {isSaving ? (
            <Loader2 size={12} className="animate-spin" color={T.accent.blue} />
          ) : (
            <>
              <button
                onClick={save}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border-none"
                style={{ backgroundColor: T.accent.green, color: "#fff" }}
              >
                <Check size={10} />
              </button>
              <button
                onClick={cancel}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border-none"
                style={{ backgroundColor: T.bg.border, color: T.text.muted }}
              >
                <X size={10} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group flex justify-between py-1.5 transition-colors rounded-sm",
        onSave && "cursor-pointer px-1 -mx-1"
      )}
      style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
      onClick={onSave ? startEditing : undefined}
    >
      <span className="text-xs" style={{ color: T.text.muted }}>{label}</span>
      <span className="flex items-center gap-1">
        <span
          className="text-xs num"
          style={{ color: value ? T.text.primary : T.text.muted }}
        >
          {displayValue ?? "\u2014"}
        </span>
        {onSave && (
          <Pencil
            size={9}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            color={T.text.muted}
            strokeWidth={1.5}
          />
        )}
      </span>
    </div>
  );
}
