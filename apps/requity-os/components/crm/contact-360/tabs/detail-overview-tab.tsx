"use client";

import { useState, useMemo, useCallback, useTransition, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import {
  SectionCard,
} from "../contact-detail-shared";
import { QuickAddCompanyDialog } from "@/components/crm/quick-add-company-dialog";
import {
  renderDynamicFieldsInline,
  FIELD_KEY_TO_PROP,
} from "@/components/crm/shared-field-renderer";
import { getSectionIcon } from "@/lib/icon-map";
import { AddressAutocomplete, type ParsedAddress } from "@/components/ui/address-autocomplete";
import type {
  ContactData,
  SectionLayout,
  FieldLayout,
  TeamMember,
  CompanyData,
} from "../types";
import { usePageLayout } from "@/hooks/usePageLayout";
import { useInlineLayout } from "@/components/inline-layout-editor/InlineLayoutContext";
import { EditableSection } from "@/components/inline-layout-editor/EditableSection";
import { EditableFieldSlot } from "@/components/inline-layout-editor/EditableFieldSlot";
import { FieldPicker } from "@/components/inline-layout-editor/FieldPicker";
import type { LayoutSection, LayoutField } from "@/hooks/useDealLayout";

interface DetailOverviewTabProps {
  contact: ContactData;
  isSuperAdmin: boolean;
  userRole: string;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
  teamMembers: TeamMember[];
  allCompanies: CompanyData[];
}

function evaluateOperator(
  operator: string,
  sourceValue: unknown,
  ruleValue: unknown
): boolean {
  switch (operator) {
    case "equals":
      return String(sourceValue ?? "") === String(ruleValue ?? "");
    case "not_equals":
      return String(sourceValue ?? "") !== String(ruleValue ?? "");
    case "contains": {
      const str = String(sourceValue ?? "").toLowerCase();
      const search = String(ruleValue ?? "").toLowerCase();
      return str.includes(search);
    }
    case "is_empty":
      return sourceValue === null || sourceValue === undefined || sourceValue === "";
    case "is_not_empty":
      return sourceValue !== null && sourceValue !== undefined && sourceValue !== "";
    case "greater_than":
      return Number(sourceValue) > Number(ruleValue);
    case "less_than":
      return Number(sourceValue) < Number(ruleValue);
    default:
      return true;
  }
}

const ADDRESS_FIELD_KEYS = new Set([
  "address_line1", "address_line2", "city", "state", "zip", "country",
  "address",
]);

const DEFAULT_SECTION_ORDER: SectionLayout[] = [
  { section_key: "contact_profile", display_order: 0, is_visible: true, visibility_rule: null, section_type: "fields", section_label: "Contact Profile", section_icon: "file-text" },
  { section_key: "address", display_order: 1, is_visible: true, visibility_rule: null, section_type: "address", section_label: "Address", section_icon: "map-pin" },
];

export function DetailOverviewTab({
  contact,
  isSuperAdmin,
  userRole,
  sectionOrder,
  sectionFields,
  teamMembers,
  allCompanies,
}: DetailOverviewTabProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [pending, startTransition] = useTransition();

  // Inline layout editor awareness
  const layout = usePageLayout("contact_detail");
  let inlineLayout: ReturnType<typeof useInlineLayout> | null = null;
  try {
    inlineLayout = useInlineLayout();
  } catch {
    // Not inside InlineLayoutProvider - that's fine
  }
  const isEditing = inlineLayout?.state.isEditing ?? false;

  const [quickAddCompanyOpen, setQuickAddCompanyOpen] = useState(false);
  const [localCompanies, setLocalCompanies] = useState<CompanyData[]>(allCompanies);

  const [localContactData, setLocalContactData] = useState<Record<string, unknown>>(
    () => ({ ...contact } as Record<string, unknown>)
  );

  const saveContactField = useCallback(async (field: string, value: unknown) => {
    const updates: Record<string, unknown> = { [field]: value };
    if (field === "company_id") {
      const match = localCompanies.find((c) => c.id === value);
      updates.company_name = match?.name ?? null;
    }
    const { error } = await supabase
      .from("crm_contacts")
      .update(updates)
      .eq("id", contact.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [contact.id, localCompanies, supabase, toast]);

  const teamMemberLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const m of teamMembers) map[m.id] = m.full_name;
    return map;
  }, [teamMembers]);

  const companyLookup = useMemo(() => {
    const map: Record<string, string> = {};
    for (const c of localCompanies) map[c.id] = c.name;
    return map;
  }, [localCompanies]);

  const enrichedContactData = useMemo(() => {
    const data = { ...localContactData };
    const assignedTo = data.assigned_to as string | undefined;
    if (assignedTo && teamMemberLookup[assignedTo]) {
      data.assigned_to_display = teamMemberLookup[assignedTo];
    }
    const companyId = data.company_id as string | undefined;
    if (companyId && companyLookup[companyId]) {
      data.company_id_display = companyLookup[companyId];
    }
    return data;
  }, [localContactData, teamMemberLookup, companyLookup]);

  const sourceRegistry = useMemo(() => ({
    contact: {
      data: enrichedContactData,
      setData: setLocalContactData,
      save: saveContactField,
      serverData: contact as unknown as Record<string, unknown>,
    },
  }), [enrichedContactData, saveContactField, contact]);

  // --- Conditional Logic + Permissions ---

  const getFieldFilters = useCallback((sectionKey: string) => {
    const fields = sectionFields[sectionKey];
    const hiddenFieldKeys = new Set<string>();
    const readOnlyFieldKeys = new Set<string>();

    if (fields?.length) {
      const merged: Record<string, unknown> = {};
      for (const f of fields) {
        const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
        merged[propKey] = sourceRegistry.contact.data[propKey];
      }

      for (const f of fields) {
        if (!f.conditional_rules?.length) continue;
        let visible = true;
        const showRules = f.conditional_rules.filter((r) => r.action === "show");
        const hideRules = f.conditional_rules.filter((r) => r.action === "hide");
        if (showRules.length > 0) {
          visible = showRules.every((rule) => evaluateOperator(rule.operator, merged[rule.source_field], rule.value));
        }
        if (hideRules.length > 0 && hideRules.every((rule) => evaluateOperator(rule.operator, merged[rule.source_field], rule.value))) {
          visible = false;
        }
        if (!visible) hiddenFieldKeys.add(f.field_key);
      }

      if (!isSuperAdmin) {
        for (const f of fields) {
          if (!f.permissions || Object.keys(f.permissions).length === 0) continue;
          const rolePerm = f.permissions[userRole];
          if (!rolePerm) continue;
          if (rolePerm.view === false) hiddenFieldKeys.add(f.field_key);
          else if (rolePerm.edit === false) readOnlyFieldKeys.add(f.field_key);
        }
      }
    }

    return { hiddenFieldKeys, readOnlyFieldKeys };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionFields, isSuperAdmin, userRole, sourceRegistry]);

  // --- Resolve visible sections (only contact_profile + address) ---

  const ADDRESS_SECTION: SectionLayout = {
    section_key: "address", display_order: 99, is_visible: true,
    visibility_rule: null, section_type: "address", section_label: "Address", section_icon: "map-pin",
  };

  // When editing, use inline layout state for sections; when not, use server-provided data
  const resolvedSections = useMemo(() => {
    if (isEditing && inlineLayout) {
      // In edit mode, show ALL field sections from the inline layout state
      return inlineLayout.state.sections
        .filter((s) => s.section_type === "fields")
        .sort((a, b) => a.display_order - b.display_order);
    }

    // Normal mode: use server-provided section order
    const layoutSections = sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;

    const filtered = layoutSections
      .filter((s) => s.is_visible)
      .filter((s) => {
        if (!s.visibility_rule) return true;
        return true;
      })
      // Only keep contact_profile and address in the overview
      .filter((s) => s.section_key === "contact_profile" || s.section_key === "address")
      .sort((a, b) => a.display_order - b.display_order);

    if (!filtered.some((s) => s.section_key === "address")) {
      const cpIdx = filtered.findIndex((s) => s.section_key === "contact_profile");
      const insertAt = cpIdx >= 0 ? cpIdx + 1 : filtered.length;
      filtered.splice(insertAt, 0, ADDRESS_SECTION);
    }

    return filtered;
  }, [sectionOrder, isEditing, inlineLayout?.state.sections]);

  function handleInlineChange(fieldKey: string, value: unknown) {
    setLocalContactData((prev) => ({ ...prev, [fieldKey]: value }));
  }

  function handleInlineBlur(fieldKey: string) {
    const currentVal = enrichedContactData[fieldKey];
    const prevVal = (contact as unknown as Record<string, unknown>)[fieldKey];
    if (currentVal === prevVal) return;
    startTransition(async () => {
      const ok = await saveContactField(fieldKey, currentVal as never);
      if (!ok) {
        setLocalContactData((prev) => ({ ...prev, [fieldKey]: prevVal }));
      }
    });
  }

  function renderFieldSection(section: SectionLayout): ReactNode {
    let fields = sectionFields[section.section_key];
    if (!fields?.length) return null;

    if (section.section_key === "contact_profile") {
      fields = fields.filter((f) => !ADDRESS_FIELD_KEYS.has(f.field_key));
      if (!fields.length) return null;
    }

    const merged: Record<string, unknown> = {};
    for (const f of fields) {
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      merged[propKey] = enrichedContactData[propKey];
      const displayKey = `${propKey}_display`;
      if (displayKey in enrichedContactData) {
        merged[displayKey] = enrichedContactData[displayKey];
      }
    }

    const { hiddenFieldKeys, readOnlyFieldKeys } = getFieldFilters(section.section_key);
    const Icon = getSectionIcon(section.section_icon);

    const optionsOverrides: Record<string, { label: string; value: string }[]> = {
      assigned_to: teamMembers.map((m) => ({ label: m.full_name, value: m.id })),
      company_id: localCompanies.map((c) => ({ label: c.name, value: c.id })),
    };

    return (
      <SectionCard key={section.section_key} title={section.section_label} icon={Icon}>
        {renderDynamicFieldsInline(
          fields,
          merged,
          isSuperAdmin,
          {
            onChange: handleInlineChange,
            onBlur: handleInlineBlur,
            disabled: pending,
            optionsOverrides,
          },
          hiddenFieldKeys,
          readOnlyFieldKeys,
        )}
      </SectionCard>
    );
  }

  function handleAddressSelect(parsed: ParsedAddress) {
    const updates: Record<string, string> = {
      address_line1: parsed.address_line1,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
    };
    setLocalContactData((prev) => ({ ...prev, ...updates }));
    startTransition(async () => {
      const { error } = await supabase
        .from("crm_contacts")
        .update(updates)
        .eq("id", contact.id);
      if (error) {
        toast({ title: "Error saving address", description: error.message, variant: "destructive" });
      }
    });
  }

  function renderAddressSection(): ReactNode {
    return (
      <SectionCard title="Address" icon={MapPin} key="address">
        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
            <div className="space-y-1.5">
              <Label className="text-xs">Address</Label>
              <AddressAutocomplete
                value={(localContactData.address_line1 as string) ?? ""}
                onChange={(val) => setLocalContactData((prev) => ({ ...prev, address_line1: val }))}
                onAddressSelect={handleAddressSelect}
                placeholder="Start typing an address..."
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address Line 2</Label>
              <Input
                value={(localContactData.address_line2 as string) ?? ""}
                onChange={(e) => setLocalContactData((prev) => ({ ...prev, address_line2: e.target.value || null }))}
                onBlur={() => {
                  const currentVal = localContactData.address_line2;
                  const prevVal = (contact as unknown as Record<string, unknown>).address_line2;
                  if (currentVal === prevVal) return;
                  startTransition(async () => {
                    const ok = await saveContactField("address_line2", currentVal);
                    if (!ok) setLocalContactData((prev) => ({ ...prev, address_line2: prevVal }));
                  });
                }}
                disabled={pending}
                placeholder="Suite, unit, etc."
              />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
            {[
              { key: "city", label: "City" },
              { key: "state", label: "State" },
              { key: "zip", label: "Zip" },
            ].map((f) => (
              <div key={f.key} className="space-y-1.5">
                <Label className="text-xs">{f.label}</Label>
                <Input
                  value={((localContactData[f.key] as string) ?? "") || ""}
                  onChange={(e) => setLocalContactData((prev) => ({ ...prev, [f.key]: e.target.value || null }))}
                  onBlur={() => {
                    const currentVal = localContactData[f.key];
                    const prevVal = (contact as unknown as Record<string, unknown>)[f.key];
                    if (currentVal === prevVal) return;
                    startTransition(async () => {
                      const ok = await saveContactField(f.key, currentVal);
                      if (!ok) setLocalContactData((prev) => ({ ...prev, [f.key]: prevVal }));
                    });
                  }}
                  disabled={pending}
                  placeholder={f.label}
                />
              </div>
            ))}
          </div>
        </div>
      </SectionCard>
    );
  }

  function renderSection(section: SectionLayout): ReactNode {
    if (section.section_key === "address") {
      return renderAddressSection();
    }
    return renderFieldSection(section);
  }

  // Get all used field keys for the FieldPicker
  const allUsedFieldKeys = useMemo(() => {
    if (!isEditing || !inlineLayout) return new Set<string>();
    const keys = new Set<string>();
    for (const f of inlineLayout.state.fields) keys.add(f.field_key);
    return keys;
  }, [isEditing, inlineLayout?.state.fields]);

  // Convert SectionLayout (CRM type) to LayoutSection for EditableSection compatibility
  function toLayoutSection(section: SectionLayout | LayoutSection, idx: number): LayoutSection {
    // If it already has an id field, it's a LayoutSection from inline state
    if ("id" in section && "page_type" in section) return section as LayoutSection;
    // Otherwise build a compatible object from SectionLayout
    return {
      id: (section as SectionLayout).section_key,
      page_type: "contact_detail",
      section_key: (section as SectionLayout).section_key,
      section_label: section.section_label,
      section_icon: section.section_icon,
      display_order: section.display_order,
      is_visible: section.is_visible,
      is_locked: false,
      sidebar: false,
      section_type: section.section_type,
      tab_key: null,
      tab_label: null,
      tab_icon: null,
      tab_order: 0,
      tab_locked: false,
      card_type_id: null,
    };
  }

  return (
    <div className="flex flex-col gap-5">
      {resolvedSections.map((section, sectionIdx) => {
        const content = renderSection(section as SectionLayout);
        if (!isEditing) return content;

        const layoutSec = toLayoutSection(section, sectionIdx);
        const fieldSections = resolvedSections.filter(s => ("section_type" in s ? s.section_type : "") === "fields");

        return (
          <EditableSection
            key={layoutSec.id}
            section={layoutSec}
            sectionIndex={sectionIdx}
            totalSections={fieldSections.length}
          >
            {content}
            {/* Add Field button in edit mode */}
            <div className="mt-3 flex justify-center pb-2">
              <FieldPicker
                sectionId={layoutSec.id}
                usedFieldKeys={allUsedFieldKeys}
              />
            </div>
          </EditableSection>
        );
      })}

      <QuickAddCompanyDialog
        open={quickAddCompanyOpen}
        onOpenChange={setQuickAddCompanyOpen}
        onCompanyCreated={(company) => {
          setLocalCompanies((prev) => [...prev, { id: company.id, company_number: company.company_number, name: company.name, company_type: company.company_type }]);
        }}
      />
    </div>
  );
}
