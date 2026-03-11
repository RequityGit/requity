"use client";

import {
  Phone,
  Mail,
  Globe,
  MapPin,
  ExternalLink,
  Check,
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
  action?: React.ReactNode;
}

export function CompanyDetailHeader({
  company,
  primaryContact,
  lastActivityAt,
  action,
}: CompanyDetailHeaderProps) {
  const types = company.company_types?.length
    ? company.company_types
    : [company.company_type];
  const typeCfg = COMPANY_TYPE_CONFIG[types[0]] ||
    COMPANY_TYPE_CONFIG.other;

  const initials = company.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
    <div className="bg-card border border-border rounded-xl p-6 mb-5">
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
            <h1 className="text-[22px] font-bold text-foreground leading-tight m-0">
              {company.name}
            </h1>
            {types.map((t) => {
              const cfg = COMPANY_TYPE_CONFIG[t] || COMPANY_TYPE_CONFIG.other;
              return <DotPill key={t} color={cfg.color} label={cfg.label} small />;
            })}
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
            <div className="text-xs text-muted-foreground mb-1.5">
              Also known as: {company.other_names}
            </div>
          )}

          {/* Contact info row */}
          <div className="flex items-center gap-4 flex-wrap mb-3">
            {company.phone && (
              <ClickToCallNumber number={company.phone} className="text-[13px]" />
            )}
            {company.email && (
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
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
              <span className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
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
            {types.includes("title_company") && (
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

        {/* Right side — action + primary contact & timestamps */}
        <div className="text-right shrink-0">
          {action && <div className="mb-2 flex justify-end">{action}</div>}
          {pcName && (
            <>
              <div className="text-[11px] text-muted-foreground mb-0.5 uppercase tracking-wide font-medium">
                Primary Contact
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[9px] font-semibold">
                    {pcInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[13px] font-medium">{pcName}</span>
              </div>
              {primaryContact?.user_function && (
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  {primaryContact.user_function}
                </div>
              )}
            </>
          )}
          <div className="mt-2.5 text-[11px] text-muted-foreground">
            Last Contact: {relTime(lastActivityAt)}
          </div>
          {company.source && (
            <div className="mt-1.5 text-[11px] text-muted-foreground">
              Source: {company.source}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
