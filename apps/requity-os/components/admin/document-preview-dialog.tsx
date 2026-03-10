"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Download, FileText } from "lucide-react";
import { getDocumentPreviewUrl } from "@/app/(authenticated)/admin/documents/actions";
import type { DocumentRow } from "@/components/admin/document-list-table";

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: DocumentRow | null;
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  document,
}: DocumentPreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !document) {
      setUrl(null);
      setMimeType(null);
      return;
    }

    setLoading(true);
    getDocumentPreviewUrl(document.id, document.source)
      .then((result) => {
        if ("error" in result) {
          toast.error(result.error);
          setUrl(null);
        } else {
          setUrl(result.url);
          setMimeType(result.mime_type);
        }
      })
      .finally(() => setLoading(false));
  }, [open, document?.id, document?.source]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayName = document?.description || document?.file_name || "Document";
  const effectiveMime = mimeType || document?.mime_type || "";

  const isPdf = effectiveMime.includes("pdf");
  const isImage = effectiveMime.startsWith("image/");

  function handleDownload() {
    if (!url) return;
    const a = window.document.createElement("a");
    a.href = url;
    a.download = document?.file_name || "download";
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.click();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
        <DialogHeader className="flex-none flex flex-row items-center justify-between gap-4">
          <DialogTitle className="truncate">{displayName}</DialogTitle>
          {url && (
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1.5" />
              Download
            </Button>
          )}
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-hidden rounded-md border bg-muted/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          ) : !url ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
              <FileText className="h-12 w-12" />
              <p>Unable to load preview</p>
            </div>
          ) : isPdf ? (
            <iframe
              src={url}
              className="w-full h-full border-0"
              title={displayName}
            />
          ) : isImage ? (
            <div className="flex items-center justify-center h-full p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={displayName}
                className="max-w-full max-h-full object-contain"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
              <FileText className="h-16 w-16 text-muted-foreground" />
              <div>
                <p className="font-medium text-lg">{document?.file_name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {effectiveMime || "Unknown file type"} — preview not available
                  for this file type
                </p>
              </div>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4 mr-1.5" />
                Download File
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
