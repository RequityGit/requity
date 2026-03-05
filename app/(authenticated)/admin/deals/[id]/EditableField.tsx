"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Pencil, Loader2 } from "lucide-react";

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

interface EditableFieldRowProps {
  label: string;
  /** The DB column name to update */
  field: string;
  value?: string | number | null;
  /** Display value override (formatted) — if not provided, uses value */
  displayValue?: string;
  mono?: boolean;
  link?: boolean;
  half?: boolean;
  /** Field type determines the input control */
  type?: FieldType;
  /** Options for select fields */
  options?: SelectOption[];
  /** Whether the field is read-only (e.g. loan_number, system fields) */
  readOnly?: boolean;
  /** Callback to save the field */
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

export function EditableFieldRow({
  label,
  field,
  value,
  displayValue,
  mono,
  link,
  half,
  type = "text",
  options,
  readOnly,
  onSave,
}: EditableFieldRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  const rawDisplay =
    displayValue ?? (value != null && value !== "" ? String(value) : "\u2014");

  const startEditing = useCallback(() => {
    if (readOnly || !onSave) return;
    // Set the raw value for editing (not the formatted display value)
    setEditValue(value != null ? String(value) : "");
    setIsEditing(true);
  }, [readOnly, onSave, value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select();
      }
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
      let saveValue: string | number | null = editValue.trim() || null;

      // Convert types
      if (saveValue !== null) {
        if (type === "number" || type === "currency" || type === "percent") {
          const num = parseFloat(saveValue);
          if (isNaN(num)) {
            cancel();
            return;
          }
          saveValue = num;
        }
      }

      const ok = await onSave(field, saveValue);
      if (ok) {
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editValue, field, type, cancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && type !== "textarea") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        cancel();
      }
    },
    [save, cancel, type]
  );

  // Editing mode
  if (isEditing) {
    return (
      <div
        className={cn(
          "flex items-center gap-1.5 border-b border-[#3B82F6] py-1",
          half ? "w-[calc(50%-10px)]" : "w-full"
        )}
      >
        <span className="shrink-0 text-[13px] text-[#8B8B8B] font-sans">
          {label}
        </span>
        <div className="flex flex-1 items-center justify-end gap-1">
          {type === "select" && options ? (
            <select
              ref={inputRef as React.RefObject<HTMLSelectElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-7 max-w-[60%] rounded border border-[#E5E5E7] bg-white px-2 text-right text-[13px] font-medium text-[#1A1A1A] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] font-sans"
            >
              <option value="">--</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ) : type === "textarea" ? (
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={3}
              className="max-w-[60%] flex-1 rounded border border-[#E5E5E7] bg-white px-2 py-1 text-right text-[13px] font-medium text-[#1A1A1A] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] font-sans"
            />
          ) : (
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              type={type === "date" ? "date" : type === "number" || type === "currency" || type === "percent" ? "number" : "text"}
              step={type === "percent" ? "0.1" : type === "currency" ? "0.01" : undefined}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className={cn(
                "h-7 max-w-[60%] rounded border border-[#E5E5E7] bg-white px-2 text-right text-[13px] font-medium text-[#1A1A1A] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6]",
                mono ? "num" : "font-sans"
              )}
            />
          )}
          {isSaving ? (
            <Loader2 size={14} className="shrink-0 animate-spin text-[#3B82F6]" />
          ) : (
            <>
              <button
                onClick={save}
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-[#22A861] text-white hover:bg-[#1a8f50]"
                title="Save"
              >
                <Check size={12} />
              </button>
              <button
                onClick={cancel}
                className="flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-[#E5E5E7] text-[#6B6B6B] hover:bg-[#D0D0D2]"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Display mode
  const isEditable = !readOnly && !!onSave;

  return (
    <div
      className={cn(
        "group flex items-baseline justify-between border-b border-[#F0F0F2] py-2 transition-colors",
        half ? "w-[calc(50%-10px)]" : "w-full",
        isEditable && "cursor-pointer hover:bg-[#F7F7F8] hover:border-[#E5E5E7] rounded-sm px-1 -mx-1"
      )}
      onClick={isEditable ? startEditing : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <span className="text-[13px] text-[#8B8B8B] font-sans">{label}</span>
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "max-w-[60%] text-right text-[13px] font-medium",
            mono ? "num" : "font-sans",
            link ? "text-[#3B82F6]" : "text-[#1A1A1A]"
          )}
        >
          {rawDisplay}
        </span>
        {isEditable && isHovered && (
          <Pencil
            size={11}
            className="shrink-0 text-[#8B8B8B] opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </span>
    </div>
  );
}

/* ── Editable Metric Card ── */

interface EditableMetricCardProps {
  label: string;
  field: string;
  value: string;
  rawValue?: number | null;
  type?: FieldType;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

export function EditableMetricCard({
  label,
  field,
  value,
  rawValue,
  type = "currency",
  onSave,
}: EditableMetricCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEditing = useCallback(() => {
    if (!onSave) return;
    setEditValue(rawValue != null ? String(rawValue) : "");
    setIsEditing(true);
  }, [onSave, rawValue]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
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
      let saveValue: string | number | null = editValue.trim() || null;
      if (saveValue !== null) {
        const num = parseFloat(saveValue as string);
        if (isNaN(num)) {
          cancel();
          return;
        }
        saveValue = num;
      }
      const ok = await onSave(field, saveValue);
      if (ok) setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editValue, field, cancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        save();
      } else if (e.key === "Escape") {
        cancel();
      }
    },
    [save, cancel]
  );

  if (isEditing) {
    return (
      <div className="min-w-[120px] flex-1">
        <div className="mb-1 text-xs text-[#8B8B8B] font-sans">{label}</div>
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="number"
            step={type === "percent" ? "0.1" : "0.01"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8 w-full rounded border border-[#E5E5E7] bg-white px-2 text-lg font-semibold text-[#1A1A1A] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] num"
          />
          {isSaving ? (
            <Loader2 size={14} className="shrink-0 animate-spin text-[#3B82F6]" />
          ) : (
            <>
              <button
                onClick={save}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-[#22A861] text-white hover:bg-[#1a8f50]"
              >
                <Check size={12} />
              </button>
              <button
                onClick={cancel}
                className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border-none bg-[#E5E5E7] text-[#6B6B6B] hover:bg-[#D0D0D2]"
              >
                <X size={12} />
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
        "group min-w-[120px] flex-1",
        onSave && "cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-[#F7F7F8] transition-colors"
      )}
      onClick={onSave ? startEditing : undefined}
    >
      <div className="mb-1 flex items-center gap-1 text-xs text-[#8B8B8B] font-sans">
        {label}
        {onSave && (
          <Pencil
            size={10}
            className="text-[#8B8B8B] opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </div>
      <div className="text-xl font-semibold text-[#1A1A1A] num">
        {value}
      </div>
    </div>
  );
}

/* ── Editable Notes Block ── */

interface EditableNotesProps {
  label?: string;
  field: string;
  value?: string | null;
  isInternal?: boolean;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

export function EditableNotes({
  label,
  field,
  value,
  isInternal,
  onSave,
}: EditableNotesProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const startEditing = useCallback(() => {
    if (!onSave) return;
    setEditValue(value ?? "");
    setIsEditing(true);
  }, [onSave, value]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
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
      const ok = await onSave(field, editValue.trim() || null);
      if (ok) setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  }, [onSave, editValue, field]);

  if (isEditing) {
    return (
      <div
        className={cn(
          isInternal && "rounded-lg p-3",
        )}
        style={
          isInternal
            ? { background: "#E5930E08", border: "1px solid #E5930E20" }
            : undefined
        }
      >
        {isInternal && (
          <div className="mb-1 text-[11px] font-semibold text-[#E5930E] font-sans">
            INTERNAL ONLY
          </div>
        )}
        {label && !isInternal && (
          <div className="mb-1 text-xs text-[#8B8B8B] font-sans">{label}</div>
        )}
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          rows={4}
          className="w-full rounded border border-[#E5E5E7] bg-white px-3 py-2 text-[13px] leading-relaxed text-[#1A1A1A] outline-none focus:border-[#3B82F6] focus:ring-1 focus:ring-[#3B82F6] font-sans"
          onKeyDown={(e) => {
            if (e.key === "Escape") cancel();
          }}
        />
        <div className="mt-1.5 flex gap-1">
          {isSaving ? (
            <Loader2 size={14} className="animate-spin text-[#3B82F6]" />
          ) : (
            <>
              <button
                onClick={save}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border-none bg-[#1A1A1A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#333] font-sans"
              >
                <Check size={12} />
                Save
              </button>
              <button
                onClick={cancel}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-[#E5E5E7] bg-transparent px-3 py-1.5 text-xs font-medium text-[#1A1A1A] hover:bg-[#F7F7F8] font-sans"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!value && !onSave) return null;

  if (isInternal) {
    return (
      <div
        className={cn(
          "group rounded-lg p-3 transition-colors",
          onSave && "cursor-pointer hover:brightness-95"
        )}
        style={{
          background: "#E5930E08",
          border: "1px solid #E5930E20",
        }}
        onClick={onSave ? startEditing : undefined}
      >
        <div className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#E5930E] font-sans">
          INTERNAL ONLY
          {onSave && (
            <Pencil
              size={10}
              className="text-[#E5930E] opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </div>
        <div className="text-[13px] leading-relaxed text-[#1A1A1A] font-sans">
          {value || "\u2014"}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group transition-colors",
        onSave && "cursor-pointer rounded-lg px-2 py-1 -mx-2 -my-1 hover:bg-[#F7F7F8]"
      )}
      onClick={onSave ? startEditing : undefined}
    >
      {label && (
        <div className="mb-1 flex items-center gap-1 text-xs text-[#8B8B8B] font-sans">
          {label}
          {onSave && (
            <Pencil
              size={10}
              className="text-[#8B8B8B] opacity-0 transition-opacity group-hover:opacity-100"
            />
          )}
        </div>
      )}
      <div className="text-[13px] leading-relaxed text-[#1A1A1A] font-sans">
        {value || "\u2014"}
      </div>
    </div>
  );
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
    // Format date for input (YYYY-MM-DD)
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
      <div className="flex items-center justify-between border-b border-[#3B82F6] py-1">
        <span className="text-xs text-[#8B8B8B] font-sans">{label}</span>
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
            className="h-6 rounded border border-[#E5E5E7] bg-white px-1.5 text-xs num text-[#1A1A1A] outline-none focus:border-[#3B82F6]"
          />
          {isSaving ? (
            <Loader2 size={12} className="animate-spin text-[#3B82F6]" />
          ) : (
            <>
              <button
                onClick={save}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border-none bg-[#22A861] text-white hover:bg-[#1a8f50]"
              >
                <Check size={10} />
              </button>
              <button
                onClick={cancel}
                className="flex h-4 w-4 cursor-pointer items-center justify-center rounded border-none bg-[#E5E5E7] text-[#6B6B6B] hover:bg-[#D0D0D2]"
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
        "group flex justify-between border-b border-[#F0F0F2] py-1.5 transition-colors",
        onSave && "cursor-pointer hover:bg-[#F7F7F8] rounded-sm px-1 -mx-1"
      )}
      onClick={onSave ? startEditing : undefined}
    >
      <span className="text-xs text-[#8B8B8B] font-sans">{label}</span>
      <span className="flex items-center gap-1">
        <span
          className="text-xs num"
          style={{ color: value ? "#1A1A1A" : "#8B8B8B" }}
        >
          {displayValue ?? "\u2014"}
        </span>
        {onSave && (
          <Pencil
            size={9}
            className="shrink-0 text-[#8B8B8B] opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </span>
    </div>
  );
}
