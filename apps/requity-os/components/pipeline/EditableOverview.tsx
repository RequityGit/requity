"use client";

import { useState, useMemo, useCallback, useTransition } from "react";
import { updateUwDataAction, updatePropertyDataAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  type UnifiedCardType,
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
import { toast } from "sonner";
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
  key: string;
  source: string | null;
  columnSpan: string;
}

interface EditableOverviewProps {
  dealId: string;
  uwData: Record<string, unknown>;
  propertyData: Record<string, unknown>;
  cardType: UnifiedCardType;
  visibilityContext?: VisibilityContext | null;
  dealTeamContacts?: DealTeamContact[];
}

// ── Main Component ──

export function EditableOverview({
  dealId,
  uwData,
  propertyData,
  cardType,
  visibilityContext,
  dealTeamContacts = [],
}: EditableOverviewProps) {
  const [localUwData, setLocalUwData] = useState<Record<string, unknown>>(uwData);
  const [localPropertyData, setLocalPropertyData] = useState<Record<string, unknown>>(propertyData);
  const [pending, startTransition] = useTransition();
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);

  const { fieldMap: uwFieldMap } = useUwFieldConfigs(visibilityContext);
  const layout = useDealLayout();

  const effectiveFieldGroups = useMemo<{ label: string; icon: string; fields: FieldRef[] }[]>(() => {
    if (!layout.loading && layout.fieldSections.length > 0) {
      const overviewFieldSections = layout.fieldSections.filter(
        (s) => (s.tab_key || "overview") === "overview"
      );

      if (overviewFieldSections.length > 0) {
        return overviewFieldSections.map((section) => {
          const layoutFields = layout.fieldsBySectionId[section.id] ?? [];
          return {
            label: section.section_label,
            icon: section.section_icon,
            fields: layoutFields
              .filter((f) => f.is_visible)
              .map((f) => ({
                key: f.field_key,
                source: f.source_object_key,
                columnSpan: f.column_span || "half",
              })),
          };
        });
      }
    }

    return [];
  }, [layout.loading, layout.fieldSections, layout.fieldsBySectionId]);

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
      setLocalPropertyData((prev) => ({ ...prev, [key]: value }));
    } else {
      setLocalUwData((prev) => ({ ...prev, [key]: value }));
    }
  }

  function handleFieldBlur(key: string, source: string | null) {
    const currentVal = source === "property" ? localPropertyData[key] : localUwData[key];
    const prevVal = source === "property" ? propertyData[key] : uwData[key];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const result = source === "property"
        ? await updatePropertyDataAction(dealId, key, currentVal)
        : await updateUwDataAction(dealId, key, currentVal);

      if (result.error) {
        toast.error(`Failed to save ${uwFieldMap.get(key)?.label ?? key}: ${result.error}`);
        if (source === "property") {
          setLocalPropertyData((prev) => ({ ...prev, [key]: prevVal }));
        } else {
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

      {effectiveFieldGroups.map((group) => {
        const Icon = getSectionIcon(group.label);
        return (
          <div key={group.label} className="rounded-xl border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />}
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {group.label}
              </h4>
            </div>
            <div className="grid grid-cols-12 gap-x-5 gap-y-2">
              {group.fields.map((fieldRef) => {
                const fieldDef = uwFieldMap.get(fieldRef.key);
                if (!fieldDef) return null;
                const source = fieldSourceMap.get(fieldRef.key) ?? null;
                const spanClass = SPAN_CLASS[fieldRef.columnSpan] || SPAN_CLASS.half;

                if (fieldDef.formulaExpression) {
                  const computed = formulaValues[fieldRef.key];
                  const empty = computed == null;
                  return (
                    <div key={fieldRef.key} className={spanClass}>
                      <div className="space-y-0.5">
                        <span className="text-xs text-muted-foreground">{fieldDef.label}</span>
                        <div className={cn(
                          "py-1.5 text-sm",
                          empty ? "text-muted-foreground/60" : "num text-foreground"
                        )}>
                          {empty ? "---" : formatFormulaValue(fieldDef, computed)}
                        </div>
                      </div>
                    </div>
                  );
                }

                if (fieldDef.readOnly) {
                  const raw = getFieldValue(fieldRef);
                  const val = raw != null ? formatFieldValue(raw, fieldDef.type) : "";
                  const empty = isFieldEmpty(raw);
                  return (
                    <div key={fieldRef.key} className={spanClass}>
                      <div className="space-y-0.5">
                        <span className="text-xs text-muted-foreground">{fieldDef.label}</span>
                        <div className={cn(
                          "py-1.5 text-sm",
                          empty ? "text-muted-foreground/60" : "text-foreground"
                        )}>
                          {empty ? "---" : val}
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={fieldRef.key} className={spanClass}>
                    <UwField
                      field={fieldDef}
                      value={getFieldValue(fieldRef)}
                      onChange={(val) => handleFieldChange(fieldRef.key, val, source)}
                      onBlur={() => handleFieldBlur(fieldRef.key, source)}
                      disabled={pending}
                      mode={editingFieldKey === fieldRef.key ? "edit" : "read"}
                      onStartEdit={() => setEditingFieldKey(fieldRef.key)}
                      onEndEdit={() => setEditingFieldKey(null)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Deal Team section (custom component, always last on Overview) */}
      <DealTeamSection dealId={dealId} initialContacts={dealTeamContacts} />
    </div>
  );
}
