"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { SectionTypeSelect } from "./SectionTypeSelect";
import { TermTableEditor } from "./section-editors/TermTableEditor";
import { BulletListEditor } from "./section-editors/BulletListEditor";
import { ParagraphEditor } from "./section-editors/ParagraphEditor";
import { SignatureEditor } from "./section-editors/SignatureEditor";
import { DividerEditor } from "./section-editors/DividerEditor";
import type { SectionBlock, MergeFieldDefinition } from "../styled-doc-parts/types";

const TYPE_BADGE_STYLES: Record<string, string> = {
  term_table: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  bullet_list: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300",
  paragraph: "bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
  signature: "bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
  divider: "bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300",
};

const TYPE_LABELS: Record<string, string> = {
  term_table: "Term Table",
  bullet_list: "Bullet List",
  paragraph: "Paragraph",
  signature: "Signature",
  divider: "Divider",
};

function getSectionTitle(section: SectionBlock): string {
  if ("title" in section && section.title) return section.title;
  return TYPE_LABELS[section.type] ?? section.type;
}

interface SectionsEditorProps {
  sections: SectionBlock[];
  mergeFields: MergeFieldDefinition[];
  onChange: (sections: SectionBlock[]) => void;
}

export function SectionsEditor({
  sections,
  mergeFields,
  onChange,
}: SectionsEditorProps) {
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({});

  const toggleOpen = (index: number) => {
    setOpenSections((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const updateSection = (index: number, section: SectionBlock) => {
    const updated = [...sections];
    updated[index] = section;
    onChange(updated);
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    // Swap open state
    setOpenSections((prev) => {
      const next = { ...prev };
      const temp = next[index];
      next[index] = next[newIndex];
      next[newIndex] = temp;
      return next;
    });

    onChange(updated);
  };

  const removeSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const addSection = (section: SectionBlock) => {
    onChange([...sections, section]);
    setOpenSections((prev) => ({ ...prev, [sections.length]: true }));
  };

  function renderEditor(section: SectionBlock, index: number) {
    switch (section.type) {
      case "term_table":
        return (
          <TermTableEditor
            section={section}
            mergeFields={mergeFields}
            onChange={(s) => updateSection(index, s)}
          />
        );
      case "bullet_list":
        return (
          <BulletListEditor
            section={section}
            onChange={(s) => updateSection(index, s)}
          />
        );
      case "paragraph":
        return (
          <ParagraphEditor
            section={section}
            mergeFields={mergeFields}
            onChange={(s) => updateSection(index, s)}
          />
        );
      case "signature":
        return (
          <SignatureEditor
            section={section}
            mergeFields={mergeFields}
            onChange={(s) => updateSection(index, s)}
          />
        );
      case "divider":
        return (
          <DividerEditor
            section={section}
            onChange={(s) => updateSection(index, s)}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div className="space-y-3">
      {sections.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
          No sections yet. Add your first section below.
        </div>
      )}

      {sections.map((section, i) => (
        <Collapsible
          key={i}
          open={openSections[i] ?? false}
          onOpenChange={() => toggleOpen(i)}
        >
          <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors">
              <GripVertical size={14} className="text-muted-foreground shrink-0" />
              <Badge
                variant="outline"
                className={`text-[10px] shrink-0 ${TYPE_BADGE_STYLES[section.type] ?? ""}`}
              >
                {TYPE_LABELS[section.type]}
              </Badge>
              <CollapsibleTrigger className="flex-1 text-left text-sm font-medium truncate">
                {getSectionTitle(section)}
              </CollapsibleTrigger>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSection(i, -1);
                  }}
                  disabled={i === 0}
                >
                  <ChevronUp size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSection(i, 1);
                  }}
                  disabled={i === sections.length - 1}
                >
                  <ChevronDown size={12} />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete section</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{getSectionTitle(section)}&quot;?
                        This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => removeSection(i)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
            <CollapsibleContent className="px-3 pb-3 pt-1 border-t">
              {renderEditor(section, i)}
            </CollapsibleContent>
          </div>
        </Collapsible>
      ))}

      <SectionTypeSelect onAdd={addSection} />
    </div>
  );
}
