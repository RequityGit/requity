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

  // Loan stages
  application: "bg-gray-100 text-gray-800 border-gray-200",
  processing: "bg-blue-100 text-blue-800 border-blue-200",
  underwriting: "bg-indigo-100 text-indigo-800 border-indigo-200",
  conditional_approval: "bg-yellow-100 text-yellow-800 border-yellow-200",
  clear_to_close: "bg-teal-100 text-teal-800 border-teal-200",
  closing: "bg-purple-100 text-purple-800 border-purple-200",
  servicing: "bg-green-100 text-green-800 border-green-200",
  payoff: "bg-emerald-100 text-emerald-800 border-emerald-200",
  default: "bg-red-100 text-red-800 border-red-200",
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
