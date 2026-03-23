"use client";

import { BorrowingEntityCard } from "@/components/borrower/BorrowingEntityCard";
import type { DealBorrowingEntity } from "@/app/types/borrower";

interface BorrowingEntitySectionProps {
  dealId: string;
  entity: DealBorrowingEntity | null;
  onStructuralChange: () => void;
}

export function BorrowingEntitySection({
  dealId,
  entity,
  onStructuralChange,
}: BorrowingEntitySectionProps) {
  return (
    <BorrowingEntityCard
      dealId={dealId}
      entity={entity}
      onSaved={onStructuralChange}
      onDeleted={onStructuralChange}
    />
  );
}
