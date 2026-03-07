"use client";

import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Circle } from "lucide-react";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import { formatDate } from "@/lib/format";
import { relTime } from "./contact-detail-shared";
import type { ContactData, CompanyData } from "./types";
import {
  RATING_CONFIG,
  LIFECYCLE_CONFIG,
  RELATIONSHIP_BADGE_COLORS,
} from "./types";

interface ContactDetailHeaderProps {
  contact: ContactData;
  fullName: string;
  company: CompanyData | null;
  assignedToName: string | null;
  contactTypes: string[];
}

export function ContactDetailHeader({
  contact,
  fullName,
  company,
  assignedToName,
  contactTypes,
}: ContactDetailHeaderProps) {
  const router = useRouter();

  const initials = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  const assignedInitials = assignedToName
    ? assignedToName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;

  const lifecycleCfg = contact.lifecycle_stage
    ? LIFECYCLE_CONFIG[contact.lifecycle_stage]
    : null;

  const isActive =
    contact.status === "active" || contact.lifecycle_stage === "active";

  const isFollowUpPast =
    contact.next_follow_up_date &&
    new Date(contact.next_follow_up_date) < new Date();

  return (
    <Card className="rounded-xl border-border bg-card">
      <CardContent className="p-6 pt-6">
        <div className="flex gap-4 items-start">
          {/* Avatar */}
          <Avatar className="h-11 w-11 rounded-lg shrink-0">
            <AvatarFallback className="rounded-lg bg-foreground/[0.06] text-foreground text-sm font-bold">
              {initials || "?"}
            </AvatarFallback>
          </Avatar>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Row 1: Name + Status Badge */}
            <div className="flex items-center gap-2.5 flex-wrap mb-1">
              <h1 className="text-lg font-bold text-foreground tracking-tight m-0">
                {fullName}
              </h1>
              {isActive ? (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1.5 hover:bg-emerald-50">
                  <Circle
                    className="h-1.5 w-1.5 fill-emerald-500"
                    strokeWidth={0}
                  />
                  Active
                </Badge>
              ) : contact.status ? (
                <Badge variant="secondary" className="gap-1.5">
                  <Circle
                    className="h-1.5 w-1.5 fill-muted-foreground"
                    strokeWidth={0}
                  />
                  {contact.status.charAt(0).toUpperCase() +
                    contact.status.slice(1)}
                </Badge>
              ) : null}
              {lifecycleCfg && contact.lifecycle_stage !== "active" && (
                <Badge
                  variant="outline"
                  className="gap-1.5"
                  style={{
                    color: lifecycleCfg.color,
                    borderColor: `${lifecycleCfg.color}40`,
                  }}
                >
                  {lifecycleCfg.label}
                </Badge>
              )}
              {contact.rating && RATING_CONFIG[contact.rating] && (
                <Badge
                  variant="outline"
                  style={{
                    color: RATING_CONFIG[contact.rating].color,
                    borderColor: `${RATING_CONFIG[contact.rating].color}40`,
                    backgroundColor: `${RATING_CONFIG[contact.rating].color}08`,
                  }}
                >
                  {RATING_CONFIG[contact.rating].label}
                </Badge>
              )}
            </div>

            {/* Row 2: Email */}
            {contact.email && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1.5">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {contact.email}
              </div>
            )}

            {/* Row 3: Contact info chips */}
            <div className="flex items-center gap-3 flex-wrap mb-2">
              {contact.phone && (
                <ClickToCallNumber number={contact.phone} />
              )}
              {(company || contact.company_name) && (
                <span
                  className="text-xs text-[#3B82F6] cursor-pointer hover:underline"
                  onClick={() => {
                    if (company?.id) {
                      router.push(`/admin/crm/companies/${company.id}`);
                    }
                  }}
                >
                  {company?.name || contact.company_name}
                </span>
              )}
              {(contact.city || contact.state) && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {[contact.city, contact.state].filter(Boolean).join(", ")}
                </span>
              )}
            </div>

            {/* Row 4: Tags / Contact Types */}
            {contactTypes.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {contactTypes.map((type) => {
                  const key = type.toLowerCase();
                  const colors = RELATIONSHIP_BADGE_COLORS[key];
                  if (colors) {
                    return (
                      <Badge
                        key={type}
                        variant="outline"
                        style={{
                          color: colors.text,
                          borderColor: `${colors.text}30`,
                          backgroundColor: colors.bg,
                        }}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Badge>
                    );
                  }
                  return (
                    <Badge key={type} variant="secondary">
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right side — Assigned To */}
          <div className="text-right shrink-0 hidden md:block">
            <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Assigned To
            </Label>
            <div className="flex items-center gap-1.5 justify-end mt-1 mb-2.5">
              {assignedInitials && (
                <Avatar className="h-6 w-6 rounded-md">
                  <AvatarFallback className="rounded-md bg-foreground/[0.06] text-foreground text-[10px] font-semibold">
                    {assignedInitials}
                  </AvatarFallback>
                </Avatar>
              )}
              <span className="text-[13px] font-medium text-foreground">
                {assignedToName || "Unassigned"}
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Last Contact:{" "}
              <span className="font-semibold">
                {relTime(contact.last_contacted_at)}
              </span>
            </div>
            {contact.next_follow_up_date && (
              <div
                className="text-[11px] mt-0.5"
                style={{
                  color: isFollowUpPast ? "#E5453D" : "#E5930E",
                }}
              >
                Follow-up: {formatDate(contact.next_follow_up_date)}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
