"use client";

import { useState, useCallback, useMemo, useTransition, type ReactNode } from "react";
import {
  TrendingUp,
  Building2,
  MapPin,
  Landmark,
  FileText,
  Banknote,
  Target,
  Eye,
  EyeOff,
} from "lucide-react";
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
  MetricCard,
  FieldRow,
} from "@/components/crm/contact-360/contact-detail-shared";
import {
  renderDynamicFieldsInline,
} from "@/components/crm/shared-field-renderer";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
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

// Default section order used when no layout data exists in the database
const DEFAULT_SECTION_ORDER: SectionLayout[] = [
  { section_key: "lender_performance", display_order: 0, is_visible: true, visibility_rule: "is_lender", section_type: "system", section_label: "Lender Performance", section_icon: "trending-up" },
  { section_key: "company_information", display_order: 1, is_visible: true, visibility_rule: null, section_type: "fields", section_label: "Company Information", section_icon: "building-2" },
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

  const hasCapabilitiesCoverage = !isLender &&
    ((company.company_capabilities ?? []).length > 0 ||
      (company.asset_types ?? []).length > 0 ||
      (company.geographies ?? []).length > 0);

  const resolvedSections = useMemo(() => {
    const layout = sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;

    const visibilityContext: Record<string, boolean> = {
      is_lender: isLender,
      not_lender: !isLender,
      has_wire: !!wireInstructions,
    };

    return layout
      .filter((s) => s.is_visible)
      .filter((s) => {
        if (!s.visibility_rule) return true;
        return visibilityContext[s.visibility_rule] ?? true;
      })
      .sort((a, b) => a.display_order - b.display_order)
      .map((s) => s.section_key);
  }, [sectionOrder, isLender, wireInstructions]);

  const inlineCallbacks = useMemo(() => ({
    onChange: handleChange,
    onBlur: handleBlur,
    disabled: pending,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [pending, localData, company]);

  function renderCompanyInfoFallback() {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
        <div className="space-y-1.5">
          <Label className="text-xs">Legal Name</Label>
          <Input
            value={(localData.name as string) ?? ""}
            onChange={(e) => handleChange("name", e.target.value || null)}
            onBlur={() => handleBlur("name")}
            disabled={pending}
            placeholder="Legal Name"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">DBA / Other Names</Label>
          <Input
            value={(localData.other_names as string) ?? ""}
            onChange={(e) => handleChange("other_names", e.target.value || null)}
            onBlur={() => handleBlur("other_names")}
            disabled={pending}
            placeholder="DBA / Other Names"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Company Type</Label>
          <Select
            value={types[0] ?? ""}
            onValueChange={(val) => {
              handleChange("company_types", [val]);
              handleChange("company_type", val);
              setTimeout(() => handleBlur("company_types"), 0);
            }}
            disabled={pending}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {COMPANY_TYPE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phone</Label>
          <Input
            type="tel"
            value={(localData.phone as string) ?? ""}
            onChange={(e) => handleChange("phone", e.target.value || null)}
            onBlur={() => handleBlur("phone")}
            disabled={pending}
            placeholder="Phone"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Email</Label>
          <Input
            type="email"
            value={(localData.email as string) ?? ""}
            onChange={(e) => handleChange("email", e.target.value || null)}
            onBlur={() => handleBlur("email")}
            disabled={pending}
            placeholder="Email"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Website</Label>
          <Input
            value={(localData.website as string) ?? ""}
            onChange={(e) => handleChange("website", e.target.value || null)}
            onBlur={() => handleBlur("website")}
            disabled={pending}
            placeholder="Website"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Source</Label>
          <Input
            value={(localData.source as string) ?? ""}
            onChange={(e) => handleChange("source", e.target.value || null)}
            onBlur={() => handleBlur("source")}
            disabled={pending}
            placeholder="Source"
          />
        </div>
        <div className="flex items-center justify-between py-2">
          <Label className="text-xs">Active</Label>
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
          <Label className="text-xs">Title Co. Verified</Label>
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
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <AddressAutocomplete
              value={(localData.address_line1 as string) ?? ""}
              onChange={(val) => handleChange("address_line1", val)}
              onAddressSelect={handleAddressSelect}
              placeholder="Start typing an address..."
              disabled={pending}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address Line 2</Label>
            <Input
              value={(localData.address_line2 as string) ?? ""}
              onChange={(e) => handleChange("address_line2", e.target.value || null)}
              onBlur={() => handleBlur("address_line2")}
              disabled={pending}
              placeholder="Suite, unit, etc."
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
            <div key={f.key} className="space-y-1.5">
              <Label className="text-xs">{f.label}</Label>
              <Input
                value={((localData[f.key] as string) ?? (f.key === "country" ? "US" : "")) || ""}
                onChange={(e) => handleChange(f.key, e.target.value || null)}
                onBlur={() => handleBlur(f.key)}
                disabled={pending}
                placeholder={f.label}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const sectionContent: Record<string, ReactNode> = {
    lender_performance: isLender ? (
      <SectionCard title="Lender Performance" icon={TrendingUp} key="lender_performance">
        <div className="flex gap-5 flex-wrap">
          <MetricCard label="Deals Submitted" value="\u2014" />
          <MetricCard label="Deals Funded" value="\u2014" />
          <MetricCard label="Hit Rate" value="\u2014" mono />
          <MetricCard label="Funded Volume" value="\u2014" mono />
          <MetricCard label="Avg Rate" value="\u2014" mono />
          <MetricCard label="Avg Close Time" value="\u2014" mono />
        </div>
      </SectionCard>
    ) : null,

    company_information: (
      <SectionCard title="Company Information" icon={Building2} key="company_information">
        {sectionFields.company_information?.length
          ? renderDynamicFieldsInline(sectionFields.company_information, localData, false, inlineCallbacks)
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
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Programs</div>
            <ChipGroup items={company.lender_programs ?? []} labelMap={PROGRAM_LABELS} color="#3B82F6" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Types</div>
            <ChipGroup items={company.asset_types ?? []} labelMap={ASSET_LABELS} color="#E5930E" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Geographies</div>
            <ChipGroup items={company.geographies ?? []} labelMap={{}} color="#22A861" />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Capabilities</div>
            <ChipGroup items={company.company_capabilities ?? []} labelMap={CAPABILITY_LABELS} color="#8B5CF6" />
          </div>
        </div>
      </SectionCard>
    ) : null,

    capabilities_coverage: hasCapabilitiesCoverage ? (
      <SectionCard title="Capabilities & Coverage" icon={Target} key="capabilities_coverage">
        <div className="flex flex-col gap-4">
          {(company.company_capabilities ?? []).length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Capabilities</div>
              <ChipGroup items={company.company_capabilities!} labelMap={CAPABILITY_LABELS} color="#8B5CF6" />
            </div>
          )}
          {(company.asset_types ?? []).length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Asset Types</div>
              <ChipGroup items={company.asset_types!} labelMap={ASSET_LABELS} color="#E5930E" />
            </div>
          )}
          {(company.geographies ?? []).length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Geographies</div>
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

  return (
    <div className="flex flex-col gap-5">
      {resolvedSections.map((key) => sectionContent[key])}
    </div>
  );
}
