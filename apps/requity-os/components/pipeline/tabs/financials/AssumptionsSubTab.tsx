"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Info,
  PieChart,
  Target,
  TrendingUp,
  SlidersHorizontal,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  updateCommercialUW,
  fetchAssumptionDefaults,
  fetchExpenseDefaults,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/commercial-uw-actions";
import { SectionCard, n, fmtCurrency } from "./shared";

interface AssumptionsSubTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  uw: any;
  uwId: string | null;
  propertyType: string;
}

export function AssumptionsSubTab({ uw, uwId, propertyType }: AssumptionsSubTabProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [defaults, setDefaults] = useState<Record<string, any> | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [expenseDefaults, setExpenseDefaults] = useState<Record<string, any>[]>([]);
  const [expandGuide, setExpandGuide] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Local form state for overrides
  const [fields, setFields] = useState({
    vacancy_pct: n(uw?.vacancy_pct) || 8,
    stabilized_vacancy_pct: n(uw?.stabilized_vacancy_pct) || 5,
    bad_debt_pct: n(uw?.bad_debt_pct) || 2,
    mgmt_fee_pct: n(uw?.mgmt_fee_pct) || 8,
    going_in_cap_rate: n(uw?.going_in_cap_rate) || 7.5,
    exit_cap_rate: n(uw?.exit_cap_rate) ? n(uw.exit_cap_rate) * 100 : 7.0,
    disposition_fee_pct: n(uw?.disposition_fee_pct) ? n(uw.disposition_fee_pct) * 100 : 2.0,
    sale_costs_pct: n(uw?.sale_costs_pct) ? n(uw.sale_costs_pct) * 100 : 2.0,
  });

  useEffect(() => {
    if (!propertyType) return;
    fetchAssumptionDefaults(propertyType).then((res) => {
      if (res.data) setDefaults(res.data);
    });
    fetchExpenseDefaults(propertyType).then((res) => {
      if (res.data) setExpenseDefaults(res.data);
    });
  }, [propertyType]);

  const handleSave = useCallback(async () => {
    if (!uwId) return;
    setSaving(true);
    try {
      const result = await updateCommercialUW(uwId, {
        exit_cap_rate: fields.exit_cap_rate / 100,
        disposition_fee_pct: fields.disposition_fee_pct / 100,
        sale_costs_pct: fields.sale_costs_pct / 100,
      });
      if (result.error) {
        toast.error(`Failed to save assumptions: ${result.error}`);
      } else {
        toast.success("Assumptions saved");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }, [uwId, fields, router]);

  const updateField = (key: keyof typeof fields, value: string) => {
    setFields((prev) => ({ ...prev, [key]: Number(value) || 0 }));
  };

  const Field = ({ label, fieldKey, unit = "%" }: { label: string; fieldKey: keyof typeof fields; unit?: string }) => {
    const defaultVal = defaults ? n(defaults[fieldKey]) : null;
    return (
      <div className="flex items-center justify-between py-2.5 border-b">
        <span className="text-[13px]">{label}</span>
        <div className="flex items-center gap-2">
          {defaultVal != null && defaultVal > 0 && (
            <span className="text-[11px] text-muted-foreground">Default: {defaultVal}{unit}</span>
          )}
          <div className="flex items-center gap-1">
            <Input
              className="h-8 w-20 text-right num"
              type="number"
              step="0.1"
              value={fields[fieldKey] || ""}
              onChange={(e) => updateField(fieldKey, e.target.value)}
            />
            <span className="text-[11px] text-muted-foreground">{unit}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Info banner */}
      <div className="px-4 py-3 bg-blue-500/10 rounded-lg flex gap-2.5 items-center">
        <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
        <span className="text-xs text-blue-500">
          Defaults pulled from UW Assumptions for <strong>{propertyType || "Unknown"}</strong>. Override per-deal — changes flow to Pro Forma on Underwriting tab.
        </span>
      </div>

      {/* 2x2 grid of assumption sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Vacancy & Loss" icon={PieChart}>
          <Field label="Year 1 Vacancy" fieldKey="vacancy_pct" />
          <Field label="Stabilized Vacancy" fieldKey="stabilized_vacancy_pct" />
          <Field label="Bad Debt" fieldKey="bad_debt_pct" />
          <Field label="Mgmt Fee (% of EGI)" fieldKey="mgmt_fee_pct" />
        </SectionCard>

        <SectionCard title="Valuation" icon={Target}>
          <Field label="Going-In Cap Rate" fieldKey="going_in_cap_rate" />
          <Field label="Exit Cap Rate" fieldKey="exit_cap_rate" />
          <Field label="Disposition Cost" fieldKey="disposition_fee_pct" />
        </SectionCard>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="sm" className="gap-1.5">
          {saving && <Loader2 className="h-3 w-3 animate-spin" />}
          Save Assumptions
        </Button>
      </div>

      {/* Expense Guidance */}
      <SectionCard
        title={`Expense Guidance — ${propertyType || "All"} Benchmarks`}
        icon={HelpCircle}
        actions={
          <Button
            variant="ghost"
            size="sm"
            className="h-6 gap-1 text-[11px] text-muted-foreground"
            onClick={() => setExpandGuide(!expandGuide)}
          >
            {expandGuide ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            {expandGuide ? "Collapse" : "Expand"}
          </Button>
        }
      >
        {expandGuide ? (
          expenseDefaults.length > 0 ? (
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left px-3 py-2 text-[11px] text-muted-foreground uppercase">Category</th>
                  <th className="text-right px-3 py-2 text-[11px] text-muted-foreground uppercase">Midpoint</th>
                  <th className="text-right px-3 py-2 text-[11px] text-muted-foreground uppercase">Range</th>
                  <th className="text-right px-3 py-2 text-[11px] text-muted-foreground uppercase">Basis</th>
                </tr>
              </thead>
              <tbody>
                {expenseDefaults.map((r, i) => (
                  <tr key={i} className="border-b">
                    <td className="px-3 py-2">{String(r.expense_category ?? "")}</td>
                    <td className="px-3 py-2 text-right num font-medium">{fmtCurrency(n(r.per_unit_amount))}</td>
                    <td className="px-3 py-2 text-right num text-muted-foreground">
                      {fmtCurrency(n(r.range_low))} – {fmtCurrency(n(r.range_high))}
                    </td>
                    <td className="px-3 py-2 text-right text-muted-foreground text-[11px]">per {String(r.basis ?? "unit")}/yr</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-[13px] text-muted-foreground">No expense benchmarks found for this property type.</p>
          )
        ) : (
          <p className="text-[13px] text-muted-foreground">
            Expense benchmarks across asset classes. Click Expand to view {propertyType || "all"} guidance.
          </p>
        )}
      </SectionCard>
    </div>
  );
}
