"use client";

import {
  DollarSign,
  FileText,
  Building2,
  TrendingUp,
  User,
  Users,
  Layers,
  Lock,
} from "lucide-react";
import {
  SectionCard,
  FieldRow,
  fmt,
  fP,
  cap,
  type DealData,
} from "../components";
import {
  EditableFieldRow,
  EditableMetricCard,
  EditableNotes,
  type SelectOption,
} from "../EditableField";
import {
  LOAN_DB_TYPES,
  LOAN_PURPOSES,
  FUNDING_CHANNELS,
  INVESTMENT_STRATEGIES,
  DEAL_FINANCING_OPTIONS,
  DEBT_TRANCHES,
  PREPAYMENT_PENALTY_TYPES,
  RENTAL_STATUSES,
  LEASE_TYPES,
  FLOOD_ZONES,
} from "@/lib/constants";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/constants";

interface OverviewTabProps {
  deal: DealData;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

// Helper to convert readonly const arrays to SelectOption[]
function toOpts(
  arr: ReadonlyArray<{ value: string; label: string } | string>
): SelectOption[] {
  return arr.map((item) =>
    typeof item === "string"
      ? { value: item, label: cap(item) }
      : { value: item.value, label: item.label }
  );
}

export function OverviewTab({ deal, onSave }: OverviewTabProps) {
  const d = deal;
  const address =
    d.property_address ||
    [d.property_address_line1, d.property_city, d.property_state, d.property_zip]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="flex flex-col gap-4">
      {/* Loan Summary */}
      <SectionCard title="Loan Summary" icon={DollarSign}>
        <div className="flex flex-wrap gap-6">
          <EditableMetricCard
            label="Loan Amount"
            field="loan_amount"
            value={fmt(d.loan_amount)}
            rawValue={d.loan_amount}
            type="currency"
            onSave={onSave}
          />
          <EditableMetricCard
            label="Interest Rate"
            field="interest_rate"
            value={fP(d.interest_rate)}
            rawValue={d.interest_rate}
            type="percent"
            onSave={onSave}
          />
          <EditableMetricCard
            label="LTV"
            field="ltv"
            value={fP(d.ltv)}
            rawValue={d.ltv}
            type="percent"
            onSave={onSave}
          />
          <EditableMetricCard
            label="Term"
            field="loan_term_months"
            value={
              (d.loan_term_months || d.term_months)
                ? `${d.loan_term_months || d.term_months} mo`
                : "\u2014"
            }
            rawValue={d.loan_term_months ?? d.term_months}
            type="number"
            onSave={onSave}
          />
          <EditableMetricCard
            label="Points"
            field="points"
            value={fP(d.points ?? d.points_pct)}
            rawValue={d.points ?? d.points_pct}
            type="percent"
            onSave={onSave}
          />
        </div>
      </SectionCard>

      {/* Loan Details */}
      <SectionCard title="Loan Details" icon={FileText}>
        <div className="flex flex-wrap gap-x-5">
          <FieldRow half label="Loan Number" value={d.loan_number} mono />
          <EditableFieldRow
            half
            label="Type"
            field="type"
            value={d.type || d.loan_type}
            displayValue={cap(d.type || d.loan_type)}
            type="select"
            options={toOpts(LOAN_DB_TYPES)}
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Purpose"
            field="purpose"
            value={d.purpose || d.loan_purpose}
            displayValue={cap(d.purpose || d.loan_purpose)}
            type="select"
            options={toOpts(LOAN_PURPOSES)}
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Channel"
            field="funding_channel"
            value={d.funding_channel}
            displayValue={cap(d.funding_channel)}
            type="select"
            options={toOpts(FUNDING_CHANNELS)}
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Strategy"
            field="strategy"
            value={d.strategy || d.investment_strategy}
            displayValue={cap(d.strategy || d.investment_strategy)}
            type="select"
            options={toOpts(INVESTMENT_STRATEGIES)}
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Financing"
            field="financing"
            value={d.financing || d.deal_financing}
            displayValue={cap(d.financing || d.deal_financing)}
            type="select"
            options={toOpts(DEAL_FINANCING_OPTIONS)}
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Tranche"
            field="debt_tranche"
            value={d.debt_tranche}
            displayValue={cap(d.debt_tranche)}
            type="select"
            options={toOpts(DEBT_TRANCHES)}
            onSave={onSave}
          />
          <FieldRow
            half
            label="Programs"
            value={d.deal_programs?.join(", ")}
          />
        </div>
      </SectionCard>

      {/* Property */}
      <SectionCard title="Property" icon={Building2}>
        <div className="flex flex-wrap gap-x-5">
          <EditableFieldRow
            half
            label="Address Line 1"
            field="property_address_line1"
            value={d.property_address_line1}
            displayValue={d.property_address_line1 || "\u2014"}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="City"
            field="property_city"
            value={d.property_city}
            displayValue={d.property_city || "\u2014"}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="State"
            field="property_state"
            value={d.property_state}
            displayValue={d.property_state || "\u2014"}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="ZIP"
            field="property_zip"
            value={d.property_zip}
            displayValue={d.property_zip || "\u2014"}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Type"
            field="property_type"
            value={d.property_type}
            displayValue={cap(d.property_type)}
            type="select"
            options={PROPERTY_TYPE_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Units"
            field="property_units"
            value={d.property_units}
            mono
            type="number"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Occupancy"
            field="occupancy_pct"
            value={d.occupancy_pct}
            displayValue={fP(d.occupancy_pct)}
            mono
            type="percent"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Flood Zone"
            field="flood_zone"
            value={d.flood_zone}
            type="select"
            options={toOpts(FLOOD_ZONES)}
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Parcel ID"
            field="parcel_id"
            value={d.parcel_id}
            mono
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Lease Type"
            field="lease_type"
            value={d.lease_type}
            displayValue={cap(d.lease_type)}
            type="select"
            options={toOpts(LEASE_TYPES)}
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Rental Status"
            field="rental_status"
            value={d.rental_status}
            displayValue={cap(d.rental_status)}
            type="select"
            options={toOpts(RENTAL_STATUSES)}
            onSave={onSave}
          />
        </div>
      </SectionCard>

      {/* Financials */}
      <SectionCard title="Financials" icon={TrendingUp}>
        <div className="mb-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B8B8B] font-sans">
            Valuation
          </div>
          <div className="flex flex-wrap gap-x-5">
            <EditableFieldRow
              half
              label="Purchase Price"
              field="purchase_price"
              value={d.purchase_price}
              displayValue={fmt(d.purchase_price)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="As-Is Value"
              field="as_is_value"
              value={d.as_is_value}
              displayValue={fmt(d.as_is_value)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="ARV"
              field="arv"
              value={d.arv}
              displayValue={fmt(d.arv)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Appraised Value"
              field="appraised_value"
              value={d.appraised_value}
              displayValue={fmt(d.appraised_value)}
              mono
              type="currency"
              onSave={onSave}
            />
          </div>
        </div>
        <div className="mb-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B8B8B] font-sans">
            Economics
          </div>
          <div className="flex flex-wrap gap-x-5">
            <EditableFieldRow
              half
              label="Loan Amount"
              field="loan_amount"
              value={d.loan_amount}
              displayValue={fmt(d.loan_amount)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Total Loan"
              field="total_loan_amount"
              value={d.total_loan_amount}
              displayValue={fmt(d.total_loan_amount)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Interest Rate"
              field="interest_rate"
              value={d.interest_rate}
              displayValue={fP(d.interest_rate)}
              mono
              type="percent"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Default Rate"
              field="default_rate"
              value={d.default_rate}
              displayValue={fP(d.default_rate)}
              mono
              type="percent"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Points"
              field="points"
              value={d.points ?? d.points_pct}
              displayValue={fP(d.points ?? d.points_pct)}
              mono
              type="percent"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Origination Fee"
              field="origination_fee"
              value={d.origination_fee}
              displayValue={fmt(d.origination_fee)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Processing Fee"
              field="processing_fee"
              value={d.processing_fee}
              displayValue={fmt(d.processing_fee)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="UW Fee"
              field="underwriting_fee"
              value={d.underwriting_fee}
              displayValue={fmt(d.underwriting_fee)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Monthly Payment"
              field="monthly_payment"
              value={d.monthly_payment}
              displayValue={fmt(d.monthly_payment)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Reserves"
              field="reserves"
              value={d.reserves}
              displayValue={fmt(d.reserves)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Cash to Close"
              field="cash_to_close"
              value={d.cash_to_close}
              displayValue={fmt(d.cash_to_close)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Liquidity"
              field="liquidity"
              value={d.liquidity}
              displayValue={fmt(d.liquidity)}
              mono
              type="currency"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Net Worth"
              field="net_worth"
              value={d.net_worth}
              displayValue={fmt(d.net_worth)}
              mono
              type="currency"
              onSave={onSave}
            />
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B8B8B] font-sans">
            Prepayment & Extensions
          </div>
          <div className="flex flex-wrap gap-x-5">
            <EditableFieldRow
              half
              label="Prepay Type"
              field="prepayment_type"
              value={d.prepayment_type}
              displayValue={cap(d.prepayment_type)}
              type="select"
              options={toOpts(PREPAYMENT_PENALTY_TYPES)}
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Prepay %"
              field="prepayment_pct"
              value={d.prepayment_pct}
              displayValue={fP(d.prepayment_pct)}
              mono
              type="percent"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Extension"
              field="extension_option"
              value={d.extension_option}
              type="text"
              onSave={onSave}
            />
            <EditableFieldRow
              half
              label="Extension Fee"
              field="extension_fee_pct"
              value={d.extension_fee_pct}
              displayValue={fP(d.extension_fee_pct)}
              mono
              type="percent"
              onSave={onSave}
            />
          </div>
        </div>
      </SectionCard>

      {/* Borrower */}
      <SectionCard title="Borrower" icon={User}>
        <div className="flex flex-wrap gap-x-5">
          <FieldRow half label="Contact" value={d._borrower_name} link />
          <FieldRow half label="Entity" value={d._entity_name} link />
          <FieldRow
            half
            label="Guarantors"
            value={d.guarantor_ids?.length ? d.guarantor_ids.join(", ") : null}
          />
        </div>
      </SectionCard>

      {/* Third Parties */}
      <SectionCard title="Third Parties" icon={Users}>
        <div className="flex flex-wrap gap-x-5">
          <EditableFieldRow
            half
            label="Title Company"
            field="title_company"
            value={d.title_company}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Title Contact"
            field="title_contact"
            value={d.title_contact}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Title Phone"
            field="title_phone"
            value={d.title_phone}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Closing Attorney"
            field="closing_attorney"
            value={d.closing_attorney}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Insurance"
            field="insurance_company"
            value={d.insurance_company}
            type="text"
            onSave={onSave}
          />
        </div>
      </SectionCard>

      {/* Capital Stack */}
      <SectionCard title="Capital Stack" icon={Layers}>
        <div className="flex flex-wrap gap-x-5">
          <EditableFieldRow
            half
            label="Funding Source"
            field="funding_source"
            value={d.funding_source}
            displayValue={cap(d.funding_source)}
            type="text"
            onSave={onSave}
          />
          <EditableFieldRow
            half
            label="Capital Partner"
            field="capital_partner"
            value={d.capital_partner}
            type="text"
            onSave={onSave}
          />
        </div>
      </SectionCard>

      {/* Internal Notes */}
      <SectionCard title="Internal Notes" icon={Lock}>
        <EditableNotes
          label="Notes"
          field="notes"
          value={d.notes}
          onSave={onSave}
        />
        <div className="mt-3">
          <EditableNotes
            field="internal_notes"
            value={d.internal_notes}
            isInternal
            onSave={onSave}
          />
        </div>
        {!d.notes && !d.internal_notes && !onSave && (
          <div className="text-[13px] text-[#8B8B8B] font-sans">
            No notes.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
