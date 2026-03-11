"use client";

import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, Save, Eye, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { StyledDocumentRenderer } from "../StyledDocumentRenderer";
import { EditorPanel } from "./EditorPanel";
import type { StyledLayout, MergeFieldDefinition } from "../styled-doc-parts/types";

const DEFAULT_LAYOUT: StyledLayout = {
  header: {
    entity: "Requity Lending, LLC",
    subtitle: "",
    address: "4023 N Armenia Ave, Ste 300, Tampa, FL 33607",
    phone: "(813) 535-7535",
    email: "lending@requitygroup.com",
    website: "requitylending.com",
    show_logo: true,
  },
  title_banner: {
    title: "",
    subtitle: "",
  },
  sections: [],
  footer: {
    entity: "Requity Lending, LLC",
    nmls: "2560918",
    confidential: true,
    generated_by: "Generated via RequityOS",
  },
};

interface LayoutEditorProps {
  template: {
    id: string;
    name: string;
    styled_layout: StyledLayout | null;
    merge_fields: MergeFieldDefinition[];
  };
  onBack: () => void;
  /** Optional action element for switching editor modes */
  switchAction?: React.ReactNode;
}

function generateSampleData(
  mergeFields: MergeFieldDefinition[]
): Record<string, string> {
  const samples: Record<string, string> = {};
  for (const field of mergeFields) {
    switch (field.format) {
      case "currency":
        samples[field.key] = "$1,000,000";
        break;
      case "percentage":
        samples[field.key] = "10.00%";
        break;
      case "date":
        samples[field.key] = "March 10, 2026";
        break;
      default:
        samples[field.key] = field.label;
    }
  }
  return samples;
}

export function LayoutEditor({ template, onBack, switchAction }: LayoutEditorProps) {
  const [layout, setLayout] = useState<StyledLayout>(
    template.styled_layout ?? DEFAULT_LAYOUT
  );
  const [savedJson, setSavedJson] = useState(
    JSON.stringify(template.styled_layout ?? DEFAULT_LAYOUT)
  );
  const [saving, setSaving] = useState(false);
  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");

  const isDirty = JSON.stringify(layout) !== savedJson;

  const sampleData = useMemo(
    () => generateSampleData(template.merge_fields),
    [template.merge_fields]
  );

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const supabase = createClient();
      // styled_layout column exists in DB but not yet in generated TypeScript types
      const { error } = await supabase
        .from("document_templates")
        .update({
          styled_layout: layout,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq("id", template.id);

      if (error) {
        toast.error(`Failed to save layout: ${error.message}`);
      } else {
        setSavedJson(JSON.stringify(layout));
        toast.success("Layout saved");
      }
    } catch (err) {
      toast.error("Failed to save layout");
    } finally {
      setSaving(false);
    }
  }, [layout, template.id]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onBack}>
            <ArrowLeft size={14} />
          </Button>
          <span className="text-sm font-semibold truncate">{template.name}</span>
          <Badge variant="outline" className="text-[10px] shrink-0">
            Layout Editor
          </Badge>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {switchAction}
          {isDirty && (
            <span className="text-[11px] text-amber-600 dark:text-amber-400">
              Unsaved changes
            </span>
          )}
          {/* Mobile toggle */}
          <div className="flex xl:hidden">
            <Button
              variant={mobileView === "edit" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs rounded-r-none"
              onClick={() => setMobileView("edit")}
            >
              <Pencil size={12} className="mr-1" />
              Edit
            </Button>
            <Button
              variant={mobileView === "preview" ? "secondary" : "ghost"}
              size="sm"
              className="h-7 text-xs rounded-l-none"
              onClick={() => setMobileView("preview")}
            >
              <Eye size={12} className="mr-1" />
              Preview
            </Button>
          </div>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleSave}
            disabled={saving || !isDirty}
          >
            <Save size={12} className="mr-1" />
            {saving ? "Saving..." : "Save Layout"}
          </Button>
        </div>
      </div>

      {/* Split pane */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor panel */}
        <div
          className={`${
            mobileView === "edit" ? "flex" : "hidden"
          } xl:flex flex-col w-full xl:w-[45%] xl:min-w-[400px] xl:max-w-[560px] overflow-y-auto border-r`}
        >
          <EditorPanel
            layout={layout}
            mergeFields={template.merge_fields}
            onChange={setLayout}
          />
        </div>

        {/* Preview panel */}
        <div
          className={`${
            mobileView === "preview" ? "flex" : "hidden"
          } xl:flex flex-col flex-1 overflow-y-auto bg-muted/50`}
        >
          <div className="p-6 flex justify-center">
            <StyledDocumentRenderer
              layout={layout}
              mergeData={sampleData}
              className="shadow-lg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
