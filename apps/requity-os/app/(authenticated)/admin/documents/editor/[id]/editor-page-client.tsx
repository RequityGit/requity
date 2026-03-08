"use client";

import { useRouter } from "next/navigation";
import { DocumentEditor } from "@/components/documents/editor/DocumentEditor";

interface Props {
  documentId: string;
  fileName: string;
  status: string;
  mergeData: Record<string, string>;
  templateName: string;
  templateVersion: number;
  recordType: string;
  recordId: string;
  mergeFields: Array<{
    key: string;
    label: string;
    source: string;
    column: string;
    format?: string | null;
  }>;
  gdriveFileId?: string;
  generatedBy: string;
  generatedAt: string;
}

export function EditorPageClient({
  documentId,
  fileName,
  status,
  mergeData,
  templateName,
  templateVersion,
  recordType,
  recordId,
  mergeFields,
  gdriveFileId,
  generatedBy,
  generatedAt,
}: Props) {
  const router = useRouter();

  return (
    <DocumentEditor
      mode="document"
      documentId={documentId}
      mergeFields={mergeFields}
      mergeData={mergeData}
      documentInfo={{
        templateName,
        version: templateVersion,
        recordLabel: `${recordType} ${recordId.slice(0, 8)}...`,
        generatedBy,
        generatedAt,
        status,
        gdriveFileId,
      }}
      onClose={() => router.push("/admin/documents")}
    />
  );
}
