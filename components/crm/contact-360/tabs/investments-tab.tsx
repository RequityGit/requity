"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp } from "lucide-react";
import { StagePill, EmptyState, MonoValue } from "../shared";
import { formatCurrency } from "@/lib/format";
import type { InvestorCommitmentData } from "../types";

interface InvestmentsTabProps {
  commitments: InvestorCommitmentData[];
  contactId: string;
}

export function InvestmentsTab({ commitments, contactId }: InvestmentsTabProps) {
  if (commitments.length === 0) {
    return (
      <EmptyState
        title="No investments yet"
        description="Record a new investment for this investor."
        icon={TrendingUp}
        action={
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 rounded-lg bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90"
          >
            <TrendingUp className="h-3.5 w-3.5" strokeWidth={1.5} />
            New Investment
          </Button>
        }
      />
    );
  }

  const totalCommitted = commitments.reduce(
    (s, c) => s + (c.commitment_amount || 0),
    0
  );
  const totalFunded = commitments.reduce(
    (s, c) => s + (c.funded_amount || 0),
    0
  );
  const totalUnfunded = commitments.reduce(
    (s, c) => s + (c.unfunded_amount || 0),
    0
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-xl border-[#E5E5E7] bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-[#6B6B6B] mb-1">Total Committed</p>
            <MonoValue className="text-lg font-semibold text-[#1A1A1A]">
              {formatCurrency(totalCommitted)}
            </MonoValue>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#E5E5E7] bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-[#6B6B6B] mb-1">Total Funded</p>
            <MonoValue className="text-lg font-semibold text-[#1A1A1A]">
              {formatCurrency(totalFunded)}
            </MonoValue>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#E5E5E7] bg-white">
          <CardContent className="p-4">
            <p className="text-xs text-[#6B6B6B] mb-1">Unfunded</p>
            <MonoValue className="text-lg font-semibold text-[#1A1A1A]">
              {formatCurrency(totalUnfunded)}
            </MonoValue>
          </CardContent>
        </Card>
      </div>

      {/* Commitment Cards */}
      <div className="space-y-3">
        <p className="text-xs font-medium text-[#6B6B6B] uppercase tracking-wider">
          Fund Commitments ({commitments.length})
        </p>
        {commitments.map((c) => (
          <Card
            key={c.id}
            className="rounded-xl border-[#E5E5E7] bg-white hover:bg-[#F7F7F8] transition-colors"
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-[#1A1A1A]">
                    {c.fund_name || "Unknown Fund"}
                  </p>
                </div>
                {c.status && <StagePill stage={c.status} />}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-[#6B6B6B]">Committed</p>
                  <MonoValue className="text-sm font-medium text-[#1A1A1A]">
                    {formatCurrency(c.commitment_amount)}
                  </MonoValue>
                </div>
                <div>
                  <p className="text-xs text-[#6B6B6B]">Funded</p>
                  <MonoValue className="text-sm font-medium text-[#1A1A1A]">
                    {formatCurrency(c.funded_amount)}
                  </MonoValue>
                </div>
                <div>
                  <p className="text-xs text-[#6B6B6B]">Unfunded</p>
                  <MonoValue className="text-sm font-medium text-[#1A1A1A]">
                    {formatCurrency(c.unfunded_amount)}
                  </MonoValue>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
