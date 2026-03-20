"use client";

import { useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ParagraphSection, MergeFieldDefinition } from "../../styled-doc-parts/types";

interface ParagraphEditorProps {
  section: ParagraphSection;
  mergeFields: MergeFieldDefinition[];
  onChange: (section: ParagraphSection) => void;
}

export function ParagraphEditor({
  section,
  mergeFields,
  onChange,
}: ParagraphEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insertField = (key: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const before = section.text.slice(0, start);
    const after = section.text.slice(end);
    const newText = `${before}{{${key}}}${after}`;
    onChange({ ...section, text: newText });
    requestAnimationFrame(() => {
      const pos = start + key.length + 4;
      el.setSelectionRange(pos, pos);
      el.focus();
    });
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">Title (optional)</Label>
        <Input
          value={section.title ?? ""}
          onChange={(e) => onChange({ ...section, title: e.target.value || undefined })}
          placeholder="Section title"
          className="h-8 text-xs mt-1"
        />
      </div>

      <div>
        <Label className="text-xs">Text</Label>
        <Textarea
          ref={textareaRef}
          value={section.text}
          onChange={(e) => onChange({ ...section, text: e.target.value })}
          placeholder="Enter paragraph text. Use {{field_name}} to insert merge field values."
          className="text-xs mt-1 min-h-[100px]"
        />
        <p className="text-[10px] text-muted-foreground mt-1">
          Use {"{{field_name}}"} to insert merge field values
        </p>
      </div>

      {mergeFields.length > 0 && (
        <div>
          <Label className="text-[10px] text-muted-foreground">Insert field:</Label>
          <div className="flex flex-wrap gap-1 mt-1">
            {mergeFields.slice(0, 12).map((field) => (
              <button
                key={field.key}
                type="button"
                onClick={() => insertField(field.key)}
                className="text-[10px] px-2 py-0.5 rounded-full border bg-muted hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
              >
                {field.key}
              </button>
            ))}
            {mergeFields.length > 12 && (
              <span className="text-[10px] text-muted-foreground px-1 py-0.5">
                +{mergeFields.length - 12} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
