"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DataTable, type Column } from "@/components/shared/data-table";
import { formatDate } from "@/lib/format";
import { Search } from "lucide-react";

interface EntityRow {
  id: string;
  entity_name: string;
  entity_type: string;
  state_of_formation: string | null;
  borrower_id: string;
  borrower_name: string;
  created_at: string;
}

interface AllEntitiesTableProps {
  entities: EntityRow[];
}

const columns: Column<EntityRow>[] = [
  {
    key: "entity_name",
    header: "Entity Name",
    cell: (row) => <span className="font-medium">{row.entity_name}</span>,
  },
  {
    key: "entity_type",
    header: "Type",
    cell: (row) => (
      <Badge variant="outline" className="capitalize">
        {row.entity_type.replace(/_/g, " ")}
      </Badge>
    ),
  },
  {
    key: "borrower_name",
    header: "Borrower",
    cell: (row) => (
      <Link
        href={`/borrowers/${row.borrower_id}`}
        className="text-sm text-primary hover:underline underline-offset-4"
        onClick={(e) => e.stopPropagation()}
      >
        {row.borrower_name}
      </Link>
    ),
  },
  {
    key: "state_of_formation",
    header: "State",
    cell: (row) => (
      <span className="text-muted-foreground">
        {row.state_of_formation || "\u2014"}
      </span>
    ),
  },
  {
    key: "created_at",
    header: "Created",
    cell: (row) => (
      <span className="text-muted-foreground">{formatDate(row.created_at)}</span>
    ),
  },
];

export function AllEntitiesTable({ entities }: AllEntitiesTableProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return entities;
    const q = search.toLowerCase();
    return entities.filter(
      (e) =>
        e.entity_name.toLowerCase().includes(q) ||
        e.borrower_name.toLowerCase().includes(q) ||
        e.entity_type.toLowerCase().includes(q)
    );
  }, [entities, search]);

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search entities or borrowers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        emptyMessage={
          search ? "No entities match your search." : "No borrower entities found."
        }
      />
    </div>
  );
}
