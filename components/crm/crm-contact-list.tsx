"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import { CRM_CONTACT_TYPES, CRM_CONTACT_STATUSES } from "@/lib/constants";
import { Search, X } from "lucide-react";
import { ClickToCallNumber } from "@/components/ui/ClickToCallNumber";

export interface CrmContactRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company_name: string | null;
  contact_type: string;
  source: string | null;
  status: string;
  assigned_to_name: string | null;
  next_follow_up_date: string | null;
  last_contacted_at: string | null;
  created_at: string;
  activity_count: number;
}

interface CrmContactListProps {
  contacts: CrmContactRow[];
}

export function CrmContactList({ contacts }: CrmContactListProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = [...contacts];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.company_name?.toLowerCase().includes(q) ||
          c.phone?.includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((c) => c.contact_type === typeFilter);
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    return result;
  }, [contacts, search, typeFilter, statusFilter]);

  const hasFilters =
    search.trim() !== "" || typeFilter !== "all" || statusFilter !== "all";

  const columns: Column<CrmContactRow>[] = [
    {
      key: "name",
      header: "Name",
      cell: (row) => (
        <Link
          href={`/admin/crm/${row.id}`}
          className="font-medium text-blue-600 hover:underline"
        >
          {row.first_name} {row.last_name}
        </Link>
      ),
    },
    {
      key: "company_name",
      header: "Company",
      cell: (row) => row.company_name || "—",
    },
    {
      key: "contact_type",
      header: "Type",
      cell: (row) => <StatusBadge status={row.contact_type} />,
    },
    {
      key: "email",
      header: "Email",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.email || "—"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      cell: (row) => <ClickToCallNumber number={row.phone} />,
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "assigned_to_name",
      header: "Assigned To",
      cell: (row) => row.assigned_to_name || "—",
    },
    {
      key: "next_follow_up_date",
      header: "Next Follow-Up",
      cell: (row) => {
        if (!row.next_follow_up_date) return "—";
        const isOverdue = new Date(row.next_follow_up_date) < new Date();
        return (
          <span className={isOverdue ? "text-red-600 font-medium" : ""}>
            {formatDate(row.next_follow_up_date)}
          </span>
        );
      },
    },
    {
      key: "activity_count",
      header: "Activities",
      cell: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.activity_count}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Added",
      cell: (row) => formatDate(row.created_at),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search contacts..."
            className="pl-9"
          />
        </div>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CRM_CONTACT_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {CRM_CONTACT_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
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
              setStatusFilter("all");
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
        emptyMessage="No contacts found."
      />
    </div>
  );
}
