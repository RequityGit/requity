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
    <div className={cn("card-cinematic", className)}>
      <div className="flex items-start justify-between">
        <p className="text-xs font-body font-semibold uppercase tracking-wider text-surface-muted">
          {title}
        </p>
        {icon && <div className="text-gold/60">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-mono font-semibold text-surface-white tabular-nums">
        {value}
      </div>
      {description && (
        <p className="text-xs text-surface-gray font-body mt-2">
          {description}
        </p>
      )}
    </div>
  );
}
