"use client";

import { Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { BorrowerRequest } from "../actions";

interface BorrowerTrackerProps {
  requests: BorrowerRequest[];
  onFollowUp: (id: string) => void;
}

export function BorrowerTracker({
  requests,
  onFollowUp,
}: BorrowerTrackerProps) {
  const overdueCount = requests.filter((b) => b.status === "overdue").length;

  return (
    <Card className="mb-8 p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Waiting on Borrowers
        </span>
        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-[11px] font-medium text-dash-text-faint">
            {[
              { label: "Overdue", color: "bg-[#B23225]" },
              { label: "Aging", color: "bg-[#B8822A]" },
              { label: "Pending", color: "bg-muted-foreground" },
            ].map(({ label, color }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                {label}
              </span>
            ))}
          </div>
          {overdueCount > 0 && (
            <span className="rounded-full bg-[#B23225]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#B23225] num">
              {overdueCount} overdue
            </span>
          )}
        </div>
      </div>

      {requests.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-muted-foreground">
          No outstanding borrower requests
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="grid grid-cols-[1.2fr_1.4fr_2fr_70px_60px_100px] gap-3 px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-dash-text-faint">
            <span>Borrower</span>
            <span>Deal</span>
            <span>Request</span>
            <span>Sent</span>
            <span>Nudges</span>
            <span />
          </div>

          {/* Rows */}
          {requests.map((b) => {
            const statusColor =
              b.status === "overdue"
                ? "bg-[#B23225]"
                : b.status === "warning"
                ? "bg-[#B8822A]"
                : "bg-muted-foreground";
            const isOverdue = b.status === "overdue";
            const sentColor =
              b.days_since_sent >= 5
                ? "text-[#B23225]"
                : b.days_since_sent >= 3
                ? "text-[#B8822A]"
                : "text-muted-foreground";

            return (
              <div
                key={b.id}
                className={`mt-1 grid grid-cols-[1.2fr_1.4fr_2fr_70px_60px_100px] items-center gap-3 rounded-md border px-4 py-3 transition-colors duration-150 hover:bg-dash-surface-alt ${
                  isOverdue
                    ? "border-[#B23225]/10 bg-[#B23225]/[0.03]"
                    : "border-border bg-transparent"
                }`}
              >
                <span className="truncate text-[13px] font-medium text-foreground">
                  {b.borrower_name}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {b.loan_name || b.loan_number || "Unknown"}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColor}`}
                  />
                  <span className="truncate text-[13px] text-foreground">
                    {b.description}
                  </span>
                </div>
                <span className={`text-xs font-semibold num ${sentColor}`}>
                  {b.days_since_sent}d
                </span>
                <span className="text-xs text-dash-text-faint num">
                  {b.follow_up_count}
                </span>
                <button
                  onClick={() => onFollowUp(b.id)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                    isOverdue
                      ? "bg-[#B8822A]/10 text-[#B8822A] hover:bg-[#B8822A]/20"
                      : "bg-[#2E6EA6]/10 text-[#2E6EA6] hover:bg-[#2E6EA6]/20"
                  }`}
                >
                  <Send className="h-3 w-3" strokeWidth={1.5} />
                  {b.follow_up_count > 0 ? "Nudge" : "Follow Up"}
                </button>
              </div>
            );
          })}
        </>
      )}
    </Card>
  );
}
