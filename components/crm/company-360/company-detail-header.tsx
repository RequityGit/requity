"use client";

import {
  Phone,
  Mail,
  Globe,
  MapPin,
  ExternalLink,
  Check,
  X,
  AlertCircle,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DotPill } from "@/components/crm/contact-360/contact-detail-shared";
import { relTime } from "@/components/crm/contact-360/contact-detail-shared";
import { formatDate } from "@/lib/format";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import type { CompanyDetailData } from "./types";
import { COMPANY_TYPE_CONFIG, SUBTYPE_LABELS } from "./types";

interface CompanyDetailHeaderProps {
  company: CompanyDetailData;
  primaryContact: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    user_function: string | null;
  } | null;
  lastActivityAt: string | null;
}

function computeNdaStatus(company: CompanyDetailData) {
  if (!company.nda_created_date) {
    return { label: "NDA Missing", color: "#E5453D", Icon: X };
  }
  if (!company.nda_expiration_date) {
    return { label: "NDA On File", color: "#22A861", Icon: Check };
  }
  const exp = new Date(company.nda_expiration_date);
  const now = new Date();
  if (exp < now) {
    return { label: "NDA Expired", color: "#E5453D", Icon: AlertCircle };
  }
  const daysLeft = Math.floor(
    (exp.getTime() - now.getTime()) / 86400000
  );
  if (daysLeft < 45) {
    return {
      label: `NDA Expires ${formatDate(company.nda_expiration_date)}`,
      color: "#E5930E",
      Icon: AlertCircle,
    };
  }
  return { label: "NDA On File", color: "#22A861", Icon: Check };
}

export function CompanyDetailHeader({
  company,
  primaryContact,
  lastActivityAt,
}: CompanyDetailHeaderProps) {
  const typeCfg = COMPANY_TYPE_CONFIG[company.company_type] ||
    COMPANY_TYPE_CONFIG.other;

  const initials = company.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const ndaStatus = computeNdaStatus(company);
  const NdaIcon = ndaStatus.Icon;

  const pcName = primaryContact
    ? [primaryContact.first_name, primaryContact.last_name]
        .filter(Boolean)
        .join(" ")
    : null;
  const pcInitials = primaryContact
    ? [primaryContact.first_name?.[0], primaryContact.last_name?.[0]]
        .filter(Boolean)
        .join("")
        .toUpperCase()
    : null;

  return (
    <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 mb-5">
      <div className="flex gap-4 items-start">
        {/* Avatar */}
        <Avatar
          className="h-14 w-14 rounded-lg shrink-0"
          style={{ backgroundColor: `${typeCfg.color}10` }}
        >
          <AvatarFallback
            className="rounded-lg text-base font-semibold"
            style={{ color: typeCfg.color, backgroundColor: `${typeCfg.color}10` }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {/* Name + Pills */}
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-[22px] font-bold text-[#1A1A1A] leading-tight m-0">
              {company.name}
            </h1>
            <DotPill color={typeCfg.color} label={typeCfg.label} small />
            {company.company_subtype && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                style={{
                  backgroundColor: `${typeCfg.color}14`,
                  color: typeCfg.color,
                }}
              >
                {SUBTYPE_LABELS[company.company_subtype] ||
                  company.company_subtype}
              </span>
            )}
            <DotPill
              color={company.is_active ? "#22A861" : "#8B8B8B"}
              label={company.is_active ? "Active" : "Inactive"}
              small
            />
          </div>

          {/* Other names */}
          {company.other_names && (
            <div className="text-xs text-[#8B8B8B] mb-1.5">
              Also known as: {company.other_names}
            </div>
          )}

          {/* Contact info row */}
          <div className="flex items-center gap-4 flex-wrap mb-3">
            {company.phone && (
              <ClickToCallNumber number={company.phone} className="text-[13px]" />
            )}
            {company.email && (
              <span className="flex items-center gap-1.5 text-[13px] text-[#6B6B6B]">
                <Mail size={13} strokeWidth={1.5} /> {company.email}
              </span>
            )}
            {company.website && (
              <a
                href={
                  company.website.startsWith("http")
                    ? company.website
                    : `https://${company.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[13px] text-[#3B82F6] hover:underline"
              >
                <Globe size={13} strokeWidth={1.5} />{" "}
                {company.website.replace(/^https?:\/\//, "")}{" "}
                <ExternalLink size={11} strokeWidth={1.5} />
              </a>
            )}
            {company.address_line1 && (
              <span className="flex items-center gap-1.5 text-[13px] text-[#6B6B6B]">
                <MapPin size={13} strokeWidth={1.5} />{" "}
                {company.address_line1}
                {company.address_line2 ? `, ${company.address_line2}` : ""}
                {company.city ? `, ${company.city}` : ""}
                {company.state ? `, ${company.state}` : ""}{" "}
                {company.zip || ""}
              </span>
            )}
          </div>

          {/* Document status badges */}
          <div className="flex gap-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
              style={{
                backgroundColor: `${ndaStatus.color}14`,
                color: ndaStatus.color,
              }}
            >
              <NdaIcon size={10} strokeWidth={1.5} /> {ndaStatus.label}
            </span>
            <span
              className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
              style={{
                backgroundColor: company.fee_agreement_on_file
                  ? "#22A86114"
                  : "#E5453D14",
                color: company.fee_agreement_on_file ? "#22A861" : "#E5453D",
              }}
            >
              {company.fee_agreement_on_file ? (
                <Check size={10} strokeWidth={1.5} />
              ) : (
                <X size={10} strokeWidth={1.5} />
              )}
              {company.fee_agreement_on_file
                ? "Fee Agreement On File"
                : "Fee Agreement Missing"}
            </span>
            {company.company_type === "title_company" && (
              <span
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap"
                style={{
                  backgroundColor: company.title_company_verified
                    ? "#22A86114"
                    : "#E5930E14",
                  color: company.title_company_verified
                    ? "#22A861"
                    : "#E5930E",
                }}
              >
                {company.title_company_verified ? (
                  <Check size={10} strokeWidth={1.5} />
                ) : (
                  <AlertCircle size={10} strokeWidth={1.5} />
                )}
                {company.title_company_verified
                  ? "Verified Title Co."
                  : "Title Co. Unverified"}
              </span>
            )}
          </div>
        </div>

        {/* Right side — primary contact & timestamps */}
        <div className="text-right shrink-0">
          {pcName && (
            <>
              <div className="text-[11px] text-[#8B8B8B] mb-0.5 uppercase tracking-wide font-medium">
                Primary Contact
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="rounded-md bg-[#1A1A1A]/[0.06] text-[#1A1A1A] text-[9px] font-semibold">
                    {pcInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-medium">{pcName}</span>
              </div>
              {primaryContact?.user_function && (
                <div className="text-[11px] text-[#8B8B8B] mt-0.5">
                  {primaryContact.user_function}
                </div>
              )}
            </>
          )}
          <div className="mt-2.5 text-[11px] text-[#8B8B8B]">
            Last Contact: {relTime(lastActivityAt)}
          </div>
          {company.source && (
            <div className="mt-1.5 text-[11px] text-[#8B8B8B]">
              Source: {company.source}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
