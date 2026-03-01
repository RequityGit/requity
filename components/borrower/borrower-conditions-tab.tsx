"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/shared/status-badge";
import { FileUpload } from "@/components/shared/file-upload";
import { DocumentDownload } from "@/components/borrower/document-download";
import { formatDate } from "@/lib/format";
import { useToast } from "@/components/ui/use-toast";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  MessageCircle,
  Paperclip,
  Send,
  FileText,
  Upload,
} from "lucide-react";
import { CommentRenderer } from "@/components/shared/comment-renderer";
import {
  uploadConditionDocument,
  addConditionComment,
} from "@/app/(authenticated)/borrower/loans/[id]/actions";
import type { LoanCondition, LoanDocument } from "@/lib/supabase/types";

// Local type — includes new mention/edit fields
interface ConditionComment {
  id: string;
  condition_id: string;
  loan_id: string;
  author_id: string | null;
  author_name: string | null;
  comment: string;
  mentions: string[] | null;
  is_internal: boolean;
  is_edited: boolean;
  edited_at: string | null;
  parent_comment_id: string | null;
  created_at: string;
}

interface BorrowerConditionsTabProps {
  conditions: LoanCondition[];
  loanId: string;
  currentUserId: string;
}

const COMPLETE_STATUSES = ["approved", "waived", "not_applicable"];
const ACTIVE_STATUSES = [
  "not_requested",
  "requested",
  "received",
  "under_review",
  "rejected",
  "pending",
  "submitted",
];

export function BorrowerConditionsTab({
  conditions,
  loanId,
  currentUserId,
}: BorrowerConditionsTabProps) {
  // Show all conditions (not just borrower-assigned) so borrowers can track overall progress
  const outstanding = conditions.filter(
    (c) => !COMPLETE_STATUSES.includes(c.status)
  );
  const complete = conditions.filter((c) =>
    COMPLETE_STATUSES.includes(c.status)
  );

  if (conditions.length === 0) {
    return (
      <div className="py-10 text-center text-muted-foreground">
        <ClipboardList className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm font-medium">No conditions yet</p>
        <p className="text-xs mt-1">
          Conditions will appear here once your loan processor sets them up.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-[#1a2b4a]">
            {conditions.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Total</p>
        </div>
        <div className="bg-white rounded-lg border px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-amber-600">
            {outstanding.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Outstanding</p>
        </div>
        <div className="bg-white rounded-lg border px-4 py-3 text-center">
          <p className="text-2xl font-semibold text-green-600">
            {complete.length}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Complete</p>
        </div>
      </div>

      {/* Outstanding conditions */}
      {outstanding.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-[#1a2b4a]">
            Outstanding ({outstanding.length})
          </h3>
          {outstanding.map((c) => (
            <BorrowerConditionCard
              key={c.id}
              condition={c}
              loanId={loanId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Completed conditions */}
      {complete.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-green-700">
            Complete ({complete.length})
          </h3>
          {complete.map((c) => (
            <BorrowerConditionCard
              key={c.id}
              condition={c}
              loanId={loanId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Individual borrower-facing condition card
// ---------------------------------------------------------------------------
function BorrowerConditionCard({
  condition,
  loanId,
  currentUserId,
}: {
  condition: LoanCondition;
  loanId: string;
  currentUserId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [comments, setComments] = useState<ConditionComment[]>([]);
  const [documents, setDocuments] = useState<LoanDocument[]>([]);

  const [commentText, setCommentText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(false);

  const { toast } = useToast();

  const isComplete = COMPLETE_STATUSES.includes(condition.status);
  const isOverdue =
    !isComplete &&
    condition.due_date &&
    new Date(condition.due_date) < new Date();

  async function loadData() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const [commentsRes, docsRes] = await Promise.all([
      (supabase as any)
        .from("loan_condition_comments")
        .select("*")
        .eq("condition_id", condition.id)
        .eq("is_internal", false)
        .order("created_at", { ascending: true }),
      supabase
        .from("loan_documents")
        .select("*")
        .eq("condition_id", condition.id)
        .order("created_at", { ascending: false }),
    ]);
    setComments((commentsRes.data as ConditionComment[]) ?? []);
    setDocuments(docsRes.data ?? []);
    setDataLoaded(true);
  }

  async function handleToggle() {
    if (!expanded && !dataLoaded) {
      await loadData();
    }
    setExpanded((prev) => !prev);
  }

  async function handleSubmitComment() {
    if (!commentText.trim()) return;
    setLoading(true);
    try {
      const result = await addConditionComment(
        condition.id,
        loanId,
        commentText.trim()
      );
      if (result.error) {
        toast({
          title: "Error posting comment",
          description: result.error,
          variant: "destructive",
        });
      } else {
        setComments((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            condition_id: condition.id,
            loan_id: loanId,
            author_id: currentUserId,
            author_name: "You",
            comment: commentText.trim(),
            mentions: [],
            is_internal: false,
            is_edited: false,
            edited_at: null,
            parent_comment_id: null,
            created_at: new Date().toISOString(),
          },
        ]);
        setCommentText("");
        toast({ title: "Message sent" });
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUploadDocument() {
    if (!selectedFile) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("conditionId", condition.id);
      formData.append("loanId", loanId);

      const result = await uploadConditionDocument(formData);
      if (result.error) {
        toast({
          title: "Upload failed",
          description: result.error,
          variant: "destructive",
        });
      } else {
        await loadData();
        setSelectedFile(null);
        setShowUpload(false);
        toast({ title: "Document uploaded successfully" });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border overflow-hidden">
      {/* Card header row */}
      <button
        onClick={handleToggle}
        className={`w-full flex items-start gap-3 p-4 text-left transition-colors ${
          isComplete
            ? "bg-green-50/50 hover:bg-green-50"
            : isOverdue
              ? "bg-red-50/50 hover:bg-red-50"
              : "bg-white hover:bg-slate-50"
        }`}
      >
        <div className="mt-0.5 flex-shrink-0">
          {isComplete ? (
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          ) : isOverdue ? (
            <AlertTriangle className="h-5 w-5 text-red-500" />
          ) : (
            <Clock className="h-5 w-5 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-[#1a2b4a]">
              {condition.condition_name}
            </span>
            {condition.critical_path_item && (
              <Badge className="bg-red-100 text-red-700 border-red-200 text-[10px] px-1.5 py-0">
                Required
              </Badge>
            )}
            <StatusBadge status={condition.status} />
          </div>

          {condition.borrower_description && (
            <p className="text-xs text-muted-foreground mt-1">
              {condition.borrower_description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
            {condition.due_date && (
              <span className={isOverdue ? "text-red-600 font-medium" : ""}>
                Due: {formatDate(condition.due_date)}
              </span>
            )}
            {condition.received_date && (
              <span>Received: {formatDate(condition.received_date)}</span>
            )}
            {condition.approved_date && (
              <span className="text-green-700">
                Approved: {formatDate(condition.approved_date)}
              </span>
            )}
          </div>

          {condition.rejection_reason && (
            <p className="text-xs text-red-600 mt-1.5 font-medium">
              Action needed: {condition.rejection_reason}
            </p>
          )}

          {/* Activity summary hint */}
          {dataLoaded && (
            <p className="text-[11px] text-muted-foreground mt-1.5">
              {comments.length} message{comments.length !== 1 ? "s" : ""} ·{" "}
              {documents.length} file{documents.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="flex-shrink-0 ml-2">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded panel */}
      {expanded && (
        <div className="border-t bg-slate-50/60 p-4 space-y-5">
          {/* Documents */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-[#1a2b4a] flex items-center gap-1.5">
                <Paperclip className="h-3.5 w-3.5" />
                Uploaded Documents ({documents.length})
              </h4>
              {!isComplete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setShowUpload((prev) => !prev)}
                >
                  <Upload className="h-3 w-3" />
                  Upload File
                </Button>
              )}
            </div>

            {showUpload && !isComplete && (
              <div className="space-y-2 rounded-lg border bg-white p-3">
                <FileUpload
                  onFileSelect={(file) => setSelectedFile(file)}
                  maxSize={25}
                />
                {selectedFile && (
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedFile(null);
                        setShowUpload(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={handleUploadDocument}
                      disabled={loading}
                    >
                      {loading ? "Uploading..." : "Submit Document"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {documents.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No files uploaded yet.
                {!isComplete && " Use the Upload button to attach documents."}
              </p>
            ) : (
              <div className="space-y-1.5">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-2 text-xs bg-white rounded border px-3 py-2"
                  >
                    <FileText className="h-3.5 w-3.5 text-blue-500 flex-shrink-0" />
                    <span className="flex-1 truncate">{doc.document_name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">
                      {formatDate(doc.created_at)}
                    </span>
                    <DocumentDownload
                      filePath={doc.file_url}
                      fileName={doc.document_name}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="border-t" />

          {/* Messages / Comments */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-[#1a2b4a] flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5" />
              Messages ({comments.length})
            </h4>

            {comments.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                No messages yet. Use the box below to ask a question or provide
                information.
              </p>
            ) : (
              <div className="space-y-2">
                {comments.map((c) => (
                  <CommentRenderer
                    key={c.id}
                    comment={c.comment}
                    authorName={c.author_name}
                    isInternal={false}
                    isEdited={c.is_edited}
                    createdAt={c.created_at}
                    isOwnComment={c.author_id === currentUserId}
                  />
                ))}
              </div>
            )}

            {/* Comment input */}
            <div className="space-y-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ask a question or add a note for your loan team..."
                rows={3}
                className="text-sm resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    handleSubmitComment();
                  }
                }}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={handleSubmitComment}
                  disabled={loading || !commentText.trim()}
                >
                  <Send className="h-3.5 w-3.5" />
                  {loading ? "Sending..." : "Send Message"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
