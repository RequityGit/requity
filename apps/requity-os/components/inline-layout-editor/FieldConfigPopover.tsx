"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X, ChevronUp, ChevronDown, Pencil, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { updateFieldConfig } from "@/app/(authenticated)/control-center/object-manager/actions";
import { createClient } from "@/lib/supabase/client";

const FIELD_TYPES = [
  { key: "text", label: "Text" },
  { key: "textarea", label: "Long Text" },
  { key: "number", label: "Number" },
  { key: "currency", label: "Currency" },
  { key: "percentage", label: "Percentage" },
  { key: "date", label: "Date" },
  { key: "datetime", label: "Date & Time" },
  { key: "dropdown", label: "Dropdown" },
  { key: "boolean", label: "Toggle" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "url", label: "URL" },
  { key: "address", label: "Address" },
] as const;

interface FieldConfigData {
  id: string;
  field_label: string;
  field_type: string;
  dropdown_options: string[] | null;
  help_text: string | null;
}

// Cache field config data per session
const fieldConfigCache = new Map<string, FieldConfigData>();

interface FieldConfigPopoverProps {
  /** The field_config_id (from page_layout_fields.field_config_id) */
  fieldConfigId: string | null;
  fieldKey: string;
  fieldLabel: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Dropdown Option Row - supports inline editing, reorder, delete
// ---------------------------------------------------------------------------
function DropdownOptionRow({
  value,
  index,
  total,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  value: string;
  index: number;
  total: number;
  onUpdate: (index: number, newValue: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function commitEdit() {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== value) {
      onUpdate(index, trimmed);
    } else {
      setEditValue(value);
    }
    setEditing(false);
  }

  return (
    <div className="group/option flex items-center gap-0.5 rounded hover:bg-muted/50 transition-colors">
      {/* Reorder arrows */}
      <div className="flex flex-col">
        <button
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="flex items-center justify-center h-3 w-4 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer border-0 bg-transparent transition-colors"
        >
          <ChevronUp className="h-2.5 w-2.5" />
        </button>
        <button
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          className="flex items-center justify-center h-3 w-4 text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:cursor-not-allowed cursor-pointer border-0 bg-transparent transition-colors"
        >
          <ChevronDown className="h-2.5 w-2.5" />
        </button>
      </div>

      {/* Value display / edit */}
      {editing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitEdit();
            if (e.key === "Escape") { setEditValue(value); setEditing(false); }
          }}
          className="h-6 text-xs flex-1 px-1.5"
        />
      ) : (
        <span
          className="flex-1 text-xs px-1.5 py-1 truncate cursor-pointer hover:underline"
          onDoubleClick={() => setEditing(true)}
          title="Double-click to edit"
        >
          {value}
        </span>
      )}

      {/* Edit / Confirm */}
      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover/option:opacity-100 transition-all cursor-pointer border-0 bg-transparent"
          title="Edit option"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      ) : (
        <button
          onClick={commitEdit}
          className="flex items-center justify-center h-5 w-5 rounded text-primary hover:text-primary/80 transition-colors cursor-pointer border-0 bg-transparent"
          title="Confirm edit"
        >
          <Check className="h-2.5 w-2.5" />
        </button>
      )}

      {/* Remove */}
      <button
        onClick={() => onRemove(index)}
        className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover/option:opacity-100 transition-all cursor-pointer border-0 bg-transparent"
        title="Remove option"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FieldConfigPopover
// ---------------------------------------------------------------------------
export function FieldConfigPopover({
  fieldConfigId,
  fieldKey,
  fieldLabel,
  children,
}: FieldConfigPopoverProps) {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<FieldConfigData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saving, startSave] = useTransition();

  // Local edit state
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");
  const [helpText, setHelpText] = useState("");

  const fetchConfig = useCallback(async () => {
    if (!fieldConfigId) return;

    const cached = fieldConfigCache.get(fieldConfigId);
    if (cached) {
      setConfig(cached);
      setLabel(cached.field_label);
      setFieldType(cached.field_type);
      setDropdownOptions(cached.dropdown_options ?? []);
      setHelpText(cached.help_text ?? "");
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("field_configurations")
        .select("id, field_label, field_type, dropdown_options, help_text")
        .eq("id", fieldConfigId)
        .single();

      if (error) {
        console.error("[FieldConfigPopover] fetch error:", error.message, "fieldConfigId:", fieldConfigId);
        setFetchError(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        const cfg = data as FieldConfigData;
        fieldConfigCache.set(fieldConfigId, cfg);
        setConfig(cfg);
        setLabel(cfg.field_label);
        setFieldType(cfg.field_type);
        setDropdownOptions(cfg.dropdown_options ?? []);
        setHelpText(cfg.help_text ?? "");
      } else {
        console.warn("[FieldConfigPopover] No data returned for fieldConfigId:", fieldConfigId);
      }
    } catch (err) {
      console.error("[FieldConfigPopover] unexpected error:", err);
    }
    setLoading(false);
  }, [fieldConfigId]);

  useEffect(() => {
    if (open) {
      // Reset error on each open; refetch if no config cached
      setFetchError(null);
      if (!config) {
        fetchConfig();
      }
    }
  }, [open, config, fetchConfig]);

  // Re-sync local state when config changes (e.g. after refetch)
  useEffect(() => {
    if (open && config) {
      setLabel(config.field_label);
      setFieldType(config.field_type);
      setDropdownOptions(config.dropdown_options ?? []);
      setHelpText(config.help_text ?? "");
    }
  }, [open, config]);

  function handleSave() {
    if (!fieldConfigId || !label.trim()) return;

    startSave(async () => {
      const updates: Record<string, unknown> = {
        field_label: label.trim(),
        field_type: fieldType,
        help_text: helpText.trim() || null,
      };
      if (fieldType === "dropdown") {
        updates.dropdown_options = dropdownOptions.filter((o) => o.trim());
      }

      const result = await updateFieldConfig(fieldConfigId, updates);
      if (result.error) {
        toast.error(`Failed to update field: ${result.error}`);
      } else {
        // Update cache
        const updated: FieldConfigData = {
          ...(config ?? { id: fieldConfigId }),
          field_label: label.trim(),
          field_type: fieldType,
          dropdown_options: fieldType === "dropdown" ? dropdownOptions.filter(o => o.trim()) : (config?.dropdown_options ?? null),
          help_text: helpText.trim() || null,
        };
        fieldConfigCache.set(fieldConfigId, updated);
        setConfig(updated);
        setOpen(false);
        toast.success("Field updated. Changes apply across all layouts.");
      }
    });
  }

  // Dropdown option management
  function addOption() {
    if (!newOption.trim()) return;
    if (dropdownOptions.includes(newOption.trim())) {
      toast.error("This option already exists");
      return;
    }
    setDropdownOptions((prev) => [...prev, newOption.trim()]);
    setNewOption("");
  }

  function removeOption(index: number) {
    setDropdownOptions((prev) => prev.filter((_, i) => i !== index));
  }

  function updateOption(index: number, newValue: string) {
    setDropdownOptions((prev) => prev.map((o, i) => (i === index ? newValue : o)));
  }

  function moveOptionUp(index: number) {
    if (index === 0) return;
    setDropdownOptions((prev) => {
      const next = [...prev];
      const tmp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }

  function moveOptionDown(index: number) {
    setDropdownOptions((prev) => {
      if (index >= prev.length - 1) return prev;
      const next = [...prev];
      const tmp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = tmp;
      return next;
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="start" side="bottom">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : !config ? (
          <div className="text-xs text-muted-foreground text-center py-4 space-y-1">
            <div>Field configuration not found</div>
            {fetchError && (
              <div className="text-[10px] text-destructive/70 font-mono px-2">{fetchError}</div>
            )}
            <div className="text-[10px] text-muted-foreground/50 font-mono">ID: {fieldConfigId}</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Field Config
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {fieldKey}
              </span>
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Label
              </label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-8 text-xs"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Type
              </label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.key} value={t.key} className="text-xs">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {fieldType === "dropdown" && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-medium text-muted-foreground">
                    Dropdown Options
                  </label>
                  <span className="text-[9px] text-muted-foreground/60">
                    {dropdownOptions.length} option{dropdownOptions.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="space-y-0.5 max-h-48 overflow-y-auto rounded border border-border/50 p-1">
                  {dropdownOptions.length === 0 ? (
                    <div className="text-[10px] text-muted-foreground/50 text-center py-3">
                      No options yet. Add one below.
                    </div>
                  ) : (
                    dropdownOptions.map((opt, idx) => (
                      <DropdownOptionRow
                        key={`${idx}-${opt}`}
                        value={opt}
                        index={idx}
                        total={dropdownOptions.length}
                        onUpdate={updateOption}
                        onRemove={removeOption}
                        onMoveUp={moveOptionUp}
                        onMoveDown={moveOptionDown}
                      />
                    ))
                  )}
                </div>
                <div className="flex items-center gap-1 mt-1.5">
                  <Input
                    value={newOption}
                    onChange={(e) => setNewOption(e.target.value)}
                    placeholder="Add option..."
                    className="h-7 text-xs flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOption();
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={addOption}
                    disabled={!newOption.trim()}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                Help Text
              </label>
              <Input
                value={helpText}
                onChange={(e) => setHelpText(e.target.value)}
                className="h-8 text-xs"
                placeholder="Optional tooltip text"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[10px]"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="h-7 text-[10px]"
                onClick={handleSave}
                disabled={saving || !label.trim()}
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
              </Button>
            </div>

            <p className="text-[9px] text-muted-foreground/60 leading-tight">
              Changes to field properties apply globally across all page layouts.
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
