"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { DealBorrowerMember } from "@/app/types/borrower";

interface BorrowerRollupSummaryProps {
  members: DealBorrowerMember[];
}

export function BorrowerRollupSummary({ members }: BorrowerRollupSummaryProps) {
  const combinedLiquidity = members.reduce((sum, m) => sum + Number(m.liquidity ?? 0), 0);
  const combinedNetWorth = members.reduce((sum, m) => sum + Number(m.net_worth ?? 0), 0);
  const scores = members.map((m) => m.credit_score ?? 0).filter((s) => s > 0);
  const lowestFico = scores.length > 0 ? Math.min(...scores) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Rollup Summary
        </h4>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Combined Liquidity</span>
          <span className="num font-mono tabular-nums">
            {members.length > 0 ? formatCurrency(combinedLiquidity) : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Combined Net Worth</span>
          <span className="num font-mono tabular-nums">
            {members.length > 0 ? formatCurrency(combinedNetWorth) : "—"}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Lowest FICO</span>
          <span className="num font-mono tabular-nums">
            {lowestFico != null ? lowestFico : "—"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
