"use client";

import { useState, useMemo } from "react";
import { DataTable, type Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { DocumentDownload } from "@/components/borrower/document-download";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { formatDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { FileText } from "lucide-react";

interface DocumentWithLoan {
  id: string;
  owner_id: string;
  loan_id: string | null;
  fund_id: string | null;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  loans: {
    property_address: string | null;
    loan_number: string | null;
  } | null;
}

interface LoanOption {
  id: string;
  property_address: string | null;
}

interface DocumentsTableProps {
  documents: DocumentWithLoan[];
  loans: LoanOption[];
}

export function DocumentsTable({ documents, loans }: DocumentsTableProps) {
  const [loanFilter, setLoanFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const filteredDocuments = useMemo(() => {
    let result = documents;

    if (loanFilter !== "all") {
      result = result.filter((d) => d.loan_id === loanFilter);
    }

    if (typeFilter !== "all") {
      result = result.filter((d) => d.document_type === typeFilter);
    }

    return result;
  }, [documents, loanFilter, typeFilter]);

  const columns: Column<DocumentWithLoan>[] = [
    {
      key: "file_name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <p className="font-medium text-sm truncate max-w-[250px]">
              {row.file_name}
            </p>
            {row.description && (
              <p className="text-xs text-muted-foreground truncate max-w-[250px]">
                {row.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "document_type",
      header: "Type",
      cell: (row) => {
        const label =
          DOCUMENT_TYPES.find((t) => t.value === row.document_type)?.label ??
          row.document_type.replace(/_/g, " ");
        return <span className="capitalize text-sm">{label}</span>;
      },
    },
    {
      key: "loan",
      header: "Loan",
      cell: (row) =>
        row.loans ? (
          <span className="text-sm">{row.loans.property_address}</span>
        ) : (
          <span className="text-sm text-muted-foreground">{"\u2014"}</span>
        ),
    },
    {
      key: "created_at",
      header: "Date",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "download",
      header: "",
      cell: (row) => (
        <DocumentDownload filePath={row.file_path} fileName={row.file_name} />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-end">
        <div className="space-y-1.5 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">Filter by Loan</Label>
          <Select value={loanFilter} onValueChange={setLoanFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All loans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Loans</SelectItem>
              {loans.map((loan) => (
                <SelectItem key={loan.id} value={loan.id}>
                  {loan.property_address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5 min-w-[200px]">
          <Label className="text-xs text-muted-foreground">
            Filter by Type
          </Label>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredDocuments}
        emptyMessage="No documents found matching your filters."
      />
    </div>
  );
}
