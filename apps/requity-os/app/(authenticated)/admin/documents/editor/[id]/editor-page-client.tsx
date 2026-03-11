"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DocumentEditor } from "@/components/documents/editor/DocumentEditor";
import { StyledDocumentRenderer } from "@/components/documents/StyledDocumentRenderer";
import { SendDocumentEmailDialog } from "@/components/documents/SendDocumentEmailDialog";
import { createClient } from "@/lib/supabase/client";
import type { StyledLayout } from "@/components/documents/styled-doc-parts/types";

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
  styledLayout?: Record<string, unknown> | null;
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
  styledLayout,
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

  // If the template has a styled_layout, use the styled renderer
  if (styledLayout) {
    return (
      <div className="flex flex-col h-screen bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0 no-print">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => router.push("/admin/documents")}
            >
              <ArrowLeft size={14} />
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold truncate">{templateName}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {status}
                </Badge>
              </div>
              <p className="text-[11px] text-muted-foreground truncate">
                {recordType} {recordId.slice(0, 8)}...
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {emailFlow && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={emailFlow.trigger}
                disabled={emailFlow.preparing}
              >
                <Mail size={12} className="mr-1" />
                {emailFlow.preparing ? "Preparing..." : "Send via Email"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => window.print()}
            >
              <Printer size={12} className="mr-1" />
              Print / PDF
            </Button>
          </div>
        </div>

        {/* Styled document preview */}
        <div className="flex-1 overflow-y-auto bg-muted/30">
          <div className="flex justify-center py-8">
            <StyledDocumentRenderer
              layout={styledLayout as unknown as StyledLayout}
              mergeData={mergeData}
              className="shadow-xl"
            />
          </div>
        </div>

        {emailFlow.composer}
      </div>
    );
  }

  // Fallback: TipTap editor
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
