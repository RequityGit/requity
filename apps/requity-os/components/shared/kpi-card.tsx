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
  return (
    <Card className={cn("rounded-xl", className)}>
      <CardContent className="!p-0 rq-stat-card">
        <span className="rq-stat-card-title">{title}</span>
        {icon && <div className="rq-stat-card-icon">{icon}</div>}
        <div className="rq-stat-card-value">{value}</div>
        {description && (
          <p className="text-[11px] text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}
