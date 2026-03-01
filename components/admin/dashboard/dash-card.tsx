import { cn } from "@/lib/utils";

interface DashCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function DashCard({ children, className, hover = false }: DashCardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg p-[18px] border border-navy/[0.08] shadow-[0_1px_3px_rgba(11,25,41,0.06),0_4px_14px_rgba(11,25,41,0.04)]",
        hover && "dash-card-hover cursor-pointer hover:border-navy/[0.13]",
        className
      )}
    >
      {children}
    </div>
  );
}
