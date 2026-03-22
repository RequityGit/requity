"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { showSuccess, showError } from "@/lib/toast";
import {
  createDealDocumentUploadUrl,
  saveDealDocumentRecord,
  deleteDealDocumentV2,
  triggerConditionReview,
  getConditionReview,
  retriggerDocumentReview,
} from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import type { ConditionReviewData } from "@/app/(authenticated)/(admin)/pipeline/[id]/actions";
import type { ConditionDocument } from "./useActionCenterData";

export interface ReviewStatus {
  status: "idle" | "processing" | "completed" | "error";
  data?: ConditionReviewData;
}

interface UseConditionDocumentsReturn {
  conditionDocs: ConditionDocument[];
  unlinkedDealDocs: ConditionDocument[];
  isLoading: boolean;
  reviewStatuses: Record<string, ReviewStatus>;
  uploadFile: (file: File) => Promise<void>;
  deleteDocument: (docId: string) => Promise<void>;
  linkDocument: (docId: string) => Promise<void>;
  triggerReviewForDoc: (docId: string) => Promise<void>;
  retriggerReviewForDoc: (docId: string) => Promise<void>;
  refreshDocs: () => Promise<void>;
}

export function useConditionDocuments(
  conditionId: string,
  dealId: string
): UseConditionDocumentsReturn {
  const [conditionDocs, setConditionDocs] = useState<ConditionDocument[]>([]);
  const [unlinkedDealDocs, setUnlinkedDealDocs] = useState<ConditionDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewStatuses, setReviewStatuses] = useState<Record<string, ReviewStatus>>({});

  const refreshDocs = useCallback(async () => {
    const supabase = createClient();

    // Fetch docs linked to this condition
    const { data: linked } = await supabase
      .from("unified_deal_documents")
      .select("id, document_name, file_url, storage_path, file_size_bytes, created_at, condition_id, mime_type")
      .eq("deal_id", dealId)
      .eq("condition_id", conditionId)
      .order("created_at", { ascending: false });

    // Fetch deal docs not linked to any condition (for link picker)
    const { data: unlinked } = await supabase
      .from("unified_deal_documents")
      .select("id, document_name, file_url, storage_path, file_size_bytes, created_at, condition_id, mime_type")
      .eq("deal_id", dealId)
      .is("condition_id", null)
      .order("created_at", { ascending: false });

    if (linked) {
      setConditionDocs(
        linked.map((d) => ({
          id: d.id,
          document_name: d.document_name ?? "Untitled",
          file_url: d.file_url ?? "",
          storage_path: d.storage_path ?? null,
          file_size_bytes: d.file_size_bytes ?? null,
          created_at: d.created_at ?? "",
          condition_id: d.condition_id ?? null,
          mime_type: (d as Record<string, unknown>).mime_type as string | null ?? null,
        }))
      );
    }

    if (unlinked) {
      setUnlinkedDealDocs(
        unlinked.map((d) => ({
          id: d.id,
          document_name: d.document_name ?? "Untitled",
          file_url: d.file_url ?? "",
          storage_path: d.storage_path ?? null,
          file_size_bytes: d.file_size_bytes ?? null,
          created_at: d.created_at ?? "",
          condition_id: d.condition_id ?? null,
          mime_type: (d as Record<string, unknown>).mime_type as string | null ?? null,
        }))
      );
    }

    setIsLoading(false);
  }, [conditionId, dealId]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    refreshDocs();
  }, [refreshDocs]);

  // Fetch AI reviews for existing docs on load
  useEffect(() => {
    if (conditionDocs.length === 0) return;

    conditionDocs.forEach(async (doc) => {
      // Skip if we already have a status for this doc
      if (reviewStatuses[doc.id]) return;

      const result = await getConditionReview(doc.id, conditionId);
      if (result.data) {
        setReviewStatuses((prev) => ({
          ...prev,
          [doc.id]: { status: "completed", data: result.data },
        }));
      } else if (result.error?.includes("still processing")) {
        setReviewStatuses((prev) => ({
          ...prev,
          [doc.id]: { status: "processing" },
        }));
      }
    });
    // Only run when conditionDocs changes, not reviewStatuses
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conditionDocs, conditionId]);

  const uploadFile = useCallback(
    async (file: File) => {
      // Validate file size (max 25MB)
      if (file.size > 25 * 1024 * 1024) {
        showError("File too large", "Maximum file size is 25MB");
        return;
      }

      // 1. Get signed upload URL
      const {
        signedUrl,
        storagePath,
        error: urlError,
      } = await createDealDocumentUploadUrl(dealId, file.name, conditionId);
      if (urlError || !signedUrl) {
        showError("Could not prepare upload", urlError);
        return;
      }

      // 2. Upload file directly to Supabase Storage
      const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type || "application/octet-stream" },
      });
      if (!uploadRes.ok) {
        showError("Upload failed");
        return;
      }

      // 3. Save document record
      const { error: saveError, documentId } = await saveDealDocumentRecord({
        dealId,
        storagePath: storagePath!,
        documentName: file.name,
        fileSizeBytes: file.size,
        mimeType: file.type,
        conditionId,
        visibility: "internal",
      });
      if (saveError) {
        showError("Could not save document record", saveError);
        return;
      }

      showSuccess("Document uploaded");

      // 4. Refresh document list
      await refreshDocs();

      // 5. Auto-trigger AI analysis
      if (documentId) {
        setReviewStatuses((prev) => ({
          ...prev,
          [documentId]: { status: "processing" },
        }));

        const { data, error: reviewError } = await triggerConditionReview(
          documentId,
          conditionId,
          dealId
        );
        if (reviewError) {
          setReviewStatuses((prev) => ({
            ...prev,
            [documentId]: { status: "error" },
          }));
        } else if (data) {
          setReviewStatuses((prev) => ({
            ...prev,
            [documentId]: { status: "completed", data },
          }));
        }
      }
    },
    [conditionId, dealId, refreshDocs]
  );

  const deleteDocument = useCallback(
    async (docId: string) => {
      // Optimistic: remove from list
      setConditionDocs((prev) => prev.filter((d) => d.id !== docId));
      setReviewStatuses((prev) => {
        const next = { ...prev };
        delete next[docId];
        return next;
      });

      const { error } = await deleteDealDocumentV2(docId);
      if (error) {
        showError("Could not delete document", error);
        await refreshDocs();
        return;
      }

      showSuccess("Document deleted");
    },
    [refreshDocs]
  );

  const linkDocument = useCallback(
    async (docId: string) => {
      const supabase = createClient();
      const { error } = await supabase
        .from("unified_deal_documents")
        .update({ condition_id: conditionId })
        .eq("id", docId);

      if (error) {
        showError("Could not link document", error.message);
        return;
      }

      showSuccess("Document linked");
      await refreshDocs();
    },
    [conditionId, refreshDocs]
  );

  const triggerReviewForDoc = useCallback(
    async (docId: string) => {
      setReviewStatuses((prev) => ({
        ...prev,
        [docId]: { status: "processing" },
      }));

      const { data, error } = await triggerConditionReview(docId, conditionId, dealId);
      if (error) {
        setReviewStatuses((prev) => ({
          ...prev,
          [docId]: { status: "error" },
        }));
        showError("Could not analyze document", error);
      } else if (data) {
        setReviewStatuses((prev) => ({
          ...prev,
          [docId]: { status: "completed", data },
        }));
      }
    },
    [conditionId, dealId]
  );

  const retriggerReviewForDoc = useCallback(
    async (docId: string) => {
      setReviewStatuses((prev) => ({
        ...prev,
        [docId]: { status: "processing" },
      }));

      const result = await retriggerDocumentReview(docId);
      if ("error" in result) {
        setReviewStatuses((prev) => ({
          ...prev,
          [docId]: { status: "error" },
        }));
        showError("Could not re-analyze document", result.error);
        return;
      }

      // After retrigger, poll for results
      const { data, error } = await triggerConditionReview(docId, conditionId, dealId);
      if (error) {
        setReviewStatuses((prev) => ({
          ...prev,
          [docId]: { status: "error" },
        }));
      } else if (data) {
        setReviewStatuses((prev) => ({
          ...prev,
          [docId]: { status: "completed", data },
        }));
      }
    },
    [conditionId, dealId]
  );

  return {
    conditionDocs,
    unlinkedDealDocs,
    isLoading,
    reviewStatuses,
    uploadFile,
    deleteDocument,
    linkDocument,
    triggerReviewForDoc,
    retriggerReviewForDoc,
    refreshDocs,
  };
}
