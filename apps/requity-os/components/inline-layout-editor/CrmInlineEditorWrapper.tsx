"use client";

/**
 * CrmInlineEditorWrapper
 *
 * Wraps CRM detail pages (contacts, companies) with the inline layout editor.
 * Provides an "Edit Layout" button (super_admin only) that activates the
 * InlineLayoutProvider + InlineLayoutToolbar for in-page layout editing.
 *
 * The wrapper uses usePageLayout() to fetch layout data from page_layout_sections
 * and page_layout_fields, then passes it to the InlineLayoutProvider for editing.
 */

import React, { useState, useCallback } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineLayoutProvider, useInlineLayout } from "./InlineLayoutContext";
import { InlineLayoutToolbar } from "./InlineLayoutToolbar";
import { usePageLayout } from "@/hooks/usePageLayout";

interface CrmInlineEditorWrapperProps {
  pageType: string;
  isSuperAdmin: boolean;
  children: React.ReactNode;
}

function InnerWrapper({
  pageType,
  isSuperAdmin,
  children,
}: CrmInlineEditorWrapperProps) {
  const layout = usePageLayout(pageType);
  const { state, startEditing } = useInlineLayout();

  const handleEditLayout = useCallback(() => {
    startEditing(layout.sections, layout.fields);
  }, [startEditing, layout.sections, layout.fields]);

  const handleSaveComplete = useCallback(() => {
    layout.refetch();
  }, [layout]);

  return (
    <>
      {/* Toolbar (only visible when editing) */}
      <InlineLayoutToolbar
        onSaveComplete={handleSaveComplete}
        tabs={layout.tabs}
        pageType={pageType}
      />

      {/* Edit Layout button (only for super_admin, only when not editing) */}
      {isSuperAdmin && !state.isEditing && (
        <div className="flex justify-end mb-3">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-[11px] gap-1.5 text-muted-foreground"
            onClick={handleEditLayout}
            disabled={layout.loading}
          >
            <Pencil className="h-3 w-3" />
            Edit Layout
          </Button>
        </div>
      )}

      {children}
    </>
  );
}

export function CrmInlineEditorWrapper({
  pageType,
  isSuperAdmin,
  children,
}: CrmInlineEditorWrapperProps) {
  return (
    <InlineLayoutProvider pageType={pageType}>
      <InnerWrapper pageType={pageType} isSuperAdmin={isSuperAdmin}>
        {children}
      </InnerWrapper>
    </InlineLayoutProvider>
  );
}
