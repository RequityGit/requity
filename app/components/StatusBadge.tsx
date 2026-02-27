import type { DocRequirementStatus, LoanStatus } from "~/types/database";

type StatusType = LoanStatus | DocRequirementStatus | string;

const statusColors: Record<string, string> = {
  // Loan statuses
  "Application Received": "bg-blue-50 text-blue-700 border-blue-200",
  Processing: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Underwriting: "bg-purple-50 text-purple-700 border-purple-200",
  Approved: "bg-green-50 text-green-700 border-green-200",
  Closing: "bg-orange-50 text-orange-700 border-orange-200",
  Funded: "bg-emerald-50 text-emerald-700 border-emerald-200",
  // Document statuses
  "Pending Upload": "bg-slate-50 text-slate-600 border-slate-200",
  Uploaded: "bg-blue-50 text-blue-700 border-blue-200",
  "Under Review": "bg-yellow-50 text-yellow-700 border-yellow-200",
  "Needs Revision": "bg-red-50 text-red-700 border-red-200",
};

export default function StatusBadge({ status }: { status: StatusType }) {
  const colors = statusColors[status] || "bg-slate-50 text-slate-600 border-slate-200";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors}`}
    >
      {status}
    </span>
  );
}
