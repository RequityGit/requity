"use client";

import { useState, useEffect, useMemo, useCallback, useRef, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InlineField } from "@/components/ui/inline-field";
import { AddressAutocomplete, type ParsedAddress } from "@/components/ui/address-autocomplete";
import { cn } from "@/lib/utils";
import { formatCurrency, formatPercent } from "@/lib/format";
import { updateUwDataAction, updateDealNameAction, updateContactFieldAction, linkDealContactAction, searchContactsForDealLink, quickCreateContactAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/useDebounce";
import { Search, X, Loader2, Plus, UserPlus } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { type UnifiedDeal, ASSET_CLASS_LABELS, ACTIVE_ASSET_CLASS_OPTIONS } from "./pipeline-types";
import { showSuccess, showError } from "@/lib/toast";

// Asset class dropdown: active options only (excludes legacy keys)
const ASSET_CLASS_DROPDOWN_LABELS = ACTIVE_ASSET_CLASS_OPTIONS.map((o) => o.label);
const AC_LABEL_TO_KEY = Object.fromEntries(
  ACTIVE_ASSET_CLASS_OPTIONS.map((o) => [o.label, o.key])
);
const AC_KEY_TO_LABEL = ASSET_CLASS_LABELS as Record<string, string>;

// Loan type dropdown: synced with opportunities.loan_type constraint
const LOAN_TYPE_MAP: Record<string, string> = {
  commercial_bridge: "Commercial Bridge",
  commercial_perm: "Commercial Perm",
  dscr: "DSCR",
  guc: "Ground-Up Construction",
  rtl: "Fix & Flip / RTL",
  transactional: "Transactional",
};
const LOAN_TYPE_LABELS = Object.values(LOAN_TYPE_MAP);
const LT_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(LOAN_TYPE_MAP).map(([k, v]) => [v, k])
);
const LT_KEY_TO_LABEL = LOAN_TYPE_MAP;

// Funding channel dropdown
const FUNDING_CHANNEL_MAP: Record<string, string> = {
  balance_sheet: "Balance Sheet",
  correspondent: "Correspondent",
  brokered: "Brokered",
};
const FUNDING_CHANNEL_LABELS = Object.values(FUNDING_CHANNEL_MAP);
const FUNDING_CHANNEL_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(FUNDING_CHANNEL_MAP).map(([k, v]) => [v, k])
);
const FUNDING_CHANNEL_KEY_TO_LABEL = FUNDING_CHANNEL_MAP;

// Loan purpose dropdown: synced with field_configurations
const LOAN_PURPOSE_MAP: Record<string, string> = {
  purchase: "Purchase",
  refinance: "Refinance",
  new_construction: "New Construction",
};
const LOAN_PURPOSE_LABELS = Object.values(LOAN_PURPOSE_MAP);
const LP_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(LOAN_PURPOSE_MAP).map(([k, v]) => [v, k])
);
const LP_KEY_TO_LABEL = LOAN_PURPOSE_MAP;

// Lead source dropdown
const LEAD_SOURCE_MAP: Record<string, string> = {
  broker: "Broker",
  direct: "Direct",
  referral: "Referral",
  website: "Website",
  repeat_borrower: "Repeat Borrower",
  marketing: "Marketing",
  correspondent: "Correspondent",
  other: "Other",
};
const LEAD_SOURCE_LABELS = Object.values(LEAD_SOURCE_MAP);
const LS_LABEL_TO_KEY = Object.fromEntries(
  Object.entries(LEAD_SOURCE_MAP).map(([k, v]) => [v, k])
);
const LS_KEY_TO_LABEL = LEAD_SOURCE_MAP;

import {
  Building2,
  Users,
  DollarSign,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// ── Helpers ──

function daysAgo(dateString: string | null | undefined): number | null {
  if (!dateString) return null;
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86_400_000);
}

// ── Section label ──

function SectionLabel({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
      <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
      {children}
    </div>
  );
}

// ── Read-only field (for computed values) ──

function ReadOnlyField({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("group/field min-w-0", className)}>
      <span className="text-[11px] font-medium text-muted-foreground mb-0.5 block leading-tight">{label}</span>
      <div className="w-full text-left text-sm min-h-[32px] flex items-center rounded-md px-2 py-1 -mx-0.5">
        {children}
      </div>
    </div>
  );
}

function Placeholder() {
  return <span className="text-muted-foreground/40">Add...</span>;
}

// ── Card wrapper ──

function OverviewCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4 px-5", className)}>
      {children}
    </div>
  );
}

// ── Avatar circle ──

function InitialsAvatar({ name, palette }: { name: string; palette: "green" | "amber" }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return (
    <div
      className={cn(
        "h-10 w-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0",
        palette === "green"
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
      )}
    >
      {initials}
    </div>
  );
}

// ── Contact search input for linking borrower/broker ──

type ContactResult = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null };

function ContactSearchInput({ onSelect, placeholder }: {
  onSelect: (contact: ContactResult) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newFirst, setNewFirst] = useState("");
  const [newLast, setNewLast] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const debouncedQuery = useDebounce(query, 250);
  const searchDone = useRef(false);

  useEffect(() => {
    if (debouncedQuery.length < 2) { setResults([]); setOpen(false); searchDone.current = false; return; }
    let cancelled = false;
    setLoading(true);
    searchContactsForDealLink(debouncedQuery).then((res) => {
      if (cancelled) return;
      setResults(res.contacts);
      setOpen(true);
      setLoading(false);
      searchDone.current = true;
    });
    return () => { cancelled = true; };
  }, [debouncedQuery]);

  function resetCreate() {
    setShowCreate(false);
    setNewFirst("");
    setNewLast("");
    setNewEmail("");
    setNewPhone("");
  }

  async function handleCreate() {
    if (!newFirst.trim()) { showError("First name is required"); return; }
    setCreating(true);
    const res = await quickCreateContactAction(newFirst, newLast, newEmail, newPhone);
    setCreating(false);
    if (res.error || !res.contact) {
      showError("Could not create contact", res.error);
      return;
    }
    showSuccess(`Created ${res.contact.first_name} ${res.contact.last_name}`);
    onSelect(res.contact);
    setQuery("");
    setResults([]);
    setOpen(false);
    resetCreate();
  }

  // Pre-fill first/last from search query when opening create form
  function openCreateForm() {
    const parts = query.trim().split(/\s+/);
    setNewFirst(parts[0] ?? "");
    setNewLast(parts.slice(1).join(" ") ?? "");
    setNewEmail("");
    setNewPhone("");
    setShowCreate(true);
    setOpen(false);
  }

  if (showCreate) {
    return (
      <div className="rounded-md border border-border bg-card p-3 space-y-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-foreground flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            New contact
          </span>
          <button type="button" onClick={resetCreate} className="text-muted-foreground hover:text-foreground p-0.5">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={newFirst}
            onChange={(e) => setNewFirst(e.target.value)}
            placeholder="First name *"
            className="h-8 text-sm"
            autoFocus
          />
          <Input
            value={newLast}
            onChange={(e) => setNewLast(e.target.value)}
            placeholder="Last name"
            className="h-8 text-sm"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Email"
            className="h-8 text-sm"
            type="email"
          />
          <Input
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="Phone"
            className="h-8 text-sm"
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="ghost" size="sm" onClick={resetCreate} className="h-7 text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleCreate} disabled={creating || !newFirst.trim()} className="h-7 text-xs">
            {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
            Create & Link
          </Button>
        </div>
      </div>
    );
  }

  const hasQuery = debouncedQuery.length >= 2;
  const noResults = hasQuery && searchDone.current && !loading && results.length === 0;

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? "Search contacts..."}
          className="h-8 pl-8 text-sm"
          onFocus={() => hasQuery && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
        {loading && <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md max-h-56 overflow-y-auto">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelect(c);
                setQuery("");
                setResults([]);
                setOpen(false);
              }}
            >
              <div className="font-medium">{c.first_name} {c.last_name}</div>
              {c.email && <div className="text-xs text-muted-foreground">{c.email}</div>}
            </button>
          ))}
          {noResults && (
            <EmptyState icon={Search} title="No contacts found" compact />
          )}
          {/* Always show create option at bottom of dropdown */}
          <button
            type="button"
            className="w-full text-left px-3 py-2 text-sm hover:bg-muted/60 transition-colors border-t border-border flex items-center gap-2 text-primary"
            onMouseDown={(e) => {
              e.preventDefault();
              openCreateForm();
            }}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Create new contact{hasQuery ? ` "${query.trim()}"` : ""}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Props ──

interface DealOverviewSummaryProps {
  dealId: string;
  deal: UnifiedDeal;
}

// ── Main Component ──

export function DealOverviewSummary({ dealId, deal }: DealOverviewSummaryProps) {
  // Local state for optimistic updates
  const [localUwData, setLocalUwData] = useState<Record<string, unknown>>(deal.uw_data ?? {});
  const localUwRef = useRef(localUwData);
  localUwRef.current = localUwData;

  const [, startTransition] = useTransition();

  // ── Field value accessors (use local state) ──

  const uwVal = useCallback((key: string): unknown => localUwData[key] ?? null, [localUwData]);
  const uwStr = useCallback((key: string): string | null => {
    const v = localUwData[key];
    if (v == null || v === "") return null;
    return String(v);
  }, [localUwData]);
  const uwNum = useCallback((key: string): number | null => {
    const v = localUwData[key];
    if (v == null) return null;
    const n = Number(v);
    return isNaN(n) ? null : n;
  }, [localUwData]);

  // ── Save handler: writes to uw_data ──

  const saveField = useCallback((key: string, value: string) => {
    // Optimistic update
    const next = { ...localUwRef.current, [key]: value };
    localUwRef.current = next;
    setLocalUwData(next);

    // Fire server action in background
    startTransition(async () => {
      const result = await updateUwDataAction(dealId, key, value);
      if (result.error) {
        showError("Could not save field", result.error);
        // Rollback
        const prev = { ...localUwRef.current, [key]: deal.uw_data?.[key] };
        localUwRef.current = prev;
        setLocalUwData(prev);
      }
    });
  }, [dealId, deal.uw_data, startTransition]);

  // ── Derived values ──

  const loanPurpose = uwStr("loan_purpose");
  const isRefi = ["refinance", "cash_out", "cash_out_refinance"].includes(loanPurpose ?? "") ||
    (loanPurpose?.toLowerCase().includes("refi") ?? false) ||
    (loanPurpose?.toLowerCase().includes("cash") ?? false);
  const isPurchase = ["acquisition", "purchase"].includes(loanPurpose ?? "") ||
    (loanPurpose?.toLowerCase().includes("purchase") ?? false);
  const isConstruction = ["new_construction", "construction"].includes(loanPurpose ?? "") ||
    (loanPurpose?.toLowerCase().includes("construction") ?? false);
  const isEarlyStage = ["lead", "awaiting_info"].includes(deal.stage);
  const showProposedTerms = !isEarlyStage;

  // Property name: falls back to address if no name set
  const [localDealName, setLocalDealName] = useState(deal.name ?? "");
  const addressLine = uwStr("property_address");

  const saveDealName = useCallback((v: string) => {
    setLocalDealName(v);
    startTransition(async () => {
      const result = await updateDealNameAction(dealId, v);
      if (result.error) {
        showError("Could not save name", result.error);
        setLocalDealName(deal.name ?? "");
      }
    });
  }, [dealId, deal.name, startTransition]);

  // Build full address string for display
  const fullAddress = useMemo(() => {
    const street = uwStr("property_address");
    const cityState = [uwStr("property_city"), uwStr("property_state")].filter(Boolean).join(", ");
    const zip = uwStr("property_zip");
    const line2 = [cityState, zip].filter(Boolean).join(" ");
    if (!street && !line2) return null;
    return [street, line2].filter(Boolean).join(", ");
  }, [uwStr]);

  // Address editing state
  const [addressDraft, setAddressDraft] = useState(fullAddress ?? "");

  const handleAddressSelect = useCallback((parsed: ParsedAddress) => {
    // Save all parsed address fields at once
    const fields: Record<string, string> = {
      property_address: parsed.address_line1,
      property_city: parsed.city,
      property_state: parsed.state,
      property_zip: parsed.zip,
    };
    const next = { ...localUwRef.current, ...fields };
    localUwRef.current = next;
    setLocalUwData(next);
    // Update draft to show the full formatted address
    const newFull = [
      parsed.address_line1,
      [parsed.city, parsed.state].filter(Boolean).join(", "),
      parsed.zip,
    ].filter(Boolean).join(", ");
    setAddressDraft(newFull);

    // Save each field to the server
    for (const [key, value] of Object.entries(fields)) {
      startTransition(async () => {
        const result = await updateUwDataAction(dealId, key, value);
        if (result.error) {
          showError(`Could not save ${key}`, result.error);
        }
      });
    }
  }, [dealId, startTransition]);

  // Contact field save (2-way sync to crm_contacts)
  const saveContactField = useCallback((contactId: string, field: string, value: string) => {
    startTransition(async () => {
      const result = await updateContactFieldAction(contactId, field, value);
      if (result.error) {
        showError("Could not save field", result.error);
      }
    });
  }, [startTransition]);

  // Borrower + Broker contact state (local for optimistic linking)
  type ContactData = { id: string; first_name: string; last_name: string; email: string | null; phone: string | null };
  const [borrowerContact, setBorrowerContact] = useState<ContactData | null>(
    deal.primary_contact ?? null
  );
  const [brokerContact, setBrokerContact] = useState<ContactData | null>(
    deal.broker_contact ? { id: deal.broker_contact.id, first_name: deal.broker_contact.first_name, last_name: deal.broker_contact.last_name, email: deal.broker_contact.email, phone: deal.broker_contact.phone } : null
  );
  const brokerCompanyName = deal.broker_contact?.broker_company?.name ?? null;

  const bc = borrowerContact;
  const borrowerName = bc
    ? `${bc.first_name ?? ""} ${bc.last_name ?? ""}`.trim()
    : null;

  const bk = brokerContact;
  const brokerName = bk
    ? `${bk.first_name ?? ""} ${bk.last_name ?? ""}`.trim()
    : null;

  const handleLinkContact = useCallback((role: "borrower" | "broker", contact: ContactData) => {
    if (role === "borrower") setBorrowerContact(contact);
    else setBrokerContact(contact);
    startTransition(async () => {
      const result = await linkDealContactAction(dealId, role, contact.id);
      if (result.error) {
        showError("Could not link contact", result.error);
        if (role === "borrower") setBorrowerContact(deal.primary_contact ?? null);
        else setBrokerContact(null);
      }
    });
  }, [dealId, deal.primary_contact, startTransition]);

  const handleUnlinkContact = useCallback((role: "borrower" | "broker") => {
    if (role === "borrower") setBorrowerContact(null);
    else setBrokerContact(null);
    startTransition(async () => {
      const result = await linkDealContactAction(dealId, role, null);
      if (result.error) {
        showError("Could not unlink contact", result.error);
      }
    });
  }, [dealId, startTransition]);

  // Days in stage (computed, read-only)
  const daysInStage = deal.days_in_stage ?? daysAgo(deal.stage_entered_at);

  return (
    <div className="space-y-5">
      {/* ── Section 1: Property ── */}
      <div>
        <SectionLabel icon={Building2}>Property</SectionLabel>
        <OverviewCard>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-1">
            <InlineField
              label="Property name"
              type="text"
              value={localDealName || ""}
              placeholder={fullAddress || "Enter property name..."}
              onSave={saveDealName}
            />
            <InlineField
              label="Asset class"
              type="select"
              value={AC_KEY_TO_LABEL[uwStr("property_type") ?? ""] ?? uwStr("property_type") ?? ""}
              options={ASSET_CLASS_DROPDOWN_LABELS}
              onSave={(v) => saveField("property_type", AC_LABEL_TO_KEY[v] ?? v)}
            />
            <InlineField
              label="Units / lots"
              type="number"
              value={uwNum("units")}
              onSave={(v) => saveField("units", v)}
            />
            <InlineField
              label="Total sq ft"
              type="number"
              value={uwNum("total_sqft")}
              onSave={(v) => saveField("total_sqft", v)}
            />
            <InlineField
              label="Year built"
              type="number"
              value={uwNum("year_built")}
              onSave={(v) => saveField("year_built", v)}
            />
            <div className="min-w-0 md:col-span-3">
              <span className="text-[11px] font-medium text-muted-foreground mb-0.5 block leading-tight">Address</span>
              <AddressAutocomplete
                value={addressDraft}
                onChange={setAddressDraft}
                onAddressSelect={handleAddressSelect}
                placeholder="Search address..."
                className="h-auto min-h-[32px] bg-transparent px-2 py-1 border border-transparent rounded-md transition-colors hover:border-border hover:bg-muted/40 focus:border-primary/60 focus:bg-background focus:ring-1 focus:ring-primary/20 focus:ring-offset-0 focus:outline-none text-sm"
              />
            </div>
          </div>
        </OverviewCard>
      </div>

      {/* ── Section 2: Deal Summary (merged with Loan Terms) ── */}
      <div>
        <SectionLabel icon={DollarSign}>Deal Summary</SectionLabel>
        <div className={cn("grid gap-4", showProposedTerms ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1")}>
          {/* Deal info */}
          <OverviewCard>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {/* Always shown */}
              <InlineField
                label="Loan purpose"
                type="select"
                value={LP_KEY_TO_LABEL[loanPurpose ?? ""] ?? loanPurpose ?? ""}
                options={LOAN_PURPOSE_LABELS}
                onSave={(v) => saveField("loan_purpose", LP_LABEL_TO_KEY[v] ?? v)}
              />
              <InlineField
                label="Target loan amount"
                type="currency"
                value={uwNum("loan_amount") ?? deal.amount}
                onSave={(v) => saveField("loan_amount", v)}
              />

              {/* Purchase fields */}
              {isPurchase && (
                <>
                  <InlineField
                    label="Purchase price"
                    type="currency"
                    value={uwNum("purchase_price")}
                    onSave={(v) => saveField("purchase_price", v)}
                  />
                  <InlineField
                    label="Earnest money deposit"
                    type="currency"
                    value={uwNum("earnest_money_deposit")}
                    onSave={(v) => saveField("earnest_money_deposit", v)}
                  />
                </>
              )}

              {/* Refinance fields */}
              {isRefi && (
                <>
                  <InlineField
                    label="Original purchase price"
                    type="currency"
                    value={uwNum("original_purchase_price")}
                    onSave={(v) => saveField("original_purchase_price", v)}
                  />
                  <InlineField
                    label="Original purchase date"
                    type="date"
                    value={uwStr("original_purchase_date")}
                    onSave={(v) => saveField("original_purchase_date", v)}
                  />
                  <InlineField
                    label="Capex investment to date"
                    type="currency"
                    value={uwNum("capex_investment_to_date")}
                    onSave={(v) => saveField("capex_investment_to_date", v)}
                  />
                </>
              )}

              {/* New Construction fields */}
              {isConstruction && (
                <>
                  <InlineField
                    label="Land / lot cost"
                    type="currency"
                    value={uwNum("purchase_price")}
                    onSave={(v) => saveField("purchase_price", v)}
                  />
                  <InlineField
                    label="Construction budget"
                    type="currency"
                    value={uwNum("rehab_budget")}
                    onSave={(v) => saveField("rehab_budget", v)}
                  />
                  <InlineField
                    label="Construction holdback"
                    type="currency"
                    value={uwNum("rehab_holdback")}
                    onSave={(v) => saveField("rehab_holdback", v)}
                  />
                  <InlineField
                    label="Est. construction timeline (months)"
                    type="number"
                    value={uwNum("estimated_rehab_months")}
                    onSave={(v) => saveField("estimated_rehab_months", v)}
                  />
                  <InlineField
                    label="Total capitalization"
                    type="currency"
                    value={uwNum("total_capitalization")}
                    onSave={(v) => saveField("total_capitalization", v)}
                  />
                </>
              )}

              {/* Always shown */}
              <InlineField
                label="As-is value"
                type="currency"
                value={uwNum("as_is_value")}
                onSave={(v) => saveField("as_is_value", v)}
              />
              {!isConstruction && (
                <InlineField
                  label="Rehab budget"
                  type="currency"
                  value={uwNum("rehab_budget")}
                  onSave={(v) => saveField("rehab_budget", v)}
                />
              )}
              <InlineField
                label="ARV"
                type="currency"
                value={uwNum("arv")}
                onSave={(v) => saveField("arv", v)}
              />
              <InlineField
                label="Exit strategy"
                type="text"
                value={uwStr("exit_strategy") ?? ""}
                onSave={(v) => saveField("exit_strategy", v)}
              />
              <InlineField
                label="Target close date"
                type="date"
                value={uwStr("expected_close_date") ?? deal.expected_close_date}
                onSave={(v) => saveField("expected_close_date", v)}
              />
              <InlineField
                label="Lead source"
                type="select"
                value={LS_KEY_TO_LABEL[uwStr("source") ?? ""] ?? uwStr("source") ?? ""}
                options={LEAD_SOURCE_LABELS}
                onSave={(v) => saveField("source", LS_LABEL_TO_KEY[v] ?? v)}
              />
              <ReadOnlyField label="Days in stage">
                <span className="num">{daysInStage != null ? daysInStage : <Placeholder />}</span>
              </ReadOnlyField>
            </div>

            {/* Borrower & Broker contact lookup */}
            <Separator className="my-3" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <div className="min-w-0">
                <span className="inline-field-label mb-1 block">Borrower</span>
                {bc ? (
                  <div className="flex items-center gap-2">
                    <InitialsAvatar name={borrowerName || "?"} palette="green" />
                    <span className="text-sm font-medium truncate flex-1">{borrowerName}</span>
                    <button
                      type="button"
                      onClick={() => handleUnlinkContact("borrower")}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                      title="Unlink borrower"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <ContactSearchInput
                    placeholder="Search contacts..."
                    onSelect={(c) => handleLinkContact("borrower", c)}
                  />
                )}
              </div>
              <div className="min-w-0">
                <span className="inline-field-label mb-1 block">Broker</span>
                {bk ? (
                  <div className="flex items-center gap-2">
                    <InitialsAvatar name={brokerName || "?"} palette="amber" />
                    <span className="text-sm font-medium truncate flex-1">{brokerName}</span>
                    <button
                      type="button"
                      onClick={() => handleUnlinkContact("broker")}
                      className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                      title="Unlink broker"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <ContactSearchInput
                    placeholder="Search contacts..."
                    onSelect={(c) => handleLinkContact("broker", c)}
                  />
                )}
              </div>
            </div>
          </OverviewCard>

          {/* Proposed Terms (only if not early stage) */}
          {showProposedTerms && (
            <OverviewCard className="border-blue-300 dark:border-blue-700 border-2">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-medium text-muted-foreground">Proposed terms</div>
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Active</Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                {/* Loan type spans first row left */}
                <InlineField
                  label="Loan type"
                  type="select"
                  value={LT_KEY_TO_LABEL[uwStr("loan_type") ?? ""] ?? uwStr("loan_type") ?? ""}
                  options={LOAN_TYPE_LABELS}
                  onSave={(v) => saveField("loan_type", LT_LABEL_TO_KEY[v] ?? v)}
                />
                {/* Spacer for right column alignment */}
                <div />
                {/* Left column: Loan structure */}
                <InlineField
                  label="Loan amount"
                  type="currency"
                  value={uwNum("total_loan")}
                  onSave={(v) => saveField("total_loan", v)}
                />
                <InlineField
                  label="Origination fee %"
                  type="percent"
                  value={uwNum("origination_fee_pct")}
                  onSave={(v) => saveField("origination_fee_pct", v)}
                />
                <InlineField
                  label="Construction holdback"
                  type="currency"
                  value={uwNum("rehab_holdback")}
                  onSave={(v) => saveField("rehab_holdback", v)}
                />
                <InlineField
                  label="Origination fee $"
                  type="currency"
                  value={uwNum("origination_fee_amount")}
                  onSave={(v) => saveField("origination_fee_amount", v)}
                />
                <InlineField
                  label="Term (months)"
                  type="number"
                  value={uwNum("term_months")}
                  onSave={(v) => saveField("term_months", v)}
                />
                <InlineField
                  label="Draw fee"
                  type="currency"
                  value={uwNum("draw_fee")}
                  onSave={(v) => saveField("draw_fee", v)}
                />
                <InlineField
                  label="Interest rate"
                  type="percent"
                  value={uwNum("interest_rate")}
                  onSave={(v) => saveField("interest_rate", v)}
                />
                <InlineField
                  label="Exit fee"
                  type="currency"
                  value={uwNum("exit_fee")}
                  onSave={(v) => saveField("exit_fee", v)}
                />
                <InlineField
                  label="Default rate"
                  type="percent"
                  value={uwNum("default_rate")}
                  onSave={(v) => saveField("default_rate", v)}
                />
                <InlineField
                  label="Legal / doc fee"
                  type="currency"
                  value={uwNum("legal_fee")}
                  onSave={(v) => saveField("legal_fee", v)}
                />
                <InlineField
                  label="Amortization (months)"
                  type="number"
                  value={uwNum("amortization_months")}
                  onSave={(v) => saveField("amortization_months", v)}
                />
                <InlineField
                  label="UW / processing fee"
                  type="currency"
                  value={uwNum("processing_fee")}
                  onSave={(v) => saveField("processing_fee", v)}
                />
                <InlineField
                  label="Interest reserve"
                  type="currency"
                  value={uwNum("interest_reserve")}
                  onSave={(v) => saveField("interest_reserve", v)}
                />
                <InlineField
                  label="Prepayment penalty %"
                  type="percent"
                  value={uwNum("prepayment_penalty_pct")}
                  onSave={(v) => saveField("prepayment_penalty_pct", v)}
                />
                <InlineField
                  label="Funding channel"
                  type="select"
                  value={FUNDING_CHANNEL_KEY_TO_LABEL[uwStr("funding_channel") ?? ""] ?? uwStr("funding_channel") ?? ""}
                  options={FUNDING_CHANNEL_LABELS}
                  onSave={(v) => saveField("funding_channel", FUNDING_CHANNEL_LABEL_TO_KEY[v] ?? v)}
                />
                {["correspondent", "brokered"].includes(uwStr("funding_channel") ?? "") && (
                  <InlineField
                    label="Lender"
                    type="text"
                    value={uwStr("lender_name") ?? ""}
                    onSave={(v) => saveField("lender_name", v)}
                  />
                )}
              </div>
            </OverviewCard>
          )}
        </div>
      </div>

      {/* ── Section 4: People ── */}
      <div>
        <SectionLabel icon={Users}>People</SectionLabel>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Borrower card */}
          <OverviewCard>
            <div className="text-[11px] font-medium text-muted-foreground mb-3">Borrower</div>
            {bc ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <InitialsAvatar name={borrowerName || "?"} palette="green" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{borrowerName}</div>
                    {bc.email && (
                      <div className="text-xs text-muted-foreground truncate">{bc.email}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnlinkContact("borrower")}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                    title="Unlink borrower"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <InlineField
                    label="Email"
                    type="text"
                    value={bc.email ?? ""}
                    onSave={(v) => saveContactField(bc.id, "email", v)}
                  />
                  <InlineField
                    label="Phone"
                    type="text"
                    value={bc.phone ?? ""}
                    onSave={(v) => saveContactField(bc.id, "phone", v)}
                  />
                  <InlineField
                    label="FICO"
                    type="number"
                    value={uwNum("borrower_fico")}
                    onSave={(v) => saveField("borrower_fico", v)}
                  />
                  <InlineField
                    label="Experience"
                    type="text"
                    value={uwStr("borrower_experience") ?? ""}
                    onSave={(v) => saveField("borrower_experience", v)}
                  />
                  <InlineField
                    label="Combined liquidity"
                    type="currency"
                    value={uwNum("combined_liquidity")}
                    onSave={(v) => saveField("combined_liquidity", v)}
                  />
                  <InlineField
                    label="Combined net worth"
                    type="currency"
                    value={uwNum("combined_net_worth")}
                    onSave={(v) => saveField("combined_net_worth", v)}
                  />
                </div>
              </>
            ) : (
              <div className="py-3">
                <ContactSearchInput
                  placeholder="Search contacts to link as borrower..."
                  onSelect={(c) => handleLinkContact("borrower", c)}
                />
              </div>
            )}
          </OverviewCard>

          {/* Broker card */}
          <OverviewCard>
            <div className="text-[11px] font-medium text-muted-foreground mb-3">Broker</div>
            {bk ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <InitialsAvatar name={brokerName || "?"} palette="amber" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">{brokerName}</div>
                    {brokerCompanyName && (
                      <div className="text-xs text-muted-foreground truncate">{brokerCompanyName}</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleUnlinkContact("broker")}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded"
                    title="Unlink broker"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Separator className="mb-3" />
                <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                  <InlineField
                    label="Email"
                    type="text"
                    value={bk.email ?? ""}
                    onSave={(v) => saveContactField(bk.id, "email", v)}
                  />
                  <InlineField
                    label="Phone"
                    type="text"
                    value={bk.phone ?? ""}
                    onSave={(v) => saveContactField(bk.id, "phone", v)}
                  />
                  <InlineField
                    label="Broker fee %"
                    type="percent"
                    value={uwNum("broker_fee_pct")}
                    onSave={(v) => saveField("broker_fee_pct", v)}
                  />
                  <InlineField
                    label="Broker fee $"
                    type="currency"
                    value={uwNum("broker_fee_amount")}
                    onSave={(v) => saveField("broker_fee_amount", v)}
                  />
                </div>
              </>
            ) : (
              <div className="py-3">
                <ContactSearchInput
                  placeholder="Search contacts to link as broker..."
                  onSelect={(c) => handleLinkContact("broker", c)}
                />
              </div>
            )}
          </OverviewCard>
        </div>
      </div>
    </div>
  );
}
