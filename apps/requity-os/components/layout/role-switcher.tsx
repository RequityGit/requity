"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Check,
  Shield,
  Landmark,
  Building2,
  Eye,
  Crown,
} from "lucide-react";
import { useViewAs } from "@/contexts/view-as-context";

type Role = "super_admin" | "admin" | "investor" | "borrower";

interface RoleSwitcherProps {
  activeRole: string;
  allowedRoles: string[];
  isSuperAdmin?: boolean;
  onViewAsUser?: () => void;
}

const roleConfig: Record<
  Role,
  { label: string; icon: React.ElementType }
> = {
  super_admin: {
    label: "Super Admin",
    icon: Crown,
  },
  admin: {
    label: "Admin",
    icon: Shield,
  },
  investor: {
    label: "Investor",
    icon: Landmark,
  },
  borrower: {
    label: "Borrower",
    icon: Building2,
  },
};

const viewAsRoles: { role: "admin" | "investor" | "borrower"; label: string; icon: React.ElementType }[] = [
  { role: "admin", label: "Admin", icon: Shield },
  { role: "investor", label: "Investor", icon: Landmark },
  { role: "borrower", label: "Borrower", icon: Building2 },
];

export function RoleSwitcher({ activeRole, allowedRoles, onViewAsUser }: RoleSwitcherProps) {
  const router = useRouter();
  const [switching, setSwitching] = useState(false);
  const { isSuperAdmin, viewAsRole, setViewAsRole, isViewingAs, exitViewAs } =
    useViewAs();

  // Determine the display role
  const displayRole: Role = isViewingAs && viewAsRole
    ? viewAsRole
    : isSuperAdmin
      ? "super_admin"
      : (activeRole as Role);

  const current = roleConfig[displayRole] ?? roleConfig.admin;
  const canSwitch = allowedRoles.length > 1;

  async function handleSwitch(newRole: string) {
    if (newRole === activeRole || switching) return;

    setSwitching(true);
    try {
      const res = await fetch("/api/switch-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const { redirect } = await res.json();
        router.push(redirect);
        router.refresh();
      }
    } finally {
      setSwitching(false);
    }
  }

  function handleViewAs(role: "admin" | "investor" | "borrower") {
    setViewAsRole(role);
  }

  // Super admin: always show dropdown with view-as options
  if (isSuperAdmin) {
    const CurrentIcon = current.icon;
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="flex items-center justify-center h-9 w-9 rounded-md border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none disabled:opacity-50"
            disabled={switching}
            aria-label={`Viewing as ${current.label}`}
          >
            <CurrentIcon className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              Viewing as {current.label}
            </span>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => exitViewAs()}
            className="cursor-pointer flex items-center justify-between"
          >
            <span className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Super Admin
            </span>
            {!isViewingAs && <Check className="h-4 w-4 text-green-600" />}
          </DropdownMenuItem>
          {viewAsRoles.map(({ role, label, icon: Icon }) => {
            const isActive = isViewingAs && viewAsRole === role;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleViewAs(role)}
                className="cursor-pointer flex items-center justify-between"
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </span>
                {isActive && <Check className="h-4 w-4 text-green-600" />}
              </DropdownMenuItem>
            );
          })}
          {onViewAsUser && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onViewAsUser}
                className="cursor-pointer flex items-center gap-2 text-amber-700"
              >
                <Eye className="h-4 w-4" />
                View as specific user...
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (!canSwitch) {
    const CurrentIcon = current.icon;
    return (
      <button
        className="flex items-center justify-center h-9 w-9 rounded-md border border-border bg-muted/50 text-muted-foreground cursor-default"
        aria-label={current.label}
      >
        <CurrentIcon className="h-4 w-4" />
      </button>
    );
  }

  const CurrentIcon = current.icon;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center justify-center h-9 w-9 rounded-md border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus:outline-none disabled:opacity-50"
          disabled={switching}
          aria-label={`Viewing as ${current.label}`}
        >
          <CurrentIcon className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel className="text-xs text-muted-foreground">
          Switch view
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(["admin", "investor", "borrower"] as Role[])
          .filter((r) => allowedRoles.includes(r))
          .map((role) => {
            const config = roleConfig[role];
            const Icon = config.icon;
            const isActive = role === activeRole;
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleSwitch(role)}
                className="cursor-pointer flex items-center justify-between"
                disabled={switching}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {config.label}
                </span>
                {isActive && <Check className="h-4 w-4 text-green-600" />}
              </DropdownMenuItem>
            );
          })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
