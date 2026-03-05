"use client";

import { useState, useMemo } from "react";
import { Plus, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeCommercialOutputs } from "@/lib/underwriting/commercial-calculator";
import type {
  CommercialInputs,
  CommercialOutputs,
  RentRollUnit,
  AncillaryItem,
} from "@/lib/underwriting/commercial-types";
import { PROPERTY_TYPES, PROPERTY_TYPE_DEFAULTS } from "@/lib/underwriting/commercial-types";
import { UploadRentRollDialog } from "@/components/admin/commercial-uw/upload-rent-roll-dialog";
import { UploadT12Dialog } from "@/components/admin/commercial-uw/upload-t12-dialog";
import type { RentRollRow } from "@/lib/commercial-uw/types";
import type { T12Data } from "@/lib/commercial-uw/types";

interface CommercialFormProps {
  inputs: CommercialInputs;
  onChange: (inputs: CommercialInputs) => void;
  readOnly?: boolean;
}

export function CommercialForm({ inputs, onChange, readOnly = false }: CommercialFormProps) {
  const outputs = useMemo(() => computeCommercialOutputs(inputs), [inputs]);
  const [rentRollUploadOpen, setRentRollUploadOpen] = useState(false);
  const [t12UploadOpen, setT12UploadOpen] = useState(false);

  const updateField = (field: keyof CommercialInputs, value: number | string | null) => {
    if (readOnly) return;
    onChange({ ...inputs, [field]: value });
  };

  const updateNum = (field: keyof CommercialInputs, raw: string) => {
    if (readOnly) return;
    const cleaned = raw.replace(/[^0-9.-]/g, "");
    const val = cleaned === "" ? null : parseFloat(cleaned);
    onChange({ ...inputs, [field]: val });
  };

  const handlePropertyTypeChange = (type: string) => {
    if (readOnly) return;
    const defaults = PROPERTY_TYPE_DEFAULTS[type];
    if (!defaults) {
      onChange({ ...inputs, property_type: type || null });
      return;
    }
    onChange({
      ...inputs,
      property_type: type || null,
      vacancy_pct_yr1: defaults.vacancy_pct,
      vacancy_pct_yr2: Math.round((defaults.vacancy_pct + defaults.stabilized_vacancy_pct) / 2),
      vacancy_pct_yr3: defaults.stabilized_vacancy_pct,
      vacancy_pct_yr4: defaults.stabilized_vacancy_pct,
      vacancy_pct_yr5: defaults.stabilized_vacancy_pct,
      stabilized_vacancy_pct: defaults.stabilized_vacancy_pct,
      bad_debt_pct: defaults.bad_debt_pct,
      yr1_mgmt_fee_pct: defaults.mgmt_fee_pct,
      rent_growth_yr1: defaults.rent_growth[0],
      rent_growth_yr2: defaults.rent_growth[1],
      rent_growth_yr3: defaults.rent_growth[2],
      rent_growth_yr4: defaults.rent_growth[3],
      rent_growth_yr5: defaults.rent_growth[4],
      expense_growth_yr1: defaults.expense_growth[0],
      expense_growth_yr2: defaults.expense_growth[1],
      expense_growth_yr3: defaults.expense_growth[2],
      expense_growth_yr4: defaults.expense_growth[3],
      expense_growth_yr5: defaults.expense_growth[4],
      going_in_cap_rate: defaults.going_in_cap_rate,
      exit_cap_rate: defaults.exit_cap_rate,
      disposition_cost_pct: defaults.disposition_cost_pct,
    });
  };

  // ── Rent Roll Helpers ──
  const updateRentRollUnit = (idx: number, field: keyof RentRollUnit, value: string | number | boolean | null) => {
    if (readOnly) return;
    const updated = [...inputs.rent_roll];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...inputs, rent_roll: updated });
  };

  const addRentRollUnit = () => {
    if (readOnly) return;
    const nextNum = inputs.rent_roll.length + 1;
    onChange({
      ...inputs,
      rent_roll: [
        ...inputs.rent_roll,
        { unit_number: String(nextNum), tenant_name: "", sf: null, current_monthly_rent: null, market_rent: null, cam_nnn: 0, other_income: 0, is_vacant: false },
      ],
    });
  };

  const removeRentRollUnit = (idx: number) => {
    if (readOnly) return;
    onChange({ ...inputs, rent_roll: inputs.rent_roll.filter((_, i) => i !== idx) });
  };

  const handleRentRollImport = (rows: RentRollRow[]) => {
    if (readOnly) return;
    const converted: RentRollUnit[] = rows.map((row) => ({
      unit_number: row.unit_number,
      tenant_name: row.tenant_name,
      sf: row.sf ?? null,
      current_monthly_rent: row.current_monthly_rent ?? null,
      market_rent: row.market_rent ?? null,
      cam_nnn: row.cam_nnn ?? null,
      other_income: row.other_income ?? null,
      is_vacant: row.is_vacant,
    }));
    onChange({ ...inputs, rent_roll: converted });
  };

  const handleT12Import = (data: T12Data) => {
    if (readOnly) return;
    onChange({
      ...inputs,
      t12_gpi: data.gpi || null,
      t12_vacancy_pct: data.vacancy_pct || null,
      t12_bad_debt_pct: data.bad_debt_pct || null,
      t12_mgmt_fee: data.mgmt_fee || null,
      t12_taxes: data.taxes || null,
      t12_insurance: data.insurance || null,
      t12_utilities: data.utilities || null,
      t12_repairs: data.repairs || null,
      t12_contract_services: data.contract_services || null,
      t12_payroll: data.payroll || null,
      t12_marketing: data.marketing || null,
      t12_ga: data.ga || null,
      t12_replacement_reserve: data.replacement_reserve || null,
    });
  };

  // ── Ancillary Income Helpers ──
  const updateAncillary = (idx: number, field: keyof AncillaryItem, value: string | number | null) => {
    if (readOnly) return;
    const updated = [...inputs.ancillary_income];
    updated[idx] = { ...updated[idx], [field]: value };
    onChange({ ...inputs, ancillary_income: updated });
  };

  const addAncillary = () => {
    if (readOnly) return;
    onChange({
      ...inputs,
      ancillary_income: [
        ...inputs.ancillary_income,
        { income_source: "", current_annual: null, stabilized_annual: null },
      ],
    });
  };

  const removeAncillary = (idx: number) => {
    if (readOnly) return;
    onChange({ ...inputs, ancillary_income: inputs.ancillary_income.filter((_, i) => i !== idx) });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Property Information ── */}
      <FormSection title="Property Information">
        <div className="grid grid-cols-4 gap-3">
          <SelectField
            label="Property Type"
            value={inputs.property_type ?? ""}
            options={PROPERTY_TYPES.map((t) => ({ value: t.value, label: t.label }))}
            onChange={handlePropertyTypeChange}
            readOnly={readOnly}
          />
          <NumberField label="Total Units / Spaces" value={inputs.total_units} onChange={(v) => updateNum("total_units", v)} readOnly={readOnly} />
          <NumberField label="Total SF" value={inputs.total_sf} onChange={(v) => updateNum("total_sf", v)} readOnly={readOnly} />
          <NumberField label="Year Built" value={inputs.year_built} onChange={(v) => updateNum("year_built", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* ── Rent Roll ── */}
      <FormSection
        title="Rent Roll"
        action={!readOnly ? (
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setRentRollUploadOpen(true)}>
            <Upload size={12} className="mr-1" strokeWidth={1.5} /> Upload
          </Button>
        ) : undefined}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-2 font-medium text-muted-foreground">Unit</th>
                <th className="pb-2 pr-2 font-medium text-muted-foreground">Tenant</th>
                <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">SF</th>
                <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">Rent/Mo</th>
                <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">Market/Mo</th>
                <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">CAM/NNN</th>
                <th className="pb-2 pr-2 font-medium text-muted-foreground text-right">Other</th>
                <th className="pb-2 pr-2 font-medium text-muted-foreground text-center">Vacant</th>
                <th className="pb-2 w-8"></th>
              </tr>
            </thead>
            <tbody>
              {inputs.rent_roll.map((unit, idx) => (
                <tr key={idx} className="border-b border-border/50">
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      value={unit.unit_number}
                      onChange={(e) => updateRentRollUnit(idx, "unit_number", e.target.value)}
                      disabled={readOnly}
                      className="w-16 rounded border border-input bg-background px-2 py-1 text-[12px] text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      value={unit.tenant_name}
                      onChange={(e) => updateRentRollUnit(idx, "tenant_name", e.target.value)}
                      disabled={readOnly}
                      className="w-28 rounded border border-input bg-background px-2 py-1 text-[12px] text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-ring"
                      placeholder={unit.is_vacant ? "Vacant" : ""}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="text"
                      value={unit.sf != null ? unit.sf.toLocaleString("en-US") : ""}
                      onChange={(e) => updateRentRollUnit(idx, "sf", parseNum(e.target.value))}
                      disabled={readOnly}
                      className="w-16 rounded border border-input bg-background px-2 py-1 text-[12px] num text-right text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <CurrencyInput
                      value={unit.current_monthly_rent}
                      onChange={(v) => updateRentRollUnit(idx, "current_monthly_rent", v)}
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <CurrencyInput
                      value={unit.market_rent}
                      onChange={(v) => updateRentRollUnit(idx, "market_rent", v)}
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <CurrencyInput
                      value={unit.cam_nnn}
                      onChange={(v) => updateRentRollUnit(idx, "cam_nnn", v)}
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <CurrencyInput
                      value={unit.other_income}
                      onChange={(v) => updateRentRollUnit(idx, "other_income", v)}
                      readOnly={readOnly}
                    />
                  </td>
                  <td className="py-1.5 pr-2 text-center">
                    <input
                      type="checkbox"
                      checked={unit.is_vacant}
                      onChange={(e) => updateRentRollUnit(idx, "is_vacant", e.target.checked)}
                      disabled={readOnly}
                      className="h-3.5 w-3.5 rounded border-input accent-primary"
                    />
                  </td>
                  <td className="py-1.5">
                    {!readOnly && (
                      <button onClick={() => removeRentRollUnit(idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={13} strokeWidth={1.5} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-border font-medium text-[12px]">
                <td colSpan={2} className="py-2 pr-2 text-muted-foreground">Totals</td>
                <td className="py-2 pr-2 text-right num text-foreground">
                  {inputs.rent_roll.reduce((s, u) => s + (u.sf ?? 0), 0).toLocaleString("en-US")}
                </td>
                <td className="py-2 pr-2 text-right num text-foreground">
                  {fmtCur(inputs.rent_roll.reduce((s, u) => s + (u.current_monthly_rent ?? 0), 0))}
                </td>
                <td className="py-2 pr-2 text-right num text-foreground">
                  {fmtCur(inputs.rent_roll.reduce((s, u) => s + (u.market_rent ?? 0), 0))}
                </td>
                <td className="py-2 pr-2 text-right num text-foreground">
                  {fmtCur(inputs.rent_roll.reduce((s, u) => s + (u.cam_nnn ?? 0), 0))}
                </td>
                <td className="py-2 pr-2 text-right num text-foreground">
                  {fmtCur(inputs.rent_roll.reduce((s, u) => s + (u.other_income ?? 0), 0))}
                </td>
                <td colSpan={2} className="py-2 text-center text-muted-foreground num">
                  {inputs.rent_roll.filter((u) => u.is_vacant).length} vac.
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {!readOnly && (
          <Button variant="outline" size="sm" className="mt-3 h-7 text-[11px]" onClick={addRentRollUnit}>
            <Plus size={12} className="mr-1" strokeWidth={1.5} /> Add Unit
          </Button>
        )}
      </FormSection>

      {/* ── Ancillary Income ── */}
      <FormSection title="Ancillary Income">
        {inputs.ancillary_income.length > 0 && (
          <div className="space-y-2 mb-3">
            {inputs.ancillary_income.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                <div>
                  {idx === 0 && <label className="block text-[11px] font-medium text-muted-foreground mb-1">Source</label>}
                  <input
                    type="text"
                    value={item.income_source}
                    onChange={(e) => updateAncillary(idx, "income_source", e.target.value)}
                    disabled={readOnly}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-ring"
                    placeholder="e.g. Laundry, Parking"
                  />
                </div>
                <CurrencyField
                  label={idx === 0 ? "Current Annual" : ""}
                  value={item.current_annual}
                  onChange={(v) => updateAncillary(idx, "current_annual", parseNum(v))}
                  readOnly={readOnly}
                />
                <CurrencyField
                  label={idx === 0 ? "Stabilized Annual" : ""}
                  value={item.stabilized_annual}
                  onChange={(v) => updateAncillary(idx, "stabilized_annual", parseNum(v))}
                  readOnly={readOnly}
                />
                {!readOnly && (
                  <button onClick={() => removeAncillary(idx)} className="pb-2 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        {!readOnly && (
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={addAncillary}>
            <Plus size={12} className="mr-1" strokeWidth={1.5} /> Add Income Source
          </Button>
        )}
      </FormSection>

      {/* ── T12 Historical Expenses ── */}
      <FormSection
        title="T12 Historical Expenses"
        action={!readOnly ? (
          <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => setT12UploadOpen(true)}>
            <Upload size={12} className="mr-1" strokeWidth={1.5} /> Upload
          </Button>
        ) : undefined}
      >
        <div className="grid grid-cols-3 gap-3">
          <CurrencyField label="Gross Potential Income" value={inputs.t12_gpi} onChange={(v) => updateNum("t12_gpi", v)} readOnly={readOnly} />
          <PercentField label="Vacancy %" value={inputs.t12_vacancy_pct} onChange={(v) => updateNum("t12_vacancy_pct", v)} readOnly={readOnly} />
          <PercentField label="Bad Debt %" value={inputs.t12_bad_debt_pct} onChange={(v) => updateNum("t12_bad_debt_pct", v)} readOnly={readOnly} />
        </div>
        <div className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Expense Categories</div>
        <div className="grid grid-cols-3 gap-3">
          <CurrencyField label="Management Fee" value={inputs.t12_mgmt_fee} onChange={(v) => updateNum("t12_mgmt_fee", v)} readOnly={readOnly} />
          <CurrencyField label="Taxes" value={inputs.t12_taxes} onChange={(v) => updateNum("t12_taxes", v)} readOnly={readOnly} />
          <CurrencyField label="Insurance" value={inputs.t12_insurance} onChange={(v) => updateNum("t12_insurance", v)} readOnly={readOnly} />
          <CurrencyField label="Utilities" value={inputs.t12_utilities} onChange={(v) => updateNum("t12_utilities", v)} readOnly={readOnly} />
          <CurrencyField label="Repairs & Maintenance" value={inputs.t12_repairs} onChange={(v) => updateNum("t12_repairs", v)} readOnly={readOnly} />
          <CurrencyField label="Contract Services" value={inputs.t12_contract_services} onChange={(v) => updateNum("t12_contract_services", v)} readOnly={readOnly} />
          <CurrencyField label="Payroll" value={inputs.t12_payroll} onChange={(v) => updateNum("t12_payroll", v)} readOnly={readOnly} />
          <CurrencyField label="Marketing" value={inputs.t12_marketing} onChange={(v) => updateNum("t12_marketing", v)} readOnly={readOnly} />
          <CurrencyField label="G&A" value={inputs.t12_ga} onChange={(v) => updateNum("t12_ga", v)} readOnly={readOnly} />
          <CurrencyField label="Replacement Reserve" value={inputs.t12_replacement_reserve} onChange={(v) => updateNum("t12_replacement_reserve", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* ── Year 1 Expense Overrides ── */}
      <FormSection title="Year 1 Expense Overrides">
        <p className="text-[11px] text-muted-foreground mb-3">Leave blank to use T12 actual values. Management fee is calculated as a percentage of EGI.</p>
        <div className="grid grid-cols-3 gap-3">
          <PercentField label="Mgmt Fee %" value={inputs.yr1_mgmt_fee_pct} onChange={(v) => updateNum("yr1_mgmt_fee_pct", v)} readOnly={readOnly} />
          <CurrencyField label="Taxes" value={inputs.yr1_taxes} onChange={(v) => updateNum("yr1_taxes", v)} readOnly={readOnly} />
          <CurrencyField label="Insurance" value={inputs.yr1_insurance} onChange={(v) => updateNum("yr1_insurance", v)} readOnly={readOnly} />
          <CurrencyField label="Utilities" value={inputs.yr1_utilities} onChange={(v) => updateNum("yr1_utilities", v)} readOnly={readOnly} />
          <CurrencyField label="Repairs" value={inputs.yr1_repairs} onChange={(v) => updateNum("yr1_repairs", v)} readOnly={readOnly} />
          <CurrencyField label="Contract Services" value={inputs.yr1_contract} onChange={(v) => updateNum("yr1_contract", v)} readOnly={readOnly} />
          <CurrencyField label="Payroll" value={inputs.yr1_payroll} onChange={(v) => updateNum("yr1_payroll", v)} readOnly={readOnly} />
          <CurrencyField label="Marketing" value={inputs.yr1_marketing} onChange={(v) => updateNum("yr1_marketing", v)} readOnly={readOnly} />
          <CurrencyField label="G&A" value={inputs.yr1_ga} onChange={(v) => updateNum("yr1_ga", v)} readOnly={readOnly} />
          <CurrencyField label="Replacement Reserve" value={inputs.yr1_reserve} onChange={(v) => updateNum("yr1_reserve", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* ── Growth & Vacancy Assumptions ── */}
      <FormSection title="Growth & Vacancy Assumptions">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2 text-left font-medium text-muted-foreground w-40"></th>
                <th className="pb-2 text-center font-medium text-muted-foreground">Yr 1</th>
                <th className="pb-2 text-center font-medium text-muted-foreground">Yr 2</th>
                <th className="pb-2 text-center font-medium text-muted-foreground">Yr 3</th>
                <th className="pb-2 text-center font-medium text-muted-foreground">Yr 4</th>
                <th className="pb-2 text-center font-medium text-muted-foreground">Yr 5</th>
              </tr>
            </thead>
            <tbody>
              <AssumptionRow
                label="Rent Growth %"
                values={[inputs.rent_growth_yr1, inputs.rent_growth_yr2, inputs.rent_growth_yr3, inputs.rent_growth_yr4, inputs.rent_growth_yr5]}
                fields={["rent_growth_yr1", "rent_growth_yr2", "rent_growth_yr3", "rent_growth_yr4", "rent_growth_yr5"]}
                onChange={updateNum}
                readOnly={readOnly}
              />
              <AssumptionRow
                label="Expense Growth %"
                values={[inputs.expense_growth_yr1, inputs.expense_growth_yr2, inputs.expense_growth_yr3, inputs.expense_growth_yr4, inputs.expense_growth_yr5]}
                fields={["expense_growth_yr1", "expense_growth_yr2", "expense_growth_yr3", "expense_growth_yr4", "expense_growth_yr5"]}
                onChange={updateNum}
                readOnly={readOnly}
              />
              <AssumptionRow
                label="Vacancy %"
                values={[inputs.vacancy_pct_yr1, inputs.vacancy_pct_yr2, inputs.vacancy_pct_yr3, inputs.vacancy_pct_yr4, inputs.vacancy_pct_yr5]}
                fields={["vacancy_pct_yr1", "vacancy_pct_yr2", "vacancy_pct_yr3", "vacancy_pct_yr4", "vacancy_pct_yr5"]}
                onChange={updateNum}
                readOnly={readOnly}
              />
            </tbody>
          </table>
        </div>
        <div className="grid grid-cols-3 gap-3 mt-3">
          <PercentField label="Stabilized Vacancy %" value={inputs.stabilized_vacancy_pct} onChange={(v) => updateNum("stabilized_vacancy_pct", v)} readOnly={readOnly} />
          <PercentField label="Bad Debt %" value={inputs.bad_debt_pct} onChange={(v) => updateNum("bad_debt_pct", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* ── Bridge Loan Terms ── */}
      <FormSection title="Bridge Loan Terms">
        <div className="grid grid-cols-3 gap-3">
          <CurrencyField label="Loan Amount" value={inputs.bridge_loan_amount} onChange={(v) => updateNum("bridge_loan_amount", v)} readOnly={readOnly} />
          <PercentField label="Interest Rate" value={inputs.bridge_rate} onChange={(v) => updateNum("bridge_rate", v)} readOnly={readOnly} />
          <NumberField label="Term (months)" value={inputs.bridge_term_months} onChange={(v) => updateNum("bridge_term_months", v)} readOnly={readOnly} />
          <NumberField label="IO Period (months)" value={inputs.bridge_io_months} onChange={(v) => updateNum("bridge_io_months", v)} readOnly={readOnly} />
          <PercentField label="Origination Points" value={inputs.bridge_origination_pts} onChange={(v) => updateNum("bridge_origination_pts", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* ── Exit Loan Terms ── */}
      <FormSection title="Exit / Permanent Loan Terms">
        <div className="grid grid-cols-3 gap-3">
          <CurrencyField label="Loan Amount" value={inputs.exit_loan_amount} onChange={(v) => updateNum("exit_loan_amount", v)} readOnly={readOnly} />
          <PercentField label="Interest Rate" value={inputs.exit_rate} onChange={(v) => updateNum("exit_rate", v)} readOnly={readOnly} />
          <NumberField label="Amortization (years)" value={inputs.exit_amortization_years} onChange={(v) => updateNum("exit_amortization_years", v)} readOnly={readOnly} />
          <NumberField label="IO Period (months)" value={inputs.exit_io_months} onChange={(v) => updateNum("exit_io_months", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* ── Acquisition Details ── */}
      <FormSection title="Acquisition Details">
        <div className="grid grid-cols-3 gap-3">
          <CurrencyField label="Purchase Price" value={inputs.purchase_price} onChange={(v) => updateNum("purchase_price", v)} readOnly={readOnly} />
          <PercentField label="Exit Cap Rate" value={inputs.exit_cap_rate} onChange={(v) => updateNum("exit_cap_rate", v)} readOnly={readOnly} />
          <PercentField label="Disposition Cost %" value={inputs.disposition_cost_pct} onChange={(v) => updateNum("disposition_cost_pct", v)} readOnly={readOnly} />
          <CurrencyField label="Equity Invested" value={inputs.equity_invested} onChange={(v) => updateNum("equity_invested", v)} readOnly={readOnly} />
        </div>
      </FormSection>

      {/* ── Outputs ── */}
      <OutputsPanel outputs={outputs} />

      {/* Upload Dialogs */}
      <UploadRentRollDialog
        open={rentRollUploadOpen}
        onOpenChange={setRentRollUploadOpen}
        onImport={(rows) => handleRentRollImport(rows)}
      />
      <UploadT12Dialog
        open={t12UploadOpen}
        onOpenChange={setT12UploadOpen}
        onImport={(data) => handleT12Import(data)}
      />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Outputs Panel
   ══════════════════════════════════════════════════════════════ */

function OutputsPanel({ outputs }: { outputs: CommercialOutputs }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="text-sm font-semibold text-foreground mb-4">Deal Analysis</h3>

      {/* Key Metrics */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Key Metrics</div>
        <div className="grid grid-cols-4 gap-2">
          <OutputMetric label="Current NOI" value={fmtCur(outputs.current_noi)} />
          <OutputMetric
            label="Going-In Cap"
            value={outputs.going_in_cap_rate != null ? outputs.going_in_cap_rate.toFixed(2) + "%" : "—"}
          />
          <OutputMetric
            label="DSCR"
            value={outputs.dscr != null ? outputs.dscr.toFixed(2) + "x" : "—"}
            color={outputs.dscr != null && outputs.dscr >= 1.25 ? "text-green-500" : outputs.dscr != null && outputs.dscr >= 1.0 ? "text-amber-500" : "text-red-500"}
          />
          <OutputMetric
            label="Cash-on-Cash"
            value={outputs.cash_on_cash != null ? outputs.cash_on_cash.toFixed(2) + "%" : "—"}
            color={outputs.cash_on_cash != null && outputs.cash_on_cash > 0 ? "text-green-500" : "text-red-500"}
          />
        </div>
      </div>

      {/* Income Summary */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Income</div>
        <div className="grid grid-cols-4 gap-2">
          <OutputMetric label="Current GPI" value={fmtCur(outputs.current_gpi)} />
          <OutputMetric label="Stabilized GPI" value={fmtCur(outputs.stabilized_gpi)} />
          <OutputMetric label="Vacancy Loss" value={fmtCur(outputs.current_vacancy)} />
          <OutputMetric label="Current EGI" value={fmtCur(outputs.current_egi)} />
        </div>
      </div>

      {/* Expenses & NOI */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Expenses & NOI</div>
        <div className="grid grid-cols-4 gap-2">
          <OutputMetric label="Total OpEx" value={fmtCur(outputs.current_total_opex)} />
          <OutputMetric label="Current NOI" value={fmtCur(outputs.current_noi)} />
          <OutputMetric label="Debt Service" value={fmtCur(outputs.annual_debt_service)} />
          <OutputMetric
            label="Debt Yield"
            value={outputs.debt_yield != null ? outputs.debt_yield.toFixed(2) + "%" : "—"}
          />
        </div>
      </div>

      {/* Per-Unit Metrics */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Per-Unit / Per-SF</div>
        <div className="grid grid-cols-3 gap-2">
          <OutputMetric label="Price / Unit" value={fmtCur(outputs.price_per_unit)} />
          <OutputMetric label="Price / SF" value={fmtCur(outputs.price_per_sf)} />
          <OutputMetric label="NOI / Unit" value={fmtCur(outputs.noi_per_unit)} />
        </div>
      </div>

      {/* 5-Year Pro Forma Table */}
      {outputs.proforma.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">5-Year Pro Forma</div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2 text-left font-medium text-muted-foreground"></th>
                  {outputs.proforma.map((yr) => (
                    <th key={yr.year} className="pb-2 text-right font-medium text-muted-foreground px-2">
                      Year {yr.year}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <ProFormaRow label="GPI" values={outputs.proforma.map((y) => y.gpi)} />
                <ProFormaRow label="Vacancy" values={outputs.proforma.map((y) => -y.vacancy)} negative />
                <ProFormaRow label="Bad Debt" values={outputs.proforma.map((y) => -y.bad_debt)} negative />
                <ProFormaRow label="EGI" values={outputs.proforma.map((y) => y.egi)} bold />
                <ProFormaRow label="Total OpEx" values={outputs.proforma.map((y) => -y.total_opex)} negative />
                <ProFormaRow label="NOI" values={outputs.proforma.map((y) => y.noi)} bold highlight />
                <ProFormaRow label="Debt Service" values={outputs.proforma.map((y) => -y.debt_service)} negative />
                <ProFormaRow label="Net Cash Flow" values={outputs.proforma.map((y) => y.ncf)} bold />
                <tr className="border-t border-border">
                  <td className="py-1.5 text-muted-foreground font-medium">DSCR</td>
                  {outputs.proforma.map((y) => (
                    <td key={y.year} className={`py-1.5 text-right px-2 num font-medium ${
                      y.dscr != null && y.dscr >= 1.25 ? "text-green-500" : y.dscr != null && y.dscr >= 1.0 ? "text-amber-500" : "text-red-500"
                    }`}>
                      {y.dscr != null ? y.dscr.toFixed(2) + "x" : "—"}
                    </td>
                  ))}
                </tr>
                <tr>
                  <td className="py-1.5 text-muted-foreground font-medium">Cap Rate</td>
                  {outputs.proforma.map((y) => (
                    <td key={y.year} className="py-1.5 text-right px-2 num text-foreground">
                      {y.cap_rate != null ? y.cap_rate.toFixed(2) + "%" : "—"}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Shared UI Components (mirrors rtl-dscr-form.tsx pattern)
   ══════════════════════════════════════════════════════════════ */

function ProFormaRow({
  label,
  values,
  bold,
  negative,
  highlight,
}: {
  label: string;
  values: number[];
  bold?: boolean;
  negative?: boolean;
  highlight?: boolean;
}) {
  return (
    <tr className={highlight ? "bg-muted/30" : ""}>
      <td className={`py-1.5 text-muted-foreground ${bold ? "font-medium" : ""}`}>{label}</td>
      {values.map((v, i) => (
        <td
          key={i}
          className={`py-1.5 text-right px-2 num ${bold ? "font-medium text-foreground" : "text-muted-foreground"} ${negative && v < 0 ? "text-red-400" : ""}`}
        >
          {fmtCur(Math.abs(v))}
          {negative && v < 0 ? "" : ""}
        </td>
      ))}
    </tr>
  );
}

function OutputMetric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg bg-muted/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{label}</div>
      <div className={`text-sm font-semibold num ${color || "text-foreground"}`}>{value}</div>
    </div>
  );
}

function FormSection({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

function CurrencyField({ label, value, onChange, readOnly }: { label: string; value: number | null; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>}
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

function CurrencyInput({ value, onChange, readOnly }: { value: number | null; onChange: (v: number | null) => void; readOnly?: boolean }) {
  return (
    <div className="relative">
      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">$</span>
      <input
        type="text"
        value={value != null ? value.toLocaleString("en-US") : ""}
        onChange={(e) => onChange(parseNum(e.target.value))}
        disabled={readOnly}
        className="w-20 rounded border border-input bg-background pl-4 pr-1.5 py-1 text-[12px] num text-right text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function PercentField({ label, value, onChange, readOnly }: { label: string; value: number | null; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>}
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
      {label && <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>}
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

function SelectField({ label, value, options, onChange, readOnly }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <div>
      {label && <label className="block text-[11px] font-medium text-muted-foreground mb-1">{label}</label>}
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

function AssumptionRow({
  label,
  values,
  fields,
  onChange,
  readOnly,
}: {
  label: string;
  values: (number | null)[];
  fields: string[];
  onChange: (field: keyof CommercialInputs, raw: string) => void;
  readOnly?: boolean;
}) {
  return (
    <tr className="border-b border-border/50">
      <td className="py-2 text-muted-foreground font-medium">{label}</td>
      {values.map((v, i) => (
        <td key={i} className="py-2 px-1">
          <div className="relative">
            <input
              type="text"
              value={v != null ? v.toString() : ""}
              onChange={(e) => onChange(fields[i] as keyof CommercialInputs, e.target.value)}
              disabled={readOnly}
              className="w-full rounded border border-input bg-background px-2 py-1 text-[12px] num text-center text-foreground disabled:opacity-60 focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="0"
            />
          </div>
        </td>
      ))}
    </tr>
  );
}

/* ── Helpers ── */
function fmtCur(n: number | null | undefined): string {
  if (n == null) return "—";
  return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function parseNum(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.-]/g, "");
  return cleaned === "" ? null : parseFloat(cleaned);
}
