"use client";

import React from "react";
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, X, Columns2, Square, Columns3, Columns4, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInlineLayout } from "./InlineLayoutContext";
import { FieldConfigPopover } from "./FieldConfigPopover";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface EditableFieldSlotProps {
  fieldId: string;
  fieldLabel: string;
  columnSpan: string;
  sectionId: string;
  fieldIndex: number;
  totalFields: number;
  fieldConfigId?: string | null;
  fieldKey?: string;
  children: React.ReactNode;
}

const SPAN_OPTIONS = [
  { value: "quarter", label: "1/4", icon: Columns4 },
  { value: "third", label: "1/3", icon: Columns3 },
  { value: "half", label: "1/2", icon: Columns2 },
  { value: "full", label: "Full", icon: Square },
] as const;

export function EditableFieldSlot({
  fieldId,
  fieldLabel,
  columnSpan,
  sectionId,
  fieldIndex,
  totalFields,
  fieldConfigId,
  fieldKey,
  children,
}: EditableFieldSlotProps) {
  const { state, removeField, updateFieldSpan, nudgeField, getNudgeAvailability } = useInlineLayout();
  const { canLeft, canRight } = getNudgeAvailability(sectionId, fieldId);

  if (!state.isEditing) {
    return <>{children}</>;
  }

  return (
    <div className="relative group/field">
      {/* Field overlay controls - top right */}
      <div className="absolute -top-2 right-1 z-10 flex items-center gap-0.5 opacity-0 group-hover/field:opacity-100 transition-opacity">
        {/* Move left */}
        <button
          onClick={() => nudgeField(fieldId, sectionId, "left")}
          disabled={!canLeft}
          className="flex items-center justify-center h-5 w-5 rounded bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
          title="Move field left"
        >
          <ArrowLeft className="h-2.5 w-2.5" />
        </button>
        {/* Move right */}
        <button
          onClick={() => nudgeField(fieldId, sectionId, "right")}
          disabled={!canRight}
          className="flex items-center justify-center h-5 w-5 rounded bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
          title="Move field right"
        >
          <ArrowRight className="h-2.5 w-2.5" />
        </button>
        {/* Move up */}
        <button
          onClick={() => nudgeField(fieldId, sectionId, "up")}
          disabled={fieldIndex === 0}
          className="flex items-center justify-center h-5 w-5 rounded bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
          title="Move field up"
        >
          <ArrowUp className="h-2.5 w-2.5" />
        </button>
        {/* Move down */}
        <button
          onClick={() => nudgeField(fieldId, sectionId, "down")}
          disabled={fieldIndex >= totalFields - 1}
          className="flex items-center justify-center h-5 w-5 rounded bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
          title="Move field down"
        >
          <ArrowDown className="h-2.5 w-2.5" />
        </button>

        {/* Span control */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center justify-center h-5 w-5 rounded bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer shadow-sm">
              <Columns2 className="h-2.5 w-2.5" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1" align="end">
            <div className="flex gap-0.5">
              {SPAN_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateFieldSpan(fieldId, opt.value)}
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded text-[10px] transition-colors cursor-pointer border-0",
                    columnSpan === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  title={opt.label}
                >
                  <opt.icon className="h-3 w-3" />
                  {opt.label}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Field config (gear icon) - always show if fieldKey exists */}
        {fieldKey ? (
          fieldConfigId ? (
            <FieldConfigPopover
              fieldConfigId={fieldConfigId}
              fieldKey={fieldKey}
              fieldLabel={fieldLabel}
            >
              <button
                className="flex items-center justify-center h-5 w-5 rounded bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 hover:border-primary/50 transition-colors cursor-pointer shadow-sm"
                title="Field settings (dropdown options, label, type)"
              >
                <Settings2 className="h-2.5 w-2.5" />
              </button>
            </FieldConfigPopover>
          ) : (
            <button
              className="flex items-center justify-center h-5 w-5 rounded bg-card border border-border text-muted-foreground/40 cursor-not-allowed shadow-sm"
              title="No field config linked"
              disabled
            >
              <Settings2 className="h-2.5 w-2.5" />
            </button>
          )
        ) : null}

        {/* Remove button */}
        <button
          onClick={() => removeField(fieldId)}
          className="flex items-center justify-center h-5 w-5 rounded bg-card border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer shadow-sm"
          title="Remove field"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Field content */}
      <div className={cn(
        "rounded-lg border border-transparent transition-colors",
        "hover:border-primary/20 hover:bg-primary/[0.02]"
      )}>
        {children}
      </div>
    </div>
  );
}
