"use client";

import { useState } from "react";
import {
  FileText,
  Building2,
  Shield,
  Pencil,
} from "lucide-react";
import {
  SectionCard,
  fmt,
  fP,
  cap,
  T,
  type DealData,
} from "../components";
import { EditableFieldRow } from "../EditableFieldRow";
import type { SelectOption } from "../EditableFieldRow";
import { EditSectionDialog, type SectionField } from "../EditSectionDialog";
import {
  LOAN_DB_TYPES,
  LOAN_PURPOSES,
  FUNDING_CHANNELS,
  INVESTMENT_STRATEGIES,
  DEBT_TRANCHES,
} from "@/lib/constants";
import { PROPERTY_TYPE_OPTIONS } from "@/lib/constants";

interface OverviewTabProps {
  deal: DealData;
  onSave?: (field: string, value: string | number | null) => Promise<boolean>;
  onSaveRelated?: (
    table: string,
    id: string,
    field: string,
    value: string | number | null
  ) => Promise<boolean>;
}

// Helper to convert const arrays to SelectOption[]
function toOptions(
  arr: readonly { value: string; label: string }[]
): SelectOption[] {
  return arr.map((i) => ({ value: i.value, label: i.label }));
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors cursor-pointer border-0"
      style={{
        color: T.text.muted,
        backgroundColor: "transparent",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = T.bg.hover;
        e.currentTarget.style.color = T.text.primary;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = T.text.muted;
      }}
    >
      <Pencil size={12} strokeWidth={1.5} />
      Edit
    </button>
  );
}

const ENTITY_TYPE_OPTIONS: SelectOption[] = [
  { value: "llc", label: "LLC" },
  { value: "corporation", label: "Corporation" },
  { value: "partnership", label: "Partnership" },
  { value: "trust", label: "Trust" },
  { value: "individual", label: "Individual" },
  { value: "other", label: "Other" },
];

export function OverviewTab({ deal, onSave, onSaveRelated }: OverviewTabProps) {
  const d = deal;
  const isEditable = Boolean(onSave);

  const [editLoanOpen, setEditLoanOpen] = useState(false);
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editBorrowerOpen, setEditBorrowerOpen] = useState(false);

  const loanFields: SectionField[] = [
    { label: "Loan Number", fieldName: "loan_number", fieldType: "readonly", value: d.loan_number },
    { label: "Type", fieldName: "type", fieldType: "select", options: toOptions(LOAN_DB_TYPES), value: d.type || d.loan_type },
    { label: "Loan Amount", fieldName: "loan_amount", fieldType: "currency", value: d.loan_amount },
    { label: "Rate", fieldName: "interest_rate", fieldType: "percent", value: d.interest_rate },
    { label: "Purpose", fieldName: "purpose", fieldType: "select", options: toOptions(LOAN_PURPOSES), value: d.purpose || d.loan_purpose },
    { label: "Channel", fieldName: "funding_channel", fieldType: "select", options: toOptions(FUNDING_CHANNELS), value: d.funding_channel },
    { label: "Strategy", fieldName: "strategy", fieldType: "select", options: toOptions(INVESTMENT_STRATEGIES), value: d.strategy || d.investment_strategy },
    { label: "Programs", fieldName: "deal_programs", fieldType: "text", value: d.deal_programs?.join(", ") },
    { label: "Tranche", fieldName: "debt_tranche", fieldType: "select", options: toOptions(DEBT_TRANCHES), value: d.debt_tranche },
    { label: "LTV", fieldName: "ltv", fieldType: "percent", value: d.ltv },
    { label: "DSCR", fieldName: "dscr_ratio", fieldType: "number", value: d.dscr_ratio },
    { label: "Term", fieldName: "loan_term_months", fieldType: "number", value: d.loan_term_months || d.term_months },
    { label: "Points", fieldName: "points", fieldType: "percent", value: d.points ?? d.points_pct },
  ];

  const propertyFields: SectionField[] = [
    { label: "Address", fieldName: "property_address_line1", fieldType: "text", value: d.property_address_line1 || d.property_address?.split(",")[0] },
    { label: "City", fieldName: "property_city", fieldType: "text", value: d.property_city },
    { label: "State", fieldName: "property_state", fieldType: "text", value: d.property_state },
    { label: "Zip", fieldName: "property_zip", fieldType: "text", value: d.property_zip },
    { label: "Property Type", fieldName: "property_type", fieldType: "select", options: PROPERTY_TYPE_OPTIONS as unknown as SelectOption[], value: d.property_type },
    { label: "Units", fieldName: "property_units", fieldType: "number", value: d.property_units ?? d.number_of_units },
    { label: "Year Built", fieldName: "_property_year_built", fieldType: "number", value: d._property_year_built },
    { label: "Sq Ft", fieldName: "_property_sqft", fieldType: "number", value: d._property_sqft },
    { label: "Appraised Value", fieldName: "appraised_value", fieldType: "currency", value: d.appraised_value },
    { label: "Purchase Price", fieldName: "purchase_price", fieldType: "currency", value: d.purchase_price },
  ];

  const borrowerFields: SectionField[] = [
    {
      label: "Entity Name", fieldName: "entity_name", fieldType: "text", value: d._entity_name,
      relatedTable: "borrower_entities", relatedId: d.borrower_entity_id,
    },
    {
      label: "Entity Type", fieldName: "entity_type", fieldType: "select", options: ENTITY_TYPE_OPTIONS, value: d._entity_type,
      relatedTable: "borrower_entities", relatedId: d.borrower_entity_id,
    },
    {
      label: "Guarantor", fieldName: "first_name", fieldType: "text", value: d._borrower_name,
      relatedTable: "borrowers", relatedId: d.borrower_id,
    },
    {
      label: "FICO", fieldName: "credit_score", fieldType: "number", value: d._borrower_credit_score,
      relatedTable: "borrowers", relatedId: d.borrower_id,
    },
    {
      label: "Liquidity", fieldName: "verified_liquidity", fieldType: "currency", value: d._borrower_liquidity,
      relatedTable: "borrowers", relatedId: d.borrower_id,
    },
    {
      label: "Experience", fieldName: "experience_count", fieldType: "number", value: d._borrower_experience,
      relatedTable: "borrowers", relatedId: d.borrower_id,
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Loan Details */}
      <SectionCard
        title="Loan Details"
        icon={FileText}
        right={isEditable ? <EditButton onClick={() => setEditLoanOpen(true)} /> : undefined}
      >
        <div className="grid grid-cols-2 gap-x-8">
          <EditableFieldRow
            label="Loan Number"
            value={d.loan_number}
            fieldName="loan_number"
            mono
          />
          <EditableFieldRow
            label="Type"
            value={d.type || d.loan_type}
            displayValue={cap(d.type || d.loan_type)}
            fieldName="type"
            fieldType="select"
            options={toOptions(LOAN_DB_TYPES)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Loan Amount"
            value={d.loan_amount}
            displayValue={fmt(d.loan_amount)}
            fieldName="loan_amount"
            fieldType="currency"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Rate"
            value={d.interest_rate}
            displayValue={fP(d.interest_rate)}
            fieldName="interest_rate"
            fieldType="percent"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Purpose"
            value={d.purpose || d.loan_purpose}
            displayValue={cap(d.purpose || d.loan_purpose)}
            fieldName="purpose"
            fieldType="select"
            options={toOptions(LOAN_PURPOSES)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Channel"
            value={d.funding_channel}
            displayValue={cap(d.funding_channel)}
            fieldName="funding_channel"
            fieldType="select"
            options={toOptions(FUNDING_CHANNELS)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Strategy"
            value={d.strategy || d.investment_strategy}
            displayValue={cap(d.strategy || d.investment_strategy)}
            fieldName="strategy"
            fieldType="select"
            options={toOptions(INVESTMENT_STRATEGIES)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Programs"
            value={d.deal_programs?.join(", ")}
            fieldName="deal_programs"
            onSave={onSave}
          />
          <EditableFieldRow
            label="Tranche"
            value={d.debt_tranche}
            displayValue={cap(d.debt_tranche)}
            fieldName="debt_tranche"
            fieldType="select"
            options={toOptions(DEBT_TRANCHES)}
            onSave={onSave}
          />
          <EditableFieldRow
            label="LTV"
            value={d.ltv}
            displayValue={fP(d.ltv)}
            fieldName="ltv"
            fieldType="percent"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="DSCR"
            value={d.dscr_ratio}
            displayValue={d.dscr_ratio != null ? Number(d.dscr_ratio).toFixed(2) : null}
            fieldName="dscr_ratio"
            fieldType="number"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Term"
            value={d.loan_term_months || d.term_months}
            displayValue={d.loan_term_months || d.term_months ? `${d.loan_term_months || d.term_months} mo` : null}
            fieldName="loan_term_months"
            fieldType="number"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Points"
            value={d.points ?? d.points_pct}
            displayValue={fP(d.points ?? d.points_pct)}
            fieldName="points"
            fieldType="percent"
            mono
            onSave={onSave}
          />
        </div>
      </SectionCard>

      {/* Property */}
      <SectionCard
        title="Property"
        icon={Building2}
        right={isEditable ? <EditButton onClick={() => setEditPropertyOpen(true)} /> : undefined}
      >
        <div className="grid grid-cols-2 gap-x-8">
          <EditableFieldRow
            label="Address"
            value={d.property_address_line1 || d.property_address?.split(",")[0]}
            fieldName="property_address_line1"
            onSave={onSave}
          />
          <EditableFieldRow
            label="City"
            value={d.property_city}
            fieldName="property_city"
            onSave={onSave}
          />
          <EditableFieldRow
            label="State"
            value={d.property_state}
            fieldName="property_state"
            onSave={onSave}
          />
          <EditableFieldRow
            label="Zip"
            value={d.property_zip}
            fieldName="property_zip"
            onSave={onSave}
          />
          <EditableFieldRow
            label="Property Type"
            value={d.property_type}
            displayValue={cap(d.property_type)}
            fieldName="property_type"
            fieldType="select"
            options={PROPERTY_TYPE_OPTIONS as unknown as SelectOption[]}
            onSave={onSave}
          />
          <EditableFieldRow
            label="Units"
            value={d.property_units ?? d.number_of_units}
            fieldName="property_units"
            fieldType="number"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Year Built"
            value={d._property_year_built}
            fieldName="_property_year_built"
            fieldType="number"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Sq Ft"
            value={d._property_sqft}
            displayValue={d._property_sqft ? Number(d._property_sqft).toLocaleString() : null}
            fieldName="_property_sqft"
            fieldType="number"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Appraised Value"
            value={d.appraised_value}
            displayValue={fmt(d.appraised_value)}
            fieldName="appraised_value"
            fieldType="currency"
            mono
            onSave={onSave}
          />
          <EditableFieldRow
            label="Purchase Price"
            value={d.purchase_price}
            displayValue={fmt(d.purchase_price)}
            fieldName="purchase_price"
            fieldType="currency"
            mono
            onSave={onSave}
          />
        </div>
      </SectionCard>

      {/* Borrower Entity */}
      <SectionCard
        title="Borrower Entity"
        icon={Shield}
        right={isEditable ? <EditButton onClick={() => setEditBorrowerOpen(true)} /> : undefined}
      >
        <div className="grid grid-cols-2 gap-x-8">
          <EditableFieldRow
            label="Entity Name"
            value={d._entity_name}
            fieldName="entity_name"
            relatedTable="borrower_entities"
            relatedId={d.borrower_entity_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="Entity Type"
            value={d._entity_type}
            displayValue={cap(d._entity_type)}
            fieldName="entity_type"
            fieldType="select"
            options={ENTITY_TYPE_OPTIONS}
            relatedTable="borrower_entities"
            relatedId={d.borrower_entity_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="Guarantor"
            value={d._borrower_name}
            fieldName="first_name"
            relatedTable="borrowers"
            relatedId={d.borrower_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="FICO"
            value={d._borrower_credit_score}
            fieldName="credit_score"
            fieldType="number"
            mono
            relatedTable="borrowers"
            relatedId={d.borrower_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="Liquidity"
            value={d._borrower_liquidity}
            displayValue={fmt(d._borrower_liquidity)}
            fieldName="verified_liquidity"
            fieldType="currency"
            mono
            relatedTable="borrowers"
            relatedId={d.borrower_id}
            onSaveRelated={onSaveRelated}
          />
          <EditableFieldRow
            label="Experience"
            value={d._borrower_experience}
            displayValue={
              d._borrower_experience != null
                ? `${d._borrower_experience} properties`
                : null
            }
            fieldName="experience_count"
            fieldType="number"
            relatedTable="borrowers"
            relatedId={d.borrower_id}
            onSaveRelated={onSaveRelated}
          />
        </div>
      </SectionCard>

      {/* Edit Dialogs */}
      {isEditable && (
        <>
          <EditSectionDialog
            open={editLoanOpen}
            onOpenChange={setEditLoanOpen}
            title="Loan Details"
            fields={loanFields}
            onSave={onSave}
          />
          <EditSectionDialog
            open={editPropertyOpen}
            onOpenChange={setEditPropertyOpen}
            title="Property"
            fields={propertyFields}
            onSave={onSave}
          />
          <EditSectionDialog
            open={editBorrowerOpen}
            onOpenChange={setEditBorrowerOpen}
            title="Borrower Entity"
            fields={borrowerFields}
            onSave={onSave}
            onSaveRelated={onSaveRelated}
          />
        </>
      )}
    </div>
  );
}
