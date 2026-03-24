"use client";

import { useState, useMemo, useCallback, useTransition, useRef } from "react";
import { updateUwDataAction, updatePropertyDataAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  type UwFieldDef,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
import { UwField } from "./UwField";
import { useUwFieldConfigs } from "@/hooks/useUwFieldConfigs";
import { useDealLayout } from "@/hooks/useDealLayout";
import type { VisibilityContext } from "@/lib/visibility-engine";
import { evaluateFormula } from "@/lib/formula-engine";
import { formatFieldValue, isFieldEmpty } from "@/lib/format";
import { showError } from "@/lib/toast";
import {
  SectionCard,
  MetricCard,
} from "@/components/crm/contact-360/contact-detail-shared";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  DollarSign,
  Building2,
  User,
  Users,
  FileText,
  Calendar,
  Landmark,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { DealTeamSection } from "@/components/deal-team/DealTeamSection";
import type { DealTeamContact } from "@/app/types/deal-team";
import { useOptionalInlineLayout } from "@/components/inline-layout-editor/InlineLayoutContext";
import { EditableSection } from "@/components/inline-layout-editor/EditableSection";
import { EditableFieldSlot } from "@/components/inline-layout-editor/EditableFieldSlot";
import { FieldPicker } from "@/components/inline-layout-editor/FieldPicker";

// ── Section icon mapping ──

const SECTION_ICONS: Record<string, LucideIcon> = {
  "Deal Summary": DollarSign,
  "Property": Building2,
  "Property Details": Building2,
  "Borrower": User,
  "Borrower Info": User,
  "Key Metrics": BarChart3,
  "Loan Terms": FileText,
  "Key Dates": Calendar,
  "Team": Users,
  "Capital & Funding": Landmark,
};

function getSectionIcon(label: string): LucideIcon | undefined {
  return SECTION_ICONS[label];
}

// ── Column span mapping (static for Tailwind purging) ──

const SPAN_CLASS: Record<string, string> = {
  full: "col-span-12",
  third: "col-span-12 sm:col-span-4",
  quarter: "col-span-12 sm:col-span-3",
  half: "col-span-12 sm:col-span-6",
};

// ── Value formatting for formula (read-only) fields ──

function formatFormulaValue(field: UwFieldDef, computed: number | null | undefined): React.ReactNode {
  if (computed == null) return "---";
  if (field.formulaOutputFormat === "currency") return formatCurrency(computed);
  if (field.formulaOutputFormat === "percent") return formatPercent(computed);
  return computed.toFixed(field.formulaDecimalPlaces ?? 2);
}

// ── Props ──

interface FieldRef {
  id?: string;
  key: string;
  source: string | null;
  columnSpan: string;
  fieldConfigId?: string | null;
}

interface EditableOverviewProps {
  dealId: string;
  uwData: Record<string, unknown>;
  propertyData: Record<string, unknown>;
  visibilityContext?: VisibilityContext | null;
  dealTeamContacts?: DealTeamContact[];
}

// ── Main Component ──

export function EditableOverview({
  dealId,
  uwData,
  propertyData,
  visibilityContext,
  dealTeamContacts = [],
}: EditableOverviewProps) {
  const [localUwData, setLocalUwData] = useState<Record<string, unknown>>(uwData);
  const [localPropertyData, setLocalPropertyData] = useState<Record<string, unknown>>(propertyData);
  const [pending, startTransition] = useTransition();
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);

  // Refs track the latest local state so handleFieldBlur always reads
  // current values, even when called from a stale setTimeout closure
  // (select/date fields call onChange + setTimeout(onBlur, 0) in the same tick).
  const localUwDataRef = useRef(localUwData);
  const localPropertyDataRef = useRef(localPropertyData);
  localUwDataRef.current = localUwData;
  localPropertyDataRef.current = localPropertyData;

  const { fieldMap: uwFieldMap } = useUwFieldConfigs(visibilityContext);
  const layout = useDealLayout();

  // Inline layout editor context (may not exist if provider not mounted)
  const inlineLayout = useOptionalInlineLayout();
  const isEditing = inlineLayout?.state.isEditing ?? false;

  // When editing, use inline layout state for sections/fields; otherwise use DB layout
  const effectiveFieldGroups = useMemo<{ id: string; label: string; icon: string; fields: (FieldRef & { id: string })[] }[]>(() => {
    const sections = isEditing && inlineLayout
      ? inlineLayout.state.sections
          .filter(
            (s) => (s.tab_key || "overview") === "overview" && s.section_type === "fields"
          )
          .sort((a, b) => a.display_order - b.display_order)
      : layout.fieldSections.filter(
          (s) => (s.tab_key || "overview") === "overview"
        );

    const fieldsBySection = isEditing && inlineLayout
      ? inlineLayout.state.fieldsBySectionId
      : layout.fieldsBySectionId;

    if (sections.length === 0 && !layout.loading) return [];

    return sections.map((section) => {
      const layoutFields = fieldsBySection[section.id] ?? [];
      return {
        id: section.id,
        label: section.section_label,
        icon: section.section_icon,
        fields: layoutFields
          .filter((f) => f.is_visible)
          .map((f) => ({
            id: f.id,
            key: f.field_key,
            source: f.source_object_key,
            columnSpan: f.column_span || "half",
            fieldConfigId: f.field_config_id,
          })),
      };
    });
  }, [
    isEditing,
    inlineLayout?.state.sections,
    inlineLayout?.state.fieldsBySectionId,
    layout.loading,
    layout.fieldSections,
    layout.fieldsBySectionId,
  ]);

  const getFieldValue = useCallback(
    (fieldRef: FieldRef): unknown => {
      if (fieldRef.source === "property") return localPropertyData[fieldRef.key];
      return localUwData[fieldRef.key];
    },
    [localUwData, localPropertyData]
  );

  const formulaValues = useMemo(() => {
    const values: Record<string, number | null> = {};
    const formulaFields = Array.from(uwFieldMap.values()).filter((f) => f.formulaExpression);
    if (formulaFields.length === 0) return values;
    const vars: Record<string, number> = {};
    for (const [k, v] of Object.entries(localUwData)) {
      if (typeof v === "number") vars[k] = v;
      else if (typeof v === "string" && v !== "" && !isNaN(Number(v))) vars[k] = Number(v);
    }
    for (const field of formulaFields) {
      try {
        const result = evaluateFormula(field.formulaExpression!, vars);
        values[field.key] = typeof result === "number" && isFinite(result) ? result : null;
      } catch {
        values[field.key] = null;
      }
    }
    return values;
  }, [uwFieldMap, localUwData]);

  const fieldSourceMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const group of effectiveFieldGroups) {
      for (const ref of group.fields) {
        map.set(ref.key, ref.source);
      }
    }
    return map;
  }, [effectiveFieldGroups]);

  function handleFieldChange(key: string, value: unknown, source: string | null) {
    if (source === "property") {
      const next = { ...localPropertyDataRef.current, [key]: value };
      localPropertyDataRef.current = next;
      setLocalPropertyData(next);
    } else {
      const next = { ...localUwDataRef.current, [key]: value };
      localUwDataRef.current = next;
      setLocalUwData(next);
    }
  }

  function handleFieldBlur(key: string, source: string | null) {
    const currentVal = source === "property"
      ? localPropertyDataRef.current[key]
      : localUwDataRef.current[key];
    const prevVal = source === "property" ? propertyData[key] : uwData[key];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const result = source === "property"
        ? await updatePropertyDataAction(dealId, key, currentVal)
        : await updateUwDataAction(dealId, key, currentVal);

      if (result.error) {
        showError(`Could not save ${uwFieldMap.get(key)?.label ?? key}`, result.error);
        if (source === "property") {
          localPropertyDataRef.current = { ...localPropertyDataRef.current, [key]: prevVal };
          setLocalPropertyData((prev) => ({ ...prev, [key]: prevVal }));
        } else {
          localUwDataRef.current = { ...localUwDataRef.current, [key]: prevVal };
          setLocalUwData((prev) => ({ ...prev, [key]: prevVal }));
        }
      }
    });
  }

  const activeOutputs = useMemo(() => {
    const formulaFields = Array.from(uwFieldMap.values()).filter((f) => f.formulaExpression);
    return formulaFields
      .map((f) => ({ key: f.key, label: f.label, format: f.formulaOutputFormat, value: formulaValues[f.key] ?? null }))
      .filter((o) => o.value != null);
  }, [uwFieldMap, formulaValues]);

  // All used field keys across all overview sections
  const allUsedFieldKeys = useMemo(() => {
    const set = new Set<string>();
    for (const group of effectiveFieldGroups) {
      for (const f of group.fields) set.add(f.key);
    }
    return set;
  }, [effectiveFieldGroups]);

  return (
    <div className="space-y-4">
      {activeOutputs.length > 0 && (
        <SectionCard title="Key Metrics" icon={BarChart3}>
          <div className="flex gap-5 flex-wrap">
            {activeOutputs.map((output) => (
              <MetricCard
                key={output.key}
                label={output.label}
                value={
                  output.format === "currency"
                    ? formatCurrency(output.value)
                    : output.format === "percent"
                      ? formatPercent(output.value)
                      : formatRatio(output.value)
                }
                mono
              />
            ))}
          </div>
        </SectionCard>
      )}

      {effectiveFieldGroups.map((group, sectionIdx) => {
        const Icon = getSectionIcon(group.label);
        return (
          <EditableSection
            key={group.id}
            section={
              (isEditing && inlineLayout
                ? inlineLayout.state.sections
                : layout.fieldSections
              ).find(s => s.id === group.id)!
            }
            sectionIndex={sectionIdx}
            totalSections={effectiveFieldGroups.length}
          >
            <div className="rounded-xl border bg-card p-4">
              <div className="flex items-center gap-2 mb-3">
                {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />}
                <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </h4>
              </div>
              <div className="grid grid-cols-12 gap-x-5 gap-y-2">
                {group.fields.map((fieldRef, fieldIdx) => {
                  const fieldDef = uwFieldMap.get(fieldRef.key);
                  if (!fieldDef) return null;
                  const source = fieldSourceMap.get(fieldRef.key) ?? null;
                  const spanClass = SPAN_CLASS[fieldRef.columnSpan] || SPAN_CLASS.half;

                  const fieldContent = (() => {
                    if (fieldDef.formulaExpression) {
                      const computed = formulaValues[fieldRef.key];
                      const empty = computed == null;
                      return (
                        <div className="space-y-0">
                          <span className="text-[11px] font-medium text-muted-foreground leading-tight">{fieldDef.label}</span>
                          <div className={cn(
                            "w-full min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 text-sm",
                            empty ? "text-muted-foreground/40" : "num tabular-nums text-foreground"
                          )}>
                            {empty ? "0" : formatFormulaValue(fieldDef, computed)}
                          </div>
                        </div>
                      );
                    }

                    if (fieldDef.readOnly) {
                      const raw = getFieldValue(fieldRef);
                      const val = raw != null ? formatFieldValue(raw, fieldDef.type) : "";
                      const empty = isFieldEmpty(raw);
                      return (
                        <div className="space-y-0">
                          <span className="text-[11px] font-medium text-muted-foreground leading-tight">{fieldDef.label}</span>
                          <div className={cn(
                            "w-full min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5 text-sm",
                            empty ? "text-muted-foreground/40" : "text-foreground"
                          )}>
                            {empty ? "Add..." : val}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <UwField
                        field={fieldDef}
                        value={getFieldValue(fieldRef)}
                        onChange={(val) => handleFieldChange(fieldRef.key, val, source)}
                        onBlur={() => handleFieldBlur(fieldRef.key, source)}
                        disabled={pending || isEditing}
                        mode={editingFieldKey === fieldRef.key && !isEditing ? "edit" : "read"}
                        onStartEdit={() => !isEditing && setEditingFieldKey(fieldRef.key)}
                        onEndEdit={() => setEditingFieldKey(null)}
                      />
                    );
                  })();

                  return (
                    <div key={fieldRef.id ?? fieldRef.key} className={spanClass}>
                      <EditableFieldSlot
                        fieldId={fieldRef.id ?? fieldRef.key}
                        fieldLabel={fieldDef.label}
                        columnSpan={fieldRef.columnSpan}
                        sectionId={group.id}
                        fieldIndex={fieldIdx}
                        totalFields={group.fields.length}
                        fieldConfigId={fieldRef.fieldConfigId}
                        fieldKey={fieldRef.key}
                      >
                        {fieldContent}
                      </EditableFieldSlot>
                    </div>
                  );
                })}
              </div>
              {/* Add Field button (edit mode only) */}
              {isEditing && (
                <div className="mt-3 flex justify-center">
                  <FieldPicker
                    sectionId={group.id}
                    usedFieldKeys={allUsedFieldKeys}
                  />
                </div>
              )}
            </div>
          </EditableSection>
        );
      })}

      {/* Deal Team section (custom component, always last on Overview) */}
      <DealTeamSection dealId={dealId} initialContacts={dealTeamContacts} />
    </div>
  );
}
