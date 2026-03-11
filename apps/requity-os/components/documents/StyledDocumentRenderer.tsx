"use client";

import { cn } from "@/lib/utils";
import type { StyledLayout, SectionBlock } from "./styled-doc-parts/types";
import { DocumentHeader } from "./styled-doc-parts/DocumentHeader";
import { TitleBanner } from "./styled-doc-parts/TitleBanner";
import { TermTableBlock } from "./styled-doc-parts/TermTableBlock";
import { BulletListBlock } from "./styled-doc-parts/BulletListBlock";
import { ParagraphBlock } from "./styled-doc-parts/ParagraphBlock";
import { SignatureBlock } from "./styled-doc-parts/SignatureBlock";
import { DividerBlock } from "./styled-doc-parts/DividerBlock";
import { DisclaimerBlock } from "./styled-doc-parts/DisclaimerBlock";
import { DocumentFooter } from "./styled-doc-parts/DocumentFooter";
import "./styled-document-print.css";

interface StyledDocumentRendererProps {
  layout: StyledLayout;
  mergeData: Record<string, string>;
  className?: string;
}

export function StyledDocumentRenderer({
  layout,
  mergeData,
  className,
}: StyledDocumentRendererProps) {
  const resolve = (field?: string, value?: string, suffix?: string): string => {
    const raw = field ? (mergeData[field] ?? "") : (value ?? "");
    return suffix && raw ? `${raw}${suffix}` : raw;
  };

  const interpolate = (text: string): string => {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => mergeData[key] ?? "");
  };

  function renderSection(section: SectionBlock, index: number) {
    switch (section.type) {
      case "term_table":
        return <TermTableBlock key={index} section={section} resolve={resolve} />;
      case "bullet_list":
        return <BulletListBlock key={index} section={section} />;
      case "paragraph":
        return (
          <ParagraphBlock key={index} section={section} interpolate={interpolate} />
        );
      case "signature":
        return <SignatureBlock key={index} section={section} resolve={resolve} />;
      case "divider":
        return <DividerBlock key={index} section={section} />;
      default:
        return null;
    }
  }

  return (
    <div
      className={cn(
        "styled-doc-container max-w-[800px] mx-auto bg-card border rounded-lg overflow-hidden font-sans",
        className
      )}
    >
      <DocumentHeader header={layout.header} />

      <div className="px-7 -mt-5 mb-0">
        <TitleBanner banner={layout.title_banner} mergeData={mergeData} />
      </div>

      <div className="px-7 pb-7">
        {layout.sections.map((section, i) => renderSection(section, i))}

        {layout.disclaimer && <DisclaimerBlock disclaimer={layout.disclaimer} />}

        <DocumentFooter footer={layout.footer} />
      </div>
    </div>
  );
}
