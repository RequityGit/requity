"use client";

import { useState, useCallback } from "react";
import { format, parse } from "date-fns";
import { cn } from "@/lib/utils";
import { Pencil, Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const parsedDate = value
    ? parse(
        (() => {
          const d = new Date(value);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, "0");
          const dd = String(d.getDate()).padStart(2, "0");
          return `${yyyy}-${mm}-${dd}`;
        })(),
        "yyyy-MM-dd",
        new Date()
      )
    : undefined;

  const handleSelect = useCallback(
    async (selected: Date | undefined) => {
      if (!onSave) return;
      const iso = selected ? format(selected, "yyyy-MM-dd") : null;
      setIsSaving(true);
      try {
        const ok = await onSave(field, iso);
        if (ok) setOpen(false);
      } finally {
        setIsSaving(false);
      }
    },
    [onSave, field]
  );

  const row = (
    <div
      className={cn(
        "group flex justify-between py-1.5 transition-colors rounded-sm",
        onSave && "cursor-pointer px-1 -mx-1"
      )}
      style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}
    >
      <span className="text-xs" style={{ color: T.text.muted }}>{label}</span>
      <span className="flex items-center gap-1">
        {isSaving ? (
          <Loader2 size={12} className="animate-spin" color={T.accent.blue} />
        ) : (
          <>
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
          </>
        )}
      </span>
    </div>
  );

  if (!onSave) return row;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{row}</PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={handleSelect}
          defaultMonth={parsedDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
