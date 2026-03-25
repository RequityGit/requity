"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showError } from "@/lib/toast";
import type { DealBorrowingEntity, DealBorrowerMember } from "@/app/types/borrower";
import type { DealTeamContact } from "@/app/types/deal-team";
import type { UnifiedDeal } from "@/components/pipeline/pipeline-types";
import type { DealTeamMember } from "@/app/(authenticated)/(admin)/pipeline/[id]/DealDetailPage";
import { BorrowingEntitySection } from "./BorrowingEntitySection";
import { BorrowerMembersSection } from "./BorrowerMembersSection";
import { BrokerSection } from "./BrokerSection";
import { ThirdPartiesSection } from "./ThirdPartiesSection";
import { DealTeamInternalSection } from "./DealTeamInternalSection";
import {
  addDealTeamMember,
  removeDealTeamMember,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";

interface BrokerContact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  broker_company?: { name: string } | null;
}

interface BrokerExtra {
  broker_nmls: string;
  broker_fee_pct: string;
  broker_notes: string;
}

interface PeopleData {
  entity: DealBorrowingEntity | null;
  members: DealBorrowerMember[];
  broker: BrokerContact | null;
  brokerExtra: BrokerExtra;
  thirdParties: DealTeamContact[];
}

interface Profile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  email?: string | null;
}

interface PeopleTabProps {
  dealId: string;
  deal: UnifiedDeal;
  dealTeamMembers: DealTeamMember[];
  teamMembers: Profile[];
}

export default function PeopleTab({
  dealId,
  deal,
  dealTeamMembers,
  teamMembers,
}: PeopleTabProps) {
  const [data, setData] = useState<PeopleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [localDealTeamMembers, setLocalDealTeamMembers] =
    useState<DealTeamMember[]>(dealTeamMembers);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(
    async (silent = false) => {
      // Abort any in-flight request before starting a new one
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!silent) {
        setLoading(true);
        setError(null);
      }

      const MAX_ATTEMPTS = 3;
      const TIMEOUT_MS = 15_000;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        // Wait before retrying (0ms, 1000ms, 2000ms)
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, attempt * 1000));
          if (controller.signal.aborted) return;
        }

        try {
          const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
          const res = await fetch(`/api/pipeline/${dealId}/people`, {
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            const msg = body.error ?? "Failed to load people data";
            console.error("People tab API error:", res.status, msg);
            // Don't retry on 4xx client errors
            if (res.status >= 400 && res.status < 500) {
              if (!silent) setError(msg);
              else showError(msg);
              if (!silent) setLoading(false);
              return;
            }
            // Retry on server errors
            if (attempt === MAX_ATTEMPTS - 1) {
              if (!silent) setError(msg);
              else showError(msg);
            }
            continue;
          }

          const contentType = res.headers.get("content-type") ?? "";
          if (!contentType.includes("application/json")) {
            console.error("People tab: unexpected content-type", contentType);
            if (attempt === MAX_ATTEMPTS - 1) {
              if (!silent) setError("Unexpected response from server");
              else showError("Failed to load people data");
            }
            continue;
          }

          const json = await res.json();
          // Defensive: ensure expected shape
          setData({
            entity: json.entity ?? null,
            members: Array.isArray(json.members) ? json.members : [],
            broker: json.broker ?? null,
            brokerExtra: json.brokerExtra ?? { broker_nmls: "", broker_fee_pct: "", broker_notes: "" },
            thirdParties: Array.isArray(json.thirdParties) ? json.thirdParties : [],
          });
          setError(null);
          if (!silent) setLoading(false);
          return; // Success — exit retry loop
        } catch (err) {
          if (controller.signal.aborted) return; // Intentional abort — don't show error
          console.error(`People tab fetch attempt ${attempt + 1} failed:`, err);
          if (attempt === MAX_ATTEMPTS - 1) {
            if (!silent) setError("Failed to load people data");
            else showError("Failed to load people data");
          }
        }
      }

      if (!silent) setLoading(false);
    },
    [dealId]
  );

  useEffect(() => {
    load();
    return () => { abortRef.current?.abort(); };
  }, [load]);

  const handleAddTeamMember = useCallback(
    async (profileId: string, role: string) => {
      const result = await addDealTeamMember(dealId, profileId, role);
      if (!result.error) {
        // Optimistic: add to local state
        setLocalDealTeamMembers((prev) => {
          // Replace existing member with same role, or add new
          const filtered = prev.filter((m) => m.role !== role);
          return [
            ...filtered,
            {
              id: crypto.randomUUID(),
              deal_id: dealId,
              profile_id: profileId,
              role,
              created_at: new Date().toISOString(),
            },
          ];
        });
      }
      return result;
    },
    [dealId]
  );

  const handleRemoveTeamMember = useCallback(
    async (memberId: string) => {
      const result = await removeDealTeamMember(dealId, memberId);
      if (!result.error) {
        setLocalDealTeamMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
      return result;
    },
    [dealId]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <p className="text-sm text-muted-foreground">{error ?? "Could not load people"}</p>
        <Button variant="outline" size="sm" onClick={() => load()}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. Borrowing Entity */}
      <BorrowingEntitySection
        dealId={dealId}
        entity={data.entity}
        onStructuralChange={() => load(true)}
      />

      {/* 2. Borrowers / Signers */}
      <BorrowerMembersSection
        dealId={dealId}
        entity={data.entity}
        members={data.members}
        setMembers={(updater) =>
          setData((prev) =>
            prev
              ? {
                  ...prev,
                  members:
                    typeof updater === "function"
                      ? updater(prev.members)
                      : updater,
                }
              : prev
          )
        }
        onStructuralChange={() => load(true)}
      />

      {/* 3-5. Broker, Third Parties, Deal Team — two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div className="space-y-3">
          <BrokerSection
            dealId={dealId}
            broker={data.broker}
            brokerExtra={data.brokerExtra}
            onBrokerChanged={() => load(true)}
          />
          <DealTeamInternalSection
            dealId={dealId}
            dealTeamMembers={localDealTeamMembers}
            teamMembers={teamMembers}
            onAddMember={handleAddTeamMember}
            onRemoveMember={handleRemoveTeamMember}
          />
        </div>
        <ThirdPartiesSection
          dealId={dealId}
          initialContacts={data.thirdParties}
          onStructuralChange={() => load(true)}
        />
      </div>
    </div>
  );
}
