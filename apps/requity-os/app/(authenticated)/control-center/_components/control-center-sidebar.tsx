"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NAV_GROUPS, type NavItem } from "../_config/nav";

function isSoon(item: NavItem) {
  return item.badge?.type === "soon";
}

export function ControlCenterSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();

  const isActive = (item: NavItem) => {
    if (item.href === "/control-center") return pathname === "/control-center";
    return pathname.startsWith(item.href);
  };

  // Filtered flat list for search mode
  const filteredItems = query
    ? NAV_GROUPS.flatMap((g) =>
        g.items
          .filter((item) => !isSoon(item))
          .filter(
            (item) =>
              item.label.toLowerCase().includes(query) ||
              item.desc.toLowerCase().includes(query)
          )
          .map((item) => ({ ...item, groupLabel: g.label }))
      )
    : null;

  return (
    <aside className="w-[260px] shrink-0 border-r border-border bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-5 pb-4 border-b border-border space-y-3">
        <div>
          <p className="text-[13px] font-semibold text-foreground">
            Control Center
          </p>
          <p className="text-[11px] text-muted-foreground">Super Admin</p>
        </div>
        <div className="relative">
          <Search
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
            size={14}
            strokeWidth={1.5}
          />
          <Input
            placeholder="Search settings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1">
        <div className="px-2 py-3 space-y-4">
          {filteredItems !== null ? (
            // Search results
            filteredItems.length > 0 ? (
              <div className="space-y-0.5">
                {filteredItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start gap-2.5 h-auto py-2 px-3 text-[13px] font-medium",
                      isActive(item) && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => {
                      router.push(item.href);
                      setSearch("");
                    }}
                  >
                    <item.icon size={14} strokeWidth={1.5} className="shrink-0" />
                    <div className="flex flex-col items-start gap-0.5 min-w-0">
                      <span className="truncate">{item.label}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {item.groupLabel}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-6">
                No settings found.
              </p>
            )
          ) : (
            // Normal nav groups
            NAV_GROUPS.map((group) => (
              <div key={group.id} className="space-y-0.5">
                <p className="px-3 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.08em]">
                  {group.label}
                </p>
                {group.items.map((item) => {
                  const soon = isSoon(item);
                  return (
                    <Button
                      key={item.id}
                      variant="ghost"
                      disabled={soon}
                      className={cn(
                        "w-full justify-start gap-2.5 h-auto py-2 px-3 text-[13px] font-medium",
                        isActive(item) && "bg-accent text-accent-foreground",
                        soon && "opacity-40 cursor-not-allowed pointer-events-none"
                      )}
                      onClick={() => router.push(item.href)}
                    >
                      <item.icon
                        size={14}
                        strokeWidth={1.5}
                        className="shrink-0"
                      />
                      <span className="truncate flex-1 text-left">
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
                    </Button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
