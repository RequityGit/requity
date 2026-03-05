"use client";

import {
  FileText,
  Building2,
  Shield,
} from "lucide-react";
import {
  SectionCard,
  FieldRow,
  fmt,
  fP,
  cap,
  type DealData,
} from "../components";

interface OverviewTabProps {
  deal: DealData;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
}

export function OverviewTab({ deal }: OverviewTabProps) {
  const d = deal;

  return (
    <div className="flex flex-col gap-4">
      {/* Loan Details */}
      <SectionCard title="Loan Details" icon={FileText}>
        <div className="grid grid-cols-2 gap-x-8">
          <FieldRow label="Loan Number" value={d.loan_number} mono />
          <FieldRow label="Type" value={cap(d.type || d.loan_type)} />
          <FieldRow label="Purpose" value={cap(d.purpose || d.loan_purpose)} />
          <FieldRow label="Channel" value={cap(d.funding_channel)} />
          <FieldRow label="Strategy" value={cap(d.strategy || d.investment_strategy)} />
          <FieldRow label="Financing" value={cap(d.financing || d.deal_financing)} />
          <FieldRow label="Tranche" value={cap(d.debt_tranche)} />
          <FieldRow label="Programs" value={d.deal_programs?.join(", ")} />
        </div>
      </SectionCard>

      {/* Property */}
      <SectionCard title="Property" icon={Building2}>
        <div className="grid grid-cols-2 gap-x-8">
          <FieldRow label="Address" value={d.property_address_line1 || d.property_address?.split(",")[0]} />
          <FieldRow label="City / State" value={
            [d.property_city, d.property_state].filter(Boolean).join(", ") || null
          } />
          <FieldRow label="Property Type" value={cap(d.property_type)} />
          <FieldRow label="Units" value={d.property_units ?? d.number_of_units} mono />
          <FieldRow label="Year Built" value={d._property_year_built} mono />
          <FieldRow label="Sq Ft" value={d._property_sqft ? d._property_sqft.toLocaleString() : null} mono />
          <FieldRow label="Appraised Value" value={fmt(d.appraised_value)} mono />
          <FieldRow label="Purchase Price" value={fmt(d.purchase_price)} mono />
        </div>
      </SectionCard>

      {/* Borrower Entity */}
      <SectionCard title="Borrower Entity" icon={Shield}>
        <div className="grid grid-cols-2 gap-x-8">
          <FieldRow label="Entity Name" value={d._entity_name} />
          <FieldRow label="Entity Type" value={cap(d._entity_type)} />
          <FieldRow label="Guarantor" value={d._borrower_name} />
          <FieldRow label="FICO" value={d._borrower_credit_score} mono />
          <FieldRow label="Liquidity" value={fmt(d._borrower_liquidity)} mono />
          <FieldRow label="Experience" value={
            d._borrower_experience != null ? `${d._borrower_experience} properties` : null
          } />
        </div>
      </SectionCard>
    </div>
  );
}
