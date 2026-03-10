"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { DocumentEditor } from "@/components/documents/editor/DocumentEditor";
import { SendDocumentEmailDialog } from "@/components/documents/SendDocumentEmailDialog";
import { createClient } from "@/lib/supabase/client";

interface Props {
  documentId: string;
  fileName: string;
  status: string;
  initialContent?: string;
  mergeData: Record<string, string>;
  templateName: string;
  templateVersion: number;
  templateId: string;
  recordType: string;
  recordId: string;
  mergeFields: Array<{
    key: string;
    label: string;
    source: string;
    column: string;
    format?: string | null;
  }>;
  generatedBy: string;
  generatedAt: string;
  currentUserId: string;
  currentUserName?: string;
}

export function EditorPageClient({
  documentId,
  fileName,
  status,
  initialContent,
  mergeData,
  templateName,
  templateVersion,
  templateId,
  recordType,
  recordId,
  mergeFields,
  generatedBy,
  generatedAt,
  currentUserId,
  currentUserName,
}: Props) {
  const router = useRouter();
  const getHtmlRef = useRef<() => string>(() => initialContent ?? "");

  const handleSave = useCallback(async (content: string) => {
    const supabase = createClient();
    const { error } = await supabase
      .from("generated_documents")
      .update({ content })
      .eq("id", documentId);
    if (error) {
      console.error("Failed to save document:", error);
    }
  }, [documentId]);

  const handleEditorReady = useCallback((getHtml: () => string) => {
    getHtmlRef.current = getHtml;
  }, []);

  // Wire up the Send via Email flow
  const emailFlow = SendDocumentEmailDialog({
    documentId,
    templateId,
    getHtmlContent: () => getHtmlRef.current(),
    fileName,
    recordType,
    recordId,
    currentUserId,
    currentUserName,
    linkedLoanId: recordType === "loan" ? recordId : undefined,
  });

  return (
    <>
      <DocumentEditor
        mode="document"
        documentId={documentId}
        initialContent={initialContent}
        mergeFields={mergeFields}
        mergeData={mergeData}
        onSave={handleSave}
        documentInfo={{
          templateName,
          version: templateVersion,
          recordLabel: `${recordType} ${recordId.slice(0, 8)}...`,
          generatedBy,
          generatedAt,
          status,
        }}
        onClose={() => router.push("/admin/documents")}
        onSendEmail={emailFlow.trigger}
        sendEmailPreparing={emailFlow.preparing}
        onEditorReady={handleEditorReady}
      />
      {emailFlow.composer}
    </>
  );
}
