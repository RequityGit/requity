"use client";

import { useState } from "react";
import { GitBranch, FileUp, AlertCircle, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { DealLogEntry } from "../actions";

const logConfig: Record<
  string,
  { icon: typeof GitBranch; color: string; bgColor: string; borderColor: string }
> = {
  stage_change: {
    icon: GitBranch,
    color: "text-[#2E6EA6]",
    bgColor: "bg-[#2E6EA6]/10",
    borderColor: "border-[#2E6EA6]/25",
  },
  document_upload: {
    icon: FileUp,
    color: "text-[#1B7A44]",
    bgColor: "bg-[#1B7A44]/10",
    borderColor: "border-[#1B7A44]/25",
  },
  missing_doc: {
    icon: AlertCircle,
    color: "text-[#B23225]",
    bgColor: "bg-[#B23225]/10",
    borderColor: "border-[#B23225]/25",
  },
  condition_update: {
    icon: FileUp,
    color: "text-[#2E6EA6]",
    bgColor: "bg-[#2E6EA6]/10",
    borderColor: "border-[#2E6EA6]/25",
  },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

interface DealActivityLogProps {
  entries: DealLogEntry[];
}

export function DealActivityLog({ entries }: DealActivityLogProps) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? entries : entries.slice(0, 4);

  return (
    <Card className="mb-8 p-6">
      <div className="mb-5 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Deal Activity Log
        </span>
        <span className="text-[11px] font-medium text-dash-text-faint">
          Stage changes, documents, alerts
        </span>
      </div>

      {entries.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-muted-foreground">
          No recent deal activity
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border" />

          {visible.map((entry) => {
            const config = logConfig[entry.action] || logConfig.stage_change;
            const Icon = config.icon;
            const isMissing = entry.action === "missing_doc";
            const dealLabel =
              entry.property_address || entry.loan_number || "Unknown";

            return (
              <div
                key={entry.id}
                className="relative flex items-start gap-4 rounded-md px-3 py-3 transition-colors duration-150 hover:bg-dash-surface-alt"
              >
                <div
                  className={`relative z-10 flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full border-[1.5px] ${config.bgColor} ${config.borderColor}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} strokeWidth={1.5} />
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span
                        className={`text-[13px] font-semibold ${
                          isMissing ? "text-[#B23225]" : "text-foreground"
                        }`}
                      >
                        {dealLabel}
                      </span>
                      <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
                        {entry.description}
                      </p>
                    </div>
                    <span className="shrink-0 text-[11px] font-medium text-dash-text-faint num">
                      {timeAgo(entry.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {entries.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-muted py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80"
        >
          {showAll ? "Show less" : `Show ${entries.length - 4} more`}
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform duration-150 ${
              showAll ? "rotate-180" : ""
            }`}
            strokeWidth={1.5}
          />
        </button>
      )}
    </Card>
  );
}
