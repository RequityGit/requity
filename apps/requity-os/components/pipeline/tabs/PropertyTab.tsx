"use client";

import { useState, useEffect, useCallback, useTransition, useMemo } from "react";
import { updatePropertyDataAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import type { UnifiedCardType, UwFieldDef } from "../pipeline-types";
import { UwField } from "../UwField";
import { useUwFieldConfigs } from "@/hooks/useUwFieldConfigs";
import { useDealLayout } from "@/hooks/useDealLayout";
import type { VisibilityContext } from "@/lib/visibility-engine";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { RentRollSubTab } from "./financials/RentRollSubTab";
import { T12SubTab } from "./financials/T12SubTab";
import { useOptionalInlineLayout } from "@/components/inline-layout-editor/InlineLayoutContext";
import { EditableSection } from "@/components/inline-layout-editor/EditableSection";
import { EditableFieldSlot } from "@/components/inline-layout-editor/EditableFieldSlot";
import { FieldPicker } from "@/components/inline-layout-editor/FieldPicker";

// ── Column span mapping (static for Tailwind purging) ──

const SPAN_CLASS: Record<string, string> = {
  full: "col-span-12",
  third: "col-span-12 sm:col-span-4",
  quarter: "col-span-12 sm:col-span-3",
  half: "col-span-12 sm:col-span-6",
};

interface PropertyTabProps {
  dealId: string;
  propertyData: Record<string, unknown>;
  cardType: UnifiedCardType;
  visibilityContext?: VisibilityContext | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rentRoll?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  income?: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expenses?: any[];
  uwId?: string | null;
  purchasePrice?: number;
  numUnits?: number;
}

const PROPERTY_SECTIONS = ["Property Info", "Rent Roll", "T12 / Historicals"];

function sectionId(name: string) {
  return name.toLowerCase().replace(/[\s\/]+/g, "-");
}

export function PropertyTab({
  dealId,
  propertyData,
  cardType,
  visibilityContext,
  rentRoll = [],
  income = [],
  expenses = [],
  uwId = null,
  purchasePrice = 0,
  numUnits = 0,
}: PropertyTabProps) {
  const [activeSection, setActiveSection] = useState(sectionId(PROPERTY_SECTIONS[0]));

  const scrollToSection = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0.1 }
    );

    const ids = PROPERTY_SECTIONS.map(sectionId);
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-0">
      {/* Sticky jump nav */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/40 -mx-1 px-1 py-2 mb-4">
        <div className="inline-flex gap-1 items-center">
          {PROPERTY_SECTIONS.map((s) => {
            const id = sectionId(s);
            return (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-[11px] font-medium cursor-pointer transition-colors",
                  activeSection === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Section: Property Info */}
      <div id="property-info" className="scroll-mt-16">
        <PropertyDetailsContent
          dealId={dealId}
          propertyData={propertyData}
          cardType={cardType}
          visibilityContext={visibilityContext}
        />
      </div>

      {/* Section: Rent Roll */}
      <div id="rent-roll" className="scroll-mt-16 mt-6">
        <SectionHeader
          title="Rent Roll"
          action={
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">
                {rentRoll.length} unit{rentRoll.length !== 1 ? "s" : ""}
              </span>
            </div>
          }
        />
        <div className="mt-3">
          <RentRollSubTab rentRoll={rentRoll} uwId={uwId} />
        </div>
      </div>

      {/* Section: T12 / Historicals */}
      <div id="t12---historicals" className="scroll-mt-16 mt-6 mb-8">
        <SectionHeader title="T12 / Historicals" />
        <div className="mt-3">
          <T12SubTab
            income={income}
            expenses={expenses}
            uwId={uwId}
            purchasePrice={purchasePrice}
            numUnits={numUnits}
          />
        </div>
      </div>
    </div>
  );
}

// ── Section Header ──

function SectionHeader({
  title,
  badge,
  action,
}: {
  title: string;
  badge?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {badge && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            {badge}
          </span>
        )}
      </div>
      {action}
    </div>
  );
}

// ── Property Details ──

function PropertyDetailsContent({
  dealId,
  propertyData,
  cardType,
  visibilityContext,
}: {
  dealId: string;
  propertyData: Record<string, unknown>;
  cardType: UnifiedCardType;
  visibilityContext?: VisibilityContext | null;
}) {
  const { byObject, fieldMap: uwFieldMap, loading: fieldsLoading, error: fieldsError } = useUwFieldConfigs(visibilityContext);
  const layout = useDealLayout();

  const [localData, setLocalData] = useState<Record<string, unknown>>(propertyData);
  const [pending, startTransition] = useTransition();
  const [enriching, setEnriching] = useState(false);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);

  const layoutSections = useMemo(() => {
    if (layout.loading) return [];
    return layout.fieldSections.filter((s) => s.tab_key === "property");
  }, [layout.loading, layout.fieldSections]);

  const useLayoutSections = layoutSections.length > 0;

  const propertyFields = byObject.property;
  const fallbackFieldMap = useMemo(
    () => new Map(propertyFields.map((f) => [f.key, f])),
    [propertyFields]
  );
  const fallbackSectionGroups = useMemo(() => {
    const groups = new Map<string, UwFieldDef[]>();
    for (const field of propertyFields) {
      const group = field.sectionGroup ?? "Property Details";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group)!.push(field);
    }
    return groups;
  }, [propertyFields]);

  const enrichFieldMap = useMemo(() => {
    const map = new Map(fallbackFieldMap);
    if (useLayoutSections) {
      for (const section of layoutSections) {
        for (const lf of layout.fieldsBySectionId[section.id] ?? []) {
          if (!map.has(lf.field_key)) {
            const def = uwFieldMap.get(lf.field_key);
            if (def) map.set(lf.field_key, def);
          }
        }
      }
    }
    return map;
  }, [fallbackFieldMap, useLayoutSections, layoutSections, layout.fieldsBySectionId, uwFieldMap]);

  function handleFieldChange(key: string, value: unknown) {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  }

  function handleFieldBlur(key: string) {
    const currentVal = localData[key];
    const prevVal = propertyData[key];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const result = await updatePropertyDataAction(dealId, key, currentVal);
      if (result.error) {
        toast.error(`Failed to save ${key}: ${result.error}`);
        setLocalData((prev) => ({ ...prev, [key]: prevVal }));
      }
    });
  }

  async function enrichFromAddress() {
    const address = localData.property_address ?? localData.address_line1;
    const state = localData.property_state ?? localData.state;

    if (!address || !state) {
      toast.error("Address and state are required for enrichment");
      return;
    }

    setEnriching(true);
    try {
      const response = await fetch("/api/properties/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: String(address).trim(),
          state: String(state).trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to enrich property");
      }

      const data = await response.json();
      const enriched = data.enriched as Record<string, unknown>;

      const updatedData = { ...localData };
      const savePromises: Promise<unknown>[] = [];

      for (const [key, value] of Object.entries(enriched)) {
        if (value === null || value === undefined || value === "") continue;
        if (!enrichFieldMap.has(key)) continue;
        if (updatedData[key] !== null && updatedData[key] !== undefined && updatedData[key] !== "") continue;

        updatedData[key] = value;
        savePromises.push(
          updatePropertyDataAction(dealId, key, value).then((result) => {
            if (result.error) console.error(`Failed to save ${key}:`, result.error);
          })
        );
      }

      setLocalData(updatedData);
      await Promise.all(savePromises);

      toast.success(`Enriched ${data.field_count ?? 0} fields: ${data.summary ?? ""}`);
    } catch (err) {
      console.warn("Property enrichment failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to enrich property"
      );
    } finally {
      setEnriching(false);
    }
  }

  const hasAddress = !!(localData.property_address ?? localData.address_line1);
  const hasState = !!(localData.property_state ?? localData.state);

  // Inline layout editor support
  const inlineLayout = useOptionalInlineLayout();
  const isEditing = inlineLayout?.state.isEditing ?? false;

  // When editing, use inline layout state; otherwise DB layout
  const effectiveSections = useMemo(() => {
    if (isEditing && inlineLayout) {
      return inlineLayout.state.sections
        .filter(
          (s) => s.tab_key === "property" && s.section_type === "fields"
        )
        .sort((a, b) => a.display_order - b.display_order);
    }
    return layoutSections;
  }, [isEditing, inlineLayout?.state.sections, layoutSections]);

  const effectiveFieldsBySection = isEditing && inlineLayout
    ? inlineLayout.state.fieldsBySectionId
    : layout.fieldsBySectionId;

  const allUsedFieldKeys = useMemo(() => {
    const set = new Set<string>();
    for (const section of effectiveSections) {
      for (const f of (effectiveFieldsBySection[section.id] ?? [])) {
        set.add(f.field_key);
      }
    }
    return set;
  }, [effectiveSections, effectiveFieldsBySection]);

  if (fieldsLoading || layout.loading) {
    return <div className="rounded-xl border border-dashed p-8 text-center animate-pulse" />;
  }

  if (fieldsError) {
    return (
      <div className="rounded-xl border border-destructive/50 p-8 text-center">
        <p className="text-sm text-destructive">Failed to load property fields: {fieldsError}</p>
      </div>
    );
  }

  const enrichButton = (
    <div className="flex items-center justify-between">
      <div />
      {enriching ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Enriching property data...
        </div>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={enrichFromAddress}
          disabled={!hasAddress || !hasState || pending}
        >
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Enrich Property
        </Button>
      )}
    </div>
  );

  if (useLayoutSections || (isEditing && effectiveSections.length > 0)) {
    return (
      <div className="space-y-4">
        {enrichButton}

        {effectiveSections.map((section, sectionIdx) => {
          const layoutFields = (effectiveFieldsBySection[section.id] ?? [])
            .filter((f) => f.is_visible)
            .sort((a, b) => a.display_order - b.display_order);
          if (layoutFields.length === 0 && !isEditing) return null;

          return (
            <EditableSection
              key={section.id}
              section={section}
              sectionIndex={sectionIdx}
              totalSections={effectiveSections.length}
            >
              <div className="rounded-xl border bg-card p-4">
                <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  {section.section_label}
                </h4>
                <div className="grid grid-cols-12 gap-x-5 gap-y-2">
                  {layoutFields.map((lf, idx) => {
                    const fieldDef = uwFieldMap.get(lf.field_key);
                    if (!fieldDef) return null;
                    const spanClass = SPAN_CLASS[lf.column_span] || SPAN_CLASS.half;
                    return (
                      <div key={lf.id ?? lf.field_key} className={spanClass}>
                        <EditableFieldSlot
                          fieldId={lf.id}
                          fieldLabel={fieldDef.label}
                          columnSpan={lf.column_span || "half"}
                          sectionId={section.id}
                          fieldIndex={idx}
                          totalFields={layoutFields.length}
                          fieldConfigId={lf.field_config_id}
                          fieldKey={lf.field_key}
                        >
                          <UwField
                            field={fieldDef}
                            value={localData[lf.field_key] ?? null}
                            onChange={(val) => handleFieldChange(lf.field_key, val)}
                            onBlur={() => handleFieldBlur(lf.field_key)}
                            disabled={pending || isEditing}
                            mode={editingFieldKey === lf.field_key && !isEditing ? "edit" : "read"}
                            onStartEdit={() => !isEditing && setEditingFieldKey(lf.field_key)}
                            onEndEdit={() => setEditingFieldKey(null)}
                          />
                        </EditableFieldSlot>
                      </div>
                    );
                  })}
                </div>
                {isEditing && (
                  <div className="mt-3 flex justify-center">
                    <FieldPicker
                      sectionId={section.id}
                      usedFieldKeys={allUsedFieldKeys}
                    />
                  </div>
                )}
              </div>
            </EditableSection>
          );
        })}
      </div>
    );
  }

  if (propertyFields.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No property fields visible for this deal type.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {enrichButton}

      {Array.from(fallbackSectionGroups.entries()).map(([groupName, fields]) => (
        <div key={groupName} className="rounded-xl border bg-card p-4">
          <h4 className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
            {groupName}
          </h4>
          <div className="grid grid-cols-12 gap-x-5 gap-y-2">
            {fields.map((field) => (
              <div key={field.key} className="col-span-12 sm:col-span-6">
                <UwField
                  field={field}
                  value={localData[field.key] ?? null}
                  onChange={(val) => handleFieldChange(field.key, val)}
                  onBlur={() => handleFieldBlur(field.key)}
                  disabled={pending}
                  mode={editingFieldKey === field.key ? "edit" : "read"}
                  onStartEdit={() => setEditingFieldKey(field.key)}
                  onEndEdit={() => setEditingFieldKey(null)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
