"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Loader2,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  MessageSquare,
  X,
  AlertTriangle,
  Check,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  getDocumentSignedUrl,
  triggerConditionReview,
  getConditionReview,
  type ConditionReviewData,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { EmptyState } from "@/components/shared/EmptyState";
import type { DealDocument } from "./types";
import { getFileExt, URL_REGEX } from "./utils";

function textWithLinks(content: string) {
  const parts = content.split(URL_REGEX);
  return parts.map((part, i) =>
    part.match(URL_REGEX) ? (
      <a
        key={i}
        href={part}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-90"
      >
        {part}
      </a>
    ) : (
      part
    )
  );
}

export function DocPreviewModal({
  doc,
  open,
  onOpenChange,
  onApprovalChange,
  onUnlinkDoc,
  linkedCondition,
  onRequestRevision,
}: {
  doc: DealDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprovalChange?: (docId: string, status: "approved" | "denied") => Promise<void>;
  onUnlinkDoc?: (docId: string) => void;
  linkedCondition?: {
    conditionId: string;
    conditionName: string;
    templateGuidance: string | null;
    borrowerComment: string | null;
  } | null;
  onRequestRevision?: (conditionId: string, feedback: string) => Promise<void>;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [approving, setApproving] = useState(false);
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revisionFeedback, setRevisionFeedback] = useState("");
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // AI Review state
  const [aiReview, setAiReview] = useState<ConditionReviewData | null>(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReviewError, setAiReviewError] = useState<string | null>(null);
  const [aiReviewExpanded, setAiReviewExpanded] = useState(true);

  // Reset revision form and AI review when modal closes or doc changes
  useEffect(() => {
    if (!open) {
      setShowRevisionForm(false);
      setRevisionFeedback("");
      setAiReview(null);
      setAiReviewError(null);
      setAiReviewLoading(false);
    }
  }, [open]);

  // Check for existing AI review when modal opens with a condition-linked doc
  useEffect(() => {
    if (!open || !doc || !linkedCondition?.conditionId) return;
    setAiReview(null);
    setAiReviewError(null);
    getConditionReview(doc.id, linkedCondition.conditionId).then((res) => {
      if (res.data) {
        setAiReview(res.data);
      }
    });
  }, [open, doc?.id, linkedCondition?.conditionId]);

  async function handleRunAiReview() {
    if (!doc || !linkedCondition?.conditionId) return;
    setAiReviewLoading(true);
    setAiReviewError(null);
    setAiReview(null);
    try {
      const result = await triggerConditionReview(
        doc.id,
        linkedCondition.conditionId,
        doc.deal_id
      );
      if (result.error) {
        setAiReviewError(result.error);
      } else if (result.data) {
        setAiReview(result.data);
        setAiReviewExpanded(true);
      }
    } catch (err) {
      setAiReviewError(
        err instanceof Error ? err.message : "AI review failed"
      );
    } finally {
      setAiReviewLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !doc) {
      setPreviewUrl(null);
      return;
    }
    if (!doc.storage_path) {
      setPreviewUrl(doc.file_url);
      return;
    }
    setLoading(true);
    getDocumentSignedUrl(doc.storage_path)
      .then((result) => setPreviewUrl(result.url || doc.file_url))
      .finally(() => setLoading(false));
  }, [open, doc]);

  if (!doc) return null;
  const ext = getFileExt(doc.document_name);
  const isPdf = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);
  const isLinkedToCondition = Boolean(doc.condition_id);
  const approval = doc.condition_approval_status ?? "pending";
  const showApprovalActions =
    isLinkedToCondition && (onApprovalChange || onUnlinkDoc);
  const hasGuidance = linkedCondition?.templateGuidance?.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-1.5 p-2 !left-[1%] !top-[1%] !h-[98vh] !max-h-[98vh] !w-[98vw] !max-w-[98vw] !translate-x-0 !translate-y-0 md:!left-[1%] md:!top-[1%] md:!translate-x-0 md:!translate-y-0">
        <DialogHeader className="shrink-0 py-0.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <FileText className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
              <DialogTitle className="truncate text-base">{doc.document_name}</DialogTitle>
            </div>
            {showApprovalActions && (
              <div className="flex shrink-0 items-center gap-1">
                {onApprovalChange && (
                  <>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px] font-medium",
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
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        disabled={approving}
                        onClick={async () => {
                          setApproving(true);
                          await onApprovalChange(doc.id, "approved");
                          setApproving(false);
                        }}
                      >
                        {approving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="h-3 w-3" strokeWidth={2} />
                        )}
                        Approve
                      </Button>
                    )}
                    {approval !== "denied" && onRequestRevision && doc.condition_id ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                        disabled={approving || submittingRevision}
                        onClick={() => setShowRevisionForm(!showRevisionForm)}
                      >
                        <AlertTriangle className="h-3 w-3" strokeWidth={2} />
                        Request Revision
                      </Button>
                    ) : approval !== "denied" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 gap-1 text-xs text-destructive hover:text-destructive"
                        disabled={approving}
                        onClick={async () => {
                          setApproving(true);
                          await onApprovalChange(doc.id, "denied");
                          setApproving(false);
                        }}
                      >
                        <X className="h-3 w-3" strokeWidth={2} />
                        Deny
                      </Button>
                    ) : null}
                  </>
                )}
                {linkedCondition?.conditionId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 gap-1 text-xs",
                      aiReview
                        ? "text-violet-600 border-violet-200 dark:text-violet-400 dark:border-violet-800"
                        : "text-violet-600 hover:text-violet-700 hover:border-violet-300 dark:text-violet-400"
                    )}
                    disabled={aiReviewLoading}
                    onClick={handleRunAiReview}
                  >
                    {aiReviewLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" strokeWidth={2} />
                    )}
                    {aiReview ? "Re-run AI Review" : "AI Review"}
                  </Button>
                )}
                {onUnlinkDoc && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      onUnlinkDoc(doc.id);
                      onOpenChange(false);
                    }}
                  >
                    <X className="h-3 w-3" strokeWidth={2} />
                    Unlink
                  </Button>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        {/* What to look for: internal condition guidance for review */}
        {hasGuidance && (
          <div className="shrink-0 flex items-start gap-2.5 rounded-lg border border-primary/15 bg-primary/5 px-3 py-2.5 dark:border-primary/20 dark:bg-primary/10">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-primary/50" strokeWidth={1.5} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="rq-micro-label text-primary/50 dark:text-primary/40 mb-1">
                What to look for
                {linkedCondition?.conditionName && (
                  <span className="normal-case font-medium text-primary/40 ml-1.5">
                    · {linkedCondition.conditionName}
                  </span>
                )}
              </p>
              <div className="text-xs text-foreground/85 leading-relaxed max-h-20 overflow-y-auto pr-1">
                {textWithLinks((linkedCondition?.templateGuidance ?? "").trim())}
              </div>
            </div>
          </div>
        )}

        {/* Borrower comment: note submitted with their documents */}
        {linkedCondition?.borrowerComment && (
          <div className="shrink-0 flex items-start gap-2.5 rounded-lg border border-blue-500/15 bg-blue-500/5 px-3 py-2.5 dark:border-blue-400/20 dark:bg-blue-400/10">
            <MessageSquare className="h-4 w-4 shrink-0 mt-0.5 text-blue-500/50 dark:text-blue-400/50" strokeWidth={1.5} aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="rq-micro-label text-blue-500/50 dark:text-blue-400/40 mb-1">
                Borrower Note
                {linkedCondition?.conditionName && (
                  <span className="normal-case font-medium text-blue-500/40 dark:text-blue-400/30 ml-1.5">
                    · {linkedCondition.conditionName}
                  </span>
                )}
              </p>
              <p className="text-xs text-foreground/85 leading-relaxed">{linkedCondition.borrowerComment}</p>
            </div>
          </div>
        )}

        {/* Revision feedback form (inline in modal) */}
        {showRevisionForm && onRequestRevision && doc.condition_id && (
          <div className="shrink-0 rounded-lg border border-destructive/20 bg-destructive/5 p-3">
            <p className="rq-micro-label text-destructive/50 mb-1">
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
                  if (!doc.condition_id) return;
                  setSubmittingRevision(true);
                  try {
                    await onRequestRevision(doc.condition_id, revisionFeedback.trim());
                    if (onApprovalChange) {
                      await onApprovalChange(doc.id, "denied");
                    }
                    setShowRevisionForm(false);
                    setRevisionFeedback("");
                    onOpenChange(false);
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

        {/* AI Condition Review Results */}
        {aiReviewLoading && (
          <div className="shrink-0 flex items-center gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 px-4 py-3 dark:border-violet-400/20 dark:bg-violet-400/10">
            <div className="relative">
              <Sparkles className="h-4 w-4 text-violet-500/70 dark:text-violet-400/70 animate-pulse" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-violet-600 dark:text-violet-400">Analyzing document against review criteria...</p>
              <div className="mt-1.5 h-1 w-full rounded-full bg-violet-500/10 overflow-hidden">
                <div className="h-full rounded-full bg-violet-500/40 animate-[pulse_2s_ease-in-out_infinite]" style={{ width: "60%" }} />
              </div>
            </div>
          </div>
        )}

        {aiReviewError && !aiReviewLoading && (
          <div className="shrink-0 flex items-start gap-2.5 rounded-lg border border-destructive/15 bg-destructive/5 px-3 py-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-destructive/60" strokeWidth={1.5} />
            <div className="min-w-0 flex-1">
              <p className="rq-micro-label text-destructive/50 mb-0.5">AI Review Failed</p>
              <p className="text-xs text-destructive/70">{aiReviewError}</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-destructive/60 hover:text-destructive"
              onClick={handleRunAiReview}
            >
              Retry
            </Button>
          </div>
        )}

        {aiReview && !aiReviewLoading && (
          <div className="shrink-0 rounded-lg border border-violet-500/20 bg-violet-500/5 dark:border-violet-400/20 dark:bg-violet-400/10 overflow-hidden">
            {/* Header - always visible */}
            <button
              type="button"
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-violet-500/5 transition-colors"
              onClick={() => setAiReviewExpanded(!aiReviewExpanded)}
            >
              <Sparkles className="h-4 w-4 shrink-0 text-violet-500/70 dark:text-violet-400/70" strokeWidth={1.5} />
              <div className="flex-1 min-w-0 flex items-center gap-2">
                <p className="rq-micro-label text-violet-500/60 dark:text-violet-400/50">
                  AI Review
                </p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    aiReview.recommendation === "approve" &&
                      "bg-green-500/15 text-green-600 dark:text-green-400",
                    aiReview.recommendation === "request_revision" &&
                      "bg-red-500/15 text-red-600 dark:text-red-400",
                    aiReview.recommendation === "needs_manual_review" &&
                      "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {aiReview.recommendation === "approve" && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
                  {aiReview.recommendation === "request_revision" && <X className="h-2.5 w-2.5" strokeWidth={3} />}
                  {aiReview.recommendation === "needs_manual_review" && <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2} />}
                  {aiReview.recommendation === "approve"
                    ? "Recommend Approve"
                    : aiReview.recommendation === "request_revision"
                      ? "Recommend Revision"
                      : "Manual Review Needed"}
                </span>
                {aiReview.criteria_results.length > 0 && (
                  <span className="text-[10px] text-muted-foreground/60">
                    {aiReview.criteria_results.filter((c) => c.result === "pass").length}/{aiReview.criteria_results.length} criteria passed
                  </span>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 shrink-0 text-violet-500/40 transition-transform",
                  !aiReviewExpanded && "-rotate-90"
                )}
                strokeWidth={1.5}
              />
            </button>

            {/* Expanded content */}
            {aiReviewExpanded && (
              <div className="border-t border-violet-500/10 dark:border-violet-400/10 px-3 pb-3">
                {/* Criteria results */}
                {aiReview.criteria_results.length > 0 && (
                  <div className="mt-2.5 space-y-1.5">
                    {aiReview.criteria_results.map((cr, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "flex items-start gap-2 rounded-md px-2.5 py-2 text-xs",
                          cr.result === "pass" && "bg-green-500/5",
                          cr.result === "fail" && "bg-red-500/5",
                          cr.result === "unclear" && "bg-amber-500/5"
                        )}
                      >
                        <span className="shrink-0 mt-0.5">
                          {cr.result === "pass" && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" strokeWidth={2} />
                          )}
                          {cr.result === "fail" && (
                            <X className="h-3.5 w-3.5 text-red-500 rounded-full bg-red-500/10 p-[1px]" strokeWidth={2.5} />
                          )}
                          {cr.result === "unclear" && (
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" strokeWidth={2} />
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground/80 leading-snug">{cr.criterion}</p>
                          <p className="text-muted-foreground/70 mt-0.5 leading-relaxed">{cr.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                {aiReview.summary && (
                  <div className="mt-2.5 rounded-md bg-background/50 px-2.5 py-2">
                    <p className="rq-micro-label text-muted-foreground/40 mb-0.5">Summary</p>
                    <p className="text-xs text-foreground/75 leading-relaxed">{aiReview.summary}</p>
                  </div>
                )}

                {/* Flags */}
                {aiReview.flags.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {aiReview.flags.map((flag, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-xs">
                        <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5 text-amber-500" strokeWidth={2} />
                        <span className="text-amber-700 dark:text-amber-400">{flag}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendation reasoning + actions */}
                <div className="mt-2.5 flex items-start justify-between gap-3">
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic flex-1">
                    {aiReview.recommendation_reasoning}
                  </p>
                  <div className="flex shrink-0 items-center gap-1">
                    {aiReview.recommendation === "approve" && onApprovalChange && approval !== "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 text-[10px] text-green-600 hover:text-green-700 border-green-200 hover:border-green-300 dark:text-green-400 dark:border-green-800"
                        disabled={approving}
                        onClick={async () => {
                          setApproving(true);
                          await onApprovalChange(doc.id, "approved");
                          setApproving(false);
                        }}
                      >
                        <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                        Approve
                      </Button>
                    )}
                    {aiReview.recommendation === "request_revision" && onRequestRevision && doc.condition_id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 gap-1 text-[10px] text-destructive hover:text-destructive border-destructive/20 hover:border-destructive/30"
                        onClick={() => {
                          const failedCriteria = aiReview.criteria_results
                            .filter((c) => c.result === "fail")
                            .map((c) => `${c.criterion}: ${c.detail}`)
                            .join("\n");
                          setRevisionFeedback(failedCriteria || aiReview.recommendation_reasoning);
                          setShowRevisionForm(true);
                        }}
                      >
                        <AlertTriangle className="h-2.5 w-2.5" strokeWidth={2.5} />
                        Request Revision
                      </Button>
                    )}
                  </div>
                </div>

                {/* Meta */}
                <div className="mt-2 flex items-center gap-3 text-[9px] text-muted-foreground/40">
                  <span>{(aiReview.processing_time_ms / 1000).toFixed(1)}s</span>
                  <span>{aiReview.tokens_used.toLocaleString()} tokens</span>
                  <span>{aiReview.document_type.replace(/_/g, " ")}</span>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-auto rounded border border-border bg-muted/30 p-1">
          {loading ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : previewUrl ? (
            <>
              {isPdf && (
                <iframe
                  src={previewUrl}
                  title={doc.document_name}
                  className="min-h-[calc(98vh-4rem)] h-full w-full rounded border-0"
                />
              )}
              {isImage && (
                <img
                  src={previewUrl}
                  alt={doc.document_name}
                  className="max-h-[calc(98vh-4rem)] w-full object-contain"
                />
              )}
              {!isPdf && !isImage && (
                <EmptyState
                  icon={FileText}
                  title="Preview not available for this file type"
                />
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
