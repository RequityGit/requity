"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Building2, User } from "lucide-react";
import Link from "next/link";
import { updateUwDataAction } from "@/app/(authenticated)/admin/pipeline-v2/actions";
import type { UnifiedCardType, UnifiedDeal, UwFieldDef } from "@/components/pipeline-v2/pipeline-types";
import { UwField } from "../UwField";
import { toast } from "sonner";

const ROLE_LABELS: Record<string, string> = {
  borrower: "Borrower",
  guarantor: "Guarantor",
  sponsor: "Sponsor",
  attorney: "Attorney",
  broker: "Broker",
  property_manager: "Property Manager",
};

interface ContactsTabProps {
  deal: UnifiedDeal;
  dealId: string;
  uwData: Record<string, unknown>;
  cardType: UnifiedCardType;
}

export function ContactsTab({ deal, dealId, uwData, cardType }: ContactsTabProps) {
  const contact = deal.primary_contact;
  const company = deal.company;
  const [localData, setLocalData] = useState<Record<string, unknown>>(uwData);
  const [pending, startTransition] = useTransition();

  const fieldMap = new Map(cardType.contact_fields.map((f) => [f.key, f]));

  function handleFieldChange(key: string, value: unknown) {
    setLocalData((prev) => ({ ...prev, [key]: value }));
  }

  function handleFieldBlur(key: string) {
    const currentVal = localData[key];
    const prevVal = uwData[key];
    if (currentVal === prevVal) return;

    startTransition(async () => {
      const result = await updateUwDataAction(dealId, key, currentVal);
      if (result.error) {
        toast.error(`Failed to save ${key}: ${result.error}`);
        setLocalData((prev) => ({ ...prev, [key]: prevVal }));
      }
    });
  }

  function renderFieldSection(title: string, fieldKeys: string[]) {
    const fields = fieldKeys
      .map((key) => fieldMap.get(key))
      .filter((f): f is UwFieldDef => f != null);

    if (fields.length === 0) return null;

    return (
      <div className="rounded-xl border bg-card p-5">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
          {title}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
          {fields.map((field) => (
            <UwField
              key={field.key}
              field={field}
              value={localData[field.key] ?? null}
              onChange={(val) => handleFieldChange(field.key, val)}
              onBlur={() => handleFieldBlur(field.key)}
              disabled={pending}
            />
          ))}
        </div>
      </div>
    );
  }

  const hasContacts = contact || company;
  const hasRoles = cardType.contact_roles.length > 0;
  const hasFields = cardType.contact_fields.length > 0;

  return (
    <div className="space-y-6">
      {/* Contact Roles */}
      {hasRoles && (
        <div className="flex flex-wrap gap-1.5">
          {cardType.contact_roles.map((role) => (
            <Badge key={role} variant="outline" className="text-xs">
              {ROLE_LABELS[role] ?? role}
            </Badge>
          ))}
        </div>
      )}

      {/* Linked Contacts */}
      {hasContacts ? (
        <div className="space-y-4">
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
        </div>
      ) : (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No contacts linked to this deal yet.
          </p>
        </div>
      )}

      {/* Contact Financial Fields */}
      {hasFields && (
        <div className="space-y-4">
          {cardType.contact_field_groups.length > 0 ? (
            cardType.contact_field_groups.map((group) =>
              renderFieldSection(group.label, group.fields)
            )
          ) : (
            renderFieldSection(
              "Contact Details",
              cardType.contact_fields.map((f) => f.key)
            )
          )}
        </div>
      )}
    </div>
  );
}
