"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { showSuccess, showError } from "@/lib/toast";
import { LayoutGrid, FileText, PenTool } from "lucide-react";
import { DocumentEditor } from "@/components/documents/editor/DocumentEditor";
import { LayoutEditor } from "@/components/documents/layout-editor/LayoutEditor";
import { DocusealBuilderEmbed } from "@/components/esign/docuseal-builder-embed";
import {
  saveTemplateContent,
  enableLayoutEditor,
  disableLayoutEditor,
  saveDocusealTemplateId,
} from "../../actions";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/components/shared/ConfirmDialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { StyledLayout } from "@/components/documents/styled-doc-parts/types";

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
  styledLayout?: Record<string, unknown> | null;
  requiresSignature: boolean;
  signatureRoles: Array<{ role: string }>;
  docusealTemplateId: number | null;
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
  styledLayout,
  requiresSignature,
  signatureRoles,
  docusealTemplateId,
}: Props) {
  const router = useRouter();
  const confirm = useConfirm();
  const [editorMode, setEditorMode] = useState<"tiptap" | "layout">(
    styledLayout ? "layout" : "tiptap"
  );
  const [switching, setSwitching] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [savedDocusealId, setSavedDocusealId] = useState<number | null>(
    docusealTemplateId
  );

  const handleSave = useCallback(
    async (content: string) => {
      const result = await saveTemplateContent(templateId, content);
      if (result.error) {
        showError(`Failed to save template: ${result.error}`);
      }
    },
    [templateId]
  );

  const handleEnableLayout = useCallback(async () => {
    setSwitching(true);
    const result = await enableLayoutEditor(templateId);
    if (result.error) {
      showError(`Failed to enable layout editor: ${result.error}`);
      setSwitching(false);
    } else {
      showSuccess("Layout Editor enabled");
      router.refresh();
    }
  }, [templateId, router]);

  const handleDisableLayout = useCallback(async () => {
    const ok = await confirm({
      title: "Switch to Rich Text Editor?",
      description:
        "This will clear the styled layout data for this template. You can re-enable the Layout Editor later, but you will need to rebuild the layout from scratch.",
      confirmLabel: "Switch Editor",
      destructive: true,
    });
    if (!ok) return;
    setSwitching(true);
    const result = await disableLayoutEditor(templateId);
    if (result.error) {
      showError(`Failed to disable layout editor: ${result.error}`);
      setSwitching(false);
    } else {
      showSuccess("Switched to rich text editor");
      router.refresh();
    }
  }, [templateId, router, confirm]);

  const handleBuilderSave = useCallback(
    async (detail: { id: number; name: string }) => {
      const result = await saveDocusealTemplateId(templateId, detail.id);
      if (result.error) {
        showError(`Could not save signing field configuration: ${result.error}`);
      } else {
        setSavedDocusealId(detail.id);
        showSuccess("Signing fields configured");
        setBuilderOpen(false);
      }
    },
    [templateId]
  );

  const goBack = () => router.push("/control-center/document-templates");

  const signingFieldsButton = requiresSignature ? (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs text-muted-foreground"
      onClick={() => setBuilderOpen(true)}
    >
      <PenTool size={12} className="mr-1" />
      {savedDocusealId ? "Edit Signing Fields" : "Configure Signing Fields"}
    </Button>
  ) : null;

  const builderDialog = (
    <Dialog open={builderOpen} onOpenChange={setBuilderOpen}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Configure Signing Fields</DialogTitle>
          <DialogDescription>
            Place signature, date, and initials fields on the document. These
            positions will be used every time this template is sent for
            signature.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-auto">
          {builderOpen && (
            <DocusealBuilderEmbed
              templateName={templateName}
              existingTemplateId={savedDocusealId ?? undefined}
              roles={signatureRoles.map((r) => r.role)}
              onSave={handleBuilderSave}
              className="w-full h-full min-h-[600px]"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  if (editorMode === "layout") {
    return (
      <>
        <LayoutEditor
          template={{
            id: templateId,
            name: templateName,
            styled_layout: styledLayout as StyledLayout | null,
            merge_fields: mergeFields,
          }}
          onBack={goBack}
          switchAction={
            <div className="flex items-center gap-1">
              {signingFieldsButton}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                disabled={switching}
                onClick={handleDisableLayout}
              >
                <FileText size={12} className="mr-1" />
                Switch to Rich Text
              </Button>
            </div>
          }
        />
        {builderDialog}
      </>
    );
  }

  return (
    <>
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
        onClose={goBack}
        switchAction={
          <div className="flex items-center gap-1">
            {signingFieldsButton}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              disabled={switching}
              onClick={handleEnableLayout}
            >
              <LayoutGrid size={12} className="mr-1" />
              {switching ? "Switching..." : "Switch to Layout Editor"}
            </Button>
          </div>
        }
      />
      {builderDialog}
    </>
  );
}
