"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateUwDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import {
  type UnifiedCardType,
  type ChecklistItem,
  type UwFieldDef,
  computeUwOutput,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "./pipeline-types";
import { useResolvedCardType } from "@/hooks/useResolvedCardType";
import { StageChecklist } from "./StageChecklist";
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
  ClipboardCheck,
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
  checklist: ChecklistItem[];
}

// ── Main Component ──

export function EditableOverview({
  dealId,
  uwData,
  cardType: rawCardType,
  checklist,
}: EditableOverviewProps) {
  const router = useRouter();
  const [editingSection, setEditingSection] = useState<string | null>(null);

  // Resolve field refs from field_configurations (falls back to inline fields)
  const cardType = useResolvedCardType(rawCardType);

  // Build a combined field map including property and contact fields
  const uwFieldMap = useMemo(() => {
    const map = new Map(cardType.uw_fields.map((f) => [f.key, f]));
    for (const f of cardType.property_fields ?? []) map.set(f.key, f);
    for (const f of cardType.contact_fields ?? []) map.set(f.key, f);
    return map;
  }, [cardType.uw_fields, cardType.property_fields, cardType.contact_fields]);

  // Save handler for CrmEditSectionDialog
  const handleSave = useCallback(
    async (key: string, value: string | number | boolean | null) => {
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
      {/* Key Metrics */}
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

      {/* Field Groups as read-only SectionCards */}
      {cardType.detail_field_groups.map((group) => (
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
              return (
                <FieldRow
                  key={fieldKey}
                  label={fieldDef.label}
                  value={formatFieldValue(fieldDef, uwData[fieldKey])}
                  mono={["currency", "percent", "number"].includes(fieldDef.type)}
                />
              );
            })}
          </div>
        </SectionCard>
      ))}

      {/* Stage Checklist */}
      <SectionCard title="Stage Checklist" icon={ClipboardCheck}>
        <StageChecklist items={checklist} />
      </SectionCard>

      {/* Edit Dialogs */}
      {cardType.detail_field_groups.map((group) => (
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
              if (!fieldDef) return null;
              return uwFieldToCrmField(fieldDef, uwData[fieldKey]);
            })
            .filter((f): f is CrmSectionField => f != null)}
          onSave={handleSave}
        />
      ))}
    </div>
  );
}
