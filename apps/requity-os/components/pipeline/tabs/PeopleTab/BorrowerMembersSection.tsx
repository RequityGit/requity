"use client";

import { BorrowerMemberTable } from "@/components/borrower/BorrowerMemberTable";
import type { DealBorrowingEntity, DealBorrowerMember } from "@/app/types/borrower";

interface BorrowerMembersSectionProps {
  dealId: string;
  entity: DealBorrowingEntity | null;
  members: DealBorrowerMember[];
  setMembers: React.Dispatch<React.SetStateAction<DealBorrowerMember[]>>;
  onStructuralChange: () => void;
}

export function BorrowerMembersSection({
  dealId,
  entity,
  members,
  setMembers,
  onStructuralChange,
}: BorrowerMembersSectionProps) {
  return (
    <BorrowerMemberTable
      dealId={dealId}
      entity={entity}
      members={members}
      setMembers={setMembers}
      onStructuralChange={onStructuralChange}
    />
  );
}
