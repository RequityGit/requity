"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { deleteCompanyFileAction } from "@/app/(authenticated)/admin/crm/company-actions";
import { COMPANY_FILE_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { FileText, Eye, ExternalLink, Trash2 } from "lucide-react";

interface CompanyFile {
  id: string;
  file_name: string;
  file_type: string;
  storage_path: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
  notes: string | null;
}

interface CompanyFileListProps {
  files: CompanyFile[];
  onDeleted: () => void;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function CompanyFileList({ files, onDeleted }: CompanyFileListProps) {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleView = async (storagePath: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase.storage
        .from("company-files")
        .createSignedUrl(storagePath, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch {
      toast({ title: "Error getting file URL", variant: "destructive" });
    }
  };

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const supabase = createClient();
      const { data } = await supabase.storage
        .from("company-files")
        .createSignedUrl(storagePath, 3600, { download: fileName });

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch {
      toast({ title: "Error downloading file", variant: "destructive" });
    }
  };

  const handleDelete = async (file: CompanyFile) => {
    setDeletingId(file.id);
    try {
      const result = await deleteCompanyFileAction(file.id, file.storage_path);
      if ("error" in result && result.error) {
        toast({
          title: "Error deleting file",
          description: result.error,
          variant: "destructive",
        });
      } else {
        toast({ title: "File deleted" });
        onDeleted();
      }
    } finally {
      setDeletingId(null);
    }
  };

  if (files.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No files uploaded yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => {
        const typeLabel =
          COMPANY_FILE_TYPES.find((t) => t.value === file.file_type)?.label ??
          file.file_type;

        return (
          <div
            key={file.id}
            className="flex items-center gap-3 rounded-lg border px-3 py-2.5 hover:bg-muted transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted">
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {file.file_name}
              </p>
              <p className="text-xs text-muted-foreground">
                {typeLabel} · {formatFileSize(file.file_size)} ·{" "}
                {formatDate(file.uploaded_at)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleView(file.storage_path)}
                className="h-7 w-7 p-0"
                title="View"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  handleDownload(file.storage_path, file.file_name)
                }
                className="h-7 w-7 p-0"
                title="Download"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(file)}
                disabled={deletingId === file.id}
                className="h-7 w-7 p-0 text-red-500 hover:text-red-600"
                title="Delete"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
