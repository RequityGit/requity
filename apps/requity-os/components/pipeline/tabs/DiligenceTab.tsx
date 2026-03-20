"use client";

import React, {
  useState,
  useRef,
  useTransition,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
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
  CheckCircle2,
  MessageSquare,
  Send,
  Search,
  Archive,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type DealCondition } from "@/components/pipeline/pipeline-types";
import { updateConditionStatusAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  createDealDocumentUploadUrl,
  saveDealDocumentRecord,
  deleteDealDocumentV2,
  retriggerDocumentReview,
  triggerDocumentAnalysis,
  getDocumentSignedUrl,
  updateDocumentVisibility,
  updateConditionDocumentApproval,
  requestConditionRevision,
  triggerConditionReview,
  getConditionReview,
  type ConditionReviewData,
  type ConditionCriterionResult,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { createClient } from "@/lib/supabase/client";
import { parseComment, relativeTime } from "@/lib/comment-utils";
import { MentionInput } from "@/components/shared/mention-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ReviewStatusBadge } from "@/components/pipeline/ReviewStatusBadge";
import { DocumentReviewPanel } from "@/components/pipeline/DocumentReviewPanel";
import { useDocumentReviewStatus } from "@/hooks/useDocumentReviewStatus";
import { GenerateDocumentDialog } from "@/components/documents/GenerateDocumentDialog";
import { SecureUploadLinkDialog } from "@/components/pipeline/SecureUploadLinkDialog";
import type { NoteData } from "@/components/shared/UnifiedNotes/types";

// ─── Types ───

export interface DealDocument {
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
  condition_id?: string | null;
  condition_approval_status?: string | null;
  archived_at?: string | null;
}

interface DiligenceTabProps {
  documents: DealDocument[];
  conditions: DealCondition[];
  dealId: string;
  dealName?: string;
  googleDriveFolderUrl?: string | null;
  currentUserId?: string;
  currentUserName?: string;
}

// ─── Shared Utilities ───

function formatFileSize(bytes: number | null | undefined): string {
  if (bytes == null) return "--";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
  return bytes + " B";
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function getFileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

// ─── Condition category config ───

const CATEGORY_GROUPS: Record<string, string[]> = {
  ptf: [
    "borrower_documents",
    "non_us_citizen",
    "entity_documents",
    "deal_level_items",
    "appraisal_request",
    "insurance_request",
    "title_request",
    "title_fraud_protection",
    "fundraising",
    "prior_to_funding",
  ],
  ptc: ["closing_prep", "lender_package"],
  ptd: ["prior_to_approval"],
  post_closing: [
    "post_closing_items",
    "note_sell_process",
    "post_loan_payoff",
  ],
};

function getCategoryGroup(category: string): string {
  for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
    if (cats.includes(category)) return group;
  }
  return "ptf";
}

const CATEGORY_LABELS: Record<string, string> = {
  borrower_documents: "Borrower Documents",
  non_us_citizen: "Non-US Citizen",
  entity_documents: "Entity Documents",
  deal_level_items: "Deal Level Items",
  appraisal_request: "Appraisal",
  insurance_request: "Insurance",
  title_request: "Title",
  title_fraud_protection: "Title / Fraud Protection",
  fundraising: "Fundraising",
  prior_to_funding: "Prior to Funding",
  closing_prep: "Closing Prep",
  lender_package: "Lender Package",
  prior_to_approval: "Prior to Approval",
  post_closing_items: "Post Closing",
  note_sell_process: "Note Sell",
  post_loan_payoff: "Post Loan Payoff",
};

const PHASE_FILTERS = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "post_closing", label: "Post Closing" },
] as const;

const CONDITION_STATUS_CONFIG: Record<
  string,
  { label: string; pillClass: string }
> = {
  pending: { label: "Pending", pillClass: "bg-warning/10 text-warning" },
  submitted: { label: "Submitted", pillClass: "bg-info/10 text-info" },
  under_review: { label: "In Review", pillClass: "bg-info/10 text-info" },
  in_review: { label: "In Review", pillClass: "bg-info/10 text-info" },
  approved: { label: "Cleared", pillClass: "bg-success/10 text-success" },
  waived: { label: "Waived", pillClass: "bg-muted text-muted-foreground" },
  not_applicable: {
    label: "N/A",
    pillClass: "bg-muted text-muted-foreground",
  },
  rejected: {
    label: "Revision Requested",
    pillClass: "bg-destructive/10 text-destructive",
  },
};

const STATUS_OPTIONS = [
  "pending",
  "submitted",
  "under_review",
  "approved",
  "waived",
  "not_applicable",
  "rejected",
];

// ─── File type badge (compact) ───

function FileTypeBadge({
  name,
  small = false,
}: {
  name: string;
  small?: boolean;
}) {
  const ext = getFileExt(name);
  const cfgMap: Record<string, { color: string; label: string }> = {
    pdf: { color: "text-red-500 bg-red-500/10 border-red-500/20", label: "PDF" },
    doc: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "DOC" },
    docx: { color: "text-blue-500 bg-blue-500/10 border-blue-500/20", label: "DOC" },
    xls: { color: "text-green-500 bg-green-500/10 border-green-500/20", label: "XLS" },
    xlsx: { color: "text-green-500 bg-green-500/10 border-green-500/20", label: "XLS" },
    csv: { color: "text-green-500 bg-green-500/10 border-green-500/20", label: "CSV" },
    zip: { color: "text-violet-500 bg-violet-500/10 border-violet-500/20", label: "ZIP" },
    png: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "IMG" },
    jpg: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "IMG" },
    jpeg: { color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20", label: "IMG" },
  };
  const cfg = cfgMap[ext] ?? {
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

// ─── Helpers: render text with clickable URLs ───

const URL_REGEX = /(https?:\/\/[^\s]+)/g;
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

// ─── Document Preview Modal ───

function DocPreviewModal({
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
  /** When doc is linked to a condition, pass its details for review context */
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
      // If no review found, that's fine - user can trigger one
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/50 dark:text-primary/40 mb-1">
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-blue-500/50 dark:text-blue-400/40 mb-1">
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
            <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/50 mb-1">
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
                    // Also deny the document
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
              <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/50 mb-0.5">AI Review Failed</p>
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
                <p className="text-[10px] font-semibold uppercase tracking-wider text-violet-500/60 dark:text-violet-400/50">
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
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/40 mb-0.5">Summary</p>
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
                          // Pre-populate revision form with AI reasoning
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
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <FileText className="h-12 w-12" strokeWidth={1.5} />
                  <p>Preview not available for this file type.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Condition Note Thread ───

function ConditionNoteThread({
  conditionId,
  dealId,
  noteCount,
  currentUserId,
  currentUserName,
}: {
  conditionId: string;
  dealId: string;
  noteCount: number;
  currentUserId: string;
  currentUserName: string;
}) {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const [posting, setPosting] = useState(false);
  const supabase = createClient();

  const fetchNotes = useCallback(async () => {
    const { data, error } = await supabase
      .from("notes" as never)
      .select("*, note_likes(user_id, profiles(full_name))" as never)
      .eq("unified_condition_id" as never, conditionId as never)
      .is("deleted_at" as never, null)
      .order("created_at" as never, { ascending: false });
    if (error) setNotes([]);
    else setNotes((data as unknown as NoteData[]) ?? []);
    setLoading(false);
  }, [conditionId, supabase]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  useEffect(() => {
    const channel = supabase
      .channel(`notes-condition-${conditionId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `unified_condition_id=eq.${conditionId}`,
        },
        () => fetchNotes()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conditionId, fetchNotes, supabase]);

  async function handlePost(body: string, mentionIds: string[]) {
    if (!body.trim() || posting) return;
    setPosting(true);
    const row = {
      body,
      author_id: currentUserId,
      author_name: currentUserName,
      mentions: mentionIds,
      is_internal: isInternal,
      unified_condition_id: conditionId,
      deal_id: dealId,
    };
    const { data, error } = await supabase
      .from("notes" as never)
      .insert(row as never)
      .select()
      .single();
    if (error) {
      toast.error(`Failed to post note: ${error.message}`);
      setPosting(false);
      return;
    }
    if (data) {
      setNotes((prev) => [
        { ...(data as unknown as NoteData), note_likes: [] },
        ...prev,
      ]);
      setText("");
    }
    if (data && mentionIds.length > 0) {
      const noteId = (data as unknown as NoteData).id;
      await supabase
        .from("note_mentions" as never)
        .insert(
          mentionIds.map((userId: string) => ({
            note_id: noteId,
            mentioned_user_id: userId,
          })) as never
        );
    }
    toast.success(isInternal ? "Internal note posted" : "Note posted");
    setPosting(false);
  }

  function getInitials(name: string) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  const segmentsToNodes = (body: string) => {
    const segs = parseComment(body);
    return segs.map((s, i) =>
      s.type === "mention" ? (
        <span key={i} className="font-semibold text-foreground rounded bg-info/10 px-0.5">
          @{s.value}
        </span>
      ) : (
        <span key={i}>{s.value}</span>
      )
    );
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Condition Notes
        </span>
        <span className="text-xs text-muted-foreground num">{noteCount}</span>
      </div>
      {loading ? (
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-4 text-center">
          <MessageSquare className="mb-1.5 h-5 w-5 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground">No notes on this condition yet</p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {notes.map((note, idx) => (
            <div
              key={note.id}
              className={cn(
                "flex gap-3 px-3 py-2.5",
                idx < notes.length - 1 && "border-b border-border"
              )}
            >
              <Avatar className="h-7 w-7 shrink-0">
                <AvatarFallback className="text-[10px] font-semibold text-muted-foreground bg-muted">
                  {note.author_name ? getInitials(note.author_name) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-semibold text-foreground">
                    {note.author_name ?? "Unknown"}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {relativeTime(note.created_at)}
                  </span>
                  {note.is_internal ? (
                    <span className="inline-flex items-center gap-0.5 rounded bg-warning/10 px-1.5 py-0.5 text-[9px] font-medium text-warning">
                      <Lock className="h-2.5 w-2.5" />
                      Internal
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded bg-success/10 px-1.5 py-0.5 text-[9px] font-medium text-success">
                      <Globe className="h-2.5 w-2.5" />
                      Borrower Visible
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">
                  {segmentsToNodes(note.body)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
      {currentUserId && (
        <div className="rounded-lg border border-border bg-muted p-2">
          <div className="flex gap-2">
            <div className="flex flex-1 flex-col gap-1.5">
              <MentionInput
                value={text}
                onChange={setText}
                onSubmit={handlePost}
                placeholder="Write a note... use @ to mention"
                disabled={posting}
                submitLabel={posting ? "Posting..." : "Post"}
                submitIcon={
                  posting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" strokeWidth={1.5} />
                  )
                }
                rows={2}
                extraControls={
                  <button
                    type="button"
                    onClick={() => setIsInternal(!isInternal)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
                      isInternal
                        ? "bg-warning/10 text-warning"
                        : "bg-success/10 text-success"
                    )}
                  >
                    {isInternal ? (
                      <>
                        <Lock className="h-3 w-3" strokeWidth={2} />
                        Internal
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3" strokeWidth={2} />
                        Borrower Visible
                      </>
                    )}
                  </button>
                }
              />
            </div>
          </div>
        </div>
      )}
    </div>
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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── DOCUMENTS SECTION ───
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DocumentsSection({
  documents,
  conditions,
  dealId,
  dealName,
  googleDriveFolderUrl,
  onPreviewDoc,
  currentUserId,
  currentUserName,
}: {
  documents: DealDocument[];
  conditions: DealCondition[];
  dealId: string;
  dealName?: string;
  googleDriveFolderUrl?: string | null;
  onPreviewDoc: (doc: DealDocument) => void;
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
          const urlResult = await createDealDocumentUploadUrl(dealId, file.name);
          if (
            urlResult.error ||
            !urlResult.signedUrl ||
            !urlResult.storagePath ||
            !urlResult.token
          ) {
            toast.error(`Failed to upload ${file.name}: ${urlResult.error ?? "Could not create upload URL"}`);
            continue;
          }
          const uploadRes = await fetch(urlResult.signedUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "application/octet-stream" },
            body: file,
          });
          if (!uploadRes.ok) {
            const errorText = await uploadRes.text().catch(() => "Unknown error");
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

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) uploadFiles(files);
  }

  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
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

  async function handleArchive(docId: string, archived: boolean) {
    const supabase = createClient();
    const { error } = await supabase
      .from("unified_deal_documents" as never)
      .update({ archived_at: archived ? new Date().toISOString() : null } as never)
      .eq("id" as never, docId as never);
    if (error) {
      toast.error(`Failed to ${archived ? "archive" : "unarchive"}: ${error.message}`);
    } else {
      toast.success(archived ? "Document archived" : "Document restored");
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
      toast.success(next === "external" ? "Marked as shared" : "Marked as internal");
    }
  }

  const catLabel = (cat: string) =>
    cat === "general" ? "General" : cat.charAt(0).toUpperCase() + cat.slice(1);

  return (
    <div className="rounded-xl border bg-card">
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
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          {documents.length === 0
            ? "No documents uploaded yet."
            : "No documents match your search."}
        </div>
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
                              toast.error(result.error);
                            } else {
                              toast.success("AI review started for this document.");
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

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={() => fileInputRef.current?.click()}
        className="w-full cursor-pointer border-t border-dashed border-border/50 px-4 py-3 text-center transition-colors hover:bg-muted/50"
      >
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          {uploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Upload className="h-3.5 w-3.5" strokeWidth={1.5} />
          )}
          <span className="text-[11px] font-medium">
            {uploading ? "Uploading..." : "Drop files here or click to upload"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CONDITION ROW (extracted to avoid hooks-in-loop) ───
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ConditionRow({
  condition: cond,
  condDocs,
  isRowExpanded,
  isLinking,
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
    // Find most recent doc with a review
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
                // Open the most recent doc in preview (which has AI review button)
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
                // Expand the row and show revision form
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
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-primary/40 block mb-0.5">What to look for</span>
                  <p className="text-xs text-primary/70 leading-relaxed">{cond.template_guidance}</p>
                </div>
              </div>
            )}

            {/* Borrower comment (from their submission) */}
            {cond.borrower_comment && (
              <div className="mb-3 flex items-start gap-2 rounded-lg bg-blue-500/5 border border-blue-500/10 px-3 py-2.5">
                <MessageSquare className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500/50" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500/40 block mb-0.5">Borrower Note</span>
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
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-500/50 dark:text-violet-400/40">
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
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-destructive/40 block mb-0.5">Borrower Feedback (visible to borrower)</span>
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
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive/50 mb-1.5">
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
            <ConditionNoteThread
              conditionId={cond.id}
              dealId={dealId}
              noteCount={noteCount}
              currentUserId={currentUserId}
              currentUserName={currentUserName}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── CONDITIONS SECTION ───
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ConditionsSection({
  conditions,
  documents,
  dealId,
  onPreviewDoc,
  onApprovalChange,
  onUnlinkDoc,
}: {
  conditions: DealCondition[];
  documents: DealDocument[];
  dealId: string;
  onPreviewDoc?: (doc: DealDocument) => void;
  onApprovalChange?: (docId: string, status: "approved" | "denied") => Promise<void>;
  onUnlinkDoc?: (docId: string) => void;
}) {
  const router = useRouter();
  const [phaseFilter, setPhaseFilter] = useState<
    "all" | "processing" | "post_closing"
  >("all");
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

  // Filter conditions by phase
  const filtered = conditions.filter((c) => {
    const group = getCategoryGroup(c.category);
    if (phaseFilter === "processing" && group === "post_closing") return false;
    if (phaseFilter === "post_closing" && group !== "post_closing") return false;
    return true;
  });

  // Stats
  const cleared = conditions.filter((c) =>
    ["approved", "waived", "not_applicable"].includes(c.status)
  ).length;
  const total = conditions.length;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
  const pendingCount = conditions.filter((c) => c.status === "pending").length;
  const submittedCount = conditions.filter((c) =>
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
      toast.error(`Failed to link document: ${error.message}`);
    } else {
      toast.success("Document linked to condition");
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
      toast.error(`Failed to update: ${result.error}`);
    } else {
      toast.success("Condition updated");
      router.refresh();
    }
  }

  // Request revision on a condition (sets status to rejected with borrower feedback)
  async function handleRequestRevision(conditionId: string, feedback: string) {
    const result = await requestConditionRevision(
      conditionId,
      dealId,
      feedback,
      null // primaryContactId not available here; action logs without it
    );
    if (result.error) {
      toast.error(`Failed to request revision: ${result.error}`);
    } else {
      toast.success("Revision requested - borrower will see feedback on their upload portal");
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
      toast.error(urlResult.error ?? "Could not create upload URL");
      return;
    }
    const uploadRes = await fetch(urlResult.signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!uploadRes.ok) {
      toast.error("Upload failed");
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
      toast.error(saveResult.error);
      return;
    }
    toast.success(`${file.name} uploaded`);
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {PHASE_FILTERS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setPhaseFilter(key)}
            className={cn(
              "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer",
              phaseFilter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No conditions match the current filter.
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
                {items.map((cond) => (
                  <ConditionRow
                    key={cond.id}
                    condition={cond}
                    condDocs={docsByCondition.get(cond.id) ?? []}
                    isRowExpanded={expandedRows.has(cond.id)}
                    isLinking={linkingConditionId === cond.id}
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
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── MAIN DILIGENCE TAB ───
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function DiligenceTab({
  documents,
  conditions,
  dealId,
  dealName,
  googleDriveFolderUrl,
  currentUserId,
  currentUserName,
}: DiligenceTabProps) {
  const router = useRouter();
  const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [reviewDoc, setReviewDoc] = useState<DealDocument | null>(null);

  async function handleApprovalChange(
    docId: string,
    status: "approved" | "denied"
  ) {
    const result = await updateConditionDocumentApproval(docId, status);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        status === "approved" ? "Document approved" : "Document denied"
      );
      router.refresh();
    }
  }

  async function handleRevisionFromPreview(conditionId: string, feedback: string) {
    const result = await requestConditionRevision(conditionId, dealId, feedback, null);
    if (result.error) {
      toast.error(`Failed to request revision: ${result.error}`);
    } else {
      toast.success("Revision requested - borrower will see feedback on their upload portal");
      router.refresh();
    }
  }

  async function unlinkDoc(docId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("unified_deal_documents" as never)
      .update({ condition_id: null } as never)
      .eq("id" as never, docId as never);
    if (error) {
      toast.error(`Failed to unlink document: ${error.message}`);
    } else {
      toast.success("Document unlinked");
      router.refresh();
    }
  }

  function handlePreviewDoc(doc: DealDocument) {
    // If it has a review status that's ready, open review panel instead
    if (
      doc.review_status &&
      !["pending", "processing", "error"].includes(doc.review_status)
    ) {
      setReviewDoc(doc);
      setReviewPanelOpen(true);
    } else {
      setPreviewDoc(doc);
      setPreviewOpen(true);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Documents Section */}
      <DocumentsSection
        documents={documents}
        conditions={conditions}
        dealId={dealId}
        dealName={dealName}
        googleDriveFolderUrl={googleDriveFolderUrl}
        onPreviewDoc={handlePreviewDoc}
        currentUserId={currentUserId}
        currentUserName={currentUserName}
      />

      {/* Conditions Section */}
      <ConditionsSection
        conditions={conditions}
        documents={documents}
        dealId={dealId}
        onPreviewDoc={(doc) => {
          setPreviewDoc(doc);
          setPreviewOpen(true);
        }}
        onApprovalChange={handleApprovalChange}
        onUnlinkDoc={unlinkDoc}
      />

      {/* Preview modal */}
      <DocPreviewModal
        doc={previewDoc}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onApprovalChange={handleApprovalChange}
        onUnlinkDoc={unlinkDoc}
        onRequestRevision={handleRevisionFromPreview}
        linkedCondition={
          previewDoc?.condition_id
            ? (() => {
                const c = conditions.find((x) => x.id === previewDoc.condition_id);
                return c
                  ? {
                      conditionId: c.id,
                      conditionName: c.condition_name,
                      templateGuidance: c.template_guidance ?? null,
                      borrowerComment: c.borrower_comment ?? null,
                    }
                  : null;
              })()
            : null
        }
      />

      {/* AI Review Panel */}
      <DocumentReviewPanel
        open={reviewPanelOpen}
        onOpenChange={setReviewPanelOpen}
        documentId={reviewDoc?.id ?? null}
        documentName={reviewDoc?.document_name ?? ""}
        onApplied={() => {}}
      />
    </div>
  );
}
