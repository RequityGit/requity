"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Mail, Phone, ChevronRight } from "lucide-react";
import { DotPill, relTime } from "@/components/crm/contact-360/contact-detail-shared";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";
import type { CompanyContactData } from "../types";

interface ContactsTabProps {
  contacts: CompanyContactData[];
  companyId: string;
  companyName: string;
  primaryContactId: string | null;
  teamMembers: { id: string; full_name: string }[];
  currentUserId: string;
}

export function CompanyContactsTab({
  contacts,
  companyId,
  companyName,
  primaryContactId,
  teamMembers,
  currentUserId,
}: ContactsTabProps) {
  const router = useRouter();
  // Sort: primary first, then alphabetical
  const sorted = [...contacts].sort((a, b) => {
    if (a.id === primaryContactId) return -1;
    if (b.id === primaryContactId) return 1;
    const nameA = [a.first_name, a.last_name].filter(Boolean).join(" ");
    const nameB = [b.first_name, b.last_name].filter(Boolean).join(" ");
    return nameA.localeCompare(nameB);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <span className="text-[13px] text-muted-foreground">
          {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
        </span>
        <AddContactDialog
          teamMembers={teamMembers}
          currentUserId={currentUserId}
          preselectedCompanyId={companyId}
          preselectedCompanyName={companyName}
          trigger={
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-lg border-border text-xs"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
              Add Contact
            </Button>
          }
          onSuccess={() => router.refresh()}
        />
      </div>

      {contacts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted mb-4">
            <Phone className="h-6 w-6 text-muted-foreground" strokeWidth={1.5} />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">
            No contacts
          </h3>
          <p className="text-sm text-muted-foreground">
            Link contacts to this company to track your relationships.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map((ct) => {
            const name = [ct.first_name, ct.last_name]
              .filter(Boolean)
              .join(" ");
            const initials = [ct.first_name?.[0], ct.last_name?.[0]]
              .filter(Boolean)
              .join("")
              .toUpperCase();
            const isPrimary = ct.id === primaryContactId;

            return (
              <Link
                key={ct.id}
                href={`/contacts/${ct.contact_number}`}
                className="bg-card border border-border rounded-xl p-4 flex items-center gap-3.5 cursor-pointer hover:border-[#D0D0D0] transition-all duration-150"
              >
                <Avatar className="h-10 w-10 rounded-lg shrink-0">
                  <AvatarFallback className="rounded-lg bg-foreground/[0.06] text-foreground text-xs font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-foreground">
                      {name}
                    </span>
                    {isPrimary && (
                      <DotPill color="#3B82F6" label="Primary" small />
                    )}
                  </div>
                  {ct.user_function && (
                    <div className="text-xs text-muted-foreground mb-1">
                      {ct.user_function}
                    </div>
                  )}
                  <div className="flex items-center gap-3.5 text-xs text-muted-foreground">
                    {ct.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={11} strokeWidth={1.5} /> {ct.email}
                      </span>
                    )}
                    {ct.phone && (
                      <ClickToCallNumber number={ct.phone} className="text-xs" />
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-muted-foreground">Last contact</div>
                  <div className="text-xs font-medium">
                    {relTime(ct.last_contacted_at)}
                  </div>
                </div>
                <ChevronRight size={16} className="text-muted-foreground/50 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
