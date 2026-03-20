"use client";

import { useState, useMemo, useCallback, useTransition, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Landmark, Building2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SectionCard,
  MetricCard,
  MonoValue,
  FieldRow,
} from "../contact-detail-shared";
import { formatCurrency, formatPercent, formatDate } from "@/lib/format";
import {
  renderDynamicFieldsInline,
  FIELD_KEY_TO_PROP,
} from "@/components/crm/shared-field-renderer";
import { getSectionIcon } from "@/lib/icon-map";
import { STATUS_CONFIG } from "../types";
import type {
  ContactData,
  BorrowerData,
  LoanData,
  EntityData,
  SectionLayout,
  FieldLayout,
} from "../types";

interface DetailBorrowerTabProps {
  contact: ContactData;
  borrower: BorrowerData;
  loans: LoanData[];
  entities: EntityData[];
  isSuperAdmin: boolean;
  userRole: string;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
  primaryBorrowerEntity: Record<string, unknown> | null;
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

function DocPill({ has, label }: { has: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className="text-[11px] gap-1 px-2 py-0.5 h-auto"
      style={{
        color: has ? "#22A861" : "#E5453D",
        borderColor: has ? "#22A86130" : "#E5453D30",
        backgroundColor: has ? "#22A86108" : "#E5453D08",
      }}
    >
      {has ? <Check size={10} /> : <X size={10} />}
      {label}
    </Badge>
  );
}

const SECTION_KEY_TO_SOURCE: Record<string, string> = {
  borrower_profile: "borrower",
  borrower_entity: "borrower_entity",
};

export function DetailBorrowerTab({
  contact,
  borrower,
  loans,
  entities,
  isSuperAdmin,
  userRole,
  sectionOrder,
  sectionFields,
  primaryBorrowerEntity,
}: DetailBorrowerTabProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [pending, startTransition] = useTransition();

  const [localBorrowerData, setLocalBorrowerData] = useState<Record<string, unknown>>(
    () => (borrower ?? {}) as unknown as Record<string, unknown>
  );
  const [localEntityData, setLocalEntityData] = useState<Record<string, unknown>>(
    () => (primaryBorrowerEntity ?? {}) as Record<string, unknown>
  );

  const saveBorrowerField = useCallback(async (field: string, value: unknown) => {
    const { error } = await supabase
      .from("borrowers")
      .update({ [field]: value })
      .eq("id", borrower.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [borrower.id, supabase, toast]);

  const saveEntityField = useCallback(async (field: string, value: unknown) => {
    if (!primaryBorrowerEntity?.id) return false;
    const { error } = await supabase
      .from("borrower_entities")
      .update({ [field]: value })
      .eq("id", primaryBorrowerEntity.id as string);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [primaryBorrowerEntity, supabase, toast]);

  const sourceRegistry = useMemo(() => ({
    borrower: {
      data: localBorrowerData,
      setData: setLocalBorrowerData,
      save: saveBorrowerField,
      serverData: (borrower ?? {}) as unknown as Record<string, unknown>,
    },
    borrower_entity: {
      data: localEntityData,
      setData: setLocalEntityData,
      save: saveEntityField,
      serverData: (primaryBorrowerEntity ?? {}) as Record<string, unknown>,
    },
  }), [localBorrowerData, localEntityData, saveBorrowerField, saveEntityField, borrower, primaryBorrowerEntity]);

  // --- Computed metrics ---
  const activeLoans = loans.filter(
    (l) => l.stage && !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
  );
  const totalVolume = loans.reduce((s, l) => s + (l.loan_amount || 0), 0);
  const pipelineTotal = totalVolume;
  const rates = loans.map((l) => l.interest_rate).filter((r): r is number => r != null);
  const avgRate = rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const firstLoan = loans.length > 0
    ? loans.reduce((oldest, l) => new Date(l.created_at) < new Date(oldest.created_at) ? l : oldest)
    : null;

  const borrowerEntities = entities.filter((e) => e.kind === "borrower");

  // --- Conditional logic ---
  function buildMergedData(sectionKey: string): Record<string, unknown> | null {
    const fields = sectionFields[sectionKey];
    if (!fields?.length) return null;
    const merged: Record<string, unknown> = {};
    let hasAny = false;
    for (const f of fields) {
      const sourceKey = f.source_object_key ?? SECTION_KEY_TO_SOURCE[sectionKey] ?? "borrower";
      const source = sourceRegistry[sourceKey as keyof typeof sourceRegistry];
      if (!source) continue;
      hasAny = true;
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      merged[propKey] = source.data[propKey];
    }
    return hasAny ? merged : null;
  }

  const getFieldFilters = useCallback((sectionKey: string) => {
    const fields = sectionFields[sectionKey];
    const hiddenFieldKeys = new Set<string>();
    const readOnlyFieldKeys = new Set<string>();

    if (fields?.length) {
      const mergedData = buildMergedData(sectionKey);
      if (mergedData) {
        for (const f of fields) {
          if (!f.conditional_rules?.length) continue;
          let visible = true;
          const showRules = f.conditional_rules.filter((r) => r.action === "show");
          const hideRules = f.conditional_rules.filter((r) => r.action === "hide");
          if (showRules.length > 0) {
            visible = showRules.every((rule) => evaluateOperator(rule.operator, mergedData[rule.source_field], rule.value));
          }
          if (hideRules.length > 0 && hideRules.every((rule) => evaluateOperator(rule.operator, mergedData[rule.source_field], rule.value))) {
            visible = false;
          }
          if (!visible) hiddenFieldKeys.add(f.field_key);
        }
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
  }, [sectionFields, isSuperAdmin, userRole]);

  function handleInlineChange(sectionKey: string, fieldKey: string, value: unknown) {
    const fields = sectionFields[sectionKey];
    const fieldDef = fields?.find((f) => {
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      return propKey === fieldKey || f.field_key === fieldKey;
    });
    const sourceKey = fieldDef?.source_object_key ?? SECTION_KEY_TO_SOURCE[sectionKey] ?? "borrower";
    const source = sourceRegistry[sourceKey as keyof typeof sourceRegistry];
    if (source) {
      source.setData((prev: Record<string, unknown>) => ({ ...prev, [fieldKey]: value }));
    }
  }

  function handleInlineBlur(sectionKey: string, fieldKey: string) {
    const fields = sectionFields[sectionKey];
    const fieldDef = fields?.find((f) => {
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      return propKey === fieldKey || f.field_key === fieldKey;
    });
    const sourceKey = fieldDef?.source_object_key ?? SECTION_KEY_TO_SOURCE[sectionKey] ?? "borrower";
    const source = sourceRegistry[sourceKey as keyof typeof sourceRegistry];
    if (!source) return;
    const currentVal = source.data[fieldKey];
    const prevVal = source.serverData[fieldKey];
    if (currentVal === prevVal) return;
    startTransition(async () => {
      const ok = await source.save(fieldKey, currentVal as never);
      if (!ok) {
        source.setData((prev: Record<string, unknown>) => ({ ...prev, [fieldKey]: prevVal }));
      }
    });
  }

  function renderFieldSection(sectionKey: string, label: string, iconName: string): ReactNode {
    const fields = sectionFields[sectionKey];
    if (!fields?.length) return null;
    const mergedData = buildMergedData(sectionKey);
    if (!mergedData) return null;
    const { hiddenFieldKeys, readOnlyFieldKeys } = getFieldFilters(sectionKey);
    const Icon = getSectionIcon(iconName);
    return (
      <SectionCard key={sectionKey} title={label} icon={Icon}>
        {renderDynamicFieldsInline(
          fields,
          mergedData,
          isSuperAdmin,
          {
            onChange: (fieldKey, value) => handleInlineChange(sectionKey, fieldKey, value),
            onBlur: (fieldKey) => handleInlineBlur(sectionKey, fieldKey),
            disabled: pending,
          },
          hiddenFieldKeys,
          readOnlyFieldKeys,
        )}
      </SectionCard>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Borrower Summary */}
      {loans.length > 0 && (
        <SectionCard title="Borrower Summary" icon={Landmark}>
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Total Loans" value={loans.length} sub={`${activeLoans.length} active`} />
            <MetricCard label="Loan Volume" value={formatCurrency(totalVolume)} mono />
            <MetricCard label="Avg Rate" value={avgRate > 0 ? formatPercent(avgRate) : "\u2014"} mono />
            <MetricCard label="Active Deals" value={activeLoans.length} />
            <MetricCard label="First Loan" value={firstLoan ? formatDate(firstLoan.created_at) : "\u2014"} />
          </div>
        </SectionCard>
      )}

      {/* Borrower Profile */}
      {renderFieldSection("borrower_profile", "Borrower Profile", "user")}

      {/* Borrower Entity */}
      {renderFieldSection("borrower_entity", "Borrower Entity", "building-2")}

      {/* Entity Documents */}
      {borrowerEntities.length > 0 && (
        <div className="flex flex-col gap-4">
          {borrowerEntities.map((ent) => (
            <Card key={ent.id} className="rounded-xl border-border">
              <CardHeader className="px-5 py-3.5 border-b border-border/60">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-2">
                    <Building2 size={16} className="text-muted-foreground" strokeWidth={1.5} />
                    {ent.entity_name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[11px] gap-1 px-1.5 py-0 h-5"
                    style={{ color: "#3B82F6", borderColor: "#3B82F630", backgroundColor: "#3B82F608" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#3B82F6" }} />
                    Borrowing Entity
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 mb-4">
                  <FieldRow label="Entity Type" value={ent.entity_type} />
                  <FieldRow label="EIN" value={ent.ein || "\u2014"} mono />
                  <FieldRow label="State of Formation" value={ent.state_of_formation} />
                  {ent.formation_date && (
                    <FieldRow label="Formation Date" value={formatDate(ent.formation_date)} />
                  )}
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Documents
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {ent.operating_agreement_url !== undefined && (
                      <DocPill has={!!ent.operating_agreement_url} label="Operating Agreement" />
                    )}
                    {ent.articles_of_org_url !== undefined && (
                      <DocPill has={!!ent.articles_of_org_url} label="Articles of Org" />
                    )}
                    {ent.certificate_good_standing_url !== undefined && (
                      <DocPill has={!!ent.certificate_good_standing_url} label="Good Standing" />
                    )}
                    {ent.ein_letter_url !== undefined && (
                      <DocPill has={!!ent.ein_letter_url} label="EIN Letter" />
                    )}
                    {ent.formation_doc_url !== undefined && (
                      <DocPill has={!!ent.formation_doc_url} label="Formation Doc" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Deals & Loans */}
      <Card className="rounded-xl border-border overflow-hidden">
        <CardHeader className="px-5 py-3.5 border-b border-border/60">
          <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-2">
            <Landmark size={16} className="text-muted-foreground" strokeWidth={1.5} />
            Loans & Deals
          </CardTitle>
        </CardHeader>
        {loans.length === 0 ? (
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No loans or deals found.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Deal", "Stage", "Amount", "Rate", "LTV", "Type"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
                      style={{ textAlign: ["Amount", "Rate", "LTV"].includes(h) ? "right" : "left" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loans.map((d) => {
                  const stageConfig = d.stage ? STATUS_CONFIG[d.stage] || STATUS_CONFIG.draft : STATUS_CONFIG.draft;
                  const stageLabel = d.stage ? d.stage.replace(/_/g, " ") : "\u2014";
                  return (
                    <tr key={d.id} className="border-b border-border/40 hover:bg-muted/50 cursor-pointer">
                      <td className="px-4 py-3 text-[13px] font-medium text-foreground">
                        {d.property_address || d.loan_number || "Untitled"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className="text-[11px] gap-1 px-1.5 py-0 h-5"
                          style={{ color: stageConfig.text, borderColor: `${stageConfig.text}30`, backgroundColor: stageConfig.bg }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: stageConfig.dot }} />
                          {stageLabel}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px] font-medium">{formatCurrency(d.loan_amount)}</MonoValue>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px]">
                          {d.interest_rate != null ? formatPercent(d.interest_rate) : "\u2014"}
                        </MonoValue>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <MonoValue className="text-[13px]">{d.ltv != null ? `${d.ltv}%` : "\u2014"}</MonoValue>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-muted-foreground capitalize">{d.type || "\u2014"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>{loans.length} deal{loans.length !== 1 ? "s" : ""}</span>
              <MonoValue className="font-medium">Pipeline: {formatCurrency(pipelineTotal)}</MonoValue>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
