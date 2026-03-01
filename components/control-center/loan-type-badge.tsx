import { cn } from "@/lib/utils";

interface LoanTypeBadgeProps {
  type: string;
  active: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  commercial: "COM",
  rtl: "RTL",
  dscr: "DSCR",
  guc: "GUC",
  transactional: "TRAN",
};

export function LoanTypeBadge({ type, active }: LoanTypeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold",
        active
          ? "bg-teal-100 text-teal-800"
          : "bg-gray-50 text-gray-300"
      )}
    >
      {TYPE_LABELS[type] || type.toUpperCase()}
    </span>
  );
}
