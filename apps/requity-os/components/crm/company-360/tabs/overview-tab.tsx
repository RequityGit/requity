"use client";

import { useState, useCallback, useMemo, useTransition, type ReactNode } from "react";
import {
  Building2,
  MapPin,
  Landmark,
  FileText,
  Banknote,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SectionCard,
  FieldRow,
} from "@/components/crm/contact-360/contact-detail-shared";
import {
  renderDynamicFieldsInline,
  type LayoutEditConfig,
} from "@/components/crm/shared-field-renderer";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
import { US_STATES } from "@/lib/constants";
import { updateCompanyAction } from "@/app/(authenticated)/(admin)/companies/actions";
import { AddressAutocomplete, type ParsedAddress } from "@/components/ui/address-autocomplete";
import type {
  CompanyDetailData,
  CompanyWireData,
  CompanyFileData,
} from "../types";
import {
  COMPANY_TYPE_CONFIG,
  SUBTYPE_LABELS,
  PROGRAM_LABELS,
  ASSET_LABELS,
  CAPABILITY_LABELS,
} from "../types";
import type {
  SectionLayout,
  FieldLayout,
} from "@/components/crm/contact-360/types";
import { usePageLayout } from "@/hooks/usePageLayout";
import { useOptionalInlineLayout } from "@/components/inline-layout-editor/InlineLayoutContext";
import { EditableSection } from "@/components/inline-layout-editor/EditableSection";
import { FieldPicker } from "@/components/inline-layout-editor/FieldPicker";
import type { LayoutSection } from "@/hooks/useDealLayout";


interface OverviewTabProps {
  company: CompanyDetailData;
  wireInstructions: CompanyWireData | null;
  files: CompanyFileData[];
  onEditLenderDetails?: () => void;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
}

const COMPANY_TYPE_OPTIONS = Object.entries(COMPANY_TYPE_CONFIG).map(
  ([value, { label }]) => ({ value, label })
);

const GEOGRAPHY_OPTIONS: Record<string, string> = Object.fromEntries(
  US_STATES.map((s) => [s.value, s.value])
);

// Default section order used when no layout data exists in the database
const DEFAULT_SECTION_ORDER: SectionLayout[] = [
  { section_key: "company_information", display_order: 0, is_visible: true, visibility_rule: null, section_type: "fields", section_label: "Company Information", section_icon: "building-2" },
  { section_key: "address", display_order: 2, is_visible: true, visibility_rule: null, section_type: "fields", section_label: "Address", section_icon: "map-pin" },
  { section_key: "lender_details", display_order: 3, is_visible: true, visibility_rule: "is_lender", section_type: "fields", section_label: "Lender Details", section_icon: "landmark" },
  { section_key: "capabilities_coverage", display_order: 4, is_visible: true, visibility_rule: "not_lender", section_type: "fields", section_label: "Capabilities & Coverage", section_icon: "target" },
  { section_key: "wire_instructions", display_order: 5, is_visible: true, visibility_rule: null, section_type: "fields", section_label: "Wire Instructions", section_icon: "credit-card" },
  { section_key: "description", display_order: 6, is_visible: true, visibility_rule: null, section_type: "fields", section_label: "Description", section_icon: "file-text" },
];

function ChipGroup({
  items,
  labelMap,
  color,
}: {
  items: string[];
  labelMap: Record<string, string>;
  color: string;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border whitespace-nowrap"
          style={{ borderColor: color, color }}
        >
          {labelMap[item] ||
            item
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      ))}
      {items.length === 0 && (
        <span className="text-xs text-muted-foreground italic">None configured</span>
      )}
    </div>
  );
}

function EditableChipGroup({
  field,
  selected,
  options,
  color,
  disabled,
  onChange,
}: {
  field: string;
  selected: string[];
  options: Record<string, string>;
  color: string;
  disabled?: boolean;
  onChange: (field: string, value: string[]) => void;
}) {
  function toggle(key: string) {
    if (disabled) return;
    const next = selected.includes(key)
      ? selected.filter((k) => k !== key)
      : [...selected, key];
    onChange(field, next);
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {Object.entries(options).map(([key, label]) => {
        const active = selected.includes(key);
        return (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => toggle(key)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium border whitespace-nowrap transition-colors",
              "hover:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed",
              active ? "text-white" : "opacity-40 hover:opacity-70",
            )}
            style={
              active
                ? { borderColor: color, backgroundColor: color, color: "#fff" }
                : { borderColor: color, color }
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function CompanyOverviewTab({
  company,
  wireInstructions,
  files,
  onEditLenderDetails,
  sectionOrder,
  sectionFields,
}: OverviewTabProps) {
  const { toast } = useToast();
  const [localData, setLocalData] = useState<Record<string, unknown>>(
    () => company as unknown as Record<string, unknown>
  );
  const [pending, startTransition] = useTransition();
  const [showWire, setShowWire] = useState(false);

  // Inline layout editor awareness
  const layout = usePageLayout("company_detail");
  const inlineLayout = useOptionalInlineLayout();
  const isEditing = inlineLayout?.state.isEditing ?? false;

  const types = (localData.company_types as string[] | undefined)?.length
    ? (localData.company_types as string[])
    : [localData.company_type as string];
  const isLender = types.includes("lender");

  function handleChange(field: string, value: unknown) {
    setLocalData((prev) => ({ ...prev, [field]: value }));
  }

  function handleBlur(field: string) {
    const currentVal = localData[field];
    const prevVal = (company as unknown as Record<string, unknown>)[field];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const updates: Record<string, unknown> = { id: company.id, [field]: currentVal };
      if (field === "company_types" && Array.isArray(currentVal) && (currentVal as string[]).length > 0) {
        updates.company_type = (currentVal as string[])[0];
      }
      const result = await updateCompanyAction(updates as any);
      if ("error" in result && result.error) {
        toast({ title: "Error saving", description: result.error, variant: "destructive" });
        setLocalData((prev) => ({ ...prev, [field]: prevVal }));
      }
    });
  }

  function handleLenderArrayChange(field: string, value: string[]) {
    const prevVal = localData[field];
    setLocalData((prev) => ({ ...prev, [field]: value }));
    startTransition(async () => {
      const result = await updateCompanyAction({ id: company.id, [field]: value } as any);
      if ("error" in result && result.error) {
        toast({ title: "Error saving", description: result.error, variant: "destructive" });
        setLocalData((prev) => ({ ...prev, [field]: prevVal }));
      }
    });
  }

  const hasCapabilitiesCoverage = !isLender &&
    ((company.company_capabilities ?? []).length > 0 ||
      (company.asset_types ?? []).length > 0 ||
      (company.geographies ?? []).length > 0);

  const resolvedSections = useMemo(() => {
    if (isEditing && inlineLayout) {
      // In edit mode, show ALL sections from the inline layout state
      return inlineLayout.state.sections
        .sort((a, b) => a.display_order - b.display_order)
        .map((s) => s.section_key);
    }

    const layoutData = sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;

    const visibilityContext: Record<string, boolean> = {
      is_lender: isLender,
      not_lender: !isLender,
      has_wire: !!wireInstructions,
    };

    return layoutData
      .filter((s) => s.is_visible)
      .filter((s) => {
        if (!s.visibility_rule) return true;
        return visibilityContext[s.visibility_rule] ?? true;
      })
      .sort((a, b) => a.display_order - b.display_order)
      .map((s) => s.section_key);
  }, [sectionOrder, isLender, wireInstructions, isEditing, inlineLayout?.state.sections]);

  const inlineCallbacks = useMemo(() => ({
    onChange: handleChange,
    onBlur: handleBlur,
    disabled: pending,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [pending, localData, company]);

  function renderCompanyInfoFallback() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
        <div className="space-y-0">
          <span className="inline-field-label">Legal Name</span>
          <Input
            value={(localData.name as string) ?? ""}
            onChange={(e) => handleChange("name", e.target.value || null)}
            onBlur={() => handleBlur("name")}
            disabled={pending}
            placeholder="Legal Name"
            className="inline-field"
          />
        </div>
        <div className="space-y-0">
          <span className="inline-field-label">DBA / Other Names</span>
          <Input
            value={(localData.other_names as string) ?? ""}
            onChange={(e) => handleChange("other_names", e.target.value || null)}
            onBlur={() => handleBlur("other_names")}
            disabled={pending}
            placeholder="DBA / Other Names"
            className="inline-field"
          />
        </div>
        <div className="space-y-0">
          <span className="inline-field-label">Company Type</span>
          <Select
            value={types[0] ?? ""}
            onValueChange={(val) => {
              handleChange("company_types", [val]);
              handleChange("company_type", val);
              setTimeout(() => handleBlur("company_types"), 0);
            }}
            disabled={pending}
          >
            <SelectTrigger className="inline-field">
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-0">
          <span className="inline-field-label">Phone</span>
          <Input
            type="tel"
            value={(localData.phone as string) ?? ""}
            onChange={(e) => handleChange("phone", e.target.value || null)}
            onBlur={() => handleBlur("phone")}
            disabled={pending}
            placeholder="Phone"
            className="inline-field"
          />
        </div>
        <div className="space-y-0">
          <span className="inline-field-label">Email</span>
          <Input
            type="email"
            value={(localData.email as string) ?? ""}
            onChange={(e) => handleChange("email", e.target.value || null)}
            onBlur={() => handleBlur("email")}
            disabled={pending}
            placeholder="Email"
            className="inline-field"
          />
        </div>
        <div className="space-y-0">
          <span className="inline-field-label">Website</span>
          <Input
            value={(localData.website as string) ?? ""}
            onChange={(e) => handleChange("website", e.target.value || null)}
            onBlur={() => handleBlur("website")}
            disabled={pending}
            placeholder="Website"
            className="inline-field"
          />
        </div>
        <div className="space-y-0">
          <span className="inline-field-label">Source</span>
          <Input
            value={(localData.source as string) ?? ""}
            onChange={(e) => handleChange("source", e.target.value || null)}
            onBlur={() => handleBlur("source")}
            disabled={pending}
            placeholder="Source"
            className="inline-field"
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="inline-field-label">Active</span>
          <Switch
            checked={!!localData.is_active}
            onCheckedChange={(checked) => {
              handleChange("is_active", checked);
              setTimeout(() => handleBlur("is_active"), 0);
            }}
            disabled={pending}
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <span className="inline-field-label">Title Co. Verified</span>
          <Switch
            checked={!!localData.title_company_verified}
            onCheckedChange={(checked) => {
              handleChange("title_company_verified", checked);
              setTimeout(() => handleBlur("title_company_verified"), 0);
            }}
            disabled={pending}
          />
        </div>
      </div>
    );
  }

  function handleAddressSelect(parsed: ParsedAddress) {
    const updates: Record<string, unknown> = {
      address_line1: parsed.address_line1,
      city: parsed.city,
      state: parsed.state,
      zip: parsed.zip,
    };
    setLocalData((prev) => ({ ...prev, ...updates }));

    startTransition(async () => {
      const result = await updateCompanyAction({ id: company.id, ...updates } as any);
      if ("error" in result && result.error) {
        toast({ title: "Error saving address", description: result.error, variant: "destructive" });
      }
    });
  }

  function renderAddressFallback() {
    return (
      <div className="flex flex-col gap-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
          <div className="space-y-0">
            <span className="inline-field-label">Address</span>
            <AddressAutocomplete
              value={(localData.address_line1 as string) ?? ""}
              onChange={(val) => handleChange("address_line1", val)}
              onAddressSelect={handleAddressSelect}
              placeholder="Start typing an address..."
              disabled={pending}
              className="inline-field"
            />
          </div>
          <div className="space-y-0">
            <span className="inline-field-label">Address Line 2</span>
            <Input
              value={(localData.address_line2 as string) ?? ""}
              onChange={(e) => handleChange("address_line2", e.target.value || null)}
              onBlur={() => handleBlur("address_line2")}
              disabled={pending}
              placeholder="Suite, unit, etc."
              className="inline-field"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2.5">
          {[
            { key: "city", label: "City" },
            { key: "state", label: "State" },
            { key: "zip", label: "Zip" },
            { key: "country", label: "Country" },
          ].map((f) => (
            <div key={f.key} className="space-y-0">
              <span className="inline-field-label">{f.label}</span>
              <Input
                value={((localData[f.key] as string) ?? (f.key === "country" ? "US" : "")) || ""}
                onChange={(e) => handleChange(f.key, e.target.value || null)}
                onBlur={() => handleBlur(f.key)}
                disabled={pending}
                placeholder={f.label}
                className="inline-field"
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Compute layout section IDs for field-level editing
  function getLayoutSectionId(sectionKey: string): string | undefined {
    if (isEditing && inlineLayout) {
      const found = inlineLayout.state.sections.find((s) => s.section_key === sectionKey);
      if (found) return found.id;
    }
    return sectionKey;
  }

  function getEditConfig(sectionKey: string): LayoutEditConfig | undefined {
    if (!isEditing) return undefined;
    const sectionId = getLayoutSectionId(sectionKey);
    return sectionId ? { sectionId } : undefined;
  }

  const sectionContent: Record<string, ReactNode> = {
    company_information: (
      <SectionCard title="Company Information" icon={Building2} key="company_information">
        {sectionFields.company_information?.length
          ? renderDynamicFieldsInline(
              sectionFields.company_information,
              localData,
              false,
              inlineCallbacks,
              undefined,
              undefined,
              getEditConfig("company_information"),
            )
          : renderCompanyInfoFallback()}
      </SectionCard>
    ),

    address: (
      <SectionCard title="Address" icon={MapPin} key="address">
        {renderAddressFallback()}
      </SectionCard>
    ),

    lender_details: isLender ? (
      <SectionCard title="Lender Details" icon={Landmark} key="lender_details">
        <div className="flex flex-col gap-5">
          <div>
            <div className="rq-micro-label mb-2">Programs</div>
            <EditableChipGroup
              field="lender_programs"
              selected={(localData.lender_programs as string[]) ?? []}
              options={PROGRAM_LABELS}
              color="#3B82F6"
              disabled={pending}
              onChange={handleLenderArrayChange}
            />
          </div>
          <div>
            <div className="rq-micro-label mb-2">Asset Types</div>
            <EditableChipGroup
              field="asset_types"
              selected={(localData.asset_types as string[]) ?? []}
              options={ASSET_LABELS}
              color="#E5930E"
              disabled={pending}
              onChange={handleLenderArrayChange}
            />
          </div>
          <div>
            <div className="rq-micro-label mb-2">Geographies</div>
            <EditableChipGroup
              field="geographies"
              selected={(localData.geographies as string[]) ?? []}
              options={GEOGRAPHY_OPTIONS}
              color="#22A861"
              disabled={pending}
              onChange={handleLenderArrayChange}
            />
          </div>
          <div>
            <div className="rq-micro-label mb-2">Capabilities</div>
            <EditableChipGroup
              field="company_capabilities"
              selected={(localData.company_capabilities as string[]) ?? []}
              options={CAPABILITY_LABELS}
              color="#8B5CF6"
              disabled={pending}
              onChange={handleLenderArrayChange}
            />
          </div>
        </div>
      </SectionCard>
    ) : null,

    capabilities_coverage: hasCapabilitiesCoverage ? (
      <SectionCard title="Capabilities & Coverage" icon={Target} key="capabilities_coverage">
        <div className="flex flex-col gap-4">
          {(company.company_capabilities ?? []).length > 0 && (
            <div>
              <div className="rq-micro-label mb-2">Capabilities</div>
              <ChipGroup items={company.company_capabilities!} labelMap={CAPABILITY_LABELS} color="#8B5CF6" />
            </div>
          )}
          {(company.asset_types ?? []).length > 0 && (
            <div>
              <div className="rq-micro-label mb-2">Asset Types</div>
              <ChipGroup items={company.asset_types!} labelMap={ASSET_LABELS} color="#E5930E" />
            </div>
          )}
          {(company.geographies ?? []).length > 0 && (
            <div>
              <div className="rq-micro-label mb-2">Geographies</div>
              <ChipGroup items={company.geographies!} labelMap={{}} color="#22A861" />
            </div>
          )}
        </div>
      </SectionCard>
    ) : null,

    wire_instructions: (
      <SectionCard
        title="Wire Instructions"
        icon={Banknote}
        key="wire_instructions"
        action={
          wireInstructions ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-7 text-muted-foreground"
              onClick={() => setShowWire(!showWire)}
            >
              {showWire ? <EyeOff size={13} strokeWidth={1.5} /> : <Eye size={13} strokeWidth={1.5} />}
              {showWire ? "Hide" : "Reveal"}
            </Button>
          ) : undefined
        }
      >
        {wireInstructions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <FieldRow label="Bank Name" value={wireInstructions.bank_name} />
            <FieldRow label="Account Name" value={wireInstructions.account_name} />
            <FieldRow
              label="Account Number"
              value={showWire ? wireInstructions.account_number : wireInstructions.account_number.replace(/./g, (c, i) => i < wireInstructions.account_number.length - 4 ? "\u25CF" : c)}
              mono
            />
            <FieldRow
              label="Routing Number"
              value={showWire ? wireInstructions.routing_number : wireInstructions.routing_number.replace(/./g, (c, i) => i < wireInstructions.routing_number.length - 4 ? "\u25CF" : c)}
              mono
            />
            <FieldRow label="Wire Type" value={wireInstructions.wire_type.charAt(0).toUpperCase() + wireInstructions.wire_type.slice(1)} />
            <FieldRow label="Last Updated" value={`${formatDate(wireInstructions.updated_at)}${wireInstructions.updated_by ? ` by ${wireInstructions.updated_by}` : ""}`} />
          </div>
        ) : (
          <span className="text-[13px] text-muted-foreground">No wire instructions on file.</span>
        )}
      </SectionCard>
    ),

    description: (
      <SectionCard title="Description" icon={FileText} key="description">
        <Textarea
          value={(localData.notes as string) ?? ""}
          onChange={(e) => handleChange("notes", e.target.value || null)}
          onBlur={() => handleBlur("notes")}
          disabled={pending}
          rows={4}
          placeholder="Add a description..."
          className="text-sm"
        />
      </SectionCard>
    ),
  };

  // Convert SectionLayout (CRM type) to LayoutSection for EditableSection compatibility
  function toLayoutSection(sectionKey: string): LayoutSection {
    // If editing, check inline layout state first
    if (isEditing && inlineLayout) {
      const found = inlineLayout.state.sections.find((s) => s.section_key === sectionKey);
      if (found) return found;
    }
    // Build a compatible object from the section order
    const sectionData = sectionOrder.find((s) => s.section_key === sectionKey)
      ?? DEFAULT_SECTION_ORDER.find((s) => s.section_key === sectionKey);
    return {
      id: sectionKey,
      page_type: "company_detail",
      section_key: sectionKey,
      section_label: sectionData?.section_label ?? sectionKey,
      section_icon: sectionData?.section_icon ?? "building-2",
      display_order: sectionData?.display_order ?? 0,
      is_visible: sectionData?.is_visible ?? true,
      is_locked: false,
      sidebar: false,
      section_type: sectionData?.section_type ?? "fields",
      tab_key: null,
      tab_label: null,
      tab_icon: null,
      tab_order: 0,
      tab_locked: false,
      card_type_id: null,
    };
  }

  // Get all used field keys for the FieldPicker
  const allUsedFieldKeys = useMemo(() => {
    if (!isEditing || !inlineLayout) return new Set<string>();
    const keys = new Set<string>();
    for (const f of inlineLayout.state.fields) keys.add(f.field_key);
    return keys;
  }, [isEditing, inlineLayout?.state.fields]);

  return (
    <div className="flex flex-col gap-5">
      {resolvedSections.map((key, idx) => {
        const content = sectionContent[key];
        if (!content) return null;

        if (!isEditing) return content;

        const layoutSec = toLayoutSection(key);
        return (
          <EditableSection
            key={layoutSec.id}
            section={layoutSec}
            sectionIndex={idx}
            totalSections={resolvedSections.length}
          >
            {content}
            {layoutSec.section_type === "fields" && (
              <div className="mt-3 flex justify-center pb-2">
                <FieldPicker
                  sectionId={layoutSec.id}
                  usedFieldKeys={allUsedFieldKeys}
                />
              </div>
            )}
          </EditableSection>
        );
      })}
    </div>
  );
}
