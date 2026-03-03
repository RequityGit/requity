"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Activity,
  Bell,
  Users,
  Globe,
  Hash,
  Mail,
  Calendar,
  CheckCircle2,
  PhoneCall,
  Plus,
} from "lucide-react";
import {
  SectionCard,
  FieldRow,
  DotPill,
  MonoValue,
  relTime,
} from "./contact-detail-shared";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { formatDate } from "@/lib/format";
import type { ContactData, RelationshipData } from "./types";

interface ContactDetailSidebarProps {
  contact: ContactData;
  relationships: RelationshipData[];
  assignedToName: string | null;
  sourceLabel: string | null;
  currentUserId: string;
  currentUserName: string;
}

export function ContactDetailSidebar({
  contact,
  relationships,
  assignedToName,
  sourceLabel,
  currentUserId,
  currentUserName,
}: ContactDetailSidebarProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [emailOpen, setEmailOpen] = useState(false);
  const [logging, setLogging] = useState(false);

  const fullName = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .join(" ") || "Unnamed";

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

  return (
    <div className="flex flex-col gap-4">
      {/* Quick Actions */}
      <SectionCard title="Quick Actions" icon={Activity}>
        <div className="flex flex-col gap-2">
          {[
            { icon: Mail, label: "Send Email", onClick: () => setEmailOpen(true) },
            { icon: Calendar, label: "Schedule Meeting", onClick: () => toast({ title: "Coming soon" }) },
            { icon: CheckCircle2, label: "Create Task", onClick: () => {
              const params = new URLSearchParams(window.location.search);
              params.set("tab", "tasks");
              router.replace(`?${params.toString()}`, { scroll: false });
            }},
            { icon: PhoneCall, label: "Log Call", onClick: handleLogCall },
            { icon: Plus, label: "New Opportunity", onClick: () => toast({ title: "Coming soon" }) },
          ].map(({ icon: I, label, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={logging && label === "Log Call"}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-[#F0F0F0] bg-[#FAFAFA] cursor-pointer text-[13px] text-[#1A1A1A] font-normal transition-all duration-150 hover:bg-[#F0F0F0] disabled:opacity-50"
            >
              <I size={14} className="text-[#6B6B6B]" strokeWidth={1.5} />
              {label}
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Followers */}
      <SectionCard
        title="Followers"
        icon={Bell}
        action={
          <Button variant="ghost" size="sm" className="gap-1 text-xs h-7 text-[#6B6B6B]">
            <Plus size={12} strokeWidth={1.5} /> Add
          </Button>
        }
      >
        <div className="flex gap-2 flex-wrap">
          {assignedToName && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F7F7F8]">
              <Avatar className="h-[22px] w-[22px] rounded-md">
                <AvatarFallback className="rounded-md bg-[#1A1A1A]/[0.06] text-[#1A1A1A] text-[9px] font-semibold">
                  {assignedToName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs font-medium">{assignedToName.split(" ")[0]}</span>
            </div>
          )}
        </div>
      </SectionCard>

      {/* Relationships */}
      <SectionCard title="Relationships" icon={Users}>
        {relationships.length === 0 ? (
          <p className="text-xs text-[#8B8B8B]">No relationships defined.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {relationships.map((r, i) => (
              <div
                key={r.id}
                className="flex justify-between items-center py-1.5"
                style={{
                  borderBottom:
                    i < relationships.length - 1 ? "1px solid #F7F7F8" : "none",
                }}
              >
                <DotPill
                  color={r.is_active ? "#22A861" : "#8B8B8B"}
                  label={r.relationship_type.charAt(0).toUpperCase() + r.relationship_type.slice(1)}
                  small
                />
                <span className="text-[11px] text-[#8B8B8B]">
                  Since {formatDate(r.started_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Communication */}
      <SectionCard title="Communication" icon={Globe}>
        <div className="flex flex-col gap-0.5">
          <FieldRow
            label="Language"
            value={
              contact.language_preference
                ? contact.language_preference.charAt(0).toUpperCase() +
                  contact.language_preference.slice(1)
                : "—"
            }
          />
          <FieldRow
            label="Marketing Consent"
            value={contact.marketing_consent ? "Yes" : "No"}
          />
          <FieldRow label="Do Not Contact" value={contact.dnc ? "Yes" : "No"} />
          <FieldRow
            label="Source"
            value={sourceLabel || (contact.source ? contact.source.charAt(0).toUpperCase() + contact.source.slice(1) : "—")}
          />
        </div>
      </SectionCard>

      {/* System Info */}
      <SectionCard title="System Info" icon={Hash}>
        <div className="flex flex-col gap-0.5">
          <FieldRow label="Created" value={formatDate(contact.created_at)} />
          <FieldRow label="Updated" value={relTime(contact.updated_at)} />
          <FieldRow
            label="Contact ID"
            value={<MonoValue className="text-xs">{contact.id.slice(0, 8)}...</MonoValue>}
            mono
          />
        </div>
      </SectionCard>

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
