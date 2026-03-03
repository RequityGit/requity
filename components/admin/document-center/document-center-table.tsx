"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DataTable, Column } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDate } from "@/lib/format";
import {
  PORTAL_DOCUMENT_TYPES,
  PORTAL_DOCUMENT_CATEGORIES,
} from "@/lib/constants";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import {
  deletePortalDocumentAction,
  updateDocumentVisibilityAction,
} from "@/app/(authenticated)/admin/document-center/actions";
import {
  Search,
  FileText,
  Download,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";

export interface PortalDocumentRow {
  id: string;
  file_name: string;
  display_name: string | null;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  document_type: string;
  category: string;
  visibility: string;
  notes: string | null;
  uploaded_by_name: string | null;
  loan_label: string | null;
  fund_label: string | null;
  borrower_label: string | null;
  investor_label: string | null;
  company_label: string | null;
  contact_label: string | null;
  created_at: string;
}

function getDocTypeLabel(value: string): string {
  return (
    PORTAL_DOCUMENT_TYPES.find((dt) => dt.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

function getCategoryLabel(value: string): string {
  return (
    PORTAL_DOCUMENT_CATEGORIES.find((c) => c.value === value)?.label ??
    value.replace(/_/g, " ")
  );
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getLinkedEntity(row: PortalDocumentRow): string {
  const parts: string[] = [];
  if (row.loan_label) parts.push(row.loan_label);
  if (row.fund_label) parts.push(row.fund_label);
  if (row.borrower_label) parts.push(row.borrower_label);
  if (row.investor_label) parts.push(row.investor_label);
  if (row.company_label) parts.push(row.company_label);
  if (row.contact_label) parts.push(row.contact_label);
  return parts.length > 0 ? parts.join(", ") : "—";
}

function getFileIcon(mimeType: string | null) {
  return <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" strokeWidth={1.5} />;
}

interface DocumentCenterTableProps {
  data: PortalDocumentRow[];
}

export function DocumentCenterTable({ data }: DocumentCenterTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState("all");

  const router = useRouter();
  const { toast } = useToast();

  const filtered = useMemo(() => {
    let result = data;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.file_name.toLowerCase().includes(q) ||
          (d.display_name?.toLowerCase().includes(q) ?? false) ||
          (d.notes?.toLowerCase().includes(q) ?? false) ||
          (d.uploaded_by_name?.toLowerCase().includes(q) ?? false) ||
          (d.loan_label?.toLowerCase().includes(q) ?? false) ||
          (d.fund_label?.toLowerCase().includes(q) ?? false) ||
          (d.borrower_label?.toLowerCase().includes(q) ?? false) ||
          (d.investor_label?.toLowerCase().includes(q) ?? false) ||
          (d.company_label?.toLowerCase().includes(q) ?? false) ||
          (d.contact_label?.toLowerCase().includes(q) ?? false)
      );
    }
    if (typeFilter !== "all") {
      result = result.filter((d) => d.document_type === typeFilter);
    }
    if (categoryFilter !== "all") {
      result = result.filter((d) => d.category === categoryFilter);
    }
    if (visibilityFilter !== "all") {
      result = result.filter((d) => d.visibility === visibilityFilter);
    }
    return result;
  }, [data, search, typeFilter, categoryFilter, visibilityFilter]);

  const handleDownload = useCallback(
    async (row: PortalDocumentRow) => {
      try {
        const supabase = createClient();
        const { data: signedUrlData, error } = await supabase.storage
          .from("portal-documents")
          .createSignedUrl(row.file_path, 60);

        if (error) throw error;

        const link = document.createElement("a");
        link.href = signedUrlData.signedUrl;
        link.download = row.file_name;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Download failed";
        toast({
          title: "Download failed",
          description: message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const handleDelete = useCallback(
    async (row: PortalDocumentRow) => {
      const confirmed = window.confirm(
        `Are you sure you want to delete "${row.display_name || row.file_name}"?`
      );
      if (!confirmed) return;

      const result = await deletePortalDocumentAction(row.id);
      if ("error" in result && result.error) {
        toast({
          title: "Delete failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "Document deleted" });
        router.refresh();
      }
    },
    [toast, router]
  );

  const handleToggleVisibility = useCallback(
    async (row: PortalDocumentRow) => {
      const newVisibility =
        row.visibility === "admin_only" ? "portal_visible" : "admin_only";
      const result = await updateDocumentVisibilityAction(
        row.id,
        newVisibility
      );
      if ("error" in result && result.error) {
        toast({
          title: "Update failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({
          title: `Visibility updated to ${newVisibility === "portal_visible" ? "Portal Visible" : "Admin Only"}`,
        });
        router.refresh();
      }
    },
    [toast, router]
  );

  const handlePreview = useCallback(
    async (row: PortalDocumentRow) => {
      try {
        const supabase = createClient();
        const { data: signedUrlData, error } = await supabase.storage
          .from("portal-documents")
          .createSignedUrl(row.file_path, 300);

        if (error) throw error;
        window.open(signedUrlData.signedUrl, "_blank");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Preview failed";
        toast({
          title: "Preview failed",
          description: message,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  const columns: Column<PortalDocumentRow>[] = [
    {
      key: "file_name",
      header: "Name",
      cell: (row) => (
        <div className="flex items-center gap-2 min-w-[180px]">
          {getFileIcon(row.mime_type)}
          <div className="min-w-0">
            <p className="font-medium text-sm truncate max-w-[240px]">
              {row.display_name || row.file_name}
            </p>
            {row.display_name && (
              <p className="text-xs text-muted-foreground truncate max-w-[240px]">
                {row.file_name}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: "document_type",
      header: "Type",
      cell: (row) => (
        <span className="text-sm whitespace-nowrap">
          {getDocTypeLabel(row.document_type)}
        </span>
      ),
    },
    {
      key: "category",
      header: "Category",
      cell: (row) => (
        <StatusBadge status={row.category} />
      ),
    },
    {
      key: "linked_entity",
      header: "Linked To",
      cell: (row) => (
        <span className="text-sm text-muted-foreground truncate max-w-[180px] block">
          {getLinkedEntity(row)}
        </span>
      ),
    },
    {
      key: "file_size",
      header: "Size",
      cell: (row) => (
        <span className="text-sm font-mono text-muted-foreground whitespace-nowrap">
          {formatFileSize(row.file_size)}
        </span>
      ),
    },
    {
      key: "visibility",
      header: "Visibility",
      cell: (row) => (
        <StatusBadge
          status={row.visibility}
          className={
            row.visibility === "portal_visible"
              ? "bg-blue-100 text-blue-800 border-blue-200"
              : row.visibility === "public"
                ? "bg-green-100 text-green-800 border-green-200"
                : ""
          }
        />
      ),
    },
    {
      key: "uploaded_by",
      header: "Uploaded By",
      cell: (row) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {row.uploaded_by_name || "—"}
        </span>
      ),
    },
    {
      key: "created_at",
      header: "Uploaded",
      cell: (row) => (
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {formatDate(row.created_at)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-[48px]",
      cell: (row) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handlePreview(row)}>
              <ExternalLink className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Preview
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload(row)}>
              <Download className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Download
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleToggleVisibility(row)}>
              {row.visibility === "admin_only" ? (
                <>
                  <Eye className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Make Portal Visible
                </>
              ) : (
                <>
                  <EyeOff className="h-4 w-4 mr-2" strokeWidth={1.5} />
                  Make Admin Only
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleDelete(row)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {PORTAL_DOCUMENT_TYPES.map((dt) => (
              <SelectItem key={dt.value} value={dt.value}>
                {dt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {PORTAL_DOCUMENT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={setVisibilityFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Visibility" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Visibility</SelectItem>
            <SelectItem value="admin_only">Admin Only</SelectItem>
            <SelectItem value="portal_visible">Portal Visible</SelectItem>
            <SelectItem value="public">Public</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        {filtered.length} document{filtered.length !== 1 ? "s" : ""}
        {filtered.length !== data.length && ` of ${data.length} total`}
      </div>

      {/* Table */}
      <DataTable<PortalDocumentRow>
        columns={columns}
        data={filtered}
        emptyMessage="No documents found. Upload your first document to get started."
      />
    </div>
  );
}
