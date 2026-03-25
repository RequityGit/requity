"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { InlineField } from "@/components/ui/inline-field";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Briefcase, Search, X, Loader2, Plus, UserPlus } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { formatPhoneNumber } from "@/lib/format";
import { showSuccess, showError } from "@/lib/toast";
import {
  linkDealContactAction,
  searchContactsForDealLink,
  quickCreateContactAction,
  updateUwDataAction,
  updateContactFieldAction,
} from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  ExpandablePersonCard,
} from "@/components/shared/ExpandablePersonCard";

type ContactResult = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
};

interface BrokerContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  company_name?: string | null;
  broker_company?: { name: string } | null;
}

interface BrokerExtra {
  broker_nmls: string;
  broker_fee_pct: string;
  broker_notes: string;
}

interface BrokerSectionProps {
  dealId: string;
  broker: BrokerContact | null;
  brokerExtra: BrokerExtra;
  onBrokerChanged: () => void;
}

export function BrokerSection({
  dealId,
  broker,
  brokerExtra,
  onBrokerChanged,
}: BrokerSectionProps) {
  const [localBroker, setLocalBroker] = useState<BrokerContact | null>(broker);
  const [localExtra, setLocalExtra] = useState<BrokerExtra>(brokerExtra);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setLocalBroker(broker);
  }, [broker]);

  useEffect(() => {
    setLocalExtra(brokerExtra);
  }, [brokerExtra]);

  const handleLink = useCallback(
    async (contact: ContactResult) => {
      const result = await linkDealContactAction(dealId, "broker", contact.id);
      if (result.error) {
        showError(result.error);
      } else {
        showSuccess("Broker linked");
        onBrokerChanged();
      }
    },
    [dealId, onBrokerChanged]
  );

  const handleUnlink = useCallback(async () => {
    const result = await linkDealContactAction(dealId, "broker", null);
    if (result.error) {
      showError(result.error);
    } else {
      setLocalBroker(null);
      showSuccess("Broker unlinked");
      onBrokerChanged();
    }
  }, [dealId, onBrokerChanged]);

  const saveExtraField = useCallback(
    (field: keyof BrokerExtra, value: string) => {
      setLocalExtra((prev) => ({ ...prev, [field]: value }));
      startTransition(async () => {
        const result = await updateUwDataAction(dealId, field, value);
        if (result.error) {
          showError(result.error);
          setLocalExtra(brokerExtra);
        }
      });
    },
    [dealId, brokerExtra]
  );

  const saveContactField = useCallback(
    (field: "email" | "phone" | "company_name", value: string) => {
      if (!localBroker) return;
      // Optimistic update
      if (field === "company_name") {
        setLocalBroker((prev) =>
          prev
            ? { ...prev, company_name: value || null, broker_company: value ? { name: value } : null }
            : prev
        );
      } else {
        setLocalBroker((prev) => (prev ? { ...prev, [field]: value || null } : prev));
      }
      startTransition(async () => {
        const result = await updateContactFieldAction(localBroker.id, field, value || null);
        if (result.error) {
          showError(result.error);
          setLocalBroker(broker); // rollback
        }
      });
    },
    [localBroker, broker]
  );

  if (!localBroker) {
    return (
      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Broker
            </h4>
          </div>
        </div>
        <div className="px-4 py-4">
          <BrokerContactSearch onSelect={handleLink} />
        </div>
      </div>
    );
  }

  const brokerName = [localBroker.first_name, localBroker.last_name]
    .filter(Boolean)
    .join(" ");
  const initials = brokerName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const company = localBroker.broker_company?.name || localBroker.company_name || "";

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Broker
          </h4>
        </div>
      </div>
      <ExpandablePersonCard
        avatar={{ initials: initials || "?", palette: "amber" }}
        name={brokerName || "Unknown"}
        nameHref={`/crm/contacts/${localBroker.id}`}
        subtitle={[company, localBroker.email].filter(Boolean).join(" \u00b7 ")}
        badge="Broker"
        actions={
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleUnlink}
            title="Unlink broker"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-2">
          <InlineField
            label="Email"
            type="text"
            value={localBroker.email ?? ""}
            placeholder="Add..."
            onSave={(v) => saveContactField("email", v)}
          />
          <InlineField
            label="Phone"
            type="text"
            value={localBroker.phone ?? ""}
            placeholder="Add..."
            onSave={(v) => saveContactField("phone", v)}
            formatValue={(v) => (v ? formatPhoneNumber(String(v)) : "")}
          />
          <InlineField
            label="Company"
            type="text"
            value={company}
            placeholder="Add..."
            onSave={(v) => saveContactField("company_name", v)}
          />
          <InlineField
            label="NMLS #"
            type="text"
            value={localExtra.broker_nmls}
            placeholder="NMLS number"
            onSave={(v) => saveExtraField("broker_nmls", v)}
          />
          <InlineField
            label="Broker Fee %"
            type="percent"
            value={localExtra.broker_fee_pct ? Number(localExtra.broker_fee_pct) : ""}
            placeholder="0%"
            min={0}
            max={100}
            onSave={(v) => saveExtraField("broker_fee_pct", v)}
          />
          <InlineField
            label="Notes"
            type="text"
            value={localExtra.broker_notes}
            placeholder="Notes"
            onSave={(v) => saveExtraField("broker_notes", v)}
          />
        </div>
      </ExpandablePersonCard>
    </div>
  );
}

// ── Contact search for linking broker ──

function BrokerContactSearch({
  onSelect,
}: {
  onSelect: (contact: ContactResult) => void;
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
    if (debouncedQuery.length < 2) {
      setResults([]);
      setOpen(false);
      searchDone.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchContactsForDealLink(debouncedQuery).then((res) => {
      if (cancelled) return;
      setResults(res.contacts);
      setOpen(true);
      setLoading(false);
      searchDone.current = true;
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  function resetCreate() {
    setShowCreate(false);
    setNewFirst("");
    setNewLast("");
    setNewEmail("");
    setNewPhone("");
  }

  async function handleCreate() {
    if (!newFirst.trim()) {
      showError("First name is required");
      return;
    }
    setCreating(true);
    const res = await quickCreateContactAction(newFirst, newLast, newEmail, newPhone);
    setCreating(false);
    if (res.error || !res.contact) {
      showError("Could not create contact", res.error);
      return;
    }
    resetCreate();
    onSelect(res.contact as ContactResult);
  }

  return (
    <div className="space-y-2">
      <span className="inline-field-label">Search contacts to link as broker</span>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          className="inline-field pl-8"
          placeholder="Search contacts..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="border rounded-lg max-h-48 overflow-y-auto">
          {results.map((c) => {
            const name = [c.first_name, c.last_name].filter(Boolean).join(" ");
            return (
              <button
                key={c.id}
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted/50 rq-transition text-sm flex items-center gap-2"
                onClick={() => {
                  setOpen(false);
                  setQuery("");
                  onSelect(c);
                }}
              >
                <span className="font-medium">{name}</span>
                {c.email && (
                  <span className="text-xs text-muted-foreground truncate">
                    {c.email}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {open && results.length === 0 && searchDone.current && !loading && (
        <div className="text-sm text-muted-foreground py-2 px-1">
          No contacts found.{" "}
          <button
            type="button"
            className="text-primary hover:underline underline-offset-4"
            onClick={() => setShowCreate(true)}
          >
            Create new contact
          </button>
        </div>
      )}

      {showCreate && (
        <div className="border rounded-lg p-3 space-y-2">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            Quick create contact
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              className="inline-field"
              placeholder="First name *"
              value={newFirst}
              onChange={(e) => setNewFirst(e.target.value)}
            />
            <Input
              className="inline-field"
              placeholder="Last name"
              value={newLast}
              onChange={(e) => setNewLast(e.target.value)}
            />
            <Input
              className="inline-field"
              placeholder="Email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Input
              className="inline-field"
              placeholder="Phone"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <>
                  <UserPlus className="h-3.5 w-3.5 mr-1" />
                  Create & Link
                </>
              )}
            </Button>
            <Button size="sm" variant="outline" onClick={resetCreate}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
