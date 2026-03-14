"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DealBorrowingEntity, DealBorrowerMember } from "@/app/types/borrower";
import { fetchBorrowingEntity, fetchBorrowerMembers } from "@/app/(authenticated)/(admin)/pipeline/[id]/borrower-actions";
import { BorrowingEntityCard } from "./BorrowingEntityCard";
import { BorrowerMemberTable } from "./BorrowerMemberTable";
import { BorrowerRollupSummary } from "./BorrowerRollupSummary";

interface BorrowerContactsTabProps {
  dealId: string;
}

export function BorrowerContactsTab({ dealId }: BorrowerContactsTabProps) {
  const [entity, setEntity] = useState<DealBorrowingEntity | null>(null);
  const [members, setMembers] = useState<DealBorrowerMember[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [entityRes, membersRes] = await Promise.all([
        fetchBorrowingEntity(dealId),
        fetchBorrowerMembers(dealId),
      ]);
      if (entityRes.error) toast.error(entityRes.error);
      else setEntity(entityRes.data);
      if (membersRes.error) toast.error(membersRes.error);
      else setMembers(membersRes.data);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [dealId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BorrowingEntityCard
        dealId={dealId}
        entity={entity}
        onSaved={load}
        onDeleted={load}
      />
      <BorrowerMemberTable
        dealId={dealId}
        entity={entity}
        members={members}
        setMembers={setMembers}
        onUpdated={() => load(true)}
      />
      <BorrowerRollupSummary members={members} />
    </div>
  );
}
