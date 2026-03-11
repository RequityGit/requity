import { cn } from "@/lib/utils";
import type { TermTableSection } from "./types";
import { SectionHeader } from "./SectionHeader";

interface TermTableBlockProps {
  section: TermTableSection;
  resolve: (field?: string, value?: string, suffix?: string) => string;
}

function TermRowItem({
  label,
  displayValue,
  highlight,
}: {
  label: string;
  displayValue: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "term-row-border flex justify-between items-start py-2.5 px-4 border-b gap-6",
        highlight && "term-row-highlight bg-muted"
      )}
    >
      <span
        className="text-muted-foreground min-w-[180px] shrink-0"
        style={{ fontSize: "13px", fontWeight: 500, letterSpacing: "0.01em" }}
      >
        {label}
      </span>
      <span
        className="num text-foreground text-right"
        style={{ fontSize: "13px", fontWeight: 600 }}
      >
        {displayValue}
      </span>
    </div>
  );
}

export function TermTableBlock({ section, resolve }: TermTableBlockProps) {
  return (
    <div>
      <SectionHeader>{section.title}</SectionHeader>
      {section.rows.map((row, i) => (
        <TermRowItem
          key={i}
          label={row.label}
          displayValue={resolve(row.field, row.value, row.suffix)}
          highlight={row.highlight}
        />
      ))}
    </div>
  );
}
