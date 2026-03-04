import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

export function KpiCard({
  title,
  value,
  description,
  icon,
  className,
}: KpiCardProps) {
  // Detect if value looks like a currency/financial figure
  const isFinancial = typeof value === "string" && (value.includes("$") || value.includes("%"));

  return (
    <Card className={cn("rounded-xl", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] uppercase tracking-[0.05em] font-semibold text-muted-foreground">
            {title}
          </span>
          {icon && <div className="text-muted-foreground">{icon}</div>}
        </div>
        <div className={cn(
          "text-[22px] md:text-[26px] font-bold tracking-[-0.04em] text-foreground",
          isFinancial && "font-mono"
        )}>
          {value}
        </div>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
