"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  Eye,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  MessageSquare,
  Search,
  Link2,
  X,
  AlertTriangle,
  Check,
  Info,
  User,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { showSuccess, showError } from "@/lib/toast";
import { updateConditionStatusAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  createDealDocumentUploadUrl,
  saveDealDocumentRecord,
  requestConditionRevision,
  getConditionReview,
  type ConditionReviewData,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { createClient } from "@/lib/supabase/client";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { formatDate } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { ClipboardCheck } from "lucide-react";
import type { DealDocument, DealCondition } from "./types";
import { FileTypeBadge } from "./DocumentsSection";
import {
  CONDITION_STAGE_ORDER,
  CONDITION_STAGE_LABELS,
  CATEGORY_LABELS,
  STAGE_FILTERS,
  CONDITION_STATUS_CONFIG,
  STATUS_OPTIONS,
  getCeilingStage,
  getVisibleStages,
  getCeilingLabel,
  getFileExt,
} from "./utils";

// ─── Condition Status Icon ───

function StatusIcon({
  status,
  hasDocuments,
}: {
  status: string;
  hasDocuments: boolean;
}) {
  const cleared = ["approved", "waived", "not_applicable"].includes(status);
  const inReview = status === "under_review" || status === "in_review";
  const pending = status === "pending";

  if (cleared) {
    return (
      <CheckCircle2
        className="h-4.5 w-4.5 shrink-0 text-green-600 dark:text-green-500"
        strokeWidth={1.5}
      />
    );
  }
  if (inReview) {
    return (
      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-blue-500 bg-blue-500/10" />
    );
  }
  if (pending && hasDocuments) {
    return (
      <div className="h-4 w-4 shrink-0 rounded-full border-2 border-yellow-500 bg-yellow-500/10" />
    );
  }
  return (
    <div className="h-4 w-4 shrink-0 rounded-full border-2 border-muted-foreground/30" />
  );
}

// ─── Link Document Popover ───

function LinkDocumentPopover({
  open,
  onOpenChange,
  availableDocs,
  onLink,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableDocs: DealDocument[];
  onLink: (docId: string) => void;
}) {
  const [search, setSearch] = useState("");

  const filtered = search
    ? availableDocs.filter((d) =>
        d.document_name.toLowerCase().includes(search.toLowerCase())
      )
    : availableDocs;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer",
            open
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
          title="Link existing document"
        >
          <Link2 className="h-3 w-3" strokeWidth={1.5} />
          Link
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-7 pl-7 text-xs"
            autoFocus
          />
        </div>
        <div className="max-h-48 overflow-y-auto space-y-0.5">
          {filtered.length === 0 ? (
            <div className="text-xs text-muted-foreground py-3 text-center">
              No documents available to link.
            </div>
          ) : (
            filtered.slice(0, 10).map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  onLink(doc.id);
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted transition-colors text-left cursor-pointer"
              >
                <FileTypeBadge name={doc.document_name} small />
                <span className="text-xs text-foreground truncate flex-1">
                  {doc.document_name}
                </span>
                {doc.category && doc.category !== "general" && (
                  <span className="text-[9px] text-muted-foreground shrink-0">
                    {doc.category}
                  </span>
                )}
              </button>
            ))
          )}
          {filtered.length > 10 && (
            <div className="text-[10px] text-muted-foreground text-center pt-1">
              +{filtered.length - 10} more, refine your search
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ─── Condition Row ───

function ConditionRow({
  condition: cond,
  condDocs,
  isRowExpanded,
  isLinking,
  isOverdue,
  noteCount,
  dealId,
  currentUserId,
  currentUserName,
  onToggleRow,
  onSetLinkingCondition,
  onStatusChange,
  onUploadToCondition,
  onLinkDoc,
  onUnlinkDoc,
  getAvailableDocsForLinking,
  onPreviewDoc,
  onApprovalChange,
  onRequestRevision,
}: {
  condition: DealCondition;
  condDocs: DealDocument[];
  isRowExpanded: boolean;
  isLinking: boolean;
  isOverdue?: boolean;
  noteCount: number;
  dealId: string;
  currentUserId: string;
  currentUserName: string;
  onToggleRow: () => void;
  onSetLinkingCondition: (id: string | null) => void;
  onStatusChange: (condId: string, currentStatus: string, newStatus: string) => void;
  onUploadToCondition: (condId: string, file: File) => Promise<void>;
  onLinkDoc: (condId: string, docId: string) => void;
  onUnlinkDoc?: (docId: string) => void;
  getAvailableDocsForLinking: (condId: string) => DealDocument[];
  onPreviewDoc?: (doc: DealDocument) => void;
  onApprovalChange?: (docId: string, status: "approved" | "denied") => Promise<void>;
  onRequestRevision?: (condId: string, feedback: string) => Promise<void>;
}) {
  const [uploading, setUploading] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState(cond.status);
  const [approvingDocId, setApprovingDocId] = useState<string | null>(null);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // AI Review state for expanded row
  const [conditionAiReview, setConditionAiReview] = useState<ConditionReviewData | null>(null);
  const [conditionAiReviewDoc, setConditionAiReviewDoc] = useState<string | null>(null);

  // Sync optimistic status when server data changes
  useEffect(() => {
    setOptimisticStatus(cond.status);
  }, [cond.status]);

  // Load existing AI review when row expands
  useEffect(() => {
    if (!isRowExpanded || condDocs.length === 0) return;
    const doc = condDocs[0];
    if (!doc) return;
    getConditionReview(doc.id, cond.id).then((res) => {
      if (res.data) {
        setConditionAiReview(res.data);
        setConditionAiReviewDoc(doc.document_name);
      }
    });
  }, [isRowExpanded, cond.id, condDocs]);

  const isClearedStatus = ["approved", "waived", "not_applicable"].includes(cond.status);
  const hasDocsNeedingReview = condDocs.some(
    (d) => (d.condition_approval_status ?? "pending") === "pending"
  );

  return (
    <div
      className={cn(
        "border-b border-border last:border-b-0 transition-colors",
        hasDocsNeedingReview &&
          "bg-primary/5 ring-1 ring-primary/25 ring-inset dark:ring-primary/20"
      )}
    >
      {/* Compact row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleRow}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleRow();
          }
        }}
        className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors group"
      >
        <StatusIcon
          status={optimisticStatus}
          hasDocuments={condDocs.length > 0}
        />
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium text-foreground",
              isClearedStatus && "text-muted-foreground line-through"
            )}
          >
            {cond.condition_name}
          </span>
          {isOverdue && !isClearedStatus && (
            <span className="inline-flex items-center rounded-md bg-red-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400 shrink-0">
              Overdue
            </span>
          )}
          {cond.assigned_contact_id && (
            <span
              className="inline-flex items-center gap-0.5 rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-600 dark:text-violet-400 shrink-0"
              title="Assigned to specific borrower"
            >
              <User className="h-2.5 w-2.5" />
            </span>
          )}
        </div>

        {/* Due date */}
        {cond.due_date && !isClearedStatus && (
          <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
            Due {formatDate(cond.due_date)}
          </span>
        )}

        {/* Note count */}
        {noteCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleRow();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 cursor-pointer"
          >
            <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
            <span className="num">{noteCount}</span>
          </button>
        )}

        {/* Action buttons (hover) */}
        <div
          className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Link */}
          <LinkDocumentPopover
            open={isLinking}
            onOpenChange={(open) =>
              onSetLinkingCondition(open ? cond.id : null)
            }
            availableDocs={getAvailableDocsForLinking(cond.id)}
            onLink={(docId) => onLinkDoc(cond.id, docId)}
          />
          {/* Upload */}
          <label
            className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            title="Upload"
          >
            <input
              type="file"
              className="hidden"
              disabled={uploading}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  await onUploadToCondition(cond.id, file);
                } finally {
                  setUploading(false);
                  e.target.value = "";
                }
              }}
            />
            {uploading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Upload className="h-3 w-3" strokeWidth={1.5} />
            )}
            Upload
          </label>
          {/* AI Review - opens preview of first doc */}
          {condDocs.length > 0 && onPreviewDoc && (
            <button
              type="button"
              onClick={() => {
                const doc = condDocs[0];
                if (doc) onPreviewDoc(doc);
              }}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-violet-600/70 hover:text-violet-600 hover:bg-violet-500/5 dark:text-violet-400/70 dark:hover:text-violet-400 transition-colors cursor-pointer"
              title="Open document for AI review"
            >
              <Sparkles className="h-3 w-3" strokeWidth={1.5} />
              AI Review
            </button>
          )}
          {/* Request Revision */}
          {onRequestRevision && (
            <button
              type="button"
              onClick={() => {
                if (!isRowExpanded) onToggleRow();
                setShowRevisionForm(true);
                setRevisionFeedback(cond.borrower_feedback ?? "");
              }}
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
              title="Request revision from borrower"
            >
              <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
              Revision
            </button>
          )}
        </div>

        {/* Status select */}
        <div onClick={(e) => e.stopPropagation()}>
          <Select
            value={optimisticStatus}
            onValueChange={(val) => {
              setOptimisticStatus(val);
              onStatusChange(cond.id, cond.status, val);
            }}
          >
            <SelectTrigger className="h-7 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {CONDITION_STATUS_CONFIG[s]?.label ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
            isRowExpanded && "rotate-180"
          )}
          strokeWidth={1.5}
        />
      </div>

      {/* Linked document chips (preview + approve/deny) */}
      {condDocs.length > 0 && !isRowExpanded && (
        <div className="flex items-center gap-1.5 mx-4 mb-2 ml-12 flex-wrap">
          {condDocs.map((doc) => {
            const approval = doc.condition_approval_status ?? "pending";
            const isApproving = approvingDocId === doc.id;
            const needsReview = approval === "pending";
            return (
              <span
                key={doc.id}
                className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 transition-colors group/chip",
                  needsReview
                    ? "bg-primary/10 text-foreground border-primary/30 shadow-[0_0_0_1px_hsl(var(--primary)/0.15)] hover:bg-primary/15 hover:border-primary/40"
                    : "bg-muted text-muted-foreground border-border hover:text-foreground hover:border-foreground/20"
                )}
              >
                <FileTypeBadge name={doc.document_name} small />
                <span className="max-w-[120px] truncate">
                  {doc.document_name}
                </span>
                {onPreviewDoc && doc.storage_path && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewDoc(doc);
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title="Preview"
                  >
                    <Eye className="h-2.5 w-2.5" strokeWidth={2} />
                  </button>
                )}
                {onApprovalChange && (
                  <>
                    <span
                      className={cn(
                        "px-1 rounded text-[9px] font-medium",
                        approval === "approved" &&
                          "bg-green-500/15 text-green-600 dark:text-green-400",
                        approval === "denied" &&
                          "bg-destructive/15 text-destructive",
                        approval === "pending" && "text-muted-foreground"
                      )}
                    >
                      {approval === "approved"
                        ? "Approved"
                        : approval === "denied"
                          ? "Revision Needed"
                          : "Pending"}
                    </span>
                    {approval !== "approved" && (
                      <button
                        type="button"
                        disabled={isApproving}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setApprovingDocId(doc.id);
                          await onApprovalChange(doc.id, "approved");
                          setApprovingDocId(null);
                        }}
                        className="text-muted-foreground hover:text-green-600 dark:hover:text-green-400 transition-colors cursor-pointer disabled:opacity-50"
                        title="Approve"
                      >
                        {isApproving ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <Check className="h-2.5 w-2.5" strokeWidth={2} />
                        )}
                      </button>
                    )}
                    {approval !== "denied" && (
                      <button
                        type="button"
                        disabled={isApproving}
                        onClick={async (e) => {
                          e.stopPropagation();
                          setApprovingDocId(doc.id);
                          await onApprovalChange(doc.id, "denied");
                          setApprovingDocId(null);
                        }}
                        className="text-muted-foreground hover:text-destructive transition-colors cursor-pointer disabled:opacity-50"
                        title="Deny"
                      >
                        <X className="h-2.5 w-2.5" strokeWidth={2} />
                      </button>
                    )}
                  </>
                )}
                {onUnlinkDoc && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnlinkDoc(doc.id);
                    }}
                    className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors hidden group-hover/chip:inline cursor-pointer"
                    title="Unlink"
                  >
                    <X className="h-2.5 w-2.5" strokeWidth={2} />
                  </button>
                )}
              </span>
            );
          })}
        </div>
      )}

      {/* Expanded content: template guidance + note thread */}
      {isRowExpanded && (
        <div className="border-t border-border bg-muted/50 pl-4 pr-4 pb-4 pt-3">
          <div className="pl-6">
            {/* Template guidance (read-only, from condition template) */}
            {cond.template_guidance && (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/10 px-3 py-2.5">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-primary/50" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <span className="rq-micro-label text-primary/40 block mb-0.5">What to look for</span>
                  <p className="text-xs text-primary/70 leading-relaxed">{cond.template_guidance}</p>
                </div>
              </div>
            )}

            {/* Borrower comment (from their submission) */}
            {cond.borrower_comment && (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/10 px-3 py-2.5">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500/50" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <span className="rq-micro-label text-blue-500/40 block mb-0.5">Borrower Note</span>
                  <p className="text-xs text-blue-500/70 leading-relaxed">{cond.borrower_comment}</p>
                </div>
              </div>
            )}

            {/* AI Review results (persisted from document review) */}
            {conditionAiReview && (
              <div className="mb-3 rounded-lg bg-violet-500/5 border border-violet-500/10 dark:border-violet-400/15 dark:bg-violet-400/5 overflow-hidden">
                <div className="flex items-start gap-2 px-3 py-2.5">
                  <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5 text-violet-500/50 dark:text-violet-400/50" strokeWidth={1.5} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="rq-micro-label text-violet-500/50 dark:text-violet-400/40">
                        AI Review
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] font-semibold",
                          conditionAiReview.recommendation === "approve" &&
                            "bg-green-500/15 text-green-600 dark:text-green-400",
                          conditionAiReview.recommendation === "request_revision" &&
                            "bg-red-500/15 text-red-600 dark:text-red-400",
                          conditionAiReview.recommendation === "needs_manual_review" &&
                            "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                        )}
                      >
                        {conditionAiReview.recommendation === "approve" && <Check className="h-2 w-2" strokeWidth={3} />}
                        {conditionAiReview.recommendation === "request_revision" && <X className="h-2 w-2" strokeWidth={3} />}
                        {conditionAiReview.recommendation === "needs_manual_review" && <AlertTriangle className="h-2 w-2" strokeWidth={2.5} />}
                        {conditionAiReview.recommendation === "approve"
                          ? "Approve"
                          : conditionAiReview.recommendation === "request_revision"
                            ? "Revision"
                            : "Manual Review"}
                      </span>
                      {conditionAiReviewDoc && (
                        <span className="text-[9px] text-muted-foreground/40 truncate">
                          {conditionAiReviewDoc}
                        </span>
                      )}
                    </div>

                    {/* Criteria results - compact */}
                    {conditionAiReview.criteria_results.length > 0 && (
                      <div className="space-y-0.5 mb-1.5">
                        {conditionAiReview.criteria_results.map((cr, idx) => (
                          <div key={idx} className="flex items-start gap-1.5 text-xs">
                            <span className="shrink-0 mt-[1px]">
                              {cr.result === "pass" && <CheckCircle2 className="h-3 w-3 text-green-500" strokeWidth={2} />}
                              {cr.result === "fail" && <X className="h-3 w-3 text-red-500 rounded-full bg-red-500/10 p-[1px]" strokeWidth={2.5} />}
                              {cr.result === "unclear" && <AlertTriangle className="h-3 w-3 text-amber-500" strokeWidth={2} />}
                            </span>
                            <span className="text-foreground/70 leading-snug">
                              <span className="font-medium">{cr.criterion}</span>
                              {cr.detail && (
                                <span className="text-muted-foreground/60"> - {cr.detail}</span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Summary */}
                    <p className="text-xs text-violet-600/60 dark:text-violet-400/50 leading-relaxed">{conditionAiReview.summary}</p>

                    {/* Flags */}
                    {conditionAiReview.flags.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {conditionAiReview.flags.map((flag, idx) => (
                          <div key={idx} className="flex items-start gap-1 text-[11px]">
                            <AlertTriangle className="h-2.5 w-2.5 shrink-0 mt-0.5 text-amber-500" strokeWidth={2} />
                            <span className="text-amber-700 dark:text-amber-400">{flag}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Request Revision action */}
            {onRequestRevision && (
              <div className="mb-3">
                {/* Show existing feedback if any */}
                {cond.status === "rejected" && cond.borrower_feedback && (
                  <div className="mb-2 flex items-start gap-2 rounded-lg bg-destructive/5 border border-destructive/10 px-3 py-2.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-destructive/50" strokeWidth={1.5} />
                    <div className="flex-1 min-w-0">
                      <span className="rq-micro-label text-destructive/40 block mb-0.5">Borrower Feedback (visible to borrower)</span>
                      <p className="text-xs text-destructive/70 leading-relaxed">{cond.borrower_feedback}</p>
                    </div>
                  </div>
                )}

                {!showRevisionForm ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowRevisionForm(true);
                      setRevisionFeedback(cond.borrower_feedback ?? "");
                    }}
                    className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium text-destructive/70 hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/10 transition-colors"
                  >
                    <AlertTriangle className="h-3 w-3" strokeWidth={1.5} />
                    Request Revision
                  </button>
                ) : (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3" onClick={(e) => e.stopPropagation()}>
                    <p className="rq-micro-label text-destructive/50 mb-1.5">
                      Borrower-Facing Feedback
                    </p>
                    <p className="text-[10px] text-muted-foreground mb-2">
                      This message will be visible to the borrower on their upload portal. Be specific about what needs to change.
                    </p>
                    <Textarea
                      value={revisionFeedback}
                      onChange={(e) => setRevisionFeedback(e.target.value)}
                      placeholder='e.g. "Bank statement must show 3 consecutive months. The uploaded file only covers January."'
                      className="text-xs min-h-[60px] mb-2 bg-background"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        disabled={!revisionFeedback.trim() || submittingRevision}
                        onClick={async () => {
                          setSubmittingRevision(true);
                          try {
                            await onRequestRevision(cond.id, revisionFeedback.trim());
                            setShowRevisionForm(false);
                            setRevisionFeedback("");
                          } finally {
                            setSubmittingRevision(false);
                          }
                        }}
                        className="text-xs h-7"
                      >
                        {submittingRevision ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        Send Revision Request
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowRevisionForm(false);
                          setRevisionFeedback("");
                        }}
                        className="text-xs h-7"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Condition notes */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="rq-micro-label">Condition Notes</span>
                <span className="text-xs text-muted-foreground num">{noteCount}</span>
              </div>
              <UnifiedNotes
                entityType="unified_condition"
                entityId={cond.id}
                dealId={dealId}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Conditions Section (main export) ───

export function ConditionsSection({
  conditions,
  documents,
  dealId,
  dealStage,
  onPreviewDoc,
  onApprovalChange,
  onUnlinkDoc,
}: {
  conditions: DealCondition[];
  documents: DealDocument[];
  dealId: string;
  dealStage?: string;
  onPreviewDoc?: (doc: DealDocument) => void;
  onApprovalChange?: (docId: string, status: "approved" | "denied") => Promise<void>;
  onUnlinkDoc?: (docId: string) => void;
}) {
  const router = useRouter();
  const [stageFilter, setStageFilter] = useState<string>("through_current");
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [linkingConditionId, setLinkingConditionId] = useState<string | null>(
    null
  );
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  // Get current user for note threads
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUserId(user.id);
        supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single()
          .then(({ data }) => setCurrentUserName(data?.full_name ?? "Unknown"));
      }
    });
  }, []);

  // Filter conditions by required_stage (cumulative or single)
  const ceiling = dealStage ? getCeilingStage(dealStage) : "closed";
  const cumulativeStages = getVisibleStages(ceiling);

  const filtered = conditions.filter((c) => {
    if (stageFilter === "all") return true;
    if (stageFilter === "through_current") {
      return cumulativeStages.includes(c.required_stage);
    }
    return c.required_stage === stageFilter;
  });

  // Determine which conditions are overdue (from prior stages relative to deal)
  const priorStages = dealStage
    ? (() => {
        const ceilIdx = CONDITION_STAGE_ORDER.indexOf(ceiling as typeof CONDITION_STAGE_ORDER[number]);
        return ceilIdx > 0 ? CONDITION_STAGE_ORDER.slice(0, ceilIdx) as unknown as string[] : [];
      })()
    : [];

  // Stats scoped to filtered conditions (stage-aware)
  const cleared = filtered.filter((c) =>
    ["approved", "waived", "not_applicable"].includes(c.status)
  ).length;
  const total = filtered.length;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
  const pendingCount = filtered.filter((c) => c.status === "pending").length;
  const submittedCount = filtered.filter((c) =>
    ["submitted", "under_review", "in_review"].includes(c.status)
  ).length;

  // Fetch note counts
  useEffect(() => {
    if (conditions.length === 0) return;
    const supabase = createClient();
    const ids = conditions.map((c) => c.id);
    supabase
      .from("notes" as never)
      .select("unified_condition_id" as never)
      .in("unified_condition_id" as never, ids as never)
      .is("deleted_at" as never, null)
      .then(({ data }) => {
        const counts: Record<string, number> = {};
        for (const c of conditions) counts[c.id] = 0;
        for (const row of (data as { unified_condition_id: string }[]) ?? []) {
          if (row.unified_condition_id) {
            counts[row.unified_condition_id] =
              (counts[row.unified_condition_id] ?? 0) + 1;
          }
        }
        setNoteCounts(counts);
      });
  }, [conditions]);

  // Group by category
  const byCategory = new Map<string, DealCondition[]>();
  for (const c of filtered) {
    if (!byCategory.has(c.category)) byCategory.set(c.category, []);
    byCategory.get(c.category)!.push(c);
  }

  // Build doc-to-condition map
  const docsByCondition = useMemo(() => {
    const map = new Map<string, DealDocument[]>();
    for (const d of documents) {
      if (d.condition_id) {
        const list = map.get(d.condition_id) ?? [];
        list.push(d);
        map.set(d.condition_id, list);
      }
    }
    return map;
  }, [documents]);

  // Available docs for linking (not archived, not already linked to this condition)
  function getAvailableDocsForLinking(condId: string) {
    const linked = new Set(
      (docsByCondition.get(condId) ?? []).map((d) => d.id)
    );
    return documents.filter(
      (d) => !d.archived_at && !linked.has(d.id)
    );
  }

  // Link doc to condition
  async function linkDoc(condId: string, docId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("unified_deal_documents" as never)
      .update({ condition_id: condId } as never)
      .eq("id" as never, docId as never);
    if (error) {
      showError("Could not link document", error.message);
    } else {
      showSuccess("Document linked to condition");
      router.refresh();
    }
    setLinkingConditionId(null);
  }

  // Status change handler
  async function handleStatusChange(
    conditionId: string,
    currentStatus: string,
    newStatus: string
  ) {
    const result = await updateConditionStatusAction(
      conditionId,
      newStatus,
      dealId
    );
    if (result.error) {
      showError("Could not update condition", result.error);
    } else {
      showSuccess("Condition updated");
      router.refresh();
    }
  }

  // Request revision on a condition
  async function handleRequestRevision(conditionId: string, feedback: string) {
    const result = await requestConditionRevision(
      conditionId,
      dealId,
      feedback,
      null
    );
    if (result.error) {
      showError("Could not request revision", result.error);
    } else {
      showSuccess("Revision requested - borrower will see feedback on their upload portal");
      router.refresh();
    }
  }

  // Condition document upload
  async function uploadToCondition(condId: string, file: File) {
    const urlResult = await createDealDocumentUploadUrl(
      dealId,
      file.name,
      condId
    );
    if (
      urlResult.error ||
      !urlResult.signedUrl ||
      !urlResult.storagePath ||
      !urlResult.token
    ) {
      showError("Could not create upload URL", urlResult.error);
      return;
    }
    const uploadRes = await fetch(urlResult.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!uploadRes.ok) {
      showError("Could not upload file");
      return;
    }
    const saveResult = await saveDealDocumentRecord({
      dealId,
      storagePath: urlResult.storagePath,
      documentName: file.name,
      fileSizeBytes: file.size,
      mimeType: file.type || "application/octet-stream",
      conditionId: condId,
    });
    if (saveResult.error) {
      showError("Could not save document", saveResult.error);
      return;
    }
    showSuccess(`${file.name} uploaded`);
    router.refresh();
  }

  const toggleCategory = (cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allExpanded = expandedCategories.size === 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground num">
            {cleared} of {total} cleared
          </span>
          <span
            className={cn(
              "text-xl font-bold num",
              pct > 0
                ? "text-green-600 dark:text-green-500"
                : "text-muted-foreground"
            )}
          >
            {pct}%
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-green-600 dark:bg-green-500 transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="mt-1.5 flex justify-end gap-4 text-xs text-muted-foreground">
          <span className="num">{pendingCount} pending</span>
          <span className="num">{submittedCount} submitted</span>
        </div>
      </div>

      {/* Stage breakdown */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {(stageFilter === "through_current" ? cumulativeStages : CONDITION_STAGE_ORDER as unknown as string[]).map((stage) => {
          const stageConditions = conditions.filter((c) => c.required_stage === stage);
          if (stageConditions.length === 0) return null;
          const stageCleared = stageConditions.filter((c) =>
            ["approved", "waived", "not_applicable"].includes(c.status)
          ).length;
          return (
            <button
              key={stage}
              type="button"
              onClick={() => setStageFilter(stage)}
              className="num hover:text-foreground transition-colors cursor-pointer"
            >
              {CONDITION_STAGE_LABELS[stage] ?? stage}: <span className="font-semibold">{stageCleared}/{stageConditions.length}</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {dealStage && (
          <button
            type="button"
            onClick={() => setStageFilter("through_current")}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              stageFilter === "through_current"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {getCeilingLabel(dealStage)}
          </button>
        )}
        {STAGE_FILTERS.filter(f => f.key !== "all").map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setStageFilter(key)}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              stageFilter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setStageFilter("all")}
          className={cn(
            "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
            stageFilter === "all"
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:text-foreground"
          )}
        >
          All
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card">
          <EmptyState
            icon={ClipboardCheck}
            title="No conditions match the current filter"
            compact
          />
        </div>
      )}

      {/* Category groups */}
      {Array.from(byCategory.entries()).map(([category, items]) => {
        const catLabel =
          CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
        const catCleared = items.filter((c) =>
          ["approved", "waived", "not_applicable"].includes(c.status)
        ).length;
        const isExpanded = allExpanded || expandedCategories.has(category);

        return (
          <div
            key={category}
            className="overflow-hidden rounded-xl border border-border bg-card"
          >
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold text-foreground">
                  {catLabel}
                </span>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums num">
                {catCleared}/{items.length}
              </span>
            </button>

            {isExpanded && (
              <div className="divide-y divide-border">
                {[...items].sort((a, b) => {
                  const aOverdue = priorStages.includes(a.required_stage) && !["approved", "waived", "not_applicable"].includes(a.status);
                  const bOverdue = priorStages.includes(b.required_stage) && !["approved", "waived", "not_applicable"].includes(b.status);
                  if (aOverdue && !bOverdue) return -1;
                  if (!aOverdue && bOverdue) return 1;
                  return 0;
                }).map((cond) => {
                  const isOverdue = priorStages.includes(cond.required_stage) && !["approved", "waived", "not_applicable"].includes(cond.status);
                  return (
                  <ConditionRow
                    key={cond.id}
                    condition={cond}
                    condDocs={docsByCondition.get(cond.id) ?? []}
                    isRowExpanded={expandedRows.has(cond.id)}
                    isLinking={linkingConditionId === cond.id}
                    isOverdue={isOverdue}
                    noteCount={noteCounts[cond.id] ?? 0}
                    dealId={dealId}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    onToggleRow={() => toggleRow(cond.id)}
                    onSetLinkingCondition={(id) => setLinkingConditionId(id)}
                    onStatusChange={handleStatusChange}
                    onUploadToCondition={uploadToCondition}
                    onLinkDoc={linkDoc}
                    onUnlinkDoc={onUnlinkDoc ?? (() => {})}
                    getAvailableDocsForLinking={getAvailableDocsForLinking}
                    onPreviewDoc={onPreviewDoc}
                    onApprovalChange={onApprovalChange}
                    onRequestRevision={handleRequestRevision}
                  />
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
