"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Phone,
  Play,
  Pause,
  CheckCircle2,
  FileText,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DialerList } from "@/lib/dialer/types";

interface DialerListsPageProps {
  lists: DialerList[];
  teamMembers: { id: string; full_name: string }[];
}

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    color: "bg-muted text-muted-foreground",
    icon: FileText,
  },
  active: {
    label: "Active",
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: Play,
  },
  paused: {
    label: "Paused",
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    icon: Pause,
  },
  completed: {
    label: "Completed",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    icon: CheckCircle2,
  },
};

export function DialerListsPage({ lists, teamMembers }: DialerListsPageProps) {
  const [filter, setFilter] = useState<string>("all");

  const filtered =
    filter === "all" ? lists : lists.filter((l) => l.status === filter);

  const teamLookup: Record<string, string> = {};
  teamMembers.forEach((t) => {
    teamLookup[t.id] = t.full_name;
  });

  return (
    <div className="space-y-4">
      {/* Filter tabs + Create button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
          {["all", "draft", "active", "paused", "completed"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize",
                filter === f
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f}
            </button>
          ))}
        </div>

        <Link
          href="/dialer/new"
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.5} />
          New List
        </Link>
      </div>

      {/* Lists table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Phone className="h-8 w-8 text-muted-foreground/40 mb-3" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">
            {filter === "all"
              ? "No dialer lists yet. Create one to get started."
              : `No ${filter} lists.`}
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Name
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Status
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Assigned To
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Progress
                </th>
                <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Created
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((list) => {
                const config = statusConfig[list.status] || statusConfig.draft;
                const Icon = config.icon;
                const progressPct =
                  list.total_contacts > 0
                    ? Math.round(
                        (list.completed_contacts / list.total_contacts) * 100
                      )
                    : 0;

                return (
                  <tr
                    key={list.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dialer/${list.id}`}
                        className="text-sm font-medium text-foreground hover:underline"
                      >
                        {list.name}
                      </Link>
                      {list.description && (
                        <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[250px]">
                          {list.description}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full",
                          config.color
                        )}
                      >
                        <Icon className="h-3 w-3" strokeWidth={1.5} />
                        {config.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {list.assigned_to
                        ? teamLookup[list.assigned_to] || "—"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className="h-full bg-foreground/60 rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-muted-foreground">
                          {list.completed_contacts}/{list.total_contacts}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(list.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(list.status === "draft" || list.status === "paused") && (
                        <Link
                          href={`/dialer/${list.id}/session`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-foreground text-background hover:opacity-90 transition-opacity"
                        >
                          <Play className="h-3 w-3" strokeWidth={1.5} />
                          Start
                        </Link>
                      )}
                      {list.status === "active" && (
                        <Link
                          href={`/dialer/${list.id}/session`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          <Phone className="h-3 w-3" strokeWidth={1.5} />
                          Resume
                        </Link>
                      )}
                      {list.status === "completed" && (
                        <Link
                          href={`/dialer/${list.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors"
                        >
                          <Users className="h-3 w-3" strokeWidth={1.5} />
                          View
                        </Link>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
