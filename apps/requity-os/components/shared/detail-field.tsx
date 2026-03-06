import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// DetailField — shared label/value display component
// Replaces duplicate inline definitions across fund pages, quote detail, etc.
// ---------------------------------------------------------------------------

interface DetailFieldProps {
  label: string;
  value: React.ReactNode;
  /** Apply monospace font (auto-detected for $ and % strings when not set) */
  mono?: boolean;
  /** Apply capitalize to the value */
  capitalize?: boolean;
  className?: string;
}

/**
 * Vertical label/value pair — use in grid layouts for detail/summary sections.
 *
 * ```tsx
 * <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
 *   <DetailField label="Loan Amount" value={formatCurrency(amount)} />
 *   <DetailField label="Interest Rate" value="8.5%" />
 * </div>
 * ```
 */
export function DetailField({
  label,
  value,
  mono,
  capitalize = true,
  className,
}: DetailFieldProps) {
  const isFinancial =
    mono ??
    (typeof value === "string" &&
      (value.includes("$") || value.includes("%")));

  return (
    <div className={className}>
      <p className="text-[11px] md:text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-medium",
          capitalize && "capitalize",
          isFinancial && "num"
        )}
      >
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DateField — DetailField specialized for formatted dates
// ---------------------------------------------------------------------------

interface DateFieldProps {
  label: string;
  value: string | null;
  formatFn?: (v: string | null) => string;
  className?: string;
}

export function DateField({
  label,
  value,
  formatFn,
  className,
}: DateFieldProps) {
  const formatted = formatFn ? formatFn(value) : (value ?? "—");
  return (
    <div className={className}>
      <p className="text-[11px] md:text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium num">{formatted}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldRow — horizontal label/value with bottom border (for drawer/detail views)
// ---------------------------------------------------------------------------

interface FieldRowProps {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  danger?: boolean;
  className?: string;
}

export function FieldRow({
  label,
  value,
  mono,
  danger,
  className,
}: FieldRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between py-2.5 border-b",
        className
      )}
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-sm text-right",
          danger ? "text-destructive" : "text-foreground",
          mono ? "num font-medium" : "font-medium"
        )}
      >
        {value || "—"}
      </span>
    </div>
  );
}
