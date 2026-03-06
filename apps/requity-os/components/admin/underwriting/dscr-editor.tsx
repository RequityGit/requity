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
import { Save, Link2, Calculator } from "lucide-react";

interface DSCREditorProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData?: Record<string, any>;
  onSave?: (data: DSCRFormData) => Promise<void>;
  readOnly?: boolean;
}

interface DSCRFormData {
  property_type: string;
  property_value: number | null;
  monthly_rent: number | null;
  num_units: number;
  is_short_term_rental: boolean;
  fico_score: number | null;
  borrower_type: string;
  income_doc_type: string;
  loan_amount: number | null;
  loan_purpose: string;
  interest_rate: number | null;
  loan_term_months: number;
  is_interest_only: boolean;
  io_period_months: number | null;
  amortization_months: number;
  prepayment_type: string;
  lock_period_days: number;
  monthly_taxes: number | null;
  monthly_insurance: number | null;
  monthly_hoa: number;
  monthly_flood: number;
  broker_comp: number;
  notes: string;
}

const PROPERTY_TYPES = [
  { value: "sfr", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "2-4_unit", label: "2-4 Unit" },
  { value: "5+_unit", label: "5+ Unit" },
  { value: "townhome", label: "Townhome" },
];

const LOAN_PURPOSES = [
  { value: "purchase", label: "Purchase" },
  { value: "rate_term_refinance", label: "Rate/Term Refinance" },
  { value: "cash_out_refinance", label: "Cash-Out Refinance" },
];

const PREPAYMENT_TYPES = [
  { value: "none", label: "None" },
  { value: "5yr_stepdown", label: "5yr Stepdown (5-4-3-2-1)" },
  { value: "3yr_stepdown", label: "3yr Stepdown (3-2-1)" },
  { value: "yield_maintenance", label: "Yield Maintenance" },
];

function safe(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function computeDSCR(form: DSCRFormData) {
  const loanAmount = form.loan_amount ?? 0;
  const propertyValue = form.property_value ?? 0;
  const rate = (form.interest_rate ?? 0) / 100 / 12;
  const n = form.amortization_months;

  // Monthly P&I
  let monthlyPI = 0;
  if (rate > 0 && n > 0 && loanAmount > 0) {
    if (form.is_interest_only) {
      monthlyPI = loanAmount * rate;
    } else {
      monthlyPI = loanAmount * (rate * Math.pow(1 + rate, n)) / (Math.pow(1 + rate, n) - 1);
    }
  }

  // PITIA
  const monthlyPITIA =
    monthlyPI +
    (form.monthly_taxes ?? 0) +
    (form.monthly_insurance ?? 0) +
    (form.monthly_hoa ?? 0) +
    (form.monthly_flood ?? 0);

  // DSCR
  const monthlyRent = form.monthly_rent ?? 0;
  const dscrRatio = monthlyPITIA > 0 ? monthlyRent / monthlyPITIA : 0;

  // LTV
  const ltv = propertyValue > 0 ? (loanAmount / propertyValue) * 100 : 0;

  // Debt Yield
  const annualNOI = monthlyRent * 12;
  const debtYield = loanAmount > 0 ? (annualNOI / loanAmount) * 100 : 0;

  return {
    monthly_pi: Math.round(monthlyPI * 100) / 100,
    monthly_pitia: Math.round(monthlyPITIA * 100) / 100,
    dscr_ratio: Math.round(dscrRatio * 1000) / 1000,
    ltv: Math.round(ltv * 100) / 100,
    debt_yield: Math.round(debtYield * 100) / 100,
  };
}

export function DSCREditor({ initialData, onSave, readOnly = false }: DSCREditorProps) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<DSCRFormData>({
    property_type: initialData?.property_type ?? "sfr",
    property_value: safe(initialData?.property_value),
    monthly_rent: safe(initialData?.monthly_rent),
    num_units: initialData?.num_units ?? 1,
    is_short_term_rental: initialData?.is_short_term_rental ?? false,
    fico_score: safe(initialData?.fico_score),
    borrower_type: initialData?.borrower_type ?? "us_citizen",
    income_doc_type: initialData?.income_doc_type ?? "dscr_only",
    loan_amount: safe(initialData?.loan_amount),
    loan_purpose: initialData?.loan_purpose ?? "purchase",
    interest_rate: safe(initialData?.interest_rate),
    loan_term_months: initialData?.loan_term_months ?? 360,
    is_interest_only: initialData?.is_interest_only ?? false,
    io_period_months: safe(initialData?.io_period_months),
    amortization_months: initialData?.amortization_months ?? 360,
    prepayment_type: initialData?.prepayment_type ?? "5yr_stepdown",
    lock_period_days: initialData?.lock_period_days ?? 45,
    monthly_taxes: safe(initialData?.monthly_taxes),
    monthly_insurance: safe(initialData?.monthly_insurance),
    monthly_hoa: initialData?.monthly_hoa ?? 0,
    monthly_flood: initialData?.monthly_flood ?? 0,
    broker_comp: initialData?.broker_comp ?? 2.0,
    notes: initialData?.notes ?? "",
  });

  const calcs = useMemo(() => computeDSCR(form), [form]);

  const updateField = useCallback(
    <K extends keyof DSCRFormData>(key: K, value: DSCRFormData[K]) => {
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
      <div className="grid grid-cols-5 gap-3">
        <SummaryCard label="LTV" value={calcs.ltv > 0 ? `${calcs.ltv.toFixed(1)}%` : "—"} />
        <SummaryCard
          label="DSCR"
          value={calcs.dscr_ratio > 0 ? `${calcs.dscr_ratio.toFixed(3)}x` : "—"}
          highlight={calcs.dscr_ratio >= 1.0}
          warning={calcs.dscr_ratio > 0 && calcs.dscr_ratio < 1.0}
        />
        <SummaryCard label="Monthly P&I" value={calcs.monthly_pi > 0 ? `$${calcs.monthly_pi.toLocaleString()}` : "—"} />
        <SummaryCard label="Monthly PITIA" value={calcs.monthly_pitia > 0 ? `$${calcs.monthly_pitia.toLocaleString()}` : "—"} />
        <SummaryCard label="Debt Yield" value={calcs.debt_yield > 0 ? `${calcs.debt_yield.toFixed(2)}%` : "—"} />
      </div>

      {/* Property Section */}
      <FormSection title="Property">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label className="text-xs text-[#71717a]">Property Type</Label>
            <Select value={form.property_type} onValueChange={(v) => updateField("property_type", v)} disabled={readOnly}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <NumericField label="Property Value" value={form.property_value} onChange={(v) => updateField("property_value", v)} prefix="$" readOnly={readOnly} />
          <NumericField label="Monthly Rent" value={form.monthly_rent} onChange={(v) => updateField("monthly_rent", v)} prefix="$" readOnly={readOnly} />
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <NumericField label="Units" value={form.num_units} onChange={(v) => updateField("num_units", v ?? 1)} readOnly={readOnly} />
          <NumericField label="FICO Score" value={form.fico_score} onChange={(v) => updateField("fico_score", v)} readOnly={readOnly} />
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-xs text-[#a1a1aa] cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_short_term_rental}
                onChange={(e) => updateField("is_short_term_rental", e.target.checked)}
                disabled={readOnly}
                className="rounded"
              />
              Short-Term Rental
            </label>
          </div>
        </div>
      </FormSection>

      {/* Loan Terms Section */}
      <FormSection title="Loan Terms">
        <div className="grid grid-cols-3 gap-4">
          <NumericField label="Loan Amount" value={form.loan_amount} onChange={(v) => updateField("loan_amount", v)} prefix="$" readOnly={readOnly} />
          <NumericField label="Interest Rate" value={form.interest_rate} onChange={(v) => updateField("interest_rate", v)} suffix="%" readOnly={readOnly} />
          <div>
            <Label className="text-xs text-[#71717a]">Loan Purpose</Label>
            <Select value={form.loan_purpose} onValueChange={(v) => updateField("loan_purpose", v)} disabled={readOnly}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LOAN_PURPOSES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <NumericField label="Term (months)" value={form.loan_term_months} onChange={(v) => updateField("loan_term_months", v ?? 360)} readOnly={readOnly} />
          <NumericField label="Amortization (months)" value={form.amortization_months} onChange={(v) => updateField("amortization_months", v ?? 360)} readOnly={readOnly} />
          <div>
            <Label className="text-xs text-[#71717a]">Prepayment</Label>
            <Select value={form.prepayment_type} onValueChange={(v) => updateField("prepayment_type", v)} disabled={readOnly}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                {PREPAYMENT_TYPES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="flex items-end gap-2 pb-1">
            <label className="flex items-center gap-2 text-xs text-[#a1a1aa] cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_interest_only}
                onChange={(e) => updateField("is_interest_only", e.target.checked)}
                disabled={readOnly}
                className="rounded"
              />
              Interest Only
            </label>
          </div>
          {form.is_interest_only && (
            <NumericField label="IO Period (months)" value={form.io_period_months} onChange={(v) => updateField("io_period_months", v)} readOnly={readOnly} />
          )}
          <NumericField label="Broker Comp (pts)" value={form.broker_comp} onChange={(v) => updateField("broker_comp", v ?? 2)} suffix="%" readOnly={readOnly} />
        </div>
      </FormSection>

      {/* Monthly Expenses (PITIA) */}
      <FormSection title="Monthly Expenses (PITIA)">
        <div className="grid grid-cols-4 gap-4">
          <NumericField label="Taxes" value={form.monthly_taxes} onChange={(v) => updateField("monthly_taxes", v)} prefix="$" readOnly={readOnly} />
          <NumericField label="Insurance" value={form.monthly_insurance} onChange={(v) => updateField("monthly_insurance", v)} prefix="$" readOnly={readOnly} />
          <NumericField label="HOA" value={form.monthly_hoa} onChange={(v) => updateField("monthly_hoa", v ?? 0)} prefix="$" readOnly={readOnly} />
          <NumericField label="Flood" value={form.monthly_flood} onChange={(v) => updateField("monthly_flood", v ?? 0)} prefix="$" readOnly={readOnly} />
        </div>
      </FormSection>

      {/* Notes */}
      <FormSection title="Notes">
        <textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          disabled={readOnly}
          className="w-full rounded-lg border border-[#27272a] bg-[#131316] px-3 py-2 text-sm text-[#fafafa] placeholder:text-[#71717a] min-h-[80px] resize-y"
          placeholder="Assumptions, exceptions, or special conditions..."
        />
      </FormSection>

      {/* Actions */}
      {!readOnly && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" disabled>
            <Link2 className="w-4 h-4 mr-1" /> Link Pricing Run
          </Button>
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
  warning,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className="rounded-lg px-3 py-2.5"
      style={{
        backgroundColor: "#18181b",
        border: `1px solid ${highlight ? "rgba(34,197,94,0.2)" : warning ? "rgba(245,158,11,0.2)" : "#1e1e22"}`,
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-0.5">{label}</div>
      <div
        className="text-base font-semibold num"
        style={{ color: highlight ? "#22c55e" : warning ? "#f59e0b" : "#fafafa" }}
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
