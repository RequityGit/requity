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
  MetricCard,
  FieldRow,
  fmt,
  fP,
  cap,
  type DealData,
} from "../components";

interface OverviewTabProps {
  deal: DealData;
}

export function OverviewTab({ deal }: OverviewTabProps) {
  const d = deal;
  const address = d.property_address
    || [d.property_address_line1, d.property_city, d.property_state, d.property_zip]
      .filter(Boolean)
      .join(", ");

  return (
    <div className="flex flex-col gap-4">
      {/* Loan Summary */}
      <SectionCard title="Loan Summary" icon={DollarSign}>
        <div className="flex flex-wrap gap-6">
          <MetricCard label="Loan Amount" value={fmt(d.loan_amount)} />
          <MetricCard label="Interest Rate" value={fP(d.interest_rate)} />
          <MetricCard label="LTV" value={fP(d.ltv)} />
          <MetricCard
            label="Term"
            value={
              (d.loan_term_months || d.term_months)
                ? `${d.loan_term_months || d.term_months} mo`
                : "\u2014"
            }
          />
          <MetricCard
            label="Points"
            value={fP(d.points ?? d.points_pct)}
          />
        </div>
      </SectionCard>

      {/* Loan Details */}
      <SectionCard title="Loan Details" icon={FileText}>
        <div className="flex flex-wrap gap-x-5">
          <FieldRow half label="Loan Number" value={d.loan_number} mono />
          <FieldRow half label="Type" value={cap(d.type || d.loan_type)} />
          <FieldRow half label="Purpose" value={cap(d.purpose || d.loan_purpose)} />
          <FieldRow half label="Channel" value={cap(d.funding_channel)} />
          <FieldRow half label="Strategy" value={cap(d.strategy || d.investment_strategy)} />
          <FieldRow half label="Financing" value={cap(d.financing || d.deal_financing)} />
          <FieldRow half label="Tranche" value={cap(d.debt_tranche)} />
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
          <FieldRow half label="Address" value={address} />
          <FieldRow half label="Type" value={cap(d.property_type)} />
          <FieldRow half label="Units" value={d.property_units} mono />
          <FieldRow half label="Occupancy" value={fP(d.occupancy_pct)} mono />
          <FieldRow half label="Flood Zone" value={d.flood_zone} />
          <FieldRow half label="Parcel ID" value={d.parcel_id} mono />
          <FieldRow half label="Lease Type" value={cap(d.lease_type)} />
          <FieldRow half label="Rental Status" value={cap(d.rental_status)} />
        </div>
      </SectionCard>

      {/* Financials */}
      <SectionCard title="Financials" icon={TrendingUp}>
        <div className="mb-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B8B8B] font-sans">
            Valuation
          </div>
          <div className="flex flex-wrap gap-x-5">
            <FieldRow half label="Purchase Price" value={fmt(d.purchase_price)} mono />
            <FieldRow half label="As-Is Value" value={fmt(d.as_is_value)} mono />
            <FieldRow half label="ARV" value={fmt(d.arv)} mono />
            <FieldRow half label="Appraised Value" value={fmt(d.appraised_value)} mono />
          </div>
        </div>
        <div className="mb-4">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B8B8B] font-sans">
            Economics
          </div>
          <div className="flex flex-wrap gap-x-5">
            <FieldRow half label="Loan Amount" value={fmt(d.loan_amount)} mono />
            <FieldRow half label="Total Loan" value={fmt(d.total_loan_amount)} mono />
            <FieldRow half label="Interest Rate" value={fP(d.interest_rate)} mono />
            <FieldRow half label="Default Rate" value={fP(d.default_rate)} mono />
            <FieldRow half label="Points" value={fP(d.points ?? d.points_pct)} mono />
            <FieldRow half label="Origination Fee" value={fmt(d.origination_fee)} mono />
            <FieldRow half label="Processing Fee" value={fmt(d.processing_fee)} mono />
            <FieldRow half label="UW Fee" value={fmt(d.underwriting_fee)} mono />
            <FieldRow half label="Monthly Payment" value={fmt(d.monthly_payment)} mono />
            <FieldRow half label="Reserves" value={fmt(d.reserves)} mono />
            <FieldRow half label="Cash to Close" value={fmt(d.cash_to_close)} mono />
            <FieldRow half label="Liquidity" value={fmt(d.liquidity)} mono />
            <FieldRow half label="Net Worth" value={fmt(d.net_worth)} mono />
          </div>
        </div>
        <div>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-[#8B8B8B] font-sans">
            Prepayment & Extensions
          </div>
          <div className="flex flex-wrap gap-x-5">
            <FieldRow half label="Prepay Type" value={cap(d.prepayment_type)} />
            <FieldRow half label="Prepay %" value={fP(d.prepayment_pct)} mono />
            <FieldRow half label="Extension" value={d.extension_option} />
            <FieldRow half label="Extension Fee" value={fP(d.extension_fee_pct)} mono />
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
          <FieldRow half label="Title Company" value={d.title_company} />
          <FieldRow half label="Title Contact" value={d.title_contact} />
          <FieldRow half label="Title Phone" value={d.title_phone} />
          <FieldRow half label="Closing Attorney" value={d.closing_attorney} />
          <FieldRow half label="Insurance" value={d.insurance_company} />
        </div>
      </SectionCard>

      {/* Capital Stack */}
      <SectionCard title="Capital Stack" icon={Layers}>
        <div className="flex flex-wrap gap-x-5">
          <FieldRow half label="Funding Source" value={cap(d.funding_source)} />
          <FieldRow half label="Capital Partner" value={d.capital_partner} />
        </div>
      </SectionCard>

      {/* Internal Notes */}
      <SectionCard title="Internal Notes" icon={Lock}>
        {d.notes && (
          <div className="mb-3 text-[13px] leading-relaxed text-[#1A1A1A] font-sans">
            {d.notes}
          </div>
        )}
        {d.internal_notes && (
          <div
            className="rounded-lg p-3"
            style={{
              background: "#E5930E08",
              border: "1px solid #E5930E20",
            }}
          >
            <div className="mb-1 text-[11px] font-semibold text-[#E5930E] font-sans">
              INTERNAL ONLY
            </div>
            <div className="text-[13px] leading-relaxed text-[#1A1A1A] font-sans">
              {d.internal_notes}
            </div>
          </div>
        )}
        {!d.notes && !d.internal_notes && (
          <div className="text-[13px] text-[#8B8B8B] font-sans">
            No notes.
          </div>
        )}
      </SectionCard>
    </div>
  );
}
