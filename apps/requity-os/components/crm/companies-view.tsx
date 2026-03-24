"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useDebounce } from "@/hooks/useDebounce";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AddCompanyDialog } from "@/components/crm/add-company-dialog";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCrmCompanyAction } from "@/app/(authenticated)/(admin)/contacts/actions";
import { showSuccess, showError } from "@/lib/toast";
import {
  CRM_COMPANY_TYPES,
} from "@/lib/constants";
import { cn } from "@/lib/utils";
import { DateAddedFilter, filterByDateAdded } from "@/components/ui/date-added-filter";
import {
  Building2,
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
import { CompanyStatusDot } from "./crm-primitives";
import type { CompanyRowV2 } from "./crm-v2-page";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination";

const PAGE_SIZE = 50;

interface CompaniesViewProps {
  companies: CompanyRowV2[];
  isSuperAdmin?: boolean;
}

export function CompaniesView({ companies, isSuperAdmin = false }: CompaniesViewProps) {
  const router = useRouter();

  const [companySearch, setCompanySearch] = useState("");
  const debouncedSearch = useDebounce(companySearch, 300);
  const [dateAdded, setDateAdded] = useState("all");
  const [companySortKey, setCompanySortKey] = useState<string>("name");
  const [companySortDir, setCompanySortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const confirm = useConfirm();
  const tableScrollRef = useRef<HTMLDivElement>(null);

  async function handleDelete(id: string, name: string) {
    const ok = await confirm({
      title: "Delete company?",
      description: `This will remove "${name}" from the CRM. This action cannot be undone.`,
      confirmLabel: "Delete",
      destructive: true,
    });
    if (!ok) return;
    try {
      const result = await deleteCrmCompanyAction(id);
      if (result.error) {
        showError("Could not delete company", result.error);
      } else {
        showSuccess("Company deleted");
        router.refresh();
      }
    } catch {
      showError("Could not delete company", "An unexpected error occurred");
    }
  }

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, dateAdded]);

  const filteredCompanies = useMemo(() => {
    let result = [...companies];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_type.toLowerCase().includes(q) ||
          c.company_types?.some((ct) => ct.toLowerCase().includes(q))
      );
    }

    if (dateAdded !== "all") {
      result = result.filter((c) => filterByDateAdded(c.created_at, dateAdded));
    }

    result.sort((a, b) => {
      const key = companySortKey as keyof CompanyRowV2;
      let av = a[key];
      let bv = b[key];

      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;

      if (typeof av === "string") av = av.toLowerCase() as never;
      if (typeof bv === "string") bv = bv.toLowerCase() as never;

      if (av < bv) return companySortDir === "asc" ? -1 : 1;
      if (av > bv) return companySortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, debouncedSearch, dateAdded, companySortKey, companySortDir]);

  const totalFiltered = filteredCompanies.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const safePage = Math.min(page, totalPages);
  const rangeStart = totalFiltered === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(safePage * PAGE_SIZE, totalFiltered);
  const paginatedCompanies = filteredCompanies.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const rowVirtualizer = useVirtualizer({
    count: paginatedCompanies.length,
    getScrollElement: () => tableScrollRef.current,
    estimateSize: () => 64,
    overscan: 8,
  });

  useEffect(() => {
    tableScrollRef.current?.scrollTo({ top: 0 });
  }, [safePage]);

  function handleCompanySort(key: string) {
    if (companySortKey === key) {
      setCompanySortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setCompanySortKey(key);
      setCompanySortDir("asc");
    }
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
    const isActive = companySortKey === sortKey;
    return (
      <th
        onClick={() => handleCompanySort(sortKey)}
        className={cn(
          "text-xs font-medium text-muted-foreground text-left px-4 py-2.5 cursor-pointer select-none whitespace-nowrap",
          className
        )}
        style={style}
      >
        <span className="inline-flex items-center gap-1">
          {label}
          {isActive ? (
            companySortDir === "asc" ? (
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
              value={companySearch}
              onChange={(e) => setCompanySearch(e.target.value)}
              placeholder="Search companies..."
              className="pl-9 h-9"
            />
            {companySearch && (
              <button
                onClick={() => setCompanySearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
          <DateAddedFilter
            value={dateAdded}
            onChange={setDateAdded}
            className="w-[150px] h-9 text-xs"
          />
          <div className="flex-1" />
          <AddCompanyDialog />
        </div>

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <div ref={tableScrollRef} className="max-h-[min(70vh,560px)] overflow-y-auto">
            <table className="w-full border-collapse block">
              <thead className="sticky top-0 z-10 bg-card border-b">
                <tr className="border-b" style={{ display: "table", width: "100%", tableLayout: "fixed" }}>
                  <SortHeader label="Company" sortKey="name" style={{ width: "24%" }} />
                  <SortHeader label="Type" sortKey="company_type" style={{ width: "18%" }} />
                  <SortHeader label="Contacts" sortKey="contact_count" className="text-right" style={{ width: "10%" }} />
                  <SortHeader label="Files" sortKey="file_count" className="text-right" style={{ width: "8%" }} />
                  <th className="text-xs font-medium text-muted-foreground text-left px-4 py-2.5" style={{ width: "16%" }}>Location</th>
                  <SortHeader label="Status" sortKey="is_active" style={{ width: "12%" }} />
                  <th className="text-xs font-medium text-muted-foreground text-center px-4 py-2.5" style={{ width: "5%" }} />
                </tr>
              </thead>
              <tbody
                style={
                  paginatedCompanies.length > 0
                    ? {
                        display: "block",
                        height: `${rowVirtualizer.getTotalSize()}px`,
                        position: "relative",
                      }
                    : undefined
                }
              >
                {paginatedCompanies.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState
                        icon={Building2}
                        title="No companies found"
                        compact
                      />
                    </td>
                  </tr>
                ) : (
                  rowVirtualizer.getVirtualItems().map((vi) => {
                    const c = paginatedCompanies[vi.index];
                    return (
                    <tr
                      key={c.id}
                      data-index={vi.index}
                      onClick={() => router.push(`/companies/${c.company_number}`)}
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
                      <td className="px-4 py-3" style={{ width: "24%" }}>
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium text-primary truncate">
                            {c.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3" style={{ width: "18%" }}>
                        <div className="flex flex-wrap gap-1">
                          {(c.company_types?.length ? c.company_types : [c.company_type]).map((ct) => (
                            <span key={ct} className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {CRM_COMPANY_TYPES.find((t) => t.value === ct)?.label ?? ct}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 num text-sm text-foreground text-right" style={{ width: "10%" }}>
                        {c.contact_count}
                      </td>
                      <td className="px-4 py-3 num text-sm text-foreground text-right" style={{ width: "8%" }}>
                        {c.file_count}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap" style={{ width: "16%" }}>
                        {c.city && c.state ? `${c.city}, ${c.state}` : c.city || c.state || "—"}
                      </td>
                      <td className="px-4 py-3" style={{ width: "12%" }}>
                        <CompanyStatusDot isActive={c.is_active} />
                      </td>
                      <td className="px-4 py-3 text-center" style={{ width: "5%" }} onClick={(e) => e.stopPropagation()}>
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
                              onClick={() => router.push(`/companies/${c.company_number}`)}
                              className="gap-2 text-xs"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              View / Edit
                            </DropdownMenuItem>
                            {isSuperAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDelete(c.id, c.name)}
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
                ? `0 of ${companies.length} companies`
                : `Showing ${rangeStart}-${rangeEnd} of ${totalFiltered} compan${totalFiltered !== 1 ? "ies" : "y"} (${companies.length} total in CRM)`}
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
