"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCallback, useMemo } from "react";
import { Shield, TrendingUp, DollarSign, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";
import type { DealBorrowingEntity, DealBorrowerMember } from "@/app/types/borrower";
import { BorrowerMemberRow } from "./BorrowerMemberRow";
import { AddBorrowerDialog } from "./AddBorrowerDialog";

interface BorrowerMemberTableProps {
  dealId: string;
  entity: DealBorrowingEntity | null;
  members: DealBorrowerMember[];
  setMembers: React.Dispatch<React.SetStateAction<DealBorrowerMember[]>>;
  /** Called only for structural changes (add/remove member) that need a full re-fetch */
  onStructuralChange: () => void;
}

export function BorrowerMemberTable({
  dealId,
  entity,
  members,
  setMembers,
  onStructuralChange,
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

  // ── Rollup stats (computed from optimistic state, no DB needed) ──
  const stats = useMemo(() => {
    const totalOwnership = members.reduce((sum, m) => sum + Number(m.ownership_pct ?? 0), 0);
    const combinedLiquidity = members.reduce((sum, m) => sum + Number(m.liquidity ?? 0), 0);
    const combinedNetWorth = members.reduce((sum, m) => sum + Number(m.net_worth ?? 0), 0);
    const scores = members.map((m) => m.credit_score ?? 0).filter((s) => s > 0);
    const lowestFico = scores.length > 0 ? Math.min(...scores) : null;
    const is100 = Math.abs(totalOwnership - 100) < 0.01;
    return { totalOwnership, combinedLiquidity, combinedNetWorth, lowestFico, is100 };
  }, [members]);

  return (
    <div className="rounded-xl border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b">
        <h4 className="rq-micro-label">
          Borrowers / Signers
          {members.length > 0 && (
            <span className="ml-1.5 text-muted-foreground/60 num font-mono tabular-nums">
              ({members.length}/5)
            </span>
          )}
        </h4>
        <AddBorrowerDialog
          dealId={dealId}
          borrowingEntityId={entity?.id ?? null}
          existingContactIds={members.filter((m) => m.contact_id).map((m) => m.contact_id as string)}
          onAdded={onStructuralChange}
          disabled={atMax}
        />
      </div>

      {/* Table */}
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
              <TableHead className="text-right">Exp</TableHead>
              <TableHead>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Guar.
                </span>
              </TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No borrower members yet. Click &quot;Add Borrower&quot; to get started.
                </TableCell>
              </TableRow>
            ) : (
              members.map((m) => (
                <BorrowerMemberRow
                  key={m.id}
                  member={m}
                  dealId={dealId}
                  borrowingEntityId={entity?.id ?? null}
                  existingContactIds={members.filter((x) => x.contact_id).map((x) => x.contact_id as string)}
                  onOptimisticUpdate={onOptimisticUpdate}
                  onRemoved={onStructuralChange}
                  onLinked={onStructuralChange}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Compact rollup footer */}
      {members.length > 0 && (
        <div className="border-t px-5 py-2.5 flex flex-wrap items-center gap-x-6 gap-y-1 text-xs">
          {/* Ownership total */}
          <span
            className={cn(
              "num font-mono tabular-nums font-medium",
              stats.is100 ? "rq-value-positive" : "rq-value-warn"
            )}
          >
            Ownership: {stats.totalOwnership.toFixed(1)}%{stats.is100 ? " \u2713" : ""}
          </span>

          <span className="text-border">|</span>

          {/* Lowest FICO */}
          <span className="flex items-center gap-1 text-muted-foreground">
            <CreditCard className="h-3 w-3" />
            <span>Lowest FICO</span>
            <span className="num font-mono tabular-nums text-foreground font-medium">
              {stats.lowestFico ?? "\u2014"}
            </span>
          </span>

          <span className="text-border">|</span>

          {/* Combined Liquidity */}
          <span className="flex items-center gap-1 text-muted-foreground">
            <DollarSign className="h-3 w-3" />
            <span>Liquidity</span>
            <span className="num font-mono tabular-nums text-foreground font-medium">
              {stats.combinedLiquidity > 0 ? formatCurrency(stats.combinedLiquidity) : "\u2014"}
            </span>
          </span>

          <span className="text-border">|</span>

          {/* Combined Net Worth */}
          <span className="flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3" />
            <span>Net Worth</span>
            <span className="num font-mono tabular-nums text-foreground font-medium">
              {stats.combinedNetWorth > 0 ? formatCurrency(stats.combinedNetWorth) : "\u2014"}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
