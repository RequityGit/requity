"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
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
  createTemplate,
  updateTemplate,
  type MergeField,
  type SignatureRole,
  type TemplateFormData,
} from "./actions";

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
  { value: "", label: "None" },
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
  gdrive_file_id: string;
  gdrive_folder_id: string | null;
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

/**
 * Extracts a Google Drive file ID from a full URL or returns the input as-is
 * if it's already a bare file ID.
 */
function extractGdriveFileId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  // Match /d/FILE_ID pattern (covers docs.google.com/document/d/... and drive.google.com/file/d/...)
  const pathMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (pathMatch) return pathMatch[1];

  // Match ?id=FILE_ID pattern (covers drive.google.com/open?id=...)
  const queryMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (queryMatch) return queryMatch[1];

  return trimmed;
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
  const [gdriveFileId, setGdriveFileId] = useState(
    template?.gdrive_file_id ?? ""
  );
  const [gdriveFolderId, setGdriveFolderId] = useState(
    template?.gdrive_folder_id ?? ""
  );
  const [requiresSignature, setRequiresSignature] = useState(
    template?.requires_signature ?? false
  );
  const [mergeFields, setMergeFields] = useState<MergeField[]>(
    template?.merge_fields ?? []
  );
  const [signatureRoles, setSignatureRoles] = useState<SignatureRole[]>(
    template?.signature_roles ?? []
  );
  const [saving, setSaving] = useState(false);

  // Reset form when template changes
  function resetForm() {
    setName(template?.name ?? "");
    setTemplateType(template?.template_type ?? "term_sheet");
    setRecordType(template?.record_type ?? "loan");
    setDescription(template?.description ?? "");
    setGdriveFileId(template?.gdrive_file_id ?? "");
    setGdriveFolderId(template?.gdrive_folder_id ?? "");
    setRequiresSignature(template?.requires_signature ?? false);
    setMergeFields(template?.merge_fields ?? []);
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
    if (!gdriveFileId.trim()) {
      toast.error("Google Drive file ID is required");
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
      gdrive_file_id: extractGdriveFileId(gdriveFileId),
      gdrive_folder_id: gdriveFolderId.trim() || undefined,
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

            {/* Template File */}
            <section className="space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                Template File
              </h3>

              <div className="space-y-2">
                <Label htmlFor="gdrive_file_id">
                  Google Drive File ID
                </Label>
                <Input
                  id="gdrive_file_id"
                  value={gdriveFileId}
                  onChange={(e) => setGdriveFileId(e.target.value)}
                  onPaste={(e) => {
                    e.preventDefault();
                    const pasted = e.clipboardData.getData("text");
                    setGdriveFileId(extractGdriveFileId(pasted));
                  }}
                  onBlur={(e) =>
                    setGdriveFileId(extractGdriveFileId(e.target.value))
                  }
                  placeholder="1a2b3c4d5e6f..."
                  className="font-mono text-xs"
                />
                <p className="text-[11px] text-muted-foreground">
                  The file ID from the Google Drive URL of your .docx template.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gdrive_folder_id">
                  Output Folder ID (optional)
                </Label>
                <Input
                  id="gdrive_folder_id"
                  value={gdriveFolderId}
                  onChange={(e) => setGdriveFolderId(e.target.value)}
                  placeholder="1a2b3c4d5e6f..."
                  className="font-mono text-xs"
                />
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
                        <Input
                          value={field.key}
                          onChange={(e) =>
                            updateMergeField(index, { key: e.target.value })
                          }
                          placeholder="borrower_name"
                          className="h-8 text-xs font-mono"
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
                          value={field.format ?? ""}
                          onValueChange={(v) =>
                            updateMergeField(index, {
                              format: v || null,
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
