"use client";

import React, { useState, lazy, Suspense } from "react";
import { useRouter } from "next/navigation";
import { FileText, FolderOpen, ClipboardCheck, Loader2 } from "lucide-react";
import { showSuccess, showError } from "@/lib/toast";
import {
  updateConditionDocumentApproval,
  requestConditionRevision,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import { createClient } from "@/lib/supabase/client";
import { DocumentReviewPanel } from "@/components/pipeline/DocumentReviewPanel";
import { SectionErrorBoundary } from "@/components/shared/SectionErrorBoundary";
import { FormsSection } from "./FormsSection";
import { DocumentsSection } from "./DocumentsSection";
import { ConditionsSection } from "./ConditionsSection";
import { DocPreviewModal } from "./DocPreviewModal";
import { CollapsibleSection } from "./CollapsibleSection";
import type { DealDocument, DocumentsTabProps } from "./types";

// Lazy-load document generation section (heavy dependencies: docx)
const DealDocumentsSection = lazy(() =>
  import("./DealDocumentsSection").then((m) => ({ default: m.DealDocumentsSection }))
);

function SectionLoader() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
    </div>
  );
}

export function DocumentsTab({
  documents,
  conditions,
  dealId,
  dealName,
  dealStage,
  googleDriveFolderUrl,
  currentUserId,
  currentUserName,
  dealDocData,
}: DocumentsTabProps) {
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
      showError("Could not update approval status", result.error);
    } else {
      showSuccess(
        status === "approved" ? "Document approved" : "Document denied"
      );
      router.refresh();
    }
  }

  async function handleRevisionFromPreview(conditionId: string, feedback: string) {
    const result = await requestConditionRevision(conditionId, dealId, feedback, null);
    if (result.error) {
      showError("Could not request revision", result.error);
    } else {
      showSuccess("Revision requested - borrower will see feedback on their upload portal");
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
      showError("Could not unlink document", error.message);
    } else {
      showSuccess("Document unlinked");
      router.refresh();
    }
  }

  function handlePreviewDoc(doc: DealDocument) {
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
      {/* Forms & Applications */}
      <CollapsibleSection
        icon={FileText}
        title="Forms & Applications"
        defaultOpen={true}
      >
        <FormsSection dealId={dealId} />
      </CollapsibleSection>

      {/* Documents */}
      <CollapsibleSection
        icon={FolderOpen}
        title="Documents"
        defaultOpen={true}
      >
        <DocumentsSection
          documents={documents}
          conditions={conditions}
          dealId={dealId}
          dealName={dealName}
          googleDriveFolderUrl={googleDriveFolderUrl}
          onPreviewDoc={handlePreviewDoc}
          onUploadComplete={() => router.refresh()}
          currentUserId={currentUserId}
          currentUserName={currentUserName}
        />
      </CollapsibleSection>

      {/* Conditions */}
      <CollapsibleSection
        icon={ClipboardCheck}
        title="Conditions"
        defaultOpen={true}
      >
        <ConditionsSection
          conditions={conditions}
          documents={documents}
          dealId={dealId}
          dealStage={dealStage}
          onPreviewDoc={(doc) => {
            setPreviewDoc(doc);
            setPreviewOpen(true);
          }}
          onApprovalChange={handleApprovalChange}
          onUnlinkDoc={unlinkDoc}
        />
      </CollapsibleSection>

      {/* Document Generation: Credit Memo & Investor Summary */}
      {dealDocData && (
        <SectionErrorBoundary fallbackTitle="Could not load document drafting">
          <Suspense fallback={<SectionLoader />}>
            <DealDocumentsSection dealId={dealId} dealDocData={dealDocData} />
          </Suspense>
        </SectionErrorBoundary>
      )}

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
