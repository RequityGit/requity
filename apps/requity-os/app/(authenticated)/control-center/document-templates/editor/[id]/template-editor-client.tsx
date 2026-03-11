"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { LayoutGrid, FileText } from "lucide-react";
import { DocumentEditor } from "@/components/documents/editor/DocumentEditor";
import { LayoutEditor } from "@/components/documents/layout-editor/LayoutEditor";
import { saveTemplateContent, enableLayoutEditor, disableLayoutEditor } from "../../actions";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
}: Props) {
  const router = useRouter();
  const [editorMode, setEditorMode] = useState<"tiptap" | "layout">(
    styledLayout ? "layout" : "tiptap"
  );
  const [switching, setSwitching] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  const handleSave = useCallback(
    async (content: string) => {
      const result = await saveTemplateContent(templateId, content);
      if (result.error) {
        toast.error(`Failed to save template: ${result.error}`);
      }
    },
    [templateId]
  );

  const handleEnableLayout = useCallback(async () => {
    setSwitching(true);
    const result = await enableLayoutEditor(templateId);
    if (result.error) {
      toast.error(`Failed to enable layout editor: ${result.error}`);
      setSwitching(false);
    } else {
      toast.success("Layout Editor enabled");
      router.refresh();
    }
  }, [templateId, router]);

  const handleDisableLayout = useCallback(async () => {
    setSwitching(true);
    setConfirmDisable(false);
    const result = await disableLayoutEditor(templateId);
    if (result.error) {
      toast.error(`Failed to disable layout editor: ${result.error}`);
      setSwitching(false);
    } else {
      toast.success("Switched to rich text editor");
      router.refresh();
    }
  }, [templateId, router]);

  const goBack = () => router.push("/control-center/document-templates");

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
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              disabled={switching}
              onClick={() => setConfirmDisable(true)}
            >
              <FileText size={12} className="mr-1" />
              Switch to Rich Text
            </Button>
          }
        />
        <AlertDialog open={confirmDisable} onOpenChange={setConfirmDisable}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Switch to Rich Text Editor?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear the styled layout data for this template. You can
                re-enable the Layout Editor later, but you will need to rebuild
                the layout from scratch.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisableLayout}>
                Switch Editor
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

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
      onClose={goBack}
      switchAction={
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
      }
    />
  );
}
