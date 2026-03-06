"use client";

import { useState, useCallback } from "react";
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
  EditableFieldRow,
} from "@/components/crm/contact-360/contact-detail-shared";
import {
  CrmEditSectionDialog,
  type CrmSectionField,
} from "@/components/crm/crm-edit-section-dialog";
import { useToast } from "@/components/ui/use-toast";
import { formatDate } from "@/lib/format";
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

interface OverviewTabProps {
  company: CompanyDetailData;
  wireInstructions: CompanyWireData | null;
  files: CompanyFileData[];
  onEditLenderDetails?: () => void;
}

const COMPANY_TYPE_OPTIONS = Object.entries(COMPANY_TYPE_CONFIG).map(
  ([value, { label }]) => ({ value, label })
);

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
}: OverviewTabProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [showWire, setShowWire] = useState(false);
  const [editCompanyOpen, setEditCompanyOpen] = useState(false);
  const [editAddressOpen, setEditAddressOpen] = useState(false);
  const [editAgreementsOpen, setEditAgreementsOpen] = useState(false);
  const isLender = company.company_type === "lender";
  const typeCfg =
    COMPANY_TYPE_CONFIG[company.company_type] || COMPANY_TYPE_CONFIG.other;

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
    async (field: string, value: string | number | boolean | null) => {
      const result = await updateCompanyAction({
        id: company.id,
        [field]: value,
      });
      if ("error" in result && result.error) {
        toast({ title: "Error saving", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Saved" });
      }
      router.refresh();
    },
    [company.id, router, toast]
  );

  // --- Section field definitions for edit dialogs ---

  const companyInfoFields: CrmSectionField[] = [
    { label: "Legal Name", fieldName: "name", fieldType: "text", value: company.name },
    { label: "DBA / Other Names", fieldName: "other_names", fieldType: "text", value: company.other_names },
    {
      label: "Company Type", fieldName: "company_type", fieldType: "select", value: company.company_type,
      options: COMPANY_TYPE_OPTIONS,
    },
    { label: "Phone", fieldName: "phone", fieldType: "text", value: company.phone },
    { label: "Email", fieldName: "email", fieldType: "text", value: company.email },
    { label: "Website", fieldName: "website", fieldType: "text", value: company.website },
    { label: "Source", fieldName: "source", fieldType: "text", value: company.source },
    { label: "Status", fieldName: "is_active", fieldType: "boolean", value: company.is_active },
    { label: "Title Co. Verified", fieldName: "title_company_verified", fieldType: "boolean", value: company.title_company_verified },
  ];

  const addressFields: CrmSectionField[] = [
    { label: "Address Line 1", fieldName: "address_line1", fieldType: "text", value: company.address_line1 },
    { label: "Address Line 2", fieldName: "address_line2", fieldType: "text", value: company.address_line2 },
    { label: "City", fieldName: "city", fieldType: "text", value: company.city },
    { label: "State", fieldName: "state", fieldType: "text", value: company.state },
    { label: "Zip", fieldName: "zip", fieldType: "text", value: company.zip },
    { label: "Country", fieldName: "country", fieldType: "text", value: company.country || "US" },
  ];

  const agreementFields: CrmSectionField[] = [
    { label: "NDA Created", fieldName: "nda_created_date", fieldType: "date", value: company.nda_created_date },
    { label: "NDA Expiration", fieldName: "nda_expiration_date", fieldType: "date", value: company.nda_expiration_date },
    { label: "Fee Agreement On File", fieldName: "fee_agreement_on_file", fieldType: "boolean", value: company.fee_agreement_on_file },
  ];

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

  return (
    <div className="flex flex-col gap-5">
      {/* Lender Performance Metrics - placeholder for future data */}
      {isLender && (
        <SectionCard title="Lender Performance" icon={TrendingUp}>
          <div className="flex gap-5 flex-wrap">
            <MetricCard label="Deals Submitted" value="—" />
            <MetricCard label="Deals Funded" value="—" />
            <MetricCard label="Hit Rate" value="—" mono />
            <MetricCard label="Funded Volume" value="—" mono />
            <MetricCard label="Avg Rate" value="—" mono />
            <MetricCard label="Avg Close Time" value="—" mono />
          </div>
        </SectionCard>
      )}

      {/* Company Information */}
      <SectionCard title="Company Information" icon={Building2} action={<SectionEditButton onClick={() => setEditCompanyOpen(true)} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <EditableFieldRow
            label="Legal Name"
            value={company.name}
            rawValue={company.name}
            onSave={(v) => saveField("name", v)}
          />
          <EditableFieldRow
            label="DBA / Other Names"
            value={company.other_names || "—"}
            rawValue={company.other_names}
            onSave={(v) => saveField("other_names", v)}
          />
          <EditableFieldRow
            label="Company Type"
            value={typeCfg.label}
            rawValue={company.company_type}
            fieldType="select"
            selectOptions={COMPANY_TYPE_OPTIONS}
            onSave={(v) => saveField("company_type", v)}
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
          <EditableFieldRow
            label="Phone"
            value={company.phone ? <ClickToCallNumber number={company.phone} showIcon={false} /> : "—"}
            rawValue={company.phone}
            onSave={(v) => saveField("phone", v)}
          />
          <EditableFieldRow
            label="Email"
            value={company.email || "—"}
            rawValue={company.email}
            onSave={(v) => saveField("email", v)}
          />
          <EditableFieldRow
            label="Website"
            value={
              company.website
                ? company.website.replace(/^https?:\/\//, "")
                : "—"
            }
            rawValue={company.website}
            onSave={(v) => saveField("website", v)}
          />
          <EditableFieldRow
            label="Source"
            value={company.source || "—"}
            rawValue={company.source}
            onSave={(v) => saveField("source", v)}
          />
          <EditableFieldRow
            label="Status"
            value={company.is_active ? "Active" : "Inactive"}
            rawValue={company.is_active ? "true" : "false"}
            fieldType="boolean"
            onSave={(v) => saveField("is_active", v)}
          />
          <EditableFieldRow
            label="Title Co. Verified"
            value={company.title_company_verified ? "Yes" : "No"}
            rawValue={company.title_company_verified ? "true" : "false"}
            fieldType="boolean"
            onSave={(v) => saveField("title_company_verified", v)}
          />
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard title="Address" icon={MapPin} action={<SectionEditButton onClick={() => setEditAddressOpen(true)} />}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <EditableFieldRow
            label="Address Line 1"
            value={company.address_line1 || "—"}
            rawValue={company.address_line1}
            onSave={(v) => saveField("address_line1", v)}
          />
          <EditableFieldRow
            label="Address Line 2"
            value={company.address_line2 || "—"}
            rawValue={company.address_line2}
            onSave={(v) => saveField("address_line2", v)}
          />
          <EditableFieldRow
            label="City"
            value={company.city || "—"}
            rawValue={company.city}
            onSave={(v) => saveField("city", v)}
          />
          <EditableFieldRow
            label="State"
            value={company.state || "—"}
            rawValue={company.state}
            onSave={(v) => saveField("state", v)}
          />
          <EditableFieldRow
            label="Zip"
            value={company.zip || "—"}
            rawValue={company.zip}
            mono
            onSave={(v) => saveField("zip", v)}
          />
          <EditableFieldRow
            label="Country"
            value={company.country || "US"}
            rawValue={company.country || "US"}
            onSave={(v) => saveField("country", v)}
          />
        </div>
      </SectionCard>

      {/* Lender Details */}
      {isLender && (
        <SectionCard
          title="Lender Details"
          icon={Landmark}
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
      )}

      {/* Non-lender: capabilities/asset_types/geographies if populated */}
      {!isLender &&
        ((company.company_capabilities ?? []).length > 0 ||
          (company.asset_types ?? []).length > 0 ||
          (company.geographies ?? []).length > 0) && (
          <SectionCard title="Capabilities & Coverage" icon={Target}>
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
        )}

      {/* Agreements */}
      <SectionCard title="Agreements" icon={FileText} action={<SectionEditButton onClick={() => setEditAgreementsOpen(true)} />}>
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
          <EditableFieldRow
            label="NDA Created"
            value={
              company.nda_created_date
                ? formatDate(company.nda_created_date)
                : "—"
            }
            rawValue={company.nda_created_date}
            fieldType="date"
            onSave={(v) => saveField("nda_created_date", v)}
          />
          <EditableFieldRow
            label="NDA Expiration"
            value={
              company.nda_expiration_date
                ? formatDate(company.nda_expiration_date)
                : "—"
            }
            rawValue={company.nda_expiration_date}
            fieldType="date"
            danger={!!ndaExpDanger}
            onSave={(v) => saveField("nda_expiration_date", v)}
          />
          <EditableFieldRow
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
            rawValue={company.fee_agreement_on_file ? "true" : "false"}
            fieldType="boolean"
            onSave={(v) => saveField("fee_agreement_on_file", v)}
          />
        </div>
      </SectionCard>

      {/* Wire Instructions */}
      <SectionCard
        title="Wire Instructions"
        icon={Banknote}
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

      {/* Internal Notes */}
      <SectionCard title="Internal Notes" icon={FileText}>
        <EditableFieldRow
          label=""
          value={
            <span className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {company.notes || "No notes."}
            </span>
          }
          rawValue={company.notes}
          onSave={(v) => saveField("notes", v)}
        />
      </SectionCard>

      {/* Section Edit Dialogs */}
      <CrmEditSectionDialog
        open={editCompanyOpen}
        onOpenChange={setEditCompanyOpen}
        title="Company Information"
        fields={companyInfoFields}
        onSave={saveField}
      />
      <CrmEditSectionDialog
        open={editAddressOpen}
        onOpenChange={setEditAddressOpen}
        title="Address"
        fields={addressFields}
        onSave={saveField}
      />
      <CrmEditSectionDialog
        open={editAgreementsOpen}
        onOpenChange={setEditAgreementsOpen}
        title="Agreements"
        fields={agreementFields}
        onSave={saveField}
      />
    </div>
  );
}
