"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import {
  FieldRow,
  MonoValue,
} from "./contact-360/contact-detail-shared";
import type {
  CrmSectionField,
  CrmFieldType,
} from "@/components/crm/crm-edit-section-dialog";
import { formatCurrency, formatDate, formatPhoneNumber, formatPhoneInput } from "@/lib/format";
import { CRM_COMPANY_TYPES, CRM_COMPANY_SUBTYPES } from "@/lib/constants";
import type { FieldLayout } from "./contact-360/types";

// --- Field key → object property mapping for mismatches ---
export const FIELD_KEY_TO_PROP: Record<string, string> = {
  ssn_last4: "ssn_last_four",
  company_type: "company_types",
  subtype: "company_subtype",
  legal_name: "name",
  dba_names: "other_names",
  is_title_co_verified: "title_company_verified",
};

// --- Dropdown option fallbacks for built-in fields not yet stored in DB ---
export const DROPDOWN_FALLBACKS: Record<string, { label: string; value: string }[]> = {
  lifecycle_stage: [
    { label: "Uncontacted", value: "uncontacted" },
    { label: "Prospect", value: "prospect" },
    { label: "Active", value: "active" },
    { label: "Past", value: "past" },
  ],
  status: [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
    { label: "Converted", value: "converted" },
    { label: "Lost", value: "lost" },
    { label: "Do Not Contact", value: "do_not_contact" },
  ],
  source: [
    { label: "Website", value: "website" },
    { label: "Referral", value: "referral" },
    { label: "Cold Call", value: "cold_call" },
    { label: "Email Campaign", value: "email_campaign" },
    { label: "Social Media", value: "social_media" },
    { label: "Event", value: "event" },
    { label: "Paid Ad", value: "paid_ad" },
    { label: "Organic", value: "organic" },
    { label: "Broker", value: "broker" },
    { label: "Repeat Client", value: "repeat_client" },
    { label: "Other", value: "other" },
  ],
  marital_status: [
    { label: "Single", value: "single" },
    { label: "Married", value: "married" },
    { label: "Divorced", value: "divorced" },
    { label: "Widowed", value: "widowed" },
    { label: "Separated", value: "separated" },
  ],
  accreditation_status: [
    { label: "Pending", value: "pending" },
    { label: "Verified", value: "verified" },
    { label: "Expired", value: "expired" },
    { label: "Not Accredited", value: "not_accredited" },
  ],
  company_type: CRM_COMPANY_TYPES.map((t) => ({ label: t.label, value: t.value })),
  subtype: CRM_COMPANY_SUBTYPES.map((t) => ({ label: t.label, value: t.value })),
};

// --- field_type → CrmFieldType mapping for edit dialogs ---
export const FC_TYPE_TO_CRM: Record<string, CrmFieldType> = {
  text: "text",
  email: "text",
  phone: "text",
  number: "number",
  currency: "currency",
  date: "date",
  boolean: "boolean",
  dropdown: "select",
  percentage: "number",
  team_member: "select",
  company: "select",
  relationship: "select",
};

// --- Per-field type overrides (when DB field_type doesn't match UI control) ---
const FIELD_TYPE_OVERRIDES: Record<string, CrmFieldType> = {
  company_type: "multi_select",
};

// --- Custom renderers for fields with special display logic ---
function renderCreditScore(val: unknown): ReactNode {
  if (val == null) return undefined;
  const score = val as number;
  const color = score >= 740 ? "#22A861" : score >= 680 ? "#E5930E" : "#E5453D";
  return <span style={{ color }}>{score}</span>;
}

function renderAccreditationStatus(val: unknown): ReactNode {
  if (!val) return undefined;
  const status = val as string;
  const isVerified = status === "verified";
  const color = isVerified ? "#22A861" : "#E5930E";
  return (
    <Badge
      variant="outline"
      className="text-[11px] gap-1"
      style={{
        color,
        borderColor: `${color}30`,
        backgroundColor: `${color}08`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
      />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

function renderSsnLast4(val: unknown, isSuperAdmin: boolean): ReactNode | null {
  if (!isSuperAdmin) return null; // null signals "skip this field"
  if (!val) return "—";
  return <MonoValue>{`●●●-●●-${val}`}</MonoValue>;
}

function renderExperienceCount(val: unknown): ReactNode {
  if (val == null || val === 0) return undefined;
  return `${val} transaction${val === 1 ? "" : "s"}`;
}

// Map of field_key → custom render function
// Returns undefined for "show dash", null for "skip entirely"
export type FieldRenderer = (val: unknown, isSuperAdmin: boolean, dataObj?: Record<string, unknown>) => ReactNode | null;
export const FIELD_RENDERERS: Record<string, FieldRenderer> = {
  credit_score: (v) => renderCreditScore(v),
  accreditation_status: (v) => renderAccreditationStatus(v),
  ssn_last4: (v, sa) => renderSsnLast4(v, sa),
  experience_count: (v) => renderExperienceCount(v),
  phone: (v) => formatPhoneNumber(v as string | null),
  // UUID FK fields: show resolved display name instead of raw UUID
  assigned_to: (_v, _sa, dataObj) => {
    const display = dataObj?.assigned_to_display as string | undefined;
    return display || undefined;
  },
  company_id: (_v, _sa, dataObj) => {
    const display = dataObj?.company_id_display as string | undefined;
    return display || undefined;
  },
};

// --- Render a single field, returning null to skip ---
export function renderField(
  f: FieldLayout,
  dataObj: Record<string, unknown>,
  isSuperAdmin: boolean,
): ReactNode {
  const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
  const rawValue = dataObj[propKey];

  // Check for custom renderer
  const customRender = FIELD_RENDERERS[f.field_key];
  if (customRender) {
    const rendered = customRender(rawValue, isSuperAdmin, dataObj);
    if (rendered === null) return null; // skip field
    return (
      <FieldRow
        key={f.field_key}
        label={f.field_label}
        value={rendered}
        mono={f.field_type === "currency"}
      />
    );
  }

  // Standard rendering by field_type
  let displayValue: ReactNode;
  switch (f.field_type) {
    case "currency":
      displayValue = formatCurrency(rawValue as number | null);
      break;
    case "date":
      displayValue = formatDate(rawValue as string | null);
      break;
    case "boolean":
      displayValue = rawValue != null ? (rawValue ? "Yes" : "No") : undefined;
      break;
    case "dropdown":
      displayValue = rawValue
        ? String(rawValue).charAt(0).toUpperCase() + String(rawValue).slice(1).replace(/_/g, " ")
        : undefined;
      break;
    default:
      displayValue = rawValue != null ? String(rawValue) : undefined;
  }

  return (
    <FieldRow
      key={f.field_key}
      label={f.field_label}
      value={displayValue}
      mono={f.field_type === "currency"}
    />
  );
}

// --- Dynamic field rendering helper ---
export function renderDynamicFields(
  fields: FieldLayout[],
  dataObj: Record<string, unknown>,
  isSuperAdmin: boolean,
): ReactNode {
  const visible = fields.filter((f) => f.is_visible);

  // Split into left/right columns and sort each by display_order
  const leftFields = visible
    .filter((f) => f.column_position === "left")
    .sort((a, b) => a.display_order - b.display_order);
  const rightFields = visible
    .filter((f) => f.column_position === "right")
    .sort((a, b) => a.display_order - b.display_order);

  // If no column_position data, fall back to sequential auto-flow
  if (leftFields.length === 0 && rightFields.length === 0) {
    const sorted = visible.sort((a, b) => a.display_order - b.display_order);
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
        {sorted.map((f) => renderField(f, dataObj, isSuperAdmin))}
      </div>
    );
  }

  // Pair left[i] with right[i] row by row
  const rowCount = Math.max(leftFields.length, rightFields.length);
  const rows: ReactNode[] = [];
  for (let i = 0; i < rowCount; i++) {
    const left = leftFields[i];
    const right = rightFields[i];
    rows.push(
      <div key={`row-${i}`} className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
        {left ? renderField(left, dataObj, isSuperAdmin) : <div />}
        {right ? renderField(right, dataObj, isSuperAdmin) : <div />}
      </div>
    );
  }

  return <div>{rows}</div>;
}

// --- Build edit dialog fields from layout data ---
export function buildEditFields(
  fields: FieldLayout[],
  dataObj: Record<string, unknown>,
  isSuperAdmin: boolean,
): CrmSectionField[] {
  return fields
    .filter((f) => f.is_visible)
    .filter((f) => {
      if (f.field_key === "ssn_last4" && !isSuperAdmin) return false;
      return true;
    })
    .sort((a, b) => a.display_order - b.display_order)
    .map((f) => {
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      const options = f.dropdown_options ?? DROPDOWN_FALLBACKS[f.field_key] ?? undefined;
      const fieldType = FIELD_TYPE_OVERRIDES[f.field_key] ?? FC_TYPE_TO_CRM[f.field_type] ?? "text";

      let value: string | number | boolean | string[] | null | undefined;
      if (fieldType === "multi_select") {
        const raw = dataObj[propKey];
        value = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
      } else {
        value = dataObj[propKey] as string | number | boolean | null | undefined;
        // Format phone for edit input
        if (f.field_type === "phone" && typeof value === "string") {
          value = formatPhoneInput(value) || value;
        }
      }

      return {
        label: f.field_label,
        fieldName: propKey,
        fieldType,
        options,
        value,
        showYearNavigation: f.field_key === "date_of_birth",
      };
    });
}
