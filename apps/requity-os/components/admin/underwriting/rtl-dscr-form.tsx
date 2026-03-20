"use client";

import { useMemo } from "react";
import { computeOutputs } from "@/lib/underwriting/calculator";
import type { UnderwritingInputs, UnderwritingOutputs } from "@/lib/underwriting/types";

interface RTLDSCRFormProps {
  inputs: UnderwritingInputs;
  onChange: (inputs: UnderwritingInputs) => void;
  readOnly?: boolean;
  modelType: "rtl" | "dscr";
}

export function RTLDSCRForm({ inputs, onChange, readOnly = false, modelType }: RTLDSCRFormProps) {
  const outputs = useMemo(() => computeOutputs(inputs), [inputs]);

  const update = (field: keyof UnderwritingInputs, value: number | string | null) => {
    if (readOnly) return;
    onChange({ ...inputs, [field]: value });
  };

  const updateNum = (field: keyof UnderwritingInputs, raw: string) => {
    if (readOnly) return;
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    const val = cleaned === "" ? null : parseFloat(cleaned);
    onChange({ ...inputs, [field]: val });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Loan Terms */}
      <FormSection title="Loan Terms">
        <div className="grid grid-cols-3 gap-3">
          <CurrencyField label="Loan Amount" value={inputs.loan_amount} onChange={(v) => updateNum("loan_amount", v)} readOnly={readOnly} />
          <PercentField label="Interest Rate" value={inputs.interest_rate} onChange={(v) => updateNum("interest_rate", v)} readOnly={readOnly} />
          <PercentField label="Points" value={inputs.points} onChange={(v) => updateNum("points", v)} readOnly={readOnly} />
          <NumberField label="Term (months)" value={inputs.loan_term_months} onChange={(v) => updateNum("loan_term_months", v)} readOnly={readOnly} />
          <SelectField
            label="Loan Type"
            value={inputs.loan_type ?? ""}
            options={[
              { value: "rtl", label: "RTL (Fix & Flip)" },
              { value: "dscr", label: "DSCR" },
              { value: "guc", label: "Ground Up Construction" },
              { value: "transactional", label: "Transactional" },
            ]}
            onChange={(v) => update("loan_type", v || null)}
            readOnly={readOnly}
          />
          <SelectField
            label="Loan Purpose"
            value={inputs.loan_purpose ?? ""}
            options={[
              { value: "purchase", label: "Purchase" },
              { value: "refinance", label: "Refinance" },
              { value: "cash_out_refinance", label: "Cash-Out Refinance" },
            ]}
            onChange={(v) => update("loan_purpose", v || null)}
            readOnly={readOnly}
          />
        </div>
      </FormSection>

      {/* Property Details */}
      <FormSection title="Property Details">
        <div className="grid grid-cols-3 gap-3">
          <CurrencyField label="Purchase Price" value={inputs.purchase_price} onChange={(v) => updateNum("purchase_price", v)} readOnly={readOnly} />
          <CurrencyField label="Appraised Value" value={inputs.appraised_value} onChange={(v) => updateNum("appraised_value", v)} readOnly={readOnly} />
          {modelType === "rtl" && (
            <>
              <CurrencyField label="After Repair Value (ARV)" value={inputs.after_repair_value} onChange={(v) => updateNum("after_repair_value", v)} readOnly={readOnly} />
              <CurrencyField label="Rehab Budget" value={inputs.rehab_budget} onChange={(v) => updateNum("rehab_budget", v)} readOnly={readOnly} />
            </>
          )}
          <NumberField label="Heated Sq Ft" value={inputs.heated_sqft} onChange={(v) => updateNum("heated_sqft", v)} readOnly={readOnly} />
          <TextField label="Property Address" value={inputs.property_address ?? ""} onChange={(v) => update("property_address", v || null)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* Income & Expenses (primarily DSCR but also used in RTL) */}
      <FormSection title="Income & Expenses">
        <div className="grid grid-cols-3 gap-3">
          <CurrencyField label="Monthly Rent" value={inputs.monthly_rent} onChange={(v) => updateNum("monthly_rent", v)} readOnly={readOnly} />
          <CurrencyField label="Annual Property Tax" value={inputs.annual_property_tax} onChange={(v) => updateNum("annual_property_tax", v)} readOnly={readOnly} />
          <CurrencyField label="Annual Insurance" value={inputs.annual_insurance} onChange={(v) => updateNum("annual_insurance", v)} readOnly={readOnly} />
          <CurrencyField label="Monthly HOA" value={inputs.monthly_hoa} onChange={(v) => updateNum("monthly_hoa", v)} readOnly={readOnly} />
          <CurrencyField label="Monthly Utilities" value={inputs.monthly_utilities} onChange={(v) => updateNum("monthly_utilities", v)} readOnly={readOnly} />
          <CurrencyField label="Operating Expenses" value={inputs.operating_expenses} onChange={(v) => updateNum("operating_expenses", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* Exit Strategy (primarily RTL) */}
      {modelType === "rtl" && (
        <FormSection title="Exit Strategy">
          <div className="grid grid-cols-3 gap-3">
            <NumberField label="Holding Period (months)" value={inputs.holding_period_months} onChange={(v) => updateNum("holding_period_months", v)} readOnly={readOnly} />
            <CurrencyField label="Projected Sale Price" value={inputs.projected_sale_price} onChange={(v) => updateNum("projected_sale_price", v)} readOnly={readOnly} />
            <PercentField label="Sales/Disposition %" value={inputs.sales_disposition_pct} onChange={(v) => updateNum("sales_disposition_pct", v)} readOnly={readOnly} />
          </div>
        </FormSection>
      )}

      {/* Additional */}
      <FormSection title="Additional">
        <div className="grid grid-cols-3 gap-3">
          <NumberField label="Credit Score" value={inputs.credit_score} onChange={(v) => updateNum("credit_score", v)} readOnly={readOnly} />
          <NumberField label="Experience (# deals)" value={inputs.experience_count} onChange={(v) => updateNum("experience_count", v)} readOnly={readOnly} />
          <CurrencyField label="Mobilization Draw" value={inputs.mobilization_draw} onChange={(v) => updateNum("mobilization_draw", v)} readOnly={readOnly} />
          <CurrencyField label="Lender Fees (flat)" value={inputs.lender_fees_flat} onChange={(v) => updateNum("lender_fees_flat", v)} readOnly={readOnly} />
          <CurrencyField label="Title / Closing / Escrow" value={inputs.title_closing_escrow} onChange={(v) => updateNum("title_closing_escrow", v)} readOnly={readOnly} />
          <NumberField label="# of Partners" value={inputs.num_partners} onChange={(v) => updateNum("num_partners", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* Computed Outputs */}
      <OutputsPanel outputs={outputs} modelType={modelType} />
    </div>
  );
}

/* ── Outputs Panel ── */
function OutputsPanel({ outputs, modelType }: { outputs: UnderwritingOutputs; modelType: "rtl" | "dscr" }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">
        {modelType === "rtl" ? "Deal Analysis" : "DSCR Analysis"}
      </h3>

      {/* Key Ratios */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Key Ratios
        </div>
        <div className="grid grid-cols-4 gap-2">
          <OutputMetric label="LTV" value={fmtPct(outputs.ltv)} />
          {modelType === "rtl" && (
            <>
              <OutputMetric label="LTARV" value={fmtPct(outputs.ltarv)} />
              <OutputMetric label="LTC" value={fmtPct(outputs.ltc)} />
            </>
          )}
          <OutputMetric
            label="DSCR"
            value={outputs.debt_service_coverage != null ? outputs.debt_service_coverage.toFixed(2) + "x" : "—"}
            color={outputs.debt_service_coverage != null && outputs.debt_service_coverage >= 1.0 ? "text-green-500" : "text-red-500"}
          />
        </div>
      </div>

      {/* Payment & Fees */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Payment & Fees
        </div>
        <div className="grid grid-cols-4 gap-2">
          <OutputMetric label="Monthly Payment" value={fmtCur(outputs.monthly_payment)} />
          <OutputMetric label="Total Interest" value={fmtCur(outputs.total_interest)} />
          <OutputMetric label="Origination Fee" value={fmtCur(outputs.origination_fee)} />
          <OutputMetric label="Total Closing" value={fmtCur(outputs.total_closing_costs)} />
        </div>
      </div>

      {/* Cash & Holding */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Cash Requirements
        </div>
        <div className="grid grid-cols-3 gap-2">
          <OutputMetric label="Cash to Close" value={fmtCur(outputs.total_cash_to_close)} />
          <OutputMetric label="Holding Costs" value={fmtCur(outputs.total_holding_costs)} />
          <OutputMetric label="Total Project Cost" value={fmtCur(outputs.total_project_cost)} />
        </div>
      </div>

      {/* Returns */}
      {modelType === "rtl" && (
        <div className="mb-4">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Returns
          </div>
          <div className="grid grid-cols-4 gap-2">
            <OutputMetric
              label="Net Profit"
              value={fmtCur(outputs.net_profit)}
              color={outputs.net_profit != null && outputs.net_profit >= 0 ? "text-green-500" : "text-red-500"}
            />
            <OutputMetric label="ROI" value={fmtPct(outputs.borrower_roi)} />
            <OutputMetric label="Ann. ROI" value={fmtPct(outputs.annualized_roi)} />
            <OutputMetric label="Net Yield" value={fmtPct(outputs.net_yield)} />
          </div>
        </div>
      )}

      {/* Per Partner */}
      {outputs.cash_per_partner != null && (
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Per Partner
          </div>
          <div className="grid grid-cols-2 gap-2">
            <OutputMetric label="Cash Per Partner" value={fmtCur(outputs.cash_per_partner)} />
            <OutputMetric label="Profit Per Partner" value={fmtCur(outputs.profit_per_partner)} />
          </div>
        </div>
      )}

      {/* Max Loan Sizing */}
      <div className="mt-4 pt-3 border-t border-border">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Max Loan Sizing
        </div>
        <div className="grid grid-cols-2 gap-2">
          <OutputMetric label="Max Loan (75% LTV)" value={fmtCur(outputs.max_loan_ltv)} />
          <OutputMetric label="Max Loan (70% LTARV)" value={fmtCur(outputs.max_loan_ltarv)} />
        </div>
      </div>
    </div>
  );
}

/* ── Output Metric ── */
function OutputMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-sm font-semibold num ${color || "text-foreground"}`}>{value}</div>
    </div>
  );
}

/* ── Form Section ── */
function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

/* ── Input Fields ── */
function CurrencyField({ label, value, onChange, readOnly }: { label: string; value: number | null; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">$</span>
        <input
          type="text"
          value={value != null ? value.toLocaleString("en-US") : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className="w-full rounded-md border border-input bg-background pl-6 pr-3 py-2 text-sm num text-foreground placeholder:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="0"
        />
      </div>
    </div>
  );
}

function PercentField({ label, value, onChange, readOnly }: { label: string; value: number | null; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>
      <div className="relative">
        <input
          type="text"
          value={value != null ? value.toString() : ""}
          onChange={(e) => onChange(e.target.value)}
          disabled={readOnly}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm num text-foreground placeholder:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="0.00"
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange, readOnly }: { label: string; value: number | null; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>
      <input
        type="text"
        value={value != null ? value.toString() : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm num text-foreground placeholder:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="0"
      />
    </div>
  );
}

function TextField({ label, value, onChange, readOnly }: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div className="col-span-full">
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
        placeholder="Enter address"
      />
    </div>
  );
}

function SelectField({ label, value, options, onChange, readOnly }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={readOnly}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60 disabled:cursor-not-allowed focus:outline-none focus:ring-1 focus:ring-ring"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/* ── Formatters ── */
function fmtCur(n: number | null | undefined): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function fmtPct(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toFixed(1) + "%";
}
