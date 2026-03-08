"use client";

import { Badge } from "@/components/ui/badge";
import { Building2, User, Mail, Phone } from "lucide-react";
import Link from "next/link";
import type { UnifiedDeal } from "@/components/pipeline-v2/pipeline-types";

interface ContactsTabProps {
  deal: UnifiedDeal;
}

export function ContactsTab({ deal }: ContactsTabProps) {
  const contact = deal.primary_contact;
  const company = deal.company;

  const hasContent = contact || company;

  if (!hasContent) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No contacts linked to this deal yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Contact */}
      {contact && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <User className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/contacts/${contact.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {contact.first_name} {contact.last_name}
                  </Link>
                  <Badge variant="outline" className="text-[10px]">
                    Primary Contact
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Company */}
      {company && (
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <Building2 className="h-4.5 w-4.5 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/companies/${company.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {company.name}
                  </Link>
                  <Badge variant="outline" className="text-[10px]">
                    Company
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Future: Additional contacts will be rendered here from deal_contacts junction table */}
    </div>
  );
}
