"use client";

import React, { useState, useRef, useTransition, useEffect, useMemo, useCallback } from "react";
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
  ChevronDown,
  ChevronRight,
  Search,
  Archive,
  Link2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
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
import { useDocumentReviewStatus } from "@/hooks/useDocumentReviewStatus";
import { GenerateDocumentDialog } from "@/components/documents/GenerateDocumentDialog";
import { SecureUploadLinkDialog } from "@/components/pipeline/SecureUploadLinkDialog";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import type { DealDocument, DealCondition } from "./types";
import { formatFileSize, getFileExt, FILE_TYPE_CONFIG } from "./utils";

// ─── File type badge (compact) ───

function FileTypeBadge({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  const ext = getFileExt(name);
  const cfg = FILE_TYPE_CONFIG[ext] ?? {
    color: "text-muted-foreground bg-muted border-border",
    label: ext.slice(0, 3).toUpperCase() || "FILE",
  };
  const sz = small ? "h-5 w-7 text-[7px]" : "h-6 w-8 text-[8px]";
  return (
    <div
      className={cn(
        sz,
        "rounded border flex items-center justify-center shrink-0 font-bold tracking-wider",
        cfg.color
      )}
    >
      {cfg.label}
    </div>
  );
}

// Re-export for use by ConditionsSection
export { FileTypeBadge };

// ─── Documents Section ───

export function DocumentsSection({
  documents,
  conditions,
  dealId,
  dealName,
  googleDriveFolderUrl,
  onPreviewDoc,
  onUploadComplete,
  currentUserId,
  currentUserName,
}: {
  documents: DealDocument[];
  conditions: DealCondition[];
  dealId: string;
  dealName?: string;
  googleDriveFolderUrl?: string | null;
  onPreviewDoc: (doc: DealDocument) => void;
  onUploadComplete?: () => void;
  currentUserId?: string;
  currentUserName?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [togglingVisId, setTogglingVisId] = useState<string | null>(null);
  const [runningAiReviewId, setRunningAiReviewId] = useState<string | null>(null);
  const [docSearch, setDocSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    () => new Set()
  );

  useDocumentReviewStatus(
    dealId,
    documents.map((d) => d.review_status)
  );

  // Filter: active vs archived
  const activeDocs = showArchived
    ? documents
    : documents.filter((d) => !d.archived_at);
  const archivedCount = documents.filter((d) => d.archived_at).length;
  const activeCount = documents.filter((d) => !d.archived_at).length;

  // Search
  const searchedDocs = docSearch
    ? activeDocs.filter((d) =>
        d.document_name.toLowerCase().includes(docSearch.toLowerCase())
      )
    : activeDocs;

  // Group by category
  const docsByCategory = useMemo(() => {
    const groups: Record<string, DealDocument[]> = {};
    for (const d of searchedDocs) {
      const cat = d.category || "general";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(d);
    }
    return groups;
  }, [searchedDocs]);

  const categoryOrder = Object.keys(docsByCategory).sort();

  // Auto-expand first 2 categories on initial render
  useEffect(() => {
    if (expandedCategories.size === 0 && categoryOrder.length > 0) {
      setExpandedCategories(new Set(categoryOrder.slice(0, 2)));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleCategory(cat: string) {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  async function handleViewOrDownload(doc: DealDocument, download: boolean) {
    if (!doc.storage_path) {
      showError("No storage path for this document");
      return;
    }
    setDownloadingId(doc.id);
    const result = await getDocumentSignedUrl(doc.storage_path);
    setDownloadingId(null);
    if (result.error || !result.url) {
      showError("Could not get download link", result.error ?? "Unknown error");
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
          const urlResult = await createDealDocumentUploadUrl(dealId, file.name);
          if (
            urlResult.error ||
            !urlResult.signedUrl ||
            !urlResult.storagePath ||
            !urlResult.token
          ) {
            showError(`Could not upload ${file.name}`, urlResult.error ?? "Could not create upload URL");
            continue;
          }
          const uploadRes = await fetch(urlResult.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          if (!uploadRes.ok) {
            const errorText = await uploadRes.text().catch(() => "Unknown error");
            showError(`Could not upload ${file.name}`, errorText);
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
            showError(`Could not save ${file.name}`, saveResult.error);
          } else {
            showSuccess(`Uploaded ${file.name}`);
            onUploadComplete?.();
          }
        } catch (err) {
          showError(`Could not upload ${file.name}`, err instanceof Error ? err.message : "Upload failed");
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

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
  }

  function handleDragEnter(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (dragCounter.current === 1) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) setIsDragging(false);
  }

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.kind === "file") {
          const file = item.getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length === 0) return;
      e.preventDefault();
      uploadFiles(files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  async function handleDelete(docId: string, docName: string) {
    setDeletingId(docId);
    const result = await deleteDealDocumentV2(docId);
    if (result.error) {
      showError("Could not delete document", result.error);
    } else {
      showSuccess(`Deleted ${docName}`);
      onUploadComplete?.();
    }
    setDeletingId(null);
  }

  async function handleArchive(docId: string, archived: boolean) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { error } = await supabase
      .from("unified_deal_documents" as never)
      .update({ archived_at: archived ? new Date().toISOString() : null } as never)
      .eq("id" as never, docId as never);
    if (error) {
      showError(`Could not ${archived ? "archive" : "unarchive"} document`, error.message);
    } else {
      showSuccess(archived ? "Document archived" : "Document restored");
      onUploadComplete?.();
    }
  }

  async function toggleVisibility(doc: DealDocument) {
    const current = (doc.visibility || "internal") as "internal" | "external";
    const next = current === "internal" ? "external" : "internal";
    setTogglingVisId(doc.id);
    const result = await updateDocumentVisibility(doc.id, dealId, next);
    setTogglingVisId(null);
    if (result.error) {
      showError("Could not update visibility", result.error);
    } else {
      showSuccess(next === "external" ? "Marked as shared" : "Marked as internal");
    }
  }

  const catLabel = (cat: string) =>
    cat === "general" ? "General" : cat.charAt(0).toUpperCase() + cat.slice(1);

  return (
    <div
      className={cn(
        "rounded-xl border bg-card transition-colors",
        isDragging && "border-primary/50 bg-primary/5"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.png,.jpg,.jpeg"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
        <FileText className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
        <span className="text-sm font-medium">Documents</span>
        <span className="text-[11px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
          {activeCount}
        </span>
        <div className="flex-1" />

        {/* Archive toggle */}
        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
            showArchived
              ? "border-foreground/20 bg-foreground/5 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Archive className="h-3 w-3" strokeWidth={1.5} />
          Archived
          {archivedCount > 0 && (
            <span className="text-[10px] opacity-60">({archivedCount})</span>
          )}
        </button>

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

        {googleDriveFolderUrl && (
          <a
            href={googleDriveFolderUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.5} />
            Drive
          </a>
        )}

        <SecureUploadLinkDialog
          dealId={dealId}
          conditions={conditions}
          dealName={dealName}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
          trigger={
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer"
            >
              <Link2 className="h-3 w-3" strokeWidth={1.5} />
              Upload Link
            </button>
          }
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer"
        >
          <Upload className="h-3 w-3" strokeWidth={1.5} />
          Upload
        </button>
      </div>

      {/* Search */}
      <div className="px-4 py-2 border-b border-border/30">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={docSearch}
            onChange={(e) => setDocSearch(e.target.value)}
            className="h-7 pl-8 text-xs"
          />
        </div>
      </div>

      {/* Collapsible category groups */}
      {categoryOrder.length === 0 && (
        <EmptyState
          icon={FileText}
          title={
            documents.length === 0
              ? "No documents uploaded yet"
              : "No documents match your search"
          }
          compact
        />
      )}

      {categoryOrder.map((cat) => {
        const docs = docsByCategory[cat];
        const isOpen = expandedCategories.has(cat);
        return (
          <div key={cat} className="border-b border-border/30 last:border-b-0">
            <button
              type="button"
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-muted/30 transition-colors cursor-pointer"
            >
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.5} />
              )}
              <span className="text-xs font-medium text-foreground flex-1 text-left">
                {catLabel(cat)}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground tabular-nums">
                {docs.length}
              </span>
            </button>
            {isOpen && (
              <div className="pb-1">
                {docs.map((doc) => {
                  const isArchived = !!doc.archived_at;
                  const isExternal = doc.visibility === "external";
                  return (
                    <div
                      key={doc.id}
                      className={cn(
                        "flex items-center gap-2 px-4 py-1.5 mx-2 rounded hover:bg-muted/40 transition-colors group",
                        isArchived && "opacity-50"
                      )}
                    >
                      <FileTypeBadge name={doc.document_name} />
                      <div className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "text-xs text-foreground truncate block",
                            isArchived && "line-through text-muted-foreground"
                          )}
                        >
                          {doc.document_name}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {formatFileSize(doc.file_size_bytes)}
                      </span>

                      {/* Visibility pill */}
                      <button
                        type="button"
                        onClick={() => toggleVisibility(doc)}
                        disabled={togglingVisId === doc.id}
                        title={isExternal ? "Shared (click to make internal)" : "Internal (click to share)"}
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0 text-[9px] font-medium transition-colors cursor-pointer shrink-0",
                          isExternal
                            ? "border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "border-border text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {togglingVisId === doc.id ? (
                          <Loader2 className="h-2 w-2 animate-spin" />
                        ) : isExternal ? (
                          <Globe className="h-2 w-2" strokeWidth={1.5} />
                        ) : (
                          <Lock className="h-2 w-2" strokeWidth={1.5} />
                        )}
                        {isExternal ? "SHARED" : "INT"}
                      </button>

                      {/* AI review: per-item button when queued, badge otherwise */}
                      {doc.review_status === "pending" ? (
                        <button
                          type="button"
                          disabled={runningAiReviewId !== null}
                          onClick={async () => {
                            setRunningAiReviewId(doc.id);
                            const result = await triggerDocumentAnalysis(doc.id, dealId);
                            setRunningAiReviewId(null);
                            if (result?.error) {
                              showError("Could not start AI review", result.error);
                            } else {
                              showSuccess("AI review started for this document");
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-1.5 py-0 text-[9px] font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground cursor-pointer shrink-0 disabled:opacity-50 disabled:pointer-events-none"
                        >
                          {runningAiReviewId === doc.id ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <Sparkles className="h-2.5 w-2.5" strokeWidth={1.5} />
                          )}
                          AI Review
                        </button>
                      ) : (
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
                              retriggerDocumentReview(doc.id);
                            } else if (
                              doc.review_status &&
                              !["pending", "processing"].includes(doc.review_status)
                            ) {
                              onPreviewDoc(doc);
                            }
                          }}
                        />
                      )}

                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                        {formatDate(doc.created_at)}
                      </span>

                      {/* Hover actions */}
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {doc.storage_path && (
                          <button
                            type="button"
                            onClick={() => onPreviewDoc(doc)}
                            disabled={downloadingId === doc.id}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
                            title="Preview"
                          >
                            <Eye className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        )}
                        {doc.storage_path && (
                          <button
                            type="button"
                            onClick={() => handleViewOrDownload(doc, true)}
                            disabled={downloadingId === doc.id}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
                            title="Download"
                          >
                            <Download className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        )}
                        {!isArchived && (
                          <button
                            type="button"
                            onClick={() => handleArchive(doc.id, true)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
                            title="Archive"
                          >
                            <Archive className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        )}
                        {isArchived && (
                          <button
                            type="button"
                            onClick={() => handleArchive(doc.id, false)}
                            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer bg-transparent border-0"
                            title="Restore"
                          >
                            <Archive className="h-3 w-3" strokeWidth={1.5} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(doc.id, doc.document_name)}
                          disabled={deletingId === doc.id}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors cursor-pointer bg-transparent border-0"
                          title="Delete"
                        >
                          {deletingId === doc.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Trash2 className="h-3 w-3" strokeWidth={1.5} />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Drop zone indicator */}
      <div
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onPaste={handlePaste}
        className={cn(
          "w-full cursor-pointer border-t border-dashed border-border/50 px-4 py-3 text-center transition-colors hover:bg-muted/50 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20",
          isDragging && "border-primary/50 bg-primary/5"
        )}
      >
        <div className={cn(
          "flex items-center justify-center gap-2 text-muted-foreground",
          isDragging && "text-primary"
        )}>
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          <span className="text-[11px] font-medium">
            {uploading ? "Uploading..." : isDragging ? "Drop files to upload" : "Drop files or paste (Ctrl+V) here"}
          </span>
        </div>
      </div>
    </div>
  );
}
