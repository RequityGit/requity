"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Plus,
  Copy,
  Archive,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Loader2,
  Building2,
  Home,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useToast } from "@/components/ui/use-toast";
import type {
  UnifiedCardType,
  CardMetricDef,
  UwFieldDef,
  UwOutputDef,
  FieldGroupDef,
  CapitalSide,
  CardTypeStatus,
} from "@/components/pipeline-v2/pipeline-types";
import {
  createCardType,
  duplicateCardType,
  saveCardType,
  archiveCardType,
  deleteCardType,
} from "./actions";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CAPITAL_SIDE_COLORS: Record<CapitalSide, string> = {
  debt: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  equity: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const STATUS_COLORS: Record<CardTypeStatus, string> = {
  active: "bg-green-500/10 text-green-600",
  draft: "bg-amber-500/10 text-amber-600",
  planned: "bg-blue-500/10 text-blue-600",
  archived: "bg-zinc-500/10 text-zinc-500",
};

const FIELD_TYPES = [
  "currency",
  "percent",
  "number",
  "text",
  "boolean",
  "select",
  "date",
] as const;

const OUTPUT_TYPES = ["currency", "percent", "ratio"] as const;

const METRIC_FORMATS = ["", "compact"] as const;

const ASSET_CLASSES = [
  { value: "sfr", label: "SFR" },
  { value: "duplex_fourplex", label: "Duplex/Fourplex" },
  { value: "multifamily", label: "Multifamily" },
  { value: "mhc", label: "MHC" },
  { value: "rv_park", label: "RV Park" },
  { value: "campground", label: "Campground" },
  { value: "commercial", label: "Commercial" },
  { value: "mixed_use", label: "Mixed Use" },
  { value: "land", label: "Land" },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

interface CardTypeManagerViewProps {
  initialCardTypes: UnifiedCardType[];
}

export function CardTypeManagerView({
  initialCardTypes,
}: CardTypeManagerViewProps) {
  const { toast } = useToast();
  const [cardTypes, setCardTypes] = useState(initialCardTypes);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialCardTypes[0]?.id ?? null
  );
  const [saving, setSaving] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Local edits (working copy of selected card type)
  const [edits, setEdits] = useState<UnifiedCardType | null>(
    initialCardTypes[0] ?? null
  );

  const selected = cardTypes.find((ct) => ct.id === selectedId) ?? null;

  const activeTypes = cardTypes.filter((ct) => ct.status !== "archived");
  const archivedTypes = cardTypes.filter((ct) => ct.status === "archived");

  // Select a card type and load its edits
  const selectCardType = useCallback(
    (id: string) => {
      setSelectedId(id);
      const ct = cardTypes.find((c) => c.id === id);
      setEdits(ct ? { ...ct } : null);
    },
    [cardTypes]
  );

  // ---------------------------------------------------------------------------
  // Save
  // ---------------------------------------------------------------------------

  const handleSave = async () => {
    if (!edits || !selectedId) return;
    setSaving(true);
    const result = await saveCardType(selectedId, {
      label: edits.label,
      slug: edits.slug,
      description: edits.description,
      capital_side: edits.capital_side,
      category: edits.category,
      card_icon: edits.card_icon,
      card_metrics: edits.card_metrics,
      uw_fields: edits.uw_fields,
      uw_outputs: edits.uw_outputs,
      detail_field_groups: edits.detail_field_groups,
      detail_tabs: edits.detail_tabs,
      property_fields: edits.property_fields,
      property_field_groups: edits.property_field_groups,
      contact_fields: edits.contact_fields,
      contact_field_groups: edits.contact_field_groups,
      contact_roles: edits.contact_roles,
      applicable_asset_classes: edits.applicable_asset_classes,
      status: edits.status,
      uw_model_key: edits.uw_model_key,
    });
    setSaving(false);

    if (result.error) {
      toast({
        variant: "destructive",
        title: "Save failed",
        description: result.error,
      });
      return;
    }

    // Update local state
    setCardTypes((prev) =>
      prev.map((ct) => (ct.id === selectedId ? { ...edits } : ct))
    );
    toast({ title: "Card type saved", description: `${edits.label} updated.` });
  };

  // ---------------------------------------------------------------------------
  // Create
  // ---------------------------------------------------------------------------

  const handleCreate = async (data: {
    label: string;
    slug: string;
    capital_side: CapitalSide;
    category: string;
    template_id?: string;
  }) => {
    const result = await createCardType(data);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Create failed",
        description: result.error,
      });
      return;
    }
    if (result.data) {
      setCardTypes((prev) => [...prev, result.data!]);
      selectCardType(result.data.id);
      toast({
        title: "Card type created",
        description: `${result.data.label} created as draft.`,
      });
    }
    setShowNew(false);
  };

  // ---------------------------------------------------------------------------
  // Duplicate
  // ---------------------------------------------------------------------------

  const handleDuplicate = async (id: string) => {
    const result = await duplicateCardType(id);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Duplicate failed",
        description: result.error,
      });
      return;
    }
    if (result.data) {
      setCardTypes((prev) => [...prev, result.data!]);
      selectCardType(result.data.id);
      toast({
        title: "Card type duplicated",
        description: `${result.data.label} created.`,
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Archive
  // ---------------------------------------------------------------------------

  const handleArchive = async (id: string) => {
    const result = await archiveCardType(id);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Archive failed",
        description: result.error,
      });
      return;
    }
    setCardTypes((prev) =>
      prev.map((ct) =>
        ct.id === id ? { ...ct, status: "archived" as CardTypeStatus } : ct
      )
    );
    if (selectedId === id) {
      const remaining = activeTypes.filter((ct) => ct.id !== id);
      if (remaining.length > 0) {
        selectCardType(remaining[0].id);
      } else {
        setSelectedId(null);
        setEdits(null);
      }
    }
    toast({ title: "Card type archived" });
  };

  // ---------------------------------------------------------------------------
  // Delete
  // ---------------------------------------------------------------------------

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const result = await deleteCardType(deleteTarget);
    if (result.error) {
      toast({
        variant: "destructive",
        title: "Delete failed",
        description: result.error,
      });
      setDeleteTarget(null);
      return;
    }
    setCardTypes((prev) => prev.filter((ct) => ct.id !== deleteTarget));
    if (selectedId === deleteTarget) {
      const remaining = cardTypes.filter((ct) => ct.id !== deleteTarget);
      if (remaining.length > 0) {
        selectCardType(remaining[0].id);
      } else {
        setSelectedId(null);
        setEdits(null);
      }
    }
    setDeleteTarget(null);
    toast({ title: "Card type deleted" });
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="flex gap-6 min-h-[600px]">
      {/* Left Panel: Card Type List */}
      <div className="w-[280px] shrink-0 space-y-3">
        <Button
          size="sm"
          className="w-full"
          onClick={() => setShowNew(true)}
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          New Card Type
        </Button>

        <div className="space-y-1">
          {activeTypes.map((ct) => (
            <CardTypeListItem
              key={ct.id}
              cardType={ct}
              isSelected={ct.id === selectedId}
              onClick={() => selectCardType(ct.id)}
              onDuplicate={() => handleDuplicate(ct.id)}
              onArchive={() => handleArchive(ct.id)}
            />
          ))}
        </div>

        {archivedTypes.length > 0 && (
          <div>
            <button
              onClick={() => setShowArchived(!showArchived)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground w-full px-2 py-1"
            >
              {showArchived ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              Archived ({archivedTypes.length})
            </button>
            {showArchived && (
              <div className="space-y-1 mt-1">
                {archivedTypes.map((ct) => (
                  <CardTypeListItem
                    key={ct.id}
                    cardType={ct}
                    isSelected={ct.id === selectedId}
                    onClick={() => selectCardType(ct.id)}
                    onDuplicate={() => handleDuplicate(ct.id)}
                    onDelete={() => setDeleteTarget(ct.id)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Panel: Editor */}
      <div className="flex-1 min-w-0">
        {edits ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{edits.label}</h2>
                <p className="text-sm text-muted-foreground">
                  {edits.slug} &middot;{" "}
                  <span
                    className={cn(
                      "text-xs px-1.5 py-0.5 rounded",
                      STATUS_COLORS[edits.status]
                    )}
                  >
                    {edits.status}
                  </span>
                </p>
              </div>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="metrics">
              <TabsList>
                <TabsTrigger value="metrics">Card Metrics</TabsTrigger>
                <TabsTrigger value="overview">Overview Tab</TabsTrigger>
                <TabsTrigger value="property">Property Tab</TabsTrigger>
                <TabsTrigger value="contacts">Contacts Tab</TabsTrigger>
                <TabsTrigger value="uw-fields">UW Fields</TabsTrigger>
                <TabsTrigger value="outputs">Computed Outputs</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="metrics" className="mt-4">
                <CardMetricsEditor
                  metrics={edits.card_metrics}
                  uwFields={edits.uw_fields}
                  uwOutputs={edits.uw_outputs}
                  onChange={(m) => setEdits({ ...edits, card_metrics: m })}
                />
              </TabsContent>

              <TabsContent value="uw-fields" className="mt-4">
                <UwFieldsEditor
                  fields={edits.uw_fields}
                  onChange={(f) => setEdits({ ...edits, uw_fields: f })}
                />
              </TabsContent>

              <TabsContent value="outputs" className="mt-4">
                <UwOutputsEditor
                  outputs={edits.uw_outputs}
                  onChange={(o) => setEdits({ ...edits, uw_outputs: o })}
                />
              </TabsContent>

              <TabsContent value="overview" className="mt-4">
                <DetailGroupsEditor
                  groups={edits.detail_field_groups}
                  uwFields={edits.uw_fields}
                  onChange={(g) =>
                    setEdits({ ...edits, detail_field_groups: g })
                  }
                />
              </TabsContent>

              <TabsContent value="property" className="mt-4">
                <FieldsAndGroupsEditor
                  description="Define property-related fields for this card type. These appear in the Property tab on deal details."
                  fields={edits.property_fields}
                  fieldGroups={edits.property_field_groups}
                  onFieldsChange={(f) =>
                    setEdits({ ...edits, property_fields: f })
                  }
                  onGroupsChange={(g) =>
                    setEdits({ ...edits, property_field_groups: g })
                  }
                />
              </TabsContent>

              <TabsContent value="contacts" className="mt-4">
                <div className="space-y-6">
                  <ContactRolesEditor
                    roles={edits.contact_roles}
                    onChange={(r) =>
                      setEdits({ ...edits, contact_roles: r })
                    }
                  />
                  <FieldsAndGroupsEditor
                    description="Define contact-related financial fields (e.g., borrower net worth, liquidity). These appear in the Contacts tab alongside linked contacts."
                    fields={edits.contact_fields}
                    fieldGroups={edits.contact_field_groups}
                    onFieldsChange={(f) =>
                      setEdits({ ...edits, contact_fields: f })
                    }
                    onGroupsChange={(g) =>
                      setEdits({ ...edits, contact_field_groups: g })
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <SettingsEditor
                  edits={edits}
                  onChange={setEdits}
                  onDelete={() => setDeleteTarget(edits.id)}
                />
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[400px] text-muted-foreground text-sm">
            Select a card type to edit
          </div>
        )}
      </div>

      {/* New Card Type Dialog */}
      <NewCardTypeDialog
        open={showNew}
        onClose={() => setShowNew(false)}
        onCreate={handleCreate}
        existingTypes={cardTypes}
      />

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete card type?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the card type. This action cannot be
              undone. Only card types with no linked deals can be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card Type List Item
// ---------------------------------------------------------------------------

function CardTypeListItem({
  cardType,
  isSelected,
  onClick,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  cardType: UnifiedCardType;
  isSelected: boolean;
  onClick: () => void;
  onDuplicate: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center justify-between rounded-lg border px-3 py-2.5 cursor-pointer transition-all group",
        isSelected
          ? "border-foreground bg-accent"
          : "border-transparent hover:border-border hover:bg-accent/50"
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{cardType.label}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Badge
              variant="outline"
              className={cn(
                "text-[9px] px-1 py-0",
                CAPITAL_SIDE_COLORS[cardType.capital_side]
              )}
            >
              {cardType.capital_side}
            </Badge>
            <span
              className={cn(
                "text-[9px] px-1 py-0 rounded",
                STATUS_COLORS[cardType.status]
              )}
            >
              {cardType.status}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="p-1 rounded hover:bg-accent"
          title="Duplicate"
        >
          <Copy className="h-3 w-3 text-muted-foreground" />
        </button>
        {onArchive && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onArchive();
            }}
            className="p-1 rounded hover:bg-accent"
            title="Archive"
          >
            <Archive className="h-3 w-3 text-muted-foreground" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 rounded hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-3 w-3 text-destructive" />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// New Card Type Dialog
// ---------------------------------------------------------------------------

function NewCardTypeDialog({
  open,
  onClose,
  onCreate,
  existingTypes,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (data: {
    label: string;
    slug: string;
    capital_side: CapitalSide;
    category: string;
    template_id?: string;
  }) => void;
  existingTypes: UnifiedCardType[];
}) {
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [capitalSide, setCapitalSide] = useState<CapitalSide>("debt");
  const [category, setCategory] = useState("");
  const [templateId, setTemplateId] = useState<string>("");

  const autoSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "");

  const handleSubmit = () => {
    if (!label.trim()) return;
    onCreate({
      label: label.trim(),
      slug: slug.trim() || autoSlug(label),
      capital_side: capitalSide,
      category: category.trim(),
      template_id: templateId || undefined,
    });
    setLabel("");
    setSlug("");
    setCapitalSide("debt");
    setCategory("");
    setTemplateId("");
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>New Card Type</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input
              value={label}
              onChange={(e) => {
                setLabel(e.target.value);
                if (!slug) setSlug(autoSlug(e.target.value));
              }}
              placeholder="e.g. Bridge Loan"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Slug</Label>
            <Input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="auto-generated from name"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Capital Side</Label>
            <Select
              value={capitalSide}
              onValueChange={(v) => setCapitalSide(v as CapitalSide)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debt">Debt</SelectItem>
                <SelectItem value="equity">Equity</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. residential, commercial"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Clone from (optional)</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Start blank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Start blank</SelectItem>
                {existingTypes
                  .filter((ct) => ct.status === "active")
                  .map((ct) => (
                    <SelectItem key={ct.id} value={ct.id}>
                      {ct.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!label.trim()}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Card Metrics Editor
// ---------------------------------------------------------------------------

function CardMetricsEditor({
  metrics,
  uwFields,
  uwOutputs,
  onChange,
}: {
  metrics: CardMetricDef[];
  uwFields: UwFieldDef[];
  uwOutputs: UwOutputDef[];
  onChange: (metrics: CardMetricDef[]) => void;
}) {
  const allKeys = [
    ...uwFields.map((f) => ({ key: f.key, label: f.label, computed: false })),
    ...uwOutputs.map((o) => ({ key: o.key, label: o.label, computed: true })),
  ];

  const addMetric = () => {
    onChange([...metrics, { key: "", label: "", computed: false }]);
  };

  const updateMetric = (idx: number, updates: Partial<CardMetricDef>) => {
    const next = metrics.map((m, i) => (i === idx ? { ...m, ...updates } : m));
    onChange(next);
  };

  const removeMetric = (idx: number) => {
    onChange(metrics.filter((_, i) => i !== idx));
  };

  const moveMetric = (idx: number, dir: -1 | 1) => {
    const next = [...metrics];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Configure the metrics that appear on pipeline Kanban cards. These show as
        a subtitle line below the deal amount.
      </p>

      <div className="space-y-2">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-lg border p-3"
          >
            <div className="flex flex-col gap-0.5">
              <button
                onClick={() => moveMetric(idx, -1)}
                disabled={idx === 0}
                className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
              >
                <ArrowUp className="h-3 w-3" />
              </button>
              <button
                onClick={() => moveMetric(idx, 1)}
                disabled={idx === metrics.length - 1}
                className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
              >
                <ArrowDown className="h-3 w-3" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-5 gap-2">
              <Select
                value={m.key}
                onValueChange={(v) => {
                  const match = allKeys.find((k) => k.key === v);
                  updateMetric(idx, {
                    key: v,
                    computed: match?.computed ?? false,
                  });
                }}
              >
                <SelectTrigger className="col-span-2">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {allKeys.map((k) => (
                    <SelectItem key={k.key} value={k.key}>
                      {k.label} {k.computed ? "(calc)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                value={m.label ?? ""}
                onChange={(e) => updateMetric(idx, { label: e.target.value })}
                placeholder="Label"
                className="text-xs"
              />

              <Input
                value={m.suffix ?? ""}
                onChange={(e) => updateMetric(idx, { suffix: e.target.value })}
                placeholder="Suffix (%, x)"
                className="text-xs"
              />

              <Select
                value={m.format ?? ""}
                onValueChange={(v) =>
                  updateMetric(idx, {
                    format: v === "compact" ? "compact" : undefined,
                  })
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="compact">Compact ($1.2M)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <button
              onClick={() => removeMetric(idx)}
              className="p-1 rounded hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addMetric}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Metric
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// UW Fields Editor
// ---------------------------------------------------------------------------

function UwFieldsEditor({
  fields,
  onChange,
}: {
  fields: UwFieldDef[];
  onChange: (fields: UwFieldDef[]) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? fields.filter(
        (f) =>
          f.key.includes(search.toLowerCase()) ||
          f.label.toLowerCase().includes(search.toLowerCase())
      )
    : fields;

  const addField = () => {
    onChange([
      ...fields,
      { key: "", label: "", type: "text" },
    ]);
  };

  const updateField = (idx: number, updates: Partial<UwFieldDef>) => {
    const next = fields.map((f, i) => (i === idx ? { ...f, ...updates } : f));
    onChange(next);
  };

  const removeField = (idx: number) => {
    onChange(fields.filter((_, i) => i !== idx));
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const next = [...fields];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Underwriting fields stored in the deal&apos;s uw_data JSONB column.
        </p>
        <span className="text-xs text-muted-foreground">
          {fields.length} fields
        </span>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search fields..."
          className="pl-8 text-sm"
        />
      </div>

      <ScrollArea className="h-[400px]">
        <div className="space-y-1.5">
          {filtered.map((f, idx) => {
            const realIdx = fields.indexOf(f);
            return (
              <div
                key={realIdx}
                className="flex items-center gap-2 rounded-lg border p-2.5"
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveField(realIdx, -1)}
                    disabled={realIdx === 0}
                    className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveField(realIdx, 1)}
                    disabled={realIdx === fields.length - 1}
                    className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-4 gap-2">
                  <Input
                    value={f.key}
                    onChange={(e) =>
                      updateField(realIdx, { key: e.target.value })
                    }
                    placeholder="key"
                    className="text-xs font-mono"
                  />
                  <Input
                    value={f.label}
                    onChange={(e) =>
                      updateField(realIdx, { label: e.target.value })
                    }
                    placeholder="Label"
                    className="text-xs"
                  />
                  <Select
                    value={f.type}
                    onValueChange={(v) =>
                      updateField(realIdx, {
                        type: v as UwFieldDef["type"],
                      })
                    }
                  >
                    <SelectTrigger className="text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={f.required ?? false}
                      onCheckedChange={(v) =>
                        updateField(realIdx, { required: v })
                      }
                    />
                    <span className="text-[10px] text-muted-foreground">
                      Req
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeField(realIdx)}
                  className="p-1 rounded hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <Button variant="outline" size="sm" onClick={addField}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Field
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Computed Outputs Editor
// ---------------------------------------------------------------------------

function UwOutputsEditor({
  outputs,
  onChange,
}: {
  outputs: UwOutputDef[];
  onChange: (outputs: UwOutputDef[]) => void;
}) {
  const addOutput = () => {
    onChange([...outputs, { key: "", label: "", type: "percent" }]);
  };

  const updateOutput = (idx: number, updates: Partial<UwOutputDef>) => {
    const next = outputs.map((o, i) => (i === idx ? { ...o, ...updates } : o));
    onChange(next);
  };

  const removeOutput = (idx: number) => {
    onChange(outputs.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Computed metrics calculated from UW field values. Used in the
        underwriting summary and available as card metrics.
      </p>

      <div className="space-y-2">
        {outputs.map((o, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 rounded-lg border p-3"
          >
            <div className="flex-1 grid grid-cols-4 gap-2">
              <Input
                value={o.key}
                onChange={(e) => updateOutput(idx, { key: e.target.value })}
                placeholder="key"
                className="text-xs font-mono"
              />
              <Input
                value={o.label}
                onChange={(e) => updateOutput(idx, { label: e.target.value })}
                placeholder="Label"
                className="text-xs"
              />
              <Select
                value={o.type}
                onValueChange={(v) =>
                  updateOutput(idx, {
                    type: v as UwOutputDef["type"],
                  })
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={o.formula ?? ""}
                onChange={(e) =>
                  updateOutput(idx, { formula: e.target.value })
                }
                placeholder="formula (e.g. noi / price * 100)"
                className="text-xs font-mono"
              />
            </div>

            <button
              onClick={() => removeOutput(idx)}
              className="p-1 rounded hover:bg-destructive/10"
            >
              <X className="h-3.5 w-3.5 text-destructive" />
            </button>
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addOutput}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Output
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Detail Field Groups Editor
// ---------------------------------------------------------------------------

function DetailGroupsEditor({
  groups,
  uwFields,
  onChange,
}: {
  groups: FieldGroupDef[];
  uwFields: UwFieldDef[];
  onChange: (groups: FieldGroupDef[]) => void;
}) {
  const addGroup = () => {
    onChange([...groups, { label: "", fields: [] }]);
  };

  const updateGroup = (idx: number, updates: Partial<FieldGroupDef>) => {
    const next = groups.map((g, i) => (i === idx ? { ...g, ...updates } : g));
    onChange(next);
  };

  const removeGroup = (idx: number) => {
    onChange(groups.filter((_, i) => i !== idx));
  };

  const moveGroup = (idx: number, dir: -1 | 1) => {
    const next = [...groups];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onChange(next);
  };

  const toggleField = (groupIdx: number, fieldKey: string) => {
    const group = groups[groupIdx];
    const hasField = group.fields.includes(fieldKey);
    const updatedFields = hasField
      ? group.fields.filter((f) => f !== fieldKey)
      : [...group.fields, fieldKey];
    updateGroup(groupIdx, { fields: updatedFields });
  };

  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Organize UW fields into labeled groups for the deal detail Overview tab.
      </p>

      <div className="space-y-2">
        {groups.map((g, idx) => (
          <div key={idx} className="rounded-lg border">
            <div className="flex items-center gap-2 p-3">
              <div className="flex flex-col gap-0.5">
                <button
                  onClick={() => moveGroup(idx, -1)}
                  disabled={idx === 0}
                  className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                >
                  <ArrowUp className="h-3 w-3" />
                </button>
                <button
                  onClick={() => moveGroup(idx, 1)}
                  disabled={idx === groups.length - 1}
                  className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                >
                  <ArrowDown className="h-3 w-3" />
                </button>
              </div>

              <Input
                value={g.label}
                onChange={(e) => updateGroup(idx, { label: e.target.value })}
                placeholder="Group label"
                className="text-sm flex-1"
              />

              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {g.fields.length} fields
              </span>

              <button
                onClick={() =>
                  setExpandedGroup(expandedGroup === idx ? null : idx)
                }
                className="p-1 rounded hover:bg-accent"
              >
                {expandedGroup === idx ? (
                  <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5" />
                )}
              </button>

              <button
                onClick={() => removeGroup(idx)}
                className="p-1 rounded hover:bg-destructive/10"
              >
                <X className="h-3.5 w-3.5 text-destructive" />
              </button>
            </div>

            {expandedGroup === idx && (
              <div className="border-t px-3 py-2">
                <div className="grid grid-cols-3 gap-1">
                  {uwFields.map((f) => {
                    const selected = g.fields.includes(f.key);
                    return (
                      <button
                        key={f.key}
                        onClick={() => toggleField(idx, f.key)}
                        className={cn(
                          "text-left text-xs px-2 py-1 rounded transition-colors",
                          selected
                            ? "bg-primary/10 text-primary font-medium"
                            : "text-muted-foreground hover:bg-accent"
                        )}
                      >
                        {f.label || f.key}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <Button variant="outline" size="sm" onClick={addGroup}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add Group
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings Editor
// ---------------------------------------------------------------------------

function SettingsEditor({
  edits,
  onChange,
  onDelete,
}: {
  edits: UnifiedCardType;
  onChange: (ct: UnifiedCardType) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-6 max-w-xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Label</Label>
          <Input
            value={edits.label}
            onChange={(e) => onChange({ ...edits, label: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Slug</Label>
          <Input
            value={edits.slug}
            onChange={(e) => onChange({ ...edits, slug: e.target.value })}
            className="font-mono text-sm"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={edits.description ?? ""}
          onChange={(e) => onChange({ ...edits, description: e.target.value })}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Capital Side</Label>
          <Select
            value={edits.capital_side}
            onValueChange={(v) =>
              onChange({ ...edits, capital_side: v as CapitalSide })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="debt">Debt</SelectItem>
              <SelectItem value="equity">Equity</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Input
            value={edits.category}
            onChange={(e) => onChange({ ...edits, category: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>UW Model Key</Label>
          <Input
            value={edits.uw_model_key}
            onChange={(e) =>
              onChange({ ...edits, uw_model_key: e.target.value })
            }
            className="font-mono text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Card Icon</Label>
          <Input
            value={edits.card_icon}
            onChange={(e) => onChange({ ...edits, card_icon: e.target.value })}
            placeholder="building-2, home"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Select
          value={edits.status}
          onValueChange={(v) =>
            onChange({ ...edits, status: v as CardTypeStatus })
          }
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="planned">Planned</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Applicable Asset Classes</Label>
        <div className="flex flex-wrap gap-1.5 mt-1">
          {ASSET_CLASSES.map((ac) => {
            const selected = (edits.applicable_asset_classes ?? []).includes(
              ac.value
            );
            return (
              <button
                key={ac.value}
                onClick={() => {
                  const current = edits.applicable_asset_classes ?? [];
                  const next = selected
                    ? current.filter((v) => v !== ac.value)
                    : [...current, ac.value];
                  onChange({
                    ...edits,
                    applicable_asset_classes: next.length > 0 ? next : null,
                  });
                }}
                className={cn(
                  "text-xs px-2 py-1 rounded-full border transition-colors",
                  selected
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-foreground/20"
                )}
              >
                {ac.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="border-t pt-6 mt-6">
        <h3 className="text-sm font-medium text-destructive mb-2">
          Danger Zone
        </h3>
        <p className="text-xs text-muted-foreground mb-3">
          Permanently delete this card type. Only possible if no deals reference
          it.
        </p>
        <Button variant="destructive" size="sm" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete Card Type
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fields & Groups Editor (reusable for Property Tab and Contacts Tab)
// ---------------------------------------------------------------------------

function FieldsAndGroupsEditor({
  description,
  fields,
  fieldGroups,
  onFieldsChange,
  onGroupsChange,
}: {
  description: string;
  fields: UwFieldDef[];
  fieldGroups: FieldGroupDef[];
  onFieldsChange: (fields: UwFieldDef[]) => void;
  onGroupsChange: (groups: FieldGroupDef[]) => void;
}) {
  const [search, setSearch] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);

  const filtered = search
    ? fields.filter(
        (f) =>
          f.key.includes(search.toLowerCase()) ||
          f.label.toLowerCase().includes(search.toLowerCase())
      )
    : fields;

  const addField = () => {
    onFieldsChange([...fields, { key: "", label: "", type: "text" }]);
  };

  const updateField = (idx: number, updates: Partial<UwFieldDef>) => {
    const next = fields.map((f, i) => (i === idx ? { ...f, ...updates } : f));
    onFieldsChange(next);
  };

  const removeField = (idx: number) => {
    onFieldsChange(fields.filter((_, i) => i !== idx));
  };

  const moveField = (idx: number, dir: -1 | 1) => {
    const next = [...fields];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onFieldsChange(next);
  };

  const addGroup = () => {
    onGroupsChange([...fieldGroups, { label: "", fields: [] }]);
  };

  const updateGroup = (idx: number, updates: Partial<FieldGroupDef>) => {
    const next = fieldGroups.map((g, i) =>
      i === idx ? { ...g, ...updates } : g
    );
    onGroupsChange(next);
  };

  const removeGroup = (idx: number) => {
    onGroupsChange(fieldGroups.filter((_, i) => i !== idx));
  };

  const moveGroup = (idx: number, dir: -1 | 1) => {
    const next = [...fieldGroups];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    onGroupsChange(next);
  };

  const toggleField = (groupIdx: number, fieldKey: string) => {
    const group = fieldGroups[groupIdx];
    const hasField = group.fields.includes(fieldKey);
    const updatedFields = hasField
      ? group.fields.filter((f) => f !== fieldKey)
      : [...group.fields, fieldKey];
    updateGroup(groupIdx, { fields: updatedFields });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{description}</p>

      {/* Fields Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Fields</h4>
          <span className="text-xs text-muted-foreground">
            {fields.length} fields
          </span>
        </div>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search fields..."
            className="pl-8 text-sm"
          />
        </div>

        <ScrollArea className={fields.length > 6 ? "h-[300px]" : ""}>
          <div className="space-y-1.5">
            {filtered.map((f, idx) => {
              const realIdx = fields.indexOf(f);
              return (
                <div
                  key={realIdx}
                  className="flex items-center gap-2 rounded-lg border p-2.5"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveField(realIdx, -1)}
                      disabled={realIdx === 0}
                      className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveField(realIdx, 1)}
                      disabled={realIdx === fields.length - 1}
                      className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <Input
                      value={f.key}
                      onChange={(e) =>
                        updateField(realIdx, { key: e.target.value })
                      }
                      placeholder="key"
                      className="text-xs font-mono"
                    />
                    <Input
                      value={f.label}
                      onChange={(e) =>
                        updateField(realIdx, { label: e.target.value })
                      }
                      placeholder="Label"
                      className="text-xs"
                    />
                    <Select
                      value={f.type}
                      onValueChange={(v) =>
                        updateField(realIdx, {
                          type: v as UwFieldDef["type"],
                        })
                      }
                    >
                      <SelectTrigger className="text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={f.required ?? false}
                        onCheckedChange={(v) =>
                          updateField(realIdx, { required: v })
                        }
                      />
                      <span className="text-[10px] text-muted-foreground">
                        Req
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeField(realIdx)}
                    className="p-1 rounded hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5 text-destructive" />
                  </button>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <Button variant="outline" size="sm" onClick={addField}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Field
        </Button>
      </div>

      {/* Groups Section */}
      <div className="space-y-4 border-t pt-4">
        <h4 className="text-sm font-medium">Field Groups</h4>
        <p className="text-sm text-muted-foreground">
          Organize fields into labeled sections for display.
        </p>

        <div className="space-y-2">
          {fieldGroups.map((g, idx) => (
            <div key={idx} className="rounded-lg border">
              <div className="flex items-center gap-2 p-3">
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveGroup(idx, -1)}
                    disabled={idx === 0}
                    className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveGroup(idx, 1)}
                    disabled={idx === fieldGroups.length - 1}
                    className="p-0.5 hover:bg-accent rounded disabled:opacity-30"
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                </div>

                <Input
                  value={g.label}
                  onChange={(e) => updateGroup(idx, { label: e.target.value })}
                  placeholder="Group label"
                  className="text-sm flex-1"
                />

                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {g.fields.length} fields
                </span>

                <button
                  onClick={() =>
                    setExpandedGroup(expandedGroup === idx ? null : idx)
                  }
                  className="p-1 rounded hover:bg-accent"
                >
                  {expandedGroup === idx ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>

                <button
                  onClick={() => removeGroup(idx)}
                  className="p-1 rounded hover:bg-destructive/10"
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>

              {expandedGroup === idx && (
                <div className="border-t px-3 py-2">
                  <div className="grid grid-cols-3 gap-1">
                    {fields.map((f) => {
                      const selected = g.fields.includes(f.key);
                      return (
                        <button
                          key={f.key}
                          onClick={() => toggleField(idx, f.key)}
                          className={cn(
                            "text-left text-xs px-2 py-1 rounded transition-colors",
                            selected
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:bg-accent"
                          )}
                        >
                          {f.label || f.key}
                        </button>
                      );
                    })}
                  </div>
                  {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground py-2">
                      Add fields above first, then assign them to groups.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <Button variant="outline" size="sm" onClick={addGroup}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Group
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Contact Roles Editor
// ---------------------------------------------------------------------------

const CONTACT_ROLE_OPTIONS = [
  { value: "borrower", label: "Borrower" },
  { value: "guarantor", label: "Guarantor" },
  { value: "sponsor", label: "Sponsor" },
  { value: "attorney", label: "Attorney" },
  { value: "broker", label: "Broker" },
  { value: "property_manager", label: "Property Manager" },
];

function ContactRolesEditor({
  roles,
  onChange,
}: {
  roles: string[];
  onChange: (roles: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium">Contact Roles</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Select which contact roles are relevant for this card type.
        </p>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CONTACT_ROLE_OPTIONS.map((role) => {
          const selected = roles.includes(role.value);
          return (
            <button
              key={role.value}
              onClick={() => {
                const next = selected
                  ? roles.filter((r) => r !== role.value)
                  : [...roles, role.value];
                onChange(next.length > 0 ? next : roles);
              }}
              className={cn(
                "text-xs px-2 py-1 rounded-full border transition-colors",
                selected
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-foreground/20"
              )}
            >
              {role.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
