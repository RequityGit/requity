"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  ArrowLeft,
  Check,
  Search,
  Loader2,
  FileText,
  Building2,
  Shield,
  Briefcase,
  UserCircle,
  TrendingUp,
  Contact,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  RotateCcw,
  Calculator,
  Landmark,
  DollarSign,
  Layers,
  MapPin,
  Wallet,
  Banknote,
  PiggyBank,
  ArrowUpDown,
  Hammer,
  Receipt,
  CreditCard,
  Activity,
  BarChart3,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useToast } from "@/components/ui/use-toast";
import { publishFieldConfigurations, archiveField, restoreField } from "./actions";
import { invalidateFieldConfigCache } from "@/hooks/useFieldConfigurations";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type FieldConfigRow = Database["public"]["Tables"]["field_configurations"]["Row"];

interface FieldEntry {
  id: string;
  module: string;
  field_key: string;
  field_label: string;
  field_type: string;
  column_position: "left" | "right";
  display_order: number;
  is_visible: boolean;
  is_locked: boolean;
  is_admin_created: boolean;
  dropdown_options: string[] | null;
  is_archived: boolean;
  formula_expression: string | null;
  formula_source_fields: string[] | null;
}

const MODULES = [
  // Original modules
  { key: "loan_details", label: "Loan Details", icon: FileText, tier: 0 },
  { key: "property", label: "Property", icon: Building2, tier: 0 },
  { key: "borrower_entity", label: "Borrower / Entity", icon: Shield, tier: 0 },
  { key: "equity_deal", label: "Equity Deal Details", icon: TrendingUp, tier: 0 },
  { key: "equity_property", label: "Equity Property", icon: Building2, tier: 0 },
  { key: "equity_notes", label: "Equity Notes & Strategy", icon: FileText, tier: 0 },
  { key: "company_info", label: "Company Information", icon: Briefcase, tier: 0 },
  { key: "borrower_profile", label: "Borrower Profile", icon: UserCircle, tier: 0 },
  { key: "investor_profile", label: "Investor Profile", icon: TrendingUp, tier: 0 },
  { key: "contact_profile", label: "Contact Profile", icon: Contact, tier: 0 },
  // Tier 1: High Priority
  { key: "loans_extended", label: "Loans (Extended)", icon: Layers, tier: 1 },
  { key: "servicing_loan", label: "Servicing Loan", icon: Landmark, tier: 1 },
  { key: "fund_details", label: "Fund Details", icon: PiggyBank, tier: 1 },
  { key: "opportunity", label: "Opportunity", icon: DollarSign, tier: 1 },
  { key: "standalone_property", label: "Standalone Property", icon: MapPin, tier: 1 },
  // Tier 2: Medium Priority
  { key: "borrower_entity_detail", label: "Borrower Entity", icon: Shield, tier: 2 },
  { key: "investing_entity", label: "Investing Entity", icon: Wallet, tier: 2 },
  { key: "investor_commitment", label: "Investor Commitment", icon: Banknote, tier: 2 },
  { key: "capital_call", label: "Capital Call", icon: ArrowUpDown, tier: 2 },
  { key: "distribution", label: "Distribution", icon: ArrowUpDown, tier: 2 },
  // Tier 3: Lower Priority
  { key: "draw_request", label: "Draw Request", icon: Hammer, tier: 3 },
  { key: "payoff_statement", label: "Payoff Statement", icon: Receipt, tier: 3 },
  { key: "wire_instructions", label: "Wire Instructions", icon: CreditCard, tier: 3 },
  { key: "crm_activity", label: "CRM Activity", icon: Activity, tier: 3 },
  { key: "equity_underwriting", label: "Equity Underwriting", icon: BarChart3, tier: 3 },
] as const;

const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "currency", label: "Currency" },
  { value: "percentage", label: "Percentage" },
  { value: "dropdown", label: "Dropdown / Select" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Yes / No" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "formula", label: "Formula (Calculated)" },
] as const;

const MODULE_LABELS: Record<string, string> = {
  loan_details: "Loan Details",
  property: "Property",
  borrower_entity: "Borrower / Entity",
  equity_deal: "Equity Deal Details",
  equity_property: "Equity Property",
  equity_notes: "Equity Notes & Strategy",
  company_info: "Company Information",
  borrower_profile: "Borrower Profile",
  investor_profile: "Investor Profile",
  contact_profile: "Contact Profile",
  loans_extended: "Loans (Extended)",
  servicing_loan: "Servicing Loan",
  fund_details: "Fund Details",
  opportunity: "Opportunity",
  standalone_property: "Standalone Property",
  borrower_entity_detail: "Borrower Entity",
  investing_entity: "Investing Entity",
  investor_commitment: "Investor Commitment",
  capital_call: "Capital Call",
  distribution: "Distribution",
  draw_request: "Draw Request",
  payoff_statement: "Payoff Statement",
  wire_instructions: "Wire Instructions",
  crm_activity: "CRM Activity",
  equity_underwriting: "Equity Underwriting",
};

const MODULE_TABLE_LABELS: Record<string, string> = {
  loan_details: "loans",
  property: "loans",
  borrower_entity: "loans",
  equity_deal: "equity_deals",
  equity_property: "equity_properties",
  equity_notes: "equity_deals",
  company_info: "crm_companies",
  borrower_profile: "borrowers",
  investor_profile: "investors",
  contact_profile: "crm_contacts",
  loans_extended: "loans",
  servicing_loan: "servicing_loans",
  fund_details: "funds",
  opportunity: "opportunities",
  standalone_property: "properties",
  borrower_entity_detail: "borrower_entities",
  investing_entity: "investing_entities",
  investor_commitment: "investor_commitments",
  capital_call: "capital_calls",
  distribution: "distributions",
  draw_request: "draw_requests",
  payoff_statement: "payoff_statements",
  wire_instructions: "company_wire_instructions",
  crm_activity: "crm_activities",
  equity_underwriting: "equity_underwriting",
};

const RESERVED_WORDS = new Set([
  "id", "type", "order", "group", "user", "table", "column", "index", "key",
  "select", "insert", "update", "delete", "create", "drop", "alter",
  "primary", "foreign", "constraint", "reference", "default", "null",
  "not", "and", "or", "where", "from", "join", "on", "in", "is", "as",
  "by", "to", "set", "values", "into", "like", "between", "exists",
  "having", "limit", "offset", "union", "all", "any", "case", "when",
  "then", "else", "end", "cast", "check", "unique", "grant", "revoke",
  "role", "schema", "sequence", "trigger", "view", "with", "status",
  "name", "date", "time", "timestamp", "text", "number", "value",
  "result", "level", "position", "comment", "label", "description",
  "data", "metadata", "source", "target", "state", "action", "event",
  "record", "field", "input", "output", "session", "token", "hash",
  "code", "message",
]);

const TYPE_COLORS: Record<string, string> = {
  text: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  dropdown: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  currency: "bg-green-500/10 text-green-500 border-green-500/20",
  number: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  percentage: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  email: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  phone: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  date: "bg-orange-500/10 text-orange-500 border-orange-500/20",
  boolean: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  formula: "bg-rose-500/10 text-rose-500 border-rose-500/20",
};

function generateFieldKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function validateFieldKey(key: string): string | null {
  if (!key) return "Field key is required";
  if (!/^[a-z][a-z0-9_]*$/.test(key))
    return "Must start with a letter and contain only lowercase letters, numbers, and underscores";
  if (key.length > 63) return "Must be 63 characters or less";
  if (RESERVED_WORDS.has(key)) return `"${key}" is a reserved word`;
  return null;
}

function mapRow(row: FieldConfigRow): FieldEntry {
  return {
    id: row.id,
    module: row.module,
    field_key: row.field_key,
    field_label: row.field_label,
    field_type: row.field_type,
    column_position: row.column_position as "left" | "right",
    display_order: row.display_order,
    is_visible: row.is_visible,
    is_locked: row.is_locked,
    is_admin_created: row.is_admin_created ?? false,
    dropdown_options: Array.isArray(row.dropdown_options) ? (row.dropdown_options as string[]) : null,
    is_archived: row.is_archived ?? false,
    formula_expression: (row as Record<string, unknown>).formula_expression as string | null ?? null,
    formula_source_fields: Array.isArray((row as Record<string, unknown>).formula_source_fields)
      ? ((row as Record<string, unknown>).formula_source_fields as string[])
      : null,
  };
}

interface FieldManagerViewProps {
  initialConfigs: FieldConfigRow[];
}

export function FieldManagerView({ initialConfigs }: FieldManagerViewProps) {
  const [activeModule, setActiveModule] = useState<string>("loan_details");
  const [fields, setFields] = useState<Record<string, FieldEntry[]>>(() => {
    const grouped: Record<string, FieldEntry[]> = {};
    for (const mod of MODULES) {
      grouped[mod.key] = initialConfigs
        .filter((c) => c.module === mod.key)
        .map(mapRow)
        .sort((a, b) => a.display_order - b.display_order);
    }
    return grouped;
  });
  const [originalFields, setOriginalFields] = useState<Record<string, FieldEntry[]>>(() => {
    const grouped: Record<string, FieldEntry[]> = {};
    for (const mod of MODULES) {
      grouped[mod.key] = initialConfigs
        .filter((c) => c.module === mod.key)
        .map(mapRow)
        .sort((a, b) => a.display_order - b.display_order);
    }
    return grouped;
  });
  const [search, setSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [addFieldOpen, setAddFieldOpen] = useState(false);
  const [archivedOpen, setArchivedOpen] = useState(false);
  const { toast } = useToast();

  const currentFields = fields[activeModule] ?? [];
  const activeFields = currentFields.filter((f) => !f.is_archived);
  const archivedFields = currentFields.filter((f) => f.is_archived && f.is_admin_created);

  const hasChanges = useMemo(() => {
    return JSON.stringify(fields) !== JSON.stringify(originalFields);
  }, [fields, originalFields]);

  const filteredLeft = activeFields.filter(
    (f) =>
      f.column_position === "left" &&
      (search === "" ||
        f.field_label.toLowerCase().includes(search.toLowerCase()) ||
        f.field_key.toLowerCase().includes(search.toLowerCase()))
  );
  const filteredRight = activeFields.filter(
    (f) =>
      f.column_position === "right" &&
      (search === "" ||
        f.field_label.toLowerCase().includes(search.toLowerCase()) ||
        f.field_key.toLowerCase().includes(search.toLowerCase()))
  );

  const stats = useMemo(() => {
    const total = activeFields.length;
    const visible = activeFields.filter((f) => f.is_visible).length;
    const hidden = total - visible;
    return { total, visible, hidden };
  }, [activeFields]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const updateModuleFields = useCallback(
    (updater: (prev: FieldEntry[]) => FieldEntry[]) => {
      setFields((prev) => ({
        ...prev,
        [activeModule]: updater(prev[activeModule] ?? []),
      }));
    },
    [activeModule]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      updateModuleFields((prev) => {
        const activeField = prev.find((f) => f.id === active.id);
        const overField = prev.find((f) => f.id === over.id);
        if (!activeField || !overField) return prev;

        if (activeField.column_position !== overField.column_position) return prev;

        const column = activeField.column_position;
        const columnFields = prev
          .filter((f) => f.column_position === column && !f.is_archived)
          .sort((a, b) => a.display_order - b.display_order);

        const oldIndex = columnFields.findIndex((f) => f.id === active.id);
        const newIndex = columnFields.findIndex((f) => f.id === over.id);

        if (oldIndex === -1 || newIndex === -1) return prev;

        const reordered = [...columnFields];
        const [moved] = reordered.splice(oldIndex, 1);
        reordered.splice(newIndex, 0, moved);

        const otherColumn = prev.filter((f) => f.column_position !== column);
        const updated = [
          ...otherColumn,
          ...reordered.map((f, i) => ({ ...f, display_order: i * 2 + (column === "right" ? 1 : 0) })),
        ];

        return updated;
      });
    },
    [updateModuleFields]
  );

  const toggleVisibility = useCallback(
    (fieldId: string) => {
      updateModuleFields((prev) =>
        prev.map((f) => (f.id === fieldId && !f.is_locked ? { ...f, is_visible: !f.is_visible } : f))
      );
    },
    [updateModuleFields]
  );

  const swapColumn = useCallback(
    (fieldId: string) => {
      updateModuleFields((prev) => {
        const field = prev.find((f) => f.id === fieldId);
        if (!field) return prev;
        const newColumn = field.column_position === "left" ? "right" : "left";
        const targetFields = prev.filter((f) => f.column_position === newColumn && !f.is_archived);
        const maxOrder = targetFields.length > 0 ? Math.max(...targetFields.map((f) => f.display_order)) + 1 : 0;
        return prev.map((f) =>
          f.id === fieldId ? { ...f, column_position: newColumn as "left" | "right", display_order: maxOrder } : f
        );
      });
    },
    [updateModuleFields]
  );

  const handlePublish = useCallback(async () => {
    setIsSaving(true);
    setSavedAt(null);
    try {
      const moduleFields = fields[activeModule] ?? [];
      const result = await publishFieldConfigurations(activeModule, moduleFields);
      if ("error" in result && result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
      } else {
        setSavedAt(Date.now());
        setOriginalFields((prev) => ({ ...prev, [activeModule]: [...moduleFields] }));
        invalidateFieldConfigCache(activeModule);
        setTimeout(() => setSavedAt(null), 3000);
      }
    } finally {
      setIsSaving(false);
    }
  }, [activeModule, fields, toast]);

  const handleFieldCreated = useCallback(
    (newRow: FieldConfigRow) => {
      const newEntry = mapRow(newRow);
      setFields((prev) => ({
        ...prev,
        [newEntry.module]: [...(prev[newEntry.module] ?? []), newEntry],
      }));
      setOriginalFields((prev) => ({
        ...prev,
        [newEntry.module]: [...(prev[newEntry.module] ?? []), newEntry],
      }));
      invalidateFieldConfigCache(newEntry.module);
    },
    []
  );

  const handleArchive = useCallback(
    async (fieldId: string, fieldLabel: string) => {
      const result = await archiveField(fieldId);
      if ("error" in result && result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      setFields((prev) => ({
        ...prev,
        [activeModule]: prev[activeModule]?.map((f) =>
          f.id === fieldId ? { ...f, is_archived: true, is_visible: false } : f
        ) ?? [],
      }));
      setOriginalFields((prev) => ({
        ...prev,
        [activeModule]: prev[activeModule]?.map((f) =>
          f.id === fieldId ? { ...f, is_archived: true, is_visible: false } : f
        ) ?? [],
      }));
      invalidateFieldConfigCache(activeModule);
      toast({ title: `${fieldLabel} archived`, description: "Data preserved. Field hidden from portal." });
    },
    [activeModule, toast]
  );

  const handleRestore = useCallback(
    async (fieldId: string, fieldLabel: string) => {
      const result = await restoreField(fieldId);
      if ("error" in result && result.error) {
        toast({ title: "Error", description: result.error, variant: "destructive" });
        return;
      }
      setFields((prev) => ({
        ...prev,
        [activeModule]: prev[activeModule]?.map((f) =>
          f.id === fieldId ? { ...f, is_archived: false, is_visible: true } : f
        ) ?? [],
      }));
      setOriginalFields((prev) => ({
        ...prev,
        [activeModule]: prev[activeModule]?.map((f) =>
          f.id === fieldId ? { ...f, is_archived: false, is_visible: true } : f
        ) ?? [],
      }));
      invalidateFieldConfigCache(activeModule);
      toast({ title: `${fieldLabel} restored`, description: "Field is now visible in the portal." });
    },
    [activeModule, toast]
  );

  const draggedField = activeId ? activeFields.find((f) => f.id === activeId) : null;

  return (
    <div className="flex gap-6">
      {/* Module sidebar */}
      <div className="w-[220px] shrink-0 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
        {[
          { tier: 0, label: null },
          { tier: 1, label: "Tier 1" },
          { tier: 2, label: "Tier 2" },
          { tier: 3, label: "Tier 3" },
        ].map(({ tier, label }) => {
          const tierModules = MODULES.filter((m) => m.tier === tier);
          if (tierModules.length === 0) return null;
          return (
            <div key={tier}>
              {label && (
                <div className="text-[10px] uppercase tracking-[0.06em] font-semibold text-muted-foreground px-2 pt-3 pb-1">
                  {label}
                </div>
              )}
              {tierModules.map((mod) => {
                const isActive = activeModule === mod.key;
                const count = (fields[mod.key] ?? []).filter((f) => !f.is_archived).length;
                return (
                  <Button
                    key={mod.key}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2.5 text-[13px] font-medium h-9",
                      isActive && "bg-sidebar-active text-foreground font-semibold"
                    )}
                    onClick={() => {
                      setActiveModule(mod.key);
                      setSearch("");
                    }}
                  >
                    <mod.icon className="h-4 w-4 shrink-0" strokeWidth={1.5} />
                    <span className="flex-1 text-left truncate">{mod.label}</span>
                    <Badge variant="outline" className="h-5 min-w-[22px] px-1.5 text-[10px] num">
                      {count}
                    </Badge>
                  </Button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="Search fields..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-[13px]"
            />
          </div>
          <div className="flex items-center gap-2 text-[12px] text-muted-foreground">
            <span className="num">{stats.total}</span> total
            <span className="text-border">|</span>
            <span className="num">{stats.visible}</span> visible
            <span className="text-border">|</span>
            <span className="num">{stats.hidden}</span> hidden
          </div>
          <div className="flex-1" />
          {savedAt && (
            <div className="flex items-center gap-1.5 text-[12px] font-medium" style={{ color: "#1B7A44" }}>
              <Check className="h-3.5 w-3.5" strokeWidth={2} />
              Saved
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-9 text-[13px] gap-1.5"
            onClick={() => setAddFieldOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
            Add Field
          </Button>
          <Button
            onClick={handlePublish}
            disabled={!hasChanges || isSaving}
            size="sm"
            className="h-9 text-[13px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Saving...
              </>
            ) : (
              "Publish Changes"
            )}
          </Button>
        </div>

        {/* Two-column grid */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-2 gap-4">
            <FieldColumn
              label="Left Column"
              fields={filteredLeft}
              onToggleVisibility={toggleVisibility}
              onSwapColumn={swapColumn}
              onArchive={handleArchive}
            />
            <FieldColumn
              label="Right Column"
              fields={filteredRight}
              onToggleVisibility={toggleVisibility}
              onSwapColumn={swapColumn}
              onArchive={handleArchive}
            />
          </div>
          <DragOverlay>
            {draggedField ? <FieldCardOverlay field={draggedField} /> : null}
          </DragOverlay>
        </DndContext>

        {/* Archived Fields Section */}
        {archivedFields.length > 0 && (
          <Collapsible open={archivedOpen} onOpenChange={setArchivedOpen}>
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 text-[12px] text-muted-foreground hover:text-foreground transition-colors mt-2 py-1">
                {archivedOpen ? (
                  <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
                Archived Fields
                <Badge variant="outline" className="h-5 min-w-[22px] px-1.5 text-[10px] num">
                  {archivedFields.length}
                </Badge>
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-2 space-y-1.5 border-l-2 border-border pl-4">
                {archivedFields.map((field) => (
                  <ArchivedFieldCard
                    key={field.id}
                    field={field}
                    onRestore={handleRestore}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>

      {/* Add Field Modal */}
      <AddFieldModal
        open={addFieldOpen}
        onOpenChange={setAddFieldOpen}
        defaultModule={activeModule}
        onCreated={handleFieldCreated}
      />
    </div>
  );
}

function FieldColumn({
  label,
  fields,
  onToggleVisibility,
  onSwapColumn,
  onArchive,
}: {
  label: string;
  fields: FieldEntry[];
  onToggleVisibility: (id: string) => void;
  onSwapColumn: (id: string) => void;
  onArchive: (id: string, label: string) => void;
}) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground px-1">
        {label}
      </div>
      <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5 min-h-[60px]">
          {fields.map((field) => (
            <SortableFieldCard
              key={field.id}
              field={field}
              onToggleVisibility={onToggleVisibility}
              onSwapColumn={onSwapColumn}
              onArchive={onArchive}
            />
          ))}
          {fields.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-6 text-center text-[12px] text-muted-foreground">
              No fields in this column
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}

function SortableFieldCard({
  field,
  onToggleVisibility,
  onSwapColumn,
  onArchive,
}: {
  field: FieldEntry;
  onToggleVisibility: (id: string) => void;
  onSwapColumn: (id: string) => void;
  onArchive: (id: string, label: string) => void;
}) {
  const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors",
          isDragging && "opacity-30",
          !field.is_visible && "opacity-50"
        )}
      >
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground transition-colors touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" strokeWidth={1.5} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-foreground truncate">
              {field.field_label}
            </span>
            {field.is_locked && (
              <Lock className="h-3 w-3 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            )}
            {field.field_type === "formula" && (
              <Badge variant="outline" className="h-4 px-1 text-[9px] bg-rose-500/10 text-rose-500 border-rose-500/20">
                <Calculator className="h-2.5 w-2.5 mr-0.5" strokeWidth={1.5} />fx
              </Badge>
            )}
            {field.is_admin_created && (
              <Badge variant="outline" className="h-4 px-1 text-[9px] bg-violet-500/10 text-violet-500 border-violet-500/20">
                custom
              </Badge>
            )}
          </div>
          <span className="text-[11px] font-mono text-muted-foreground">
            {field.field_key}
          </span>
        </div>

        <Badge
          variant="outline"
          className={cn(
            "shrink-0 text-[10px] px-1.5 py-0 h-5 font-medium",
            TYPE_COLORS[field.field_type] ?? "bg-secondary text-secondary-foreground"
          )}
        >
          {field.field_type}
        </Badge>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => onSwapColumn(field.id)}
          aria-label={`Move to ${field.column_position === "left" ? "right" : "left"} column`}
        >
          {field.column_position === "left" ? (
            <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 shrink-0"
          onClick={() => onToggleVisibility(field.id)}
          disabled={field.is_locked}
          aria-label={field.is_visible ? "Hide field" : "Show field"}
        >
          {field.is_visible ? (
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
          ) : (
            <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
        </Button>

        {field.is_admin_created && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={() => setArchiveDialogOpen(true)}
            aria-label="Archive field"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        )}
      </div>

      <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive {field.field_label}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will hide <strong>{field.field_label}</strong> from the portal. The data will be preserved in the database and can be restored at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setArchiveDialogOpen(false);
                onArchive(field.id, field.field_label);
              }}
            >
              Archive Field
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function ArchivedFieldCard({
  field,
  onRestore,
}: {
  field: FieldEntry;
  onRestore: (id: string, label: string) => void;
}) {
  const [isRestoring, setIsRestoring] = useState(false);

  return (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 opacity-60">
      <div className="flex-1 min-w-0">
        <span className="text-[13px] font-medium text-foreground truncate block">
          {field.field_label}
        </span>
        <span className="text-[11px] font-mono text-muted-foreground">
          {field.field_key}
        </span>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 text-[10px] px-1.5 py-0 h-5 font-medium",
          TYPE_COLORS[field.field_type] ?? "bg-secondary text-secondary-foreground"
        )}
      >
        {field.field_type}
      </Badge>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-[12px] shrink-0"
        disabled={isRestoring}
        onClick={async () => {
          setIsRestoring(true);
          await onRestore(field.id, field.field_label);
          setIsRestoring(false);
        }}
      >
        {isRestoring ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.5} />
        ) : (
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
        Restore
      </Button>
    </div>
  );
}

function FieldCardOverlay({ field }: { field: FieldEntry }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg">
      <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-foreground truncate">
            {field.field_label}
          </span>
        </div>
        <span className="text-[11px] font-mono text-muted-foreground">
          {field.field_key}
        </span>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "shrink-0 text-[10px] px-1.5 py-0 h-5 font-medium",
          TYPE_COLORS[field.field_type] ?? "bg-secondary text-secondary-foreground"
        )}
      >
        {field.field_type}
      </Badge>
    </div>
  );
}

// ── Add Field Modal ──────────────────────────────────────────────────────────

interface AddFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultModule: string;
  onCreated: (row: FieldConfigRow) => void;
}

function AddFieldModal({ open, onOpenChange, defaultModule, onCreated }: AddFieldModalProps) {
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState("");
  const [module, setModule] = useState(defaultModule);
  const [columnPosition, setColumnPosition] = useState<"left" | "right">("left");
  const [dropdownOptionsText, setDropdownOptionsText] = useState("");
  const [formulaExpression, setFormulaExpression] = useState("");
  const [formulaSourceFieldsText, setFormulaSourceFieldsText] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const fieldKey = generateFieldKey(label);
  const keyError = label ? validateFieldKey(fieldKey) : null;

  const dropdownOptions = dropdownOptionsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const formulaSourceFields = formulaSourceFieldsText
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const isValid =
    label.trim().length > 0 &&
    keyError === null &&
    fieldType !== "" &&
    module !== "" &&
    columnPosition !== undefined &&
    (fieldType !== "dropdown" || dropdownOptions.length >= 2) &&
    (fieldType !== "formula" || (formulaExpression.trim().length > 0 && formulaSourceFields.length > 0));

  const handleSubmit = () => {
    if (!isValid) return;
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    setIsCreating(true);
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Not authenticated", variant: "destructive" });
        return;
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const response = await fetch(`${supabaseUrl}/functions/v1/create-field`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          module,
          field_key: fieldKey,
          field_label: label.trim(),
          field_type: fieldType,
          column_position: columnPosition,
          dropdown_options: fieldType === "dropdown" ? dropdownOptions : null,
          formula_expression: fieldType === "formula" ? formulaExpression.trim() : null,
          formula_source_fields: fieldType === "formula" ? formulaSourceFields : null,
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        toast({
          title: "Error creating field",
          description: result.error ?? "Unknown error",
          variant: "destructive",
        });
        return;
      }

      setConfirmOpen(false);
      onOpenChange(false);
      onCreated(result.field as FieldConfigRow);
      toast({ title: `${label.trim()} created successfully` });

      // Reset form
      setLabel("");
      setFieldType("");
      setModule(defaultModule);
      setColumnPosition("left");
      setDropdownOptionsText("");
      setFormulaExpression("");
      setFormulaSourceFieldsText("");
    } finally {
      setIsCreating(false);
    }
  };

  const tableLabel = MODULE_TABLE_LABELS[module] ?? module;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Field</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Field Label */}
            <div className="space-y-1.5">
              <Label htmlFor="field-label" className="text-[13px]">Field Label <span className="text-destructive">*</span></Label>
              <Input
                id="field-label"
                placeholder="e.g. Insurance Provider"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="h-9 text-[13px]"
              />
              {label && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground">API key:</span>
                  <code className="text-[11px] font-mono text-foreground bg-muted px-1.5 py-0.5 rounded">
                    {fieldKey || "—"}
                  </code>
                  {keyError && (
                    <span className="text-[11px] text-destructive">{keyError}</span>
                  )}
                </div>
              )}
            </div>

            {/* Field Type */}
            <div className="space-y-1.5">
              <Label htmlFor="field-type" className="text-[13px]">Field Type <span className="text-destructive">*</span></Label>
              <Select value={fieldType} onValueChange={setFieldType}>
                <SelectTrigger id="field-type" className="h-9 text-[13px]">
                  <SelectValue placeholder="Select a type..." />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-[13px]">
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dropdown Options (conditional) */}
            {fieldType === "dropdown" && (
              <div className="space-y-1.5">
                <Label htmlFor="dropdown-options" className="text-[13px]">
                  Dropdown Options <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="dropdown-options"
                  placeholder={"Option A\nOption B\nOption C"}
                  value={dropdownOptionsText}
                  onChange={(e) => setDropdownOptionsText(e.target.value)}
                  className="text-[13px] min-h-[100px] resize-none"
                />
                <p className="text-[11px] text-muted-foreground">Enter one option per line</p>
                {dropdownOptionsText && dropdownOptions.length < 2 && (
                  <p className="text-[11px] text-destructive">At least 2 options required</p>
                )}
              </div>
            )}

            {/* Formula Configuration (conditional) */}
            {fieldType === "formula" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="formula-expression" className="text-[13px]">
                    Formula Expression <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="formula-expression"
                    placeholder={"{loan_amount} * {interest_rate} / 100"}
                    value={formulaExpression}
                    onChange={(e) => setFormulaExpression(e.target.value)}
                    className="text-[13px] min-h-[80px] resize-none font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Use <code className="bg-muted px-1 rounded text-[10px]">{"{field_key}"}</code> to reference other fields. Supports +, -, *, /, and parentheses.
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="formula-source-fields" className="text-[13px]">
                    Source Fields <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    id="formula-source-fields"
                    placeholder={"loan_amount\ninterest_rate"}
                    value={formulaSourceFieldsText}
                    onChange={(e) => setFormulaSourceFieldsText(e.target.value)}
                    className="text-[13px] min-h-[80px] resize-none font-mono"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Enter one field_key per line. These are the fields this formula reads from.
                  </p>
                  {formulaSourceFieldsText && formulaSourceFields.length === 0 && (
                    <p className="text-[11px] text-destructive">At least 1 source field required</p>
                  )}
                </div>
              </>
            )}

            {/* Module */}
            <div className="space-y-1.5">
              <Label htmlFor="field-module" className="text-[13px]">Module <span className="text-destructive">*</span></Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger id="field-module" className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MODULES.map((m) => (
                    <SelectItem key={m.key} value={m.key} className="text-[13px]">
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Column */}
            <div className="space-y-1.5">
              <Label htmlFor="field-column" className="text-[13px]">Column <span className="text-destructive">*</span></Label>
              <Select value={columnPosition} onValueChange={(v) => setColumnPosition(v as "left" | "right")}>
                <SelectTrigger id="field-column" className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left" className="text-[13px]">Left</SelectItem>
                  <SelectItem value="right" className="text-[13px]">Right</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSubmit} disabled={!isValid}>
              Create Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create {label.trim()}?</AlertDialogTitle>
            <AlertDialogDescription className="sr-only">Confirm field creation details</AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3 text-[13px] text-sm text-muted-foreground px-1">
            <div className="rounded-md border border-border bg-muted/50 p-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Field name</span>
                <span className="font-medium text-foreground">{label.trim()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">API key</span>
                <code className="font-mono text-[12px] text-foreground">{fieldKey}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium text-foreground">{FIELD_TYPES.find((t) => t.value === fieldType)?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Module</span>
                <span className="font-medium text-foreground">{MODULE_LABELS[module]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Database table</span>
                <code className="font-mono text-[12px] text-foreground">{tableLabel}</code>
              </div>
            </div>
            {fieldType === "formula" && (
              <div className="rounded-md border border-border bg-muted/50 p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expression</span>
                  <code className="font-mono text-[12px] text-foreground max-w-[200px] truncate">{formulaExpression}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reads from</span>
                  <span className="font-mono text-[12px] text-foreground">{formulaSourceFields.join(", ")}</span>
                </div>
              </div>
            )}
            <p className="text-muted-foreground text-[12px]">
              {fieldType === "formula"
                ? "This creates a calculated field. No database column will be added -- the value is computed from other fields at render time."
                : <>This will add a new column to the <strong className="text-foreground">{tableLabel}</strong> table. This action cannot be undone from this interface.</>}
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCreating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={isCreating}
            >
              {isCreating ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Creating...
                </span>
              ) : (
                "Confirm & Create"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
