"use client";

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2,
  User,
  Plus,
  X,
  Search,
  Loader2,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { updateUwDataAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import type {
  UnifiedCardType,
  UnifiedDeal,
  UwFieldDef,
} from "@/components/pipeline/pipeline-types";
import { UwField } from "../UwField";
import { useUwFieldConfigs } from "@/hooks/useUwFieldConfigs";
import type { VisibilityContext } from "@/lib/visibility-engine";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/useDebounce";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import {
  fetchDealContacts,
  searchContactsForDeal,
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
  cardType: UnifiedCardType;
  visibilityContext?: VisibilityContext | null;
}

interface SearchResult {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name: string | null;
}

function contactDisplayName(c: {
  first_name?: string | null;
  last_name?: string | null;
}): string {
  return [c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown";
}

// ─── Contact Search Combobox ───

function ContactSearchCombobox({
  dealId,
  existingContactIds,
  onAdded,
  disabled,
}: {
  dealId: string;
  existingContactIds: Set<string>;
  onAdded: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  const debouncedQuery = useDebounce(query, 250);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    let cancelled = false;
    async function search() {
      setSearching(true);
      const { contacts } = await searchContactsForDeal(debouncedQuery);
      if (!cancelled) {
        setResults(contacts as SearchResult[]);
        setHighlightIndex(-1);
        setSearching(false);
      }
    }
    search();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const handleSelect = useCallback(
    async (contact: SearchResult) => {
      if (existingContactIds.has(contact.id)) return;
      setAdding(contact.id);
      const result = await addDealContact(dealId, contact.id, "co_borrower");
      setAdding(null);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`Added ${contactDisplayName(contact)}`);
        setQuery("");
        setResults([]);
        setOpen(false);
        onAdded();
      }
    },
    [dealId, existingContactIds, onAdded]
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    const filtered = results.filter((r) => !existingContactIds.has(r.id));
    if (filtered.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
      );
    } else if (e.key === "Enter" && highlightIndex >= 0) {
      e.preventDefault();
      handleSelect(filtered[highlightIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer",
            disabled && "opacity-50 cursor-not-allowed"
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          Add Contact
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0"
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder="Search contacts by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-7 border-0 p-0 text-sm shadow-none focus-visible:ring-0"
            autoComplete="off"
          />
          {searching && (
            <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="max-h-[220px] overflow-y-auto p-1">
          {results.length === 0 && query.length >= 2 && !searching && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              No contacts found
            </div>
          )}
          {results.length === 0 && query.length < 2 && (
            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}
          {results.map((contact, index) => {
            const alreadyLinked = existingContactIds.has(contact.id);
            return (
              <button
                key={contact.id}
                type="button"
                disabled={alreadyLinked || adding === contact.id}
                className={cn(
                  "relative flex w-full select-none items-center gap-2.5 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                  alreadyLinked
                    ? "opacity-40 cursor-not-allowed"
                    : "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                  highlightIndex === index &&
                    !alreadyLinked &&
                    "bg-accent text-accent-foreground"
                )}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => !alreadyLinked && handleSelect(contact)}
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                  {adding === contact.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="truncate font-medium">
                    {contactDisplayName(contact)}
                    {alreadyLinked && (
                      <span className="ml-1.5 text-[10px] text-muted-foreground">
                        (already linked)
                      </span>
                    )}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    {contact.email}
                    {contact.company_name && ` - ${contact.company_name}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
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
        toast.error(result.error);
      } else {
        toast.success(`Removed ${name}`);
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
        toast.error(result.error);
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
        toast.error(result.error);
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
  cardType,
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
      toast.error(`Failed to load contacts: ${error}`);
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
  const hasRoles = cardType.contact_roles.length > 0;
  const hasFields = borrowerFields.length > 0;
  const existingContactIds = new Set(dealContacts.map((dc) => dc.contact_id));
  const atMax = dealContacts.length >= 5;

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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Borrowers / Signers
            {dealContacts.length > 0 && (
              <span className="ml-1.5 text-muted-foreground/60 num">
                ({dealContacts.length}/5)
              </span>
            )}
          </h3>
          <ContactSearchCombobox
            dealId={dealId}
            existingContactIds={existingContactIds}
            onAdded={loadContacts}
            disabled={atMax}
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
        <div className="rounded-xl border bg-card p-5">
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
