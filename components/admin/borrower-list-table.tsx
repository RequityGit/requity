"use client";

import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";

export interface BorrowerRow {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  state: string;
  credit_score: number | null;
  experience_count: number;
  entity_count: number;
  loan_count: number;
  created_at: string;
}

interface BorrowerListTableProps {
  data: BorrowerRow[];
}

type SortKey =
  | "name"
  | "email"
  | "phone"
  | "state"
  | "credit_score"
  | "experience_count"
  | "entity_count"
  | "loan_count"
  | "created_at";

type SortDir = "asc" | "desc";

const PAGE_SIZE = 25;

export function BorrowerListTable({ data }: BorrowerListTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(0);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (b) =>
        `${b.first_name} ${b.last_name}`.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.state.toLowerCase().includes(q)
    );
  }, [data, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name":
          cmp = `${a.first_name} ${a.last_name}`.localeCompare(
            `${b.first_name} ${b.last_name}`
          );
          break;
        case "email":
          cmp = a.email.localeCompare(b.email);
          break;
        case "phone":
          cmp = a.phone.localeCompare(b.phone);
          break;
        case "state":
          cmp = a.state.localeCompare(b.state);
          break;
        case "credit_score":
          cmp = (a.credit_score ?? 0) - (b.credit_score ?? 0);
          break;
        case "experience_count":
          cmp = a.experience_count - b.experience_count;
          break;
        case "entity_count":
          cmp = a.entity_count - b.entity_count;
          break;
        case "loan_count":
          cmp = a.loan_count - b.loan_count;
          break;
        case "created_at":
          cmp = a.created_at.localeCompare(b.created_at);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col)
      return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-md border bg-white p-12 text-center">
        <div className="mx-auto max-w-sm space-y-4">
          <UserPlus className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-[#1a2b4a]">
            No borrowers yet
          </h3>
          <p className="text-sm text-muted-foreground">
            Get started by adding your first borrower to the system.
          </p>
          <Link href="/admin/borrowers/new">
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Borrower
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or state..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          className="pl-9"
        />
      </div>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <button
                  onClick={() => toggleSort("name")}
                  className="flex items-center font-medium hover:text-[#1a2b4a]"
                >
                  Full Name
                  <SortIcon col="name" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("email")}
                  className="flex items-center font-medium hover:text-[#1a2b4a]"
                >
                  Email
                  <SortIcon col="email" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("phone")}
                  className="flex items-center font-medium hover:text-[#1a2b4a]"
                >
                  Phone
                  <SortIcon col="phone" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("credit_score")}
                  className="flex items-center font-medium hover:text-[#1a2b4a]"
                >
                  Credit Score
                  <SortIcon col="credit_score" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("experience_count")}
                  className="flex items-center font-medium hover:text-[#1a2b4a]"
                >
                  Experience
                  <SortIcon col="experience_count" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("entity_count")}
                  className="flex items-center font-medium hover:text-[#1a2b4a]"
                >
                  Entities
                  <SortIcon col="entity_count" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("loan_count")}
                  className="flex items-center font-medium hover:text-[#1a2b4a]"
                >
                  Loans
                  <SortIcon col="loan_count" />
                </button>
              </TableHead>
              <TableHead>
                <button
                  onClick={() => toggleSort("created_at")}
                  className="flex items-center font-medium hover:text-[#1a2b4a]"
                >
                  Created
                  <SortIcon col="created_at" />
                </button>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="h-24 text-center text-muted-foreground"
                >
                  No borrowers match your search.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/admin/borrowers/${row.id}`)}
                >
                  <TableCell>
                    <span className="font-medium text-[#1a2b4a]">
                      {row.first_name} {row.last_name}
                    </span>
                  </TableCell>
                  <TableCell>{row.email}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>
                    {row.credit_score ? (
                      <span
                        className={`font-medium ${
                          row.credit_score >= 740
                            ? "text-green-600"
                            : row.credit_score >= 680
                            ? "text-amber-600"
                            : "text-red-600"
                        }`}
                      >
                        {row.credit_score}
                      </span>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell>{row.experience_count}</TableCell>
                  <TableCell>{row.entity_count}</TableCell>
                  <TableCell>{row.loan_count}</TableCell>
                  <TableCell>{formatDate(row.created_at)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * PAGE_SIZE + 1}–
            {Math.min((page + 1) * PAGE_SIZE, sorted.length)} of{" "}
            {sorted.length} borrowers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
