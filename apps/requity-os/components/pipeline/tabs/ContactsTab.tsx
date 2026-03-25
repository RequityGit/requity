"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2,
  User,
  X,
  Loader2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { updateUwDataAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import type {
  UnifiedDeal,
  UwFieldDef,
} from "@/components/pipeline/pipeline-types";
import { UwField } from "../UwField";
import { useUwFieldConfigs } from "@/hooks/useUwFieldConfigs";
import type { VisibilityContext } from "@/lib/visibility-engine";
import { showSuccess, showError } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { RelationshipPicker } from "@/components/shared/RelationshipPicker";
import type { ContactSearchResult } from "@/lib/actions/relationship-actions";
import {
  fetchDealContacts,
  addDealContact,
  removeDealContact,
  updateDealContact,
  type DealContact,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";

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
  contactRoles?: string[];
  visibilityContext?: VisibilityContext | null;
}

function contactDisplayName(c: {
  first_name?: string | null;
  last_name?: string | null;
}): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
}

// ─── Contact Card ───

function DealContactCard({
  dc,
  dealId,
  onUpdated,
}: {
  dc: DealContact;
  dealId: string;
  onUpdated: () => void;
}) {
  const [removing, startRemove] = useTransition();
  const [updating, startUpdate] = useTransition();

  const name = dc.contact
    ? contactDisplayName(dc.contact)
    : "Unknown Contact";

  function handleRemove() {
    startRemove(async () => {
      const result = await removeDealContact(dealId, dc.contact_id);
      if (result.error) {
        showError("Could not remove contact", result.error);
      } else {
        showSuccess(`Removed ${name}`);
        onUpdated();
      }
    });
  }

  function handleToggleRole() {
    const newRole = dc.role === "primary" ? "co_borrower" : "primary";
    startUpdate(async () => {
      const result = await updateDealContact(dealId, dc.contact_id, {
        role: newRole,
      });
      if (result.error) {
        showError("Could not update contact role", result.error);
      } else {
        onUpdated();
      }
    });
  }

  function handleToggleGuarantor(checked: boolean) {
    startUpdate(async () => {
      const result = await updateDealContact(dealId, dc.contact_id, {
        is_guarantor: checked,
      });
      if (result.error) {
        showError("Could not update guarantor status", result.error);
      } else {
        onUpdated();
      }
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
        <User className="h-4 w-4 text-primary" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Link
            href={`/contacts/${dc.contact_id}`}
            className="truncate text-sm font-medium hover:underline"
          >
            {name}
          </Link>
          <button
            onClick={handleToggleRole}
            disabled={updating}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer",
              dc.role === "primary"
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:bg-muted/50"
            )}
          >
            {updating ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : dc.role === "primary" ? (
              <>Primary</>
            ) : (
              <>Co-Borrower</>
            )}
          </button>
        </div>

        <div className="mt-0.5 flex items-center gap-3 text-[11px] text-muted-foreground">
          {dc.contact?.email && (
            <span className="truncate">{dc.contact.email}</span>
          )}
          {dc.borrower?.credit_score && (
            <span className="num">
              FICO: {dc.borrower.credit_score}
            </span>
          )}
          {dc.borrower?.experience_count != null &&
            dc.borrower.experience_count > 0 && (
              <span className="num">
                Exp: {dc.borrower.experience_count}
              </span>
            )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <Checkbox
            checked={dc.is_guarantor}
            onCheckedChange={(checked) =>
              handleToggleGuarantor(checked === true)
            }
            disabled={updating}
            className="h-3.5 w-3.5"
          />
          <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-0.5">
            <Shield className="h-2.5 w-2.5" strokeWidth={1.5} />
            Guarantor
          </span>
        </label>
      </div>

      <button
        onClick={handleRemove}
        disabled={removing}
        className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer bg-transparent border-0"
      >
        {removing ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        )}
      </button>
    </div>
  );
}

// ─── Main Component ───

export function ContactsTab({
  deal,
  dealId,
  uwData,
  contactRoles = [],
  visibilityContext,
}: ContactsTabProps) {
  const [dealContacts, setDealContacts] = useState<DealContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [localData, setLocalData] = useState<Record<string, unknown>>(uwData);
  const [pending, startTransition] = useTransition();

  const { byObject } = useUwFieldConfigs(visibilityContext);
  const borrowerFields = byObject.borrower;
  const fieldMap = new Map(borrowerFields.map((f) => [f.key, f]));

  const loadContacts = useCallback(async () => {
    const { dealContacts: contacts, error } = await fetchDealContacts(dealId);
    if (error) {
      showError("Could not load contacts", error);
    }
    setDealContacts(contacts);
    setLoading(false);
  }, [dealId]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

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
        showError(`Could not save ${key}`, result.error);
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
      <div className="rq-card-wrapper rq-card">
        <h4 className="rq-micro-label mb-4">
          {title}
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2.5">
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

  const company = deal.company;
  const hasRoles = contactRoles.length > 0;
  const hasFields = borrowerFields.length > 0;
  const existingContactIds = new Set(dealContacts.map((dc) => dc.contact_id));
  const atMax = dealContacts.length >= 5;

  return (
    <div className="space-y-6">
      {/* Contact Roles */}
      {hasRoles && (
        <div className="flex flex-wrap gap-1.5">
          {contactRoles.map((role: string) => (
            <Badge key={role} variant="outline" className="text-xs">
              {ROLE_LABELS[role] ?? role}
            </Badge>
          ))}
        </div>
      )}

      {/* Linked Contacts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="rq-micro-label">
            Borrowers / Signers
            {dealContacts.length > 0 && (
              <span className="ml-1.5 text-muted-foreground/60 num">
                ({dealContacts.length}/5)
              </span>
            )}
          </h3>
          <RelationshipPicker
            entityType="contact"
            excludeIds={Array.from(existingContactIds)}
            placeholder="Search contacts..."
            disabled={atMax}
            onSelect={async (entity) => {
              const contact = entity as ContactSearchResult;
              const result = await addDealContact(dealId, contact.id, "co_borrower");
              if (result.error) {
                showError("Could not add contact", result.error);
              } else {
                const name = contactDisplayName(contact);
                showSuccess(`Added ${name}`);
                loadContacts();
              }
            }}
            onCreate={async (entity) => {
              const contact = entity as ContactSearchResult;
              const result = await addDealContact(dealId, contact.id, "co_borrower");
              if (result.error) {
                showError("Could not add contact", result.error);
              } else {
                const name = contactDisplayName(contact);
                showSuccess(`Added ${name}`);
                loadContacts();
              }
            }}
          />
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted/50 animate-pulse"
              />
            ))}
          </div>
        ) : dealContacts.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <User className="mx-auto h-6 w-6 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No contacts linked to this deal yet.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Add up to 5 borrowers or signers using the button above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {dealContacts.map((dc) => (
              <DealContactCard
                key={dc.id}
                dc={dc}
                dealId={dealId}
                onUpdated={loadContacts}
              />
            ))}
          </div>
        )}
      </div>

      {/* Company */}
      {company && (
        <div className="rq-card-wrapper rq-card">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/companies/${company.id}`}
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
      )}

      {/* Borrower Detail Fields */}
      {hasFields && (
        <div className="space-y-4">
          {renderFieldSection(
            "Borrower Details",
            borrowerFields.map((f) => f.key)
          )}
        </div>
      )}
    </div>
  );
}
