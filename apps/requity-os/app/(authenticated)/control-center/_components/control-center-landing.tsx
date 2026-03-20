"use client";

import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_GROUPS, type NavItem } from "../_config/nav";

function isSoon(item: NavItem) {
  return item.badge?.type === "soon";
}

export function ControlCenterLanding() {
  const router = useRouter();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Control Center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Platform-wide configuration for portal admins.
        </p>
      </div>

      {NAV_GROUPS.map((group) => (
        <div key={group.id} className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.08em]">
            {group.label}
          </p>
          {/* Grid with hairline dividers via gap-px + bg-border trick */}
          <div className="rounded-lg border border-border bg-border overflow-hidden">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px">
              {group.items.map((item) => {
                const soon = isSoon(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={soon}
                    className={cn(
                      "relative bg-background p-4 text-left transition-colors",
                      !soon && "hover:bg-accent/50 cursor-pointer",
                      soon && "opacity-40 cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (!soon) router.push(item.href);
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
                        <item.icon
                          size={16}
                          strokeWidth={1.5}
                          className="text-foreground"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground truncate">
                            {item.label}
                          </span>
                          {item.badge && (
                            <span
                              className={cn(
                                "rounded px-1.5 py-0.5 text-[10px] font-medium shrink-0",
                                item.badge.type === "soon" &&
                                  "bg-muted text-muted-foreground",
                                item.badge.type === "warn" &&
                                  "bg-warning/15 text-warning",
                                item.badge.type === "info" &&
                                  "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                              )}
                            >
                              {item.badge.text}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    {!soon && (
                      <ArrowUpRight
                        size={14}
                        strokeWidth={1.5}
                        className="absolute top-3 right-3 text-muted-foreground"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
