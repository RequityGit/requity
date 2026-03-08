"use client";

import { useState, useRef, useTransition } from "react";
import { Upload, FileText, Eye, Download, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createDealDocumentUploadUrl,
  saveDealDocumentRecord,
  deleteDealDocumentV2,
  retriggerDocumentReview,
  getDocumentSignedUrl,
} from "@/app/(authenticated)/admin/pipeline-v2/[id]/actions";
import { ReviewStatusBadge } from "@/components/pipeline-v2/ReviewStatusBadge";
import { DocumentReviewPanel } from "@/components/pipeline-v2/DocumentReviewPanel";
import { useDocumentReviewStatus } from "@/hooks/useDocumentReviewStatus";

interface DealDocument {
  id: string;
  deal_id: string;
  document_name: string;
  file_url: string;
  file_size_bytes: number | null;
  mime_type: string | null;
  category: string | null;
  uploaded_by: string | null;
  created_at: string;
  review_status: string | null;
  storage_path: string | null;
  _uploaded_by_name?: string | null;
}

interface DocumentsTabProps {
  documents: DealDocument[];
  dealId: string;
}

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "\u2014";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DocumentsTab({ documents, dealId }: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DealDocument | null>(null);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Subscribe to realtime review status updates
  useDocumentReviewStatus(dealId);

  async function handleViewOrDownload(doc: DealDocument, download: boolean) {
    if (!doc.storage_path) {
      toast.error("No storage path for this document");
      return;
    }
    setDownloadingId(doc.id);
    const result = await getDocumentSignedUrl(doc.storage_path);
    setDownloadingId(null);
    if (result.error || !result.url) {
      toast.error(`Failed to get download link: ${result.error ?? "Unknown error"}`);
      return;
    }
    if (download) {
      const a = document.createElement("a");
      a.href = result.url;
      a.download = doc.document_name;
      a.click();
    } else {
      window.open(result.url, "_blank");
    }
  }

  function uploadFiles(files: File[]) {
    if (files.length === 0) return;

    startUpload(async () => {
      for (const file of files) {
        try {
          // 1. Get a signed upload URL from the server
          const urlResult = await createDealDocumentUploadUrl(dealId, file.name);
          if (urlResult.error || !urlResult.signedUrl || !urlResult.storagePath || !urlResult.token) {
            toast.error(`Failed to upload ${file.name}: ${urlResult.error ?? "Could not create upload URL"}`);
            continue;
          }

          // 2. Upload file directly to Supabase storage (bypasses server action body limit)
          const uploadRes = await fetch(urlResult.signedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });

          if (!uploadRes.ok) {
            const errorText = await uploadRes.text().catch(() => "Unknown error");
            toast.error(`Failed to upload ${file.name}: ${errorText}`);
            continue;
          }

          // 3. Save the document record in the database
          const saveResult = await saveDealDocumentRecord({
            dealId,
            storagePath: urlResult.storagePath,
            documentName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || "application/octet-stream",
          });

          if (saveResult.error) {
            toast.error(`Failed to save ${file.name}: ${saveResult.error}`);
          } else {
            toast.success(`Uploaded ${file.name}`);
          }
        } catch (err) {
          toast.error(
            `Failed to upload ${file.name}: ${err instanceof Error ? err.message : "Upload failed"}`
          );
        }
      }
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    uploadFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  }

  function handleDragOver(e: React.DragEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  async function handleDelete(docId: string, docName: string) {
    setDeletingId(docId);
    const result = await deleteDealDocumentV2(docId);
    if (result.error) {
      toast.error(`Failed to delete: ${result.error}`);
    } else {
      toast.success(`Deleted ${docName}`);
    }
    setDeletingId(null);
  }

  function openReviewPanel(doc: DealDocument) {
    setSelectedDoc(doc);
    setReviewPanelOpen(true);
  }

  async function handleRetryReview(docId: string) {
    const result = await retriggerDocumentReview(docId);
    if ("error" in result && result.error) {
      toast.error(`Failed to retry: ${result.error}`);
    } else {
      toast.success("Review retriggered");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Upload zone */}
      <button
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        disabled={uploading}
        className="cursor-pointer rounded-xl border-2 border-dashed border-border bg-card px-5 py-8 text-center transition-colors hover:bg-muted/50"
      >
        {uploading ? (
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-muted-foreground" />
        ) : (
          <Upload className="mx-auto h-7 w-7 text-muted-foreground" strokeWidth={1.5} />
        )}
        <div className="mt-2 text-sm font-medium text-foreground">
          {uploading ? "Uploading..." : "Drop files here or click to upload"}
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          PDF, DOCX, XLSX up to 25MB
        </div>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Document list */}
      <div className="rounded-xl border bg-card">
        <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3">
          <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
          <span className="text-sm font-medium">
            Documents ({documents.length})
          </span>
        </div>

        {documents.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            No documents uploaded yet.
          </div>
        )}

        {documents.map((doc, i) => (
          <div
            key={doc.id}
            className={cn(
              "flex items-center gap-3 px-5 py-3",
              i < documents.length - 1 && "border-b border-border/50"
            )}
          >
            <FileText className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-foreground">
                {doc.document_name}
              </div>
              <div className="text-[11px] num text-muted-foreground">
                {doc._uploaded_by_name || "\u2014"} &middot; {formatDate(doc.created_at)} &middot; {formatFileSize(doc.file_size_bytes)}
              </div>
            </div>
            {doc.category && doc.category !== "general" && (
              <Badge variant="outline" className="text-[10px] uppercase">
                {doc.category}
              </Badge>
            )}
            {/* AI Review Status Badge */}
            <ReviewStatusBadge
              status={doc.review_status as "pending" | "processing" | "ready" | "applied" | "partially_applied" | "rejected" | "error" | null}
              onClick={() => {
                if (doc.review_status === "error") {
                  handleRetryReview(doc.id);
                } else if (
                  doc.review_status &&
                  !["pending", "processing"].includes(doc.review_status)
                ) {
                  openReviewPanel(doc);
                }
              }}
            />
            {doc.storage_path && (
              <button
                onClick={() => handleViewOrDownload(doc, false)}
                disabled={downloadingId === doc.id}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
              >
                {downloadingId === doc.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
              </button>
            )}
            {doc.storage_path && (
              <button
                onClick={() => handleViewOrDownload(doc, true)}
                disabled={downloadingId === doc.id}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
              </button>
            )}
            <button
              onClick={() => handleDelete(doc.id, doc.document_name)}
              disabled={deletingId === doc.id}
              className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer bg-transparent border-0"
            >
              {deletingId === doc.id ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Review Panel */}
      <DocumentReviewPanel
        open={reviewPanelOpen}
        onOpenChange={setReviewPanelOpen}
        documentId={selectedDoc?.id ?? null}
        documentName={selectedDoc?.document_name ?? ""}
        onApplied={() => {
          // Page will revalidate via server action
        }}
      />
    </div>
  );
}
