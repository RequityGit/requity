"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency, formatDate } from "@/lib/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Pencil,
  Plus,
  Minus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Send,
  Banknote,
  ScrollText,
} from "lucide-react";
import type { BudgetLineItemHistory, DrawRequest } from "./types";

interface AuditLogSubTabProps {
  auditLog: BudgetLineItemHistory[];
  drawRequests: DrawRequest[];
}

type AuditEntry = {
  id: string;
  timestamp: string;
  type: "budget" | "draw";
  action: string;
  description: string;
  amount?: number;
  previousAmount?: number;
  user?: string;
};

export function AuditLogSubTab({
  auditLog,
  drawRequests,
}: AuditLogSubTabProps) {
  const [filter, setFilter] = useState<string>("all");

  // Merge budget history and draw status changes into a unified timeline
  const entries: AuditEntry[] = [];

  // Budget line item history
  for (const h of auditLog) {
    entries.push({
      id: h.id,
      timestamp: h.changed_at,
      type: "budget",
      action: h.change_type,
      description: getChangeDescription(h),
      amount: h.new_amount ?? undefined,
      previousAmount: h.previous_amount ?? undefined,
    });
  }

  // Draw request events
  for (const dr of drawRequests) {
    if (dr.submitted_at) {
      entries.push({
        id: `draw-submit-${dr.id}`,
        timestamp: dr.submitted_at,
        type: "draw",
        action: "draw_submitted",
        description: `Draw #${dr.draw_number} submitted for ${formatCurrency(dr.amount_requested)}`,
        amount: dr.amount_requested,
      });
    }
    if (dr.reviewed_at) {
      entries.push({
        id: `draw-review-${dr.id}`,
        timestamp: dr.reviewed_at,
        type: "draw",
        action: dr.status === "rejected" ? "draw_rejected" : "draw_approved",
        description: `Draw #${dr.draw_number} ${dr.status}${
          dr.amount_approved != null
            ? ` for ${formatCurrency(dr.amount_approved)}`
            : ""
        }`,
        amount: dr.amount_approved ?? undefined,
      });
    }
    if (dr.funded_at) {
      entries.push({
        id: `draw-funded-${dr.id}`,
        timestamp: dr.funded_at,
        type: "draw",
        action: "draw_funded",
        description: `Draw #${dr.draw_number} funded — wire ${formatCurrency(dr.wire_amount)}${
          dr.wire_confirmation_number
            ? ` (conf: ${dr.wire_confirmation_number})`
            : ""
        }`,
        amount: dr.wire_amount ?? undefined,
      });
    }
  }

  // Sort by timestamp descending
  entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filtered =
    filter === "all"
      ? entries
      : filter === "budget"
      ? entries.filter((e) => e.type === "budget")
      : entries.filter((e) => e.type === "draw");

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-16 flex flex-col items-center justify-center text-center">
          <ScrollText
            className="h-12 w-12 text-muted-foreground/50 mb-4"
            strokeWidth={1.5}
          />
          <p className="text-muted-foreground">
            No audit entries for this loan.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">
          {filtered.length} event{filtered.length !== 1 ? "s" : ""}
        </h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-40 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Events</SelectItem>
            <SelectItem value="budget">Budget Changes</SelectItem>
            <SelectItem value="draw">Draw Events</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="pt-4 pb-2">
          <div className="space-y-0">
            {filtered.map((entry, idx) => {
              const isLast = idx === filtered.length - 1;
              const timestamp = new Date(entry.timestamp);
              const timeStr = timestamp.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <div key={entry.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        entry.type === "draw"
                          ? "bg-blue-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {!isLast && (
                      <div className="w-px flex-1 bg-border my-1" />
                    )}
                  </div>

                  <div className={`pb-4 flex-1 min-w-0`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-foreground flex items-center gap-1">
                        {getActionIcon(entry.action)}
                        {getActionLabel(entry.action)}
                      </span>
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {timeStr}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {entry.description}
                    </p>
                    {entry.previousAmount != null && entry.amount != null && (
                      <p className="text-xs text-muted-foreground mt-0.5 num">
                        <span className="line-through">
                          {formatCurrency(entry.previousAmount)}
                        </span>{" "}
                        →{" "}
                        <span className="font-medium">
                          {formatCurrency(entry.amount)}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getChangeDescription(h: BudgetLineItemHistory): string {
  switch (h.change_type) {
    case "created":
      return `Line item created${
        h.new_amount != null ? ` with budget ${formatCurrency(h.new_amount)}` : ""
      }`;
    case "amount_revised":
      return `Budget revised${
        h.change_reason ? `: ${h.change_reason}` : ""
      }`;
    case "description_updated":
      return "Description updated";
    case "deactivated":
      return "Line item deactivated";
    case "reactivated":
      return "Line item reactivated";
    default:
      return h.change_type.replace(/_/g, " ");
  }
}

function getActionLabel(action: string): string {
  const labels: Record<string, string> = {
    created: "Item Created",
    amount_revised: "Budget Revised",
    description_updated: "Description Updated",
    deactivated: "Item Deactivated",
    reactivated: "Item Reactivated",
    draw_submitted: "Draw Submitted",
    draw_approved: "Draw Approved",
    draw_rejected: "Draw Rejected",
    draw_funded: "Draw Funded",
  };
  return labels[action] || action.replace(/_/g, " ");
}

function getActionIcon(action: string) {
  const iconClass = "h-3 w-3";
  switch (action) {
    case "created":
      return <Plus className={iconClass} />;
    case "amount_revised":
      return <RefreshCw className={iconClass} />;
    case "deactivated":
      return <Minus className={iconClass} />;
    case "draw_submitted":
      return <Send className={iconClass} />;
    case "draw_approved":
      return <CheckCircle2 className={iconClass} />;
    case "draw_rejected":
      return <XCircle className={iconClass} />;
    case "draw_funded":
      return <Banknote className={iconClass} />;
    default:
      return <Pencil className={iconClass} />;
  }
}
