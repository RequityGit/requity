import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card className={cn("", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 md:p-6 md:pb-2">
        <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
        <div className={cn(
          "text-xl md:text-2xl font-bold text-foreground",
          isFinancial && "font-mono"
        )}>
          {value}
        </div>
        {description && (
          <p className="text-[11px] md:text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
