"use client";

import { useState, useCallback, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  Building2,
  MapPin,
  Landmark,
  FileText,
  Banknote,
  Target,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SectionCard,
  MetricCard,
  FieldRow,
} from "@/components/crm/contact-360/contact-detail-shared";
import {
  CrmEditSectionDialog,
  type CrmSectionField,
} from "@/components/crm/crm-edit-section-dialog";
import {
  renderDynamicFields,
  buildEditFields,
} from "@/components/crm/shared-field-renderer";
import { useToast } from "@/components/ui/use-toast";
import { formatDate, formatPhoneInput } from "@/lib/format";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import { updateCompanyAction } from "@/app/(authenticated)/admin/crm/company-actions";
import type {
  CompanyDetailData,
  CompanyWireData,
  CompanyFileData,
} from "../types";
import {
  COMPANY_TYPE_CONFIG,
  SUBTYPE_LABELS,
  PROGRAM_LABELS,
  ASSET_LABELS,
  CAPABILITY_LABELS,
} from "../types";
import type {
  SectionLayout,
  FieldLayout,
} from "@/components/crm/contact-360/types";

interface OverviewTabProps {
  company: CompanyDetailData;
  wireInstructions: CompanyWireData | null;
  files: CompanyFileData[];
  onEditLenderDetails?: () => void;
  sectionOrder: SectionLayout[];
  sectionFields: Record<string, FieldLayout[]>;
}

const COMPANY_TYPE_OPTIONS = Object.entries(COMPANY_TYPE_CONFIG).map(
  ([value, { label }]) => ({ value, label })
);

// Default section order used when no layout data exists in the database
const DEFAULT_SECTION_ORDER: SectionLayout[] = [
  { section_key: "lender_performance", display_order: 0, is_visible: true, visibility_rule: "is_lender" },
  { section_key: "company_information", display_order: 1, is_visible: true, visibility_rule: null },
  { section_key: "address", display_order: 2, is_visible: true, visibility_rule: null },
  { section_key: "lender_details", display_order: 3, is_visible: true, visibility_rule: "is_lender" },
  { section_key: "capabilities_coverage", display_order: 4, is_visible: true, visibility_rule: "not_lender" },
  { section_key: "agreements", display_order: 5, is_visible: true, visibility_rule: null },
  { section_key: "wire_instructions", display_order: 6, is_visible: true, visibility_rule: null },
  { section_key: "description", display_order: 7, is_visible: true, visibility_rule: null },
];

function ChipGroup({
  items,
  labelMap,
  color,
}: {
  items: string[];
  labelMap: Record<string, string>;
  color: string;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border whitespace-nowrap"
          style={{ borderColor: color, color }}
        >
          {labelMap[item] ||
            item
              .replace(/_/g, " ")
              .replace(/\b\w/g, (c) => c.toUpperCase())}
        </span>
      ))}
      {items.length === 0 && (
        <span className="text-xs text-muted-foreground italic">None configured</span>
      )}
    </div>
  );
}

export function CompanyOverviewTab({
  company,
  wireInstructions,
  files,
  onEditLenderDetails,
  sectionOrder,
  sectionFields,
}: OverviewTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showWire, setShowWire] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editAgreementsOpen, setEditAgreementsOpen] = useState(false);
  const [editNotesOpen, setEditNotesOpen] = useState(false);
  const types = company.company_types?.length
    ? company.company_types
    : [company.company_type];
  const isLender = types.includes("lender");
  const typeCfg =
    COMPANY_TYPE_CONFIG[types[0]] || COMPANY_TYPE_CONFIG.other;

  // Compute NDA status for display
  const ndaStatusPill = (() => {
    if (!company.nda_created_date) return { label: "Missing", color: "#E5453D" };
    if (!company.nda_expiration_date) return { label: "On File", color: "#22A861" };
    const exp = new Date(company.nda_expiration_date);
    const now = new Date();
    if (exp < now) return { label: "Expired", color: "#E5453D" };
    return { label: "On File", color: "#22A861" };
  })();

  // NDA expiration danger flag (within ~3 months)
  const ndaExpDanger =
    company.nda_expiration_date &&
    new Date(company.nda_expiration_date).getTime() - new Date().getTime() <
      90 * 86400000;

  const saveField = useCallback(
    async (field: string, value: string | number | boolean | string[] | null) => {
      const updates: Record<string, unknown> = { id: company.id, [field]: value };
      // When saving company_types, also update the primary company_type for backward compatibility
      if (field === "company_types" && Array.isArray(value) && value.length > 0) {
        updates.company_type = value[0];
      }
      const result = await updateCompanyAction(updates as any);
      if ("error" in result && result.error) {
        toast({ title: "Error saving", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Saved" });
      }
      router.refresh();
    },
    [company.id, router, toast]
  );

  // Data object for dynamic field rendering
  const companyData = company as unknown as Record<string, unknown>;

  // --- Hardcoded fallback field definitions for edit dialogs ---

  const companyInfoFieldsFallback: CrmSectionField[] = [
    { label: "Legal Name", fieldName: "name", fieldType: "text", value: company.name },
    { label: "DBA / Other Names", fieldName: "other_names", fieldType: "text", value: company.other_names },
    {
      label: "Company Types", fieldName: "company_types", fieldType: "multi_select", value: types,
      options: COMPANY_TYPE_OPTIONS,
    },
    { label: "Phone", fieldName: "phone", fieldType: "text", value: formatPhoneInput(company.phone ?? "") || company.phone },
    { label: "Email", fieldName: "email", fieldType: "text", value: company.email },
    { label: "Website", fieldName: "website", fieldType: "text", value: company.website },
    { label: "Source", fieldName: "source", fieldType: "text", value: company.source },
    { label: "Status", fieldName: "is_active", fieldType: "boolean", value: company.is_active },
    { label: "Title Co. Verified", fieldName: "title_company_verified", fieldType: "boolean", value: company.title_company_verified },
  ];

  const addressFieldsFallback: CrmSectionField[] = [
    { label: "Address Line 1", fieldName: "address_line1", fieldType: "text", value: company.address_line1 },
    { label: "Address Line 2", fieldName: "address_line2", fieldType: "text", value: company.address_line2 },
    { label: "City", fieldName: "city", fieldType: "text", value: company.city },
    { label: "State", fieldName: "state", fieldType: "text", value: company.state },
    { label: "Zip", fieldName: "zip", fieldType: "text", value: company.zip },
    { label: "Country", fieldName: "country", fieldType: "text", value: company.country || "US" },
  ];

  const agreementFieldsFallback: CrmSectionField[] = [
    { label: "NDA Created", fieldName: "nda_created_date", fieldType: "date", value: company.nda_created_date },
    { label: "NDA Expiration", fieldName: "nda_expiration_date", fieldType: "date", value: company.nda_expiration_date },
    { label: "Fee Agreement On File", fieldName: "fee_agreement_on_file", fieldType: "boolean", value: company.fee_agreement_on_file },
  ];

  const notesFields: CrmSectionField[] = [
    { label: "Description", fieldName: "notes", fieldType: "textarea", value: company.notes },
  ];

  // Use dynamic edit fields when layout data exists, otherwise fall back to hardcoded
  const companyInfoEditFields = useMemo(
    () => sectionFields.company_information?.length
      ? buildEditFields(sectionFields.company_information, companyData, false)
      : companyInfoFieldsFallback,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionFields, company]
  );

  const addressEditFields = useMemo(
    () => sectionFields.address?.length
      ? buildEditFields(sectionFields.address, companyData, false)
      : addressFieldsFallback,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionFields, company]
  );

  const agreementEditFields = useMemo(
    () => sectionFields.agreements?.length
      ? buildEditFields(sectionFields.agreements, companyData, false)
      : agreementFieldsFallback,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sectionFields, company]
  );

  // Has non-lender capabilities/coverage data
  const hasCapabilitiesCoverage = !isLender &&
    ((company.company_capabilities ?? []).length > 0 ||
      (company.asset_types ?? []).length > 0 ||
      (company.geographies ?? []).length > 0);

  // Resolve section ordering
  const resolvedSections = useMemo(() => {
    const layout = sectionOrder.length > 0 ? sectionOrder : DEFAULT_SECTION_ORDER;

    const visibilityContext: Record<string, boolean> = {
      is_lender: isLender,
      not_lender: !isLender,
      has_wire: !!wireInstructions,
    };

    return layout
      .filter((s) => s.is_visible)
      .filter((s) => {
        if (!s.visibility_rule) return true;
        return visibilityContext[s.visibility_rule] ?? true;
      })
      .sort((a, b) => a.display_order - b.display_order)
      .map((s) => s.section_key);
  }, [sectionOrder, isLender, wireInstructions]);

  function SectionEditButton({ onClick }: { onClick: () => void }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-xs h-7 text-muted-foreground"
        onClick={onClick}
      >
        <Pencil size={12} strokeWidth={1.5} /> Edit
      </Button>
    );
  }

  // Hardcoded fallback rendering for Company Information
  function renderCompanyInfoFallback() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
        <FieldRow label="Legal Name" value={company.name} />
        <FieldRow label="DBA / Other Names" value={company.other_names} />
        <FieldRow
          label="Company Type"
          value={
            <div className="flex flex-wrap gap-1">
              {types.map((t) => {
                const cfg = COMPANY_TYPE_CONFIG[t] || COMPANY_TYPE_CONFIG.other;
                return (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                    style={{ backgroundColor: `${cfg.color}14`, color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                );
              })}
            </div>
          }
        />
        {company.company_subtype && (
          <FieldRow
            label="Subtype"
            value={
              SUBTYPE_LABELS[company.company_subtype] ||
              company.company_subtype
            }
          />
        )}
        <FieldRow
          label="Phone"
          value={company.phone ? <ClickToCallNumber number={company.phone} showIcon={false} /> : undefined}
        />
        <FieldRow label="Email" value={company.email} />
        <FieldRow
          label="Website"
          value={
            company.website
              ? company.website.replace(/^https?:\/\//, "")
              : undefined
          }
        />
        <FieldRow label="Source" value={company.source} />
        <FieldRow label="Status" value={company.is_active ? "Active" : "Inactive"} />
        <FieldRow label="Title Co. Verified" value={company.title_company_verified ? "Yes" : "No"} />
      </div>
    );
  }

  // Hardcoded fallback rendering for Address
  function renderAddressFallback() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
        <FieldRow label="Address Line 1" value={company.address_line1} />
        <FieldRow label="Address Line 2" value={company.address_line2} />
        <FieldRow label="City" value={company.city} />
        <FieldRow label="State" value={company.state} />
        <FieldRow label="Zip" value={company.zip} mono />
        <FieldRow label="Country" value={company.country || "US"} />
      </div>
    );
  }

  // Hardcoded fallback rendering for Agreements
  function renderAgreementsFallback() {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
        <FieldRow
          label="NDA Status"
          value={
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: `${ndaStatusPill.color}14`,
                color: ndaStatusPill.color,
              }}
            >
              {ndaStatusPill.label}
            </span>
          }
        />
        <FieldRow
          label="NDA Created"
          value={
            company.nda_created_date
              ? formatDate(company.nda_created_date)
              : undefined
          }
        />
        <FieldRow
          label="NDA Expiration"
          value={
            company.nda_expiration_date
              ? formatDate(company.nda_expiration_date)
              : undefined
          }
          danger={!!ndaExpDanger}
        />
        <FieldRow
          label="Fee Agreement"
          value={
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                backgroundColor: company.fee_agreement_on_file
                  ? "#22A86114"
                  : "#E5453D14",
                color: company.fee_agreement_on_file ? "#22A861" : "#E5453D",
              }}
            >
              {company.fee_agreement_on_file ? "On File" : "Missing"}
            </span>
          }
        />
      </div>
    );
  }

  // Build section content map: section_key -> JSX
  const sectionContent: Record<string, ReactNode> = {
    lender_performance: isLender ? (
      <SectionCard title="Lender Performance" icon={TrendingUp} key="lender_performance">
        <div className="flex gap-5 flex-wrap">
          <MetricCard label="Deals Submitted" value="—" />
          <MetricCard label="Deals Funded" value="—" />
          <MetricCard label="Hit Rate" value="—" mono />
          <MetricCard label="Funded Volume" value="—" mono />
          <MetricCard label="Avg Rate" value="—" mono />
          <MetricCard label="Avg Close Time" value="—" mono />
        </div>
      </SectionCard>
    ) : null,

    company_information: (
      <SectionCard title="Company Information" icon={Building2} action={<SectionEditButton onClick={() => setEditCompanyOpen(true)} />} key="company_information">
        {sectionFields.company_information?.length
          ? renderDynamicFields(sectionFields.company_information, companyData, false)
          : renderCompanyInfoFallback()}
      </SectionCard>
    ),

    address: (
      <SectionCard title="Address" icon={MapPin} action={<SectionEditButton onClick={() => setEditAddressOpen(true)} />} key="address">
        {sectionFields.address?.length
          ? renderDynamicFields(sectionFields.address, companyData, false)
          : renderAddressFallback()}
      </SectionCard>
    ),

    lender_details: isLender ? (
      <SectionCard
        title="Lender Details"
        icon={Landmark}
        key="lender_details"
        action={
          onEditLenderDetails ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-7 text-muted-foreground"
              onClick={onEditLenderDetails}
            >
              <Pencil size={12} strokeWidth={1.5} /> Edit
            </Button>
          ) : undefined
        }
      >
        <div className="flex flex-col gap-5">
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Programs
            </div>
            <ChipGroup
              items={company.lender_programs ?? []}
              labelMap={PROGRAM_LABELS}
              color="#3B82F6"
            />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Asset Types
            </div>
            <ChipGroup
              items={company.asset_types ?? []}
              labelMap={ASSET_LABELS}
              color="#E5930E"
            />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Geographies
            </div>
            <ChipGroup
              items={company.geographies ?? []}
              labelMap={{}}
              color="#22A861"
            />
          </div>
          <div>
            <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Capabilities
            </div>
            <ChipGroup
              items={company.company_capabilities ?? []}
              labelMap={CAPABILITY_LABELS}
              color="#8B5CF6"
            />
          </div>
        </div>
      </SectionCard>
    ) : null,

    capabilities_coverage: hasCapabilitiesCoverage ? (
      <SectionCard title="Capabilities & Coverage" icon={Target} key="capabilities_coverage">
        <div className="flex flex-col gap-4">
          {(company.company_capabilities ?? []).length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Capabilities
              </div>
              <ChipGroup
                items={company.company_capabilities!}
                labelMap={CAPABILITY_LABELS}
                color="#8B5CF6"
              />
            </div>
          )}
          {(company.asset_types ?? []).length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Asset Types
              </div>
              <ChipGroup
                items={company.asset_types!}
                labelMap={ASSET_LABELS}
                color="#E5930E"
              />
            </div>
          )}
          {(company.geographies ?? []).length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Geographies
              </div>
              <ChipGroup
                items={company.geographies!}
                labelMap={{}}
                color="#22A861"
              />
            </div>
          )}
        </div>
      </SectionCard>
    ) : null,

    agreements: (
      <SectionCard title="Agreements" icon={FileText} action={<SectionEditButton onClick={() => setEditAgreementsOpen(true)} />} key="agreements">
        {sectionFields.agreements?.length
          ? renderDynamicFields(sectionFields.agreements, companyData, false)
          : renderAgreementsFallback()}
      </SectionCard>
    ),

    wire_instructions: (
      <SectionCard
        title="Wire Instructions"
        icon={Banknote}
        key="wire_instructions"
        action={
          wireInstructions ? (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-7 text-muted-foreground"
              onClick={() => setShowWire(!showWire)}
            >
              {showWire ? (
                <EyeOff size={13} strokeWidth={1.5} />
              ) : (
                <Eye size={13} strokeWidth={1.5} />
              )}
              {showWire ? "Hide" : "Reveal"}
            </Button>
          ) : undefined
        }
      >
        {wireInstructions ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
            <FieldRow label="Bank Name" value={wireInstructions.bank_name} />
            <FieldRow
              label="Account Name"
              value={wireInstructions.account_name}
            />
            <FieldRow
              label="Account Number"
              value={
                showWire
                  ? wireInstructions.account_number
                  : wireInstructions.account_number.replace(
                      /./g,
                      (c, i) =>
                        i < wireInstructions.account_number.length - 4
                          ? "●"
                          : c
                    )
              }
              mono
            />
            <FieldRow
              label="Routing Number"
              value={
                showWire
                  ? wireInstructions.routing_number
                  : wireInstructions.routing_number.replace(
                      /./g,
                      (c, i) =>
                        i < wireInstructions.routing_number.length - 4
                          ? "●"
                          : c
                    )
              }
              mono
            />
            <FieldRow
              label="Wire Type"
              value={
                wireInstructions.wire_type.charAt(0).toUpperCase() +
                wireInstructions.wire_type.slice(1)
              }
            />
            <FieldRow
              label="Last Updated"
              value={`${formatDate(wireInstructions.updated_at)}${wireInstructions.updated_by ? ` by ${wireInstructions.updated_by}` : ""}`}
            />
          </div>
        ) : (
          <span className="text-[13px] text-muted-foreground">
            No wire instructions on file.
          </span>
        )}
      </SectionCard>
    ),

    description: (
      <SectionCard title="Description" icon={FileText} action={<SectionEditButton onClick={() => setEditNotesOpen(true)} />} key="description">
        <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {company.notes || "No notes."}
        </p>
      </SectionCard>
    ),
  };

  return (
    <div className="flex flex-col gap-5">
      {resolvedSections.map((key) => sectionContent[key])}

      {/* Section Edit Dialogs */}
      <CrmEditSectionDialog
        open={editCompanyOpen}
        onOpenChange={setEditCompanyOpen}
        title="Company Information"
        fields={companyInfoEditFields}
        onSave={saveField}
      />
      <CrmEditSectionDialog
        open={editAddressOpen}
        onOpenChange={setEditAddressOpen}
        title="Address"
        fields={addressEditFields}
        onSave={saveField}
      />
      <CrmEditSectionDialog
        open={editAgreementsOpen}
        onOpenChange={setEditAgreementsOpen}
        title="Agreements"
        fields={agreementEditFields}
        onSave={saveField}
      />
      <CrmEditSectionDialog
        open={editNotesOpen}
        onOpenChange={setEditNotesOpen}
        title="Description"
        fields={notesFields}
        onSave={saveField}
      />
    </div>
  );
}
