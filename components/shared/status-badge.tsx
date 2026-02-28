import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  // Capital calls / payments
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  paid: "bg-green-100 text-green-800 border-green-200",
  overdue: "bg-red-100 text-red-800 border-red-200",
  posted: "bg-green-100 text-green-800 border-green-200",
  reversed: "bg-gray-100 text-gray-800 border-gray-200",
  nsf: "bg-red-100 text-red-800 border-red-200",

  // Commitments
  active: "bg-green-100 text-green-800 border-green-200",
  partially_called: "bg-blue-100 text-blue-800 border-blue-200",
  fully_called: "bg-purple-100 text-purple-800 border-purple-200",
  redeemed: "bg-gray-100 text-gray-800 border-gray-200",

  // Draw requests
  submitted: "bg-yellow-100 text-yellow-800 border-yellow-200",
  under_review: "bg-blue-100 text-blue-800 border-blue-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  funded: "bg-green-100 text-green-800 border-green-200",
  denied: "bg-red-100 text-red-800 border-red-200",

  // Funds
  open: "bg-green-100 text-green-800 border-green-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
  fully_deployed: "bg-blue-100 text-blue-800 border-blue-200",

  // Loan pipeline stages
  lead: "bg-slate-100 text-slate-800 border-slate-200",
  application: "bg-blue-100 text-blue-800 border-blue-200",
  processing: "bg-indigo-100 text-indigo-800 border-indigo-200",
  underwriting: "bg-purple-100 text-purple-800 border-purple-200",
  clear_to_close: "bg-teal-100 text-teal-800 border-teal-200",
  servicing: "bg-cyan-100 text-cyan-800 border-cyan-200",
  payoff: "bg-gray-100 text-gray-800 border-gray-200",
  default: "bg-red-100 text-red-800 border-red-200",
  reo: "bg-orange-100 text-orange-800 border-orange-200",
  paid_off: "bg-gray-100 text-gray-600 border-gray-200",

  // Priority
  hot: "bg-red-100 text-red-800 border-red-200",
  normal: "bg-slate-100 text-slate-700 border-slate-200",
  on_hold: "bg-amber-100 text-amber-800 border-amber-200",

  // Documents
  rejected: "bg-red-100 text-red-800 border-red-200",
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = status.replace(/_/g, " ");

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize text-xs font-medium",
        statusStyles[status] || "bg-gray-100 text-gray-800 border-gray-200",
        className
      )}
    >
      {label}
    </Badge>
  );
}
