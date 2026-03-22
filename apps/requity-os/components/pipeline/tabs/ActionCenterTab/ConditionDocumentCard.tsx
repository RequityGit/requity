"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  FileSpreadsheet,
  File,
  Eye,
  Download,
  Trash2,
  Loader2,
  Check,
  AlertTriangle,
  HelpCircle,
  XCircle,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import type { ConditionDocument } from "./useActionCenterData";
import type { ReviewStatus } from "./useConditionDocuments";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return { icon: FileText, color: "text-red-500" };
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext))
    return { icon: Image, color: "text-blue-500" };
  if (["xls", "xlsx", "csv"].includes(ext))
    return { icon: FileSpreadsheet, color: "text-green-500" };
  if (["doc", "docx"].includes(ext))
    return { icon: FileText, color: "text-blue-600" };
  return { icon: File, color: "text-muted-foreground" };
}

interface ConditionDocumentCardProps {
  doc: ConditionDocument;
  reviewStatus?: ReviewStatus;
  onPreview: () => void;
  onDownload: () => void;
  onDelete: () => void;
  onRetriggerReview: () => void;
}

export function ConditionDocumentCard({
  doc,
  reviewStatus,
  onPreview,
  onDownload,
  onDelete,
  onRetriggerReview,
}: ConditionDocumentCardProps) {
  const [hovered, setHovered] = useState(false);
  const fileInfo = getFileIcon(doc.document_name);
  const FileIcon = fileInfo.icon;

  return (
    <div
      className="group flex items-center gap-2.5 rounded-lg border px-3 py-2 rq-transition hover:bg-muted/30"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* File type icon */}
      <FileIcon className={cn("h-4 w-4 shrink-0", fileInfo.color)} />

      {/* Name + meta */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium truncate">{doc.document_name}</p>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {doc.file_size_bytes && <span>{formatBytes(doc.file_size_bytes)}</span>}
          {doc.created_at && <span>{timeAgo(doc.created_at)}</span>}
        </div>
      </div>

      {/* AI status badge */}
      {reviewStatus && (
        <AIStatusBadge status={reviewStatus} onRetrigger={onRetriggerReview} />
      )}

      {/* Hover actions */}
      <div
        className={cn(
          "flex items-center gap-1 rq-transition",
          hovered ? "opacity-100" : "opacity-0"
        )}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onPreview(); }}
          className="rounded p-1 hover:bg-muted rq-transition"
          title="Preview"
        >
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDownload(); }}
          className="rounded p-1 hover:bg-muted rq-transition"
          title="Download"
        >
          <Download className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="rounded p-1 hover:bg-destructive/10 rq-transition"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
    </div>
  );
}

function AIStatusBadge({
  status,
  onRetrigger,
}: {
  status: ReviewStatus;
  onRetrigger: () => void;
}) {
  if (status.status === "processing") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
        <Loader2 className="h-3 w-3 animate-spin" />
        Analyzing
      </span>
    );
  }

  if (status.status === "completed" && status.data) {
    const rec = status.data.recommendation;
    if (rec === "approve") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-medium text-green-600 dark:text-green-400">
          <Check className="h-3 w-3" />
          AI Pass
        </span>
      );
    }
    if (rec === "request_revision") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Needs Revision
        </span>
      );
    }
    if (rec === "needs_manual_review") {
      return (
        <span className="flex items-center gap-1 rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] font-medium text-purple-600 dark:text-purple-400">
          <HelpCircle className="h-3 w-3" />
          Manual Review
        </span>
      );
    }
  }

  if (status.status === "error") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRetrigger();
        }}
        className="flex items-center gap-1 rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400 hover:bg-red-500/20 rq-transition"
      >
        <XCircle className="h-3 w-3" />
        Failed
        <RotateCw className="h-2.5 w-2.5 ml-0.5" />
      </button>
    );
  }

  return null;
}
