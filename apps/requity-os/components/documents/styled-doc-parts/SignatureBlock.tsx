import type { SignatureSection } from "./types";
import { SectionHeader } from "./SectionHeader";

interface SignatureBlockProps {
  section: SignatureSection;
  resolve: (field?: string, value?: string, suffix?: string) => string;
}

export function SignatureBlock({ section, resolve }: SignatureBlockProps) {
  return (
    <div>
      {section.title && <SectionHeader>{section.title}</SectionHeader>}
      <div className="signature-block-container pt-6 pb-3 px-4 flex gap-12 flex-wrap">
        {section.blocks.map((block, i) => {
          const name = block.name_field ? resolve(block.name_field) : "";
          return (
            <div key={i} className="flex-1 min-w-[180px]">
              <div className="border-b border-foreground w-full h-8 mb-2" />
              <div className="text-xs font-semibold text-foreground">{block.role}</div>
              {name && (
                <div className="text-xs text-muted-foreground mt-0.5">{name}</div>
              )}
              {block.show_date_line && (
                <div
                  className="text-muted-foreground mt-3"
                  style={{ fontSize: "11px" }}
                >
                  Date: _______________
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
