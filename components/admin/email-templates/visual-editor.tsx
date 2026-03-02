"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import UnderlineExtension from "@tiptap/extension-underline";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { EditorToolbar } from "./editor-toolbar";
import {
  MergeVariable,
  htmlToTiptap,
  tiptapToHtml,
} from "./merge-variable-extension";
import type { Editor } from "@tiptap/react";

export interface VisualEditorHandle {
  insertMergeVariable: (key: string) => void;
  getEditor: () => Editor | null;
}

interface VisualEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export const VisualEditor = forwardRef<VisualEditorHandle, VisualEditorProps>(
  function VisualEditor({ value, onChange }, ref) {
    // Track whether the last change came from the editor (internal)
    // to avoid re-setting content when the parent passes the value back.
    const isInternalUpdate = useRef(false);

    const handleUpdate = useCallback(
      ({ editor }: { editor: Editor }) => {
        const rawHtml = editor.getHTML();
        const cleanHtml = tiptapToHtml(rawHtml);
        isInternalUpdate.current = true;
        onChange(cleanHtml);
      },
      [onChange]
    );

    const editor = useEditor({
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
        }),
        Link.configure({
          openOnClick: false,
          HTMLAttributes: { class: "text-blue-600 underline" },
        }),
        TextAlign.configure({
          types: ["heading", "paragraph"],
        }),
        UnderlineExtension,
        ImageExtension.configure({
          HTMLAttributes: { class: "max-w-full h-auto" },
        }),
        Placeholder.configure({
          placeholder: "Start writing your email content here...",
        }),
        MergeVariable,
      ],
      content: htmlToTiptap(value),
      onUpdate: handleUpdate,
      editorProps: {
        attributes: {
          class:
            "prose prose-sm max-w-none min-h-[400px] px-4 py-3 focus:outline-none",
        },
      },
    });

    // Sync external value changes (e.g., switching from source mode)
    useEffect(() => {
      if (!editor) return;
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      const currentHtml = tiptapToHtml(editor.getHTML());
      if (currentHtml !== value) {
        editor.commands.setContent(htmlToTiptap(value));
      }
    }, [editor, value]);

    // Expose imperative methods to parent
    useImperativeHandle(
      ref,
      () => ({
        insertMergeVariable(key: string) {
          if (!editor) return;
          editor
            .chain()
            .focus()
            .insertContent({
              type: "mergeVariable",
              attrs: { key },
            })
            .run();
        },
        getEditor() {
          return editor;
        },
      }),
      [editor]
    );

    return (
      <div className="rounded-md border bg-card overflow-hidden">
        <EditorToolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
    );
  }
);
