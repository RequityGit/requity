"use client";

import { useState, useMemo } from "react";
import {
  FileText,
  Building2,
  Shield,
  Pencil,
} from "lucide-react";
import {
  SectionCard,
  FieldRow,
  fmt,
  fP,
  cap,
  T,
  type DealData,
} from "../components";
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
import { useFieldConfigurations, type FieldConfigEntry } from "@/hooks/useFieldConfigurations";
import { DynamicField } from "@/components/shared/DynamicField";

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

// Read-only display props per field_key
interface FieldDisplayProps {
  label: string;
  value: string | number | null | undefined;
  displayValue?: string | null;
  mono?: boolean;
}

function buildLoanDisplayMap(d: DealData): Record<string, FieldDisplayProps> {
  return {
    loan_number: { label: "Loan Number", value: d.loan_number, mono: true },
    type: { label: "Type", value: d.type || d.loan_type, displayValue: cap(d.type || d.loan_type) },
    loan_amount: { label: "Loan Amount", value: d.loan_amount, displayValue: fmt(d.loan_amount), mono: true },
    interest_rate: { label: "Rate", value: d.interest_rate, displayValue: fP(d.interest_rate), mono: true },
    purpose: { label: "Purpose", value: d.purpose || d.loan_purpose, displayValue: cap(d.purpose || d.loan_purpose) },
    funding_channel: { label: "Channel", value: d.funding_channel, displayValue: cap(d.funding_channel) },
    strategy: { label: "Strategy", value: d.strategy || d.investment_strategy, displayValue: cap(d.strategy || d.investment_strategy) },
    deal_programs: { label: "Programs", value: d.deal_programs?.join(", ") },
    debt_tranche: { label: "Tranche", value: d.debt_tranche, displayValue: cap(d.debt_tranche) },
    ltv: { label: "LTV", value: d.ltv, displayValue: fP(d.ltv), mono: true },
    dscr_ratio: { label: "DSCR", value: d.dscr_ratio, displayValue: d.dscr_ratio != null ? Number(d.dscr_ratio).toFixed(2) : null, mono: true },
    loan_term_months: { label: "Term", value: d.loan_term_months || d.term_months, displayValue: (d.loan_term_months || d.term_months) ? `${d.loan_term_months || d.term_months} mo` : null, mono: true },
    points: { label: "Points", value: d.points ?? d.points_pct, displayValue: fP(d.points ?? d.points_pct), mono: true },
  };
}

function buildPropertyDisplayMap(d: DealData): Record<string, FieldDisplayProps> {
  return {
    property_address_line1: { label: "Address", value: d.property_address_line1 || d.property_address?.split(",")[0] },
    property_city: { label: "City", value: d.property_city },
    property_state: { label: "State", value: d.property_state },
    property_zip: { label: "Zip", value: d.property_zip },
    property_type: { label: "Property Type", value: d.property_type, displayValue: cap(d.property_type) },
    property_units: { label: "Units", value: d.property_units ?? d.number_of_units, mono: true },
    _property_year_built: { label: "Year Built", value: d._property_year_built, mono: true },
    _property_sqft: { label: "Sq Ft", value: d._property_sqft, displayValue: d._property_sqft ? Number(d._property_sqft).toLocaleString() : null, mono: true },
    appraised_value: { label: "Appraised Value", value: d.appraised_value, displayValue: fmt(d.appraised_value), mono: true },
    purchase_price: { label: "Purchase Price", value: d.purchase_price, displayValue: fmt(d.purchase_price), mono: true },
  };
}

function buildBorrowerDisplayMap(d: DealData): Record<string, FieldDisplayProps> {
  return {
    entity_name: { label: "Entity Name", value: d._entity_name },
    entity_type: { label: "Entity Type", value: d._entity_type, displayValue: cap(d._entity_type) },
    first_name: { label: "Guarantor", value: d._borrower_name },
    credit_score: { label: "FICO", value: d._borrower_credit_score, mono: true },
    verified_liquidity: { label: "Liquidity", value: d._borrower_liquidity, displayValue: fmt(d._borrower_liquidity), mono: true },
    experience_count: { label: "Experience", value: d._borrower_experience, displayValue: d._borrower_experience != null ? `${d._borrower_experience} properties` : null },
  };
}

/** Interleave left and right column fields for a CSS grid-cols-2 layout */
function interleaveFields(
  leftFields: FieldConfigEntry[],
  rightFields: FieldConfigEntry[]
): FieldConfigEntry[] {
  const result: FieldConfigEntry[] = [];
  const maxLen = Math.max(leftFields.length, rightFields.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < leftFields.length) result.push(leftFields[i]);
    else result.push({ id: `empty-left-${i}`, module: "", field_key: `__empty_left_${i}`, field_label: "", field_type: "", column_position: "left", display_order: i, is_visible: false, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false });
    if (i < rightFields.length) result.push(rightFields[i]);
    else result.push({ id: `empty-right-${i}`, module: "", field_key: `__empty_right_${i}`, field_label: "", field_type: "", column_position: "right", display_order: i, is_visible: false, is_locked: false, is_admin_created: false, dropdown_options: null, is_archived: false });
  }
  return result;
}

function ReadOnlyConfiguredSection({
  module,
  displayMap,
  deal,
}: {
  module: string;
  displayMap: Record<string, FieldDisplayProps>;
  deal?: DealData;
}) {
  const { leftFields, rightFields, isLoading } = useFieldConfigurations(module);

  const ordered = useMemo(
    () => interleaveFields(leftFields, rightFields),
    [leftFields, rightFields]
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-x-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="py-[7px]" style={{ borderBottom: `1px solid ${T.bg.borderSubtle}` }}>
            <div className="h-4 w-24 rounded bg-muted animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-8">
      {ordered.map((cfg) => {
        if (cfg.field_key.startsWith("__empty_")) {
          return <div key={cfg.id} />;
        }

        // Admin-created fields: render read-only display
        if (cfg.is_admin_created && deal) {
          const dealRecord = deal as unknown as Record<string, unknown>;
          const currentValue = dealRecord[cfg.field_key] ?? null;
          const displayVal = currentValue != null && currentValue !== "" ? String(currentValue) : null;
          return (
            <FieldRow
              key={cfg.field_key}
              label={cfg.field_label}
              value={displayVal}
            />
          );
        }

        // System fields: render read-only FieldRow
        const props = displayMap[cfg.field_key];
        if (!props) return null;
        return (
          <FieldRow
            key={cfg.field_key}
            label={cfg.field_label || props.label}
            value={props.displayValue ?? props.value}
            mono={props.mono}
          />
        );
      })}
    </div>
  );
}

export function OverviewTab({ deal, onSave, onSaveRelated }: OverviewTabProps) {
  const d = deal;
  const isEditable = Boolean(onSave);

  const [editLoanOpen, setEditLoanOpen] = useState(false);
  const [editPropertyOpen, setEditPropertyOpen] = useState(false);
  const [editBorrowerOpen, setEditBorrowerOpen] = useState(false);

  const loanDisplayMap = useMemo(() => buildLoanDisplayMap(d), [d]);
  const propertyDisplayMap = useMemo(() => buildPropertyDisplayMap(d), [d]);
  const borrowerDisplayMap = useMemo(() => buildBorrowerDisplayMap(d), [d]);

  // Dialog fields for the edit dialog
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
        <ReadOnlyConfiguredSection module="loan_details" displayMap={loanDisplayMap} deal={d} />
      </SectionCard>

      {/* Property */}
      <SectionCard
        title="Property"
        icon={Building2}
        right={isEditable ? <EditButton onClick={() => setEditPropertyOpen(true)} /> : undefined}
      >
        <ReadOnlyConfiguredSection module="property" displayMap={propertyDisplayMap} deal={d} />
      </SectionCard>

      {/* Borrower Entity */}
      <SectionCard
        title="Borrower Entity"
        icon={Shield}
        right={isEditable ? <EditButton onClick={() => setEditBorrowerOpen(true)} /> : undefined}
      >
        <ReadOnlyConfiguredSection module="borrower_entity" displayMap={borrowerDisplayMap} deal={d} />
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
