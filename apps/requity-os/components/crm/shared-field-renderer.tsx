"use client";

import { useState, useCallback, type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FieldRow,
  MonoValue,
} from "./contact-360/contact-detail-shared";
import type {
  CrmSectionField,
  CrmFieldType,
} from "@/components/crm/crm-edit-section-dialog";
import { formatCurrency, formatDate, formatPhoneNumber, formatPhoneInput, formatPercent } from "@/lib/format";
import { evaluateFormula } from "@/lib/formula-engine";
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

// Dropdown options are now fully managed in field_configurations DB table.
// Edited via Object Manager at /control-center/object-manager.

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
  multi_select: "multi_select",
  percentage: "number",
  team_member: "select",
  company: "select",
  relationship: "select",
};

// Field types are now fully managed in field_configurations DB table.
// company_type is field_type='multi_select' in the DB.

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

// Fields with custom renderers that should remain read-only in inline editing mode
const READONLY_CUSTOM_FIELDS = new Set(["accreditation_status"]);

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

  // Formula field: evaluate expression against section data
  if (f.field_type === "formula" && f.formula_expression) {
    const result = evaluateFormula(f.formula_expression, dataObj);
    let formulaDisplay: ReactNode;
    if (result == null) {
      formulaDisplay = undefined; // shows "—"
    } else {
      const decimals = f.formula_decimal_places ?? 2;
      switch (f.formula_output_format) {
        case "currency":
          formulaDisplay = formatCurrency(result);
          break;
        case "percent":
          formulaDisplay = formatPercent(result);
          break;
        case "number":
          formulaDisplay = result.toFixed(decimals);
          break;
        default:
          formulaDisplay = result.toFixed(decimals);
      }
    }
    return (
      <FieldRow
        key={f.field_key}
        label={f.field_label}
        value={formulaDisplay}
        mono={f.formula_output_format === "currency"}
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
  /** Optional set of field_keys to hide (from conditional logic or permissions) */
  hiddenFieldKeys?: Set<string>,
): ReactNode {
  const visible = fields
    .filter((f) => f.is_visible)
    .filter((f) => !hiddenFieldKeys || !hiddenFieldKeys.has(f.field_key));

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
  /** Optional set of field_keys to hide (from conditional logic or permissions) */
  hiddenFieldKeys?: Set<string>,
  /** Optional set of field_keys that should be read-only (from permissions) */
  readOnlyFieldKeys?: Set<string>,
): CrmSectionField[] {
  return fields
    .filter((f) => f.is_visible)
    .filter((f) => !hiddenFieldKeys || !hiddenFieldKeys.has(f.field_key))
    .filter((f) => {
      if (f.field_key === "ssn_last4" && !isSuperAdmin) return false;
      return true;
    })
    .sort((a, b) => a.display_order - b.display_order)
    .map((f) => {
      const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
      const options = f.dropdown_options ?? undefined;
      const fieldType = FC_TYPE_TO_CRM[f.field_type] ?? "text";

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

// ─── Inline Editing Components ───

function formatCurrencyDisplay(val: unknown): string {
  if (val == null || val === "") return "";
  const n = Number(val);
  if (isNaN(n)) return String(val);
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

function parseCurrencyInput(raw: string): number | null {
  const stripped = raw.replace(/[^0-9.\-]/g, "");
  if (stripped === "" || stripped === "-") return null;
  const n = Number(stripped);
  return isNaN(n) ? null : n;
}

function CurrencyInput({
  label,
  value,
  onChange,
  onBlur,
  disabled,
}: {
  label: string;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [rawText, setRawText] = useState("");

  const handleFocus = useCallback(() => {
    setEditing(true);
    setRawText(value != null && value !== "" ? formatCurrencyDisplay(value) : "");
  }, [value]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    onBlur();
  }, [onBlur]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const text = e.target.value;
      const parsed = parseCurrencyInput(text);
      const display = parsed != null ? formatCurrencyDisplay(parsed) : text.replace(/[^0-9.\-]/g, "");
      setRawText(display);
      onChange(parsed);
    },
    [onChange]
  );

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
        <Input
          type="text"
          inputMode="decimal"
          value={editing ? rawText : formatCurrencyDisplay(value)}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          className="pl-7 text-right num"
          placeholder="0"
        />
      </div>
    </div>
  );
}

function PhoneInput({
  label,
  value,
  onChange,
  onBlur,
  disabled,
}: {
  label: string;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [rawText, setRawText] = useState("");

  const handleFocus = useCallback(() => {
    setEditing(true);
    const str = value != null ? String(value) : "";
    setRawText(formatPhoneInput(str) || str);
  }, [value]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    onBlur();
  }, [onBlur]);

  const displayValue = value != null && String(value) !== ""
    ? formatPhoneNumber(String(value))
    : "";

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input
        type="tel"
        value={editing ? rawText : (displayValue === "\u2014" ? "" : displayValue)}
        onChange={(e) => {
          const formatted = formatPhoneInput(e.target.value);
          setRawText(formatted);
          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
          onChange(digits || null);
        }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder="(555) 555-5555"
      />
    </div>
  );
}

export interface CrmInlineFieldProps {
  field: FieldLayout;
  value: unknown;
  onChange: (val: unknown) => void;
  onBlur: () => void;
  disabled?: boolean;
  options?: { label: string; value: string }[];
  showYearNavigation?: boolean;
}

export function CrmInlineField({
  field,
  value,
  onChange,
  onBlur,
  disabled,
  options: optionsProp,
  showYearNavigation,
}: CrmInlineFieldProps) {
  const options = optionsProp ?? field.dropdown_options ?? [];

  switch (field.field_type) {
    case "currency":
      return (
        <CurrencyInput
          label={field.field_label}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
        />
      );

    case "percentage":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.field_label}</Label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              value={value != null ? String(value) : ""}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              onBlur={onBlur}
              disabled={disabled}
              className="pr-7 text-right num"
              placeholder="0.00"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
          </div>
        </div>
      );

    case "number":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.field_label}</Label>
          <Input
            type="number"
            value={value != null ? String(value) : ""}
            onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
            onBlur={onBlur}
            disabled={disabled}
            className="num"
            placeholder="0"
          />
        </div>
      );

    case "boolean":
      return (
        <div className="flex items-center justify-between py-2">
          <Label className="text-xs">{field.field_label}</Label>
          <Switch
            checked={!!value}
            onCheckedChange={(checked) => {
              onChange(checked);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          />
        </div>
      );

    case "dropdown":
    case "team_member":
    case "company":
    case "relationship":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.field_label}</Label>
          <Select
            value={value != null ? String(value) : ""}
            onValueChange={(val) => {
              onChange(val || null);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              {options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "date":
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.field_label}</Label>
          <DatePicker
            value={value != null ? String(value) : ""}
            onChange={(val) => {
              onChange(val || null);
              setTimeout(onBlur, 0);
            }}
            disabled={disabled}
            showYearNavigation={showYearNavigation}
          />
        </div>
      );

    case "phone":
      return (
        <PhoneInput
          label={field.field_label}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
        />
      );

    default:
      return (
        <div className="space-y-1.5">
          <Label className="text-xs">{field.field_label}</Label>
          {field.field_type === "textarea" ? (
            <Textarea
              value={value != null ? String(value) : ""}
              onChange={(e) => onChange(e.target.value || null)}
              onBlur={onBlur}
              disabled={disabled}
              rows={4}
              placeholder={field.field_label}
              className="text-sm"
            />
          ) : (
            <Input
              type={field.field_type === "email" ? "email" : "text"}
              value={value != null ? String(value) : ""}
              onChange={(e) => onChange(e.target.value || null)}
              onBlur={onBlur}
              disabled={disabled}
              placeholder={field.field_label}
            />
          )}
        </div>
      );
  }
}

// ─── Inline Dynamic Fields Renderer ───

export function renderDynamicFieldsInline(
  fields: FieldLayout[],
  dataObj: Record<string, unknown>,
  isSuperAdmin: boolean,
  callbacks: {
    onChange: (fieldKey: string, value: unknown) => void;
    onBlur: (fieldKey: string) => void;
    disabled?: boolean;
    optionsOverrides?: Record<string, { label: string; value: string }[]>;
  },
  hiddenFieldKeys?: Set<string>,
  readOnlyFieldKeys?: Set<string>,
): ReactNode {
  const visible = fields
    .filter((f) => f.is_visible)
    .filter((f) => !hiddenFieldKeys || !hiddenFieldKeys.has(f.field_key))
    .filter((f) => {
      if (f.field_key === "ssn_last4" && !isSuperAdmin) return false;
      return true;
    })
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
      {visible.map((f) => {
        const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
        const rawValue = dataObj[propKey];

        const isFormula = f.field_type === "formula" && f.formula_expression;
        const isReadOnlyCustom = READONLY_CUSTOM_FIELDS.has(f.field_key);
        const isReadOnly = readOnlyFieldKeys?.has(f.field_key);

        if (isFormula || isReadOnlyCustom || isReadOnly) {
          return renderField(f, dataObj, isSuperAdmin);
        }

        const options = callbacks.optionsOverrides?.[f.field_key]
          ?? f.dropdown_options
          ?? undefined;

        return (
          <CrmInlineField
            key={f.field_key}
            field={f}
            value={rawValue}
            onChange={(val) => callbacks.onChange(propKey, val)}
            onBlur={() => callbacks.onBlur(propKey)}
            disabled={callbacks.disabled}
            options={options ?? undefined}
            showYearNavigation={f.field_key === "date_of_birth"}
          />
        );
      })}
    </div>
  );
}
