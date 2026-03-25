"use client";

import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddCompanyDialog } from "@/components/crm/add-company-dialog";
import { Search, X, Plus, Building2 } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CRM_COMPANY_TYPES } from "@/lib/constants";
import type { CompanyRowV2 } from "./crm-v2-page";

interface MobileCompanyListProps {
  companies: CompanyRowV2[];
  allCount: number;
  search: string;
  onSearchChange: (v: string) => void;
}

type ListItem =
  | { type: "header"; letter: string }
  | { type: "row"; company: CompanyRowV2 };

export function MobileCompanyList({
  companies,
  allCount,
  search,
  onSearchChange,
}: MobileCompanyListProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = useMemo<ListItem[]>(() => {
    const sorted = [...companies].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );

    const grouped = new Map<string, CompanyRowV2[]>();
    for (const c of sorted) {
      const firstChar = c.name.charAt(0).toUpperCase();
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
      for (const company of grouped.get(letter)!) {
        flat.push({ type: "row", company });
      }
    }
    return flat;
  }, [companies]);

  const virtualizer = useVirtualizer({
    count: items.length + 1, // +1 for footer count
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => {
      if (i >= items.length) return 48; // footer
      return items[i].type === "header" ? 28 : 60;
    },
    overscan: 10,
  });

  function getTypeLabel(c: CompanyRowV2): string | null {
    const types = c.company_types?.length ? c.company_types : [c.company_type];
    const labels = types
      .map((ct) => CRM_COMPANY_TYPES.find((t) => t.value === ct)?.label ?? ct)
      .filter(Boolean);
    return labels.length > 0 ? labels.join(", ") : null;
  }

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
          <AddCompanyDialog
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
        {companies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={search ? "No companies match your search" : "No companies yet"}
            description={search ? undefined : "Add your first company to get started"}
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
                    {companies.length} compan{companies.length !== 1 ? "ies" : "y"}
                    {allCount !== companies.length && ` of ${allCount}`}
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

              const c = item.company;
              const typeLabel = getTypeLabel(c);
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
                  onClick={() => router.push(`/companies/${c.company_number}`)}
                  className="mobile-list-row"
                >
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-foreground truncate">
                      {c.name}
                    </div>
                    {typeLabel && (
                      <div className="text-xs text-muted-foreground truncate">
                        {typeLabel}
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
