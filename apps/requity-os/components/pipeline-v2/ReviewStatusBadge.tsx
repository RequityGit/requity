"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

type ReviewStatus =
  | "pending"
  | "processing"
  | "ready"
  | "applied"
  | "partially_applied"
  | "rejected"
  | "error"
  | null;

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
  onClick?: () => void;
}

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    dotColor: string;
    animate?: boolean;
    spin?: boolean;
    clickable?: boolean;
  }
> = {
  pending: {
    label: "Queued",
    dotColor: "bg-muted-foreground",
    animate: true,
  },
  processing: {
    label: "Analyzing...",
    dotColor: "bg-blue-500",
    animate: true,
    spin: true,
  },
  ready: {
    label: "Review Ready",
    dotColor: "bg-blue-500",
    clickable: true,
  },
  applied: {
    label: "Applied",
    dotColor: "bg-green-500",
    clickable: true,
  },
  partially_applied: {
    label: "Partially Applied",
    dotColor: "bg-yellow-500",
    clickable: true,
  },
  rejected: {
    label: "Rejected",
    dotColor: "bg-muted-foreground",
    clickable: true,
  },
  error: {
    label: "Review Failed",
    dotColor: "bg-destructive",
    clickable: true,
  },
};

export function ReviewStatusBadge({ status, onClick }: ReviewStatusBadgeProps) {
  if (!status) return null;

  const config = STATUS_CONFIG[status];
  if (!config) return null;

  return (
    <Badge
      variant="outline"
      className={`text-[10px] font-medium gap-1.5 ${config.clickable ? "cursor-pointer hover:bg-muted/50" : ""}`}
      onClick={config.clickable ? onClick : undefined}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${config.dotColor} ${config.animate ? "animate-pulse" : ""}`}
      />
      {config.spin && <Loader2 className="h-3 w-3 animate-spin" />}
      {config.label}
    </Badge>
  );
}
