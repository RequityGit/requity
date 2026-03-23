"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Flame,
  Loader2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { showSuccess, showError } from "@/lib/toast";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import { getDocumentSignedUrl } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { updateConditionStatusAction } from "@/app/(authenticated)/(admin)/pipeline/actions";
import { UnifiedNotes } from "@/components/shared/UnifiedNotes";
import { useConditionDocuments } from "./useConditionDocuments";
import { ConditionInstructions } from "./ConditionInstructions";
import { ConditionDocuments } from "./ConditionDocuments";
import { ConditionAIReview } from "./ConditionAIReview";
import { ConditionActions } from "./ConditionActions";
import type { DealConditionRow, ConditionDocument } from "./useActionCenterData";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "text-muted-foreground" },
  requested: { label: "Requested", color: "text-violet-600 dark:text-violet-400" },
  submitted: { label: "Submitted", color: "text-blue-600 dark:text-blue-400" },
  under_review: { label: "In Review", color: "text-amber-600 dark:text-amber-400" },
  approved: { label: "Approved", color: "text-green-600 dark:text-green-400" },
  waived: { label: "Waived", color: "text-slate-500" },
  not_applicable: { label: "N/A", color: "text-slate-400" },
  rejected: { label: "Rejected", color: "text-red-600 dark:text-red-400" },
};

const STATUS_OPTIONS = ["pending", "requested", "submitted", "under_review", "approved", "waived", "not_applicable", "rejected"];

function formatStageName(stage: string): string {
  return stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCategoryName(category: string): string {
  return category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate) < new Date();
}

interface ConditionDetailPanelProps {
  condition: DealConditionRow;
  dealId: string;
  onBack: () => void;
  onStatusChange: (conditionId: string, newStatus: string) => void;
}

export function ConditionDetailPanel({
  condition,
  dealId,
  onBack,
  onStatusChange,
}: ConditionDetailPanelProps) {
  const confirm = useConfirm();
  const [isUploading, setIsUploading] = useState(false);

  // Preview state
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFileName, setPreviewFileName] = useState("");
  const [previewMimeType, setPreviewMimeType] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    conditionDocs,
    unlinkedDealDocs,
    isLoading,
    reviewStatuses,
    uploadFile,
    deleteDocument,
    linkDocument,
    triggerReviewForDoc,
    retriggerReviewForDoc,
  } = useConditionDocuments(condition.id, dealId);

  // Find the most recent completed review for the AI review card
  const latestReview = (() => {
    for (const doc of conditionDocs) {
      const rs = reviewStatuses[doc.id];
      if (rs?.status === "completed" && rs.data) return { docId: doc.id, review: rs.data };
    }
    return null;
  })();

  // Handle status change with server persist
  const handleStatusChange = useCallback(
    async (conditionId: string, newStatus: string) => {
      const oldStatus = condition.status;
      onStatusChange(conditionId, newStatus); // Optimistic

      const result = await updateConditionStatusAction(conditionId, newStatus, dealId);
      if (result && "error" in result && result.error) {
        onStatusChange(conditionId, oldStatus); // Revert
        showError("Could not update condition", result.error);
      } else {
        showSuccess("Condition updated");
      }
    },
    [condition.status, dealId, onStatusChange]
  );

  // Upload wrapper to track uploading state
  const handleUpload = useCallback(
    async (file: File) => {
      setIsUploading(true);
      try {
        await uploadFile(file);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile]
  );

  // Delete with confirmation
  const handleDelete = useCallback(
    async (docId: string) => {
      const ok = await confirm({
        title: "Delete document?",
        description: "This will permanently remove this document.",
        confirmLabel: "Delete",
        destructive: true,
      });
      if (ok) await deleteDocument(docId);
    },
    [confirm, deleteDocument]
  );

  // Preview handler
  const handlePreview = useCallback(async (doc: ConditionDocument) => {
    if (!doc.storage_path) return;
    const { url, error } = await getDocumentSignedUrl(doc.storage_path);
    if (error || !url) {
      showError("Could not load preview");
      return;
    }
    // Open in new tab for simplest cross-format support
    window.open(url, "_blank");
  }, []);

  // Download handler
  const handleDownload = useCallback(async (doc: ConditionDocument) => {
    if (!doc.storage_path) return;
    const { url, error } = await getDocumentSignedUrl(doc.storage_path);
    if (error || !url) {
      showError("Could not generate download link");
      return;
    }
    // Create a temporary anchor to force download
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.document_name;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  // Escape key to go back
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !previewOpen) {
        onBack();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onBack, previewOpen]);

  return (
    <div className="flex flex-col h-full">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b bg-card px-4 py-3 space-y-2.5">
        {/* Back button */}
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground rq-transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to list
        </button>

        {/* Condition name */}
        <h3 className="text-[15px] font-semibold leading-tight pr-2">
          {condition.condition_name}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status dropdown */}
          <Select
            value={condition.status}
            onValueChange={(v) => handleStatusChange(condition.id, v)}
          >
            <SelectTrigger className="inline-field h-7 w-[140px] text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => {
                const cfg = STATUS_CONFIG[s];
                return (
                  <SelectItem key={s} value={s}>
                    <span className={cn("text-[12px]", cfg?.color)}>
                      {cfg?.label ?? s}
                    </span>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          {/* Stage chip */}
          <Badge variant="outline" className="text-[10px]">
            {formatStageName(condition.required_stage)}
          </Badge>

          {/* Category chip */}
          <Badge variant="outline" className="text-[10px]">
            {formatCategoryName(condition.category)}
          </Badge>

          {/* Critical path */}
          {condition.critical_path_item && (
            <Badge variant="destructive" className="text-[10px]">
              <Flame className="h-3 w-3 mr-1" /> Critical Path
            </Badge>
          )}

          {/* Due date */}
          {condition.due_date && (
            <span
              className={cn(
                "text-[10.5px] ml-auto",
                isOverdue(condition.due_date)
                  ? "text-destructive font-medium"
                  : "text-muted-foreground"
              )}
            >
              Due: {formatDate(condition.due_date)}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Instructions */}
            <ConditionInstructions
              internalDescription={condition.internal_description}
              borrowerDescription={condition.borrower_description}
            />

            {/* Action buttons */}
            <ConditionActions
              condition={condition}
              dealId={dealId}
              onStatusChange={handleStatusChange}
            />

            {/* Documents */}
            <ConditionDocuments
              conditionId={condition.id}
              dealId={dealId}
              docs={conditionDocs}
              unlinkedDocs={unlinkedDealDocs}
              reviewStatuses={reviewStatuses}
              isUploading={isUploading}
              onUpload={handleUpload}
              onDelete={handleDelete}
              onLink={linkDocument}
              onRetriggerReview={retriggerReviewForDoc}
              onPreview={handlePreview}
              onDownload={handleDownload}
            />

            {/* AI Review (show most recent review) */}
            {latestReview && (
              <ConditionAIReview
                review={latestReview.review}
                onRetrigger={() => retriggerReviewForDoc(latestReview.docId)}
                isRetriggering={reviewStatuses[latestReview.docId]?.status === "processing"}
              />
            )}

            {/* Comments */}
            <div className="p-4">
              <div className="rq-micro-label mb-3">Comments</div>
              <UnifiedNotes
                entityType="unified_condition"
                entityId={condition.id}
                dealId={dealId}
                showInternalToggle={true}
                showPinning={false}
                compact={true}
                chatMode={true}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
