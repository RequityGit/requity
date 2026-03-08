"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { toast } from "sonner";
import { DocumentEditor } from "@/components/documents/editor/DocumentEditor";
import { saveTemplateContent } from "../../actions";

interface Props {
  templateId: string;
  templateName: string;
  templateType: string;
  recordType: string;
  version: number;
  isActive: boolean;
  initialContent: string;
  mergeFields: Array<{
    key: string;
    label: string;
    source: string;
    column: string;
    format?: string | null;
  }>;
}

export function TemplateEditorClient({
  templateId,
  templateName,
  templateType,
  recordType,
  version,
  isActive,
  initialContent,
  mergeFields,
}: Props) {
  const router = useRouter();

  const handleSave = useCallback(
    async (content: string) => {
      const result = await saveTemplateContent(templateId, content);
      if (result.error) {
        toast.error(`Failed to save template: ${result.error}`);
      }
    },
    [templateId]
  );

  return (
    <DocumentEditor
      mode="template"
      templateId={templateId}
      initialContent={initialContent}
      mergeFields={mergeFields}
      documentInfo={{
        templateName,
        version,
        recordLabel: `${templateType} · ${recordType}`,
        status: isActive ? "Active" : "Inactive",
      }}
      onSave={handleSave}
      onClose={() => router.push("/control-center/document-templates")}
    />
  );
}
