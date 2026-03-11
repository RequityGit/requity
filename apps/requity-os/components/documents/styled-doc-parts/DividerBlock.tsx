import type { DividerSection } from "./types";

interface DividerBlockProps {
  section: DividerSection;
}

export function DividerBlock({ section }: DividerBlockProps) {
  if (section.style === "space") {
    return <div className="h-8" />;
  }
  return <hr className="border-t my-6" />;
}
