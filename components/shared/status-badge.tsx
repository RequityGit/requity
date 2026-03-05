import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type DotColor = "green" | "yellow" | "red" | "blue" | "purple" | "amber" | "teal" | "cyan" | "orange" | "slate" | "indigo" | "gray";

const dotColorMap: Record<DotColor, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-500",
  red: "bg-red-500",
  blue: "bg-blue-500",
  purple: "bg-purple-500",
  amber: "bg-amber-500",
  teal: "bg-teal-500",
  cyan: "bg-cyan-500",
  orange: "bg-orange-500",
  slate: "bg-slate-400",
  indigo: "bg-indigo-500",
  gray: "bg-gray-400",
};

const statusColorMap: Record<string, DotColor> = {
  // Contributions / payments
  pending: "yellow",
  paid: "green",
  overdue: "red",
  posted: "green",
  reversed: "gray",
  nsf: "red",

  // Commitments
  active: "green",
  partially_called: "blue",
  fully_called: "purple",
  redeemed: "gray",

  // Portal activation
  link_sent: "blue",
  activated: "green",

  // Draw requests
  draft: "gray",
  submitted: "yellow",
  inspection_ordered: "amber",
  inspection_complete: "teal",
  under_review: "blue",
  approved: "green",
  funded: "green",
  denied: "red",
  partially_approved: "amber",
  withdrawn: "gray",
  completed: "green",

  // Funds
  open: "green",
  closed: "gray",
  fully_deployed: "blue",
  fundraising: "blue",
  winding_down: "amber",
  terminated: "red",

  // Loan pipeline stages
  lead: "slate",
  application: "blue",
  processing: "indigo",
  underwriting: "purple",
  clear_to_close: "teal",
  servicing: "cyan",
  payoff: "gray",
  default: "red",
  reo: "orange",
  paid_off: "gray",
  note_sold: "gray",

  // Priority
  hot: "red",
  normal: "slate",
  on_hold: "amber",

  // Documents / Conditions
  rejected: "red",
  not_requested: "gray",
  not_applicable: "gray",
  requested: "blue",
  received: "indigo",
  waived: "slate",

  // Servicing statuses (Title Case)
  Active: "green",
  "Paid Off": "gray",
  Sold: "blue",
  "In Default": "red",
  Pending: "yellow",
  Funded: "green",
  Original: "slate",
  Reversal: "amber",
  Dutch: "purple",
  "Non Dutch": "slate",

  // CRM
  converted: "green",
  lost: "red",
  inactive: "gray",
  do_not_contact: "red",

  // Equity deal stages
  new_deals: "slate",
  underwritten_needs_review: "blue",
  offer_placed: "purple",
  under_contract: "amber",
  closed_won: "green",
  closed_lost: "red",
};

interface StatusBadgeProps {
  status: string | null | undefined;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  if (!status) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "capitalize text-xs font-medium gap-1.5",
          className
        )}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-gray-300 flex-shrink-0" />
        —
      </Badge>
    );
  }

  const label = status.replace(/_/g, " ");
  const dotColor = statusColorMap[status] || "gray";
  const dotClass = dotColorMap[dotColor];

  return (
    <Badge
      variant="outline"
      className={cn(
        "capitalize text-xs font-medium gap-1.5",
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0", dotClass)} />
      {label}
    </Badge>
  );
}
