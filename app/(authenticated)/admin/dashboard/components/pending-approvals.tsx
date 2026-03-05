"use client";

import { useState } from "react";
import { Clock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { PendingApproval } from "../actions";

function PriorityBadge({ priority }: { priority: string }) {
  const colorMap: Record<string, string> = {
    critical: "bg-[#B23225]/10 text-[#B23225]",
    high: "bg-[#B8822A]/10 text-[#B8822A]",
    medium: "bg-muted text-muted-foreground",
    low: "bg-muted text-muted-foreground",
  };
  const cls = colorMap[priority] || colorMap.medium;

  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-px text-[10px] font-semibold uppercase tracking-wider num ${cls}`}
    >
      {priority}
    </span>
  );
}

interface PendingApprovalsProps {
  approvals: PendingApproval[];
  onApprove: (id: string) => void;
}

export function PendingApprovals({
  approvals,
  onApprove,
}: PendingApprovalsProps) {
  const [hovId, setHovId] = useState<string | null>(null);

  return (
    <Card className="mb-8 p-6">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Pending Approvals
        </span>
        <span className="rounded-full bg-gold/10 px-2.5 py-0.5 text-[11px] font-semibold text-gold num">
          {approvals.length}
        </span>
      </div>

      {approvals.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-muted-foreground">
          No pending approvals
        </div>
      ) : (
        <div className="flex flex-col gap-0.5">
          {approvals.map((a) => {
            const hov = hovId === a.id;
            const snapshot = a.deal_snapshot || {};
            const dealName =
              (snapshot.property_address as string) ||
              (snapshot.loan_number as string) ||
              "Unknown Deal";
            const borrowerName =
              (snapshot.borrower_name as string) || "Unknown";
            const loanType = (snapshot.type as string) || a.entity_type;
            const amount = snapshot.loan_amount
              ? `$${(Number(snapshot.loan_amount) / 1000).toFixed(0)}K`
              : "";

            return (
              <div
                key={a.id}
                className={`flex items-center gap-4 rounded-md px-3 py-3 transition-colors duration-150 cursor-pointer ${
                  hov ? "bg-dash-surface-alt" : ""
                }`}
                onMouseEnter={() => setHovId(a.id)}
                onMouseLeave={() => setHovId(null)}
              >
                {/* Left: deal info */}
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-foreground">
                    {dealName}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground">
                      {borrowerName}
                    </span>
                    <span className="text-[11px] text-dash-text-faint">
                      ·
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {loanType}
                    </span>
                  </div>
                </div>

                {/* Center: wait time */}
                <div className="flex shrink-0 items-center gap-1.5">
                  <Clock
                    className={`h-3.5 w-3.5 ${
                      a.wait_days >= 5
                        ? "text-[#B23225]"
                        : "text-[#B8822A]"
                    }`}
                    strokeWidth={1.5}
                  />
                  <span
                    className={`text-[11px] num ${
                      a.wait_days >= 5
                        ? "text-[#B23225]"
                        : "text-muted-foreground"
                    }`}
                  >
                    Waiting {a.wait_days}d
                  </span>
                </div>

                {/* Priority + amount */}
                <div className="flex shrink-0 items-center gap-2.5">
                  <PriorityBadge priority={a.priority} />
                  {amount && (
                    <span className="min-w-[60px] text-right text-sm font-bold text-foreground num">
                      {amount}
                    </span>
                  )}
                </div>

                {/* Hover actions */}
                <div
                  className={`flex shrink-0 gap-1.5 transition-opacity duration-150 ${
                    hov ? "opacity-100" : "pointer-events-none w-0 opacity-0 overflow-hidden"
                  }`}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onApprove(a.id);
                    }}
                    className="whitespace-nowrap rounded-md bg-[#1B7A44] px-3 py-1.5 text-[11px] font-semibold text-white transition-colors hover:bg-[#1B7A44]/90"
                  >
                    Approve
                  </button>
                  <button
                    onClick={(e) => e.stopPropagation()}
                    className="whitespace-nowrap rounded-md border border-border bg-transparent px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                  >
                    Review
                  </button>
                </div>

                {/* Chevron when not hovered */}
                {!hov && (
                  <ChevronRight
                    className="h-3.5 w-3.5 shrink-0 text-dash-text-faint"
                    strokeWidth={1.5}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
