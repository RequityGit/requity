"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  Send,
  Phone,
  MessageSquare,
  DollarSign,
  TrendingUp,
  UserPlus,
  Mail,
  Building2,
  MapPin,
} from "lucide-react";
import { RelationshipBadge } from "./shared";
import { EmailComposeSheet } from "@/components/crm/email-compose-sheet";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import type { ContactData, CompanyData } from "./types";

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  showWhen: "always" | string[];
  primary?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  { id: "send_email", label: "Send Email", icon: Send, showWhen: "always", primary: true },
  { id: "log_call", label: "Log Call", icon: Phone, showWhen: "always" },
  { id: "add_note", label: "Add Note", icon: MessageSquare, showWhen: "always" },
  { id: "start_loan", label: "Start New Loan", icon: DollarSign, showWhen: ["borrower"] },
  { id: "new_investment", label: "New Investment", icon: TrendingUp, showWhen: ["investor"] },
  { id: "log_referral", label: "Log Referral", icon: UserPlus, showWhen: ["broker"] },
];

interface ContactHeaderProps {
  contact: ContactData;
  fullName: string;
  activeRelationships: string[];
  company: CompanyData | null;
  currentUserId: string;
  currentUserName: string;
}

export function ContactHeader({
  contact,
  fullName,
  activeRelationships,
  company,
  currentUserId,
  currentUserName,
}: ContactHeaderProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [logging, setLogging] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);

  const visibleActions = QUICK_ACTIONS.filter((action) => {
    if (action.showWhen === "always") return true;
    return action.showWhen.some((rel) => activeRelationships.includes(rel));
  });

  const initials = [contact.first_name, contact.last_name]
    .filter(Boolean)
    .map((n) => n!.charAt(0).toUpperCase())
    .join("");

  async function handleLogCall() {
    setLogging(true);
    try {
      const supabase = createClient();
      await supabase.from("crm_activities").insert({
        contact_id: contact.id,
        activity_type: "call" as never,
        subject: "Phone call logged",
        performed_by: undefined,
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

  function handleAction(actionId: string) {
    switch (actionId) {
      case "send_email":
        setEmailOpen(true);
        break;
      case "log_call":
        handleLogCall();
        break;
      case "add_note": {
        const params = new URLSearchParams(window.location.search);
        params.set("tab", "notes");
        router.replace(`?${params.toString()}`, { scroll: false });
        break;
      }
      case "start_loan": {
        const loanParams = new URLSearchParams();
        loanParams.set("new_loan", "true");
        if (contact.borrower_id) {
          loanParams.set("borrower_id", contact.borrower_id);
        }
        router.push(`/admin/loans?${loanParams.toString()}`);
        break;
      }
      default:
        toast({ title: `Action: ${actionId}`, description: "Coming soon" });
    }
  }

  const location = [contact.city, contact.state].filter(Boolean).join(", ");

  return (
    <div className="rounded-xl border border-[#E5E5E7] bg-white p-6">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Avatar className="h-14 w-14 rounded-[14px]">
          <AvatarFallback className="rounded-[14px] bg-[#F7F7F8] text-[#1A1A1A] text-lg font-semibold">
            {initials || "?"}
          </AvatarFallback>
        </Avatar>

        {/* Name + Badges + Contact Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-xl font-semibold text-[#1A1A1A]">{fullName}</h1>
            {activeRelationships.map((rel) => (
              <RelationshipBadge key={rel} type={rel} />
            ))}
          </div>

          {/* Contact meta line */}
          <div className="flex items-center gap-3 text-sm text-[#6B6B6B] flex-wrap">
            {company && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                {company.name}
              </span>
            )}
            {!company && contact.company_name && (
              <span className="flex items-center gap-1">
                <Building2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                {contact.company_name}
              </span>
            )}
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.5} />
                {contact.email}
              </span>
            )}
            {contact.phone && (
              <ClickToCallNumber number={contact.phone} />
            )}
            {location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" strokeWidth={1.5} />
                {location}
              </span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            {visibleActions.map((action) => {
              const Icon = action.icon;
              return (
                <Button
                  key={action.id}
                  variant={action.primary ? "default" : "outline"}
                  size="sm"
                  className={`gap-1.5 rounded-lg text-xs ${
                    action.primary
                      ? "bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
                      : "border-[#E5E5E7] text-[#1A1A1A] hover:bg-[#F7F7F8]"
                  }`}
                  onClick={() => handleAction(action.id)}
                  disabled={logging && action.id === "log_call"}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {action.label}
                </Button>
              );
            })}
          </div>
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
