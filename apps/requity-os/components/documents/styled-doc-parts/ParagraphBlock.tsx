import type { ParagraphSection } from "./types";
import { SectionHeader } from "./SectionHeader";

interface ParagraphBlockProps {
  section: ParagraphSection;
  interpolate: (text: string) => string;
}

export function ParagraphBlock({ section, interpolate }: ParagraphBlockProps) {
  return (
    <div>
      {section.title && <SectionHeader>{section.title}</SectionHeader>}
      <div className="py-3 px-4">
        <p
          className="text-foreground leading-relaxed"
          style={{ fontSize: "13px", lineHeight: 1.7, margin: 0 }}
        >
          {interpolate(section.text)}
        </p>
      </div>
    </div>
  );
}
