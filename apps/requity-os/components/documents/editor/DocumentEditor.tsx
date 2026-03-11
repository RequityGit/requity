"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { Image } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { Table as TableExtension } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import {
  FileText,
  Download,
  Mail,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MergeField } from "../extensions/merge-field";
import { StyledDivider } from "../extensions/styled-divider";
import { PageBreak } from "../extensions/page-break";
import { EditorToolbar } from "./EditorToolbar";
import { EditorSidebar } from "./EditorSidebar";
import { exportHtmlAsPdf } from "@/lib/export-pdf";

interface MergeFieldDef {
  key: string;
  label: string;
  source: string;
  column: string;
  format?: string | null;
}

export interface DocumentEditorProps {
  mode: "document" | "template";
  documentId?: string;
  templateId?: string;
  initialContent?: string;
  mergeFields?: MergeFieldDef[];
  mergeData?: Record<string, string>;
  documentInfo?: {
    templateName?: string;
    version?: number;
    recordLabel?: string;
    generatedBy?: string;
    generatedAt?: string;
    status?: string;
  };
  onSave?: (content: string) => void;
  onClose?: () => void;
  /** Called when user clicks "Send via Email" — triggers the email preparation flow */
  onSendEmail?: () => void;
  /** Whether the email is being prepared (shows loading on the button) */
  sendEmailPreparing?: boolean;
  /** Called when the editor is ready, providing a function to get current HTML */
  onEditorReady?: (getHtml: () => string) => void;
  /** Optional action element for switching editor modes */
  switchAction?: React.ReactNode;
}

export function DocumentEditor({
  mode,
  documentId,
  templateId,
  initialContent = "",
  mergeFields = [],
  mergeData,
  documentInfo,
  onSave,
  onClose,
  onSendEmail,
  sendEmailPreparing,
  onEditorReady,
  switchAction,
}: DocumentEditorProps) {
  const [zoom, setZoom] = useState(100);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [exporting, setExporting] = useState(false);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: false,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TextStyle,
      Color,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: "Start typing or paste document content...",
      }),
      TableExtension.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      MergeField,
      StyledDivider,
      PageBreak,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: "outline-none min-h-[800px]",
      },
    },
    onUpdate: ({ editor: e }) => {
      // Auto-save debounce
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
      saveTimeout.current = setTimeout(() => {
        if (onSave) {
          onSave(e.getHTML());
          setLastSaved(new Date());
        }
      }, 2000);
    },
  });

  // Expose getHtml to parent for Send via Email flow
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(() => editor.getHTML());
    }
  }, [editor, onEditorReady]);

  // Word count
  const wordCount = editor
    ? editor.state.doc.textContent.split(/\s+/).filter(Boolean).length
    : 0;

  // Find & Replace
  const handleFind = useCallback(() => {
    if (!editor || !findText) return;
    // Simple highlight approach — just scroll to first occurrence
    const content = editor.getHTML();
    if (content.includes(findText)) {
      toast.success(`Found "${findText}" in document`);
    } else {
      toast.error(`"${findText}" not found`);
    }
  }, [editor, findText]);

  const handleReplaceAll = useCallback(() => {
    if (!editor || !findText) return;
    const content = editor.getHTML();
    const updated = content.replaceAll(findText, replaceText);
    editor.commands.setContent(updated);
    toast.success(`Replaced all occurrences`);
  }, [editor, findText, replaceText]);

  // Handle manual save
  const handleManualSave = useCallback(() => {
    if (!editor || !onSave) return;
    onSave(editor.getHTML());
    setLastSaved(new Date());
    toast.success("Document saved");
  }, [editor, onSave]);

  // Handle PDF export
  const handleExportPdf = useCallback(async () => {
    if (!editor || exporting) return;
    setExporting(true);
    try {
      const html = editor.getHTML();
      const name = documentInfo?.templateName ?? "document";
      await exportHtmlAsPdf(html, name);
    } finally {
      setExporting(false);
    }
  }, [editor, exporting, documentInfo?.templateName]);

  if (!editor) return null;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background">
        <div className="flex items-center gap-3 min-w-0">
          <FileText size={18} className="text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold truncate">
                {documentInfo?.templateName ?? "Untitled Document"}
              </span>
              {documentInfo?.status && (
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {documentInfo.status}
                </Badge>
              )}
            </div>
            {documentInfo?.recordLabel && (
              <p className="text-[11px] text-muted-foreground truncate">
                {documentInfo.recordLabel}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {switchAction}
          {mode === "document" && onSendEmail && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={onSendEmail}
              disabled={sendEmailPreparing}
            >
              <Mail size={12} className="mr-1" />
              {sendEmailPreparing ? "Preparing..." : "Send via Email"}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleExportPdf}
            disabled={exporting}
          >
            <Download size={12} className="mr-1" />
            {exporting ? "Exporting..." : "Export PDF"}
          </Button>
          {onSave && (
            <Button size="sm" className="h-7 text-xs" onClick={handleManualSave}>
              Save
            </Button>
          )}
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClose}
            >
              <X size={14} />
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        mode={mode}
        zoom={zoom}
        onZoomChange={setZoom}
        showFindReplace={showFindReplace}
        onToggleFindReplace={() => setShowFindReplace(!showFindReplace)}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Find & Replace Bar */}
      {showFindReplace && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/50">
          <Input
            value={findText}
            onChange={(e) => setFindText(e.target.value)}
            placeholder="Find..."
            className="h-7 w-48 text-xs"
            onKeyDown={(e) => e.key === "Enter" && handleFind()}
          />
          <Input
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Replace..."
            className="h-7 w-48 text-xs"
          />
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={handleReplaceAll}
          >
            Replace All
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setShowFindReplace(false)}
          >
            <X size={12} />
          </Button>
        </div>
      )}

      {/* Main Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex-1 overflow-y-auto bg-muted/30">
          <div className="flex justify-center py-8">
            <div
              className="bg-white shadow-xl rounded-sm"
              style={{
                width: `${816 * (zoom / 100)}px`,
                minHeight: `${1056 * (zoom / 100)}px`,
                padding: `${56 * (zoom / 100)}px ${64 * (zoom / 100)}px`,
                transform: `scale(1)`,
                transformOrigin: "top center",
              }}
            >
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        {sidebarOpen && (
          <EditorSidebar
            mode={mode}
            editor={editor}
            mergeFields={mergeFields}
            mergeData={mergeData}
            documentInfo={documentInfo}
          />
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-1.5 border-t border-border text-[11px] text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{mode === "template" ? "Template Mode" : "Document Mode"}</span>
          <span className="num">{wordCount} words</span>
          {mode === "template" && (
            <span className="num">{mergeFields.length} merge fields</span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {lastSaved && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>
                Saved {lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
