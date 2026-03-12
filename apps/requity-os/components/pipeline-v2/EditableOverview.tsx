"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateUwDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedCardType,
  type UwFieldDef,
  computeUwOutput,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
import { useResolvedCardType } from "@/hooks/useResolvedCardType";
import { useDealLayout } from "@/hooks/useDealLayout";
import type { VisibilityContext } from "@/lib/visibility-engine";
import { evaluateFormula } from "@/lib/formula-engine";
import { toast } from "sonner";
import {
  SectionCard,
  SectionEditButton,
  MetricCard,
  FieldRow,
} from "@/components/crm/contact-360/contact-detail-shared";
import {
  CrmEditSectionDialog,
  type CrmSectionField,
} from "@/components/crm/crm-edit-section-dialog";
import {
  BarChart3,
  DollarSign,
  Building2,
  User,
  FileText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Section icon mapping ──

const SECTION_ICONS: Record<string, LucideIcon> = {
  "Deal Summary": DollarSign,
  "Property": Building2,
  "Property Details": Building2,
  "Borrower": User,
  "Borrower Info": User,
  "Key Metrics": BarChart3,
};

function getSectionIcon(label: string): LucideIcon {
  return SECTION_ICONS[label] ?? FileText;
}

// ── Value formatting for read-only display ──

function formatFieldValue(field: UwFieldDef, value: unknown): React.ReactNode {
  if (value == null || value === "") return undefined;
  switch (field.type) {
    case "currency":
      return formatCurrency(Number(value));
    case "percent":
      return formatPercent(Number(value));
    case "number":
      return String(value);
    case "boolean":
      return value ? "Yes" : "No";
    case "select":
      return String(value).replace(/_/g, " ");
    case "date":
      return new Date(String(value)).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    default:
      return String(value);
  }
}

function formatFormulaValue(field: UwFieldDef, computed: number | null | undefined): React.ReactNode {
  if (computed == null) return "---";
  if (field.formulaOutputFormat === "currency") return formatCurrency(computed);
  if (field.formulaOutputFormat === "percent") return formatPercent(computed);
  return computed.toFixed(field.formulaDecimalPlaces ?? 2);
}

// ── Convert UwFieldDef to CrmSectionField ──

function uwFieldToCrmField(field: UwFieldDef, value: unknown): CrmSectionField {
  const fieldType = field.type === "percent" ? "number" : field.type;
  const options = field.options?.map((opt) => ({
    label: opt.replace(/_/g, " "),
    value: opt,
  }));

  return {
    label: field.label,
    fieldName: field.key,
    fieldType,
    value: value as string | number | boolean | null | undefined,
    options,
  };
}

// ── Props ──

interface EditableOverviewProps {
  dealId: string;
  uwData: Record<string, unknown>;
  cardType: UnifiedCardType;
  visibilityContext?: VisibilityContext | null;
}

// ── Main Component ──

export function EditableOverview({
  dealId,
  uwData,
  cardType: rawCardType,
  visibilityContext,
}: EditableOverviewProps) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Resolve field refs from field_configurations (falls back to inline fields)
  const cardType = useResolvedCardType(rawCardType, visibilityContext);

  // Fetch layout-driven sections from page_layout_sections / page_layout_fields,
  // filtered to this deal's card type (+ shared system sections).
  const layout = useDealLayout(rawCardType.id);

  // Build a combined field map including property and contact fields
  const uwFieldMap = useMemo(() => {
    const map = new Map(cardType.uw_fields.map((f) => [f.key, f]));
    for (const f of cardType.property_fields ?? []) map.set(f.key, f);
    for (const f of cardType.contact_fields ?? []) map.set(f.key, f);
    return map;
  }, [cardType.uw_fields, cardType.property_fields, cardType.contact_fields]);

  // Compute effective field groups for the Overview tab.
  //
  // Priority: layout-driven sections (Object Manager) > card type detail_field_groups > empty.
  //
  // The Object Manager is the single source of truth. Layout tables contain
  // per-card-type sections (card_type_id filtering) that mirror the original
  // card type field groups. Card type detail_field_groups are kept as a
  // temporary fallback until the migration is fully validated.
  const effectiveFieldGroups = useMemo(() => {
    // Primary: layout-driven sections from Object Manager
    if (!layout.loading && layout.fieldSections.length > 0) {
      const overviewFieldSections = layout.fieldSections.filter(
        (s) => (s.tab_key || "overview") === "overview"
      );

      if (overviewFieldSections.length > 0) {
        return overviewFieldSections.map((section) => {
          const layoutFields = layout.fieldsBySectionId[section.id] ?? [];
          return {
            label: section.section_label,
            fields: layoutFields
              .filter((f) => f.is_visible)
              .map((f) => f.field_key),
          };
        });
      }
    }

    // Fallback: card type detail_field_groups (temporary until fully migrated)
    if (cardType.detail_field_groups.length > 0) {
      return cardType.detail_field_groups;
    }

    return [];
  }, [layout.loading, layout.fieldSections, layout.fieldsBySectionId, cardType.detail_field_groups]);

  // Evaluate formula fields against current deal data
  const formulaValues = useMemo(() => {
    const values: Record<string, number | null> = {};
    const formulaFields = Array.from(uwFieldMap.values()).filter((f) => f.formulaExpression);
    if (formulaFields.length === 0) return values;
    const vars: Record<string, number> = {};
    for (const [k, v] of Object.entries(uwData)) {
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
  }, [uwFieldMap, uwData]);

  // Save handler for CrmEditSectionDialog
  const handleSave = useCallback(
    async (key: string, value: string | number | boolean | string[] | null) => {
      const result = await updateUwDataAction(dealId, key, value);
      if (result.error) {
        toast.error(`Failed to save ${uwFieldMap.get(key)?.label ?? key}: ${result.error}`);
        throw new Error(result.error);
      }
      toast.success("Saved");
      router.refresh();
    },
    [dealId, uwFieldMap, router]
  );

  // Compute outputs for metrics banner
  const computedOutputs = cardType.uw_outputs.map((output) => ({
    ...output,
    value: computeUwOutput(output.key, uwData, cardType.uw_outputs),
  }));
  const activeOutputs = computedOutputs.filter((o) => o.value != null);

  return (
    <div className="space-y-5">
      {/* Key Metrics (system section — always rendered from card type) */}
      {activeOutputs.length > 0 && (
        <SectionCard title="Key Metrics" icon={BarChart3}>
          <div className="flex gap-5 flex-wrap">
            {activeOutputs.map((output) => (
              <MetricCard
                key={output.key}
                label={output.label}
                value={
                  output.type === "currency"
                    ? formatCurrency(output.value)
                    : output.type === "percent"
                      ? formatPercent(output.value)
                      : formatRatio(output.value)
                }
                mono
              />
            ))}
          </div>
        </SectionCard>
      )}

      {/* Field Groups — layout-driven when available, card type fallback */}
      {effectiveFieldGroups.map((group) => (
        <SectionCard
          key={group.label}
          title={group.label}
          icon={getSectionIcon(group.label)}
          action={
            <SectionEditButton
              onClick={() => setEditingSection(group.label)}
            />
          }
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            {group.fields.map((fieldKey) => {
              const fieldDef = uwFieldMap.get(fieldKey);
              if (!fieldDef) return null;
              // Formula fields show computed value
              const displayValue = fieldDef.formulaExpression
                ? formatFormulaValue(fieldDef, formulaValues[fieldKey])
                : formatFieldValue(fieldDef, uwData[fieldKey]);
              return (
                <FieldRow
                  key={fieldKey}
                  label={fieldDef.label}
                  value={displayValue}
                  mono={["currency", "percent", "number"].includes(fieldDef.type)}
                />
              );
            })}
          </div>
        </SectionCard>
      ))}

      {/* Edit Dialogs */}
      {effectiveFieldGroups.map((group) => (
        <CrmEditSectionDialog
          key={group.label}
          open={editingSection === group.label}
          onOpenChange={(open) => {
            if (!open) setEditingSection(null);
          }}
          title={group.label}
          fields={group.fields
            .map((fieldKey) => {
              const fieldDef = uwFieldMap.get(fieldKey);
              if (!fieldDef || fieldDef.formulaExpression) return null;
              return uwFieldToCrmField(fieldDef, uwData[fieldKey]);
            })
            .filter((f): f is CrmSectionField => f != null)}
          onSave={handleSave}
        />
      ))}
    </div>
  );
}
