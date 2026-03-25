"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { InlineField } from "@/components/ui/inline-field";
import { Button } from "@/components/ui/button";
import { Briefcase, X } from "lucide-react";
import { formatPhoneNumber } from "@/lib/format";
import { showSuccess, showError } from "@/lib/toast";
import {
  linkDealContactAction,
  updateUwDataAction,
  updateContactFieldAction,
} from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  ExpandablePersonCard,
} from "@/components/shared/ExpandablePersonCard";
import { RelationshipPicker } from "@/components/shared/RelationshipPicker";
import type { ContactSearchResult } from "@/lib/actions/relationship-actions";

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
    async (contact: ContactSearchResult) => {
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
        <div className="flex items-center justify-between px-5 py-3.5 border-b">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-muted-foreground" />
            <h4 className="rq-micro-label">
              Broker
            </h4>
          </div>
        </div>
        <div className="p-5">
          <span className="inline-field-label">Search contacts to link as broker</span>
          <div className="mt-1">
            <RelationshipPicker
              entityType="contact"
              placeholder="Search contacts..."
              onSelect={(entity) => handleLink(entity as ContactSearchResult)}
              onCreate={(entity) => handleLink(entity as ContactSearchResult)}
            />
          </div>
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
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-muted-foreground" />
          <h4 className="rq-micro-label">
            Broker
          </h4>
        </div>
      </div>
      <ExpandablePersonCard
        avatar={{ initials: initials || "?", palette: "amber" }}
        name={brokerName || "Unknown"}
        subtitle={[company, localBroker.email, localBroker.phone ? formatPhoneNumber(localBroker.phone) : null].filter(Boolean).join(" \u00b7 ")}
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

