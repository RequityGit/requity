"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";
import { Search, X, Plus, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CrmAvatar, getInitials } from "./crm-primitives";
import type { CrmContactRow } from "./crm-v2-page";

interface TeamMember {
  id: string;
  full_name: string;
}

interface MobileContactListProps {
  contacts: CrmContactRow[];
  allCount: number;
  teamMembers: TeamMember[];
  currentUserId: string;
  search: string;
  onSearchChange: (v: string) => void;
}

type ListItem =
  | { type: "header"; letter: string }
  | { type: "row"; contact: CrmContactRow };

export function MobileContactList({
  contacts,
  allCount,
  teamMembers,
  currentUserId,
  search,
  onSearchChange,
}: MobileContactListProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = useMemo<ListItem[]>(() => {
    const sorted = [...contacts].sort((a, b) => {
      const aName = (a.last_name || a.first_name || "").toLowerCase();
      const bName = (b.last_name || b.first_name || "").toLowerCase();
      return aName.localeCompare(bName);
    });

    const grouped = new Map<string, CrmContactRow[]>();
    for (const c of sorted) {
      const firstChar = (c.last_name || c.first_name || "")
        .charAt(0)
        .toUpperCase();
      const letter = /^[A-Z]$/.test(firstChar) ? firstChar : "#";
      if (!grouped.has(letter)) grouped.set(letter, []);
      grouped.get(letter)!.push(c);
    }

    const letters = Array.from(grouped.keys()).sort((a, b) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });

    const flat: ListItem[] = [];
    for (const letter of letters) {
      flat.push({ type: "header", letter });
      for (const contact of grouped.get(letter)!) {
        flat.push({ type: "row", contact });
      }
    }
    return flat;
  }, [contacts]);

  const virtualizer = useVirtualizer({
    count: items.length + 1, // +1 for footer count
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => {
      if (i >= items.length) return 48; // footer
      return items[i].type === "header" ? 28 : 60;
    },
    overscan: 10,
  });

  return (
    <div className="flex flex-col h-[calc(100dvh-8rem)]">
      {/* Sticky search bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm px-4 py-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search"
              className="pl-9 h-9 rounded-lg bg-muted/50 border-transparent focus:border-primary/60"
            />
            {search && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <AddContactDialog
            teamMembers={teamMembers}
            currentUserId={currentUserId}
            trigger={
              <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <Plus className="h-5 w-5" />
              </Button>
            }
          />
        </div>
      </div>

      {/* Scrollable list */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto mobile-scroll">
        {contacts.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? "No contacts match your search" : "No contacts yet"}
            description={search ? undefined : "Add your first contact to get started"}
            compact
          />
        ) : (
          <div
            style={{ height: virtualizer.getTotalSize(), position: "relative" }}
          >
            {virtualizer.getVirtualItems().map((vi) => {
              // Footer count row
              if (vi.index >= items.length) {
                return (
                  <div
                    key="footer"
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: vi.size,
                      transform: `translateY(${vi.start}px)`,
                    }}
                    className="flex items-center justify-center text-xs text-muted-foreground"
                  >
                    {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
                    {allCount !== contacts.length && ` of ${allCount}`}
                  </div>
                );
              }

              const item = items[vi.index];

              if (item.type === "header") {
                return (
                  <div
                    key={`header-${item.letter}`}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: vi.size,
                      transform: `translateY(${vi.start}px)`,
                    }}
                    className="mobile-section-header"
                  >
                    {item.letter}
                  </div>
                );
              }

              const c = item.contact;
              return (
                <div
                  key={c.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: vi.size,
                    transform: `translateY(${vi.start}px)`,
                  }}
                  onClick={() => router.push(`/contacts/${c.contact_number}`)}
                  className="mobile-list-row"
                >
                  <CrmAvatar
                    text={getInitials(c.first_name || "", c.last_name || "")}
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {[c.first_name, c.last_name].filter(Boolean).join(" ") ||
                        "Unknown"}
                    </div>
                    {c.company_name && (
                      <div className="text-xs text-muted-foreground truncate">
                        {c.company_name}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
