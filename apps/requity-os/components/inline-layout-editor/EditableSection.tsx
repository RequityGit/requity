"use client";

import React, { useCallback } from "react";
import { ChevronUp, ChevronDown, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInlineLayout } from "./InlineLayoutContext";
import { SectionConfigPopover } from "./SectionConfigPopover";
import type { LayoutSection } from "@/hooks/useDealLayout";

interface EditableSectionProps {
  section: LayoutSection;
  sectionIndex: number;
  totalSections: number;
  children: React.ReactNode;
}

export function EditableSection({
  section,
  sectionIndex,
  totalSections,
  children,
}: EditableSectionProps) {
  const {
    state,
    moveSection,
    deleteSection: deleteSectionFromState,
    updateSectionConfig,
    toggleSectionVisibility,
  } = useInlineLayout();

  const handleSectionDeleted = useCallback((sectionId: string) => {
    deleteSectionFromState(sectionId);
  }, [deleteSectionFromState]);

  const handleSectionUpdated = useCallback((sectionId: string, label: string, icon: string) => {
    updateSectionConfig(sectionId, label, icon);
  }, [updateSectionConfig]);

  const handleVisibilityToggled = useCallback((sectionId: string, visible: boolean) => {
    toggleSectionVisibility(sectionId, visible);
  }, [toggleSectionVisibility]);

  if (!state.isEditing) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        "relative group/section rounded-xl border-2 border-dashed border-transparent hover:border-primary/30 transition-colors",
        !section.is_visible && "opacity-40"
      )}
    >
      {/* Section controls - top-left overlay */}
      <div className="absolute -top-3 left-3 z-10 flex items-center gap-0.5 opacity-0 group-hover/section:opacity-100 transition-opacity">
        <SectionConfigPopover
          sectionId={section.id}
          sectionLabel={section.section_label}
          sectionIcon={section.section_icon}
          isLocked={section.is_locked}
          isVisible={section.is_visible}
          isTempSection={section.id.startsWith("temp_")}
          onSectionDeleted={handleSectionDeleted}
          onSectionUpdated={handleSectionUpdated}
          onVisibilityToggled={handleVisibilityToggled}
        >
          <button
            className={cn(
              "flex items-center gap-1 rounded-md bg-card border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors cursor-pointer shadow-sm",
              !section.is_visible && "line-through"
            )}
            title="Click to edit section"
          >
            {section.section_label}
          </button>
        </SectionConfigPopover>
        <button
          onClick={() => moveSection(section.id, sectionIndex - 1)}
          disabled={sectionIndex === 0}
          className="flex items-center justify-center h-6 w-6 rounded-md bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
          title="Move section up"
        >
          <ChevronUp className="h-3 w-3" />
        </button>
        <button
          onClick={() => moveSection(section.id, sectionIndex + 1)}
          disabled={sectionIndex >= totalSections - 1}
          className="flex items-center justify-center h-6 w-6 rounded-md bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-sm"
          title="Move section down"
        >
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>
      {/* Always-visible hidden badge (no hover needed) */}
      {!section.is_visible && (
        <div className="absolute top-2 right-3 z-10 flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/30 px-2 py-0.5">
          <EyeOff className="h-3 w-3 text-amber-500" />
          <span className="text-[10px] font-medium text-amber-500">Hidden</span>
        </div>
      )}
      {children}
    </div>
  );
}
