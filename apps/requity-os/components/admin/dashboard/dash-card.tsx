import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function DashCard({ children, className, hover = false }: DashCardProps) {
  return (
    <Card
      className={cn(
        "rounded-lg p-[18px] shadow-sm",
        hover && "dash-card-hover cursor-pointer",
        className
      )}
    >
      {children}
    </Card>
  );
}
