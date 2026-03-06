"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  GripVertical,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TermSheetSectionDef } from "@/lib/term-sheet-fields";
import { SAMPLE_DATA } from "@/lib/term-sheet-fields";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Props {
  section: TermSheetSectionDef;
  /** Whether the whole section is visible on the term sheet */
  sectionVisible: boolean;
  onToggleSection: () => void;
  /** Current heading text */
  heading: string;
  onHeadingChange: (value: string) => void;
  /** Per-field visibility: { field_key: boolean } */
  fieldVisibility: Record<string, boolean>;
  onToggleField: (fieldKey: string) => void;
  /** Custom label overrides: { field_key: "Custom Label" } */
  fieldLabels: Record<string, string>;
  onFieldLabelChange: (fieldKey: string, label: string) => void;
  /** Custom text value (for sections that support it) */
  customText?: string;
  onCustomTextChange?: (value: string) => void;
  /** Reorder controls */
  index: number;
  totalSections: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function TermSheetSectionCard({
  section,
  sectionVisible,
  onToggleSection,
  heading,
  onHeadingChange,
  fieldVisibility,
  onToggleField,
  fieldLabels,
  onFieldLabelChange,
  customText,
  onCustomTextChange,
  index,
  totalSections,
  onMoveUp,
  onMoveDown,
}: Props) {
  const [expanded, setExpanded] = useState(false);

  const visibleFieldCount = section.fields.filter(
    (f) => fieldVisibility[f.key] !== false
  ).length;
  const totalFieldCount = section.fields.length;

  return (
    <div
      className={cn(
        "rounded-lg border transition-all",
        sectionVisible
          ? "bg-card border-border shadow-sm"
          : "bg-muted/40 border-border opacity-60"
      )}
    >
      {/* ----------------------------------------------------------------- */}
      {/* Header row — always visible                                       */}
      {/* ----------------------------------------------------------------- */}
      <div className="flex items-center gap-2 p-3">
        {/* Reorder buttons */}
        <div className="flex flex-col gap-0.5 shrink-0">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
            aria-label="Move up"
          >
            ▲
          </button>
          <GripVertical className="h-4 w-4 text-muted-foreground/40 mx-auto" />
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === totalSections - 1}
            className="text-muted-foreground hover:text-foreground disabled:opacity-30 text-xs leading-none"
            aria-label="Move down"
          >
            ▼
          </button>
        </div>

        {/* Section visibility toggle */}
        <button
          type="button"
          onClick={onToggleSection}
          className={cn(
            "shrink-0 rounded p-1.5 transition-colors",
            sectionVisible
              ? "text-emerald-600 hover:bg-emerald-50"
              : "text-muted-foreground hover:bg-muted"
          )}
          aria-label={sectionVisible ? "Hide section" : "Show section"}
        >
          {sectionVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>

        {/* Expand / collapse toggle */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>

        {/* Section label + description */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex-1 text-left min-w-0"
        >
          <span className="text-sm font-semibold text-foreground block truncate">
            {section.label}
          </span>
          <span className="text-xs text-muted-foreground block truncate">
            {section.description}
          </span>
        </button>

        {/* Field counter badge */}
        {totalFieldCount > 0 && (
          <span className="shrink-0 text-xs font-medium rounded-full px-2 py-0.5 bg-muted text-muted-foreground">
            {visibleFieldCount}/{totalFieldCount} fields
          </span>
        )}

        {/* Heading input (compact) */}
        <Input
          value={heading}
          onChange={(e) => onHeadingChange(e.target.value)}
          placeholder={section.label}
          className="w-48 h-8 text-sm shrink-0 hidden lg:block"
          title="Section heading on the term sheet"
        />
      </div>

      {/* Mobile heading input */}
      <div className="px-3 pb-2 lg:hidden">
        <Input
          value={heading}
          onChange={(e) => onHeadingChange(e.target.value)}
          placeholder={section.label}
          className="h-8 text-sm"
        />
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Expanded content — field list + preview                           */}
      {/* ----------------------------------------------------------------- */}
      {expanded && (
        <div className="border-t border-border">
          {/* Field list */}
          {section.fields.length > 0 && (
            <div className="p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                Fields in this section
              </p>
              {section.fields.map((field) => {
                const isVisible = fieldVisibility[field.key] !== false;
                const customLabel = fieldLabels[field.key] ?? "";

                return (
                  <div
                    key={field.key}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 transition-colors",
                      isVisible
                        ? "bg-card hover:bg-muted"
                        : "bg-muted/30 opacity-50"
                    )}
                  >
                    {/* Field toggle */}
                    <button
                      type="button"
                      onClick={() => onToggleField(field.key)}
                      className={cn(
                        "shrink-0 flex items-center justify-center w-5 h-5 rounded border transition-colors",
                        isVisible
                          ? "bg-primary border-primary text-white"
                          : "bg-background border-border text-transparent"
                      )}
                      aria-label={
                        isVisible ? `Hide ${field.label}` : `Show ${field.label}`
                      }
                    >
                      {isVisible && (
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </button>

                    {/* Field info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium text-foreground">
                          {field.label}
                        </span>
                        {field.format && field.format !== "text" && (
                          <span className="text-[10px] num px-1 py-0.5 rounded bg-muted text-muted-foreground">
                            {field.format}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {field.description}
                      </span>
                    </div>

                    {/* Custom label override */}
                    <Input
                      value={customLabel}
                      onChange={(e) =>
                        onFieldLabelChange(field.key, e.target.value)
                      }
                      placeholder={field.label}
                      className="w-40 h-7 text-xs shrink-0 hidden md:block"
                      title="Custom label (leave blank to use default)"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Custom text block */}
          {section.hasCustomText && onCustomTextChange && (
            <div className="p-3 border-t border-border">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
                Custom text for this section
              </Label>
              <Textarea
                value={customText ?? ""}
                onChange={(e) => onCustomTextChange(e.target.value)}
                rows={3}
                placeholder={`Add custom text that will appear in the ${section.label} section...`}
                className="text-sm"
              />
            </div>
          )}

          {/* Mini preview */}
          {section.fields.length > 0 && (
            <div className="p-3 border-t border-border bg-muted/50">
              <div className="flex items-center gap-1.5 mb-2">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Preview (sample data)
                </span>
              </div>
              <div className="bg-card rounded border border-border p-3 num text-xs space-y-1">
                <div className="font-bold text-foreground text-sm mb-2 border-b border-border pb-1">
                  {heading || section.label}
                </div>
                {section.fields
                  .filter((f) => fieldVisibility[f.key] !== false)
                  .map((field) => (
                    <div key={field.key} className="flex gap-2">
                      <span className="text-muted-foreground w-40 shrink-0 text-right">
                        {fieldLabels[field.key] || field.label}:
                      </span>
                      <span className="text-foreground font-medium">
                        {SAMPLE_DATA[field.key] ?? "—"}
                      </span>
                    </div>
                  ))}
                {section.fields.filter((f) => fieldVisibility[f.key] !== false)
                  .length === 0 && (
                  <span className="text-muted-foreground italic">
                    No fields visible
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
