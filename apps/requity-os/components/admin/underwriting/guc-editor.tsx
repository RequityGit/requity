"use client";

import { useState, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save } from "lucide-react";

interface GUCEditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: Record<string, any>;
  onSave?: (data: GUCFormData) => Promise<void>;
  readOnly?: boolean;
}

interface GUCFormData {
  land_cost: number | null;
  land_acquisition_date: string;
  lot_size_acres: number | null;
  zoning: string;
  hard_costs: number | null;
  soft_costs: number | null;
  contingency_pct: number;
  construction_timeline_months: number | null;
  construction_loan_amount: number | null;
  construction_rate: number | null;
  construction_term_months: number | null;
  construction_io: boolean;
  origination_fee_pct: number | null;
  stabilized_value: number | null;
  stabilized_noi: number | null;
  exit_strategy: string;
  exit_cap_rate: number | null;
  exit_loan_amount: number | null;
  exit_rate: number | null;
  exit_term_months: number | null;
  notes: string;
}

const EXIT_STRATEGIES = [
  { value: "hold", label: "Hold" },
  { value: "sell", label: "Sell" },
  { value: "refinance", label: "Refinance" },
];

function safe(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function computeGUC(form: GUCFormData) {
  const landCost = form.land_cost ?? 0;
  const hardCosts = form.hard_costs ?? 0;
  const softCosts = form.soft_costs ?? 0;
  const contingencyPct = form.contingency_pct ?? 10;
  const contingencyAmount = (hardCosts + softCosts) * (contingencyPct / 100);
  const totalProjectCost = landCost + hardCosts + softCosts + contingencyAmount;

  const constructionLoanAmount = form.construction_loan_amount ?? 0;
  const constructionLTC = totalProjectCost > 0 ? (constructionLoanAmount / totalProjectCost) * 100 : 0;

  const stabilizedValue = form.stabilized_value ?? 0;
  const stabilizedNOI = form.stabilized_noi ?? 0;

  const profitOnCost = totalProjectCost > 0 ? ((stabilizedValue - totalProjectCost) / totalProjectCost) * 100 : 0;
  const yieldOnCost = totalProjectCost > 0 ? (stabilizedNOI / totalProjectCost) * 100 : 0;

  const totalEquityRequired = totalProjectCost - constructionLoanAmount;

  // Simplified DSCR at stabilization
  const exitRate = (form.exit_rate ?? 0) / 100 / 12;
  const exitTerm = (form.exit_term_months ?? 360);
  const exitLoan = form.exit_loan_amount ?? 0;
  let exitMonthlyDS = 0;
  if (exitRate > 0 && exitTerm > 0 && exitLoan > 0) {
    exitMonthlyDS = exitLoan * (exitRate * Math.pow(1 + exitRate, exitTerm)) / (Math.pow(1 + exitRate, exitTerm) - 1);
  }
  const dscrAtStabilization = exitMonthlyDS > 0 ? (stabilizedNOI / 12) / exitMonthlyDS : 0;

  return {
    total_project_cost: Math.round(totalProjectCost),
    construction_ltc: Math.round(constructionLTC * 100) / 100,
    total_equity_required: Math.round(totalEquityRequired),
    profit_on_cost: Math.round(profitOnCost * 100) / 100,
    yield_on_cost: Math.round(yieldOnCost * 100) / 100,
    dscr_at_stabilization: Math.round(dscrAtStabilization * 1000) / 1000,
  };
}

export function GUCEditor({ initialData, onSave, readOnly = false }: GUCEditorProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<GUCFormData>({
    land_cost: safe(initialData?.land_cost),
    land_acquisition_date: initialData?.land_acquisition_date ?? "",
    lot_size_acres: safe(initialData?.lot_size_acres),
    zoning: initialData?.zoning ?? "",
    hard_costs: safe(initialData?.hard_costs),
    soft_costs: safe(initialData?.soft_costs),
    contingency_pct: initialData?.contingency_pct ?? 10,
    construction_timeline_months: safe(initialData?.construction_timeline_months),
    construction_loan_amount: safe(initialData?.construction_loan_amount),
    construction_rate: safe(initialData?.construction_rate),
    construction_term_months: safe(initialData?.construction_term_months),
    construction_io: initialData?.construction_io ?? true,
    origination_fee_pct: safe(initialData?.origination_fee_pct),
    stabilized_value: safe(initialData?.stabilized_value),
    stabilized_noi: safe(initialData?.stabilized_noi),
    exit_strategy: initialData?.exit_strategy ?? "sell",
    exit_cap_rate: safe(initialData?.exit_cap_rate),
    exit_loan_amount: safe(initialData?.exit_loan_amount),
    exit_rate: safe(initialData?.exit_rate),
    exit_term_months: safe(initialData?.exit_term_months),
    notes: initialData?.notes ?? "",
  });

  const calcs = useMemo(() => computeGUC(form), [form]);

  const updateField = useCallback(
    <K extends keyof GUCFormData>(key: K, value: GUCFormData[K]) => {
      setForm((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const handleSave = async () => {
    if (!onSave || saving) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-6 gap-3">
        <SummaryCard label="Total Cost" value={calcs.total_project_cost > 0 ? `$${calcs.total_project_cost.toLocaleString()}` : "—"} />
        <SummaryCard label="LTC" value={calcs.construction_ltc > 0 ? `${calcs.construction_ltc.toFixed(1)}%` : "—"} />
        <SummaryCard label="Equity Req'd" value={calcs.total_equity_required > 0 ? `$${calcs.total_equity_required.toLocaleString()}` : "—"} />
        <SummaryCard label="Profit/Cost" value={calcs.profit_on_cost !== 0 ? `${calcs.profit_on_cost.toFixed(1)}%` : "—"} highlight={calcs.profit_on_cost > 0} />
        <SummaryCard label="Yield/Cost" value={calcs.yield_on_cost > 0 ? `${calcs.yield_on_cost.toFixed(2)}%` : "—"} />
        <SummaryCard label="Stab. DSCR" value={calcs.dscr_at_stabilization > 0 ? `${calcs.dscr_at_stabilization.toFixed(3)}x` : "—"} highlight={calcs.dscr_at_stabilization >= 1.25} />
      </div>

      {/* Land / Acquisition */}
      <FormSection title="Land / Acquisition">
        <div className="grid grid-cols-4 gap-4">
          <NumericField label="Land Cost" value={form.land_cost} onChange={(v) => updateField("land_cost", v)} prefix="$" readOnly={readOnly} />
          <div>
            <Label className="text-xs text-[#71717a]">Acquisition Date</Label>
            <Input
              type="date"
              value={form.land_acquisition_date}
              onChange={(e) => updateField("land_acquisition_date", e.target.value)}
              disabled={readOnly}
              className="mt-1"
            />
          </div>
          <NumericField label="Lot Size (acres)" value={form.lot_size_acres} onChange={(v) => updateField("lot_size_acres", v)} readOnly={readOnly} />
          <div>
            <Label className="text-xs text-[#71717a]">Zoning</Label>
            <Input
              value={form.zoning}
              onChange={(e) => updateField("zoning", e.target.value)}
              disabled={readOnly}
              className="mt-1"
              placeholder="R-1, C-2, etc."
            />
          </div>
        </div>
      </FormSection>

      {/* Construction Budget */}
      <FormSection title="Construction Budget">
        <div className="grid grid-cols-4 gap-4">
          <NumericField label="Hard Costs" value={form.hard_costs} onChange={(v) => updateField("hard_costs", v)} prefix="$" readOnly={readOnly} />
          <NumericField label="Soft Costs" value={form.soft_costs} onChange={(v) => updateField("soft_costs", v)} prefix="$" readOnly={readOnly} />
          <NumericField label="Contingency %" value={form.contingency_pct} onChange={(v) => updateField("contingency_pct", v ?? 10)} suffix="%" readOnly={readOnly} />
          <NumericField label="Timeline (months)" value={form.construction_timeline_months} onChange={(v) => updateField("construction_timeline_months", v)} readOnly={readOnly} />
        </div>
        <div className="mt-3 text-xs text-[#a1a1aa]">
          Total Project Cost: <span className="font-semibold text-[#fafafa] num">${calcs.total_project_cost.toLocaleString()}</span>
        </div>
      </FormSection>

      {/* Construction Loan */}
      <FormSection title="Construction Loan">
        <div className="grid grid-cols-4 gap-4">
          <NumericField label="Loan Amount" value={form.construction_loan_amount} onChange={(v) => updateField("construction_loan_amount", v)} prefix="$" readOnly={readOnly} />
          <NumericField label="Rate" value={form.construction_rate} onChange={(v) => updateField("construction_rate", v)} suffix="%" readOnly={readOnly} />
          <NumericField label="Term (months)" value={form.construction_term_months} onChange={(v) => updateField("construction_term_months", v)} readOnly={readOnly} />
          <NumericField label="Origination (pts)" value={form.origination_fee_pct} onChange={(v) => updateField("origination_fee_pct", v)} suffix="%" readOnly={readOnly} />
        </div>
      </FormSection>

      {/* Stabilized / Exit */}
      <FormSection title="Stabilized / Exit">
        <div className="grid grid-cols-4 gap-4">
          <NumericField label="Stabilized Value" value={form.stabilized_value} onChange={(v) => updateField("stabilized_value", v)} prefix="$" readOnly={readOnly} />
          <NumericField label="Stabilized NOI" value={form.stabilized_noi} onChange={(v) => updateField("stabilized_noi", v)} prefix="$" readOnly={readOnly} />
          <div>
            <Label className="text-xs text-[#71717a]">Exit Strategy</Label>
            <Select value={form.exit_strategy} onValueChange={(v) => updateField("exit_strategy", v)} disabled={readOnly}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EXIT_STRATEGIES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <NumericField label="Exit Cap Rate" value={form.exit_cap_rate} onChange={(v) => updateField("exit_cap_rate", v)} suffix="%" readOnly={readOnly} />
        </div>
        {(form.exit_strategy === "refinance" || form.exit_strategy === "hold") && (
          <div className="grid grid-cols-3 gap-4 mt-3">
            <NumericField label="Exit Loan Amount" value={form.exit_loan_amount} onChange={(v) => updateField("exit_loan_amount", v)} prefix="$" readOnly={readOnly} />
            <NumericField label="Exit Rate" value={form.exit_rate} onChange={(v) => updateField("exit_rate", v)} suffix="%" readOnly={readOnly} />
            <NumericField label="Exit Term (months)" value={form.exit_term_months} onChange={(v) => updateField("exit_term_months", v)} readOnly={readOnly} />
          </div>
        )}
      </FormSection>

      {/* Notes */}
      <FormSection title="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          disabled={readOnly}
          className="w-full rounded-lg border border-[#27272a] bg-[#131316] px-3 py-2 text-sm text-[#fafafa] placeholder:text-[#71717a] min-h-[80px] resize-y"
          placeholder="Construction notes, draw schedule details, assumptions..."
        />
      </FormSection>

      {/* Actions */}
      {!readOnly && (
        <div className="flex justify-end">
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="w-4 h-4 mr-1" />
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      )}
    </div>
  );
}

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#27272a] bg-[#111113] p-4">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-[#71717a] mb-3">{title}</h4>
      {children}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: "#18181b",
        border: `1px solid ${highlight ? "rgba(34,197,94,0.2)" : "#1e1e22"}`,
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-0.5">{label}</div>
      <div
        className="text-sm font-semibold num"
        style={{ color: highlight ? "#22c55e" : "#fafafa" }}
      >
        {value}
      </div>
    </div>
  );
}

function NumericField({
  label,
  value,
  onChange,
  prefix,
  suffix,
  readOnly,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  prefix?: string;
  suffix?: string;
  readOnly?: boolean;
}) {
  return (
    <div>
      <Label className="text-xs text-[#71717a]">{label}</Label>
      <div className="relative mt-1">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#71717a]">{prefix}</span>
        )}
        <Input
          type="number"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          disabled={readOnly}
          className={`num ${prefix ? "pl-7" : ""} ${suffix ? "pr-7" : ""}`}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#71717a]">{suffix}</span>
        )}
      </div>
    </div>
  );
}
