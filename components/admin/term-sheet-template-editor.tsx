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
import {
  Save,
  GripVertical,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  last_edited_by: string | null;
  last_edited_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Section metadata — maps section keys to DB column prefixes
// ---------------------------------------------------------------------------

const SECTIONS = [
  { key: "borrower", label: "Borrower Information" },
  { key: "property", label: "Property Information" },
  { key: "loan_terms", label: "Loan Terms" },
  { key: "fees", label: "Fees & Costs" },
  { key: "reserves", label: "Reserves & Holdbacks" },
  { key: "guarantor", label: "Guarantor / Recourse" },
  { key: "closing_costs", label: "Closing Cost Breakdown" },
  { key: "dates", label: "Key Dates" },
  { key: "prepayment", label: "Prepayment Terms" },
  { key: "extension", label: "Extension Options" },
  { key: "conditions", label: "Conditions & Requirements" },
  { key: "disclaimer", label: "Disclaimer" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const LOAN_TYPE_LABELS: Record<string, string> = {
  default: "Default",
  commercial: "Commercial",
  dscr: "DSCR",
  guc: "GUC",
  rtl: "RTL",
  transactional: "Transactional",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function showKey(key: SectionKey): keyof TermSheetTemplate {
  return `show_${key}_section` as keyof TermSheetTemplate;
}

function headingKey(key: SectionKey): keyof TermSheetTemplate {
  return `${key}_section_heading` as keyof TermSheetTemplate;
}

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
  // Section reorder (swap adjacent)
  // -----------------------------------------------------------------------
  const moveSectionOrder = useCallback(
    (index: number, direction: "up" | "down") => {
      if (!current) return;
      const order = [...(current.section_order ?? SECTIONS.map((s) => s.key))];
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

    // Build the update payload — exclude id, created_at, updated_at
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
    current.section_order ?? SECTIONS.map((s) => s.key);

  const isDirty = dirty.has(current.id);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Loan type selector */}
      <div className="flex flex-wrap gap-2">
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
      </div>

      {/* Editor tabs */}
      <Tabs defaultValue="sections" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="sections">Sections &amp; Layout</TabsTrigger>
            <TabsTrigger value="branding">Branding &amp; Header</TabsTrigger>
            <TabsTrigger value="custom-text">Custom Text</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

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

        {/* ============================================================== */}
        {/* TAB: Sections & Layout                                         */}
        {/* ============================================================== */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1a2b4a]">
                Section Visibility &amp; Order
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Toggle sections on or off, reorder them, and customise headings.
              </p>
            </CardHeader>
            <CardContent className="space-y-1">
              {sectionOrder.map((sKey, idx) => {
                const section = SECTIONS.find((s) => s.key === sKey);
                if (!section) return null;
                const visible = current[showKey(section.key)] as boolean;
                const heading =
                  (current[headingKey(section.key)] as string | null) ?? "";

                return (
                  <div
                    key={section.key}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 transition-colors",
                      visible
                        ? "bg-white border-slate-200"
                        : "bg-slate-50 border-slate-100 opacity-60"
                    )}
                  >
                    {/* Drag handle + reorder buttons */}
                    <div className="flex flex-col gap-0.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => moveSectionOrder(idx, "up")}
                        disabled={idx === 0}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none"
                        aria-label="Move up"
                      >
                        ▲
                      </button>
                      <GripVertical className="h-4 w-4 text-slate-300 mx-auto" />
                      <button
                        type="button"
                        onClick={() => moveSectionOrder(idx, "down")}
                        disabled={idx === sectionOrder.length - 1}
                        className="text-slate-400 hover:text-slate-700 disabled:opacity-30 text-xs leading-none"
                        aria-label="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() =>
                        updateField(showKey(section.key), !visible)
                      }
                      className={cn(
                        "shrink-0 rounded p-1.5 transition-colors",
                        visible
                          ? "text-emerald-600 hover:bg-emerald-50"
                          : "text-slate-400 hover:bg-slate-100"
                      )}
                      aria-label={visible ? "Hide section" : "Show section"}
                    >
                      {visible ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>

                    {/* Section label */}
                    <span className="text-sm font-medium text-[#1a2b4a] w-44 shrink-0">
                      {section.label}
                    </span>

                    {/* Heading input */}
                    <Input
                      value={heading}
                      onChange={(e) =>
                        updateField(headingKey(section.key), e.target.value)
                      }
                      placeholder={section.label}
                      className="flex-1 h-8 text-sm"
                    />
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB: Branding & Header                                         */}
        {/* ============================================================== */}
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
                    Header Rich Text
                  </Label>
                  <Textarea
                    value={current.header_rich_text ?? ""}
                    onChange={(e) =>
                      updateField("header_rich_text", e.target.value)
                    }
                    rows={4}
                    placeholder="Optional rich text displayed below the header..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB: Custom Text                                               */}
        {/* ============================================================== */}
        <TabsContent value="custom-text">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg text-[#1a2b4a]">
                Custom Text Blocks
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Editable text for specific sections of the term sheet.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <FieldTextarea
                label="Guarantor Custom Text"
                value={current.guarantor_custom_text ?? ""}
                onChange={(v) => updateField("guarantor_custom_text", v)}
                rows={4}
              />
              <FieldTextarea
                label="Reserves Custom Text"
                value={current.reserves_custom_text ?? ""}
                onChange={(v) => updateField("reserves_custom_text", v)}
                rows={4}
              />
              <FieldTextarea
                label="Closing Costs Custom Text"
                value={current.closing_costs_custom_text ?? ""}
                onChange={(v) => updateField("closing_costs_custom_text", v)}
                rows={4}
              />
              <FieldTextarea
                label="Conditions Custom Text"
                value={current.conditions_custom_text ?? ""}
                onChange={(v) => updateField("conditions_custom_text", v)}
                rows={4}
              />
              <FieldTextarea
                label="Disclaimer Rich Text"
                value={current.disclaimer_rich_text ?? ""}
                onChange={(v) => updateField("disclaimer_rich_text", v)}
                rows={6}
              />
              <FieldTextarea
                label="Footer Rich Text"
                value={current.footer_rich_text ?? ""}
                onChange={(v) => updateField("footer_rich_text", v)}
                rows={3}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============================================================== */}
        {/* TAB: Settings                                                  */}
        {/* ============================================================== */}
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

function FieldTextarea({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <Label className="text-sm font-medium mb-1.5 block">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  );
}
