"use client";

import { cn } from "@/lib/utils";

const ROLE_STYLES: Record<string, string> = {
  super_admin: "bg-red-100 text-red-800 border-red-200",
  admin: "bg-blue-100 text-blue-800 border-blue-200",
  investor: "bg-green-100 text-green-800 border-green-200",
  borrower: "bg-orange-100 text-orange-800 border-orange-200",
};

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  investor: "Investor",
  borrower: "Borrower",
};

interface RoleBadgeProps {
  role: string;
  inactive?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function RoleBadge({ role, inactive, onRemove, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium",
        ROLE_STYLES[role] || "bg-gray-100 text-gray-800 border-gray-200",
        inactive && "opacity-50 line-through",
        className
      )}
    >
      {ROLE_LABELS[role] || role}
      {onRemove && !inactive && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 rounded-full hover:bg-black/10 p-0.5 -mr-1"
          title={`Revoke ${ROLE_LABELS[role] || role}`}
        >
          <svg
            className="h-3 w-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
