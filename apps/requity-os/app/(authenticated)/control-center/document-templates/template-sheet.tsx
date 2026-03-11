"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Search, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  createTemplate,
  updateTemplate,
  type MergeField,
  type SignatureRole,
  type TemplateFormData,
} from "./actions";
import { TERM_SHEET_SECTIONS } from "@/lib/term-sheet-fields";
import {
  searchFields,
  getFieldsByCategory,
  type MergeFieldOption,
} from "@/lib/merge-field-registry";

const TEMPLATE_TYPES = [
  { value: "nda", label: "NDA" },
  { value: "broker_agreement", label: "Broker Agreement" },
  { value: "term_sheet", label: "Term Sheet" },
  { value: "loan_agreement", label: "Loan Agreement" },
  { value: "investor_agreement", label: "Investor Agreement" },
  { value: "other", label: "Other" },
];

const RECORD_TYPES = [
  { value: "loan", label: "Loan" },
  { value: "contact", label: "Contact" },
  { value: "deal", label: "Deal" },
  { value: "company", label: "Company" },
];

const SOURCE_TABLES = [
  { value: "loans", label: "Loans" },
  { value: "crm_contacts", label: "CRM Contacts" },
  { value: "companies", label: "Companies" },
  { value: "equity_deals", label: "Equity Deals" },
  { value: "_system", label: "System" },
  { value: "template_config", label: "Template Config" },
];

const FORMAT_OPTIONS = [
  { value: "__none__", label: "None" },
  { value: "currency", label: "Currency ($1,234)" },
  { value: "currency_cents", label: "Currency Cents ($1,234.56)" },
  { value: "percentage", label: "Percentage (7.50%)" },
  { value: "date", label: "Date (March 8, 2026)" },
  { value: "date_short", label: "Date Short (03/08/2026)" },
  { value: "phone", label: "Phone ((813) 555-1234)" },
];

interface Template {
  id: string;
  name: string;
  template_type: string;
  record_type: string;
  description: string | null;
  merge_fields: MergeField[];
  requires_signature: boolean;
  signature_roles: SignatureRole[] | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: Template | null;
  onSuccess: () => void;
}

/** Build default merge fields from TERM_SHEET_SECTIONS for loan-type templates */
function getDefaultMergeFields(recordType: string): MergeField[] {
  if (recordType !== "loan") return [];
  const fields: MergeField[] = [];
  for (const section of TERM_SHEET_SECTIONS) {
    for (const f of section.fields) {
      if (!f.defaultVisible) continue;
      fields.push({
        key: f.key,
        label: f.label,
        source: "loans",
        column: f.key,
        format: f.format === "currency" ? "currency" : f.format === "percent" ? "percentage" : f.format === "date" ? "date" : null,
      });
    }
  }
  return fields;
}

const EMPTY_FIELD: MergeField = {
  key: "",
  label: "",
  source: "loans",
  column: "",
  format: null,
};

const EMPTY_ROLE: SignatureRole = {
  role: "",
  name_source: "",
  email_source: "",
  order: 1,
};

/** Searchable combobox for merge field keys — auto-populates key, label, source, column, format */
function FieldSearchCombobox({
  value,
  onSelect,
}: {
  value: string;
  onSelect: (field: MergeFieldOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keep the input in sync with the external value
  useEffect(() => {
    setSearch(value);
  }, [value]);

  const results = searchFields(search);
  const grouped = new Map<string, MergeFieldOption[]>();
  for (const f of results) {
    const list = grouped.get(f.category) ?? [];
    list.push(f);
    grouped.set(f.category, list);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!open) setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder="Search fields..."
            className="h-8 text-xs font-mono pl-7"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[280px] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="max-h-[260px] overflow-y-auto">
          {results.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No matching fields
            </p>
          )}
          {Array.from(grouped.entries()).map(([category, fields]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 sticky top-0">
                {category}
              </div>
              {fields.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-xs hover:bg-accent hover:text-accent-foreground transition-colors"
                  onClick={() => {
                    onSelect(f);
                    setSearch(f.key);
                    setOpen(false);
                  }}
                >
                  {f.key === value && (
                    <Check className="h-3 w-3 text-primary shrink-0" />
                  )}
                  <div className="flex flex-col items-start min-w-0">
                    <span className="font-mono truncate">{f.key}</span>
                    <span className="text-[10px] text-muted-foreground truncate">
                      {f.label}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function TemplateSheet({ open, onOpenChange, template, onSuccess }: Props) {
  const isEditing = !!template;

  const [name, setName] = useState(template?.name ?? "");
  const [templateType, setTemplateType] = useState(
    template?.template_type ?? "term_sheet"
  );
  const [recordType, setRecordType] = useState(
    template?.record_type ?? "loan"
  );
  const [description, setDescription] = useState(
    template?.description ?? ""
  );
  const [requiresSignature, setRequiresSignature] = useState(
    template?.requires_signature ?? false
  );
  const [mergeFields, setMergeFields] = useState<MergeField[]>(
    template?.merge_fields ?? getDefaultMergeFields(template?.record_type ?? "loan")
  );
  const [signatureRoles, setSignatureRoles] = useState<SignatureRole[]>(
    template?.signature_roles ?? []
  );
  const [saving, setSaving] = useState(false);

  // Reset form when template changes
  function resetForm() {
    const rt = template?.record_type ?? "loan";
    setName(template?.name ?? "");
    setTemplateType(template?.template_type ?? "term_sheet");
    setRecordType(rt);
    setDescription(template?.description ?? "");
    setRequiresSignature(template?.requires_signature ?? false);
    setMergeFields(
      template?.merge_fields ?? getDefaultMergeFields(rt)
    );
    setSignatureRoles(template?.signature_roles ?? []);
  }

  function handleOpenChange(nextOpen: boolean) {
    if (nextOpen) resetForm();
    onOpenChange(nextOpen);
  }

  function addMergeField() {
    setMergeFields((prev) => [...prev, { ...EMPTY_FIELD }]);
  }

  function updateMergeField(index: number, updates: Partial<MergeField>) {
    setMergeFields((prev) =>
      prev.map((f, i) => (i === index ? { ...f, ...updates } : f))
    );
  }

  function removeMergeField(index: number) {
    setMergeFields((prev) => prev.filter((_, i) => i !== index));
  }

  function addSignatureRole() {
    setSignatureRoles((prev) => [
      ...prev,
      { ...EMPTY_ROLE, order: prev.length + 1 },
    ]);
  }

  function updateSignatureRole(index: number, updates: Partial<SignatureRole>) {
    setSignatureRoles((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...updates } : r))
    );
  }

  function removeSignatureRole(index: number) {
    setSignatureRoles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Template name is required");
      return;
    }

    // Check for duplicate merge field keys
    const keys = mergeFields.map((f) => f.key).filter(Boolean);
    const dupes = keys.filter((k, i) => keys.indexOf(k) !== i);
    if (dupes.length > 0) {
      toast.error(`Duplicate merge field keys: ${dupes.join(", ")}`);
      return;
    }

    const formData: TemplateFormData = {
      name: name.trim(),
      template_type: templateType,
      record_type: recordType,
      description: description.trim(),
      requires_signature: requiresSignature,
      merge_fields: mergeFields.filter((f) => f.key && f.column),
      signature_roles: signatureRoles.filter((r) => r.role),
    };

    setSaving(true);
    const result = isEditing
      ? await updateTemplate(template.id, formData)
      : await createTemplate(formData);

    if (result.error) {
      toast.error(`Failed to save: ${result.error}`);
    } else {
      toast.success(isEditing ? "Template updated" : "Template created");
      onSuccess();
    }
    setSaving(false);
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[540px] sm:max-w-[540px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>
            {isEditing ? "Edit Template" : "New Template"}
          </SheetTitle>
          <SheetDescription>
            {isEditing
              ? "Update the document template configuration."
              : "Create a new document template with merge fields."}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-6 py-4 space-y-6">
            {/* Basic Info */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                Basic Info
              </h3>

              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="RTL Fix & Flip Term Sheet"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Record Type</Label>
                  <Select value={recordType} onValueChange={setRecordType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECORD_TYPES.map((r) => (
                        <SelectItem key={r.value} value={r.value}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="desc">Description</Label>
                <Textarea
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Standard term sheet for residential fix-and-flip bridge loans"
                  rows={2}
                />
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  checked={requiresSignature}
                  onCheckedChange={setRequiresSignature}
                />
                <Label>Requires Signature</Label>
              </div>
            </section>

            <Separator />

            {/* Merge Fields */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                  Merge Fields ({mergeFields.length})
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addMergeField}
                >
                  <Plus size={12} className="mr-1" />
                  Add Field
                </Button>
              </div>

              {mergeFields.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No merge fields. Add fields that map to template placeholders.
                </p>
              )}

              <div className="space-y-3">
                {mergeFields.map((field, index) => (
                  <div
                    key={index}
                    className="border rounded-md p-3 space-y-2 bg-muted/30"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Field {index + 1}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeMergeField(index)}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px]">Key</Label>
                        <FieldSearchCombobox
                          value={field.key}
                          onSelect={(f) =>
                            updateMergeField(index, {
                              key: f.key,
                              label: f.label,
                              source: f.source,
                              column: f.column,
                              format: f.format,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Label</Label>
                        <Input
                          value={field.label}
                          onChange={(e) =>
                            updateMergeField(index, { label: e.target.value })
                          }
                          placeholder="Borrower Name"
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <Label className="text-[11px]">Source</Label>
                        <Select
                          value={field.source}
                          onValueChange={(v) =>
                            updateMergeField(index, { source: v })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCE_TABLES.map((s) => (
                              <SelectItem key={s.value} value={s.value}>
                                {s.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px]">Column</Label>
                        <Input
                          value={field.column}
                          onChange={(e) =>
                            updateMergeField(index, { column: e.target.value })
                          }
                          placeholder="full_name"
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                      <div>
                        <Label className="text-[11px]">Format</Label>
                        <Select
                          value={field.format ?? "__none__"}
                          onValueChange={(v) =>
                            updateMergeField(index, {
                              format: v === "__none__" ? null : v,
                            })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="None" />
                          </SelectTrigger>
                          <SelectContent>
                            {FORMAT_OPTIONS.map((f) => (
                              <SelectItem key={f.value} value={f.value}>
                                {f.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Signature Roles */}
            {requiresSignature && (
              <>
                <Separator />
                <section className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                      Signature Roles ({signatureRoles.length})
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addSignatureRole}
                    >
                      <Plus size={12} className="mr-1" />
                      Add Signer
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {signatureRoles.map((role, index) => (
                      <div
                        key={index}
                        className="border rounded-md p-3 space-y-2 bg-muted/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">
                            Signer {index + 1}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeSignatureRole(index)}
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px]">Role Label</Label>
                            <Input
                              value={role.role}
                              onChange={(e) =>
                                updateSignatureRole(index, {
                                  role: e.target.value,
                                })
                              }
                              placeholder="Borrower"
                              className="h-8 text-xs"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px]">Order</Label>
                            <Input
                              type="number"
                              value={role.order}
                              onChange={(e) =>
                                updateSignatureRole(index, {
                                  order: parseInt(e.target.value) || 1,
                                })
                              }
                              className="h-8 text-xs num"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <Label className="text-[11px]">Name Source</Label>
                            <Input
                              value={role.name_source}
                              onChange={(e) =>
                                updateSignatureRole(index, {
                                  name_source: e.target.value,
                                })
                              }
                              placeholder="crm_contacts.full_name"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                          <div>
                            <Label className="text-[11px]">Email Source</Label>
                            <Input
                              value={role.email_source}
                              onChange={(e) =>
                                updateSignatureRole(index, {
                                  email_source: e.target.value,
                                })
                              }
                              placeholder="crm_contacts.email"
                              className="h-8 text-xs font-mono"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-6 py-4 flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving
              ? isEditing
                ? "Updating..."
                : "Creating..."
              : isEditing
                ? "Update Template"
                : "Create Template"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
