import type { BulletListSection } from "./types";
import { SectionHeader } from "./SectionHeader";

interface BulletListBlockProps {
  section: BulletListSection;
}

export function BulletListBlock({ section }: BulletListBlockProps) {
  return (
    <div>
      <SectionHeader>{section.title}</SectionHeader>
      <div className="py-3 px-4">
        {section.items.map((item, i) => (
          <div
            key={i}
            className="text-foreground flex items-start gap-2 py-0.5"
            style={{ fontSize: "12px", lineHeight: 1.7 }}
          >
            <span
              className="bg-muted-foreground shrink-0 rounded-full"
              style={{ width: "4px", height: "4px", marginTop: "7px" }}
            />
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}
