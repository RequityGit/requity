"use client";

/**
 * CrmInlineEditorWrapper
 *
 * Wraps CRM detail pages (contacts, companies) with the inline layout editor.
 * The wrapper uses usePageLayout() to fetch layout data from page_layout_sections
 * and page_layout_fields, then passes it to the InlineLayoutProvider.
 */

import React from "react";
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
  children,
}: Omit<CrmInlineEditorWrapperProps, "isSuperAdmin">) {
  const layout = usePageLayout(pageType);

  return (
    <>
      <InlineLayoutToolbar
        onSaveComplete={() => layout.refetch()}
        tabs={layout.tabs}
        pageType={pageType}
      />
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
      <InnerWrapper pageType={pageType}>
        {children}
      </InnerWrapper>
    </InlineLayoutProvider>
  );
}
