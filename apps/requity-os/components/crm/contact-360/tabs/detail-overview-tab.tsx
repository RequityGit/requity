"use client";

import { useState, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Landmark, TrendingUp, User, Shield, FileText } from "lucide-react";
import {
  SectionCard,
  SectionEditButton,
  MetricCard,
  FieldRow,
  MonoValue,
} from "../contact-detail-shared";
import {
  CrmEditSectionDialog,
  type CrmSectionField,
  type CrmFieldType,
} from "@/components/crm/crm-edit-section-dialog";
import { formatCurrency, formatPercent, formatDate, formatPhoneNumber, formatPhoneInput } from "@/lib/format";
import type {
  ContactData,
  BorrowerData,
  InvestorProfileData,
  LoanData,
  InvestorCommitmentData,
  SectionLayout,
  FieldLayout,
} from "../types";

// --- Field key → object property mapping for mismatches ---
const FIELD_KEY_TO_PROP: Record<string, string> = {
  ssn_last4: "ssn_last_four",
};

// --- Dropdown option fallbacks for built-in fields not yet stored in DB ---
const DROPDOWN_FALLBACKS: Record<string, { label: string; value: string }[]> = {
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
};

// --- field_type → CrmFieldType mapping for edit dialogs ---
const FC_TYPE_TO_CRM: Record<string, CrmFieldType> = {
  text: "text",
  email: "text",
  phone: "text",
  number: "number",
  currency: "currency",
  date: "date",
  boolean: "boolean",
  dropdown: "select",
  percentage: "number",
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
  if (val == null) return undefined;
  return `${val} transactions`;
}

// Map of field_key → custom render function
// Returns undefined for "show dash", null for "skip entirely"
type FieldRenderer = (val: unknown, isSuperAdmin: boolean) => ReactNode | null;
const FIELD_RENDERERS: Record<string, FieldRenderer> = {
  credit_score: (v) => renderCreditScore(v),
  accreditation_status: (v) => renderAccreditationStatus(v),
  ssn_last4: (v, sa) => renderSsnLast4(v, sa),
  experience_count: (v) => renderExperienceCount(v),
  phone: (v) => formatPhoneNumber(v as string | null),
};

// --- Render a single field, returning null to skip ---
function renderField(
  f: FieldLayout,
  dataObj: Record<string, unknown>,
  isSuperAdmin: boolean,
): ReactNode {
  const propKey = FIELD_KEY_TO_PROP[f.field_key] ?? f.field_key;
  const rawValue = dataObj[propKey];

  // Check for custom renderer
  const customRender = FIELD_RENDERERS[f.field_key];
  if (customRender) {
    const rendered = customRender(rawValue, isSuperAdmin);
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
function renderDynamicFields(
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
function buildEditFields(
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
      let value = dataObj[propKey] as string | number | boolean | null | undefined;

      // Format phone for edit input
      if (f.field_type === "phone" && typeof value === "string") {
        value = formatPhoneInput(value) || value;
      }

      return {
        label: f.field_label,
        fieldName: propKey,
        fieldType: FC_TYPE_TO_CRM[f.field_type] ?? "text",
        options,
        value,
        showYearNavigation: f.field_key === "date_of_birth",
      };
    });
}

interface DetailOverviewTabProps {
  contact: ContactData;
  borrower: BorrowerData | null;
  investor: InvestorProfileData | null;
  loans: LoanData[];
  commitments: InvestorCommitmentData[];
  isSuperAdmin: boolean;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
}

// Default section order used when no layout data exists in the database
const DEFAULT_SECTION_ORDER: SectionLayout[] = [
  { section_key: "borrower_summary", display_order: 0, is_visible: true, visibility_rule: "has_borrower" },
  { section_key: "investor_summary", display_order: 1, is_visible: true, visibility_rule: "has_investor" },
  { section_key: "borrower_profile", display_order: 2, is_visible: true, visibility_rule: "has_borrower" },
  { section_key: "investor_profile", display_order: 3, is_visible: true, visibility_rule: "has_investor" },
  { section_key: "contact_profile", display_order: 4, is_visible: true, visibility_rule: null },
  { section_key: "description", display_order: 5, is_visible: true, visibility_rule: null },
];
export function DetailOverviewTab({
  contact,
  borrower,
  investor,
  loans,
  commitments,
  isSuperAdmin,
  sectionOrder,
  sectionFields,
}: DetailOverviewTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const [editContactOpen, setEditContactOpen] = useState(false);
  const [editBorrowerOpen, setEditBorrowerOpen] = useState(false);
  const [editInvestorOpen, setEditInvestorOpen] = useState(false);
  const [editDescriptionOpen, setEditDescriptionOpen] = useState(false);

  async function updateBorrowerField(
    field: string,
    value: string | number | boolean | null
  ) {
    if (!borrower) return;
    const { error } = await supabase
      .from("borrowers")
      .update({ [field]: value })
      .eq("id", borrower.id);
    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }

  async function updateInvestorField(
    field: string,
    value: string | number | boolean | null
  ) {
    if (!investor) return;
    const { error } = await supabase
      .from("investors")
      .update({ [field]: value })
      .eq("id", investor.id);
    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }

  async function updateContactField(
    field: string,
    value: string | number | boolean | null
  ) {
    const { error } = await supabase
      .from("crm_contacts")
      .update({ [field]: value })
      .eq("id", contact.id);
    if (error) {
      toast({
        title: "Error saving",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
    toast({ title: "Saved" });
    router.refresh();
  }

  const activeLoans = loans.filter(
    (l) =>
      l.stage &&
      !["paid_off", "payoff", "denied", "withdrawn"].includes(l.stage)
  );
  const totalVolume = loans.reduce((s, l) => s + (l.loan_amount || 0), 0);
  const rates = loans
    .map((l) => l.interest_rate)
    .filter((r): r is number => r != null);
  const avgRate =
    rates.length > 0 ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  const firstLoan =
    loans.length > 0
      ? loans.reduce((oldest, l) =>
          new Date(l.created_at) < new Date(oldest.created_at) ? l : oldest
        )
      : null;

  const totalCommitted = commitments.reduce(
    (s, c) => s + (c.commitment_amount || 0),
    0
  );
  const totalFunded = commitments.reduce(
    (s, c) => s + (c.funded_amount || 0),
    0
  );
  const totalUnfunded = commitments.reduce(
    (s, c) => s + (c.unfunded_amount || 0),
    0
  );
  const activeFunds = commitments.filter((c) => c.status === "active").length;

  const hasBorrower = !!borrower;
  const hasInvestor = !!investor;

  // Resolve which sections to render and in what order
  const resolvedSections = useMemo(() => {
    const layout = sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;

    const visibilityContext: Record<string, boolean> = {
      has_borrower: hasBorrower,
      has_investor: hasInvestor,
    };

    return layout
      .filter((s) => s.is_visible)
      .filter((s) => {
        if (!s.visibility_rule) return true;
        return visibilityContext[s.visibility_rule] ?? true;
      })
      .sort((a, b) => a.display_order - b.display_order)
      .map((s) => s.section_key);
  }, [sectionOrder, hasBorrower, hasInvestor]);

  // Data objects for dynamic field rendering
  const contactData = contact as unknown as Record<string, unknown>;
  const borrowerData = (borrower ?? {}) as Record<string, unknown>;
  const investorData = (investor ?? {}) as Record<string, unknown>;

  // Build edit dialog field lists from layout data
  const contactEditFields = useMemo(
    () => sectionFields.contact_profile?.length
      ? buildEditFields(sectionFields.contact_profile, contactData, isSuperAdmin)
      : [],
    [sectionFields, contactData, isSuperAdmin]
  );

  const borrowerEditFields = useMemo(
    () => sectionFields.borrower_profile?.length && borrower
      ? buildEditFields(sectionFields.borrower_profile, borrowerData, isSuperAdmin)
      : [],
    [sectionFields, borrowerData, borrower, isSuperAdmin]
  );

  const investorEditFields = useMemo(
    () => sectionFields.investor_profile?.length && investor
      ? buildEditFields(sectionFields.investor_profile, investorData, isSuperAdmin)
      : [],
    [sectionFields, investorData, investor, isSuperAdmin]
  );

  // Build section content map: section_key -> JSX
  const sectionContent: Record<string, ReactNode> = {
    borrower_summary:
      hasBorrower && loans.length > 0 ? (
        <SectionCard title="Borrower Summary" icon={Landmark} key="borrower_summary">
          <div className="flex gap-5 flex-wrap">
            <MetricCard
              label="Total Loans"
              value={loans.length}
              sub={`${activeLoans.length} active`}
            />
            <MetricCard
              label="Loan Volume"
              value={formatCurrency(totalVolume)}
              mono
            />
            <MetricCard
              label="Avg Rate"
              value={avgRate > 0 ? formatPercent(avgRate) : "—"}
              mono
            />
            <MetricCard label="Active Opps" value={activeLoans.length} />
            <MetricCard
              label="First Loan"
              value={firstLoan ? formatDate(firstLoan.created_at) : "—"}
            />
          </div>
        </SectionCard>
      ) : null,

    investor_summary:
      hasInvestor && commitments.length > 0 ? (
        <SectionCard title="Investor Summary" icon={TrendingUp} key="investor_summary">
          <div className="flex gap-5 flex-wrap">
            <MetricCard
              label="Total Committed"
              value={formatCurrency(totalCommitted)}
              mono
            />
            <MetricCard
              label="Funded"
              value={formatCurrency(totalFunded)}
              mono
            />
            <MetricCard
              label="Unfunded"
              value={formatCurrency(totalUnfunded)}
              mono
            />
            <MetricCard label="Active Funds" value={activeFunds} />
          </div>
        </SectionCard>
      ) : null,

    borrower_profile: hasBorrower ? (
      <SectionCard title="Borrower Profile" icon={User} action={<SectionEditButton onClick={() => setEditBorrowerOpen(true)} />} key="borrower_profile">
        {sectionFields.borrower_profile?.length
          ? renderDynamicFields(sectionFields.borrower_profile, borrowerData, isSuperAdmin)
          : null}
      </SectionCard>
    ) : null,

    investor_profile: hasInvestor ? (
      <SectionCard title="Investor Profile" icon={Shield} action={<SectionEditButton onClick={() => setEditInvestorOpen(true)} />} key="investor_profile">
        {sectionFields.investor_profile?.length
          ? renderDynamicFields(sectionFields.investor_profile, investorData, isSuperAdmin)
          : null}
      </SectionCard>
    ) : null,

    contact_profile: (
      <SectionCard title="Contact Profile" icon={FileText} action={<SectionEditButton onClick={() => setEditContactOpen(true)} />} key="contact_profile">
        {sectionFields.contact_profile?.length
          ? renderDynamicFields(sectionFields.contact_profile, contactData, isSuperAdmin)
          : null}
      </SectionCard>
    ),

    description: (
      <SectionCard title="Description" icon={FileText} action={<SectionEditButton onClick={() => setEditDescriptionOpen(true)} />} key="description">
        <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {contact.notes || "No description."}
        </p>
      </SectionCard>
    ),
  };

  return (
    <div className="flex flex-col gap-5">
      {resolvedSections.map((key) => sectionContent[key])}

      {/* Section Edit Dialogs */}
      <CrmEditSectionDialog
        open={editContactOpen}
        onOpenChange={setEditContactOpen}
        title="Contact Profile"
        fields={contactEditFields}
        onSave={updateContactField}
      />
      {hasBorrower && (
        <CrmEditSectionDialog
          open={editBorrowerOpen}
          onOpenChange={setEditBorrowerOpen}
          title="Borrower Profile"
          fields={borrowerEditFields}
          onSave={updateBorrowerField}
        />
      )}
      {hasInvestor && (
        <CrmEditSectionDialog
          open={editInvestorOpen}
          onOpenChange={setEditInvestorOpen}
          title="Investor Profile"
          fields={investorEditFields}
          onSave={updateInvestorField}
        />
      )}
      <CrmEditSectionDialog
        open={editDescriptionOpen}
        onOpenChange={setEditDescriptionOpen}
        title="Description"
        fields={[{ label: "Description", fieldName: "notes", fieldType: "textarea", value: contact.notes }]}
        onSave={updateContactField}
      />
    </div>
  );
}
