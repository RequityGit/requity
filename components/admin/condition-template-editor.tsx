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
import { Separator } from "@/components/ui/separator";
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
  LOAN_TYPES,
  CONDITION_CATEGORIES,
  RESPONSIBLE_PARTIES,
} from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import {
  PlusCircle,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Star,
  Copy,
} from "lucide-react";

interface TemplateItem {
  id: string;
  template_id: string;
  name: string;
  description: string | null;
  borrower_description: string | null;
  category: string;
  responsible_party: string;
  due_date_offset_days: number | null;
  is_critical_path: boolean;
  sort_order: number;
}

interface Template {
  id: string;
  name: string;
  loan_type: string;
  description: string | null;
  is_default: boolean;
  created_by: string | null;
  items: TemplateItem[];
}

interface ConditionTemplateEditorProps {
  templates: Template[];
  currentUserId: string;
}

export function ConditionTemplateEditor({
  templates: initialTemplates,
  currentUserId,
}: ConditionTemplateEditorProps) {
  const [templates, setTemplates] = useState(initialTemplates);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  // Group templates by loan type
  const groupedTemplates = templates.reduce<Record<string, Template[]>>(
    (acc: Record<string, Template[]>, t: Template) => {
      const loanTypeLabel =
        LOAN_TYPES.find((lt) => lt.value === t.loan_type)?.label ??
        t.loan_type.replace(/_/g, " ");
      if (!acc[loanTypeLabel]) acc[loanTypeLabel] = [];
      acc[loanTypeLabel].push(t);
      return acc;
    },
    {}
  );

  async function handleDeleteTemplate(templateId: string) {
    const supabase = createClient();

    // Delete items first, then template
    await supabase
      .from("condition_template_items")
      .delete()
      .eq("template_id", templateId);
    const { error } = await supabase
      .from("condition_templates")
      .delete()
      .eq("id", templateId);

    if (error) {
      toast({
        title: "Error deleting template",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTemplates((prev: Template[]) => prev.filter((t: Template) => t.id !== templateId));
    toast({ title: "Template deleted" });
  }

  async function handleToggleDefault(templateId: string, loanType: string) {
    const supabase = createClient();

    // Remove default from all templates of same loan type
    await supabase
      .from("condition_templates")
      .update({ is_default: false })
      .eq("loan_type", loanType);

    // Set this one as default
    const { error } = await supabase
      .from("condition_templates")
      .update({ is_default: true })
      .eq("id", templateId);

    if (error) {
      toast({
        title: "Error updating default",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTemplates((prev: Template[]) =>
      prev.map((t: Template) => ({
        ...t,
        is_default:
          t.loan_type === loanType ? t.id === templateId : t.is_default,
      }))
    );
    toast({ title: "Default template updated" });
  }

  async function handleDuplicateTemplate(template: Template) {
    const supabase = createClient();

    const { data: newTemplate, error: templateError } = await supabase
      .from("condition_templates")
      .insert({
        name: `${template.name} (Copy)`,
        loan_type: template.loan_type,
        description: template.description,
        is_default: false,
        created_by: currentUserId,
      })
      .select()
      .single();

    if (templateError || !newTemplate) {
      toast({
        title: "Error duplicating template",
        description: templateError?.message,
        variant: "destructive",
      });
      return;
    }

    // Copy items
    if (template.items.length > 0) {
      const newItems = template.items.map((item) => ({
        template_id: newTemplate.id,
        name: item.name,
        description: item.description,
        borrower_description: item.borrower_description,
        category: item.category,
        responsible_party: item.responsible_party,
        due_date_offset_days: item.due_date_offset_days ?? undefined,
        is_critical_path: item.is_critical_path,
        sort_order: item.sort_order,
      }));

      const { data: insertedItems } = await supabase
        .from("condition_template_items")
        .insert(newItems)
        .select();

      setTemplates((prev: Template[]) => [
        ...prev,
        { ...newTemplate, loan_type: newTemplate.loan_type ?? "", items: insertedItems ?? [] } as Template,
      ]);
    } else {
      setTemplates((prev: Template[]) => [...prev, { ...newTemplate, loan_type: newTemplate.loan_type ?? "", items: [] } as Template]);
    }

    toast({ title: "Template duplicated" });
  }

  async function handleDeleteItem(templateId: string, itemId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("condition_template_items")
      .delete()
      .eq("id", itemId);

    if (error) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setTemplates((prev: Template[]) =>
      prev.map((t: Template) =>
        t.id === templateId
          ? { ...t, items: t.items.filter((i: TemplateItem) => i.id !== itemId) }
          : t
      )
    );
    toast({ title: "Condition removed from template" });
  }

  function handleItemAdded(templateId: string, newItem: TemplateItem) {
    setTemplates((prev: Template[]) =>
      prev.map((t: Template) =>
        t.id === templateId ? { ...t, items: [...t.items, newItem] } : t
      )
    );
  }

  function handleTemplateCreated(newTemplate: Template) {
    setTemplates((prev: Template[]) => [...prev, newTemplate]);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-surface-white">
            Condition Templates
          </h3>
          <p className="text-sm text-surface-muted">
            Templates auto-populate conditions when a new loan is created. The
            default template for each loan type is used automatically.
          </p>
        </div>
        <CreateTemplateDialog
          currentUserId={currentUserId}
          onCreated={handleTemplateCreated}
        />
      </div>

      {Object.entries(groupedTemplates).map(([loanType, typeTemplates]) => (
        <div key={loanType}>
          <h4 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
            {loanType}
          </h4>
          <div className="space-y-3">
            {typeTemplates.map((template: Template) => {
              const isExpanded = expandedId === template.id;
              const ptaCount = template.items.filter(
                (i: TemplateItem) => i.category === "pta"
              ).length;
              const ptfCount = template.items.filter(
                (i: TemplateItem) => i.category === "ptf"
              ).length;

              return (
                <Card key={template.id}>
                  <CardHeader
                    className="py-3 px-4 cursor-pointer"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : template.id)
                    }
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-surface-muted" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-surface-muted" />
                        )}
                        <CardTitle className="text-sm">
                          {template.name}
                        </CardTitle>
                        {template.is_default && (
                          <Badge className="bg-teal-100 text-teal-800 border-teal-200 text-[10px] gap-1">
                            <Star className="h-2.5 w-2.5" />
                            Default
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">
                          {template.items.length} conditions
                        </Badge>
                        <span className="text-xs text-surface-muted">
                          ({ptaCount} PTA, {ptfCount} PTF)
                        </span>
                      </div>
                      <div
                        className="flex items-center gap-1"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      >
                        {!template.is_default && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs gap-1"
                            onClick={() =>
                              handleToggleDefault(
                                template.id,
                                template.loan_type
                              )
                            }
                            title="Set as default"
                          >
                            <Star className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs gap-1"
                          onClick={() => handleDuplicateTemplate(template)}
                          title="Duplicate"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-status-danger hover:text-red-700 gap-1"
                          onClick={() => handleDeleteTemplate(template.id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-xs text-surface-muted ml-6">
                        {template.description}
                      </p>
                    )}
                  </CardHeader>
                  {isExpanded && (
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="space-y-1">
                        {/* PTA Items */}
                        {template.items
                          .filter((i: TemplateItem) => i.category === "pta")
                          .map((item: TemplateItem) => (
                            <TemplateItemRow
                              key={item.id}
                              item={item}
                              onDelete={() =>
                                handleDeleteItem(template.id, item.id)
                              }
                            />
                          ))}
                        {ptaCount > 0 && ptfCount > 0 && (
                          <Separator className="my-2" />
                        )}
                        {/* PTF Items */}
                        {template.items
                          .filter((i: TemplateItem) => i.category === "ptf")
                          .map((item: TemplateItem) => (
                            <TemplateItemRow
                              key={item.id}
                              item={item}
                              onDelete={() =>
                                handleDeleteItem(template.id, item.id)
                              }
                            />
                          ))}
                      </div>
                      <div className="mt-3">
                        <AddTemplateItemDialog
                          templateId={template.id}
                          nextSortOrder={template.items.length + 1}
                          onAdded={(item) =>
                            handleItemAdded(template.id, item)
                          }
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {templates.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-surface-muted">
            No condition templates yet. Create one to get started.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Template Item Row
// ---------------------------------------------------------------------------
function TemplateItemRow({
  item,
  onDelete,
}: {
  item: TemplateItem;
  onDelete: () => void;
}) {
  const categoryLabel =
    CONDITION_CATEGORIES.find((c) => c.value === item.category)?.label ??
    item.category;
  const partyLabel =
    RESPONSIBLE_PARTIES.find((p) => p.value === item.responsible_party)
      ?.label ?? item.responsible_party;

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-navy-light group">
      <GripVertical className="h-3.5 w-3.5 text-surface-muted/30" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{item.name}</span>
          <Badge
            variant="outline"
            className="text-[10px] px-1.5 py-0 uppercase"
          >
            {categoryLabel}
          </Badge>
          {item.is_critical_path && (
            <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
              Critical
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-surface-muted">
          <span>{partyLabel}</span>
          {item.due_date_offset_days && (
            <span>Due: +{item.due_date_offset_days} days</span>
          )}
        </div>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700"
        onClick={onDelete}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create Template Dialog
// ---------------------------------------------------------------------------
function CreateTemplateDialog({
  currentUserId,
  onCreated,
}: {
  currentUserId: string;
  onCreated: (template: Template) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    loan_type: "",
    description: "",
    is_default: false,
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev: typeof form) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.loan_type) return;

    setLoading(true);
    try {
      const supabase = createClient();

      // If setting as default, unset others of same type
      if (form.is_default) {
        await supabase
          .from("condition_templates")
          .update({ is_default: false })
          .eq("loan_type", form.loan_type);
      }

      const { data, error } = await supabase
        .from("condition_templates")
        .insert({
          name: form.name,
          loan_type: form.loan_type,
          description: form.description || null,
          is_default: form.is_default,
          created_by: currentUserId,
        })
        .select()
        .single();

      if (error) throw error;

      onCreated({ ...data, loan_type: data.loan_type ?? "", items: [] } as Template);
      toast({ title: "Template created" });
      setOpen(false);
      setForm({ name: "", loan_type: "", description: "", is_default: false });
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Condition Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Template Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="e.g. Residential Bridge - Standard"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>
              Loan Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.loan_type}
              onValueChange={(v) => updateField("loan_type", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select loan type..." />
              </SelectTrigger>
              <SelectContent>
                {LOAN_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              rows={2}
              placeholder="Optional description..."
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_default}
              onChange={(e) => updateField("is_default", e.target.checked)}
              className="rounded border-gray-300"
            />
            Set as default for this loan type
          </label>
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
              disabled={loading || !form.name || !form.loan_type}
            >
              {loading ? "Creating..." : "Create Template"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Add Template Item Dialog
// ---------------------------------------------------------------------------
function AddTemplateItemDialog({
  templateId,
  nextSortOrder,
  onAdded,
}: {
  templateId: string;
  nextSortOrder: number;
  onAdded: (item: TemplateItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    description: "",
    borrower_description: "",
    category: "pta",
    responsible_party: "borrower",
    due_date_offset_days: "5",
    is_critical_path: false,
  });

  function updateField(field: string, value: string | boolean) {
    setForm((prev: typeof form) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("condition_template_items")
        .insert({
          template_id: templateId,
          name: form.name,
          description: form.description || null,
          borrower_description: form.borrower_description || null,
          category: form.category,
          responsible_party: form.responsible_party,
          due_date_offset_days: form.due_date_offset_days
            ? parseInt(form.due_date_offset_days)
            : undefined,
          is_critical_path: form.is_critical_path,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error) throw error;

      onAdded(data);
      toast({ title: "Condition added to template" });
      setOpen(false);
      setForm({
        name: "",
        description: "",
        borrower_description: "",
        category: "pta",
        responsible_party: "borrower",
        due_date_offset_days: "5",
        is_critical_path: false,
      });
    } catch (err: any) {
      toast({
        title: "Error adding condition",
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
        <Button variant="outline" size="sm" className="gap-2">
          <PlusCircle className="h-3.5 w-3.5" />
          Add Condition to Template
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Condition to Template</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>
              Condition Name <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
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
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Due Date Offset (days)</Label>
              <Input
                type="number"
                min="1"
                value={form.due_date_offset_days}
                onChange={(e) =>
                  updateField("due_date_offset_days", e.target.value)
                }
                placeholder="5"
              />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_critical_path}
                  onChange={(e) =>
                    updateField("is_critical_path", e.target.checked)
                  }
                  className="rounded border-gray-300"
                />
                Critical path item
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Internal Description</Label>
            <Textarea
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
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
            <Button type="submit" disabled={loading || !form.name}>
              {loading ? "Adding..." : "Add Condition"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
