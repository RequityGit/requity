"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import type { SOPVersion } from "@/lib/sops/types";

interface SOPVersionHistoryProps {
  versions: SOPVersion[];
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SOPVersionHistory({ versions }: SOPVersionHistoryProps) {
  const [expanded, setExpanded] = useState(false);
  const sorted = [...versions].sort(
    (a, b) => b.version_number - a.version_number
  );
  const visible = expanded ? sorted : sorted.slice(0, 3);

  if (sorted.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <h4 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Clock className="h-4 w-4 text-gold" />
          Version History
        </h4>
        {sorted.length > 3 &&
          (expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ))}
      </button>
      <div className="mt-3 space-y-2">
        {visible.map((v) => (
          <div
            key={v.id}
            className="rounded-lg border border-border bg-secondary p-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gold">
                v{v.version_number}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatDate(v.created_at)}
              </span>
            </div>
            {v.change_notes && (
              <p className="mt-1 text-xs text-muted-foreground">{v.change_notes}</p>
            )}
          </div>
        ))}
      </div>
      {!expanded && sorted.length > 3 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-xs text-gold hover:text-gold-light"
        >
          Show {sorted.length - 3} more versions
        </button>
      )}
    </div>
  );
}
