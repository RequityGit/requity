"use client";

import { useState, useTransition, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronRight,
  Upload,
  MessageSquare,
  Lock,
  Globe,
  FileText,
  Send,
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { type DealCondition } from "@/components/pipeline/pipeline-types";
import { updateConditionStatusAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import {
  createDealDocumentUploadUrl,
  saveDealDocumentRecord,
  getDocumentSignedUrl,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { createClient } from "@/lib/supabase/client";
import { parseComment, relativeTime } from "@/lib/comment-utils";
import { MentionInput } from "@/components/shared/mention-input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { NoteData } from "@/components/shared/UnifiedNotes/types";

// ─── Types ───

export interface ConditionDocument {
  id: string;
  document_name: string;
  file_url: string;
  storage_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_at: string;
  condition_id?: string | null;
}

interface ConditionsTabProps {
  conditions: DealCondition[];
  dealId: string;
  /** All deal documents; rows filter by condition_id */
  documents?: ConditionDocument[];
}

// ─── Category / phase mapping (required_stage in DB: ptf, ptc, ptd, post_closing) ───

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
  post_closing: ["post_closing_items", "note_sell_process", "post_loan_payoff"],
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

// Filter tabs: All | Processing (ptf+ptc+ptd) | Post Closing
const PHASE_FILTERS = [
  { key: "all", label: "All" },
  { key: "processing", label: "Processing" },
  { key: "post_closing", label: "Post Closing" },
] as const;

// Status config: map DB status to display (under_review → In Review)
const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; pillClass: string }
> = {
  pending: {
    label: "Pending",
    color: "pending",
    pillClass: "bg-warning/10 text-warning",
  },
  submitted: {
    label: "Submitted",
    color: "submitted",
    pillClass: "bg-info/10 text-info",
  },
  under_review: {
    label: "In Review",
    color: "under_review",
    pillClass: "bg-info/10 text-info",
  },
  in_review: {
    label: "In Review",
    color: "in_review",
    pillClass: "bg-info/10 text-info",
  },
  approved: {
    label: "Cleared",
    color: "approved",
    pillClass: "bg-success/10 text-success",
  },
  waived: {
    label: "Waived",
    color: "waived",
    pillClass: "bg-muted text-muted-foreground",
  },
  not_applicable: {
    label: "N/A",
    color: "not_applicable",
    pillClass: "bg-muted text-muted-foreground",
  },
  rejected: {
    label: "Rejected",
    color: "rejected",
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

function formatDate(d: string | null | undefined): string {
  if (!d) return "\u2014";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExt(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

function getExtBadgeClass(ext: string): string {
  if (["pdf"].includes(ext)) return "bg-destructive text-destructive-foreground";
  if (["doc", "docx"].includes(ext)) return "bg-blue-600 text-white";
  if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext)) return "bg-success text-success-foreground";
  if (["xls", "xlsx"].includes(ext)) return "bg-success text-success-foreground";
  return "bg-muted-foreground text-background";
}

// ─── Status icon for compact row ───
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
        className="h-5 w-5 shrink-0 text-green-600 dark:text-green-500"
        strokeWidth={1.5}
      />
    );
  }
  if (inReview) {
    return (
      <Loader2
        className="h-5 w-5 shrink-0 animate-spin text-blue-600 dark:text-blue-500"
        strokeWidth={1.5}
      />
    );
  }
  if (pending && hasDocuments) {
    return (
      <div
        className="h-5 w-5 shrink-0 rounded-full border-2 border-yellow-600 dark:border-yellow-500"
        aria-hidden
      />
    );
  }
  if (pending && !hasDocuments) {
    return (
      <div
        className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/30"
        aria-hidden
      />
    );
  }
  return (
    <div
      className="h-5 w-5 shrink-0 rounded-full border-2 border-muted-foreground/50"
      aria-hidden
    />
  );
}

// ─── File thumbnail (desktop/Finder style) ───
function FileThumbnail({
  doc,
  onPreview,
}: {
  doc: ConditionDocument;
  onPreview: () => void;
}) {
  const ext = getFileExt(doc.document_name);
  const badgeClass = getExtBadgeClass(ext);

  return (
    <button
      type="button"
      onClick={onPreview}
      className="flex shrink-0 flex-col items-center gap-0.5 rounded-md border border-border bg-muted transition-colors hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      style={{ width: 40, minHeight: 48 }}
    >
      <div className="relative mt-1 flex h-9 w-8 flex-col items-center justify-center rounded border border-border bg-background/50">
        {/* Lines */}
        <div className="absolute left-1.5 top-1.5 h-0.5 w-3 rounded bg-border" />
        <div className="absolute left-1.5 top-2.5 h-0.5 w-2.5 rounded bg-border" />
        <div className="absolute left-1.5 top-3.5 h-0.5 w-3 rounded bg-border" />
        {/* Fold */}
        <div
          className="absolute right-0 top-0 h-0 w-0 border-b-[8px] border-l-[8px] border-b-transparent border-l-card"
          aria-hidden
        />
        {/* Extension badge */}
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-tl px-0.5 text-[8px] font-medium",
            badgeClass
          )}
        >
          {ext.slice(0, 3)}
        </span>
      </div>
      <span className="max-w-[44px] truncate text-[10px] text-muted-foreground px-0.5">
        {doc.document_name}
      </span>
    </button>
  );
}

// ─── Document preview modal ───
function DocPreviewModal({
  doc,
  open,
  onOpenChange,
  getSignedUrl,
}: {
  doc: ConditionDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  getSignedUrl: (storagePath: string | null) => Promise<string | null>;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !doc) {
      setPreviewUrl(null);
      return;
    }
    setLoading(true);
    getSignedUrl(doc.storage_path)
      .then((url) => {
        setPreviewUrl(url || doc.file_url);
      })
      .finally(() => setLoading(false));
  }, [open, doc, getSignedUrl]);

  if (!doc) return null;

  const ext = getFileExt(doc.document_name);
  const isPdf = ext === "pdf";
  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(ext);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex flex-col gap-1.5 p-2 !left-[1%] !top-[1%] !h-[98vh] !max-h-[98vh] !w-[98vw] !max-w-[98vw] !translate-x-0 !translate-y-0 md:!left-[1%] md:!top-[1%] md:!translate-x-0 md:!translate-y-0"
      >
        <DialogHeader className="shrink-0 py-0.5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.5} />
            <DialogTitle className="truncate text-base">{doc.document_name}</DialogTitle>
          </div>
        </DialogHeader>
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
                  className="min-h-[calc(98vh-4rem)] h-full w-full min-w-full rounded border-0"
                />
              )}
              {isImage && (
                <img
                  src={previewUrl}
                  alt={doc.document_name}
                  className="max-h-[calc(98vh-4rem)] w-full min-w-full object-contain"
                />
              )}
              {!isPdf && !isImage && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <FileText className="h-12 w-12" strokeWidth={1.5} />
                  <p>Preview not available for this file type.</p>
                  <p className="text-xs">Use Download to open the file.</p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Condition note thread (expanded) + compose ───
function ConditionNoteThread({
  conditionId,
  dealId,
  noteCount,
  currentUserId,
  currentUserName,
  onNotePosted,
}: {
  conditionId: string;
  dealId: string;
  noteCount: number;
  currentUserId: string;
  currentUserName: string;
  onNotePosted?: () => void;
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

    if (error) {
      setNotes([]);
    } else {
      setNotes((data as unknown as NoteData[]) ?? []);
    }
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
      setNotes((prev) => [{ ...(data as unknown as NoteData), note_likes: [] }, ...prev]);
      setText("");
      onNotePosted?.();
    }
    if (data && mentionIds.length > 0) {
      const noteId = (data as unknown as NoteData).id;
      await supabase.from("note_mentions" as never).insert(
        mentionIds.map((userId: string) => ({ note_id: noteId, mentioned_user_id: userId })) as never
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
        <span
          key={i}
          className="font-semibold text-foreground rounded bg-info/10 px-0.5"
        >
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
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-8 text-center">
          <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">No notes on this condition yet</p>
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

// ─── Single condition row (compact + expandable note thread) ───
function ConditionRow({
  condition,
  dealId,
  documents,
  noteCount,
  isExpanded,
  onToggleExpand,
  onPreviewDoc,
  getSignedUrl,
  onDocumentUpload,
}: {
  condition: DealCondition;
  dealId: string;
  documents: ConditionDocument[];
  noteCount: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onPreviewDoc: (doc: ConditionDocument) => void;
  getSignedUrl: (storagePath: string | null) => Promise<string | null>;
  onDocumentUpload: (file: File) => Promise<void>;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [uploading, setUploading] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState(condition.status);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");

  useEffect(() => {
    setOptimisticStatus(condition.status);
  }, [condition.status]);

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

  const statusCfg = STATUS_CONFIG[optimisticStatus] ?? STATUS_CONFIG.pending;
  const cleared =
    optimisticStatus === "approved" ||
    optimisticStatus === "waived" ||
    optimisticStatus === "not_applicable";
  const displayDocs = documents.slice(0, 4);
  const overflowCount = documents.length > 4 ? documents.length - 4 : 0;

  function handleStatusChange(newStatus: string) {
    setOptimisticStatus(newStatus);
    startTransition(async () => {
      const result = await updateConditionStatusAction(condition.id, newStatus, dealId);
      if (result.error) {
        setOptimisticStatus(condition.status);
        toast.error(`Failed to update: ${result.error}`);
      } else {
        toast.success("Condition updated");
        router.refresh();
      }
    });
  }

  return (
    <div className="border-b border-border last:border-b-0">
      {/* Compact row */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="flex flex-wrap items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors"
      >
        <StatusIcon
          status={optimisticStatus}
          hasDocuments={documents.length > 0}
        />
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <span
            className={cn(
              "text-sm font-medium text-foreground",
              cleared && "text-muted-foreground line-through"
            )}
          >
            {condition.condition_name}
          </span>
          {condition.critical_path_item && (
            <span className="shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              Critical
            </span>
          )}
        </div>

        {/* File thumbnails */}
        <div className="flex items-end gap-1 shrink-0">
          {displayDocs.length === 0 ? (
            <label className="flex cursor-pointer flex-col items-center gap-0.5 rounded-md border border-dashed border-border bg-muted/50 py-2 px-2 min-w-[40px] hover:bg-muted transition-colors">
              <input
                type="file"
                className="hidden"
                disabled={uploading}
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setUploading(true);
                  try {
                    await onDocumentUpload(file);
                  } finally {
                    setUploading(false);
                    e.target.value = "";
                  }
                }}
              />
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" strokeWidth={1.5} />
              ) : (
                <Upload className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              )}
              <span className="text-[10px] text-muted-foreground">{uploading ? "Uploading..." : "Upload"}</span>
            </label>
          ) : (
            <>
              {displayDocs.map((d) => (
                <FileThumbnail
                  key={d.id}
                  doc={d}
                  onPreview={() => onPreviewDoc(d)}
                />
              ))}
              {overflowCount > 0 && (
                <div
                  className="flex h-[48px] w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-xs font-medium text-muted-foreground"
                  aria-label={`${overflowCount} more`}
                >
                  +{overflowCount}
                </div>
              )}
            </>
          )}
        </div>

        {noteCount > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted/80"
          >
            <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
            <span className="num">{noteCount}</span>
          </button>
        )}

        <Badge className={cn("shrink-0 text-[10px] border-0", statusCfg.pillClass)}>
          {statusCfg.label}
        </Badge>

        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
          <Select
            value={optimisticStatus}
            onValueChange={handleStatusChange}
            disabled={isPending}
          >
            <SelectTrigger className="h-7 w-[120px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {STATUS_CONFIG[s]?.label ?? s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150",
            isExpanded && "rotate-180"
          )}
          strokeWidth={1.5}
        />
      </div>

      {/* Expanded note thread */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/50 pl-4 pr-4 pb-4 pt-3">
          <div className="pl-6">
            <ConditionNoteThread
              conditionId={condition.id}
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

// ─── Main ConditionsTab ───

export function ConditionsTab({
  conditions,
  dealId,
  documents = [],
}: ConditionsTabProps) {
  const router = useRouter();
  const [phaseFilter, setPhaseFilter] = useState<"all" | "processing" | "post_closing">("all");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [previewDoc, setPreviewDoc] = useState<ConditionDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const filtered = conditions.filter((c) => {
    const group = getCategoryGroup(c.category);
    if (phaseFilter === "processing" && group === "post_closing") return false;
    if (phaseFilter === "post_closing" && group !== "post_closing") return false;
    if (criticalOnly && !c.critical_path_item) return false;
    return true;
  });

  const cleared = conditions.filter((c) =>
    ["approved", "waived", "not_applicable"].includes(c.status)
  ).length;
  const total = conditions.length;
  const pct = total > 0 ? Math.round((cleared / total) * 100) : 0;
  const pendingCount = conditions.filter((c) => c.status === "pending").length;
  const submittedCount = conditions.filter((c) =>
    ["submitted", "under_review", "in_review"].includes(c.status)
  ).length;

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
            counts[row.unified_condition_id] = (counts[row.unified_condition_id] ?? 0) + 1;
          }
        }
        setNoteCounts(counts);
      });
  }, [conditions]);

  const byCategory = new Map<string, DealCondition[]>();
  for (const c of filtered) {
    const cat = c.category;
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(c);
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

  const getSignedUrl = useCallback(async (storagePath: string | null) => {
    if (!storagePath) return null;
    const result = await getDocumentSignedUrl(storagePath);
    return result.url;
  }, []);

  const docsByCondition = new Map<string, ConditionDocument[]>();
  for (const d of documents) {
    const condId = "condition_id" in d ? (d as ConditionDocument).condition_id : null;
    if (condId) {
      const list = docsByCondition.get(condId) ?? [];
      list.push(d as ConditionDocument);
      docsByCondition.set(condId, list);
    }
  }
  const conditionDocuments = (cid: string) =>
    (docsByCondition.get(cid) ?? []).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const allExpanded = expandedCategories.size === 0;

  // Flat list of condition ids in display order (for J/K navigation)
  const visibleConditionIds = Array.from(byCategory.entries()).flatMap(([, items]) =>
    items.map((c) => c.id)
  );

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setExpandedRows(new Set());
        return;
      }
      if (e.key === "j" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const currentExpanded = Array.from(expandedRows)[0];
        const idx = currentExpanded ? visibleConditionIds.indexOf(currentExpanded) : -1;
        const nextIdx = idx < visibleConditionIds.length - 1 ? idx + 1 : 0;
        if (visibleConditionIds[nextIdx]) {
          setExpandedRows(new Set([visibleConditionIds[nextIdx]]));
        }
        return;
      }
      if (e.key === "k" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        const currentExpanded = Array.from(expandedRows)[0];
        const idx = currentExpanded ? visibleConditionIds.indexOf(currentExpanded) : 0;
        const prevIdx = idx > 0 ? idx - 1 : visibleConditionIds.length - 1;
        if (visibleConditionIds[prevIdx]) {
          setExpandedRows(new Set([visibleConditionIds[prevIdx]]));
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [expandedRows, visibleConditionIds]);

  return (
    <div className="flex flex-col gap-4" role="region" aria-label="Conditions">
      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-card px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-foreground num">
            {cleared} of {total} cleared
          </span>
          <span
            className={cn(
              "text-xl font-bold num",
              pct > 0 ? "text-green-600 dark:text-green-500" : "text-muted-foreground"
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
              "rounded-lg border px-3.5 py-1.5 text-xs font-medium transition-colors",
              phaseFilter === key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setCriticalOnly(!criticalOnly)}
          className="ml-2 flex items-center gap-1.5 border-0 bg-transparent p-0"
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
              criticalOnly ? "border-primary bg-primary" : "border-border"
            )}
          >
            {criticalOnly && <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />}
          </div>
          <span className="text-xs text-muted-foreground">Critical Path</span>
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border border-border bg-card px-5 py-8 text-center text-sm text-muted-foreground">
          No conditions match the current filter.
        </div>
      )}

      {Array.from(byCategory.entries()).map(([category, items]) => {
        const catLabel = CATEGORY_LABELS[category] ?? category.replace(/_/g, " ");
        const catCleared = items.filter((c) =>
          ["approved", "waived", "not_applicable"].includes(c.status)
        ).length;
        const isExpanded = allExpanded || expandedCategories.has(category);

        return (
          <div key={category} className="overflow-hidden rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => toggleCategory(category)}
              className="flex w-full items-center justify-between border-b border-border bg-muted/50 px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="text-xs font-semibold text-foreground">{catLabel}</span>
              </div>
              <span className="text-[11px] text-muted-foreground tabular-nums num">
                {catCleared}/{items.length}
              </span>
            </button>

            {isExpanded && (
              <div className="divide-y divide-border">
                {items.map((c) => (
                  <ConditionRow
                    key={c.id}
                    condition={c}
                    dealId={dealId}
                    documents={conditionDocuments(c.id)}
                    noteCount={noteCounts[c.id] ?? 0}
                    isExpanded={expandedRows.has(c.id)}
                    onToggleExpand={() => toggleRow(c.id)}
                    onPreviewDoc={(doc) => {
                      setPreviewDoc(doc);
                      setPreviewOpen(true);
                    }}
                    getSignedUrl={getSignedUrl}
                    onDocumentUpload={async (file) => {
                      const urlResult = await createDealDocumentUploadUrl(dealId, file.name, c.id);
                      if (urlResult.error || !urlResult.signedUrl || !urlResult.storagePath || !urlResult.token) {
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
                        conditionId: c.id,
                      });
                      if (saveResult.error) {
                        toast.error(saveResult.error);
                        return;
                      }
                      toast.success(`${file.name} uploaded`);
                      router.refresh();
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}

      <DocPreviewModal
        doc={previewDoc}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        getSignedUrl={getSignedUrl}
      />
    </div>
  );
}
