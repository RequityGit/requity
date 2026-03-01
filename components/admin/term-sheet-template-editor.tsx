"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { updateTermSheetTemplate } from "@/app/(authenticated)/admin/settings/term-sheets/actions";
import { Save, Loader2, Settings, PanelRightOpen, PanelRightClose } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TERM_SHEET_SECTIONS,
  mergeFieldVisibility,
  getSectionDef,
} from "@/lib/term-sheet-fields";
import { TermSheetSectionCard } from "@/components/admin/term-sheet-section-card";
import { TermSheetPreview } from "@/components/admin/term-sheet-preview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TermSheetTemplate {
  id: string;
  name: string;
  loan_type: string;
  is_active: boolean;
  version: number;
  company_name: string;
  company_address: string | null;
  company_phone: string | null;
  company_email: string | null;
  company_website: string | null;
  logo_url: string | null;
  show_borrower_section: boolean;
  show_property_section: boolean;
  show_loan_terms_section: boolean;
  show_fees_section: boolean;
  show_reserves_section: boolean;
  show_guarantor_section: boolean;
  show_closing_costs_section: boolean;
  show_dates_section: boolean;
  show_conditions_section: boolean;
  show_disclaimer_section: boolean;
  show_prepayment_section: boolean;
  show_extension_section: boolean;
  borrower_section_heading: string | null;
  property_section_heading: string | null;
  loan_terms_section_heading: string | null;
  fees_section_heading: string | null;
  reserves_section_heading: string | null;
  guarantor_section_heading: string | null;
  closing_costs_section_heading: string | null;
  dates_section_heading: string | null;
  conditions_section_heading: string | null;
  disclaimer_section_heading: string | null;
  prepayment_section_heading: string | null;
  extension_section_heading: string | null;
  header_rich_text: string | null;
  guarantor_custom_text: string | null;
  conditions_custom_text: string | null;
  disclaimer_rich_text: string | null;
  footer_rich_text: string | null;
  reserves_custom_text: string | null;
  closing_costs_custom_text: string | null;
  custom_fields: unknown[] | null;
  section_order: string[] | null;
  field_visibility: Record<string, Record<string, boolean>> | null;
  field_labels: Record<string, Record<string, string>> | null;
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
}

type SectionKey = string;

const LOAN_TYPE_LABELS: Record<string, string> = {
  default: "Default",
  commercial: "Commercial",
  dscr: "DSCR",
  guc: "GUC",
  rtl: "RTL",
  transactional: "Transactional",
};

const DEFAULT_SECTION_ORDER = TERM_SHEET_SECTIONS.map((s) => s.key);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showKey(key: SectionKey): keyof TermSheetTemplate {
  return `show_${key}_section` as keyof TermSheetTemplate;
}

function headingKey(key: SectionKey): keyof TermSheetTemplate {
  return `${key}_section_heading` as keyof TermSheetTemplate;
}

/** Map section key → custom text column name */
const CUSTOM_TEXT_COLUMNS: Record<string, keyof TermSheetTemplate> = {
  guarantor: "guarantor_custom_text",
  reserves: "reserves_custom_text",
  closing_costs: "closing_costs_custom_text",
  conditions: "conditions_custom_text",
  disclaimer: "disclaimer_rich_text",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface Props {
  templates: TermSheetTemplate[];
}

export function TermSheetTemplateEditor({ templates: initial }: Props) {
  const [templates, setTemplates] = useState<TermSheetTemplate[]>(initial);
  const [activeLoanType, setActiveLoanType] = useState(
    initial[0]?.loan_type ?? "default"
  );
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [showPreview, setShowPreview] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  const current = templates.find((t) => t.loan_type === activeLoanType);

  // -----------------------------------------------------------------------
  // Generic field updater
  // -----------------------------------------------------------------------
  const updateField = useCallback(
    (field: keyof TermSheetTemplate, value: unknown) => {
      setTemplates((prev) =>
        prev.map((t) =>
          t.loan_type === activeLoanType ? { ...t, [field]: value } : t
        )
      );
      if (current) {
        setDirty((prev) => new Set(prev).add(current.id));
      }
    },
    [activeLoanType, current]
  );

  // -----------------------------------------------------------------------
  // Field visibility helpers
  // -----------------------------------------------------------------------
  const fieldVisibility = current
    ? mergeFieldVisibility(current.field_visibility)
    : mergeFieldVisibility(null);

  const fieldLabels: Record<string, Record<string, string>> = current?.field_labels ?? {};

  const toggleFieldVisibility = useCallback(
    (sectionKey: string, fieldKey: string) => {
      if (!current) return;
      const merged = mergeFieldVisibility(current.field_visibility);
      const currentVal = merged[sectionKey]?.[fieldKey] ?? true;
      const updated = {
        ...merged,
        [sectionKey]: { ...merged[sectionKey], [fieldKey]: !currentVal },
      };
      updateField("field_visibility", updated);
    },
    [current, updateField]
  );

  const updateFieldLabel = useCallback(
    (sectionKey: string, fieldKey: string, label: string) => {
      if (!current) return;
      const existing = current.field_labels ?? {};
      const updated = {
        ...existing,
        [sectionKey]: { ...(existing[sectionKey] ?? {}), [fieldKey]: label },
      };
      updateField("field_labels", updated);
    },
    [current, updateField]
  );

  // -----------------------------------------------------------------------
  // Section reorder (swap adjacent)
  // -----------------------------------------------------------------------
  const moveSectionOrder = useCallback(
    (index: number, direction: "up" | "down") => {
      if (!current) return;
      const order = [
        ...(current.section_order ?? DEFAULT_SECTION_ORDER),
      ];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= order.length) return;
      [order[index], order[swapIdx]] = [order[swapIdx], order[index]];
      updateField("section_order", order);
    },
    [current, updateField]
  );

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------
  const handleSave = async () => {
    if (!current) return;
    setSaving(true);

    const {
      id,
      created_at,
      updated_at,
      last_edited_by,
      last_edited_at,
      ...payload
    } = current;

    const result = await updateTermSheetTemplate(current.id, payload);

    if (result.error) {
      toast({
        title: "Error saving template",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({ title: "Template saved successfully" });
      setDirty((prev) => {
        const next = new Set(prev);
        next.delete(current.id);
        return next;
      });
      router.refresh();
    }

    setSaving(false);
  };

  if (!current) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No term sheet templates found. Please seed the database first.
        </CardContent>
      </Card>
    );
  }

  const sectionOrder =
    (current.section_order as string[] | null) ?? DEFAULT_SECTION_ORDER;

  const isDirty = dirty.has(current.id);

  // Build section-level visibility map for the preview
  const sectionVisibility: Record<string, boolean> = {};
  for (const s of TERM_SHEET_SECTIONS) {
    sectionVisibility[s.key] = current[showKey(s.key)] as boolean;
  }

  const sectionHeadings: Record<string, string> = {};
  for (const s of TERM_SHEET_SECTIONS) {
    sectionHeadings[s.key] =
      (current[headingKey(s.key)] as string | null) ?? "";
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-4">
      {/* Loan type selector + save button */}
      <div className="flex flex-wrap items-center gap-2">
        {templates.map((t) => (
          <button
            key={t.loan_type}
            onClick={() => setActiveLoanType(t.loan_type)}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium transition-colors border",
              t.loan_type === activeLoanType
                ? "bg-[#1a2b4a] text-white border-[#1a2b4a]"
                : "bg-white text-[#1a2b4a] border-slate-200 hover:bg-slate-50"
            )}
          >
            {LOAN_TYPE_LABELS[t.loan_type] ?? t.loan_type}
            {dirty.has(t.id) && (
              <span className="ml-2 inline-block w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        ))}

        <div className="flex-1" />

        {/* Preview toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-1.5 text-xs"
        >
          {showPreview ? (
            <PanelRightClose className="h-3.5 w-3.5" />
          ) : (
            <PanelRightOpen className="h-3.5 w-3.5" />
          )}
          {showPreview ? "Hide Preview" : "Show Preview"}
        </Button>

        <Button
          onClick={handleSave}
          disabled={saving || !isDirty}
          className="bg-[#1a2b4a] hover:bg-[#243a5e] text-white gap-2"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Main layout — editor + optional preview */}
      <div
        className={cn(
          "grid gap-4",
          showPreview ? "grid-cols-1 xl:grid-cols-[1fr_320px]" : "grid-cols-1"
        )}
      >
        {/* Left — Editor */}
        <div>
          <Tabs defaultValue="sections" className="space-y-4">
            <TabsList>
              <TabsTrigger value="sections">Sections &amp; Fields</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-3.5 w-3.5 mr-1" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* ============================================================ */}
            {/* TAB: Sections & Fields (the main improvement)                */}
            {/* ============================================================ */}
            <TabsContent value="sections">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Click any section to expand it and see the fields inside.
                  Toggle individual fields on/off, rename labels, and reorder
                  sections.
                </p>
                {sectionOrder.map((sKey, idx) => {
                  const sectionDef = getSectionDef(sKey);
                  if (!sectionDef) return null;

                  const visible = current[showKey(sKey)] as boolean;
                  const heading =
                    (current[headingKey(sKey)] as string | null) ?? "";

                  // Get section-specific field visibility
                  const sectionFieldVis = fieldVisibility[sKey] ?? {};

                  // Get section-specific field labels
                  const sectionFieldLabels = fieldLabels[sKey] ?? {};

                  // Custom text
                  const customTextCol = CUSTOM_TEXT_COLUMNS[sKey];
                  const customText = customTextCol
                    ? ((current[customTextCol] as string | null) ?? "")
                    : undefined;

                  return (
                    <TermSheetSectionCard
                      key={sKey}
                      section={sectionDef}
                      sectionVisible={visible}
                      onToggleSection={() =>
                        updateField(showKey(sKey), !visible)
                      }
                      heading={heading}
                      onHeadingChange={(v) =>
                        updateField(headingKey(sKey), v)
                      }
                      fieldVisibility={sectionFieldVis}
                      onToggleField={(fieldKey) =>
                        toggleFieldVisibility(sKey, fieldKey)
                      }
                      fieldLabels={sectionFieldLabels}
                      onFieldLabelChange={(fieldKey, label) =>
                        updateFieldLabel(sKey, fieldKey, label)
                      }
                      customText={customText}
                      onCustomTextChange={
                        customTextCol
                          ? (v) => updateField(customTextCol, v)
                          : undefined
                      }
                      index={idx}
                      totalSections={sectionOrder.length}
                      onMoveUp={() => moveSectionOrder(idx, "up")}
                      onMoveDown={() => moveSectionOrder(idx, "down")}
                    />
                  );
                })}
              </div>
            </TabsContent>

            {/* ============================================================ */}
            {/* TAB: Branding & Header                                       */}
            {/* ============================================================ */}
            <TabsContent value="branding">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#1a2b4a]">
                    Branding &amp; Header
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Company information displayed in the term sheet header.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FieldInput
                      label="Company Name"
                      value={current.company_name}
                      onChange={(v) => updateField("company_name", v)}
                    />
                    <FieldInput
                      label="Phone"
                      value={current.company_phone ?? ""}
                      onChange={(v) => updateField("company_phone", v)}
                    />
                    <FieldInput
                      label="Email"
                      value={current.company_email ?? ""}
                      onChange={(v) => updateField("company_email", v)}
                      type="email"
                    />
                    <FieldInput
                      label="Website"
                      value={current.company_website ?? ""}
                      onChange={(v) => updateField("company_website", v)}
                    />
                    <div className="md:col-span-2">
                      <FieldInput
                        label="Address"
                        value={current.company_address ?? ""}
                        onChange={(v) => updateField("company_address", v)}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FieldInput
                        label="Logo URL"
                        value={current.logo_url ?? ""}
                        onChange={(v) => updateField("logo_url", v)}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium mb-1.5 block">
                        Header Text
                      </Label>
                      <Textarea
                        value={current.header_rich_text ?? ""}
                        onChange={(e) =>
                          updateField("header_rich_text", e.target.value)
                        }
                        rows={4}
                        placeholder="Optional text displayed below the header..."
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-sm font-medium mb-1.5 block">
                        Footer Text
                      </Label>
                      <Textarea
                        value={current.footer_rich_text ?? ""}
                        onChange={(e) =>
                          updateField("footer_rich_text", e.target.value)
                        }
                        rows={3}
                        placeholder="Optional text displayed in the footer..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ============================================================ */}
            {/* TAB: Settings                                                */}
            {/* ============================================================ */}
            <TabsContent value="settings">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-[#1a2b4a]">
                    Template Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FieldInput
                    label="Template Name"
                    value={current.name}
                    onChange={(v) => updateField("name", v)}
                  />

                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Active</Label>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={current.is_active}
                      onClick={() =>
                        updateField("is_active", !current.is_active)
                      }
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        current.is_active ? "bg-[#1a2b4a]" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                          current.is_active
                            ? "translate-x-6"
                            : "translate-x-1"
                        )}
                      />
                    </button>
                    <Badge
                      variant={current.is_active ? "default" : "secondary"}
                      className={
                        current.is_active
                          ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-100"
                          : ""
                      }
                    >
                      {current.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Version</Label>
                    <Badge variant="outline">{current.version}</Badge>
                  </div>

                  <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Loan Type</Label>
                    <Badge
                      variant="outline"
                      className="bg-[#1a2b4a]/5 text-[#1a2b4a]"
                    >
                      {LOAN_TYPE_LABELS[current.loan_type] ?? current.loan_type}
                    </Badge>
                  </div>

                  {current.last_edited_at && (
                    <p className="text-xs text-muted-foreground">
                      Last edited{" "}
                      {new Date(current.last_edited_at).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right — Live Preview */}
        {showPreview && (
          <div className="hidden xl:block sticky top-4 self-start">
            <TermSheetPreview
              sectionOrder={sectionOrder}
              sectionVisibility={sectionVisibility}
              fieldVisibility={fieldVisibility}
              fieldLabels={fieldLabels}
              sectionHeadings={sectionHeadings}
              companyName={current.company_name}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small reusable field components (internal)
// ---------------------------------------------------------------------------

function FieldInput({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
