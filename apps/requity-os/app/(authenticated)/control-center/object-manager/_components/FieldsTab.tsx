"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Plus,
  GripVertical,
  Eye,
  Lock,
  MoreHorizontal,
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
import { createField, archiveField } from "../actions";
import { FIELD_TYPES, getFieldType } from "./constants";
import { AddFieldDialog } from "./AddFieldDialog";

// Module mapping
const OBJECT_MODULE_MAP: Record<string, string> = {
  opportunity: "uw_deal",
  contact: "contact_profile",
  company: "company_info",
  borrower_entity: "borrower_entity",
  property: "uw_property",
  loan: "loan_details",
  servicing_loan: "servicing",
  borrower: "borrower_profile",
  investor: "investor_profile",
  equity_deal: "equity_deal",
  fund: "fund",
  unified_deal: "uw_deal",
};

interface Props {
  fields: FieldConfig[];
  selectedFieldId: string | null;
  onSelectField: (field: FieldConfig) => void;
  loading: boolean;
  objectKey: string;
  onFieldsChange: () => void;
}

export function FieldsTab({
  fields,
  selectedFieldId,
  onSelectField,
  loading,
  objectKey,
  onFieldsChange,
}: Props) {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAddDialog, setShowAddDialog] = useState(false);

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
    return result;
  }, [fields, query, typeFilter]);

  const handleAddField = async (input: {
    field_label: string;
    field_key: string;
    field_type: string;
  }) => {
    const fieldModule = OBJECT_MODULE_MAP[objectKey] || objectKey;
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
    const result = await archiveField(fieldId);
    if (result.error) {
      console.error("Failed to archive field:", result.error);
      return;
    }
    onFieldsChange();
  };

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
        <div className="relative w-[200px]">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search..."
            className="h-8 pl-8 text-xs"
          />
        </div>
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
        <div className="flex-1" />
        <span className="text-[10px] text-muted-foreground">{filteredFields.length}</span>
        <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => setShowAddDialog(true)}>
          <Plus size={12} />
          Add
        </Button>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-[22px_1fr_95px_95px_50px_50px_30px] px-3.5 py-1.5 gap-1 border-b border-border text-[9px] font-semibold text-muted-foreground uppercase tracking-wider sticky top-0 bg-background z-10">
        <span />
        <span>Field</span>
        <span>Type</span>
        <span>Key</span>
        <span className="text-center">Req</span>
        <span className="text-center">Vis</span>
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

          return (
            <div
              key={field.id}
              onClick={() => onSelectField(field)}
              className={cn(
                "grid grid-cols-[22px_1fr_95px_95px_50px_50px_30px] px-3.5 py-2 gap-1 border-b border-border cursor-pointer transition-colors",
                isActive
                  ? "bg-blue-500/5 border-l-2 border-l-blue-500"
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
                <span className="text-xs font-medium truncate">
                  {field.field_label}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <FieldIcon size={11} style={{ color: ft.color }} />
                <span className="text-[11px] text-muted-foreground">{ft.label}</span>
              </div>
              <span className="text-[9px] font-mono text-muted-foreground truncate self-center">
                {field.field_key}
              </span>
              <div className="flex justify-center self-center">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    field.is_required ? "bg-destructive" : "bg-border"
                  )}
                />
              </div>
              <div className="flex justify-center self-center">
                <Eye
                  size={12}
                  className={cn(
                    field.is_visible ? "text-green-600" : "text-muted-foreground"
                  )}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="self-center" onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal size={13} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onSelectField(field)}>
                    Edit
                  </DropdownMenuItem>
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
    </div>
  );
}
