"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Mail,
  Phone,
  PhoneCall,
  Edit3,
  CheckCircle2,
  MoreHorizontal,
  MapPin,
} from "lucide-react";
import { DotPill, OutlinedPill, relTime } from "./contact-detail-shared";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { formatDate } from "@/lib/format";
import type { ContactData, CompanyData } from "./types";
import {
  RATING_CONFIG,
  CONTACT_STATUS_CONFIG,
  LIFECYCLE_CONFIG,
} from "./types";

interface ContactDetailHeaderProps {
  contact: ContactData;
  fullName: string;
  company: CompanyData | null;
  assignedToName: string | null;
  currentUserId: string;
  currentUserName: string;
}

export function ContactDetailHeader({
  contact,
  fullName,
  company,
  assignedToName,
  currentUserId,
  currentUserName,
}: ContactDetailHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [logging, setLogging] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

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

  async function handleLogCall() {
    setLogging(true);
    try {
      const supabase = createClient();
      await supabase.from("crm_activities").insert({
        contact_id: contact.id,
        activity_type: "call" as never,
        subject: "Phone call logged",
        performed_by: currentUserId,
      });
      await supabase
        .from("crm_contacts")
        .update({ last_contacted_at: new Date().toISOString() })
        .eq("id", contact.id);
      toast({ title: "Call logged" });
      router.refresh();
    } catch {
      toast({ title: "Error logging call", variant: "destructive" });
    } finally {
      setLogging(false);
    }
  }

  const ratingCfg = contact.rating ? RATING_CONFIG[contact.rating] : null;
  const statusColor = contact.status ? CONTACT_STATUS_CONFIG[contact.status] : null;
  const lifecycleCfg = contact.lifecycle_stage
    ? LIFECYCLE_CONFIG[contact.lifecycle_stage]
    : null;

  const addressParts = [
    contact.address_line1,
    contact.address_line2,
    [contact.city, contact.state].filter(Boolean).join(", "),
    contact.zip,
  ]
    .filter(Boolean)
    .join(", ");

  const isFollowUpPast =
    contact.next_follow_up_date &&
    new Date(contact.next_follow_up_date) < new Date();

  return (
    <div className="bg-white border border-[#E5E5E7] rounded-xl p-6 mb-5">
      <div className="flex gap-4 items-start">
        {/* Avatar */}
        <Avatar className="h-14 w-14 rounded-lg shrink-0">
          <AvatarFallback className="rounded-lg bg-[#1A1A1A]/[0.06] text-[#1A1A1A] text-lg font-semibold">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: Name + Pills */}
          <div className="flex items-center gap-2.5 flex-wrap mb-1">
            <h1 className="text-[22px] font-bold text-[#1A1A1A] leading-tight m-0">
              {fullName}
            </h1>
            {ratingCfg && (
              <DotPill color={ratingCfg.color} label={ratingCfg.label} small />
            )}
            {statusColor && contact.status && (
              <DotPill
                color={statusColor}
                label={contact.status.charAt(0).toUpperCase() + contact.status.slice(1)}
                small
              />
            )}
            {lifecycleCfg && (
              <DotPill color={lifecycleCfg.color} label={lifecycleCfg.label} small />
            )}
          </div>

          {/* Row 2: Function · Company */}
          <div className="flex items-center gap-1.5 mb-2">
            {contact.user_function && (
              <span className="text-[13px] text-[#6B6B6B]">{contact.user_function}</span>
            )}
            {contact.user_function && (company || contact.company_name) && (
              <span className="text-[#D5D5D5]">&middot;</span>
            )}
            {(company || contact.company_name) && (
              <span
                className="text-[13px] text-[#3B82F6] cursor-pointer hover:underline"
                onClick={() => {
                  if (company?.id) {
                    router.push(`/admin/crm/companies/${company.id}`);
                  }
                }}
              >
                {company?.name || contact.company_name}
              </span>
            )}
          </div>

          {/* Row 3: Contact info */}
          <div className="flex items-center gap-4 flex-wrap mb-3">
            {contact.email && (
              <span className="flex items-center gap-1.5 text-[13px] text-[#6B6B6B]">
                <Mail size={13} strokeWidth={1.5} />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <span className="flex items-center gap-1.5 text-[13px] text-[#6B6B6B]">
                <Phone size={13} strokeWidth={1.5} />
                {contact.phone}
              </span>
            )}
            {addressParts && (
              <span className="flex items-center gap-1.5 text-[13px] text-[#6B6B6B]">
                <MapPin size={13} strokeWidth={1.5} />
                {addressParts}
              </span>
            )}
          </div>

          {/* Row 4: Contact type pills */}
          {contact.contact_types && contact.contact_types.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {contact.contact_types.map((t) => (
                <OutlinedPill key={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </OutlinedPill>
              ))}
            </div>
          )}

          {/* Row 5: Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              size="sm"
              className="gap-1.5 rounded-lg bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90 text-xs"
              onClick={() => setEmailOpen(true)}
            >
              <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
              Email
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-[#E5E5E7] text-[#1A1A1A] text-xs"
              onClick={handleLogCall}
              disabled={logging}
            >
              <PhoneCall className="h-3.5 w-3.5" strokeWidth={1.5} />
              Call
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-[#E5E5E7] text-[#1A1A1A] text-xs"
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("tab", "activity");
                router.replace(`?${params.toString()}`, { scroll: false });
              }}
            >
              <Edit3 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Log Activity
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-[#E5E5E7] text-[#1A1A1A] text-xs"
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                params.set("tab", "tasks");
                router.replace(`?${params.toString()}`, { scroll: false });
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              New Task
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0 rounded-lg text-[#6B6B6B]"
            >
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>

        {/* Right side */}
        <div className="text-right shrink-0 hidden md:block">
          <div className="text-[11px] text-[#8B8B8B] uppercase tracking-wide mb-0.5">
            Assigned To
          </div>
          <div className="flex items-center gap-1.5 justify-end mb-2.5">
            {assignedInitials && (
              <Avatar className="h-6 w-6 rounded-md">
                <AvatarFallback className="rounded-md bg-[#1A1A1A]/[0.06] text-[#1A1A1A] text-[10px] font-semibold">
                  {assignedInitials}
                </AvatarFallback>
              </Avatar>
            )}
            <span className="text-[13px] font-medium text-[#1A1A1A]">
              {assignedToName || "Unassigned"}
            </span>
          </div>
          <div className="text-[11px] text-[#8B8B8B]">
            Last Contact: {relTime(contact.last_contacted_at)}
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

      <EmailComposeSheet
        open={emailOpen}
        onOpenChange={setEmailOpen}
        toEmail={contact.email || ""}
        toName={fullName}
        linkedContactId={contact.id}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />
    </div>
  );
}
