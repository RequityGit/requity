"use client";

import { useCommercialUWStore } from "../store";
import { UWCard } from "../uw-card";
import { UWInput, UWSelect } from "../uw-input";

export function DealOverviewTab() {
  const { state, updateField } = useCommercialUWStore();

  return (
    <div className="flex flex-col gap-5">
      <UWCard title="Property Information">
        <div className="flex gap-3.5 mb-3.5">
          <UWSelect
            label="Property Type"
            value={state.propertyType}
            options={["Multifamily", "Mixed Use", "Retail", "Office", "Industrial", "Self Storage"]}
            onChange={(v) => updateField("propertyType", v)}
          />
          <UWInput
            label="Total Units / Spaces"
            value={state.totalUnits}
            onChange={(v) => updateField("totalUnits", v)}
          />
          <UWInput
            label="Total SF"
            value={state.totalSF}
            onChange={(v) => updateField("totalSF", v)}
          />
          <UWInput
            label="Year Built"
            value={state.yearBuilt}
            onChange={(v) => updateField("yearBuilt", v)}
          />
        </div>
      </UWCard>

      <UWCard title="Acquisition Details">
        <div className="flex gap-3.5 mb-3.5">
          <UWInput label="Purchase Price" value={state.purchasePrice} prefix="$" onChange={(v) => updateField("purchasePrice", v)} />
          <UWInput label="Exit Cap Rate" value={state.exitCapRate} suffix="%" onChange={(v) => updateField("exitCapRate", v)} />
          <UWInput label="Disposition Cost" value={state.dispositionCost} suffix="%" onChange={(v) => updateField("dispositionCost", v)} />
        </div>
        <div className="flex gap-3.5">
          <UWInput label="Equity Invested" value={state.equityInvested} prefix="$" onChange={(v) => updateField("equityInvested", v)} />
          <div className="flex-1" />
          <div className="flex-1" />
        </div>
      </UWCard>

      <div className="grid grid-cols-2 gap-5">
        <UWCard title="Going-In Loan Terms" accent="hsl(210, 55%, 41%)">
          <div className="flex gap-3.5 mb-3.5">
            <UWInput label="Loan Amount" value={state.goingInLoanAmount} prefix="$" onChange={(v) => updateField("goingInLoanAmount", v)} />
          </div>
          <div className="flex gap-3.5 mb-3.5">
            <UWInput label="Interest Rate" value={state.goingInInterestRate} suffix="%" onChange={(v) => updateField("goingInInterestRate", v)} />
            <UWInput label="Term" value={state.goingInTermMonths} suffix="mo" onChange={(v) => updateField("goingInTermMonths", v)} />
          </div>
          <div className="flex gap-3.5">
            <UWInput label="IO Period" value={state.goingInIOMonths} suffix="mo" onChange={(v) => updateField("goingInIOMonths", v)} />
            <UWInput label="Origination Pts" value={state.goingInOriginationPts} suffix="%" onChange={(v) => updateField("goingInOriginationPts", v)} />
          </div>
        </UWCard>

        <UWCard title="Exit / Permanent Loan" accent="hsl(145, 63%, 29%)">
          <div className="flex gap-3.5 mb-3.5">
            <UWInput label="Loan Amount" value={state.exitLoanAmount} prefix="$" onChange={(v) => updateField("exitLoanAmount", v)} />
          </div>
          <div className="flex gap-3.5 mb-3.5">
            <UWInput label="Interest Rate" value={state.exitInterestRate} suffix="%" onChange={(v) => updateField("exitInterestRate", v)} />
            <UWInput label="Amortization" value={state.exitAmortizationYears} suffix="yr" onChange={(v) => updateField("exitAmortizationYears", v)} />
          </div>
          <div className="flex gap-3.5">
            <UWInput label="IO Period" value={state.exitIOMonths} suffix="mo" onChange={(v) => updateField("exitIOMonths", v)} />
            <div className="flex-1" />
          </div>
        </UWCard>
      </div>
    </div>
  );
}
