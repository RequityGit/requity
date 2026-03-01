"use client";

import { useViewAs } from "@/contexts/view-as-context";
import { Eye, X } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  investor: "Investor",
  borrower: "Borrower",
};

export function ViewAsBanner() {
  const { isViewingAs, viewAsRole, exitViewAs } = useViewAs();

  if (!isViewingAs || !viewAsRole) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-amber-800">
        <Eye className="h-4 w-4" />
        <span>
          Viewing as: <span className="font-semibold">{roleLabels[viewAsRole] ?? viewAsRole}</span>
        </span>
      </div>
      <button
        onClick={exitViewAs}
        className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium transition-colors"
      >
        <X className="h-3.5 w-3.5" />
        Exit
      </button>
    </div>
  );
}
