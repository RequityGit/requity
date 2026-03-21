"use client";

import { forwardRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, ExternalLink, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PipelineDealData } from "../types";
import { STATUS_CONFIG } from "../types";

interface Props {
  deals: PipelineDealData[];
  loading?: boolean;
  dealCount: number;
}

export const CollapsiblePipelineDealsSection = forwardRef<HTMLDivElement, Props>(
  function CollapsiblePipelineDealsSection({ deals, loading = false, dealCount }, ref) {
    const [open, setOpen] = useState(true);

    if (dealCount === 0) return null;

    const displayCount = loading ? dealCount : deals.length;

    return (
      <div ref={ref} className="rounded-lg border border-border bg-card">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center justify-between w-full px-5 py-3.5 text-left"
        >
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-semibold">
              Pipeline Deals ({displayCount})
            </span>
          </div>
          {open ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {open && (
          <div className="border-t border-border">
            {loading && deals.length === 0 ? (
              <div className="px-5 py-6 space-y-2">
                <Skeleton className="h-10 w-full rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="px-5 py-2 text-left font-medium text-xs">Deal</th>
                  <th className="px-3 py-2 text-left font-medium text-xs">Stage</th>
                  <th className="px-3 py-2 text-right font-medium text-xs">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-xs">Type</th>
                  <th className="px-3 py-2 text-left font-medium text-xs">Role</th>
                  <th className="px-5 py-2 text-right font-medium text-xs" />
                </tr>
              </thead>
              <tbody>
                {deals.map((deal) => {
                  const stageStyle =
                    STATUS_CONFIG[deal.stage] ?? STATUS_CONFIG.default;
                  return (
                    <tr
                      key={deal.id}
                      className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-5 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {deal.name}
                          </span>
                          {deal.deal_number && (
                            <span className="text-xs text-muted-foreground">
                              {deal.deal_number}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{
                            background: stageStyle.bg,
                            color: stageStyle.text,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ background: stageStyle.dot }}
                          />
                          {deal.stage.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums num">
                        {deal.amount
                          ? `$${deal.amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`
                          : "-"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">
                        {deal.loan_type ?? deal.asset_class ?? "-"}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground capitalize">
                        {deal.role ?? "-"}
                      </td>
                      <td className="px-5 py-2.5 text-right">
                        <Link
                          href={`/pipeline/${deal.id}`}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          View
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            )}
          </div>
        )}
      </div>
    );
  }
);
