"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useCallback } from "react";
import { UserPlus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealBorrowingEntity, DealBorrowerMember } from "@/app/types/borrower";
import { BorrowerMemberRow } from "./BorrowerMemberRow";
import { AddBorrowerDialog } from "./AddBorrowerDialog";

interface BorrowerMemberTableProps {
  dealId: string;
  entity: DealBorrowingEntity | null;
  members: DealBorrowerMember[];
  setMembers: React.Dispatch<React.SetStateAction<DealBorrowerMember[]>>;
  onUpdated: () => void;
}

export function BorrowerMemberTable({
  dealId,
  entity,
  members,
  setMembers,
  onUpdated,
}: BorrowerMemberTableProps) {
  const onOptimisticUpdate = useCallback(
    (memberId: string, updates: Partial<DealBorrowerMember>) => {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, ...updates } : m))
      );
    },
    [setMembers]
  );
  const atMax = members.length >= 5;
  const canAdd = !!entity && !atMax;

  const totalOwnership = members.reduce((sum, m) => sum + Number(m.ownership_pct ?? 0), 0);
  const is100 = Math.abs(totalOwnership - 100) < 0.01;

  return (
    <div className="rounded-xl border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Borrowers / Signers
          {members.length > 0 && (
            <span className="ml-1.5 text-muted-foreground/60 num font-mono tabular-nums">
              ({members.length}/5)
            </span>
          )}
        </h4>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <AddBorrowerDialog
                  dealId={dealId}
                  borrowingEntityId={entity?.id ?? null}
                  existingContactIds={members.map((m) => m.contact_id)}
                  onAdded={onUpdated}
                  disabled={!canAdd}
                />
              </span>
            </TooltipTrigger>
            <TooltipContent>
              {!entity
                ? "Add a borrowing entity first"
                : atMax
                  ? "Maximum of 5 borrowers per deal"
                  : "Add a borrower"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Own %</TableHead>
              <TableHead className="text-right">FICO</TableHead>
              <TableHead className="text-right">Liquidity</TableHead>
              <TableHead className="text-right">Net Worth</TableHead>
              <TableHead className="w-[80px]">
                <span className="flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  Guarantor
                </span>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No borrower members yet. Add a borrowing entity above, then add borrowers.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <BorrowerMemberRow
                  key={m.id}
                  member={m}
                  dealId={dealId}
                  onOptimisticUpdate={onOptimisticUpdate}
                  onUpdated={onUpdated}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {members.length > 0 && (
        <div
          className={cn(
            "px-4 py-2 border-t text-sm num font-mono tabular-nums",
            is100 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
          )}
        >
          Total Ownership: {totalOwnership.toFixed(1)}% {is100 ? "✓" : ""}
        </div>
      )}
    </div>
  );
}
