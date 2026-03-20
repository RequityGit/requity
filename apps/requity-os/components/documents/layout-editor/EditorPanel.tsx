"use client";

import { ChevronDown } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { HeaderEditor } from "./HeaderEditor";
import { TitleBannerEditor } from "./TitleBannerEditor";
import { SectionsEditor } from "./SectionsEditor";
import { DisclaimerEditor } from "./DisclaimerEditor";
import { FooterEditor } from "./FooterEditor";
import type { StyledLayout, MergeFieldDefinition } from "../styled-doc-parts/types";

interface EditorPanelProps {
  layout: StyledLayout;
  mergeFields: MergeFieldDefinition[];
  onChange: (layout: StyledLayout) => void;
}

function EditorSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <div className="border rounded-lg">
        <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/50 transition-colors">
          <span className="text-sm font-semibold">{title}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-4 pb-4 space-y-4">
          {children}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export function EditorPanel({ layout, mergeFields, onChange }: EditorPanelProps) {
  return (
    <div className="space-y-3 p-4">
      <EditorSection title="Header" defaultOpen={false}>
        <HeaderEditor
          header={layout.header}
          onChange={(header) => onChange({ ...layout, header })}
        />
      </EditorSection>

      <EditorSection title="Title Banner" defaultOpen={false}>
        <TitleBannerEditor
          banner={layout.title_banner}
          mergeFields={mergeFields}
          onChange={(title_banner) => onChange({ ...layout, title_banner })}
        />
      </EditorSection>

      <EditorSection title="Sections" defaultOpen={true}>
        <SectionsEditor
          sections={layout.sections}
          mergeFields={mergeFields}
          onChange={(sections) => onChange({ ...layout, sections })}
        />
      </EditorSection>

      <EditorSection title="Disclaimer" defaultOpen={false}>
        <DisclaimerEditor
          disclaimer={layout.disclaimer}
          onChange={(disclaimer) => onChange({ ...layout, disclaimer })}
        />
      </EditorSection>

      <EditorSection title="Footer" defaultOpen={false}>
        <FooterEditor
          footer={layout.footer}
          onChange={(footer) => onChange({ ...layout, footer })}
        />
      </EditorSection>
    </div>
  );
}
