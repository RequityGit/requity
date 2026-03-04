"use client";

import { useState } from "react";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SectionCard,
  MetricCard,
  FieldRow,
} from "@/components/crm/contact-360/contact-detail-shared";
import { formatDate, formatCurrency, formatPercent } from "@/lib/format";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
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
}

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
        <span className="text-xs text-[#8B8B8B] italic">None configured</span>
      )}
    </div>
  );
}

export function CompanyOverviewTab({
  company,
  wireInstructions,
  files,
}: OverviewTabProps) {
  const [showWire, setShowWire] = useState(false);
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
      <SectionCard title="Company Information" icon={Building2}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <FieldRow label="Legal Name" value={company.name} />
          <FieldRow label="DBA / Other Names" value={company.other_names || "—"} />
          <FieldRow
            label="Company Type"
            value={typeCfg.label}
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
          <FieldRow label="Phone" value={<ClickToCallNumber number={company.phone} showIcon={false} />} />
          <FieldRow label="Email" value={company.email} />
          <FieldRow
            label="Website"
            value={
              company.website
                ? company.website.replace(/^https?:\/\//, "")
                : "—"
            }
          />
          <FieldRow label="Source" value={company.source || "—"} />
          <FieldRow
            label="Status"
            value={company.is_active ? "Active" : "Inactive"}
          />
          <FieldRow
            label="Title Co. Verified"
            value={company.title_company_verified ? "Yes" : "No"}
          />
        </div>
      </SectionCard>

      {/* Address */}
      <SectionCard title="Address" icon={MapPin}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10">
          <FieldRow label="Address Line 1" value={company.address_line1} />
          <FieldRow label="Address Line 2" value={company.address_line2} />
          <FieldRow label="City" value={company.city} />
          <FieldRow label="State" value={company.state} />
          <FieldRow label="Zip" value={company.zip} mono />
          <FieldRow label="Country" value={company.country || "US"} />
        </div>
      </SectionCard>

      {/* Lender Details */}
      {isLender && (
        <SectionCard title="Lender Details" icon={Landmark}>
          <div className="flex flex-col gap-5">
            <div>
              <div className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider mb-2">
                Programs
              </div>
              <ChipGroup
                items={company.lender_programs ?? []}
                labelMap={PROGRAM_LABELS}
                color="#3B82F6"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider mb-2">
                Asset Types
              </div>
              <ChipGroup
                items={company.asset_types ?? []}
                labelMap={ASSET_LABELS}
                color="#E5930E"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider mb-2">
                Geographies
              </div>
              <ChipGroup
                items={company.geographies ?? []}
                labelMap={{}}
                color="#22A861"
              />
            </div>
            <div>
              <div className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider mb-2">
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
                  <div className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider mb-2">
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
                  <div className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider mb-2">
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
                  <div className="text-[11px] font-semibold text-[#8B8B8B] uppercase tracking-wider mb-2">
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
      <SectionCard title="Agreements" icon={FileText}>
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
                : "—"
            }
          />
          <FieldRow
            label="NDA Expiration"
            value={
              company.nda_expiration_date
                ? formatDate(company.nda_expiration_date)
                : "—"
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
              className="gap-1 text-xs h-7 text-[#6B6B6B]"
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
          <span className="text-[13px] text-[#8B8B8B]">
            No wire instructions on file.
          </span>
        )}
      </SectionCard>

      {/* Internal Notes */}
      <SectionCard title="Internal Notes" icon={FileText}>
        <div className="text-[13px] text-[#6B6B6B] leading-relaxed whitespace-pre-wrap">
          {company.notes || "No notes."}
        </div>
      </SectionCard>
    </div>
  );
}
