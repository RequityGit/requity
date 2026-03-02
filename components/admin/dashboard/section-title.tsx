import { ChevronRight } from "lucide-react";

interface SectionTitleProps {
  children: React.ReactNode;
  sub?: string;
  right?: React.ReactNode;
}

export function SectionTitle({ children, sub, right }: SectionTitleProps) {
  return (
    <div className="flex justify-between items-start mb-2.5">
      <div>
        <h2 className="text-lg font-semibold text-foreground leading-tight">
          {children}
        </h2>
        {sub && (
          <p className="text-[10.5px] text-dash-text-mut mt-0.5">
            {sub}
          </p>
        )}
      </div>
      {right}
    </div>
  );
}

interface ViewAllButtonProps {
  label?: string;
  href?: string;
}

export function ViewAllButton({ label = "View all", href }: ViewAllButtonProps) {
  const Tag = href ? "a" : "button";
  return (
    <Tag
      {...(href ? { href } : {})}
      className="bg-transparent border-none cursor-pointer text-[10.5px] font-semibold text-dash-text-faint hover:text-gold flex items-center gap-0.5 transition-colors duration-150 p-0"
    >
      {label} <ChevronRight size={11} />
    </Tag>
  );
}
