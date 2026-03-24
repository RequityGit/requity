"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
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
  const [localDealTeamMembers, setLocalDealTeamMembers] =
    useState<DealTeamMember[]>(dealTeamMembers);

  const load = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      try {
        const res = await fetch(`/api/pipeline/${dealId}/people`);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          showError(body.error ?? "Failed to load people data");
          return;
        }
        const json = await res.json();
        setData(json);
      } catch {
        showError("Failed to load people data");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [dealId]
  );

  useEffect(() => {
    load();
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

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* 3. Broker */}
      <BrokerSection
        dealId={dealId}
        broker={data.broker}
        brokerExtra={data.brokerExtra}
        onBrokerChanged={() => load(true)}
      />

      {/* 4. Third Parties */}
      <ThirdPartiesSection
        dealId={dealId}
        initialContacts={data.thirdParties}
        onStructuralChange={() => load(true)}
      />

      {/* 5. Deal Team (Internal) */}
      <DealTeamInternalSection
        dealId={dealId}
        dealTeamMembers={localDealTeamMembers}
        teamMembers={teamMembers}
        onAddMember={handleAddTeamMember}
        onRemoveMember={handleRemoveTeamMember}
      />
    </div>
  );
}
