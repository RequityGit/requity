"use client";

import { useRouter } from "next/navigation";
import {
  ArrowRight,
  FileText,
  Mail,
  ListChecks,
  TrendingUp,
  ActivityIcon,
} from "lucide-react";
import { type SearchEntityType } from "@/lib/search-utils";

interface QuickActionsProps {
  entityType: SearchEntityType;
  id: string;
  metadata: Record<string, unknown>;
  role: string;
  onClose: () => void;
}

interface QuickAction {
  label: string;
  icon: typeof ArrowRight;
  href: string;
}

function getQuickActionsForEntity(
  entityType: SearchEntityType,
  id: string,
  metadata: Record<string, unknown>,
  role: string
): QuickAction[] {
  switch (entityType) {
    case "loan":
      return [
        {
          label: "View Pipeline",
          icon: ListChecks,
          href:
            role === "borrower"
              ? "/borrower/loans"
              : "/admin/loans",
        },
        {
          label: "Open Conditions",
          icon: FileText,
          href:
            role === "borrower"
              ? `/borrower/loans/${id}`
              : `/admin/pipeline/debt/${id}`,
        },
      ];
    case "borrower":
      return [
        {
          label: "View Loans",
          icon: ListChecks,
          href: `/admin/borrowers/${id}`,
        },
      ];
    case "investor":
      return [
        {
          label: "View Commitments",
          icon: TrendingUp,
          href: `/admin/investors/${id}`,
        },
      ];
    case "crm_contact":
      return [
        {
          label: "Log Activity",
          icon: ActivityIcon,
          href: `/admin/crm/contacts/${id}`,
        },
      ];
    case "fund":
      return [
        {
          label: "View Fund Details",
          icon: ArrowRight,
          href:
            role === "investor"
              ? `/investor/funds/${id}`
              : `/admin/funds/${id}`,
        },
      ];
    default:
      return [];
  }
}

export function QuickActions({
  entityType,
  id,
  metadata,
  role,
  onClose,
}: QuickActionsProps) {
  const router = useRouter();
  const actions = getQuickActionsForEntity(entityType, id, metadata, role);

  if (actions.length === 0) return null;

  return (
    <div className="border-t border-border px-4 py-2">
      <h4 className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
        Quick Actions
      </h4>
      <div className="flex items-center gap-1">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                router.push(action.href);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
            >
              <Icon className="h-3 w-3" />
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
