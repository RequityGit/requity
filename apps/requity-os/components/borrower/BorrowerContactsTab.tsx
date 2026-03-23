"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { showError } from "@/lib/toast";
import type { DealBorrowingEntity, DealBorrowerMember } from "@/app/types/borrower";
import { BorrowingEntityCard } from "./BorrowingEntityCard";
import { BorrowerMemberTable } from "./BorrowerMemberTable";

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
      const res = await fetch(`/api/pipeline/${dealId}/borrower`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        showError(body.error ?? "Failed to load borrower data");
        return;
      }
      const data = await res.json();
      setEntity(data.entity);
      setMembers(data.members);
    } catch {
      showError("Failed to load borrower data");
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
        onSaved={() => load(true)}
        onDeleted={() => load(true)}
      />
      <BorrowerMemberTable
        dealId={dealId}
        entity={entity}
        members={members}
        setMembers={setMembers}
        onStructuralChange={() => load(true)}
      />
    </div>
  );
}
