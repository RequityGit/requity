"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CONDITION_CATEGORIES,
  CONDITION_STAGES,
  RESPONSIBLE_PARTIES,
  LOAN_DB_TYPES,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import {
  PlusCircle,
  Trash2,
  Search,
  Copy,
  X,
  Filter,
} from "lucide-react";
import type { LoanConditionTemplate } from "@/lib/supabase/types";

interface ConditionTemplateEditorProps {
  templates: LoanConditionTemplate[];
}

export function ConditionTemplateEditor({
  templates: initialTemplates,
}: ConditionTemplateEditorProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const router = useRouter();
  const { toast } = useToast();

  // Filter
  const filtered = templates.filter((t) => {
    if (filterCategory !== "all" && t.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (
        !t.condition_name.toLowerCase().includes(q) &&
        !(t.internal_description ?? "").toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, LoanConditionTemplate[]>>(
    (acc, t) => {
      const label =
        CONDITION_CATEGORIES.find((c) => c.value === t.category)?.label ??
        t.category.replace(/_/g, " ");
      if (!acc[label]) acc[label] = [];
      acc[label].push(t);
      return acc;
    },
    {}
  );

  async function handleDelete(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("loan_condition_templates")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Template deleted" });
  }

  async function handleDuplicate(template: LoanConditionTemplate) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("loan_condition_templates")
      .insert({
        condition_name: `${template.condition_name} (Copy)`,
        category: template.category,
        required_stage: template.required_stage,
        internal_description: template.internal_description,
        borrower_description: template.borrower_description,
        responsible_party: template.responsible_party,
        critical_path_item: template.critical_path_item,
        applies_to_commercial: template.applies_to_commercial,
        applies_to_dscr: template.applies_to_dscr,
        applies_to_guc: template.applies_to_guc,
        applies_to_rtl: template.applies_to_rtl,
        applies_to_transactional: template.applies_to_transactional,
        sort_order: template.sort_order,
        is_active: template.is_active,
      })
      .select()
      .single();

    if (error || !data) {
      toast({
        title: "Error duplicating template",
        description: error?.message,
        variant: "destructive",
      });
      return;
    }

    setTemplates((prev) => [...prev, data]);
    toast({ title: "Template duplicated" });
  }

  async function handleToggleActive(id: string, currentActive: boolean | null) {
    const supabase = createClient();
    const { error } = await supabase
      .from("loan_condition_templates")
      .update({ is_active: !currentActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Error updating template",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTemplates((prev) =>
      prev.map((t) =>
        t.id === id ? { ...t, is_active: !currentActive } : t
      )
    );
    toast({
      title: `Template ${!currentActive ? "activated" : "deactivated"}`,
    });
  }

  function handleCreated(newTemplate: LoanConditionTemplate) {
    setTemplates((prev) => [...prev, newTemplate]);
  }

  const hasFilters = filterCategory !== "all" || search.trim() !== "";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Condition Templates
          </h3>
          <p className="text-sm text-muted-foreground">
            Templates define the conditions that get applied to loans. Each
            template row is a single condition that can be toggled per loan type.
          </p>
        </div>
        <AddTemplateDialog onCreated={handleCreated} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="pl-9 h-8"
              />
            </div>
            <Select
              value={filterCategory}
              onValueChange={setFilterCategory}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CONDITION_CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1"
                onClick={() => {
                  setSearch("");
                  setFilterCategory("all");
                }}
              >
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              {filtered.length} of {templates.length} templates
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Grouped list */}
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category}>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            {category}
          </h4>
          <div className="space-y-2">
            {items
              .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
              .map((template) => (
                <TemplateRow
                  key={template.id}
                  template={template}
                  onDelete={() => handleDelete(template.id)}
                  onDuplicate={() => handleDuplicate(template)}
                  onToggleActive={() =>
                    handleToggleActive(template.id, template.is_active)
                  }
                />
              ))}
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {hasFilters
              ? "No templates match the current filters."
              : "No condition templates yet. Create one to get started."}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Row
// ---------------------------------------------------------------------------
function TemplateRow({
  template,
  onDelete,
  onDuplicate,
  onToggleActive,
}: {
  template: LoanConditionTemplate;
  onDelete: () => void;
  onDuplicate: () => void;
  onToggleActive: () => void;
}) {
  const categoryLabel =
    CONDITION_CATEGORIES.find((c) => c.value === template.category)?.label ??
    template.category;
  const partyLabel = template.responsible_party
    ? (RESPONSIBLE_PARTIES.find((p) => p.value === template.responsible_party)
        ?.label ?? template.responsible_party)
    : "—";
  const stageLabel =
    CONDITION_STAGES.find((s) => s.value === template.required_stage)?.label ??
    template.required_stage;

  // Build loan type badges
  const loanTypes: string[] = [];
  if (template.applies_to_commercial) loanTypes.push("Commercial");
  if (template.applies_to_dscr) loanTypes.push("DSCR");
  if (template.applies_to_guc) loanTypes.push("GUC");
  if (template.applies_to_rtl) loanTypes.push("RTL");
  if (template.applies_to_transactional) loanTypes.push("Transactional");

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg border ${
        template.is_active ? "bg-card" : "bg-slate-50/80 opacity-60"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-foreground">
            {template.condition_name}
          </span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 uppercase"
          >
            {categoryLabel}
          </Badge>
          {template.critical_path_item && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
              Critical
            </Badge>
          )}
          {!template.is_active && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Inactive
            </Badge>
          )}
        </div>
        {template.internal_description && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {template.internal_description}
          </p>
        )}
        <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground flex-wrap">
          <span>Party: {partyLabel}</span>
          <span>Stage: {stageLabel}</span>
          {loanTypes.length > 0 && (
            <span>Types: {loanTypes.join(", ")}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs"
          onClick={onToggleActive}
        >
          {template.is_active ? "Deactivate" : "Activate"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs gap-1"
          onClick={onDuplicate}
          title="Duplicate"
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-7 text-xs text-red-600 hover:text-red-700 gap-1"
          onClick={onDelete}
          title="Delete"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Add Template Dialog
// ---------------------------------------------------------------------------
function AddTemplateDialog({
  onCreated,
}: {
  onCreated: (template: LoanConditionTemplate) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    condition_name: "",
    category: "borrower_documents",
    required_stage: "processing",
    internal_description: "",
    borrower_description: "",
    responsible_party: "borrower",
    critical_path_item: false,
    applies_to_commercial: false,
    applies_to_dscr: false,
    applies_to_guc: false,
    applies_to_rtl: false,
    applies_to_transactional: false,
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.condition_name) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("loan_condition_templates")
        .insert({
          condition_name: form.condition_name,
          category: form.category as any,
          required_stage: form.required_stage as any,
          internal_description: form.internal_description || null,
          borrower_description: form.borrower_description || null,
          responsible_party: form.responsible_party || null,
          critical_path_item: form.critical_path_item,
          applies_to_commercial: form.applies_to_commercial,
          applies_to_dscr: form.applies_to_dscr,
          applies_to_guc: form.applies_to_guc,
          applies_to_rtl: form.applies_to_rtl,
          applies_to_transactional: form.applies_to_transactional,
        })
        .select()
        .single();

      if (error) throw error;

      onCreated(data);
      toast({ title: "Template created" });
      setOpen(false);
      setForm({
        condition_name: "",
        category: "borrower_documents",
        required_stage: "processing",
        internal_description: "",
        borrower_description: "",
        responsible_party: "borrower",
        critical_path_item: false,
        applies_to_commercial: false,
        applies_to_dscr: false,
        applies_to_guc: false,
        applies_to_rtl: false,
        applies_to_transactional: false,
      });
    } catch (err: any) {
      toast({
        title: "Error creating template",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusCircle className="h-4 w-4" />
          New Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Condition Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Condition Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.condition_name}
              onChange={(e) => updateField("condition_name", e.target.value)}
              placeholder="e.g. Bank Statements (2 months)"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => updateField("category", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Required Stage</Label>
              <Select
                value={form.required_stage}
                onValueChange={(v) => updateField("required_stage", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITION_STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Responsible Party</Label>
              <Select
                value={form.responsible_party}
                onValueChange={(v) => updateField("responsible_party", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPONSIBLE_PARTIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.critical_path_item}
                  onChange={(e) =>
                    updateField("critical_path_item", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                Critical path item
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Applies To Loan Types</Label>
            <div className="flex flex-wrap gap-3">
              {[
                { field: "applies_to_rtl", label: "RTL" },
                { field: "applies_to_dscr", label: "DSCR" },
                { field: "applies_to_guc", label: "GUC" },
                { field: "applies_to_commercial", label: "Commercial" },
                { field: "applies_to_transactional", label: "Transactional" },
              ].map((lt) => (
                <label
                  key={lt.field}
                  className="flex items-center gap-1.5 text-sm cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form[lt.field as keyof typeof form] as boolean}
                    onChange={(e) => updateField(lt.field, e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  {lt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Internal Description</Label>
            <Textarea
              value={form.internal_description}
              onChange={(e) =>
                updateField("internal_description", e.target.value)
              }
              rows={2}
              placeholder="Visible to team only"
            />
          </div>
          <div className="space-y-2">
            <Label>Borrower Description</Label>
            <Textarea
              value={form.borrower_description}
              onChange={(e) =>
                updateField("borrower_description", e.target.value)
              }
              rows={2}
              placeholder="What the borrower sees"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !form.condition_name}
            >
              {loading ? "Creating..." : "Add Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
