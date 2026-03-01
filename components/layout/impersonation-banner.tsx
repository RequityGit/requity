"use client";

import { useImpersonation } from "./impersonation-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

export function ImpersonationBanner() {
  const {
    isImpersonating,
    targetUserName,
    targetUserEmail,
    targetRole,
    stopImpersonation,
  } = useImpersonation();

  if (!isImpersonating) return null;

  const roleLabel =
    targetRole === "admin"
      ? "Admin"
      : targetRole === "investor"
        ? "Investor"
        : targetRole === "borrower"
          ? "Borrower"
          : targetRole ?? "Unknown";

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-4 bg-amber-500 px-4 py-2 text-amber-950 shadow-sm">
      <div className="flex items-center gap-3 min-w-0">
        <Eye className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium truncate">
          Viewing as:{" "}
          <span className="font-semibold">{targetUserName}</span>
          {targetUserEmail && (
            <span className="hidden sm:inline text-amber-800">
              {" "}
              ({targetUserEmail})
            </span>
          )}
        </span>
        <Badge
          variant="outline"
          className="border-amber-700 text-amber-900 bg-amber-400/50 text-xs"
        >
          {roleLabel}
        </Badge>
        <Badge
          variant="outline"
          className="border-amber-700 text-amber-900 bg-amber-400/50 text-xs"
        >
          Read-only
        </Badge>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={stopImpersonation}
        className="flex-shrink-0 gap-1.5 text-amber-900 hover:text-amber-950 hover:bg-amber-400/50"
      >
        <X className="h-3.5 w-3.5" />
        Exit
      </Button>
    </div>
  );
}
