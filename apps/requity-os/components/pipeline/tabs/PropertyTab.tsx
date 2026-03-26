"use client";

import { useState, useTransition, useMemo, useEffect, useCallback } from "react";
import { updatePropertyDataAction, updateUwDataAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import type { UwFieldDef } from "../pipeline-types";
import { UwField } from "../UwField";
import { useUwFieldConfigs } from "@/hooks/useUwFieldConfigs";
import { useDealLayout } from "@/hooks/useDealLayout";
import type { LayoutSection } from "@/hooks/useDealLayout";
import type { VisibilityContext } from "@/lib/visibility-engine";
import { showSuccess, showError, showInfo } from "@/lib/toast";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, ChevronRight, Search, Check } from "lucide-react";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { useOptionalInlineLayout } from "@/components/inline-layout-editor/InlineLayoutContext";
import { EditableSection } from "@/components/inline-layout-editor/EditableSection";
import { EditableFieldSlot } from "@/components/inline-layout-editor/EditableFieldSlot";
import { FieldPicker } from "@/components/inline-layout-editor/FieldPicker";
import { cn } from "@/lib/utils";
import { AddressAutocomplete, type ParsedAddress } from "@/components/ui/address-autocomplete";
import { ReadValue } from "../ReadValue";

// ── Column span mapping (static for Tailwind purging) ──

const SPAN_CLASS: Record<string, string> = {
  full: "col-span-12",
  third: "col-span-12 sm:col-span-4",
  quarter: "col-span-12 sm:col-span-3",
  half: "col-span-12 sm:col-span-6",
};

// ── Section visibility rule matching ──

function shouldShowSection(section: LayoutSection, rawAssetClass: string | null): boolean {
  if (!section.visibility_rule) return true;

  const colonIdx = section.visibility_rule.indexOf(":");
  if (colonIdx === -1) return true;

  const field = section.visibility_rule.slice(0, colonIdx);
  const valuesStr = section.visibility_rule.slice(colonIdx + 1);

  if (field === "asset_class") {
    if (!rawAssetClass) return false;
    const allowed = valuesStr.split(",");
    return allowed.includes(rawAssetClass);
  }

  return true;
}

interface PropertyTabProps {
  dealId: string;
  propertyData: Record<string, unknown>;
  visibilityContext?: VisibilityContext | null;
  assetClass?: string | null;
}

export function PropertyTab({
  dealId,
  propertyData,
  visibilityContext,
  assetClass,
}: PropertyTabProps) {
  return (
    <PropertyDetailsContent
      dealId={dealId}
      propertyData={propertyData}
      visibilityContext={visibilityContext}
      assetClass={assetClass}
    />
  );
}

// ── Property Details ──

function PropertyDetailsContent({
  dealId,
  propertyData,
  visibilityContext,
  assetClass,
}: {
  dealId: string;
  propertyData: Record<string, unknown>;
  visibilityContext?: VisibilityContext | null;
  assetClass?: string | null;
}) {
  const { byObject, fieldMap: uwFieldMap, loading: fieldsLoading, error: fieldsError } = useUwFieldConfigs(visibilityContext);
  const layout = useDealLayout();
  const confirm = useConfirm();

  const [localData, setLocalData] = useState<Record<string, unknown>>(propertyData);
  const [pending, startTransition] = useTransition();
  const [enriching, setEnriching] = useState(false);
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState("");
  const [searchSelected, setSearchSelected] = useState(false);

  const layoutSections = useMemo(() => {
    if (layout.loading) return [];
    return layout.fieldSections
      .filter((s) => s.tab_key === "property")
      .filter((s) => shouldShowSection(s, assetClass ?? null));
  }, [layout.loading, layout.fieldSections, assetClass]);

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

  // Address field keys — when Google autocomplete fills address, also populate these
  const ADDRESS_FIELD_KEY = "property_address";
  const ADDRESS_RELATED_FIELDS: Record<string, keyof ParsedAddress> = {
    property_city: "city",
    property_state: "state",
    property_zip: "zip",
    property_county: "county",
  };

  function handleFieldChange(key: string, value: unknown) {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  }

  const handleAddressSelect = useCallback(
    (parsed: ParsedAddress) => {
      // Update address line
      setLocalData((prev) => ({ ...prev, [ADDRESS_FIELD_KEY]: parsed.address_line1 }));
      startTransition(async () => {
        await updatePropertyDataAction(dealId, ADDRESS_FIELD_KEY, parsed.address_line1);
      });

      // Auto-fill related fields
      for (const [fieldKey, parsedKey] of Object.entries(ADDRESS_RELATED_FIELDS)) {
        const val = parsed[parsedKey];
        if (!val) continue;
        setLocalData((prev) => ({ ...prev, [fieldKey]: val }));
        startTransition(async () => {
          const result = await updatePropertyDataAction(dealId, fieldKey, val);
          if (result.error) {
            console.error(`Failed to save ${fieldKey}:`, result.error);
          }
        });
      }
    },
    [dealId]
  );

  // Search bar: on address select, fill fields then auto-trigger enrichment
  const handleSearchAddressSelect = useCallback(
    (parsed: ParsedAddress) => {
      // Show green checkmark briefly
      setSearchSelected(true);
      setTimeout(() => setSearchSelected(false), 2000);

      // Fill address fields
      handleAddressSelect(parsed);

      // Store lat/lng if available
      if (parsed.lat != null && parsed.lng != null) {
        setLocalData((prev) => ({ ...prev, latitude: parsed.lat, longitude: parsed.lng }));
        startTransition(async () => {
          await updatePropertyDataAction(dealId, "latitude", parsed.lat);
          await updatePropertyDataAction(dealId, "longitude", parsed.lng);
        });
      }

      // Clear the search bar after selection
      setSearchValue("");

      // Auto-trigger enrichment with the parsed address values directly
      // (avoids stale state since localData hasn't updated yet)
      setTimeout(() => {
        enrichFromAddress({
          address: parsed.address_line1,
          state: parsed.state,
          city: parsed.city,
          zip: parsed.zip,
          county: parsed.county,
        });
      }, 100);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dealId, handleAddressSelect]
  );

  // Fields that live in uw_data (shared with Overview tab) rather than property_data
  const UW_DATA_FIELDS = new Set(["purchase_price", "appraised_value"]);

  function handleFieldBlur(key: string) {
    const currentVal = localData[key];
    const prevVal = propertyData[key];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const action = UW_DATA_FIELDS.has(key)
        ? updateUwDataAction(dealId, key, currentVal)
        : updatePropertyDataAction(dealId, key, currentVal);
      const result = await action;
      if (result.error) {
        showError(`Could not save ${key}`, result.error);
        setLocalData((prev) => ({ ...prev, [key]: prevVal }));
      }
    });
  }

  // Build a human-readable list of enrichable field labels
  const enrichableFieldLabels = useMemo(() => {
    const labels: string[] = [];
    enrichFieldMap.forEach((def) => {
      labels.push(def.label);
    });
    return labels;
  }, [enrichFieldMap]);

  async function enrichFromAddress(overrides?: {
    address?: string;
    state?: string;
    city?: string;
    zip?: string;
    county?: string;
  }) {
    const address = overrides?.address ?? localData.property_address ?? localData.address_line1;
    const state = overrides?.state ?? localData.property_state ?? localData.state;

    if (!address || !state) {
      showError("Address and state are required for enrichment");
      return;
    }

    const city = overrides?.city ?? localData.property_city ?? localData.city;
    const zip = overrides?.zip ?? localData.property_zip ?? localData.zip;
    const county = overrides?.county ?? localData.property_county ?? localData.county;

    setEnriching(true);
    try {
      const response = await fetch("/api/properties/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: String(address).trim(),
          state: String(state).trim(),
          ...(city ? { city: String(city).trim() } : {}),
          ...(zip ? { zip: String(zip).trim() } : {}),
          ...(county ? { county: String(county).trim() } : {}),
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        const searched = data.searched;
        const cityStr = searched?.city ?? city;
        const zipStr = searched?.zip ?? zip;
        const addrParts = [
          String(address).trim(),
          cityStr ? String(cityStr).trim() : null,
          String(state).trim(),
          zipStr ? String(zipStr).trim() : null,
        ].filter(Boolean);
        const searchedAddr = addrParts.join(", ");

        // Show the actual backend error for non-404s (auth failures, config issues, etc.)
        const backendError = data.error as string | undefined;
        const detail = data.detail as string | undefined;
        const is404 = response.status === 404;
        const errorMsg = is404
          ? `No match for "${searchedAddr}" in property database. Check that the full street address, city, and state are correct, or enter data manually.`
          : detail
            ? `${backendError ?? "Enrichment error"}: ${detail}`
            : backendError ?? `Enrichment service error (${response.status}). Try again later.`;
        showError("Could not enrich property", errorMsg);
        showInfo(
          "Fields you can fill manually",
          enrichableFieldLabels.slice(0, 15).join(", ") +
            (enrichableFieldLabels.length > 15 ? `, and ${enrichableFieldLabels.length - 15} more` : "")
        );
        return;
      }

      const data = await response.json();
      const enriched = data.enriched as Record<string, unknown>;

      // Determine which enrichable fields already have values
      const fieldsWithValues: string[] = [];
      const fieldsToFill: string[] = [];
      for (const [key, value] of Object.entries(enriched)) {
        if (value === null || value === undefined || value === "") continue;
        if (!enrichFieldMap.has(key)) continue;
        const hasExisting = localData[key] !== null && localData[key] !== undefined && localData[key] !== "";
        if (hasExisting) {
          fieldsWithValues.push(enrichFieldMap.get(key)?.label ?? key);
        } else {
          fieldsToFill.push(key);
        }
      }

      // If some fields already have data, ask whether to overwrite
      let overwrite = false;
      if (fieldsWithValues.length > 0) {
        overwrite = await confirm({
          title: "Overwrite existing data?",
          description: `${fieldsWithValues.length} field${fieldsWithValues.length === 1 ? " already has" : "s already have"} a value (${fieldsWithValues.slice(0, 5).join(", ")}${fieldsWithValues.length > 5 ? "..." : ""}). Overwrite with enrichment data?`,
          confirmLabel: "Overwrite",
          destructive: true,
        });
      }

      const updatedData = { ...localData };
      const savePromises: Promise<unknown>[] = [];
      let savedCount = 0;

      for (const [key, value] of Object.entries(enriched)) {
        if (value === null || value === undefined || value === "") continue;

        // Always save non-field-config data (arrays, fips codes) to property_data
        if (!enrichFieldMap.has(key)) {
          savePromises.push(
            updatePropertyDataAction(dealId, key, value).then((result) => {
              if (result.error) console.error(`Failed to save ${key}:`, result.error);
            })
          );
          updatedData[key] = value;
          continue;
        }

        // For field-config fields, check if we should skip existing values
        const hasExisting = localData[key] !== null && localData[key] !== undefined && localData[key] !== "";
        if (hasExisting && !overwrite) continue;

        updatedData[key] = value;
        savedCount++;
        savePromises.push(
          updatePropertyDataAction(dealId, key, value).then((result) => {
            if (result.error) console.error(`Failed to save ${key}:`, result.error);
          })
        );
      }

      setLocalData(updatedData);
      await Promise.all(savePromises);

      showSuccess(`Enriched ${savedCount} fields: ${data.summary ?? ""}`);
    } catch (err) {
      console.warn("Property enrichment failed:", err);
      showError("Could not enrich property", err instanceof Error ? err.message : undefined);
    } finally {
      setEnriching(false);
    }
  }

  const hasAddress = !!(localData.property_address ?? localData.address_line1);
  const hasState = !!(localData.property_state ?? localData.state);

  // Section collapse state — initialized from default_collapsed when layout loads
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [collapsedInitialized, setCollapsedInitialized] = useState(false);

  useEffect(() => {
    if (layout.loading || collapsedInitialized) return;
    const collapsed = new Set<string>();
    for (const s of layout.fieldSections) {
      if (s.default_collapsed) collapsed.add(s.id);
    }
    setCollapsedSections(collapsed);
    setCollapsedInitialized(true);
  }, [layout.loading, layout.fieldSections, collapsedInitialized]);

  function toggleSection(sectionId: string) {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) next.delete(sectionId);
      else next.add(sectionId);
      return next;
    });
  }

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
  }, [isEditing, inlineLayout, layoutSections]);

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

  // Renders AddressAutocomplete for the property_address field
  function renderAddressField(fieldDef: UwFieldDef, fieldKey: string) {
    const isAddressField = fieldKey === ADDRESS_FIELD_KEY;
    if (!isAddressField) return null;

    const currentValue = localData[fieldKey];
    const isEditing = editingFieldKey === fieldKey;

    if (!isEditing) {
      return (
        <div className="space-y-0">
          <span className="inline-field-label">{fieldDef.label}</span>
          <div className="flex items-center -mx-0.5">
            <ReadValue
              value={currentValue}
              fieldType="text"
              onClick={() => setEditingFieldKey(fieldKey)}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-0">
        <span className="inline-field-label">{fieldDef.label}</span>
        <AddressAutocomplete
          value={currentValue != null ? String(currentValue) : ""}
          onChange={(val) => handleFieldChange(fieldKey, val || null)}
          onAddressSelect={handleAddressSelect}
          onBlur={() => {
            handleFieldBlur(fieldKey);
            setEditingFieldKey(null);
          }}
          placeholder="Start typing a property address..."
          className="inline-field"
          disabled={pending}
        />
      </div>
    );
  }

  const enrichButtonInline = enriching ? (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" />
      Enriching...
    </div>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
      onClick={() => enrichFromAddress()}
      disabled={!hasAddress || !hasState || pending}
    >
      <Sparkles className="h-3 w-3 mr-1" />
      Enrich Property
    </Button>
  );

  const addressSearchBar = !isEditing && (
    <div className="relative">
      <Search className={cn(
        "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground rq-transition",
        searchSelected && "text-emerald-500 dark:text-emerald-400"
      )} />
      {searchSelected && (
        <Check className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500 dark:text-emerald-400 rq-animate-fade-in" />
      )}
      <AddressAutocomplete
        value={searchValue}
        onChange={setSearchValue}
        onAddressSelect={handleSearchAddressSelect}
        placeholder="Search address..."
        className="pl-9 pr-9 h-10 w-full rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        disabled={enriching}
      />
    </div>
  );

  if (useLayoutSections || (isEditing && effectiveSections.length > 0)) {
    return (
      <div className="space-y-4">
        {addressSearchBar}
        {effectiveSections.map((section, sectionIdx) => {
          const layoutFields = (effectiveFieldsBySection[section.id] ?? [])
            .filter((f) => f.is_visible)
            .sort((a, b) => a.display_order - b.display_order);
          if (layoutFields.length === 0 && !isEditing) return null;

          const isCollapsed = !isEditing && collapsedSections.has(section.id);
          const isFirstSection = sectionIdx === 0;

          return (
            <EditableSection
              key={section.id}
              section={section}
              sectionIndex={sectionIdx}
              totalSections={effectiveSections.length}
            >
              <div className="rq-card-wrapper">
                <div className="rq-card-header">
                  <button
                    type="button"
                    className={cn(
                      "flex items-center gap-1.5 text-left",
                      !isEditing && "cursor-pointer"
                    )}
                    onClick={() => !isEditing && toggleSection(section.id)}
                    disabled={isEditing}
                  >
                    {!isEditing && (
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground rq-transition-transform",
                          !isCollapsed && "rotate-90"
                        )}
                      />
                    )}
                    <h4 className="rq-micro-label">
                      {section.section_label}
                    </h4>
                  </button>
                  {isFirstSection && enrichButtonInline}
                </div>
                {!isCollapsed && (
                  <div className="rq-card">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
                      {layoutFields.map((lf, idx) => {
                        const fieldDef = uwFieldMap.get(lf.field_key);
                        if (!fieldDef) return null;
                        const isFullWidth = lf.column_span === "full";
                        return (
                          <div key={lf.id ?? lf.field_key} className={isFullWidth ? "col-span-2 sm:col-span-3" : undefined}>
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
                              {lf.field_key === ADDRESS_FIELD_KEY ? (
                                renderAddressField(fieldDef, lf.field_key)
                              ) : (
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
                              )}
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
      {addressSearchBar}
      {Array.from(fallbackSectionGroups.entries()).map(([groupName, fields], groupIdx) => (
        <div key={groupName} className="rq-card-wrapper">
          <div className="rq-card-header">
            <h4 className="rq-micro-label">
              {groupName}
            </h4>
            {groupIdx === 0 && enrichButtonInline}
          </div>
          <div className="rq-card">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1">
              {fields.map((field) => (
                <div key={field.key}>
                  {field.key === ADDRESS_FIELD_KEY ? (
                    renderAddressField(field, field.key)
                  ) : (
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
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
