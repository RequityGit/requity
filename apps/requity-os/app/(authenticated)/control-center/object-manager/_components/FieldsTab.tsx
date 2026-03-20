"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  GripVertical,
  Eye,
  Lock,
  MoreHorizontal,
  Calculator,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@repo/lib";
import type { FieldConfig } from "../actions";
import { createField, archiveField, updateFieldVisibilityCondition } from "../actions";
import { FIELD_TYPES, getFieldType } from "./constants";
import { AddFieldDialog } from "./AddFieldDialog";
import { ConditionBadge } from "./ConditionBadge";
import { ConditionEditorModal } from "./ConditionEditorModal";
import { hasCondition } from "@/lib/visibility-engine";
import type { VisibilityCondition } from "@/lib/visibility-engine";

// Module mapping
const OBJECT_MODULE_MAP: Record<string, string> = {
  contact: "contact_profile",
  company: "company_info",
  borrower_entity: "borrower_entity",
  property: "uw_property",
  loan: "loan_details",
  borrower: "borrower_profile",
  investor: "investor_profile",
  unified_deal: "uw_deal",
};

type VisFilter = "all" | "conditional" | "formula" | "always";

interface Props {
  fields: FieldConfig[];
  selectedFieldId: string | null;
  onSelectField: (field: FieldConfig) => void;
  loading: boolean;
  objectKey: string;
  onFieldsChange: () => void;
  /** Optimistically update a single field's visibility_condition without refetching */
  onFieldConditionUpdate?: (fieldId: string, condition: Record<string, unknown> | null) => void;
  /** Draft-aware callbacks (optional — when provided, uses draft instead of direct DB) */
  isFieldDirty?: (fieldId: string) => boolean;
  isFieldNew?: (fieldId: string) => boolean;
  isFieldArchived?: (fieldId: string) => boolean;
  onDraftFieldCreate?: (tempId: string, data: Partial<FieldConfig>) => void;
  onDraftFieldArchive?: (field: FieldConfig) => void;
  onDraftFieldUpdate?: (field: FieldConfig, updates: Partial<FieldConfig>) => void;
}

export function FieldsTab({
  fields,
  selectedFieldId,
  onSelectField,
  loading,
  objectKey,
  onFieldsChange,
  onFieldConditionUpdate,
  isFieldDirty,
  isFieldNew,
  isFieldArchived,
  onDraftFieldCreate,
  onDraftFieldArchive,
  onDraftFieldUpdate,
}: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [visFilter, setVisFilter] = useState<VisFilter>("all");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editCondFieldId, setEditCondFieldId] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const conditionalCount = useMemo(
    () =>
      fields.filter(
        (f) =>
          !f.is_archived &&
          hasCondition(f.visibility_condition as VisibilityCondition | null)
      ).length,
    [fields]
  );
  const formulaCount = useMemo(
    () => fields.filter((f) => !f.is_archived && f.field_type === "formula").length,
    [fields]
  );

  const filteredFields = useMemo(() => {
    let result = fields.filter((f) => !f.is_archived);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter(
        (f) =>
          f.field_label.toLowerCase().includes(q) ||
          f.field_key.toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((f) => f.field_type === typeFilter);
    }
    if (visFilter === "conditional") {
      result = result.filter((f) =>
        hasCondition(f.visibility_condition as VisibilityCondition | null)
      );
    } else if (visFilter === "formula") {
      result = result.filter((f) => f.field_type === "formula");
    } else if (visFilter === "always") {
      result = result.filter(
        (f) => !hasCondition(f.visibility_condition as VisibilityCondition | null)
      );
    }
    return result;
  }, [fields, query, typeFilter, visFilter]);

  const editCondField = editCondFieldId
    ? fields.find((f) => f.id === editCondFieldId)
    : null;

  const handleAddField = async (input: {
    field_label: string;
    field_key: string;
    field_type: string;
  }) => {
    const fieldModule = OBJECT_MODULE_MAP[objectKey] || objectKey;

    if (onDraftFieldCreate) {
      // Draft mode: create locally
      const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      onDraftFieldCreate(tempId, {
        module: fieldModule,
        field_key: input.field_key,
        field_label: input.field_label,
        field_type: input.field_type,
      });
      setShowAddDialog(false);
      return;
    }

    // Legacy direct DB mode
    const result = await createField({
      module: fieldModule,
      field_key: input.field_key,
      field_label: input.field_label,
      field_type: input.field_type,
    });
    if (result.error) {
      console.error("Failed to create field:", result.error);
      return;
    }
    setShowAddDialog(false);
    onFieldsChange();
  };

  const handleArchive = async (fieldId: string) => {
    if (onDraftFieldArchive) {
      // Draft mode: mark as archived locally
      const field = fields.find((f) => f.id === fieldId);
      if (field) onDraftFieldArchive(field);
      return;
    }

    // Legacy direct DB mode
    const result = await archiveField(fieldId);
    if (result.error) {
      console.error("Failed to archive field:", result.error);
      return;
    }
    onFieldsChange();
  };

  const handleSaveCondition = async (condition: VisibilityCondition | null) => {
    if (!editCondFieldId) return;
    const fieldId = editCondFieldId;
    setEditCondFieldId(null);

    if (onDraftFieldUpdate && editCondField) {
      // Draft mode: store condition change as a draft update
      onDraftFieldUpdate(editCondField, { visibility_condition: condition });
      return;
    }

    // Optimistically update local state to avoid scroll-resetting refetch
    if (onFieldConditionUpdate) {
      onFieldConditionUpdate(fieldId, condition as Record<string, unknown> | null);
    }

    // Legacy direct DB mode
    const result = await updateFieldVisibilityCondition(fieldId, condition);
    if (result.error) {
      console.error("Failed to update visibility condition:", result.error);
      // Revert on failure by refetching
      onFieldsChange();
    }
  };

  // Whether this object supports two-axis visibility (only Deal/unified_deal)
  const isAxisObject = objectKey === "unified_deal";

  if (loading) {
    return (
      <div className="p-4 space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="px-3.5 py-2 border-b border-border flex items-center gap-1.5">
        <div className="relative w-[180px]">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search fields..."
            className="h-8 pl-8 text-xs"
          />
        </div>
        {isAxisObject ? (
          <div className="flex gap-1">
            {(
              [
                { k: "all" as const, l: "All" },
                { k: "conditional" as const, l: `Conditional (${conditionalCount})` },
                { k: "formula" as const, l: `Formula (${formulaCount})` },
                { k: "always" as const, l: "Always" },
              ] as const
            ).map((f) => (
              <button
                key={f.k}
                onClick={() => setVisFilter(f.k)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-medium transition-colors border",
                  visFilter === f.k
                    ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {f.l}
              </button>
            ))}
          </div>
        ) : (
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {FIELD_TYPES.map((ft) => (
                <SelectItem key={ft.key} value={ft.key}>
                  {ft.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">
          {filteredFields.length}
        </span>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5"
          onClick={() => setShowAddDialog(true)}
        >
          <Plus size={12} />
          Add
        </Button>
      </div>

      {/* Axis Indicator Banners (Deal only) */}
      {isAxisObject && (
        <div className="flex gap-2 px-3.5 py-2 border-b border-border">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-amber-500/[0.04] border border-amber-500/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500 font-mono">
              Axis 1
            </span>
            <span className="text-xs font-semibold text-amber-500">
              Asset Class
            </span>
            <span className="text-[10px] text-amber-500/40 ml-auto">
              Residential | Commercial
            </span>
          </div>
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-400/[0.04] border border-indigo-400/10">
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
              Axis 2
            </span>
            <span className="text-xs font-semibold text-indigo-400">
              Loan Type
            </span>
            <span className="text-[10px] text-indigo-400/40 ml-auto">
              Bridge | DSCR | Perm | Construction | Equity
            </span>
          </div>
        </div>
      )}

      {/* Table Header */}
      <div
        className={cn(
          "grid px-3.5 py-1.5 gap-1 border-b border-border text-[9px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background z-10",
          isAxisObject
            ? "grid-cols-[22px_1fr_95px_80px_40px_150px_30px]"
            : "grid-cols-[22px_1fr_95px_95px_50px_50px_30px]"
        )}
      >
        <span />
        <span>Field</span>
        <span>{isAxisObject ? "Key" : "Type"}</span>
        <span>{isAxisObject ? "Type" : "Key"}</span>
        <span className="text-center">Req</span>
        <span>{isAxisObject ? "Conditions" : ""}</span>
        <span />
      </div>

      {/* Field Rows */}
      <div className="flex-1 overflow-y-auto">
        {filteredFields.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <Search size={24} className="text-muted-foreground" strokeWidth={1} />
            <span className="text-xs text-muted-foreground">No fields found</span>
          </div>
        )}
        {filteredFields.map((field) => {
          const ft = getFieldType(field.field_type);
          const FieldIcon = ft.icon;
          const isActive = selectedFieldId === field.id;
          const isHover = hover === field.id;
          const isFormula = field.field_type === "formula";
          const fieldCond = field.visibility_condition as VisibilityCondition | null;
          const isAxisField =
            field.field_key === "asset_class" || field.field_key === "loan_type";
          const isDirty = isFieldDirty?.(field.id) ?? false;
          const isNew = isFieldNew?.(field.id) ?? false;

          return (
            <div
              key={field.id}
              onClick={() => onSelectField(field)}
              onMouseEnter={() => setHover(field.id)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "grid px-3.5 py-2 gap-1 border-b border-border cursor-pointer transition-colors",
                isAxisObject
                  ? "grid-cols-[22px_1fr_95px_80px_40px_150px_30px]"
                  : "grid-cols-[22px_1fr_95px_95px_50px_50px_30px]",
                isActive
                  ? "bg-blue-500/5 border-l-2 border-l-blue-500"
                  : isDirty && !isNew
                  ? "bg-amber-500/5 border-l-2 border-l-amber-500 hover:bg-amber-500/10"
                  : isNew
                  ? "bg-green-500/5 border-l-2 border-l-green-500 hover:bg-green-500/10"
                  : "border-l-2 border-l-transparent hover:bg-muted/50"
              )}
            >
              <GripVertical
                size={12}
                className="text-muted-foreground cursor-grab self-center"
              />
              <div className="flex items-center gap-1.5 overflow-hidden">
                {field.is_system && (
                  <Lock size={10} className="text-muted-foreground shrink-0" />
                )}
                <span
                  className={cn(
                    "text-xs font-medium truncate",
                    isAxisField && isAxisObject && "font-semibold text-amber-500"
                  )}
                >
                  {field.field_label}
                </span>
                {isAxisField && isAxisObject && (
                  <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-amber-500/15 text-amber-500 uppercase">
                    AXIS
                  </span>
                )}
              </div>
              {isAxisObject ? (
                <>
                  <span className="text-[9px] font-mono text-muted-foreground truncate self-center">
                    {field.field_key}
                  </span>
                  <div className="flex items-center gap-1 self-center">
                    <FieldIcon size={11} style={{ color: ft.color }} />
                    <span
                      className={cn(
                        "text-[10px]",
                        isFormula ? "text-pink-400" : "text-muted-foreground"
                      )}
                    >
                      {isFormula ? "Formula" : ft.label}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-1">
                    <FieldIcon size={11} style={{ color: ft.color }} />
                    <span className="text-[11px] text-muted-foreground">
                      {ft.label}
                    </span>
                  </div>
                  <span className="text-[9px] font-mono text-muted-foreground truncate self-center">
                    {field.field_key}
                  </span>
                </>
              )}
              <div className="flex justify-center self-center">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    field.is_required ? "bg-amber-500" : "bg-border"
                  )}
                />
              </div>
              {isAxisObject ? (
                <div className="self-center">
                  {hasCondition(fieldCond) ? (
                    <ConditionBadge
                      condition={fieldCond}
                      compact
                      onClick={() => setEditCondFieldId(field.id)}
                    />
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditCondFieldId(field.id);
                      }}
                      className={cn(
                        "text-[10px] text-muted-foreground/30 hover:text-muted-foreground transition-opacity",
                        isHover ? "opacity-100" : "opacity-0"
                      )}
                    >
                      + condition
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex justify-center self-center">
                  <Eye
                    size={12}
                    className={cn(
                      field.is_visible
                        ? "text-green-600"
                        : "text-muted-foreground"
                    )}
                  />
                </div>
              )}
              <div className="self-center flex justify-center">
                {isFormula && isAxisObject && isHover ? (
                  <Calculator
                    size={12}
                    className="text-pink-400 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectField(field);
                    }}
                  />
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="self-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal
                          size={13}
                          className="text-muted-foreground"
                        />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onSelectField(field)}>
                        Edit
                      </DropdownMenuItem>
                      {isAxisObject && (
                        <DropdownMenuItem
                          onClick={() => setEditCondFieldId(field.id)}
                        >
                          Set Conditions
                        </DropdownMenuItem>
                      )}
                      {field.is_admin_created && (
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleArchive(field.id)}
                        >
                          Archive
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Field Dialog */}
      <AddFieldDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSubmit={handleAddField}
      />

      {/* Condition Editor Modal */}
      {editCondFieldId && editCondField && (
        <ConditionEditorModal
          open={!!editCondFieldId}
          onOpenChange={(open) => {
            if (!open) setEditCondFieldId(null);
          }}
          condition={editCondField.visibility_condition as VisibilityCondition | null}
          onSave={handleSaveCondition}
          allFields={fields}
        />
      )}
    </div>
  );
}
