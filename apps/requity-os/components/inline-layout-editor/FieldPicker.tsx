"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Search, DollarSign, Building2, User, FileText, ChevronRight, Sparkles } from "lucide-react";
import { useInlineLayout } from "./InlineLayoutContext";
import { CreateFieldDialog } from "./CreateFieldDialog";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// ── Types for field picker (needs id + module from DB) ──

interface PickerField {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
}

// ── Module grouping for field picker ──

const MODULE_GROUPS: { key: string; label: string; icon: React.ElementType; modules: string[] }[] = [
  { key: "deal", label: "Deal Fields", icon: FileText, modules: ["uw_deal"] },
  { key: "property", label: "Property Fields", icon: Building2, modules: ["uw_property", "property"] },
  { key: "borrower", label: "Borrower Fields", icon: User, modules: ["uw_borrower", "borrower_entity", "borrower_profile"] },
];

const MODULE_TO_SOURCE: Record<string, string | null> = {
  uw_deal: null,
  uw_property: "property",
  uw_borrower: "borrower",
  property: "property",
  borrower_entity: "borrower",
  borrower_profile: "borrower",
};

interface FieldPickerProps {
  sectionId: string;
  /** Field keys already in use across all sections */
  usedFieldKeys: Set<string>;
}

// Module-level cache so we only fetch once per session
let pickerFieldsCache: PickerField[] | null = null;

export function invalidatePickerCache() {
  pickerFieldsCache = null;
}

export function FieldPicker({ sectionId, usedFieldKeys }: FieldPickerProps) {
  const { addField } = useInlineLayout();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<string | null>("deal");
  const [allPickerFields, setAllPickerFields] = useState<PickerField[]>(pickerFieldsCache ?? []);
  const [createOpen, setCreateOpen] = useState(false);

  // Listen for field-created events to invalidate cache
  useEffect(() => {
    function handleFieldCreated() {
      pickerFieldsCache = null;
      setAllPickerFields([]);
    }
    window.addEventListener("inline-editor:field-created", handleFieldCreated);
    return () => window.removeEventListener("inline-editor:field-created", handleFieldCreated);
  }, []);

  // Fetch field configs with id + module (only when popover opens for the first time)
  useEffect(() => {
    if (!open || allPickerFields.length > 0) return;
    const supabase = createClient();
    supabase
      .from("field_configurations" as never)
      .select("id, module, field_key, field_label, field_type" as never)
      .in("module" as never, ["uw_deal", "uw_property", "uw_borrower", "property", "borrower_entity"] as never)
      .eq("is_archived" as never, false as never)
      .eq("is_visible" as never, true as never)
      .order("display_order" as never, { ascending: true })
      .then(({ data }) => {
        if (data) {
          const fields = data as unknown as PickerField[];
          pickerFieldsCache = fields;
          setAllPickerFields(fields);
        }
      });
  }, [open, allPickerFields.length]);

  const groupedFields = useMemo(() => {
    const searchLower = search.toLowerCase();
    return MODULE_GROUPS.map(group => {
      const fields = allPickerFields
        .filter(f => {
          if (!group.modules.includes(f.module)) return false;
          if (usedFieldKeys.has(f.field_key)) return false;
          if (search && !f.field_label.toLowerCase().includes(searchLower) && !f.field_key.toLowerCase().includes(searchLower)) return false;
          return true;
        })
        .sort((a, b) => a.field_label.localeCompare(b.field_label));
      return { ...group, fields };
    }).filter(g => g.fields.length > 0);
  }, [allPickerFields, usedFieldKeys, search]);

  function handleAddField(field: PickerField) {
    const sourceObjectKey = MODULE_TO_SOURCE[field.module] ?? null;
    addField(sectionId, field.field_key, field.id, sourceObjectKey);
    // Don't close - allow adding multiple fields
  }

  return (
    <>
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-[10px] gap-1 text-muted-foreground hover:text-foreground border border-dashed border-border hover:border-primary/40"
        >
          <Plus className="h-3 w-3" />
          Add Field
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search fields..."
              className="h-8 pl-8 text-xs"
              autoFocus
            />
          </div>
        </div>
        <div className="max-h-[320px] overflow-y-auto py-1">
          {groupedFields.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-muted-foreground">
              {allPickerFields.length === 0 ? "Loading fields..." : "No available fields"}
            </div>
          ) : (
            groupedFields.map(group => (
              <div key={group.key}>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-muted/50 transition-colors bg-transparent border-0 cursor-pointer"
                  onClick={() => setExpandedGroup(expandedGroup === group.key ? null : group.key)}
                >
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 text-muted-foreground transition-transform",
                      expandedGroup === group.key && "rotate-90"
                    )}
                  />
                  <group.icon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground/60">{group.fields.length}</span>
                </button>
                {expandedGroup === group.key && (
                  <div className="pb-1">
                    {group.fields.map(field => (
                      <button
                        key={field.field_key}
                        className="w-full flex items-center gap-2 px-3 pl-8 py-1.5 text-left hover:bg-muted transition-colors bg-transparent border-0 cursor-pointer rounded-sm mx-1"
                        style={{ width: "calc(100% - 8px)" }}
                        onClick={() => handleAddField(field)}
                      >
                        <FieldTypeIcon type={field.field_type} />
                        <span className="text-xs text-foreground truncate">{field.field_label}</span>
                        <span className="ml-auto text-[10px] text-muted-foreground/50 font-mono truncate max-w-[80px]">
                          {field.field_key}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        <div className="border-t px-2 py-1.5">
          <button
            className="w-full flex items-center gap-2 px-2 py-1.5 text-left hover:bg-muted transition-colors bg-transparent border-0 cursor-pointer rounded-sm text-xs text-primary font-medium"
            onClick={() => {
              setOpen(false);
              setCreateOpen(true);
            }}
          >
            <Sparkles className="h-3 w-3" />
            Create New Field
          </button>
        </div>
      </PopoverContent>
    </Popover>
    {createOpen && (
      <CreateFieldDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        sectionId={sectionId}
      />
    )}
    </>
  );
}

function FieldTypeIcon({ type }: { type: string }) {
  const iconClass = "h-3 w-3 text-muted-foreground/70";
  switch (type) {
    case "currency":
      return <DollarSign className={iconClass} />;
    case "percentage":
      return <span className={cn(iconClass, "text-[10px] font-mono")}>%</span>;
    case "number":
      return <span className={cn(iconClass, "text-[10px] font-mono")}>#</span>;
    case "date":
      return <span className={cn(iconClass, "text-[10px] font-mono")}>D</span>;
    case "dropdown":
      return <span className={cn(iconClass, "text-[10px] font-mono")}>V</span>;
    default:
      return <span className={cn(iconClass, "text-[10px] font-mono")}>T</span>;
  }
}
