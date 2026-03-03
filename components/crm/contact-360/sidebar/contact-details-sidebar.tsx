"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import {
  Tag,
  User,
  Calendar,
  Clock,
  Shield,
  CalendarDays,
} from "lucide-react";
import { formatDate } from "@/lib/format";
import type { ContactData } from "../types";
import { MonoValue } from "../shared";

interface ContactDetailsSidebarProps {
  contact: ContactData;
  assignedToName: string | null;
  sourceLabel: string | null;
}

export function ContactDetailsSidebar({
  contact,
  assignedToName,
  sourceLabel,
}: ContactDetailsSidebarProps) {
  const [marketingConsent, setMarketingConsent] = useState(
    contact.marketing_consent ?? false
  );
  const [updating, setUpdating] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function toggleConsent() {
    const newValue = !marketingConsent;
    setMarketingConsent(newValue);
    setUpdating(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("crm_contacts")
        .update({ marketing_consent: newValue })
        .eq("id", contact.id);
      if (error) throw error;
      router.refresh();
    } catch {
      setMarketingConsent(!newValue); // revert
      toast({
        title: "Error updating consent",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  }

  const isFollowUpOverdue =
    contact.next_follow_up_date &&
    new Date(contact.next_follow_up_date) < new Date();

  return (
    <Card className="rounded-xl border-[#E5E5E7] bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-[#1A1A1A]">
          Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Source */}
        <div className="flex items-start gap-3">
          <Tag className="h-4 w-4 text-[#9A9A9A] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-xs text-[#9A9A9A]">Source</p>
            <p className="text-sm font-medium text-[#1A1A1A]">
              {sourceLabel || "—"}
            </p>
          </div>
        </div>

        {/* Assigned To */}
        <div className="flex items-start gap-3">
          <User className="h-4 w-4 text-[#9A9A9A] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-xs text-[#9A9A9A]">Assigned To</p>
            <p className="text-sm font-medium text-[#1A1A1A]">
              {assignedToName || "Unassigned"}
            </p>
          </div>
        </div>

        {/* Next Follow-Up */}
        <div className="flex items-start gap-3">
          <Calendar
            className={`h-4 w-4 shrink-0 mt-0.5 ${
              isFollowUpOverdue ? "text-[#E5453D]" : "text-[#9A9A9A]"
            }`}
            strokeWidth={1.5}
          />
          <div>
            <p className="text-xs text-[#9A9A9A]">Next Follow-Up</p>
            <p
              className={`text-sm font-medium ${
                isFollowUpOverdue ? "text-[#E5453D]" : "text-[#1A1A1A]"
              }`}
            >
              <MonoValue>
                {contact.next_follow_up_date
                  ? formatDate(contact.next_follow_up_date)
                  : "—"}
              </MonoValue>
              {isFollowUpOverdue && (
                <span className="text-xs ml-1">(Overdue)</span>
              )}
            </p>
          </div>
        </div>

        {/* Last Contacted */}
        <div className="flex items-start gap-3">
          <Clock className="h-4 w-4 text-[#9A9A9A] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-xs text-[#9A9A9A]">Last Contacted</p>
            <p className="text-sm font-medium text-[#1A1A1A]">
              <MonoValue>
                {formatDate(contact.last_contacted_at)}
              </MonoValue>
            </p>
          </div>
        </div>

        {/* Added Date */}
        <div className="flex items-start gap-3">
          <CalendarDays className="h-4 w-4 text-[#9A9A9A] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div>
            <p className="text-xs text-[#9A9A9A]">Added</p>
            <p className="text-sm font-medium text-[#1A1A1A]">
              <MonoValue>{formatDate(contact.created_at)}</MonoValue>
            </p>
          </div>
        </div>

        {/* Marketing Consent */}
        <div className="flex items-start gap-3">
          <Shield className="h-4 w-4 text-[#9A9A9A] shrink-0 mt-0.5" strokeWidth={1.5} />
          <div className="flex-1">
            <p className="text-xs text-[#9A9A9A]">Marketing Consent</p>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={toggleConsent}
                disabled={updating}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  marketingConsent ? "bg-[#22A861]" : "bg-[#E5E5E7]"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 rounded-full bg-white transition-transform ${
                    marketingConsent ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs text-[#6B6B6B]">
                {marketingConsent ? "Opted In" : "Not Opted In"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
