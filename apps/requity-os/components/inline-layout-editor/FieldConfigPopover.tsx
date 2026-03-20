"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Plus,
  X,
  ChevronUp,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  Archive,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  updateFieldConfig,
  archiveField,
  deleteFieldPermanently,
} from "@/app/(authenticated)/control-center/object-manager/actions";
import { createClient } from "@/lib/supabase/client";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
  { key: "formula", label: "Formula" },
] as const;

const CONFIGURABLE_ROLES = ["admin", "investor", "borrower"] as const;

const PIPELINE_STAGES = [
  "new_lead",
  "pre_qualification",
  "underwriting",
  "processing",
  "approved",
  "closing",
  "funded",
  "dead",
] as const;

type ConfigTab = "general" | "validation" | "access" | "conditions" | "formula";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FieldConfigData {
  id: string;
  field_label: string;
  field_type: string;
  module: string;
  dropdown_options: string[] | null;
  help_text: string | null;
  default_value: string | null;
  is_required: boolean;
  is_read_only: boolean;
  is_archived: boolean;
  is_admin_created: boolean;
  validation_regex: string | null;
  validation_message: string | null;
  required_at_stage: string | null;
  blocks_stage_progression: boolean;
  permissions: Record<string, { view?: boolean; edit?: boolean }> | null;
  visibility_condition: { asset_class?: string[]; loan_type?: string[] } | null;
  conditional_rules: Array<{
    action: string;
    source_field: string;
    operator: string;
    value: string;
  }> | null;
  formula_expression: string | null;
  formula_source_fields: string[] | null;
  formula_output_format: string | null;
  formula_decimal_places: number;
}

const fieldConfigCache = new Map<string, FieldConfigData>();

interface FieldConfigPopoverProps {
  fieldConfigId: string | null;
  fieldKey: string;
  fieldLabel: string;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Dropdown Option Row (reused from before)
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
      {!editing ? (
        <button
          onClick={() => setEditing(true)}
          className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover/option:opacity-100 transition-all cursor-pointer border-0 bg-transparent"
        >
          <Pencil className="h-2.5 w-2.5" />
        </button>
      ) : (
        <button
          onClick={commitEdit}
          className="flex items-center justify-center h-5 w-5 rounded text-primary hover:text-primary/80 transition-colors cursor-pointer border-0 bg-transparent"
        >
          <Check className="h-2.5 w-2.5" />
        </button>
      )}
      <button
        onClick={() => onRemove(index)}
        className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-destructive opacity-0 group-hover/option:opacity-100 transition-all cursor-pointer border-0 bg-transparent"
      >
        <X className="h-2.5 w-2.5" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Conditional Rule Row
// ---------------------------------------------------------------------------
function ConditionalRuleRow({
  rule,
  index,
  onUpdate,
  onRemove,
}: {
  rule: { action: string; source_field: string; operator: string; value: string };
  index: number;
  onUpdate: (index: number, updated: typeof rule) => void;
  onRemove: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Select
        value={rule.action}
        onValueChange={(v) => onUpdate(index, { ...rule, action: v })}
      >
        <SelectTrigger className="h-7 text-[10px] w-[70px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="show" className="text-xs">Show</SelectItem>
          <SelectItem value="hide" className="text-xs">Hide</SelectItem>
        </SelectContent>
      </Select>
      <span className="text-muted-foreground text-[10px]">when</span>
      <Input
        value={rule.source_field}
        onChange={(e) => onUpdate(index, { ...rule, source_field: e.target.value })}
        className="h-7 text-[10px] w-[90px] font-mono"
        placeholder="field_key"
      />
      <Select
        value={rule.operator}
        onValueChange={(v) => onUpdate(index, { ...rule, operator: v })}
      >
        <SelectTrigger className="h-7 text-[10px] w-[90px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="equals" className="text-xs">equals</SelectItem>
          <SelectItem value="not_equals" className="text-xs">not equals</SelectItem>
          <SelectItem value="contains" className="text-xs">contains</SelectItem>
          <SelectItem value="is_empty" className="text-xs">is empty</SelectItem>
          <SelectItem value="is_not_empty" className="text-xs">not empty</SelectItem>
          <SelectItem value="greater_than" className="text-xs">greater than</SelectItem>
          <SelectItem value="less_than" className="text-xs">less than</SelectItem>
        </SelectContent>
      </Select>
      {rule.operator !== "is_empty" && rule.operator !== "is_not_empty" && (
        <Input
          value={rule.value}
          onChange={(e) => onUpdate(index, { ...rule, value: e.target.value })}
          className="h-7 text-[10px] flex-1"
          placeholder="value"
        />
      )}
      <button
        onClick={() => onRemove(index)}
        className="flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer border-0 bg-transparent shrink-0"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main FieldConfigPopover (now a Dialog)
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
  const [activeTab, setActiveTab] = useState<ConfigTab>("general");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // --- Local edit state ---
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("");
  const [helpText, setHelpText] = useState("");
  const [defaultValue, setDefaultValue] = useState("");
  const [dropdownOptions, setDropdownOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState("");

  // Validation
  const [isRequired, setIsRequired] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [validationRegex, setValidationRegex] = useState("");
  const [validationMessage, setValidationMessage] = useState("");
  const [requiredAtStage, setRequiredAtStage] = useState("");
  const [blocksStageProgression, setBlocksStageProgression] = useState(false);

  // Permissions
  const [permissions, setPermissions] = useState<Record<string, { view?: boolean; edit?: boolean }>>({});

  // Conditions
  const [visibilityCondition, setVisibilityCondition] = useState<{ asset_class?: string[]; loan_type?: string[] } | null>(null);
  const [conditionalRules, setConditionalRules] = useState<Array<{ action: string; source_field: string; operator: string; value: string }>>([]);
  const [newAssetClass, setNewAssetClass] = useState("");
  const [newLoanType, setNewLoanType] = useState("");

  // Formula
  const [formulaExpression, setFormulaExpression] = useState("");
  const [formulaSourceFields, setFormulaSourceFields] = useState("");
  const [formulaOutputFormat, setFormulaOutputFormat] = useState("");
  const [formulaDecimalPlaces, setFormulaDecimalPlaces] = useState(2);

  // --- Fetch config ---
  const fetchConfig = useCallback(async () => {
    if (!fieldConfigId) return;

    const cached = fieldConfigCache.get(fieldConfigId);
    if (cached) {
      applyConfig(cached);
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("field_configurations")
        .select("id, field_label, field_type, module, dropdown_options, help_text, default_value, is_required, is_read_only, is_archived, is_admin_created, validation_regex, validation_message, required_at_stage, blocks_stage_progression, permissions, visibility_condition, conditional_rules, formula_expression, formula_source_fields, formula_output_format, formula_decimal_places")
        .eq("id", fieldConfigId)
        .single();

      if (error) {
        console.error("[FieldConfigPopover] fetch error:", error.message);
        setFetchError(error.message);
        setLoading(false);
        return;
      }
      if (data) {
        const cfg = data as unknown as FieldConfigData;
        fieldConfigCache.set(fieldConfigId, cfg);
        applyConfig(cfg);
      }
    } catch (err) {
      console.error("[FieldConfigPopover] unexpected error:", err);
    }
    setLoading(false);
  }, [fieldConfigId]);

  function applyConfig(cfg: FieldConfigData) {
    setConfig(cfg);
    setLabel(cfg.field_label);
    setFieldType(cfg.field_type);
    setHelpText(cfg.help_text ?? "");
    setDefaultValue(cfg.default_value ?? "");
    setDropdownOptions(cfg.dropdown_options ?? []);
    setIsRequired(cfg.is_required ?? false);
    setIsReadOnly(cfg.is_read_only ?? false);
    setValidationRegex(cfg.validation_regex ?? "");
    setValidationMessage(cfg.validation_message ?? "");
    setRequiredAtStage(cfg.required_at_stage ?? "");
    setBlocksStageProgression(cfg.blocks_stage_progression ?? false);
    setPermissions(cfg.permissions ?? {});
    setVisibilityCondition(cfg.visibility_condition ?? null);
    setConditionalRules((cfg.conditional_rules ?? []) as Array<{ action: string; source_field: string; operator: string; value: string }>);
    setFormulaExpression(cfg.formula_expression ?? "");
    setFormulaSourceFields((cfg.formula_source_fields ?? []).join(", "));
    setFormulaOutputFormat(cfg.formula_output_format ?? "");
    setFormulaDecimalPlaces(cfg.formula_decimal_places ?? 2);
  }

  useEffect(() => {
    if (open) {
      setFetchError(null);
      setActiveTab("general");
      setShowDeleteConfirm(false);
      // Always refetch on open to get fresh data
      fieldConfigCache.delete(fieldConfigId ?? "");
      fetchConfig();
    }
  }, [open, fetchConfig, fieldConfigId]);

  // --- Save all changes ---
  function handleSave() {
    if (!fieldConfigId || !label.trim()) return;

    startSave(async () => {
      const updates: Record<string, unknown> = {
        field_label: label.trim(),
        field_type: fieldType,
        help_text: helpText.trim() || null,
        default_value: defaultValue.trim() || null,
        is_required: isRequired,
        is_read_only: isReadOnly,
        validation_regex: validationRegex.trim() || null,
        validation_message: validationMessage.trim() || null,
        required_at_stage: requiredAtStage || null,
        blocks_stage_progression: blocksStageProgression,
        permissions: Object.keys(permissions).length > 0 ? permissions : null,
        visibility_condition: visibilityCondition,
        conditional_rules: conditionalRules.length > 0 ? conditionalRules : [],
      };

      if (fieldType === "dropdown") {
        updates.dropdown_options = dropdownOptions.filter((o) => o.trim());
      }

      if (fieldType === "formula") {
        updates.formula_expression = formulaExpression.trim() || null;
        updates.formula_source_fields = formulaSourceFields
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        updates.formula_output_format = formulaOutputFormat || null;
        updates.formula_decimal_places = formulaDecimalPlaces;
      }

      const result = await updateFieldConfig(fieldConfigId, updates);
      if (result.error) {
        toast.error(`Failed to update field: ${result.error}`);
      } else {
        const updated: FieldConfigData = {
          ...(config ?? ({ id: fieldConfigId } as FieldConfigData)),
          field_label: label.trim(),
          field_type: fieldType,
          help_text: helpText.trim() || null,
          default_value: defaultValue.trim() || null,
          dropdown_options: fieldType === "dropdown" ? dropdownOptions.filter((o) => o.trim()) : (config?.dropdown_options ?? null),
          is_required: isRequired,
          is_read_only: isReadOnly,
          validation_regex: validationRegex.trim() || null,
          validation_message: validationMessage.trim() || null,
          required_at_stage: requiredAtStage || null,
          blocks_stage_progression: blocksStageProgression,
          permissions: Object.keys(permissions).length > 0 ? permissions : null,
          visibility_condition: visibilityCondition,
          conditional_rules: conditionalRules.length > 0 ? conditionalRules : null,
          formula_expression: formulaExpression.trim() || null,
          formula_source_fields: formulaSourceFields.split(",").map((s) => s.trim()).filter(Boolean),
          formula_output_format: formulaOutputFormat || null,
          formula_decimal_places: formulaDecimalPlaces,
        };
        fieldConfigCache.set(fieldConfigId, updated);
        setConfig(updated);
        setOpen(false);
        toast.success("Field updated. Changes apply across all layouts.");
      }
    });
  }

  // --- Archive ---
  function handleArchive() {
    if (!fieldConfigId) return;
    startSave(async () => {
      const result = await archiveField(fieldConfigId);
      if (result.error) {
        toast.error(`Failed to archive: ${result.error}`);
      } else {
        fieldConfigCache.delete(fieldConfigId);
        toast.success("Field archived.");
        setOpen(false);
        window.dispatchEvent(new CustomEvent("inline-editor:field-created")); // triggers picker cache invalidation
      }
    });
  }

  // --- Permanent delete ---
  function handleDelete() {
    if (!fieldConfigId) return;
    startSave(async () => {
      const result = await deleteFieldPermanently(fieldConfigId);
      if (result.error) {
        toast.error(`Failed to delete: ${result.error}`);
      } else {
        fieldConfigCache.delete(fieldConfigId);
        toast.success("Field permanently deleted.");
        setOpen(false);
        window.dispatchEvent(new CustomEvent("inline-editor:field-created"));
      }
    });
  }

  // --- Dropdown helpers ---
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
    setDropdownOptions((prev) => { const n = [...prev]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; return n; });
  }
  function moveOptionDown(index: number) {
    setDropdownOptions((prev) => { if (index >= prev.length - 1) return prev; const n = [...prev]; [n[index + 1], n[index]] = [n[index], n[index + 1]]; return n; });
  }

  // --- Permission helpers ---
  function setPermission(role: string, perm: "view" | "edit", value: boolean) {
    setPermissions((prev) => ({
      ...prev,
      [role]: { ...prev[role], [perm]: value },
    }));
  }

  // --- Visibility condition helpers ---
  function addAssetClass() {
    if (!newAssetClass.trim()) return;
    setVisibilityCondition((prev) => ({
      ...prev,
      asset_class: [...(prev?.asset_class ?? []), newAssetClass.trim()],
    }));
    setNewAssetClass("");
  }
  function removeAssetClass(idx: number) {
    setVisibilityCondition((prev) => {
      const updated = (prev?.asset_class ?? []).filter((_, i) => i !== idx);
      return { ...prev, asset_class: updated.length > 0 ? updated : undefined };
    });
  }
  function addLoanType() {
    if (!newLoanType.trim()) return;
    setVisibilityCondition((prev) => ({
      ...prev,
      loan_type: [...(prev?.loan_type ?? []), newLoanType.trim()],
    }));
    setNewLoanType("");
  }
  function removeLoanType(idx: number) {
    setVisibilityCondition((prev) => {
      const updated = (prev?.loan_type ?? []).filter((_, i) => i !== idx);
      return { ...prev, loan_type: updated.length > 0 ? updated : undefined };
    });
  }

  // --- Conditional rule helpers ---
  function addConditionalRule() {
    setConditionalRules((prev) => [
      ...prev,
      { action: "show", source_field: "", operator: "equals", value: "" },
    ]);
  }
  function updateConditionalRule(index: number, updated: { action: string; source_field: string; operator: string; value: string }) {
    setConditionalRules((prev) => prev.map((r, i) => (i === index ? updated : r)));
  }
  function removeConditionalRule(index: number) {
    setConditionalRules((prev) => prev.filter((_, i) => i !== index));
  }

  // --- Tab definitions ---
  const tabs: { key: ConfigTab; label: string; show: boolean }[] = [
    { key: "general", label: "General", show: true },
    { key: "validation", label: "Validation", show: true },
    { key: "access", label: "Access", show: true },
    { key: "conditions", label: "Conditions", show: true },
    { key: "formula", label: "Formula", show: fieldType === "formula" },
  ];

  const isUwModule = config?.module?.startsWith("uw_");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[560px] max-h-[85vh] flex flex-col p-0 gap-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !config ? (
          <div className="text-xs text-muted-foreground text-center py-12 space-y-1">
            <div>Field configuration not found</div>
            {fetchError && <div className="text-[10px] text-destructive/70 font-mono px-2">{fetchError}</div>}
            <div className="text-[10px] text-muted-foreground/50 font-mono">ID: {fieldConfigId}</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <DialogHeader className="px-5 pt-5 pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-sm font-semibold">{config.field_label}</DialogTitle>
                  <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {fieldKey} &middot; {config.module}
                  </div>
                </div>
              </div>
            </DialogHeader>

            {/* Tab navigation */}
            <div className="flex border-b px-5 gap-1">
              {tabs.filter((t) => t.show).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-3 py-2 text-xs font-medium transition-colors border-b-2 cursor-pointer bg-transparent border-x-0 border-t-0",
                    activeTab === tab.key
                      ? "text-foreground border-primary"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {/* ── GENERAL TAB ── */}
              {activeTab === "general" && (
                <>
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Label</label>
                    <Input value={label} onChange={(e) => setLabel(e.target.value)} className="h-8 text-xs" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Type</label>
                      <Select value={fieldType} onValueChange={setFieldType}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {FIELD_TYPES.map((t) => (
                            <SelectItem key={t.key} value={t.key} className="text-xs">{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Default Value</label>
                      <Input value={defaultValue} onChange={(e) => setDefaultValue(e.target.value)} className="h-8 text-xs" placeholder="None" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Help Text</label>
                    <Input value={helpText} onChange={(e) => setHelpText(e.target.value)} className="h-8 text-xs" placeholder="Optional tooltip text" />
                  </div>

                  {/* Dropdown options */}
                  {fieldType === "dropdown" && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-medium text-muted-foreground">Dropdown Options</label>
                        <span className="text-[9px] text-muted-foreground/60">
                          {dropdownOptions.length} option{dropdownOptions.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="space-y-0.5 max-h-48 overflow-y-auto rounded border border-border/50 p-1">
                        {dropdownOptions.length === 0 ? (
                          <div className="text-[10px] text-muted-foreground/50 text-center py-3">No options yet</div>
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
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addOption(); } }}
                        />
                        <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={addOption} disabled={!newOption.trim()}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── VALIDATION TAB ── */}
              {activeTab === "validation" && (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium">Required</div>
                      <div className="text-[10px] text-muted-foreground">Field must have a value</div>
                    </div>
                    <Switch checked={isRequired} onCheckedChange={setIsRequired} />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium">Read Only</div>
                      <div className="text-[10px] text-muted-foreground">Non-admin users cannot edit</div>
                    </div>
                    <Switch checked={isReadOnly} onCheckedChange={setIsReadOnly} />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Validation Regex</label>
                    <Input
                      value={validationRegex}
                      onChange={(e) => setValidationRegex(e.target.value)}
                      className="h-8 text-xs font-mono"
                      placeholder="^[A-Z]{2}[0-9]{4}$"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Validation Error Message</label>
                    <Input
                      value={validationMessage}
                      onChange={(e) => setValidationMessage(e.target.value)}
                      className="h-8 text-xs"
                      placeholder="Must match format XX0000"
                    />
                  </div>

                  <div className="border-t pt-3 mt-3">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Stage Gating</div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Required at Stage</label>
                      <Select value={requiredAtStage} onValueChange={setRequiredAtStage}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="No stage requirement" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-xs">No stage requirement</SelectItem>
                          {PIPELINE_STAGES.map((s) => (
                            <SelectItem key={s} value={s} className="text-xs">
                              {s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {requiredAtStage && (
                      <div className="flex items-center justify-between mt-2">
                        <div>
                          <div className="text-xs font-medium">Blocks Progression</div>
                          <div className="text-[10px] text-muted-foreground">Prevents advancing past this stage without a value</div>
                        </div>
                        <Switch checked={blocksStageProgression} onCheckedChange={setBlocksStageProgression} />
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── ACCESS TAB ── */}
              {activeTab === "access" && (
                <>
                  <p className="text-[10px] text-muted-foreground">
                    Configure which roles can view or edit this field. Super admins always have full access.
                  </p>
                  <div className="rounded border border-border overflow-hidden">
                    <div className="grid grid-cols-3 gap-0 bg-muted px-3 py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Role</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">View</span>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-center">Edit</span>
                    </div>
                    {CONFIGURABLE_ROLES.map((role) => {
                      const rolePerm = permissions[role] ?? { view: true, edit: true };
                      return (
                        <div key={role} className="grid grid-cols-3 gap-0 px-3 py-2 border-t border-border items-center">
                          <span className="text-xs font-medium capitalize">{role}</span>
                          <div className="flex justify-center">
                            <Switch
                              checked={rolePerm.view !== false}
                              onCheckedChange={(v) => setPermission(role, "view", v)}
                            />
                          </div>
                          <div className="flex justify-center">
                            <Switch
                              checked={rolePerm.edit !== false}
                              onCheckedChange={(v) => setPermission(role, "edit", v)}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* ── CONDITIONS TAB ── */}
              {activeTab === "conditions" && (
                <>
                  {/* Two-axis visibility (pipeline fields only) */}
                  {isUwModule && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                        Asset Class / Loan Type Visibility
                      </div>
                      <p className="text-[10px] text-muted-foreground mb-2">
                        If set, this field only appears for deals matching these values. Leave empty to show for all.
                      </p>

                      <div className="space-y-2">
                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Asset Classes</label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {(visibilityCondition?.asset_class ?? []).map((ac, idx) => (
                              <span key={ac} className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium border border-blue-500/30 text-blue-600 bg-blue-500/5">
                                {ac}
                                <button onClick={() => removeAssetClass(idx)} className="ml-0.5 cursor-pointer border-0 bg-transparent text-blue-400 hover:text-blue-700">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <Input
                              value={newAssetClass}
                              onChange={(e) => setNewAssetClass(e.target.value)}
                              placeholder="e.g. sfr, multifamily"
                              className="h-7 text-[10px] flex-1"
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addAssetClass(); } }}
                            />
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={addAssetClass} disabled={!newAssetClass.trim()}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Loan Types</label>
                          <div className="flex flex-wrap gap-1 mb-1">
                            {(visibilityCondition?.loan_type ?? []).map((lt, idx) => (
                              <span key={lt} className="inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium border border-green-500/30 text-green-600 bg-green-500/5">
                                {lt}
                                <button onClick={() => removeLoanType(idx)} className="ml-0.5 cursor-pointer border-0 bg-transparent text-green-400 hover:text-green-700">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <Input
                              value={newLoanType}
                              onChange={(e) => setNewLoanType(e.target.value)}
                              placeholder="e.g. bridge, construction"
                              className="h-7 text-[10px] flex-1"
                              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addLoanType(); } }}
                            />
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={addLoanType} disabled={!newLoanType.trim()}>
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Conditional rules (all field types) */}
                  <div className={isUwModule ? "border-t pt-3 mt-3" : ""}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Conditional Rules
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 text-[10px] gap-1"
                        onClick={addConditionalRule}
                      >
                        <Plus className="h-3 w-3" />
                        Add Rule
                      </Button>
                    </div>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      Show or hide this field based on the value of another field.
                    </p>
                    {conditionalRules.length === 0 ? (
                      <div className="text-[10px] text-muted-foreground/50 text-center py-3 border border-dashed border-border rounded">
                        No conditional rules. Field is always visible.
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {conditionalRules.map((rule, idx) => (
                          <ConditionalRuleRow
                            key={idx}
                            rule={rule}
                            index={idx}
                            onUpdate={updateConditionalRule}
                            onRemove={removeConditionalRule}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* ── FORMULA TAB ── */}
              {activeTab === "formula" && fieldType === "formula" && (
                <>
                  <p className="text-[10px] text-muted-foreground">
                    Define a formula using field references like <code className="text-[10px] bg-muted px-1 rounded">{"{field_key}"}</code>.
                  </p>

                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Expression</label>
                    <Textarea
                      value={formulaExpression}
                      onChange={(e) => setFormulaExpression(e.target.value)}
                      className="text-xs font-mono min-h-[80px]"
                      placeholder="{loan_amount} / {appraised_value} * 100"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground mb-1 block">
                      Source Fields <span className="font-normal">(comma separated field_keys this formula depends on)</span>
                    </label>
                    <Input
                      value={formulaSourceFields}
                      onChange={(e) => setFormulaSourceFields(e.target.value)}
                      className="h-8 text-xs font-mono"
                      placeholder="loan_amount, appraised_value"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Output Format</label>
                      <Select value={formulaOutputFormat} onValueChange={setFormulaOutputFormat}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Default" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="" className="text-xs">Default</SelectItem>
                          <SelectItem value="currency" className="text-xs">Currency</SelectItem>
                          <SelectItem value="percentage" className="text-xs">Percentage</SelectItem>
                          <SelectItem value="number" className="text-xs">Number</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Decimal Places</label>
                      <Input
                        type="number"
                        min={0}
                        max={10}
                        value={formulaDecimalPlaces}
                        onChange={(e) => setFormulaDecimalPlaces(parseInt(e.target.value) || 0)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="border-t px-5 py-3 flex items-center gap-2">
              {/* Archive / Delete */}
              {!showDeleteConfirm ? (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-amber-600"
                    onClick={handleArchive}
                    disabled={saving}
                    title="Archive field (soft delete, can be restored)"
                  >
                    <Archive className="h-3 w-3" />
                    Archive
                  </Button>
                  {config.is_admin_created && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={saving}
                      title="Permanently delete field"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-[10px] text-destructive font-medium">Permanently delete?</span>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={handleDelete}
                    disabled={saving}
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              )}

              <div className="flex-1" />

              <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="h-7 text-[10px]" onClick={handleSave} disabled={saving || !label.trim()}>
                {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
