"use client";

import { cn } from "@/lib/utils";

type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "gold";

interface StatusBadgeProps {
  status: string;
  variant?: BadgeVariant;
  className?: string;
}

const STATUS_VARIANT_MAP: Record<string, BadgeVariant> = {
  funded: "success",
  servicing: "success",
  approved: "success",
  clear_to_close: "success",
  active: "success",
  paid: "success",
  paid_off: "success",
  posted: "success",
  activated: "success",
  open: "success",
  verified: "success",
  processing: "gold",
  underwriting: "gold",
  pending: "gold",
  under_review: "gold",
  submitted: "gold",
  in_review: "gold",
  application: "gold",
  link_sent: "gold",
  partially_called: "gold",
  received: "gold",
  requested: "gold",
  lead: "neutral",
  draft: "neutral",
  not_requested: "neutral",
  not_applicable: "neutral",
  normal: "neutral",
  closed: "neutral",
  redeemed: "neutral",
  waived: "neutral",
  fully_called: "neutral",
  fully_deployed: "neutral",
  overdue: "danger",
  rejected: "danger",
  default: "danger",
  denied: "danger",
  withdrawn: "danger",
  expired: "danger",
  nsf: "danger",
  reo: "danger",
  hot: "danger",
  reversed: "danger",
  on_hold: "warning",
  warning: "warning",
  payoff: "warning",
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success:
    "bg-status-success/10 text-status-success border border-status-success/20",
  gold: "bg-gold/10 text-gold border border-gold/20",
  danger:
    "bg-status-danger/10 text-status-danger border border-status-danger/20",
  warning:
    "bg-status-warning/10 text-status-warning border border-status-warning/20",
  neutral:
    "bg-surface-muted/10 text-surface-gray border border-surface-muted/20",
};

function formatStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, variant, className }: StatusBadgeProps) {
  const resolvedVariant =
    variant || STATUS_VARIANT_MAP[status.toLowerCase()] || "neutral";

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-body font-semibold",
        VARIANT_CLASSES[resolvedVariant],
        className
      )}
    >
      {formatStatusLabel(status)}
    </span>
  );
}
