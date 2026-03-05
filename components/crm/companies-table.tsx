"use client";

import { useState, useMemo } from "react";
import { DataTable, Column } from "@/components/shared/data-table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CRM_COMPANY_TYPES, COMPANY_TYPE_COLORS } from "@/lib/constants";
import {
  Search,
  X,
  Building2,
  Paperclip,
  Shield,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

// ── Types ────────────────────────────────────────────────────────────────

export interface CompanyRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  company_type: string;
  company_subtype: string | null;
  city: string | null;
  state: string | null;
  contact_count: number;
  file_count: number;
  active_deals: number;
  nda_created_date: string | null;
  nda_expiration_date: string | null;
  fee_agreement_on_file: boolean | null;
  is_active: boolean | null;
}

interface CompaniesTableProps {
  companies: CompanyRow[];
}

// ── Helpers ──────────────────────────────────────────────────────────────

function CompanyTypeBadge({ type }: { type: string }) {
  const label =
    CRM_COMPANY_TYPES.find((t) => t.value === type)?.label ?? type;
  const colors =
    COMPANY_TYPE_COLORS[type] ?? "bg-gray-100 text-gray-700 border-gray-200";
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", colors)}>
      {label}
    </Badge>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <div className="flex justify-center">
      <div
        className={cn(
          "h-2.5 w-2.5 rounded-full",
          active ? "bg-green-500" : "bg-red-400"
        )}
      />
    </div>
  );
}

function hasValidNda(
  ndaCreatedDate: string | null,
  ndaExpirationDate: string | null
): boolean {
  if (!ndaCreatedDate) return false;
  if (!ndaExpirationDate) return true;
  return new Date(ndaExpirationDate) > new Date();
}

// ── Component ────────────────────────────────────────────────────────────

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = [...companies];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.website?.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((c) => c.company_type === typeFilter);
    }

    return result;
  }, [companies, search, typeFilter]);

  const hasFilters = search.trim() !== "" || typeFilter !== "all";

  const columns: Column<CompanyRow>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Company",
        cell: (row) => (
          <Link
            href={`/admin/crm/companies/${row.id}`}
            className="flex items-center gap-3"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground hover:underline">
                {row.name}
              </p>
              {row.email && (
                <p className="text-xs text-muted-foreground">{row.email}</p>
              )}
            </div>
          </Link>
        ),
      },
      {
        key: "company_type",
        header: "Type",
        cell: (row) => <CompanyTypeBadge type={row.company_type} />,
      },
      {
        key: "location",
        header: "Location",
        cell: (row) => (
          <span className="text-sm text-muted-foreground">
            {row.city && row.state
              ? `${row.city}, ${row.state}`
              : row.city || row.state || "—"}
          </span>
        ),
      },
      {
        key: "contact_count",
        header: "Contacts",
        cell: (row) => (
          <span className="text-sm num text-center block">
            {row.contact_count}
          </span>
        ),
        className: "text-center w-[80px]",
      },
      {
        key: "active_deals",
        header: "Active Deals",
        cell: (row) => (
          <span
            className={cn(
              "text-sm num text-center block",
              row.active_deals > 0 ? "text-primary font-medium" : ""
            )}
          >
            {row.active_deals}
          </span>
        ),
        className: "text-center w-[100px]",
      },
      {
        key: "file_count",
        header: "Files",
        cell: (row) => (
          <div className="flex items-center justify-center gap-1 text-sm num">
            <Paperclip className="h-3 w-3 text-muted-foreground" />
            {row.file_count}
          </div>
        ),
        className: "text-center w-[70px]",
      },
      {
        key: "nda",
        header: "NDA",
        cell: (row) => (
          <div className="flex justify-center">
            {hasValidNda(row.nda_created_date, row.nda_expiration_date) ? (
              <Shield className="h-4 w-4 text-green-500" />
            ) : (
              <Shield className="h-4 w-4 text-red-400" />
            )}
          </div>
        ),
        className: "text-center w-[60px]",
      },
      {
        key: "fee_agreement",
        header: "Fee Agmt",
        cell: (row) => (
          <div className="flex justify-center">
            {row.fee_agreement_on_file ? (
              <FileText className="h-4 w-4 text-green-500" />
            ) : (
              <FileText className="h-4 w-4 text-red-400" />
            )}
          </div>
        ),
        className: "text-center w-[80px]",
      },
    ],
    []
  );

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies..."
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CRM_COMPANY_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setTypeFilter("all");
            }}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage="No companies found."
      />
    </div>
  );
}
