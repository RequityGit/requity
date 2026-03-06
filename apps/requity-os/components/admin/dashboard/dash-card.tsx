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
        "bg-card rounded-lg p-[18px] border border-border shadow-sm",
        hover && "dash-card-hover cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
