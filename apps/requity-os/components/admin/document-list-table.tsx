"use client";

import { useState, useMemo } from "react";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import { DOCUMENT_TYPES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Download,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { getDocumentPreviewUrl } from "@/app/(authenticated)/(admin)/documents/actions";
import { DocumentRenameDialog } from "@/components/admin/document-rename-dialog";
import { DocumentDeleteDialog } from "@/components/admin/document-delete-dialog";
import { DocumentPreviewDialog } from "@/components/admin/document-preview-dialog";

export interface DocumentRow {
  id: string;
  file_name: string;
  description: string | null;
  document_type: string | null;
  owner_name: string;
  entity_name: string | null;
  source: "loan" | "contact" | "company" | "deal";
  status: string;
  created_at: string;
  storage_path: string | null;
  storage_bucket: string | null;
  file_url: string | null;
  mime_type: string | null;
}

interface DocumentListTableProps {
  data: DocumentRow[];
  action?: React.ReactNode;
  isSuperAdmin: boolean;
}

function getDocTypeLabel(value: string): string {
  return (
    DOCUMENT_TYPES.find((dt) => dt.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

const SOURCE_LABELS: Record<DocumentRow["source"], string> = {
  loan: "Loan / Fund",
  contact: "Contact",
  company: "Company",
  deal: "Deal",
};

export function DocumentListTable({ data, action, isSuperAdmin }: DocumentListTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");

  // Dialog state
  const [previewDoc, setPreviewDoc] = useState<DocumentRow | null>(null);
  const [renameDoc, setRenameDoc] = useState<DocumentRow | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<DocumentRow | null>(null);

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.file_name.toLowerCase().includes(q) ||
          (d.description?.toLowerCase().includes(q) ?? false) ||
          d.owner_name.toLowerCase().includes(q) ||
          (d.entity_name?.toLowerCase().includes(q) ?? false)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((d) => d.document_type === typeFilter);
    }
    if (sourceFilter !== "all") {
      result = result.filter((d) => d.source === sourceFilter);
    }
    return result;
  }, [data, search, typeFilter, sourceFilter]);

  async function handleDownload(row: DocumentRow) {
    const result = await getDocumentPreviewUrl(row.id, row.source);
    if ("error" in result) {
      toast.error(result.error);
      return;
    }
    const a = window.document.createElement("a");
    a.href = result.url;
    a.download = row.file_name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  const columns: Column<DocumentRow>[] = [
    {
      key: "file_name",
      header: "Name",
      cell: (row) => (
        <button
          type="button"
          className="font-medium text-left hover:underline cursor-pointer"
          onClick={() => setPreviewDoc(row)}
        >
          {row.description || row.file_name}
        </button>
      ),
    },
    {
      key: "document_type",
      header: "Type",
      cell: (row) => (
        <span className="text-sm">{row.document_type ? getDocTypeLabel(row.document_type) : "—"}</span>
      ),
    },
    {
      key: "owner_name",
      header: "Owner",
      cell: (row) => row.owner_name,
    },
    {
      key: "source",
      header: "Source",
      cell: (row) => (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {SOURCE_LABELS[row.source]}
        </span>
      ),
    },
    {
      key: "entity_name",
      header: "Entity",
      cell: (row) => row.entity_name || "—",
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (row) => formatDate(row.created_at),
    },
    {
      key: "status",
      header: "Status",
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-10",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setPreviewDoc(row)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setRenameDoc(row)}>
              <Pencil className="h-4 w-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(row)}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </DropdownMenuItem>
            {isSuperAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setDeleteDoc(row)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Sources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            {(Object.entries(SOURCE_LABELS) as [DocumentRow["source"], string][]).map(
              ([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {DOCUMENT_TYPES.map((dt) => (
              <SelectItem key={dt.value} value={dt.value}>
                {dt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {action && <><div className="flex-1" />{action}</>}
      </div>

      <DataTable<DocumentRow>
        columns={columns}
        data={filtered}
        emptyMessage="No documents found."
      />

      {/* Dialogs */}
      <DocumentPreviewDialog
        open={!!previewDoc}
        onOpenChange={(open) => { if (!open) setPreviewDoc(null); }}
        document={previewDoc}
      />
      <DocumentRenameDialog
        open={!!renameDoc}
        onOpenChange={(open) => { if (!open) setRenameDoc(null); }}
        document={renameDoc}
      />
      <DocumentDeleteDialog
        open={!!deleteDoc}
        onOpenChange={(open) => { if (!open) setDeleteDoc(null); }}
        document={deleteDoc}
      />
    </div>
  );
}
