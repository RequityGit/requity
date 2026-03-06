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
import { Badge } from "@/components/ui/badge";
import {
  Check,
  ChevronsUpDown,
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
  { label: string; icon: React.ElementType; badgeClass: string }
> = {
  super_admin: {
    label: "Super Admin",
    icon: Crown,
    badgeClass: "bg-muted text-foreground hover:bg-muted/80 border-border",
  },
  admin: {
    label: "Admin",
    icon: Shield,
    badgeClass: "bg-muted text-foreground hover:bg-muted/80",
  },
  investor: {
    label: "Investor",
    icon: Landmark,
    badgeClass: "bg-muted text-foreground hover:bg-muted/80",
  },
  borrower: {
    label: "Borrower",
    icon: Building2,
    badgeClass: "bg-muted text-foreground hover:bg-muted/80",
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
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50"
            disabled={switching}
          >
            <Badge variant="outline" className={`${current.badgeClass} cursor-pointer`}>
              <span className="flex items-center gap-1.5">
                <CurrentIcon className="h-3.5 w-3.5" />
                {current.label}
                <ChevronsUpDown className="h-3 w-3 opacity-60" />
              </span>
            </Badge>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              View portal as
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

  // Non-super-admin with single role: static badge
  if (!canSwitch) {
    return (
      <Badge variant="outline" className={current.badgeClass}>
        {current.label}
      </Badge>
    );
  }

  // Non-super-admin with multiple roles: existing role-switch dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium transition-colors focus:outline-none disabled:opacity-50"
          disabled={switching}
        >
          <Badge variant="outline" className={`${current.badgeClass} cursor-pointer`}>
            <span className="flex items-center gap-1.5">
              {current.label}
              <ChevronsUpDown className="h-3 w-3 opacity-60" />
            </span>
          </Badge>
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
