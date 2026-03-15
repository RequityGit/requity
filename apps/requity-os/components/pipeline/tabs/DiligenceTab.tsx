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
  Pencil,
  AlertTriangle,
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
  archived_at?: string | null;
}

interface DiligenceTabProps {
  documents: DealDocument[];
  conditions: DealCondition[];
  dealId: string;
  googleDriveFolderUrl?: string | null;
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
    label: "Rejected",
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

// ─── Document Preview Modal ───

function DocPreviewModal({
  doc,
  open,
  onOpenChange,
}: {
  doc: DealDocument | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex flex-col gap-1.5 p-2 !left-[1%] !top-[1%] !h-[98vh] !max-h-[98vh] !w-[98vw] !max-w-[98vw] !translate-x-0 !translate-y-0 md:!left-[1%] md:!top-[1%] md:!translate-x-0 md:!translate-y-0">
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

// ─── Pinned Note Editor ───

function PinnedNoteEditor({
  conditionId,
  currentNote,
  onSave,
  onClose,
}: {
  conditionId: string;
  currentNote: string | null;
  onSave: (condId: string, note: string | null) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(currentNote ?? "");

  return (
    <div className="mt-2 ml-8 p-2.5 rounded-lg bg-warning/5 border border-warning/15 max-w-lg">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Pencil className="h-3 w-3 text-warning" strokeWidth={1.5} />
        <span className="text-[10px] font-semibold uppercase tracking-wider text-warning">
          Pinned Note
        </span>
      </div>
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Add a note for this condition..."
        autoFocus
        rows={2}
        className="text-xs resize-none"
      />
      <div className="flex items-center justify-between mt-1.5">
        <div>
          {currentNote && (
            <button
              type="button"
              onClick={() => {
                onSave(conditionId, null);
                onClose();
              }}
              className="text-[10px] px-1.5 py-0.5 rounded text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
            >
              Clear note
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] border-warning/20 text-warning hover:bg-warning/10"
            onClick={() => {
              onSave(conditionId, text.trim() || null);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ─── DOCUMENTS SECTION ───
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DocumentsSection({
  documents,
  conditions,
  dealId,
  googleDriveFolderUrl,
  onPreviewDoc,
}: {
  documents: DealDocument[];
  conditions: DealCondition[];
  dealId: string;
  googleDriveFolderUrl?: string | null;
  onPreviewDoc: (doc: DealDocument) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, startUpload] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [togglingVisId, setTogglingVisId] = useState<string | null>(null);
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
            if (saveResult.documentId) {
              triggerDocumentAnalysis(saveResult.documentId, dealId).then(
                (result) => {
                  if (result.error) {
                    toast.error(`AI review failed for ${file.name}: ${result.error}`);
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

                      {/* AI review badge */}
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
  isEditingNote,
  noteCount,
  dealId,
  currentUserId,
  currentUserName,
  onToggleRow,
  onSetEditingNote,
  onSetLinkingCondition,
  onSavePinnedNote,
  onStatusChange,
  onUploadToCondition,
  onLinkDoc,
  onUnlinkDoc,
  getAvailableDocsForLinking,
}: {
  condition: DealCondition;
  condDocs: DealDocument[];
  isRowExpanded: boolean;
  isLinking: boolean;
  isEditingNote: boolean;
  noteCount: number;
  dealId: string;
  currentUserId: string;
  currentUserName: string;
  onToggleRow: () => void;
  onSetEditingNote: (id: string | null) => void;
  onSetLinkingCondition: (id: string | null) => void;
  onSavePinnedNote: (condId: string, note: string | null) => void;
  onStatusChange: (condId: string, currentStatus: string, newStatus: string) => void;
  onUploadToCondition: (condId: string, file: File) => Promise<void>;
  onLinkDoc: (condId: string, docId: string) => void;
  onUnlinkDoc: (docId: string) => void;
  getAvailableDocsForLinking: (condId: string) => DealDocument[];
}) {
  const [uploading, setUploading] = useState(false);
  const [optimisticStatus, setOptimisticStatus] = useState(cond.status);

  // Sync optimistic status when server data changes
  useEffect(() => {
    setOptimisticStatus(cond.status);
  }, [cond.status]);

  const isClearedStatus = ["approved", "waived", "not_applicable"].includes(cond.status);

  return (
    <div className="border-b border-border last:border-b-0">
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
          {cond.critical_path_item && (
            <span className="shrink-0 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-destructive">
              Critical
            </span>
          )}
          {/* Pinned note badge */}
          {cond.internal_description && !isEditingNote && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetEditingNote(cond.id);
              }}
              className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-warning/10 text-warning border border-warning/15 hover:bg-warning/20 transition-colors cursor-pointer"
              title="View/edit pinned note"
            >
              <Pencil className="h-2 w-2" strokeWidth={2} />
              Note
            </button>
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
          {/* Note */}
          <button
            type="button"
            onClick={() => onSetEditingNote(isEditingNote ? null : cond.id)}
            className={cn(
              "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium transition-colors cursor-pointer",
              isEditingNote
                ? "bg-warning/10 text-warning"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
            title="Pinned note"
          >
            <Pencil className="h-3 w-3" strokeWidth={1.5} />
            Note
          </button>
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
            <SelectTrigger className="h-7 w-[110px] text-xs">
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

      {/* Pinned note preview */}
      {cond.internal_description && !isEditingNote && !isRowExpanded && (
        <div
          onClick={() => onSetEditingNote(cond.id)}
          className="mx-4 mb-2 ml-12 px-2.5 py-1.5 rounded bg-warning/5 border border-warning/10 cursor-pointer hover:bg-warning/8 transition-colors max-w-lg"
        >
          <div className="flex items-start gap-1.5">
            <Pencil className="h-3 w-3 shrink-0 mt-0.5 text-warning/50" strokeWidth={1.5} />
            <span className="text-[11px] text-warning/60 leading-relaxed flex-1 line-clamp-2">
              {cond.internal_description}
            </span>
          </div>
        </div>
      )}

      {/* Pinned note editor */}
      {isEditingNote && (
        <div className="px-4 pb-2">
          <PinnedNoteEditor
            conditionId={cond.id}
            currentNote={cond.internal_description ?? null}
            onSave={onSavePinnedNote}
            onClose={() => onSetEditingNote(null)}
          />
        </div>
      )}

      {/* Linked document chips */}
      {condDocs.length > 0 && !isRowExpanded && (
        <div className="flex items-center gap-1.5 mx-4 mb-2 ml-12 flex-wrap">
          {condDocs.map((doc) => (
            <span
              key={doc.id}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border flex items-center gap-1 hover:text-foreground hover:border-foreground/20 transition-colors group/chip"
            >
              <FileTypeBadge name={doc.document_name} small />
              <span className="max-w-[120px] truncate">
                {doc.document_name}
              </span>
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
            </span>
          ))}
        </div>
      )}

      {/* Expanded note thread */}
      {isRowExpanded && (
        <div className="border-t border-border bg-muted/50 pl-4 pr-4 pb-4 pt-3">
          <div className="pl-6">
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
}: {
  conditions: DealCondition[];
  documents: DealDocument[];
  dealId: string;
}) {
  const router = useRouter();
  const [phaseFilter, setPhaseFilter] = useState<
    "all" | "processing" | "post_closing"
  >("all");
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});
  const [linkingConditionId, setLinkingConditionId] = useState<string | null>(
    null
  );
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
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
    if (criticalOnly && !c.critical_path_item) return false;
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

  // Unlink doc from condition
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

  // Save pinned note to internal_description
  async function savePinnedNote(condId: string, note: string | null) {
    const supabase = createClient();
    const { error } = await supabase
      .from("unified_deal_conditions" as never)
      .update({ internal_description: note } as never)
      .eq("id" as never, condId as never);
    if (error) {
      toast.error(`Failed to save note: ${error.message}`);
    } else {
      toast.success(note ? "Note saved" : "Note cleared");
      router.refresh();
    }
    setEditingNoteId(null);
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
        <button
          type="button"
          onClick={() => setCriticalOnly(!criticalOnly)}
          className="ml-2 flex items-center gap-1.5 border-0 bg-transparent p-0 cursor-pointer"
        >
          <div
            className={cn(
              "flex h-4 w-4 items-center justify-center rounded border-2 transition-colors",
              criticalOnly ? "border-primary bg-primary" : "border-border"
            )}
          >
            {criticalOnly && (
              <CheckCircle2 className="h-2.5 w-2.5 text-primary-foreground" />
            )}
          </div>
          <span className="text-xs text-muted-foreground">Critical Path</span>
        </button>
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
                    isEditingNote={editingNoteId === cond.id}
                    noteCount={noteCounts[cond.id] ?? 0}
                    dealId={dealId}
                    currentUserId={currentUserId}
                    currentUserName={currentUserName}
                    onToggleRow={() => toggleRow(cond.id)}
                    onSetEditingNote={(id) => setEditingNoteId(id)}
                    onSetLinkingCondition={(id) => setLinkingConditionId(id)}
                    onSavePinnedNote={savePinnedNote}
                    onStatusChange={handleStatusChange}
                    onUploadToCondition={uploadToCondition}
                    onLinkDoc={linkDoc}
                    onUnlinkDoc={unlinkDoc}
                    getAvailableDocsForLinking={getAvailableDocsForLinking}
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
  googleDriveFolderUrl,
}: DiligenceTabProps) {
  const [previewDoc, setPreviewDoc] = useState<DealDocument | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [reviewPanelOpen, setReviewPanelOpen] = useState(false);
  const [reviewDoc, setReviewDoc] = useState<DealDocument | null>(null);

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
        googleDriveFolderUrl={googleDriveFolderUrl}
        onPreviewDoc={handlePreviewDoc}
      />

      {/* Conditions Section */}
      <ConditionsSection
        conditions={conditions}
        documents={documents}
        dealId={dealId}
      />

      {/* Preview modal */}
      <DocPreviewModal
        doc={previewDoc}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
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
