"use client";

import { useState, useEffect, useTransition } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Check,
  X,
  AlertTriangle,
  FileText,
  Sparkles,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getDocumentReview,
  submitDocumentReview,
  retriggerDocumentReview,
} from "@/app/(authenticated)/admin/pipeline-v2/[id]/actions";

interface ReviewItem {
  id: string;
  field_label: string;
  target_table: string;
  target_column: string;
  target_json_path: string | null;
  current_value: string | null;
  proposed_value: string;
  confidence: number;
  extraction_source: string | null;
  status: "pending" | "approved" | "rejected" | "skipped";
}

interface DocumentReview {
  id: string;
  document_type: string;
  document_type_confidence: number;
  status: string;
  summary: string | null;
  notes_draft: string | null;
  flags: string[];
  processing_time_ms: number | null;
  tokens_used: number | null;
  error_message: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string | null;
  documentName: string;
  onApplied?: () => void;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  appraisal: "Appraisal",
  bank_statement: "Bank Statement",
  pnl_tax_return: "P&L / Tax Return",
  rent_roll: "Rent Roll",
  title_report: "Title Report",
  insurance_policy: "Insurance Policy",
  entity_document: "Entity Document",
  loan_document: "Loan Document",
  other: "General Document",
};

export function DocumentReviewPanel({
  open,
  onOpenChange,
  documentId,
  documentName,
  onApplied,
}: Props) {
  const [review, setReview] = useState<DocumentReview | null>(null);
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [notesDraft, setNotesDraft] = useState("");
  const [addNote, setAddNote] = useState(true);
  const [loading, setLoading] = useState(true);
  const [applying, startApply] = useTransition();
  const [retrying, startRetry] = useTransition();
  const [itemStatuses, setItemStatuses] = useState<
    Record<string, "approved" | "rejected" | "pending">
  >({});

  useEffect(() => {
    if (documentId && open) {
      loadReview();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, open]);

  async function loadReview() {
    if (!documentId) return;
    setLoading(true);
    try {
      const result = await getDocumentReview(documentId);
      if ("error" in result && result.error) {
        toast.error(`Failed to load review: ${result.error}`);
        return;
      }

      const rev = result.review as unknown as DocumentReview;
      const itms = (result.items ?? []) as unknown as ReviewItem[];

      setReview(rev);
      setItems(itms);
      setNotesDraft(rev?.notes_draft || "");

      const statuses: Record<string, "pending"> = {};
      itms.forEach((item) => {
        statuses[item.id] = item.status === "pending" ? "pending" : (item.status as "pending");
      });
      setItemStatuses(statuses);
    } catch (err) {
      console.error("Failed to load review:", err);
    } finally {
      setLoading(false);
    }
  }

  function toggleItem(itemId: string, action: "approved" | "rejected") {
    setItemStatuses((prev) => ({
      ...prev,
      [itemId]: prev[itemId] === action ? "pending" : action,
    }));
  }

  function approveAll() {
    const updated: Record<string, "approved"> = {};
    items
      .filter((i) => i.status === "pending")
      .forEach((i) => {
        updated[i.id] = "approved";
      });
    setItemStatuses((prev) => ({ ...prev, ...updated }));
  }

  function rejectAll() {
    const updated: Record<string, "rejected"> = {};
    items
      .filter((i) => i.status === "pending")
      .forEach((i) => {
        updated[i.id] = "rejected";
      });
    setItemStatuses((prev) => ({ ...prev, ...updated }));
  }

  function approveHighConfidence() {
    const updated: Record<string, "approved" | "pending"> = {};
    items
      .filter((i) => i.status === "pending")
      .forEach((i) => {
        updated[i.id] = i.confidence >= 0.85 ? "approved" : "pending";
      });
    setItemStatuses((prev) => ({ ...prev, ...updated }));
  }

  function handleApplyReview() {
    if (!review?.id) return;

    const approvedItems = Object.entries(itemStatuses)
      .filter(([, status]) => status === "approved")
      .map(([id]) => id);
    const rejectedItems = Object.entries(itemStatuses)
      .filter(([, status]) => status === "rejected")
      .map(([id]) => id);

    startApply(async () => {
      const result = await submitDocumentReview(
        review.id,
        approvedItems,
        rejectedItems,
        addNote ? notesDraft : null
      );

      if ("error" in result && result.error) {
        toast.error(`Failed to apply review: ${result.error}`);
      } else {
        const data = result.data as { applied_count?: number; rejected_count?: number } | undefined;
        toast.success(
          `Applied ${data?.applied_count ?? 0} update(s), rejected ${data?.rejected_count ?? 0}.`
        );
        onApplied?.();
        onOpenChange(false);
      }
    });
  }

  function handleRetry() {
    if (!documentId) return;
    startRetry(async () => {
      const result = await retriggerDocumentReview(documentId);
      if ("error" in result && result.error) {
        toast.error(`Failed to retrigger review: ${result.error}`);
      } else {
        toast.success("Review retriggered");
        onOpenChange(false);
      }
    });
  }

  const approvedCount = Object.values(itemStatuses).filter(
    (s) => s === "approved"
  ).length;
  const rejectedCount = Object.values(itemStatuses).filter(
    (s) => s === "rejected"
  ).length;
  const pendingCount = Object.values(itemStatuses).filter(
    (s) => s === "pending"
  ).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[560px] sm:max-w-none p-0 flex flex-col">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : review?.status === "error" ? (
          <div className="p-6 space-y-4">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Review Failed
              </SheetTitle>
            </SheetHeader>
            <div className="rounded-lg p-4 bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-foreground">
                {review.error_message ||
                  "An unknown error occurred during document review."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Retry Review
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b space-y-3">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  AI Document Review
                </SheetTitle>
              </SheetHeader>

              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium truncate max-w-[280px]">
                  {documentName}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {DOC_TYPE_LABELS[review?.document_type || "other"]}
                </Badge>
                {review?.document_type_confidence != null && (
                  <span className="text-xs text-muted-foreground num">
                    {Math.round(review.document_type_confidence * 100)}%
                    confidence
                  </span>
                )}
              </div>

              {review?.summary && (
                <p className="text-sm text-muted-foreground">
                  {review.summary}
                </p>
              )}

              {/* Flags */}
              {review?.flags && review.flags.length > 0 && (
                <div className="space-y-1.5">
                  {review.flags.map((flag, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-2 text-sm rounded-md px-3 py-2 bg-yellow-500/10 border border-yellow-500/20"
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                      <span className="text-foreground">{flag}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <ScrollArea className="flex-1">
              <div className="p-6 space-y-6">
                {/* Bulk Actions */}
                {items.filter((i) => i.status === "pending").length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={approveAll}
                    >
                      <Check className="h-3.5 w-3.5 mr-1.5" /> Approve All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={approveHighConfidence}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" /> High
                      Confidence
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={rejectAll}
                    >
                      <X className="h-3.5 w-3.5 mr-1.5" /> Reject All
                    </Button>
                    <span className="text-xs text-muted-foreground ml-auto num">
                      {approvedCount} approved · {rejectedCount} rejected ·{" "}
                      {pendingCount} pending
                    </span>
                  </div>
                )}

                {/* Proposed Updates */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">
                    Proposed Updates
                  </h3>

                  {items.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText
                        className="mx-auto mb-3 h-8 w-8 text-muted-foreground"
                        strokeWidth={1}
                      />
                      <p className="text-sm text-muted-foreground">
                        No field updates proposed. Review the notes below.
                      </p>
                    </div>
                  ) : (
                    items.map((item) => {
                      const localStatus =
                        itemStatuses[item.id] || item.status;
                      const isApproved = localStatus === "approved";
                      const isRejected = localStatus === "rejected";

                      return (
                        <Card
                          key={item.id}
                          className={`transition-colors ${
                            isApproved
                              ? "border-green-500/30 bg-green-500/5"
                              : isRejected
                                ? "border-destructive/30 bg-destructive/5 opacity-60"
                                : ""
                          }`}
                        >
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {item.field_label}
                              </span>
                              <ConfidenceIndicator
                                confidence={item.confidence}
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  Current
                                </span>
                                <p className="text-sm text-muted-foreground mt-0.5 num">
                                  {item.current_value || "\u2014"}
                                </p>
                              </div>
                              <div>
                                <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                                  Proposed
                                </span>
                                <p className="text-sm font-medium text-foreground mt-0.5 num">
                                  {item.proposed_value}
                                </p>
                              </div>
                            </div>

                            {item.extraction_source && (
                              <p className="text-xs text-muted-foreground italic">
                                Source: {item.extraction_source}
                              </p>
                            )}

                            {item.status === "pending" && (
                              <div className="flex items-center gap-2 pt-1">
                                <Button
                                  variant={
                                    isApproved ? "default" : "outline"
                                  }
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    toggleItem(item.id, "approved")
                                  }
                                >
                                  <Check className="h-3 w-3 mr-1" />{" "}
                                  Approve
                                </Button>
                                <Button
                                  variant={
                                    isRejected ? "destructive" : "outline"
                                  }
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    toggleItem(item.id, "rejected")
                                  }
                                >
                                  <X className="h-3 w-3 mr-1" /> Reject
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>

                <Separator />

                {/* Notes Draft */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">
                      Notes Draft
                    </h3>
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={addNote}
                        onChange={(e) => setAddNote(e.target.checked)}
                        className="rounded border-input"
                      />
                      Add to deal activity
                    </label>
                  </div>
                  <Textarea
                    value={notesDraft}
                    onChange={(e) => setNotesDraft(e.target.value)}
                    rows={6}
                    className="text-sm"
                    placeholder="AI-generated notes will appear here..."
                  />
                </div>

                {/* Processing metadata */}
                {review?.processing_time_ms != null && (
                  <p className="text-xs text-muted-foreground num">
                    Processed in{" "}
                    {(review.processing_time_ms / 1000).toFixed(1)}s
                    {review.tokens_used != null && (
                      <> · {review.tokens_used.toLocaleString()} tokens</>
                    )}
                  </p>
                )}
              </div>
            </ScrollArea>

            {/* Footer Actions */}
            <div className="border-t p-4 flex items-center gap-3">
              <Button
                onClick={handleApplyReview}
                disabled={
                  applying || (approvedCount === 0 && rejectedCount === 0)
                }
                className="flex-1"
              >
                {applying ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Applying...
                  </>
                ) : (
                  `Apply Review (${approvedCount} updates)`
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ─── Confidence Indicator Sub-component ───

function ConfidenceIndicator({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const color =
    confidence >= 0.85
      ? "text-green-600 dark:text-green-400"
      : confidence >= 0.6
        ? "text-yellow-600 dark:text-yellow-400"
        : "text-destructive";
  const bg =
    confidence >= 0.85
      ? "bg-green-500"
      : confidence >= 0.6
        ? "bg-yellow-500"
        : "bg-destructive";

  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${bg}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-xs font-medium num ${color}`}>{pct}%</span>
    </div>
  );
}
