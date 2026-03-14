"use client";

import { useState, useRef, useTransition } from "react";
import {
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  Loader2,
  ExternalLink,
  Lock,
  Globe,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  createDealDocumentUploadUrl,
  saveDealDocumentRecord,
  deleteDealDocumentV2,
  retriggerDocumentReview,
  triggerDocumentAnalysis,
  getDocumentSignedUrl,
  updateDocumentVisibility,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { ReviewStatusBadge } from "@/components/pipeline/ReviewStatusBadge";
import { DocumentReviewPanel } from "@/components/pipeline/DocumentReviewPanel";
import { useDocumentReviewStatus } from "@/hooks/useDocumentReviewStatus";
import { GenerateDocumentDialog } from "@/components/documents/GenerateDocumentDialog";

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
  visibility?: string | null;
  _uploaded_by_name?: string | null;
}

type VisibilityFilter = "all" | "internal" | "external";

interface DocumentsTabProps {
  documents: DealDocument[];
  dealId: string;
  googleDriveFolderUrl?: string | null;
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

export function DocumentsTab({
  documents,
  dealId,
  googleDriveFolderUrl,
}: DocumentsTabProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DealDocument | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [visibilityFilter, setVisibilityFilter] =
    useState<VisibilityFilter>("all");
  const [togglingVisId, setTogglingVisId] = useState<string | null>(null);

  useDocumentReviewStatus(
    dealId,
    documents.map((d) => d.review_status)
  );

  const filteredDocs =
    visibilityFilter === "all"
      ? documents
      : documents.filter(
          (d) => (d.visibility || "internal") === visibilityFilter
        );

  const internalCount = documents.filter(
    (d) => (d.visibility || "internal") === "internal"
  ).length;
  const externalCount = documents.filter(
    (d) => d.visibility === "external"
  ).length;

  async function handleViewOrDownload(doc: DealDocument, download: boolean) {
    if (!doc.storage_path) {
      toast.error("No storage path for this document");
      return;
    }
    setDownloadingId(doc.id);
    const result = await getDocumentSignedUrl(doc.storage_path);
    setDownloadingId(null);
    if (result.error || !result.url) {
      toast.error(
        `Failed to get download link: ${result.error ?? "Unknown error"}`
      );
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
          const urlResult = await createDealDocumentUploadUrl(
            dealId,
            file.name
          );
          if (
            urlResult.error ||
            !urlResult.signedUrl ||
            !urlResult.storagePath ||
            !urlResult.token
          ) {
            toast.error(
              `Failed to upload ${file.name}: ${urlResult.error ?? "Could not create upload URL"}`
            );
            continue;
          }

          const uploadRes = await fetch(urlResult.signedUrl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type || "application/octet-stream",
            },
            body: file,
          });

          if (!uploadRes.ok) {
            const errorText = await uploadRes
              .text()
              .catch(() => "Unknown error");
            toast.error(`Failed to upload ${file.name}: ${errorText}`);
            continue;
          }

          const saveResult = await saveDealDocumentRecord({
            dealId,
            storagePath: urlResult.storagePath,
            documentName: file.name,
            fileSizeBytes: file.size,
            mimeType: file.type || "application/octet-stream",
            visibility: "internal",
          });

          if (saveResult.error) {
            toast.error(`Failed to save ${file.name}: ${saveResult.error}`);
          } else {
            toast.success(`Uploaded ${file.name}`);
            if (saveResult.documentId) {
              triggerDocumentAnalysis(saveResult.documentId, dealId).then(
                (result) => {
                  if (result.error) {
                    toast.error(
                      `AI review failed for ${file.name}: ${result.error}`
                    );
                  }
                }
              );
            }
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

  async function toggleVisibility(doc: DealDocument) {
    const current = (doc.visibility || "internal") as "internal" | "external";
    const next = current === "internal" ? "external" : "internal";
    setTogglingVisId(doc.id);
    const result = await updateDocumentVisibility(doc.id, dealId, next);
    setTogglingVisId(null);
    if (result.error) {
      toast.error(`Failed to update visibility: ${result.error}`);
    } else {
      toast.success(
        next === "external" ? "Marked as shared" : "Marked as internal"
      );
    }
  }

  const filterButtons: { value: VisibilityFilter; label: string; count: number }[] = [
    { value: "all", label: "All", count: documents.length },
    { value: "internal", label: "Internal", count: internalCount },
    { value: "external", label: "Shared", count: externalCount },
  ];

  return (
    <div className="flex flex-col gap-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileSelect}
      />

      <div className="rounded-xl border bg-card">
        {/* Header with filters and Drive link */}
        <div className="flex items-center gap-2 border-b border-border/50 px-5 py-3">
          <FileText
            className="h-4 w-4 text-muted-foreground"
            strokeWidth={1.5}
          />
          <span className="text-sm font-medium">Documents</span>

          {/* Filter pills */}
          <div className="ml-3 flex items-center gap-1">
            {filterButtons.map((f) => (
              <button
                key={f.value}
                onClick={() => setVisibilityFilter(f.value)}
                className={cn(
                  "cursor-pointer rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  visibilityFilter === f.value
                    ? "border-foreground/20 bg-foreground/5 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {f.label}
                <span className="ml-1 opacity-60">{f.count}</span>
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <GenerateDocumentDialog
            recordType="deal"
            recordId={dealId}
            trigger={
              <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer">
                <Sparkles className="h-3 w-3" strokeWidth={1.5} />
                Generate
              </button>
            }
          />

          {/* Google Drive link */}
          {googleDriveFolderUrl && (
            <a
              href={googleDriveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
              Open in Drive
            </a>
          )}
        </div>

        {filteredDocs.length === 0 && (
          <div className="px-5 py-8 text-center text-sm text-muted-foreground">
            {documents.length === 0
              ? "No documents uploaded yet."
              : `No ${visibilityFilter} documents.`}
          </div>
        )}

        {filteredDocs.map((doc, i) => {
          const isExternal = doc.visibility === "external";
          return (
            <div
              key={doc.id}
              className={cn(
                "flex items-center gap-3 px-5 py-3",
                i < filteredDocs.length - 1 && "border-b border-border/50"
              )}
            >
              <FileText
                className="h-4 w-4 shrink-0 text-muted-foreground"
                strokeWidth={1.5}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">
                  {doc.document_name}
                </div>
                <div className="text-[11px] num text-muted-foreground">
                  {doc._uploaded_by_name || "\u2014"} &middot;{" "}
                  {formatDate(doc.created_at)} &middot;{" "}
                  {formatFileSize(doc.file_size_bytes)}
                </div>
              </div>

              {/* Visibility toggle */}
              <button
                onClick={() => toggleVisibility(doc)}
                disabled={togglingVisId === doc.id}
                title={isExternal ? "Shared (click to make internal)" : "Internal (click to share)"}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors cursor-pointer",
                  isExternal
                    ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20"
                    : "border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {togglingVisId === doc.id ? (
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                ) : isExternal ? (
                  <Globe className="h-2.5 w-2.5" strokeWidth={1.5} />
                ) : (
                  <Lock className="h-2.5 w-2.5" strokeWidth={1.5} />
                )}
                {isExternal ? "SHARED" : "INTERNAL"}
              </button>

              {doc.category && doc.category !== "general" && (
                <Badge variant="outline" className="text-[10px] uppercase">
                  {doc.category}
                </Badge>
              )}
              <ReviewStatusBadge
                status={
                  doc.review_status as
                    | "pending"
                    | "processing"
                    | "ready"
                    | "applied"
                    | "partially_applied"
                    | "rejected"
                    | "error"
                    | null
                }
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
          );
        })}

        {/* Compact upload zone at the bottom of the card */}
        <button
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          disabled={uploading}
          className="w-full cursor-pointer border-t border-dashed border-border/50 px-5 py-4 text-center transition-colors hover:bg-muted/50"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" strokeWidth={1.5} />
            )}
            <span className="text-xs font-medium">
              {uploading ? "Uploading..." : "Drop files here or click to upload"}
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              PDF, DOCX, XLSX up to 25MB
            </span>
          </div>
        </button>
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
