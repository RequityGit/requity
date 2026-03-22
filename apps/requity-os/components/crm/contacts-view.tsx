"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AddContactDialog } from "@/components/crm/add-contact-dialog";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCrmContactAction } from "@/app/(authenticated)/(admin)/contacts/actions";
import { showSuccess, showError } from "@/lib/toast";
import {
  CRM_RELATIONSHIP_TYPES,
  CRM_LIFECYCLE_STAGES,
} from "@/lib/constants";
import { smartDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { DateAddedFilter, filterByDateAdded } from "@/components/ui/date-added-filter";
import {
  Users,
  Search,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Eye,
  Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { CrmAvatar, RelPill, StageDot, getInitials } from "./crm-primitives";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";
import Link from "next/link";
import type { CrmContactRow } from "./crm-v2-page";

const PAGE_SIZE = 50;

interface TeamMember {
  id: string;
  full_name: string;
}

interface ContactsViewProps {
  contacts: CrmContactRow[];
  teamMembers: TeamMember[];
  currentUserId: string;
  isSuperAdmin?: boolean;
}

export function ContactsView({
  contacts,
  teamMembers,
  currentUserId,
  isSuperAdmin = false,
}: ContactsViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contactSearch, setContactSearch] = useState(searchParams.get("q") ?? "");
  const debouncedSearch = useDebounce(contactSearch, 300);
  const [relFilter, setRelFilter] = useState(searchParams.get("rel") ?? "all");
  const [stageFilter, setStageFilter] = useState(searchParams.get("stage") ?? "all");
  const [dateAdded, setDateAdded] = useState(searchParams.get("date") ?? "all");
  const [contactSortKey, setContactSortKey] = useState<string>("last_contacted_at");
  const [contactSortDir, setContactSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const confirm = useConfirm();
  const tableScrollRef = useRef<HTMLDivElement>(null);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: "Delete contact?",
      description: `This will remove "${name}" from the CRM. This action cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      const result = await deleteCrmContactAction(id);
      if (result.error) {
        showError("Could not delete contact", result.error);
      } else {
        showSuccess("Contact deleted");
        router.refresh();
      }
    } catch {
      showError("Could not delete contact", "An unexpected error occurred");
    }
  }

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (relFilter !== "all") params.set("rel", relFilter);
    if (stageFilter !== "all") params.set("stage", stageFilter);
    if (dateAdded !== "all") params.set("date", dateAdded);
    const str = params.toString();
    const newUrl = str ? `?${str}` : window.location.pathname;
    window.history.replaceState(null, "", newUrl);
  }, [debouncedSearch, relFilter, stageFilter, dateAdded]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, relFilter, stageFilter, dateAdded]);

  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    if (relFilter !== "all") {
      result = result.filter((c) => c.relationships.includes(relFilter));
    }

    if (stageFilter !== "all") {
      result = result.filter((c) => c.lifecycle_stage === stageFilter);
    }

    if (dateAdded !== "all") {
      result = result.filter((c) => filterByDateAdded(c.created_at, dateAdded));
    }

    result.sort((a, b) => {
      const key = contactSortKey as keyof CrmContactRow;
      let av = a[key];
      let bv = b[key];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "string") av = av.toLowerCase() as never;
      if (typeof bv === "string") bv = bv.toLowerCase() as never;

      if (av < bv) return contactSortDir === "asc" ? -1 : 1;
      if (av > bv) return contactSortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [contacts, debouncedSearch, relFilter, stageFilter, dateAdded, contactSortKey, contactSortDir]);

  const totalFiltered = filteredContacts.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const rangeStart = totalFiltered === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, totalFiltered);
  const paginatedContacts = filteredContacts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const rowVirtualizer = useVirtualizer({
    count: paginatedContacts.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 56,
    overscan: 8,
  });

  useEffect(() => {
    tableScrollRef.current?.scrollTo({ top: 0 });
  }, [safePage]);

  const hasContactFilters = contactSearch.trim() !== "" || relFilter !== "all" || stageFilter !== "all" || dateAdded !== "all";

  function handleContactSort(key: string) {
    if (contactSortKey === key) {
      setContactSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setContactSortKey(key);
      setContactSortDir("asc");
    }
  }

  function clearAllFilters() {
    setContactSearch("");
    setRelFilter("all");
    setStageFilter("all");
    setDateAdded("all");
  }

  function SortHeader({
    label,
    sortKey,
    className,
    style,
  }: {
    label: string;
    sortKey: string;
    className?: string;
    style?: React.CSSProperties;
  }) {
    const isActive = contactSortKey === sortKey;
    return (
      <th
        onClick={() => handleContactSort(sortKey)}
        className={cn(
          "text-xs font-medium text-muted-foreground text-left px-4 py-2.5 cursor-pointer select-none whitespace-nowrap",
          className
        )}
        style={style}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive ? (
            contactSortDir === "asc" ? (
              <ArrowUp className="h-3 w-3" />
            ) : (
              <ArrowDown className="h-3 w-3" />
            )
          ) : (
            <ArrowUpDown className="h-2.5 w-2.5 text-muted-foreground/40" />
          )}
        </span>
      </th>
    );
  }

  return (
    <div className="space-y-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
              placeholder="Search contacts..."
              className="pl-9 h-9"
            />
            {contactSearch && (
              <button
                onClick={() => setContactSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <Select value={relFilter} onValueChange={setRelFilter}>
            <SelectTrigger className="w-[170px] h-9 text-xs">
              <SelectValue placeholder="All Relationships" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Relationships</SelectItem>
              {CRM_RELATIONSHIP_TYPES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={stageFilter} onValueChange={setStageFilter}>
            <SelectTrigger className="w-[150px] h-9 text-xs">
              <SelectValue placeholder="All Stages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {CRM_LIFECYCLE_STAGES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateAddedFilter
            value={dateAdded}
            onChange={setDateAdded}
            className="w-[150px] h-9 text-xs"
          />
          <div className="flex-1" />
          <AddContactDialog teamMembers={teamMembers} currentUserId={currentUserId} />
        </div>

        {hasContactFilters && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted-foreground">Active:</span>
            {contactSearch && (
              <button
                onClick={() => setContactSearch("")}
                className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
              >
                &ldquo;{contactSearch}&rdquo; <X className="h-2.5 w-2.5" />
              </button>
            )}
            {relFilter !== "all" && (
              <button
                onClick={() => setRelFilter("all")}
                className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
              >
                {CRM_RELATIONSHIP_TYPES.find((r) => r.value === relFilter)?.label ?? relFilter}{" "}
                <X className="h-2.5 w-2.5" />
              </button>
            )}
            {stageFilter !== "all" && (
              <button
                onClick={() => setStageFilter("all")}
                className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
              >
                {CRM_LIFECYCLE_STAGES.find((s) => s.value === stageFilter)?.label ?? stageFilter}{" "}
                <X className="h-2.5 w-2.5" />
              </button>
            )}
            {dateAdded !== "all" && (
              <button
                onClick={() => setDateAdded("all")}
                className="inline-flex items-center gap-1 text-xs text-foreground bg-muted rounded-md px-2.5 py-1 hover:bg-muted/80"
              >
                {dateAdded === "today" ? "Today" : dateAdded === "yesterday" ? "Yesterday" : dateAdded === "7d" ? "Last 7 Days" : dateAdded === "30d" ? "Last 30 Days" : dateAdded === "this_month" ? "This Month" : dateAdded}{" "}
                <X className="h-2.5 w-2.5" />
              </button>
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs text-primary hover:underline"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <div ref={tableScrollRef} className="max-h-[min(70vh,560px)] overflow-y-auto">
            <table className="w-full border-collapse block">
              <thead className="sticky top-0 z-10 bg-card border-b">
                <tr className="border-b" style={{ display: "table", width: "100%", tableLayout: "fixed" }}>
                  <SortHeader label="Name" sortKey="first_name" style={{ width: "14%" }} />
                  <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5" style={{ width: "12%" }}>Company</th>
                  <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5" style={{ width: "12%" }}>Relationships</th>
                  <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5" style={{ width: "16%" }}>Email</th>
                  <SortHeader label="Phone" sortKey="phone" style={{ width: "11%" }} />
                  <SortHeader label="Stage" sortKey="lifecycle_stage" style={{ width: "9%" }} />
                  <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5" style={{ width: "10%" }}>Assigned</th>
                  <SortHeader label="Last Contacted" sortKey="last_contacted_at" style={{ width: "12%" }} />
                  <th className="text-xs font-medium text-muted-foreground text-center px-4 py-2.5" style={{ width: "4%" }} />
                </tr>
              </thead>
              <tbody
                style={
                  paginatedContacts.length > 0
                    ? {
                        display: "block",
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        position: "relative",
                      }
                    : undefined
                }
              >
                {paginatedContacts.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      {hasContactFilters ? (
                        <EmptyState
                          icon={Users}
                          title="No contacts match your filters"
                          action={{ label: "Clear Filters", onClick: clearAllFilters }}
                          compact
                        />
                      ) : (
                        <EmptyState
                          icon={Users}
                          title="No contacts yet"
                          description="Add your first contact to start building your CRM"
                          compact
                        />
                      )}
                    </td>
                  </tr>
                ) : (
                  rowVirtualizer.getVirtualItems().map((vi) => {
                    const c = paginatedContacts[vi.index];
                    return (
                    <tr
                      key={c.id}
                      data-index={vi.index}
                      onClick={() => router.push(`/contacts/${c.contact_number}`)}
                      className="cursor-pointer transition-colors hover:bg-muted/50 border-b border-border/50"
                      style={{
                        display: "table",
                        width: "100%",
                        tableLayout: "fixed",
                        position: "absolute",
                        top: 0,
                        left: 0,
                        transform: `translateY(${vi.start}px)`,
                        height: `${vi.size}px`,
                      }}
                    >
                      <td className="px-4 py-2.5" style={{ width: "14%" }}>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 min-w-0">
                                <CrmAvatar
                                  text={getInitials(c.first_name || "", c.last_name || "")}
                                  size="sm"
                                />
                                <span className="text-sm font-medium text-primary truncate">
                                  {[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown"}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{[c.first_name, c.last_name].filter(Boolean).join(" ") || "Unknown"}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="px-4 py-2.5 text-sm truncate" style={{ width: "12%" }}>
                        {c.company_number ? (
                          <Link
                            href={`/companies/${c.company_number}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground hover:underline transition-colors"
                          >
                            {c.company_name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">{c.company_name || "—"}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5" style={{ width: "12%" }}>
                        {c.relationships.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : c.relationships.length <= 2 ? (
                          <div className="flex items-center gap-1 flex-nowrap">
                            {c.relationships.map((r) => <RelPill key={r} type={r} />)}
                          </div>
                        ) : (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-1 flex-nowrap">
                                  {c.relationships.slice(0, 1).map((r) => <RelPill key={r} type={r} />)}
                                  <Badge
                                    variant="outline"
                                    className="rounded-full text-[11px] font-medium bg-muted text-muted-foreground border-border shrink-0"
                                  >
                                    +{c.relationships.length - 1}
                                  </Badge>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <div className="flex flex-col gap-1">
                                  {c.relationships.map((r) => {
                                    const label = CRM_RELATIONSHIP_TYPES.find((rel) => rel.value === r)?.label ?? r;
                                    return (
                                      <span key={r} className="text-xs">
                                        {label}
                                      </span>
                                    );
                                  })}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground truncate" style={{ width: "16%" }}>
                        {c.email || "—"}
                      </td>
                      <td className="px-4 py-2.5 text-sm text-muted-foreground whitespace-nowrap" style={{ width: "11%" }}>
                        <ClickToCallNumber number={c.phone} />
                      </td>
                      <td className="px-4 py-2.5" style={{ width: "9%" }}>
                        <StageDot stage={c.lifecycle_stage} />
                      </td>
                      <td className="px-4 py-2.5" style={{ width: "10%" }}>
                        {c.assigned_to_name ? (
                          <div className="flex items-center gap-1.5">
                            <CrmAvatar text={c.assigned_to_initials ?? c.assigned_to_name.split(" ").map((p: string) => p[0]).join("").toUpperCase()} size="sm" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap truncate max-w-[100px]">
                              {c.assigned_to_name.split(" ")[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">—</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 num text-xs text-muted-foreground whitespace-nowrap" style={{ width: "12%" }}>
                        {(() => {
                          const sd = smartDate(c.last_contacted_at);
                          return <span title={sd.title}>{sd.text}</span>;
                        })()}
                      </td>
                      <td className="px-4 py-2.5 text-center" style={{ width: "4%" }} onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem
                              onClick={() => router.push(`/contacts/${c.contact_number}`)}
                              className="gap-2 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View / Edit
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(c.id, `${c.first_name} ${c.last_name}`)}
                                  className="gap-2 text-xs text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  Delete
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                  })
                )}
              </tbody>
            </table>
            </div>
          </div>
          <div className="px-5 py-3 border-t flex flex-col sm:flex-row flex-wrap items-start sm:items-center justify-between gap-3">
            <span className="text-xs text-muted-foreground">
              {totalFiltered === 0
                ? `0 of ${contacts.length} contacts`
                : `Showing ${rangeStart}-${rangeEnd} of ${totalFiltered} contact${totalFiltered !== 1 ? "s" : ""} (${contacts.length} total in CRM)`}
            </span>
            {totalFiltered > PAGE_SIZE && (
              <Pagination>
                <PaginationContent className="gap-1">
                  <PaginationItem>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      disabled={safePage <= 1}
                      onClick={() => {
                        setPage((p) => Math.max(1, p - 1));
                        tableScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      Previous
                    </Button>
                  </PaginationItem>
                  <PaginationItem>
                    <span className="text-xs text-muted-foreground px-2 tabular-nums">
                      Page {safePage} of {totalPages}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 gap-1"
                      disabled={safePage >= totalPages}
                      onClick={() => {
                        setPage((p) => Math.min(totalPages, p + 1));
                        tableScrollRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                    >
                      Next
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        </div>

    </div>
  );
}
