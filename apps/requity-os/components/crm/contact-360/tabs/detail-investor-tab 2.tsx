"use client";

import { useState, useMemo, useCallback, useTransition, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { TrendingUp, Building2, Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SectionCard,
  MetricCard,
  MonoValue,
  FieldRow,
} from "../contact-detail-shared";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  renderDynamicFieldsInline,
  FIELD_KEY_TO_PROP,
} from "@/components/crm/shared-field-renderer";
import { getSectionIcon } from "@/lib/icon-map";
import type {
  ContactData,
  InvestorProfileData,
  InvestorCommitmentData,
  EntityData,
  SectionLayout,
  FieldLayout,
} from "../types";

interface DetailInvestorTabProps {
  contact: ContactData;
  investor: InvestorProfileData;
  commitments: InvestorCommitmentData[];
  entities: EntityData[];
  isSuperAdmin: boolean;
  userRole: string;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
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

export function DetailInvestorTab({
  contact,
  investor,
  commitments,
  entities,
  isSuperAdmin,
  userRole,
  sectionFields,
}: DetailInvestorTabProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [pending, startTransition] = useTransition();

  const [localInvestorData, setLocalInvestorData] = useState<Record<string, unknown>>(
    () => (investor ?? {}) as unknown as Record<string, unknown>
  );

  const saveInvestorField = useCallback(async (field: string, value: unknown) => {
    const { error } = await supabase
      .from("investors")
      .update({ [field]: value })
      .eq("id", investor.id);
    if (error) {
      toast({ title: "Error saving", description: error.message, variant: "destructive" });
      return false;
    }
    return true;
  }, [investor.id, supabase, toast]);

  const sourceRegistry = useMemo(() => ({
    investor: {
      data: localInvestorData,
      setData: setLocalInvestorData,
      save: saveInvestorField,
      serverData: (investor ?? {}) as unknown as Record<string, unknown>,
    },
  }), [localInvestorData, saveInvestorField, investor]);

  // --- Computed metrics ---
  const totalCommitted = commitments.reduce((s, c) => s + (c.commitment_amount || 0), 0);
  const totalFunded = commitments.reduce((s, c) => s + (c.funded_amount || 0), 0);
  const totalUnfunded = commitments.reduce((s, c) => s + (c.unfunded_amount || 0), 0);
  const activeFunds = commitments.filter((c) => c.status === "active").length;
  const commitmentTotal = totalCommitted;

  const investingEntities = entities.filter((e) => e.kind === "investing");

  // --- Field section helpers ---
  function buildMergedData(sectionKey: string): Record<string, unknown> | null {
    const fields = sectionFields[sectionKey];
    if (!fields?.length) return null;
    const merged: Record<string, unknown> = {};
    let hasAny = false;
    for (const f of fields) {
      const source = sourceRegistry.investor;
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

  function handleInlineChange(fieldKey: string, value: unknown) {
    setLocalInvestorData((prev) => ({ ...prev, [fieldKey]: value }));
  }

  function handleInlineBlur(fieldKey: string) {
    const currentVal = localInvestorData[fieldKey];
    const prevVal = (investor as unknown as Record<string, unknown>)[fieldKey];
    if (currentVal === prevVal) return;
    startTransition(async () => {
      const ok = await saveInvestorField(fieldKey, currentVal as never);
      if (!ok) {
        setLocalInvestorData((prev) => ({ ...prev, [fieldKey]: prevVal }));
      }
    });
  }

  function renderProfileSection(): ReactNode {
    const fields = sectionFields["investor_profile"];
    if (!fields?.length) return null;
    const mergedData = buildMergedData("investor_profile");
    if (!mergedData) return null;
    const { hiddenFieldKeys, readOnlyFieldKeys } = getFieldFilters("investor_profile");
    const Icon = getSectionIcon("shield");
    return (
      <SectionCard key="investor_profile" title="Investor Profile" icon={Icon}>
        {renderDynamicFieldsInline(
          fields,
          mergedData,
          isSuperAdmin,
          {
            onChange: handleInlineChange,
            onBlur: handleInlineBlur,
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
      {/* Investor Summary */}
      {commitments.length > 0 && (
        <SectionCard title="Investor Summary" icon={TrendingUp}>
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Total Committed" value={formatCurrency(totalCommitted)} mono />
            <MetricCard label="Funded" value={formatCurrency(totalFunded)} mono />
            <MetricCard label="Unfunded" value={formatCurrency(totalUnfunded)} mono />
            <MetricCard label="Active Funds" value={activeFunds} />
          </div>
        </SectionCard>
      )}

      {/* Investor Profile */}
      {renderProfileSection()}

      {/* Investing Entities */}
      {investingEntities.length > 0 && (
        <div className="flex flex-col gap-4">
          {investingEntities.map((ent) => (
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
                    style={{ color: "#22A861", borderColor: "#22A86130", backgroundColor: "#22A86108" }}
                  >
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#22A861" }} />
                    Investing Entity
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

      {/* Investor Commitments */}
      <Card className="rounded-xl border-border overflow-hidden">
        <CardHeader className="px-5 py-3.5 border-b border-border/60">
          <CardTitle className="text-[13px] font-semibold text-foreground flex items-center gap-2">
            <TrendingUp size={16} className="text-muted-foreground" strokeWidth={1.5} />
            Investor Commitments
          </CardTitle>
        </CardHeader>
        {commitments.length === 0 ? (
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No investor commitments found.
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  {["Fund", "Status", "Committed", "Funded", "Unfunded", "Date", "Entity"].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"
                      style={{ textAlign: ["Committed", "Funded", "Unfunded"].includes(h) ? "right" : "left" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {commitments.map((c) => (
                  <tr key={c.id} className="border-b border-border/40">
                    <td className="px-4 py-3 text-[13px] font-medium text-foreground">{c.fund_name || "Unknown Fund"}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className="text-[11px] gap-1 px-1.5 py-0 h-5"
                        style={{ color: "#22A861", borderColor: "#22A86130", backgroundColor: "#22A86108" }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "#22A861" }} />
                        {c.status || "\u2014"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px] font-medium">{formatCurrency(c.commitment_amount)}</MonoValue>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px]">{formatCurrency(c.funded_amount)}</MonoValue>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <MonoValue className="text-[13px]">{formatCurrency(c.unfunded_amount)}</MonoValue>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.commitment_date)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">{c.entity_name || "\u2014"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-border flex justify-between text-xs text-muted-foreground">
              <span>{commitments.length} commitment{commitments.length !== 1 ? "s" : ""}</span>
              <MonoValue className="font-medium">Total: {formatCurrency(commitmentTotal)}</MonoValue>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
